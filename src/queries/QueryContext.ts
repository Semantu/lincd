import { useEffect } from 'react';
const queryContext = new Map();
export function useQueryContext(name:string,initialData:any) {
    useEffect(() => {
        queryContext.set(name, initialData);
    },[initialData,name]);
}
export function getQueryContext<T>(name:string) {
    if (!queryContext.has(name)) {
        //TODO:should return something here so that the query still works and returns default values
        return null;
    }
    return queryContext.get(name) as T;
}