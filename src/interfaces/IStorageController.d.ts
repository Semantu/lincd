import { LinkedQuery } from '../utils/LinkedQuery.js';
export interface IStorageController {
    query<ResultType = any>(query: LinkedQuery<any>): Promise<ResultType>;
}
export declare function staticImplements<T>(): <U extends T>(constructor: U) => void;
