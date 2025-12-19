import {expect, it} from '@jest/globals';
// import {literalProperty} from '../shapes/SHACL.js';

// let foaf = createNameSpace('http://xmlns.com/foaf/0.1/');
//
// //these were needed to get react components to work with the testing environment. Maybe one of them can go?
// Buffer && true;
// globalThis.IS_REACT_ACT_ENVIRONMENT = true;
//
// export var FoafPerson: NamedNode = foaf('Person');
// export var name: NamedNode = foaf('name');
// export var depiction: NamedNode = foaf('depiction');
// export var knows: NamedNode = foaf('knows');
//
// @linkedShape
// export class Person extends Shape {
//   static targetClass: NamedNode = FoafPerson;
//
//   @literalProperty({
//     path: name,
//     required: true,
//     maxCount: 1,
//   })
//   get name() {
//     return this.getValue(name);
//   }
//
//   set name(val: string) {
//     this.overwrite(name, new Literal(val));
//   }
//
//   @literalProperty({
//     path: depiction,
//     maxCount: 1,
//   })
//   get depiction() {
//     return this.getValue(depiction);
//   }
//
//   set depiction(val: string) {
//     this.overwrite(depiction, new Literal(val));
//   }
//
//   @literalProperty({
//     path: knows,
//     shape: Person,
//   })
//   get knows() {
//     return this.getAll(knows);
//   }
// }
//
// export const Grid = linkedSetComponent(
//   Shape,
//   ({sources, children, ChildComponent}) => {
//     return (
//       <div>
//         {ChildComponent
//           ? sources.map((source) => {
//               return (
//                 <ChildComponent of={source} key={source.node.toString()} />
//               );
//             })
//           : children}
//       </div>
//     );
//   },
// );
//
// export const Card = linkedComponent<Person, {}>(
//   Person.request((person) => ({
//     name: person.name,
//     depiction: person.depiction,
//   })),
//   ({source, linkedData: {name, depiction}}) => {
//     return (
//       <div>
//         <span>{name}</span>
//         {/*<span> {depiction}</span>*/}
//       </div>
//     );
//   },
// );
//
// export const PersonOverview = linkedSetComponent<Person>(
//   Person.requestForEachInSet((person) => () => Card.of(person)),
//   ({sources, getLinkedData}) => {
//     return (
//       <div>
//         {sources.map((source) => {
//           let Profile = getLinkedData(source) as any;
//           return (
//             <div key={source.toString()}>
//               <Profile />
//             </div>
//           );
//         })}
//       </div>
//     );
//   },
// );
//
// export const PersonOverviewWithConfigurableChildren = linkedSetComponent(
//   Person,
//   ({sources, children, ChildComponent}) => {
//     return (
//       <div>
//         {ChildComponent
//           ? sources.map((source) => {
//               return (
//                 <ChildComponent of={source} key={source.node.toString()} />
//               );
//             })
//           : children}
//       </div>
//     );
//   },
// );
//
// export const PersonOverviewFixedGrid = linkedSetComponent<Person>(
//   Person.requestSet((persons) => ({
//     PersonGrid: () => Grid.of(persons, Card),
//   })),
//   ({linkedData: {PersonGrid}}) => {
//     return (
//       <div>
//         <PersonGrid />
//       </div>
//     );
//   },
// );
//
// export const PersonOverviewWithChildRenderFn = linkedSetComponent<Person>(
//   Person.requestSet((persons) => ({
//     PersonGrid: () =>
//       Grid.of(persons, (person) => ({Profile: () => Card.of(person)})),
//   })),
//   ({linkedData: {PersonGrid}}) => {
//     return (
//       <div>
//         <PersonGrid>
//           {({linkedData: {Profile}, ...props}) => {
//             //with this setup we can choose to customise our child render function, add tags/props etc.
//             return <Profile {...props} />;
//           }}
//         </PersonGrid>
//       </div>
//     );
//   },
// );
//
// export const PersonNetwork = linkedComponent<Person>(
//   Person.request((person) => ({
//     Card: () => Card.of(person),
//     Friends: () => PersonOverview.of(person.knows),
//   })),
//   (props) => {
//     let {Card, Friends} = props.linkedData;
//     return (
//       <div>
//         <Card />
//         <p> knows </p>
//         <Friends />
//       </div>
//     );
//   },
// );
//
// let container = null;
// let root;
// beforeEach(() => {
//   // setup a DOM element as a render target
//   // container = document.createElement('div');
//   // root = createRoot(container);
//   // document.body.appendChild(container);
//   container = document.createElement('div');
//   document.body.appendChild(container);
// });
//
// afterEach(() => {
//   // cleanup on exiting
//   // unmountComponentAtNode(container);
//   // root.unmount(container);
//   // container.remove();
//   // container = null;
//   document.body.removeChild(container);
//   container = null;
// });
//
// let person = new Person();
// let person2 = new Person();
// let person3 = new Person();
// person.knows.add(person2.node);
// person.knows.add(person3.node);
// person.name = 'Rene';
// person2.name = 'Carlen';
// person3.name = 'Diggy';
// person.depiction = 'pic';
// person2.depiction = 'pic2';
// person3.depiction = 'pic3';
//
// describe('component tests', () => {
//   it('renders a SetComponent with controlled children by using Shape.requestForEachInSet()', async () => {
//     await act(async () => {
//       root = createRoot(container).render(<PersonNetwork of={person} />);
//     });
//     expect(container.textContent).toBe(
//       `${person.name} knows ${person2.name + person3.name}`,
//     );
//   });
//   it('renders a SetComponent with controlled children using < SetComponent of={.. } />', async () => {
//     await act(async () => {
//       root = createRoot(container).render(<PersonOverview of={person.knows} />);
//     });
//     expect(container.textContent).toBe(person2.name + person3.name);
//   });
//   it('renders a SetComponent with configurable children using < SetComponent as={.. } />', async () => {
//     await act(async () => {
//       root = createRoot(container).render(
//         <PersonOverviewWithConfigurableChildren of={person.knows} as={Card} />,
//       );
//     });
//     expect(container.textContent).toBe(person2.name + person3.name);
//   });
//   it('renders a SetComponent that passes on its sources to another SetComponent using Shape.requestSet() with SetComponent.of(source,ChildComponent)', async () => {
//     await act(async () => {
//       root = createRoot(container).render(
//         <PersonOverviewFixedGrid of={person.knows} />,
//       );
//     });
//     expect(container.textContent).toBe(person2.name + person3.name);
//   });
//   it('renders a SetComponent that passes on its sources to another SetComponent using Shape.requestSet() with a child render function', async () => {
//     await act(async () => {
//       root = createRoot(container).render(
//         <PersonOverviewWithChildRenderFn of={person.knows} />,
//       );
//     });
//     expect(container.textContent).toBe(person2.name + person3.name);
//   });
// });

//
// it('renders a SetComponent with controlled children by using Shape.requestForEachInSet()',async () => {
//   await act(async () => {
//     root = createRoot(container).render(<PersonNetwork of={person} />);
//   });
//   expect(container.textContent).toBe(`${person.name} knows ${person2.name+person3.name}`);
// });
// it("renders a SetComponent with controlled children using < SetComponent of={.. } />",async () => {
//   await act(async () => {
//     root = createRoot(container).render(<PersonOverview of={person.knows} />);
//   });
//   expect(container.textContent).toBe(person2.name+person3.name);
// });
// it("renders a SetComponent with configurable children using < SetComponent as={.. } />",async () => {
//   await act(async () => {
//     root = createRoot(container).render(<PersonOverviewWithConfigurableChildren of={person.knows} as={Card} />);
//   });
//   expect(container.textContent).toBe(person2.name+person3.name);
// });
// it("renders a SetComponent that passes on its sources to another SetComponent using Shape.requestSet() with SetComponent.of(source,ChildComponent)",async () => {
//   await act(async () => {
//     root = createRoot(container).render(<PersonOverviewFixedGrid of={person.knows} />);
//   });
//   expect(container.textContent).toBe(person2.name+person3.name);
// });
// it("renders a SetComponent that passes on its sources to another SetComponent using Shape.requestSet() with a child render function",async () => {
//   await act(async () => {
//     root = createRoot(container).render(<PersonOverviewWithChildRenderFn of={person.knows} />);
//   });
//   expect(container.textContent).toBe(person2.name+person3.name);
// });
it('is true', () => {
  expect(true).toBe(true);
});
