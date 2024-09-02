import { ComponentQueryPath, CustomQueryObject, GetQueryResponseType, LinkedQuery, QueryResponseToEndValues, SelectQuery } from './LinkedQuery.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { Shape } from '../shapes/Shape.js';
/**
 * Resolves the query locally, by searching the graph in local memory, without using stores.
 * Returns the result immediately.
 * The results will be the end point reached by the query
 */
export declare function resolveLocal<ResultType>(query: SelectQuery<any>, shape: typeof Shape): ResultType;
export declare function resolveLocalEndResults<S extends LinkedQuery<any>>(query: S, subject?: ShapeSet | Shape, queryPaths?: CustomQueryObject | ComponentQueryPath[]): QueryResponseToEndValues<GetQueryResponseType<S>>;
