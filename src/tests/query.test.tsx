import {describe, test} from '@jest/globals';
import {Literal, NamedNode} from '../models';
import {Shape} from '../shapes/Shape';
import {literalProperty, objectProperty} from '../utils/ShapeDecorators';
import {linkedComponent, linkedSetComponent, linkedShape} from '../package';
import renderer from 'react-test-renderer';
import React from 'react';
import {Storage} from '../utils/Storage';
import {TestStore} from './storage.test';
import {QuadSet} from '../collections/QuadSet';
import {ShapeSet} from '../collections/ShapeSet';
import {resolveLocal, resolveLocalFlat} from '../utils/LocalQueryResolver';

let personClass = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'Person');
let name = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'name');
let bestFriend = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'bestFriend');
let hobby = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'hobby');
let hasFriend = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'hasFriend');

//required for testing automatic data loading in linked components
const store = new TestStore();
Storage.setDefaultStore(store);

@linkedShape
class Person extends Shape {
  static targetClass = personClass;

  @literalProperty({
    path: name,
    maxCount: 1,
  })
  get name(): string {
    return this.getValue(name);
  }

  set name(val: string) {
    this.overwrite(name, new Literal(val));
  }

  @literalProperty({
    path: bestFriend,
    maxCount: 1,
  })
  get bestFriend(): Person {
    return this.getOneAs(bestFriend, Person);
  }

  set bestFriend(val: Person) {
    this.overwrite(bestFriend, val.namedNode);
  }

  @literalProperty({
    path: hobby,
    maxCount: 1,
  })
  get hobby(): string {
    return this.getValue(hobby);
  }

  set hobby(val: string) {
    this.overwrite(hobby, new Literal(val));
  }

  @objectProperty({
    path: hasFriend,
    shape: Person,
  })
  get friends() {
    return this.getAllAs<Person>(hasFriend, Person);
  }
}

let p1 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p1-semmy');
p1.name = 'Semmy';

let p2 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p2-moa');
p2.name = 'Moa';
p2.hobby = 'Jogging';

let p3 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p3-jinx');
p3.name = 'Jinx';

let p4 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p4-quinn');
p4.name = 'Quinn';

p1.friends.add(p2);
p1.friends.add(p3);
p2.bestFriend = p3;

p2.friends.add(p3);
p2.friends.add(p4);

Storage.setQuadsLoaded(
  new QuadSet(
    p1
      .getAllQuads()
      .concat(p2.getAllQuads(), p3.getAllQuads(), p4.getAllQuads()),
  ),
);

describe('query tests', () => {
  // test('can select a property of all instances', () => {
  //   let names = resolveLocal(
  //     Person.select((p) => {
  //       return p.name;
  //     }),
  //   );
  //
  //   expect(Array.isArray(names)).toBe(true);
  //   expect(names.length).toBe(4);
  //   expect(names.includes('Moa')).toBe(true);
  //   expect(names.includes('Mike')).toBe(false);
  // });

  test('can select sub properties of a first property that returns a set', () => {
    let q = Person.select((p) => {
      return p.friends.friends;
    });
    // QueryShapeSet<Person, Person> & ToQueryShapeSetValue<ShapeValuesSet<Person>, Person>>
    // QueryShapeSet<Person, QueryShapeSet<Person, Person>> &
    //  ToQueryShapeSetValue<QueryShapeSet<Person, QueryShapeSet<Person, Person>>, Person, null>>
    let namesOfFriends = resolveLocal(q);
    expect(Array.isArray(namesOfFriends)).toBe(true);
    expect(namesOfFriends.length).toBe(4);
    expect(namesOfFriends[0].length).toBe(2);
    expect(namesOfFriends[0].includes('Jinx')).toBe(true);
    expect(namesOfFriends[0].includes('Moa')).toBe(true);
    expect(namesOfFriends[3].length).toBe(0);
  });

  // test('can select sub properties of a first property that returns a set - FLAT result', () => {
  //   let q = Person.select((p) => {
  //     return p.friends.name;
  //   });
  //   let namesOfFriends = resolveLocalFlat(q);
  //   expect(Array.isArray(namesOfFriends)).toBe(true);
  //   expect(namesOfFriends.length).toBe(3);
  //   expect(namesOfFriends.includes('Jinx')).toBe(true);
  //   expect(namesOfFriends.includes('Semmy')).toBe(false);
  // });

  test('can select multiple property paths', () => {
    let q = Person.select((p) => {
      return [p.name, p.friends];
    });
    let result = resolveLocal(q);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    let [names, namesOfFriends] = result;
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(4);
    expect(names.includes('Moa')).toBe(true);
    expect(names.includes('Mike')).toBe(false);
    expect(Array.isArray(namesOfFriends)).toBe(true);
    expect(namesOfFriends.length).toBe(3);
    expect(namesOfFriends.includes('Semmy')).toBe(false);
    expect(namesOfFriends.includes('Moa')).toBe(true);
  });

  // test('can select nested paths', () => {
  //   //we select the friends of all persons, but only those friends whose name is moa
  //   //this will return an array, where each entry represents the results for a single person.
  //   // the entry contains those friends of the person whose name is Moa - (as a set of persons)
  //   let level2Friends = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.friends;
  //     }),
  //   );
  //
  //   let level3Friends = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.friends.friends;
  //     }),
  //   );
  //
  //   expect(level2Friends instanceof ShapeSet).toBe(true);
  //   expect(level2Friends.size).toBe(2);
  //   expect(level2Friends.some((f) => f.namedNode === p3.namedNode)).toBe(true);
  //   expect(level2Friends.some((f) => f.namedNode === p4.namedNode)).toBe(true);
  //
  //   expect(level3Friends instanceof ShapeSet).toBe(true);
  //   expect(level3Friends.size).toBe(0);
  // });
  // // ### WHERE TESTS
  //
  // test('can use where() to filter a string in a set of Literals with equals', () => {
  //   //we select the friends of all persons, but only those friends whose name is moa
  //   //this will return an array, where each entry represents the results for a single person.
  //   // the entry contains those friends of the person whose name is Moa - (as a set of persons)
  //   let friendsCalledMoa = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.where((f) => f.name.equals('Moa'));
  //     }),
  //   );
  //
  //   expect(friendsCalledMoa instanceof ShapeSet).toBe(true);
  //   expect(friendsCalledMoa.size).toBe(1);
  //   expect(friendsCalledMoa.first().namedNode).toBe(p2.namedNode);
  // });
  //
  // test('where and', () => {
  //   //we select the friends of all persons, but only those friends whose name is moa
  //   //this will return an array, where each entry represents the results for a single person.
  //   // the entry contains those friends of the person whose name is Moa - (as a set of persons)
  //   let friendsCalledMoaThatJog = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.where((f) =>
  //         f.name.equals('Moa').and(f.hobby.equals('Jogging')),
  //       );
  //     }),
  //   );
  //
  //   expect(friendsCalledMoaThatJog instanceof ShapeSet).toBe(true);
  //   expect(friendsCalledMoaThatJog.size).toBe(1);
  //   expect(friendsCalledMoaThatJog.first().namedNode).toBe(p2.namedNode);
  // });
  // test('where or', () => {
  //   //we select the friends of all persons, but only those friends whose name is moa
  //   //this will return an array, where each entry represents the results for a single person.
  //   // the entry contains those friends of the person whose name is Moa - (as a set of persons)
  //   let friendsCalledMoaThatJog = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.where((f) =>
  //         f.name.equals('Jinx').or(f.hobby.equals('Jogging')),
  //       );
  //     }),
  //   );
  //
  //   expect(friendsCalledMoaThatJog instanceof ShapeSet).toBe(true);
  //   expect(friendsCalledMoaThatJog.size).toBe(2);
  //   expect(
  //     friendsCalledMoaThatJog.some((f) => f.namedNode === p2.namedNode),
  //   ).toBe(true);
  //   expect(
  //     friendsCalledMoaThatJog.some((f) => f.namedNode === p3.namedNode),
  //   ).toBe(true);
  // });
  //
  // test('where directly on the shape instance ', () => {
  //   let personsCalledMoa = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.where(p.name.equals('Moa'));
  //     }),
  //   );
  //
  //   expect(personsCalledMoa instanceof ShapeSet).toBe(true);
  //   expect(personsCalledMoa.size).toBe(1);
  //   expect(personsCalledMoa.some((f) => f.namedNode === p2.namedNode)).toBe(
  //     true,
  //   );
  // });
  //
  // test('where and or and', () => {
  //   //we combine AND & OR. AND should be done first, then OR
  //   let persons = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.where((f) =>
  //         f.name
  //           .equals('Jinx')
  //           .or(f.hobby.equals('Jogging'))
  //           .and(f.name.equals('Moa')),
  //       );
  //     }),
  //   );
  //   //test the same thing again, but now the and clause is done within the or clause
  //   //the result should be the same
  //   let persons2 = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.where((f) =>
  //         f.name
  //           .equals('Jinx')
  //           .or(f.hobby.equals('Jogging').and(f.name.equals('Moa'))),
  //       );
  //     }),
  //   );
  //
  //   expect(persons instanceof ShapeSet).toBe(true);
  //   expect(persons.size).toBe(2);
  //   expect(persons.some((f) => f.namedNode === p2.namedNode)).toBe(true);
  //   expect(persons.some((f) => f.namedNode === p3.namedNode)).toBe(true);
  //   expect(persons2 instanceof ShapeSet).toBe(true);
  //   expect(persons2.size).toBe(2);
  //   expect(persons2.some((f) => f.namedNode === p2.namedNode)).toBe(true);
  //   expect(persons2.some((f) => f.namedNode === p3.namedNode)).toBe(true);
  // });
  // test('where some implicit', () => {
  //   //select all persons that have a friend called Moa
  //   //the first test relies on the fact that by default, some() is applied.
  //   //in other words, the person matches if at least 1 friend is called Moa
  //   let peopleWithFriendsCalledMoa = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.where(p.friends.name.equals('Moa'));
  //     }),
  //   );
  //   expect(peopleWithFriendsCalledMoa instanceof ShapeSet).toBe(true);
  //   expect(peopleWithFriendsCalledMoa.size).toBe(1);
  //   expect(
  //     peopleWithFriendsCalledMoa.some((f) => f.namedNode === p1.namedNode),
  //   ).toBe(true);
  // });
  // test('where some explicit', () => {
  //   // the second explicitly mentions some()
  //   let peopleWithFriendsCalledMoa = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.where(
  //         p.friends.some((f) => {
  //           return f.name.equals('Moa');
  //         }),
  //       );
  //     }),
  //   );
  //
  //   expect(peopleWithFriendsCalledMoa instanceof ShapeSet).toBe(true);
  //   expect(peopleWithFriendsCalledMoa.size).toBe(1);
  //   expect(
  //     peopleWithFriendsCalledMoa.some((f) => f.namedNode === p1.namedNode),
  //   ).toBe(true);
  // });
  //
  // test('where every', () => {
  //   // select people that only have friends that are called Moa or Jinx
  //   let allFriendsCalledMoaOrJinx = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.where(
  //         p.friends.every((f) => {
  //           return f.name.equals('Moa').or(f.name.equals('Jinx'));
  //         }),
  //       );
  //     }),
  //   );
  //
  //   expect(allFriendsCalledMoaOrJinx instanceof ShapeSet).toBe(true);
  //   expect(allFriendsCalledMoaOrJinx.size).toBe(1);
  //   expect(
  //     allFriendsCalledMoaOrJinx.some((f) => f.namedNode === p1.namedNode),
  //   ).toBe(true);
  // });
  // test('where sequences', () => {
  //   // select people that only have friends that are called Moa or Jinx
  //   let friendCalledJinxAndNameIsSemmy = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p
  //         .where(
  //           p.friends.some((f) => {
  //             return f.name.equals('Jinx');
  //           }),
  //         )
  //         .name.where((n) => {
  //           return n.equals('Semmy');
  //         });
  //     }),
  //   );
  //
  //   expect(Array.isArray(friendCalledJinxAndNameIsSemmy)).toBe(true);
  //   expect(friendCalledJinxAndNameIsSemmy.length).toBe(1);
  //   expect(friendCalledJinxAndNameIsSemmy.some((f) => f === 'Semmy')).toBe(
  //     true,
  //   );
  // });
  // test('some without where', () => {
  //   let booleansResult = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.some((f) => f.name.equals('Moa'));
  //     }),
  //   );
  //   expect(Array.isArray(booleansResult)).toBe(true);
  //   expect(booleansResult.every((b) => typeof b === 'boolean')).toBe(true);
  //   //1 person (person1) has a friend called Moa, so there is only one 'true' value
  //   expect(booleansResult[0]).toBe(true);
  //   expect(booleansResult.filter((b) => b === true).length).toBe(1);
  // });
  // test('equals without where', () => {
  //   let booleansResult = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.name.equals('Moa');
  //     }),
  //   );
  //   expect(Array.isArray(booleansResult)).toBe(true);
  //   expect(booleansResult.every((b) => typeof b === 'boolean')).toBe(true);
  //   //1 person (person2) is called Moa, so there is only one 'true' value
  //   expect(booleansResult[1]).toBe(true);
  //   expect(booleansResult.filter((b) => b === true).length).toBe(1);
  //
  //   //This is intentionally invalid syntax
  //   // let singleBooleanResult = resolveLocal(
  //   //   Person.select((p) => {
  //   //     return p.some(p.name.equals('Moa'));
  //   //   }),
  //   // );
  //   //["name","name"]
  // });
  //
  // test('count', () => {
  //   // select people that only have friends that are called Moa or Jinx
  //   let numberOfFriends = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.friends.count();
  //     }),
  //   );
  //
  //   expect(Array.isArray(numberOfFriends)).toBe(true);
  //   expect(numberOfFriends.length).toBe(4);
  //   expect(numberOfFriends.filter((count) => count === 0).length).toBe(2);
  //   expect(numberOfFriends.filter((count) => count === 2).length).toBe(2);
  // });
  // test('count equals', () => {
  //   // select people that only have friends that are called Moa or Jinx
  //   let numberOfFriends = resolveLocalFlat(
  //     Person.select((p) => {
  //       return p.where(p.friends.count().equals(2));
  //     }),
  //   );
  //
  //   expect(numberOfFriends instanceof ShapeSet).toBe(true);
  //   expect(numberOfFriends.size).toBe(2);
  //   expect(numberOfFriends.some((f) => f.namedNode === p1.namedNode)).toBe(
  //     true,
  //   );
  //   expect(numberOfFriends.some((f) => f.namedNode === p2.namedNode)).toBe(
  //     true,
  //   );
  // });

  // test('sub select query', () => {
  //   // select people that only have friends that are called Moa or Jinx
  //   let nameAndHobbyOfFriends = resolveLocal(
  //     Person.select((p) => {
  //       return p.friends.select((f) => [f.name, f.hobby]);
  //     }),
  //   );
  //   nameAndHobbyOfFriends.forEach((person) => {
  //     person.forEach((friend) => {
  //       let [name, hobby] = friend;
  //       console.log(name, hobby);
  //     });
  //   });
  //
  //   expect(Array.isArray(nameAndHobbyOfFriends)).toBe(true);
  //   expect(nameAndHobbyOfFriends.length).toBe(4);
  //   expect(nameAndHobbyOfFriends[0][0][0]).toBe('Moa');
  //   expect(nameAndHobbyOfFriends[0][0][1]).toBe('Jogging');
  //   expect(nameAndHobbyOfFriends[1][0][1]).toBeUndefined();
  //   expect(nameAndHobbyOfFriends[2].length).toBe(0);
  // });

  /*test('select - object return type', () => {
    // select people that only have friends that are called Moa or Jinx
    let nameAndHobbyOfFriends = resolveLocal(
      Person.select((p) => {
        return p.friends.select((f) => {
          return [f.name, f.hobby];
        });
      }),
    );
    // let nameAndHobbyOfFriends = resolveLocal(
    //   Person.select((p) => ({
    //     friends: p.friends.select((f) => ({
    //       name: f.name,
    //       hobby: f.hobby,
    //     })),
    //   })),
    // );
    let result: [string, string][][] = nameAndHobbyOfFriends;
    //
    // expect(Array.isArray(nameAndHobbyOfFriends)).toBe(true);
    // expect(nameAndHobbyOfFriends.length).toBe(3);
    // expect(nameAndHobbyOfFriends[0][0]).toBe('Moa');
    // expect(nameAndHobbyOfFriends[0][1]).toBe('Jogging');
    // expect(nameAndHobbyOfFriends[1][1]).toBeUndefined();
  });
*/
  /*test('component with single property query', () => {
    const Component = linkedComponent<Person>(
      Person.select((p) => [p.name]),
      ({linkedData: [name]}) => {
        return <div>{name}</div>;
      },
    );
    let component = renderer.create(<Component of={p1} />);
    let tree = component.toJSON();
    expect(tree.children[0]).toBe('Semmy');
    expect(tree).toMatchSnapshot();
  });
  test('component with where query', () => {
    const Component2 = linkedComponent<Person>(
      Person.select((p) => [p.friends.where((f) => f.name.equals('Moa')).name]),
      ({linkedData: [name]}) => {
        return <div>{name}</div>;
      },
    );
    let component = renderer.create(<Component2 of={p1} />);
    let tree = component.toJSON();
    expect(tree.children[0]).toBe('Moa');
    expect(tree).toMatchSnapshot();
  });
  test('component requesting data from child components', () => {
    const Component3 = linkedComponent<Person>(
      Person.select((p) => [p.name]),
      ({linkedData: [name]}) => {
        return <span>{name}</span>;
      },
    );
    const Component4 = linkedComponent<Person>(
      Person.select((p) => [p.hobby, Component3.of(p.bestFriend)]),
      ({linkedData: [hobby, FriendComp]}) => {
        return (
          <>
            <span>{hobby}</span>
            <FriendComp />
          </>
        );
      },
    );
    let component = renderer.create(<Component4 of={p2} />);
    let tree = component.toJSON();
    expect(tree[0].children[0]).toBe('Jogging');
    expect(tree[1].children[0]).toBe('Jinx');
    expect(tree).toMatchSnapshot();
  });*/

  /*test('linked set components', () => {
    Person.select((p) => ({
      title: p.name,
      subTitle: p.hobby,
    }));

    const NameList = linkedSetComponent<Person>(
      Person.select((person) => [person.name, person.hobby]),
      ({linkedData, sources}) => {
        //currently [["semmy","moa","jinx","quinn"],["jogging"]]
        //needs to be [["semmmy","jogging"],["moa","jogging"],["jinx",""],["quinn",""]]
        //then we could do
        let persons = linkedData as [string, string][];
        persons.map(([name, hobby]) => {
          return (
            <li>
              <span>{name}</span>
              <span>{hobby}</span>
            </li>
          );
        });
        //if we do graphQL likee responses, we can also do:
        //[{friends: [{name: "moa", hobby: "jogging"}]]}]
        let persons2 = linkedData as {name: string; hobby: string}[];
        persons2.map((person) => {
          return (
            <li>
              <span>{person.name}</span>
              <span>{person.hobby}</span>
            </li>
          );
        });

        return (
          <ul>
            {sources.map((person) => {
              return (
                <li>
                  <span>{person.name}</span>
                  <span>{person.hobby}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );

    const qNew = Person.select((person) => ({
      name: person.name,
      hobby: person.hobby,
    }));
    let res = resolveLocal(qNew);
    const NameListNew = linkedSetComponent<Person>(
      qNew,
      ({persons, sources}: {sources?; persons?: {name; hobby}[]}) => {
        //currently [["semmy","moa","jinx","quinn"],["jogging"]]
        //needs to be [["semmmy","jogging"],["moa","jogging"],["jinx",""],["quinn",""]]
        //then we could do
        // let persons = linkedData as [string, string][];
        persons.map(([name, hobby]) => {
          return (
            <li>
              <span>{name}</span>
              <span>{hobby}</span>
            </li>
          );
        });
        //if we do graphQL likee responses, we can also do:
        //[{friends: [{name: "moa", hobby: "jogging"}]]}]
        let persons2 = linkedData as {name: string; hobby: string}[];
        persons2.map((person) => {
          return (
            <li>
              <span>{person.name}</span>
              <span>{person.hobby}</span>
            </li>
          );
        });

        return (
          <ul>
            {sources.map((person) => {
              return (
                <li>
                  <span>{person.name}</span>
                  <span>{person.hobby}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );

    let persons = new ShapeSet<Person>([p1, p2, p3, p4]);
    let component = renderer.create(<NameList of={persons} />);
    let tree = component.toJSON();
    expect(tree[0].children[0]).toBe('Jogging');
    expect(tree[1].children[0]).toBe('Jinx');
    expect(tree).toMatchSnapshot();
  });*/

  /* test('nested linked set components', () => {
    const NameList = linkedSetComponent<Person>(
      Person.select((person) => [person.name]),
      ({linkedData}) => {
        let names = linkedData.map((data) => data[0]);
        return (
          <ul>
            {names.map((name) => {
              return <li>{name}</li>;
            })}
          </ul>
        );
      },
    );
    const PersonOverview = linkedSetComponent<Person>(
      Person.select((person) => [person.name, NameList.of(person.friends)]),
      ({linkedData: [name, Names]}) => {
        return (
          <>
            <span>{name}</span>
            <Names />
          </>
        );
      },
    );
  });
*/
  /*
      const Grid = linkedSetComponent(
        Shape,
        ({sources, children, ChildComponent}) => {
          return (
            <div>
              {ChildComponent
                ? sources.map((source) => {
                  return (
                    <ChildComponent of={source} key={source.node.toString()} />
                  );
                })
                : children}
            </div>
          );
        },
      );
    });

    export const PersonOverview = linkedSetComponent<Person>(
      Person.requestForEachInSet((person) => () => Card.of(person)),
      ({sources, getLinkedData}) => {
        return (
          <div>
            {sources.map((source) => {
              let Profile = getLinkedData(source) as any;
              return (
                <div key={source.toString()}>
                  <Profile />
                </div>
              );
            })}
          </div>
        );
      },
    );

    export const PersonOverviewWithConfigurableChildren = linkedSetComponent(
      Person,
      ({sources, children, ChildComponent}) => {
        return (
          <div>
            {ChildComponent
              ? sources.map((source) => {
                return (
                  <ChildComponent of={source} key={source.node.toString()} />
                );
              })
              : children}
          </div>
        );
      },
    );

    export const PersonOverviewFixedGrid = linkedSetComponent<Person>(
      Person.requestSet((persons) => ({
        PersonGrid: () => Grid.of(persons, Card),
      })),
      ({linkedData: {PersonGrid}}) => {
        return (
          <div>
            <PersonGrid />
          </div>
        );
      },
    );

    const PersonOverviewWithChildRenderFn = linkedSetComponent<Person>(
      Person.requestSet((persons) => ({
        PersonGrid: () =>
          Grid.of(persons, (person) => ({Profile: () => Card.of(person)})),
      })),
      ({linkedData: {PersonGrid}}) => {
        return (
          <div>
            <PersonGrid>
              {({linkedData: {Profile}, ...props}) => {
                //with this setup we can choose to customise our child render function, add tags/props etc.
                return <Profile {...props} />;
              }}
            </PersonGrid>
          </div>
        );
      },
    );*/
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

  //NEXT:
  //Return an object
  //Return a single entry
  //Work with components that show multiple sources (setComponents)
  //clean up old linked component code
  //Refactor structure of json objects, where and count need to be added? investigate other libraries
  //Refactor duplicate value in "every"
  //Refactor firstPath into an array
});

//a view that shows each person of a set as a avatar + name, with pagination or something
/**
 * View 1: PersonOverview, shows the name of person + its friends as PersonAvatar
 * View 2: PersonAvatar, shows name + avatar.source
 * The combined query
 */
// let res = Person.select((p) => [
//   p.friends.select((f) => [f.name, f.avatar]),
// ]).local();

//the result should be an array for the people returned
//each entry being 1 person
//so that we can still select the name of the friends of THAT specific person
//Even if we just get the friends names,
// Person.select((p) => p.friends.name);
//we'd still want to know who is who's friend
//So we can see if the result is always a bunch of quads, for each connection, not just the end result.
//But that can also be a graphQL like response, like arrays & objects with plain strings & numbers
//(we don't really need to know all the IDs of each person unless asked for example, or we always insert the ID?)
//In similar fashion, much like Fluree, we can also return json-ld-like(?) things? review that
//Conclusion, resolve to full data paths (JSONLD) and then locally rebuild into arrays of shapes
//or.. shapesets..
//who needs the properties if they're just available? :/
//which one is it?!
//if view 1 above resolves to a shapeset of persons (the root request), then we can trust that for those persons
//their name and friends are loaded
//so it doesn't matter what the end result is?
//if we select a bunch of names...
// let q = Person.select((p) => [
//   p.friends.name,
//   p.avatar.source,
//   p.friends.where((f) => f.name.equals('x')),
// ]);
//dont we want straight access to those things? Yes we do...
//what would this example look like? :
// [
//   ['name', 'http://image1.jpg', ShapeSet<Person>],
//   ['name2', 'http://image2.jpg', ShapeSet<Person>],
// ];

//BUT, I guess both should be possible.
// let {
//   sources,
//   results,
// }: {
//   sources: ShapeSet<Person>;
//   results: [string[], string, ShapeSet<Person>];
// } = q.local() as any;
//sources being the shapes selected
//results being the end results of the query / end points reached by the query
//getResults() / getSources()
//so the query:
//1) the remote store returns all the requested paths as JSON-LD
//2) LINCD rebuilds that in the graph, and makes shapes & result objects out of it.
//to isolate there is:
// q.loadOnly();
// q.resultsOnly();
//the issue is with multiple chained things in one:
//Not: Person.select(p => [p.name,pfriends]);
//BUT: Person.select(p => p.friends,recentLocations.name);
//Do we really want this?
// [
//   //persons
//   [
//     //friends of person1
//     [
//       //locations of friend1
//       'den haag',
//       'wateringen',
//     ],
//     [
//       //locations of friend2
//       'ubud',
//       'denpasar',
//     ],
//   ],
//   [
//     //friends of person2
//     [
//       //locations of friend1
//       'aljezur',
//     ],
//   ],
// ];
// OR is this what we want?
// ['den haag', 'wateringen', 'ubud', 'denpasar', 'aljezur'];
//remember, we will already have access to this:
// let q;
// q.load().then((ppl: ShapeSet<Person>) => {
//   ppl.forEach((person) => {
//     person.friends.forEach((friend) => {
//       friend.homeLocations.forEach((location) => {
//         console.log(location.name);
//       });
//     });
//   });
// });
// //whilst with the array in array result we could do this (very similar)
// q.results().then((ppl: string[][][]) => {
//   ppl.forEach((friend) => {
//     friend.forEach((location) => {
//       location.forEach((name) => {
//         console.log(name);
//       });
//     });
//   });
// });
//combined?
//Person.select(p => [
// p.friends.homelocations.name,
// p.name
//]);
//returns a combined horizontal array
//but separate vertical array
//but that also means the homelocation results are now split per person
//whilst before they were not!
[['ubud', 'wateringen', 'etc'], 'Mike'];
//perhaps .flatResults() will be an option at a later point. Which will look like the above.
//show the homelocations of my friends on a map
//Map of me.friends.homelocations .. it will show each friends home location on the map, and of course it
//would be nice to show the name of the person!
//Or Names of the parents of my friends
//me.friends.parents.name
//again, we'd show all the info/all the connections
//BUT, like this?
//Grid of me.friends as [
//  UL of [
//    H3 of name,
//    [
//      UL of parents as [
//        H4 of name
//      ]
//    ]
//  ]
//]

//So we have a query.. we get paths. We take each element of a path and use a chain of containers to show them
//Grid -> Vertical Stack, Unsorted List
//all text as P
//then customise.
//put grids in cards.
//auto add things like names/labels? in the top of the card
//can also visualise as a tree
//SO.. conclusion is.. Paths are nice. autotranslating to views is nice.
//But we already have paths.
//We can keep it more simple for now by flattening horizontal paths
//its less like graph-QL, but easier to implement with auto complete
//and we already have shape results for graphQL like experience
