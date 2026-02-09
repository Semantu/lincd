import {
  AndOrQueryToken,
  CustomQueryObject,
  QueryPath,
  QueryPropertyPath,
  QueryStep,
  SelectQuery,
  SizeStep,
  WhereAndOr,
  WhereEvaluationPath,
  WhereMethods,
  WherePath,
} from 'linked-js/queries/SelectQuery.js';
import type {PropertyShape} from 'linked-js/shapes/PropertyShape.js';
import type {NodeReferenceValue, NodeDescriptionValue, UpdateNodePropertyValue, UpdateValue, SetModificationValue} from 'linked-js/queries/MutationQuery.js';
import type {CreateQuery} from 'linked-js/queries/CreateQuery.js';
import type {UpdateQuery} from 'linked-js/queries/UpdateQuery.js';
import type {DeleteQuery} from 'linked-js/queries/DeleteQuery.js';
import {Graph, Literal, NamedNode, Node} from '../models.js';
import {NodeSet} from '../collections/NodeSet.js';
import {QuadSet} from '../collections/QuadSet.js';
import {rdf} from '../ontologies/rdf.js';
import {xsd} from '../ontologies/xsd.js';

export type DeleteResponse = {
  deleted: string[];
  count: number;
  failed?: string[];
  errors?: Record<string, string>;
};

const toId = (value: string | {id?: string; uri?: string}): string => {
  if (typeof value === 'string') {
    return value;
  }
  return value?.id ?? value?.uri ?? '';
};

const toPredicate = (prop: PropertyShape) => {
  const path = (prop.path as unknown as {id?: string} | string) || '';
  const id = typeof path === 'string' ? path : path?.id;
  return NamedNode.getOrCreate(id);
};

const toNodeReference = (node: NamedNode): NodeReferenceValue => ({id: node.uri});

const nodeValueToPrimitive = (node: Node, prop?: PropertyShape) => {
  if (node instanceof Literal) {
    const datatypeId = (prop?.datatype as {id?: string} | undefined)?.id;
    if (datatypeId === xsd.boolean.uri) {
      return node.value === 'true';
    }
    if (datatypeId === xsd.integer.uri || datatypeId === xsd.decimal.uri || datatypeId === xsd.double.uri) {
      return Number(node.value);
    }
    if (datatypeId === xsd.date.uri || datatypeId === xsd.dateTime.uri) {
      return new Date(node.value);
    }
    return node.value;
  }
  if (node instanceof NamedNode) {
    return {id: node.uri};
  }
  return undefined;
};

const normalizeWhereValue = (value: unknown, prop?: PropertyShape) => {
  if (value instanceof Literal) {
    return nodeValueToPrimitive(value, prop);
  }
  if (value instanceof NamedNode) {
    return {id: value.uri};
  }
  return value;
};

const convertUpdateValue = async (
  prop: PropertyShape,
  value: UpdateValue,
  createQuery: boolean,
): Promise<{value: Node | undefined; plainValue: unknown}> => {
  if (typeof value === 'undefined') {
    return {value: undefined, plainValue: undefined};
  }
  if (value === null) {
    return {value: undefined, plainValue: undefined};
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const datatypeId = (prop.datatype as {id?: string} | undefined)?.id;
    if (datatypeId === xsd.date.uri || datatypeId === xsd.dateTime.uri) {
      const dateValue = new Date(value as any);
      return {value: new Literal(dateValue.toISOString(), xsd.dateTime), plainValue: dateValue};
    }
    return {value: new Literal(String(value), datatypeId ? NamedNode.getOrCreate(datatypeId) : undefined), plainValue: value};
  }
  if (value instanceof Date) {
    return {value: new Literal(value.toISOString(), xsd.dateTime), plainValue: value};
  }
  if (Array.isArray(value)) {
    return {value: undefined, plainValue: value};
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('id' in record || 'uri' in record) {
      const id = toId(record as {id?: string; uri?: string});
      return {value: NamedNode.getOrCreate(id), plainValue: {id}};
    }
    if ('fields' in record) {
      const result = await convertNodeDescription(record as NodeDescriptionValue, createQuery);
      return {value: result.value, plainValue: result.plainValue};
    }
  }
  return {value: undefined, plainValue: undefined};
};

const applySetModification = async (
  subject: NamedNode,
  prop: PropertyShape,
  value: SetModificationValue,
  createQuery: boolean,
  plainValues: Record<string, unknown>,
) => {
  const predicate = toPredicate(prop);
  if (value.$remove) {
    value.$remove.forEach((removeValue) => {
      const id = toId(removeValue);
      const node = NamedNode.getNamedNode(id);
      if (node) {
        subject.unset(predicate, node);
      }
    });
  }
  if (value.$add) {
    const addedValues: unknown[] = [];
    for (const addValue of value.$add) {
      const res = await convertUpdateValue(prop, addValue, createQuery);
      if (res.value) {
        subject.set(predicate, res.value);
        addedValues.push(res.plainValue);
      }
    }
    plainValues[prop.label] = createQuery ? addedValues : {updatedTo: addedValues};
  }
};

const applyFieldUpdates = async (
  fields: UpdateNodePropertyValue[],
  subject: NamedNode,
  createQuery: boolean,
): Promise<Record<string, unknown>> => {
  const plainValues: Record<string, unknown> = {};
  for (const field of fields) {
    const propShape = field.prop;
    const predicate = toPredicate(propShape);
    const value = field.val;

    if (typeof value === 'undefined') {
      subject.unsetAll(predicate);
      plainValues[propShape.label] = propShape.maxCount === 1 ? undefined : [];
      continue;
    }

    if (Array.isArray(value)) {
      const values: Node[] = [];
      const plainArray: unknown[] = [];
      for (const item of value) {
        const res = await convertUpdateValue(propShape, item, createQuery);
        if (res.value) {
          values.push(res.value);
        }
        plainArray.push(res.plainValue);
      }
      subject.moverwrite(predicate, values);
      plainValues[propShape.label] = createQuery ? plainArray : {updatedTo: plainArray};
      continue;
    }

    if (typeof value === 'object' && value && ('$add' in value || '$remove' in value)) {
      await applySetModification(subject, propShape, value as SetModificationValue, createQuery, plainValues);
      continue;
    }

    const res = await convertUpdateValue(propShape, value, createQuery);
    if (res.value) {
      subject.overwrite(predicate, res.value);
      plainValues[propShape.label] = res.plainValue;
    }
  }
  return plainValues;
};

const convertNodeDescription = async (
  description: NodeDescriptionValue,
  createQuery: boolean,
): Promise<{value: NamedNode; plainValue: Record<string, unknown>}> => {
  const id = description.__id ? description.__id : undefined;
  const subject = id ? NamedNode.getOrCreate(id) : NamedNode.create();
  if ((description.shape as any)?.targetClass?.id) {
    subject.set(
      rdf.type,
      NamedNode.getOrCreate((description.shape as any).targetClass.id),
    );
  }
  const plainValues = await applyFieldUpdates(description.fields, subject, createQuery);
  plainValues.id = subject.uri;
  return {value: subject, plainValue: plainValues};
};

const resolveWhereEvaluation = (
  subject: NamedNode,
  evaluation: WhereEvaluationPath,
): boolean => {
  const endValues = resolveQueryPathEndResults(subject, evaluation.path);
  const arg = evaluation.args[0];
  const expected =
    typeof arg === 'object' && arg && 'id' in arg ? (arg as {id: string}).id : arg;
  const lastPropertyStep = [...evaluation.path]
    .reverse()
    .find((step) => 'property' in step) as {property?: PropertyShape} | undefined;
  const prop = lastPropertyStep?.property;
  return endValues.some((value) => {
    const normalized = normalizeWhereValue(value, prop);
    if (
      normalized &&
      typeof normalized === 'object' &&
      'id' in normalized &&
      typeof (normalized as {id: string}).id === 'string'
    ) {
      return typeof expected === 'string'
        ? (normalized as {id: string}).id === expected
        : false;
    }
    return normalized === expected;
  });
};

const resolveWhereSomeEvery = (
  subject: NamedNode,
  evaluation: WhereEvaluationPath,
  method: WhereMethods.SOME | WhereMethods.EVERY,
): boolean => {
  const arg = evaluation.args[0];
  if (!arg || typeof arg !== 'object') {
    return false;
  }
  const nodes = resolveQueryPathEndResults(subject, evaluation.path).filter(
    (value) => value instanceof NamedNode,
  ) as NamedNode[];
  if (nodes.length === 0) {
    return false;
  }
  const predicate = (node: NamedNode) => resolveWhere(node, arg as WherePath);
  return method === WhereMethods.SOME
    ? nodes.some(predicate)
    : nodes.every(predicate);
};

const resolveWhere = (subject: NamedNode, where: WherePath): boolean => {
  if (!where) return true;
  if ('method' in where) {
    if (where.method === WhereMethods.EQUALS) {
      return resolveWhereEvaluation(subject, where);
    }
    if (where.method === WhereMethods.SOME || where.method === WhereMethods.EVERY) {
      return resolveWhereSomeEvery(subject, where, where.method);
    }
    return false;
  }
  const andOr = where as WhereAndOr;
  let result = resolveWhere(subject, andOr.firstPath);
  andOr.andOr.forEach((token: AndOrQueryToken) => {
    if (token.and) {
      result = result && resolveWhere(subject, token.and);
    }
    if (token.or) {
      result = result || resolveWhere(subject, token.or);
    }
  });
  return result;
};

const resolveQueryPathEndResults = (
  subject: NamedNode,
  path: QueryPropertyPath,
): Node[] => {
  let current: NodeSet<NamedNode> = new NodeSet([subject]);
  let values: Node[] = [];
  path.forEach((step, index) => {
    if (!('property' in step)) {
      return;
    }
    const predicate = toPredicate(step.property);
    const next = new NodeSet<NamedNode>();
    const isLast = index === path.length - 1;
    current.forEach((node) => {
      node.getAll(predicate).forEach((value) => {
        if (value instanceof NamedNode) {
          next.add(value);
        }
        if (isLast) {
          values.push(value);
        }
      });
    });
    current = next;
  });
  return values;
};

const resolveSizeStep = (subject: NamedNode, step: SizeStep): number => {
  const values = resolveQueryPathEndResults(subject, step.count);
  return values.length;
};

const resolvePathValues = (
  subject: NamedNode,
  path: QueryStep[],
): unknown => {
  if (path.length === 0) {
    return {id: subject.uri};
  }
  const [step, ...rest] = path;
  if ('count' in step) {
    return resolveSizeStep(subject, step);
  }
  const predicate = toPredicate(step.property);
  const values = subject.getAll(predicate);
  const filteredValues = step.where
    ? new NodeSet<NamedNode>(
        Array.from(values).filter((value) =>
          value instanceof NamedNode ? resolveWhere(value, step.where) : true,
        ) as NamedNode[],
      )
    : values;

  const results: unknown[] = [];
  filteredValues.forEach((value) => {
    if (rest.length === 0) {
      results.push(nodeValueToPrimitive(value, step.property));
    } else if (value instanceof NamedNode) {
      results.push(resolvePathValues(value, rest));
    }
  });
  if (step.property.maxCount === 1) {
    return results[0];
  }
  return results;
};

const applyQueryPath = (
  result: Record<string, unknown>,
  subject: NamedNode,
  path: QueryPath,
) => {
  if (Array.isArray(path)) {
    if (path.length === 0) return;
    if (Array.isArray(path[0])) {
      (path as QueryPath[]).forEach((subPath) => {
        applyQueryPath(result, subject, subPath);
      });
      return;
    }
    const firstStep = path[0] as QueryStep;
    if ('property' in firstStep) {
      const value = resolvePathValues(subject, path as QueryStep[]);
      result[firstStep.property.label] =
        typeof value === 'undefined' ? null : value;
    }
    return;
  }
  if (typeof path === 'object') {
    Object.entries(path as CustomQueryObject).forEach(([key, subPath]) => {
      const nested: Record<string, unknown> = {};
      applyQueryPath(nested, subject, subPath);
      result[key] = nested;
    });
  }
};

const resolveSelect = (query: SelectQuery): Record<string, unknown>[] => {
  let subjects: NamedNode[] = [];
  if (query.subject && typeof query.subject === 'object' && 'id' in query.subject) {
    const node = NamedNode.getNamedNode((query.subject as {id: string}).id);
    if (node) {
      subjects = [node];
    }
  } else if (typeof query.subject === 'string') {
    const node = NamedNode.getNamedNode(query.subject);
    if (node) {
      subjects = [node];
    }
  } else if ((query.shape as any)?.shape?.targetClass?.id) {
    const target = NamedNode.getOrCreate((query.shape as any).shape.targetClass.id);
    subjects = Array.from(NamedNode.getAllNamedNodes().values()).filter((node) =>
      node.has(rdf.type, target),
    );
  }

  const results: Record<string, unknown>[] = [];
  subjects.forEach((subject) => {
    if (query.where && !resolveWhere(subject, query.where)) {
      return;
    }
    const result: Record<string, unknown> = {id: subject.uri};
    if (Array.isArray(query.select)) {
      query.select.forEach((path) => applyQueryPath(result, subject, path));
    } else {
      applyQueryPath(result, subject, query.select);
    }
    results.push(result);
  });
  return results;
};

export async function createLocal<ResultType>(
  query: CreateQuery<ResultType>,
): Promise<ResultType> {
  const result = await convertNodeDescription(query.description, true);
  return result.plainValue as ResultType;
}

export async function updateLocal<ResultType>(
  query: UpdateQuery<ResultType>,
): Promise<ResultType> {
  const subject = NamedNode.getOrCreate(query.id);
  const plainValues = await applyFieldUpdates(query.updates.fields, subject, false);
  plainValues.id = subject.uri;
  return plainValues as ResultType;
}

export async function deleteLocal(query: DeleteQuery): Promise<DeleteResponse> {
  const response: DeleteResponse = {deleted: [], count: 0};
  const errors: Record<string, string> = {};
  const failed: string[] = [];
  query.ids.forEach((idValue) => {
    const id = toId(idValue as {id?: string; uri?: string} | string);
    const node = NamedNode.getNamedNode(id);
    if (!node) {
      failed.push(id);
      errors[id] = `No node found with id: ${id}`;
      return;
    }
    node.remove();
    response.deleted.push(id);
    response.count += 1;
  });
  if (failed.length > 0) {
    response.failed = failed;
    response.errors = errors;
  }
  return response;
}

export async function resolveLocal<ResultType>(
  query: SelectQuery,
): Promise<ResultType> {
  if (query.type !== 'select') {
    throw new Error('Invalid query type');
  }
  const results = resolveSelect(query);
  return (query.singleResult ? results[0] : results) as ResultType;
}

export function resetLocalStore() {
  NamedNode.reset();
  Graph.reset();
}
