import React from "react";
import {LinkedFunctionalComponent} from '../interfaces/Component';
import {Shape} from '../shapes/Shape';
import {linkedComponent} from '../package';
import {Person} from 'lincd-foaf/lib/shapes/Person';
interface LinkedSetComponent<S extends Shape> extends LinkedFunctionalComponent<S> {

}
function linkedSetComponent(comp:any) {

  let wrappedFn = () => {
    return React.createElement(comp);
  } as LinkedSetComponent
}

export const Grid = linkedSetComponent(({sources,ChildComponent}) => {
  return <div>{sources.map(source => {
    <ChildComponent of={source} />
  })}</div>
})

