import { useEffect } from 'react';
import {QShape} from './SelectQuery';
import {Shape} from '../shapes/Shape';
const queryContext = new Map<string,QShape<any,any,any>>();
export function useQueryContext(name:string,initialData:any) {
    useEffect(() => {
        queryContext.set(name, initialData);
    },[initialData,name]);
}

export function getQueryContext<T extends Shape>(name:string):QShape<T> {
    if (!queryContext.has(name)) {
        //TODO:should return something here so that the query still works and returns default values
        // like NullQueryShape or similar
        return null;
    }
    return queryContext.get(name);
}