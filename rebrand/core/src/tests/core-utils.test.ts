import {describe, expect, test, jest, beforeEach} from '@jest/globals';
import {linkedPackage} from '../utils/Package';
import {Shape} from '../shapes/Shape';
import {literalProperty, objectProperty} from '../shapes/SHACL';
import {CoreSet} from '../collections/CoreSet';
import {
  getLeastSpecificShapeClasses,
  getMostSpecificSubShapes,
  getPropertyShapeByLabel,
  getShapeClass,
  getSubShapesClasses,
  getSuperShapesClasses,
} from '../utils/ShapeClass';
import {LinkedStorage} from '../utils/LinkedStorage';
import {QueryParser} from '../queries/QueryParser';
import {isWhereEvaluationPath} from '../queries/SelectQuery';
import {getQueryContext, setQueryContext} from '../queries/QueryContext';
import {NodeReferenceValue} from '../utils/NodeReference';

const makeProp = (base: string) => (suffix: string): NodeReferenceValue => ({
  id: `${base}${suffix}`,
});

const shapeProp = makeProp('linked://tmp/shapeclass/');
const contextProp = makeProp('linked://tmp/context/');
const packageProp = makeProp('linked://tmp/package/');

const {linkedShape: linkedShapeClassTest} = linkedPackage('shapeclass-test');
const {linkedShape: linkedShapeContextTest} = linkedPackage('context-test');
const {
  linkedShape: linkedShapePackageTest,
  registerPackageExport,
  registerPackageModule,
  packageExports,
  getPackageShape,
} = linkedPackage('package-test');

@linkedShapeClassTest
class BaseShape extends Shape {
  @literalProperty({path: shapeProp('base')})
  get base(): string {
    return '';
  }
}

@linkedShapeClassTest
class SubShape extends BaseShape {
  @literalProperty({path: shapeProp('sub')})
  get sub(): string {
    return '';
  }
}

@linkedShapeClassTest
class DeepSubShape extends SubShape {
  @literalProperty({path: shapeProp('deep')})
  get deep(): string {
    return '';
  }
}

@linkedShapeClassTest
class SiblingSubShape extends BaseShape {
  @literalProperty({path: shapeProp('sibling')})
  get sibling(): string {
    return '';
  }
}

@linkedShapeContextTest
class ContextPerson extends Shape {
  @literalProperty({path: contextProp('name'), maxCount: 1})
  get name(): string {
    return '';
  }

  @objectProperty({path: contextProp('bestFriend'), maxCount: 1, shape: ContextPerson})
  get bestFriend(): ContextPerson {
    return null;
  }
}

@linkedShapePackageTest
class PackagePerson extends Shape {
  @literalProperty({path: packageProp('name'), maxCount: 1})
  get name(): string {
    return '';
  }
}

const resetLinkedStorage = () => {
  LinkedStorage.setDefaultStore(null as any);
  LinkedStorage.getShapeToStoreMap().clear();
};

describe('ShapeClass utilities', () => {
  test('getShapeClass resolves a class by node shape id', () => {
    expect(getShapeClass(BaseShape.shape.id)).toBe(BaseShape);
  });

  test('getSubShapesClasses returns subclasses', () => {
    const subs = getSubShapesClasses(BaseShape);
    expect(subs).toEqual(
      expect.arrayContaining([SubShape, DeepSubShape, SiblingSubShape]),
    );
  });

  test('getSuperShapesClasses returns superclasses (most specific first)', () => {
    const supers = getSuperShapesClasses(DeepSubShape);
    expect(supers[0]).toBe(SubShape);
    expect(supers).toEqual(expect.arrayContaining([BaseShape, Shape]));
  });

  test('getPropertyShapeByLabel walks inheritance chain', () => {
    const property = getPropertyShapeByLabel(DeepSubShape, 'base');
    expect(property).toBeDefined();
    expect(property?.parentNodeShape).toBe(BaseShape.shape);
  });

  test('getMostSpecificSubShapes returns only leaves', () => {
    const mostSpecific = getMostSpecificSubShapes(BaseShape);
    expect(mostSpecific).toEqual(
      expect.arrayContaining([DeepSubShape, SiblingSubShape]),
    );
    expect(mostSpecific).not.toEqual(expect.arrayContaining([SubShape]));
  });

  test('getLeastSpecificShapeClasses filters to base shapes', () => {
    const shapes = new CoreSet([new SubShape(), new SiblingSubShape(), new BaseShape()]);
    const leastSpecific = getLeastSpecificShapeClasses(shapes);
    expect(leastSpecific).toEqual(expect.arrayContaining([BaseShape]));
    expect(leastSpecific).not.toEqual(
      expect.arrayContaining([SubShape, SiblingSubShape]),
    );
  });
});

describe('LinkedStorage extra behaviors', () => {
  beforeEach(() => resetLinkedStorage());

  test('setDefaultStore calls init when provided', () => {
    const init = jest.fn();
    LinkedStorage.setDefaultStore({init} as any);
    expect(init).toHaveBeenCalled();
  });

  test('getStores returns default and shape-specific stores', () => {
    const defaultStore = {selectQuery: jest.fn()} as any;
    const shapeStore = {selectQuery: jest.fn()} as any;
    LinkedStorage.setDefaultStore(defaultStore);
    LinkedStorage.setStoreForShapes(shapeStore, BaseShape);
    const stores = LinkedStorage.getStores();
    expect(stores.has(defaultStore)).toBe(true);
    expect(stores.has(shapeStore)).toBe(true);
  });

  test('getStoreForShapeClass falls back to superclass mapping', () => {
    const baseStore = {selectQuery: jest.fn()} as any;
    LinkedStorage.setStoreForShapes(baseStore, BaseShape);
    expect(LinkedStorage.getStoreForShapeClass(SubShape)).toBe(baseStore);
  });

  test('selectQuery rejects when no store is configured', async () => {
    await expect(
      LinkedStorage.selectQuery({shape: null} as any),
    ).rejects.toThrow('No query store configured');
  });
});

describe('QueryParser delegation', () => {
  beforeEach(() => resetLinkedStorage());

  test('selectQuery delegates to LinkedStorage', async () => {
    const store = {
      selectQuery: jest.fn(async () => [{id: 'r1'}]),
    } as any;
    LinkedStorage.setDefaultStore(store);

    const queryFactory = ContextPerson.query((p) => p.name);
    const result = await QueryParser.selectQuery(queryFactory);

    expect(store.selectQuery).toHaveBeenCalledTimes(1);
    expect(store.selectQuery.mock.calls[0][0]?.type).toBe('select');
    expect(result).toEqual([{id: 'r1'}]);
  });

  test('update/create/delete delegate to LinkedStorage', async () => {
    const store = {
      updateQuery: jest.fn(async () => ({id: 'u1'})),
      createQuery: jest.fn(async () => ({id: 'c1'})),
      deleteQuery: jest.fn(async () => ({deleted: [], count: 0})),
    } as any;
    LinkedStorage.setDefaultStore(store);

    const updateResult = await QueryParser.updateQuery(
      'u1',
      {name: 'Ada'} as any,
      ContextPerson,
    );
    const createResult = await QueryParser.createQuery(
      {name: 'Tess'} as any,
      ContextPerson,
    );
    const deleteResult = await QueryParser.deleteQuery('d1', ContextPerson);

    expect(store.updateQuery.mock.calls[0][0]?.type).toBe('update');
    expect(store.createQuery.mock.calls[0][0]?.type).toBe('create');
    expect(store.deleteQuery.mock.calls[0][0]?.type).toBe('delete');
    expect(updateResult).toEqual({id: 'u1'});
    expect(createResult).toEqual({id: 'c1'});
    expect(deleteResult).toEqual({deleted: [], count: 0});
  });
});

describe('QueryContext edge cases', () => {
  test('getQueryContext returns null for unknown names', () => {
    expect(getQueryContext('missing-context')).toBeNull();
  });

  test('setQueryContext warns and ignores invalid values', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    setQueryContext('invalid-context', {foo: 'bar'} as any);
    expect(getQueryContext('invalid-context')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('setQueryContext warns when QResult provided without shapeType', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    setQueryContext('missing-shape', {id: 'ctx-1'} as any);
    expect(getQueryContext('missing-shape')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('setQueryContext accepts QResult with shapeType and uses latest value', () => {
    setQueryContext('ctx', {id: 'ctx-1'} as any, ContextPerson);
    setQueryContext('ctx', {id: 'ctx-2'} as any, ContextPerson);
    const context = getQueryContext('ctx');
    expect(context.id).toBe('ctx-2');

    const query = ContextPerson.query((p) => p.name).where((p) =>
      p.bestFriend.equals(context),
    );
    const queryObject = query.getQueryObject();
    const where = queryObject?.where;
    expect(where).toBeDefined();
    if (!where) {
      throw new Error('Expected where clause');
    }
    const evaluation = isWhereEvaluationPath(where) ? where : where.firstPath;
    if (!isWhereEvaluationPath(evaluation)) {
      throw new Error('Expected evaluation where clause');
    }
    expect(evaluation.args[0]).toEqual({
      id: 'ctx-2',
      shape: {id: ContextPerson.shape.id},
    });
  });
});

describe('Package registration helpers', () => {
  test('getPackageShape returns a shape class by name', () => {
    expect(getPackageShape(PackagePerson.name)).toBe(PackagePerson);
  });

  test('registerPackageExport adds items to packageExports', () => {
    function Helper() {}
    registerPackageExport(Helper);
    expect(packageExports.Helper).toBe(Helper);
  });

  test('registerPackageModule sets names and registers exports', () => {
    const unnamed = {name: '', original: {name: ''}};
    const wrapped = {name: '_wrappedComponent', original: {name: ''}};
    const moduleRef = {exports: {Unnamed: unnamed, Wrapped: wrapped}};

    registerPackageModule(moduleRef);

    expect(moduleRef.exports.Unnamed.name).toBe('Unnamed');
    expect(moduleRef.exports.Wrapped.name).toBe('Wrapped');
    expect(moduleRef.exports.Wrapped.original.name).toBe('Wrapped_implementation');
    expect(packageExports.Unnamed).toBe(moduleRef.exports.Unnamed);
    expect(packageExports.Wrapped).toBe(moduleRef.exports.Wrapped);
  });
});
