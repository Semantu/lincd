import {describe, expect, test} from '@jest/globals';
import {Literal, NamedNode} from '../models.js';
import {Shape} from '../shapes/Shape.js';
import {linkedComponent, linkedSetComponent, linkedShape} from '../package.js';
import {InMemoryStore} from './storage.test.js';
import {QuadSet} from '../collections/QuadSet.js';
import {LinkedStorage} from '../utils/LinkedStorage.js';
import React from 'react';
import {render, waitFor} from '@testing-library/react';
import {ShapeSet} from '../collections/ShapeSet.js';
import {setDefaultPageLimit} from '../utils/Package.js';
import {xsd} from '../ontologies/xsd.js';
import {TestNode} from '../utils/TraceShape.js';
import { literalProperty,objectProperty } from '../shapes/SHACL.js';
import { QResult } from '../utils/LinkedQuery';

let personClass = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'Person');
let name = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'name');
let nickName = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'nickName');
let bestFriend = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'bestFriend');
let hobby = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'hobby');
let hasFriend = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'hasFriend');
let birthDate = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'birthDate');
let pluralTestProp = NamedNode.getOrCreate(
  NamedNode.TEMP_URI_BASE + 'pluralTestProp',
);

//required for testing automatic data loading in linked components
const store = new InMemoryStore();
LinkedStorage.setDefaultStore(store);

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

  @objectProperty({
    path: bestFriend,
    maxCount: 1,
    shape:Person,
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

  @objectProperty({
    path: pluralTestProp,
    shape: Person,
  })
  get pluralTestProp() {
    return this.getAllAs<Person>(pluralTestProp, Person);
  }

  @literalProperty({
    path: birthDate,
  })
  get birthDate(): Date {
    return this.hasProperty(birthDate)
      ? toNativeDate(this.getOne(birthDate) as Literal)
      : null;
  }

  set birthDate(nativeDate: Date) {
    this.overwrite(birthDate, fromNativeDate(nativeDate));
  }
}

function fromNativeDate(nativeDate: Date) {
  if (!nativeDate) return null;

  var value = nativeDate.toISOString();
  return new Literal(value, xsd.date);
}

function toNativeDate(literal: Literal) {
  return literal
    ? new Date(literal instanceof TestNode ? null : literal.value)
    : null;
}

let p1 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p1-semmy');
p1.name = 'Semmy';
p1.birthDate = new Date('1990-01-01');
p1.set(nickName,new Literal('Sem1'));
p1.set(nickName,new Literal('Sem'));

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
p1.pluralTestProp.add(p1);
p1.pluralTestProp.add(p2);
p1.pluralTestProp.add(p3);
p1.pluralTestProp.add(p4);

let quads = new QuadSet(
  p1.getAllQuads().concat(p2.getAllQuads(), p3.getAllQuads(), p4.getAllQuads()),
);
LinkedStorage.setQuadsLoaded(quads);
store.addMultiple(quads);

describe('query tests', () => {
  test('can select a literal property of all instances', async () => {
    //  x:LinkedQuery<Person, QueryString<Person, "name">>
    let names = await Person.select((p) => {
      let res = p.name;
      return res;
    });
    // let names = resolveLocal(x);
    /**
     * Expected result:
     * [{
     *   "id:"..."
     *   "shape": a Person
     *   "name:"Semmy"
     * },{
     *   "name":"Moa",
     * },... ]
     */

    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(4);
    expect(typeof names[0] === 'object').toBe(true);
    expect(names[0].hasOwnProperty('name')).toBe(true);
    expect(names[0].name).toBe('Semmy');
  });

  test('can select an object property of all instances', async () => {
    //  x:LinkedQuery<Person, QueryString<Person, "name">>
    // QueryShapeSet<Person, Person, "friends"> & ToQueryShapeSetValue<QueryShapeSet<Person, Person, "friends">, Person, "friends">
    //Needs to become:

    // -> QResult<Person, {friends: QResult<Person, {}>[]}>[]

    //From person the property friends is requested.
    //The results is a shapeset of persons, with source Person
    //S / ShapeType: Person
    //Source:Person
    //Property: "friends"

    //Shapeset turns into QResult<Person,{friends:QResult<Person,{}>[]}> ... thats just the shapeset
    //then

    let personFriends = await Person.select((p) => {
      return p.friends;
    });
    /**
     * Expected result:
     * [{
     *   "id:"..."
     *   "shape": a Person
     *   "friends:[{
     *      "id"...,
     *      "shape": a Person
     *    },...]
     * },... ]
     */

    let firstResult = personFriends[0];
    expect(Array.isArray(personFriends)).toBe(true);
    expect(personFriends.length).toBe(4);
    expect(typeof personFriends[0] === 'object').toBe(true);
    expect(firstResult.hasOwnProperty('id')).toBe(true);
    expect(firstResult.id).toBe(p1.uri);
    expect(firstResult.friends.length).toBe(2);
    expect(firstResult.friends[0].id).toBe(p2.uri);
    expect(firstResult.friends[1].id).toBe(p3.uri);
  });

  test('can select a date', async () => {
    let birthDates = await Person.select((p) => {
      return [p.birthDate, p.name];
    });

    let firstResult = birthDates[0];
    expect(Array.isArray(birthDates)).toBe(true);
    expect(birthDates.length).toBe(4);
    expect(typeof firstResult.birthDate === 'object').toBe(true);
    expect(firstResult.birthDate.toString()).toBe(p1.birthDate.toString());
  });

  test('can select sub properties of a first property that returns a set', async () => {
    let namesOfFriends = await Person.select((p) => {
      //  QueryString<QueryShapeSet<Person, Person, "friends">, "name">
      //step 1) --> QResult<QueryShapeSet<Person, Person, "friends">, {name: string}>[][]
      //step 2) --> QResult<Person, {friends: QResult<Person, {name: string}>}>[][]
      //--> QResult<Person, {friends: QResult<Person, {name:string}>}>[]

      //QueryString<QueryShapeSet<Person, Person, "friends">, "name">
      //Source : QueryShapeSet<Person, Person, "friends">
      //Property: "name"

      // QueryShapeSet<Person, Person, "friends">
      //  ShapeType : Person
      //  Source: Person
      //  Property: "friends
      // in other words. Person.friends is a set of persons
      //which needs to be converted to QResult<Person (Source), friends: is a QResult<Person (ShapeType),{name:string}> array

      let res = p.friends.name;
      return res;
    });
    // QueryString<QueryShapeSet<Person,QShape<Person,null,''>,'friends'>,'name'>
    // QueryString<QueryShapeSet<ListItem<Action>,QShape<ItemList<Action>,null,''>,'itemListElements'>,'label'>
    let first = namesOfFriends[0];
    expect(Array.isArray(namesOfFriends)).toBe(true);
    expect(namesOfFriends.length).toBe(4);
    expect(first.id).toBe(p1.uri);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2.uri);
    expect(first.friends[0].name).toBe('Moa');
    expect(first.friends[0]['hobby']).toBeUndefined();
  });

  test('can select a nested set of shapes', async () => {
    // QResult<Person, {friends: QResult<Person, {friends: QResult<Person,{}>}>[]}>[]
    let friendsOfFriends = await Person.select((p) => {
      return p.friends.friends;
    });

    expect(Array.isArray(friendsOfFriends)).toBe(true);
    let first = friendsOfFriends[0];
    expect(friendsOfFriends.length).toBe(4);
    expect(first.friends.length).toBe(2);
    //p1 (first) is friends with p2 and p3. And p2 (first.friends[0]) is friends with p3 and p4
    expect(first.friends[0].friends.some((f) => f.id == p3.uri)).toBe(true);
    expect(first.friends[0].friends.some((f) => f.id == p4.uri)).toBe(true);
    expect(first.friends[1].friends.length).toBe(0);
    expect(friendsOfFriends[3].friends.length).toBe(0);
  });
  test('can select multiple property paths', async () => {
    //{name: string} & {id: string, shape: Person} & {friends: QResult<Person, {}>[]})[]
    //({id: string, shape: Person} & string)[]
    let result = await Person.select((p) => {
      let res = [p.name, p.friends, p.bestFriend.name];
      return res;
    });

    //expected result:
    /**
     * [
     * {
     * "id": "p1",
     * "name": "Semmy",
     * "friends": [{id: "p2"}, {id: "p3"}]
     * },
     * ...
     * ]
     */

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);

    //let first: {name: string} & {id: string, shape: Person} & {friends: true} & {bestFriend: QResult<Person, {name: string}>}
    let first = result[0];

    expect(first.name).toBe('Semmy');
    expect(Array.isArray(first.friends)).toBe(true);
    expect(first.friends.length).toBe(2);
    expect(first.friends.some((f) => f.id === p2.uri)).toBe(true);
    expect(first.friends.some((f) => f.id === p4.uri)).toBe(false);
  });

  test('can select property of single shape value', async () => {
    //(
    // QResult<Person, {bestFriend: QResult<Person, {name: string}>}> |
    // QResult<Shape, {}> |
    // QResult<...>[]
    // )[]

    //QResult<Person, {bestFriend: QResult<Person>}>[]
    //QResult<Person, {bestFriend: QResult<Person, {name: string}>}>
    // |QResult<Shape, {}> |QResult<...>[])[]QResult<Person, {bestFriend: QResult<Person>}>[]
    let result = await Person.select((p) => {
      // QShape<Person, QShape<Person, null, "">, "bestFriend">
      let r = p.bestFriend.name;
      // let r3 = [p.bestFriend];
      // let r2 = [p.friends.friends.name];
      return r;
    });

    //expected result:
    /**
     * [
     * {
     * "id": "p1",
     * "bestFriend": {
     *   "id": "p3",
     *   "name": "Jinx"
     * }
     * ...
     * ]
     */

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);

    let second = result[1];

    expect(second.bestFriend.id).toBe(p3.uri);
  });

  test('can select properties of a specific subject', async () => {
    let qRes = await Person.select(p1,p => p.name)
    expect(qRes.name).toBe(p1.name)
    expect(qRes.id).toBe(p1.uri)
  })

  test('can select 3 level deep nested paths', async () => {
    let level3Friends = await Person.select((p) => {
      return p.friends.friends.friends;
    });

    expect(level3Friends.length).toBe(4);
    expect(
      level3Friends.every((p) =>
        //level 1 is p1 has p2,p3 and p2 has p3,p4
        p.friends.every((f) =>
          //level 2 is p2 has p3,p4
          f.friends.every(
            (f2) =>
              //level 3 is empty, because p3,p4 have no friends
              f2.friends.length === 0,
          ),
        ),
      ),
    ).toBe(true);
  });
  // ### WHERE TESTS

  test('can use where() to filter a string in a set of Literals with equals', async () => {
    //we select the friends of all persons, but only those friends whose name is moa
    //this will return an array, where each entry represents the results for a single person.
    // the entry contains those friends of the person whose name is Moa - (as a set of persons)

    //QResult<Person, {friends: QResult<Person, {}>[]}>[]
    let friendsCalledMoa = await Person.select((p) => {
      return p.friends.where((f) => f.name.equals('Moa'));
    });

    let first = friendsCalledMoa[0];
    let second = friendsCalledMoa[1];
    expect(Array.isArray(friendsCalledMoa)).toBe(true);
    expect(first.friends.length).toBe(1);
    expect(first.friends[0].id).toBe(p2.uri);
    expect(second.friends.length).toBe(0);
  });
  test('where and', async () => {
    //we select the friends of all persons, but only those friends whose name is moa
    //this will return an array, where each entry represents the results for a single person.
    // the entry contains those friends of the person whose name is Moa - (as a set of persons)
    let friendsCalledMoaThatJog = await Person.select((p) => {
      return p.friends.where((f) =>
        f.name.equals('Moa').and(f.hobby.equals('Jogging')),
      );
    });
    let first = friendsCalledMoaThatJog[0];
    let second = friendsCalledMoaThatJog[1];
    expect(Array.isArray(friendsCalledMoaThatJog)).toBe(true);
    expect(first.friends.length).toBe(1);
    expect(first.friends[0].id).toBe(p2.uri);
    expect(second.friends.length).toBe(0);
  });
  test('where or', async () => {
    //we select the friends of all persons, but only those friends whose name is moa
    //this will return an array, where each entry represents the results for a single person.
    // the entry contains those friends of the person whose name is Moa - (as a set of persons)
    let orFriends = await Person.select((p) => {
      return p.friends.where((f) =>
        f.name.equals('Jinx').or(f.hobby.equals('Jogging')),
      );
    });

    let first = orFriends[0];
    let second = orFriends[1];
    expect(Array.isArray(orFriends)).toBe(true);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2.uri);
    expect(first.friends[1].id).toBe(p3.uri);
    expect(second.friends.length).toBe(1);
    expect(second.friends[0].id).toBe(p3.uri);
  });
  test('select all', async () => {
    let all = await Person.select();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(4);
  })
  test('empty select with where ', async () => {
    let filteredNoProps = await Person.select().where((p) => {
      return p.name.equals(p1.name);
    });

    expect(Array.isArray(filteredNoProps)).toBe(true);
    expect(filteredNoProps.length).toBe(1);
    expect(filteredNoProps[0].id).toBe(p1.uri);
  });

  test('where and or and', async () => {
    //we combine AND & OR. AND should be done first, then OR
    //Therefor we expect p2 and p3 to match as friends
    //(p3 would not match if the OR was done first)
    let persons = await Person.select((p) => {
      return p.friends.where((f) =>
        f.name
          .equals('Jinx')
          .or(f.hobby.equals('Jogging'))
          .and(f.name.equals('Moa')),
      );
    });

    //test the same thing again, but now the and clause is done within the or clause
    //the result should be the same
    let persons2 = await Person.select((p) => {
      return p.friends.where((f) =>
        f.name
          .equals('Jinx')
          .or(f.hobby.equals('Jogging').and(f.name.equals('Moa'))),
      );
    });

    [persons, persons2].forEach((result) => {
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].friends.length).toBe(2);
      expect(result[1].friends.length).toBe(1);
      expect(result[2].friends.length).toBe(0);
      expect(result[3].friends.length).toBe(0);
      expect(result[0].friends[0].id).toBe(p2.uri);
      expect(result[0].friends[1].id).toBe(p3.uri);
      expect(result[1].friends[0].id).toBe(p3.uri);
    });
  });
  test('where some implicit', async () => {
    //select all persons that have a friend called Moa
    //the test relies on the fact that by default, some() is applied.
    //in other words, the person matches if at least 1 friend is called Moa
    let peopleWithFriendsCalledMoa = await Person.select().where((p) => {
      return p.friends.name.equals('Moa');
    });
    expect(Array.isArray(peopleWithFriendsCalledMoa)).toBe(true);
    expect(peopleWithFriendsCalledMoa.length).toBe(1);
    expect(peopleWithFriendsCalledMoa[0].id).toBe(p1.uri);
  });
  test('where some explicit', async () => {
    // same as last test but with explicit some()
    let peopleWithFriendsCalledMoa = await Person.select().where((p) => {
      return p.friends.some((f) => {
        return f.name.equals('Moa');
      });
    });

    expect(Array.isArray(peopleWithFriendsCalledMoa)).toBe(true);
    expect(peopleWithFriendsCalledMoa.length).toBe(1);
    expect(peopleWithFriendsCalledMoa[0].id).toBe(p1.uri);
  });
  test('where every', async () => {
    // select people that only have friends that are called Moa or Jinx
    let allFriendsCalledMoaOrJinx = await Person.select().where((p) => {
      return p.friends.every((f) => {
        return f.name.equals('Moa').or(f.name.equals('Jinx'));
      });
    });

    expect(Array.isArray(allFriendsCalledMoaOrJinx)).toBe(true);
    expect(allFriendsCalledMoaOrJinx.length).toBe(1);
    expect(allFriendsCalledMoaOrJinx[0].id).toBe(p1.uri);
  });
  test('where sequences', async () => {
    // select people that have a friend called Jinx and a name "Semmy" (so that's only p1)
    //Should be QResult<Person, {name:string}>[]
    let friendCalledJinxAndNameIsSemmy = await Person.select().where((p) => {
      let res = p.friends
        .some((f) => {
          return f.name.equals('Jinx');
        })
        .and(p.name.equals('Semmy'));
      return res;
    });

    expect(Array.isArray(friendCalledJinxAndNameIsSemmy)).toBe(true);
    expect(friendCalledJinxAndNameIsSemmy.length).toBe(1);
    expect(friendCalledJinxAndNameIsSemmy[0].id).toBe(p1.uri);

    // select people that have a friend called Jinx, BUT ONLY SELECT THEIR NAME if their name is "Semmy"
    //so we should get p1 and p2, but only the name of p1
    let friendCalledJinxAndNameIsSemmy2 = await Person.select((p) => {
      let res = p.name.where((n) => {
        return n.equals('Semmy');
      });
      return res;
    }).where((p) =>
      p.friends.some((f) => {
        return f.name.equals('Jinx');
      }),
    );

    //make sure type is undefined. Then make everything with single shapes work only with QResult
    expect(Array.isArray(friendCalledJinxAndNameIsSemmy2)).toBe(true);
    expect(friendCalledJinxAndNameIsSemmy2.length).toBe(2);
    expect(friendCalledJinxAndNameIsSemmy2[0].id).toBe(p1.uri);
    expect(friendCalledJinxAndNameIsSemmy2[1].id).toBe(p2.uri);
    expect(friendCalledJinxAndNameIsSemmy2[0].name).toBe('Semmy');
    expect(typeof friendCalledJinxAndNameIsSemmy2[1].name).toBe('undefined');
  });
  test('outer where()', async () => {
    // QResult<Person, {friends: QResult<Person, {}>[]}>[]
    let friendsOfP1 = await Person.select((p) => {
      return p.friends;
    }).where((p) => {
      return p.name.equals(p1.name);
    });

    let first = friendsOfP1[0];
    expect(Array.isArray(friendsOfP1)).toBe(true);
    expect(friendsOfP1).toHaveLength(1);
    expect(first.id).toBe(p1.uri);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0].id).toBe(p2.uri);
  });
  //#### COUNT TESTS ####
  test('count a shapeset', async () => {
    //count the number of friends that each person has
    //QResult<Person, {friends: number}>[]
    let numberOfFriends = await Person.select((p) => {
      let res = p.friends.size();
      return res;
    });
    //Note that when no argument is given to count, we expect the key to be the label of the
    // last property before count. So that's "friends"
    //expected result
    /**
     * [{
     *   id: "p1",
     *   friends: 2
     * },{
     *  id: "p2",
     *  friends: 2
     *  },...]
     */

    expect(Array.isArray(numberOfFriends)).toBe(true);
    expect(numberOfFriends[0].friends).toBe(2);
    expect(numberOfFriends[1].friends).toBe(2);
    expect(numberOfFriends[2].friends).toBe(0);
    expect(numberOfFriends[3].friends).toBe(0);
  });

  test('count a nested property', async () => {
    //count the number of friends that each person has
    //QResult<Person, {friends: number}>[]
    let numberOfFriends = await Person.select((p) => {
      let res = p.friends.friends.size();
      return res;
    });
    //expected result
    /**
     * [{
     *   id: "p1",
     *   friends: [{
     *     id: "p2",
     *     friends: 2
     *   },{
     *     id: "p3",
     *     friends: 0
     *   }]
     * },...]
     */

    expect(Array.isArray(numberOfFriends)).toBe(true);
    expect(Array.isArray(numberOfFriends[0].friends)).toBe(true);
    expect(numberOfFriends[0].friends[0].friends).toBe(2);
    expect(numberOfFriends[0].friends[1].friends).toBe(0);
  });
  // test('shape.count() with a countable argument', async () => {
  //   //count the number of friends that each person has
  //   //QResult<Person, {friends: number}>[]
  //   let numberOfFriends = await Person.select((p) => {
  //     let res = p.count(p.friends);
  //
  //     return res;
  //   });
  //   //expected result
  //   /**
  //    * [{
  //    *   id: "p1",
  //    *   count: 2
  //    * },{
  //    *   id: "p2",
  //    *   count: 2
  //    * },...]
  //    */
  //
  //   expect(Array.isArray(numberOfFriends)).toBe(true);
  //   expect(numberOfFriends[0].count).toBe(2);
  //   expect(numberOfFriends[1].count).toBe(2);
  //   expect(numberOfFriends[2].count).toBe(0);
  //   expect(numberOfFriends[3].count).toBe(0);
  // });
  test('labeling the key of count()', async () => {
    //count the number of friends that each person has
    let numberOfFriends3 = await Person.select((p) => {
      let res = p.friends.select((f) => ({numFriends: f.friends.size()}));
      return res;
    });
    //expected result
    /**
     * [{
     *   id: "p1",
     *   friends: [
     *     {numFriends: 2,id: "p2"},
     *     {numFriends: 0,id: "p3"}
     *   ]
     * },{
     *   id: "p2",
     *   friends: [
     *     {numFriends: 0,id: "p3"},
     *     {numFriends: 0,id: "p4"}
     *   ]
     * },...]
     */
    //We want outcome to be {numFriends: number}
    //So ObjectToPlainResult should convert the SetSize to a number
      //if Source (SetSize<Source>) extends QueryShapeSet, then its an object, else a number
    let first = numberOfFriends3[0];
    let firstNumFriends: number = first.friends[0].numFriends;
    // let firstNumFriends: number = first.friends;
    expect(first.hasOwnProperty('friends')).toBe(true);
    expect(first.hasOwnProperty('count')).toBe(false);
    expect(firstNumFriends).toBe(2);
  });
  // test('count a nested path as argument', async () => {
  //   //count the number of second level friends that each person has
  //   //count is expected to count the total number of final nodes (friends) in the p.friends.friends set
  //   //by counting each sub result and combinging the results
  //   let numberOfFriends = await Person.select((p) => {
  //     let res = p.count(p.friends.friends, 'numFriends');
  //     return res;
  //   });
  //   //expected result
  //   /**
  //    * [{
  //    *   id: "p1",
  //    *   count: 2
  //    * },{
  //    *   id: "p2",
  //    *   count: 0
  //    * },...]
  //    */
  //
  //   let first = numberOfFriends[0];
  //   expect(Array.isArray(numberOfFriends)).toBe(true);
  //   expect(numberOfFriends[0].count).toBe(2);
  //   expect(numberOfFriends[1].count).toBe(0);
  //   expect(numberOfFriends[2].count).toBe(0);
  //   expect(numberOfFriends[3].count).toBe(0);
  // });

  test('nested object property', async () => {

    //NOTE: this test is currently just here for typescript types.
    let res = await Person.select((p) => {
      let res = {
        friends:p.friends,
        bestFriends:p.friends.bestFriend
      };
      return res;
    });

    //has to be an array of objects
    let friends = res[0].friends;
    //bestFriends should be a PATH, but it's not. Its a end result only
    let bestFriends = res[0].bestFriends;

    let res2 = await Person.select((p) => {
      let res = p.friends.bestFriend;
      return res;
    });
    //This works, friends is an array and bestFriend is a single shape
    let firstBestFriend = res2[0].friends[0].bestFriend;

  });

  test('sub select custom', async () => {
    let namesAndHobbiesOfFriends = await Person.select((p) => {
      let res = p.friends.select((f) => {
        let res2 = {
          _name: f.name,
          _hobby: f.hobby,
        };
        return res2;
      });
      return res;
    });

    //
    //LinkedQuery<Person,{
    // _name: QueryString<QShape<Person,null,''>,'name'>
    // _hobby: QueryString<QShape<Person,null,''>,'hobby'>
    //},QueryShapeSet<...>>
    //QShapeSet<Person,QShape<Person,null,''>,'friends'>

    //GetNestedQueryResultType<
    // Response = {name,hobby},
    // Source = QShapeSet<Person,QShape<Person,null,''>,'friends'>
    //>
    // --> GetQueryObjectResultType<
    //         Source = QShapeSet<Person,QShape<Person,null,''>,'friends'>,
    //         SubProperties = ResponseToObject<{
    //          _name: QueryString<QShape<Person,null,''>,'name'>,
    //          _hobby: QueryString<QShape<Person,null,''>,'hobby'>
    //         }>
    //       >

    //--> QV extends QueryShapeSet.. ->
    // CreateShapeSetQResult<
    //   ShapeType = Person,
    //   Source = QShape<Person,null,''>,
    //   Property = 'friends',
    //   SubProperties = {}
    //   HasName = false? (we're currently not passing this in GetNestedQueryResultType)
    //>

    //-> QResult<
    //  Source = SourceShapeType = Person,
    //  {'friends': CreateQResult< Person, null, null, {_name: string, _hobby: string}>[]}
    // (had to pass SubProperties, it works now)


    /**
     * Expected result:
     * [{
     *  "id:"..."
     *  "friends": [{
     *      id:"...",
     *      name:"Moa",
     *      hobby:"Jogging"
     *    }
     *    ,...
     *  ]
     *  },...]
     */

    let first = namesAndHobbiesOfFriends[0];
    expect(Array.isArray(namesAndHobbiesOfFriends)).toBe(true);
    expect(namesAndHobbiesOfFriends.length).toBe(4);
    expect(first.friends.length).toBe(2);
    expect(first.friends[0]._name).toBe('Moa');
    expect(first.friends[0]._hobby).toBe('Jogging');
  });

  test('custom result object - equals without where', async () => {
    let customResult = await Person.select((p) => {
      let res = {
        nameIsMoa: p.name.equals('Moa'),
        friendNames: p.friends.name,
        friends: p.friends,
        name: p.name,
      };
      return res;
    });
    let {nameIsMoa,name,friends,friendNames,id} = customResult[0];
    let second = customResult[1];
    //just a typescript check here
    let stringName:string = name;
    // QueryString<
    //   QueryShapeSet<Person,
    //     QShape<Person,null,''>
    //   ,'friends'>
    // ,'name'>
    //Should convert to QResult<Person,{name:string}>[]
    
    //step by step
    //1) QueryString -> CreateQResult<
    //                    Source = QSS<Person,QShape<Person,null,''>,'friends'>,
    //                    Value = string / string[]
    //                    Property='name',
    //                    SubProperties={}
    //                    HasName=true
    //                  >[]
    //1B) Source extends QueryShapeSet,
    //  ShapeType = Person,
    //  ParentSource=QShape<Person,null,''>,
    //  SourceProperty='friends'
    //-->
    //2) CreateQResult<
    //  Source = QShape<Person,null,''>
    //  Value = QResult< Person, {'friends':CreateQResult<string,string>}>[]
    //  Property = 'friends'
    //  SubProperties = {}
    //  HasName = true

    //Source extends QueryShape
    //  SourceShapeType = Person,
    //  ParentSource = null,
    //  Property = ''

    //-> Value is returned... QResult< Person, {'friends':CreateQResult<string,string>}>[])

    //----
    // for friends. It should convert
    //      QShapeSet<Person,QShape<Person,null,''>,'friends'>
    // into QResult<Person,null>[]
    //1) GetQueryObjectResultType .. QV extends QueryShapeSet
    //  ShapeType = Person,
    //  Source = QShape<Person,null,''>
    //  Property = 'friends'
    // -> CreateShapeSetQResult<
    //     ShapeType = Person,
    //     Source = QShape<Person,null,''>,
    //     Property = 'friends',
    //     SubProperties = {}
    //  >
    //  Source extends QueryShape<SourceShapeType = Person>
    // -> QResult<Person,{friends:CreateQResult<
    //        Source = QShape<Person>
    //        Value = null,
    //       Property = null,
    //       SubProperties = {}
    //       HasName = true
    //     >[]}>

    // NOW -> QResult<Person,{}}>[]

    //CreateQResult


    let friends2:QResult<Person>[] = friends;
    let friends3:QResult<Person,{name: string;}>[] = friendNames;

    expect(Array.isArray(customResult)).toBe(true);
    expect(id).toBe(p1.uri);
    expect(nameIsMoa).toBe(false);
    expect(typeof stringName).toBe('string');
    expect(second.id).toBe(p2.uri);
    expect(second.nameIsMoa).toBe(true);

    //This is intentionally invalid syntax
    // let singleBooleanResult = await Person.select((p) => {
    //   return p.some(p.name.equals('Moa'));
    // });
    //["name","name"]
  });
  test('custom result object 2', async () => {
    let customResult = await Person.select((p) => {
      let res = {
        nameIsMoa: p.name.equals('Moa'),
        moaAsFriend: p.friends.some((f) => f.name.equals('Moa')),
        numFriends: p.friends.size(),
        friendsOfFriends: p.friends.friends,
        //
      };
      return res;
    });

    expect(Array.isArray(customResult)).toBe(true);
    expect(customResult[0].id).toBe(p1.uri);
    expect(customResult[0].nameIsMoa).toBe(false);
    expect(customResult[1].id).toBe(p2.uri);
    expect(customResult[1].nameIsMoa).toBe(true);
    expect(customResult[0].moaAsFriend).toBe(true);
    expect(customResult[1].moaAsFriend).toBe(false);
    expect(Array.isArray(customResult[0].friendsOfFriends)).toBe(true);
    expect(Array.isArray(customResult[0].friendsOfFriends[0].friends)).toBe(
      true,
    );
    expect(customResult[0].friendsOfFriends[0].id).toBe(p2.uri);
    expect(customResult[0].friendsOfFriends[0].friends[0].id).toBe(p3.uri);
  });

  test('count equals', async () => {
    // select people that only have friends that are called Moa or Jinx
    let numberOfFriends = await Person.select().where((p) => {
      let res = p.friends.size().equals(2);
      return res;
    });

    expect(Array.isArray(numberOfFriends)).toBe(true);
    expect(numberOfFriends.length).toBe(2);
    expect(numberOfFriends[0].id).toBe(p1.uri);
    expect(numberOfFriends[1].id).toBe(p2.uri);
  });

  test('sub select query returning an array', async () => {
    let subResult = await Person.select((p) => {
      let res1 = p.friends.select((f) => {
        let res2 = [f.name, f.hobby];
        return res2;
      });
      return res1;
    });

    subResult.forEach((person) => {
      person.friends.forEach((friend) => {
        let {name, hobby} = friend;
        expect(typeof name).toBe('string');
        expect(typeof hobby === 'string' || typeof hobby === 'undefined').toBe(
          true,
        );
      });
    });

    expect(Array.isArray(subResult)).toBe(true);
    expect(subResult.length).toBe(4);
    expect(subResult[0].friends[0].hasOwnProperty('name')).toBe(true);
    expect(subResult[0].friends[0].hasOwnProperty('hobby')).toBe(true);
    expect(subResult[0].friends[0].name).toBe('Moa');
  });
  test('component with single property query', async () => {
    const Component = linkedComponent(
      Person.query((p) => p.name),
      ({name}) => {
        return <div>{name}</div>;
      },
    );
    let component = render(<Component of={p1} />);

    await waitFor(() => expect(component.getByText('Semmy')).toBeTruthy(), {
      timeout: 5000,
      interval: 50,
    });
    // console.log(component.container.children);
    // let tree = component.toJSON();
    // expect(tree.children[0]).toBe('Semmy');
    // expect(tree).toMatchSnapshot();
  });

  test('component with where query', async () => {
    const query = Person.query(
      (p) => p.friends.where((f) => f.name.equals('Jinx')).name,
    );
    // QResult<Person, {friends: QResult<Person, {name: string}>[]}>[]
    //These types should be identical
    const query1Result = await query.exec();
    const query2Result = await Person.select(
      (p) => p.friends.where((f) => f.name.equals('Jinx')).name,
    );

    const Component2 = linkedComponent(
      query,
      ({friends, shape, id, source}) => {
        // unknown extends LinkedQuery<any, infer Response, infer Source> ? GetNestedQueryResultType<Response, Source, null> : (unknown extends Array<infer Type> ? UnionToIntersection<QueryResponseToResultType<Type>> : (unknown extends Evaluation ? boolean : (unknown extends Object ? QResult<null, ObjectToPlainResult<unknown>> : unknown)))
        let s = source;
        let f = friends;
        let shp = shape;
        let i = id;

        return <div>{friends[0].name}</div>;
      },
    );
    let component = render(<Component2 of={p1} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());

    // let component = renderer.create(<Component2 of={p1} />);
    // let tree = component.toJSON();
    // expect(tree.children[0]).toBe('Jinx');
    // expect(tree).toMatchSnapshot();
  });
  test('component with custom props', async () => {
    //Typescript has some limitations, which mean we cannot infer the type of the query AND define custom props at the same time
    //https://stackoverflow.com/questions/60377365/typescript-infer-type-of-generic-after-optional-first-generic/60378308#60378308

    //because of this, whenever you need props from a query AND custom props,
    //you need to define the query first, and then use the QueryProps type to define the props of the component:
    const query = Person.query(
      (p) => p.friends.where((f) => f.name.equals('Jinx')).name,
    );

    const ComponentWithCustomProps = linkedComponent<
      //To add custom props, you NEED TO first add typeof query as the first type param
      typeof query,
      //then you can add the custom props interface as the second type param
      {custom1: boolean}
    >(query, ({friends, shape, id, custom1, source}) => {
      // unknown extends LinkedQuery<any, infer Response, infer Source> ? GetNestedQueryResultType<Response, Source, null> : (unknown extends Array<infer Type> ? UnionToIntersection<QueryResponseToResultType<Type>> : (unknown extends Evaluation ? boolean : (unknown extends Object ? QResult<null, ObjectToPlainResult<unknown>> : unknown)))
      friends.length;
      friends[0].name;
      friends[0].id;
      return (
        <div>
          <span>{friends[0].name}</span>
          <span>{custom1.toString()}</span>
        </div>
      );
    });

    let component = render(<ComponentWithCustomProps of={p1} custom1={true} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
    await waitFor(() => expect(component.getByText('true')).toBeTruthy());
  });

  test('component requesting data from child components', async () => {
    // LinkedQuery<Person, QueryString<Person, "name">, any>
    const query1 = Person.query((p) => p.name);

    // LinkedFunctionalComponent<{}, Person>
    const Component1 = linkedComponent(query1, ({name}) => {
      return <span>{name}</span>;
    });

    //And the query result should be
    // QResult<Person, {hobby: string, bestFriend: QResult<Person, {name: string}>}>
    let query2 = Person.query((p) => {
      // let res = [p.hobby, p.bestFriend.preloadFor(Component1)];
      // let res = [p.hobby, Component1.of(p.bestFriend)];
      //This would also work
      let res = {
        hobby: p.hobby,
        bestFriend: p.bestFriend,
      };
      return res;
    });

    //let resultType = await query2.exec();

    // Argument of type 'PropertyQueryStep | CountStep | CustomQueryObject | QueryPath[] | BoundComponentQueryStep'
    // is not assignable to 'PropertyQueryStep | CountStep | CustomQueryObject | QueryPath[]'.

    let query2Object = query2.getQueryPaths(); //typeof query2 extends LinkedQuery<any, infer Response, infer Source> ? GetQueryObjectResultType<Response> : never;

    const Component2 = linkedComponent(query2, ({hobby, bestFriend}) => {
      return (
        <>
          <span>{hobby.toString()}</span>
          <Component1 of={bestFriend} />
        </>
      );
    });
    let component = render(<Component2 of={p2} customasd1={true} />);
    await waitFor(() => expect(component.getByText('Jinx')).toBeTruthy());
    await waitFor(() => expect(component.getByText('Jogging')).toBeTruthy());
  });
  test('linked set components', async () => {
    const NameList = linkedSetComponent(
      Person.query((person) => [person.name, person.hobby]),
      ({sources, linkedData}) => {
        let persons = linkedData;
        return (
          <ul>
            {persons.map((person) => {
              return (
                <li key={person.id}>
                  <span>{person.name}</span>
                  <span>{person.hobby}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );
    let persons = new ShapeSet([p1, p2, p3, p4]);

    let component = render(<NameList of={persons} />);
    await waitFor(() => {
      persons.forEach((person) => {
        expect(component.getByText(person.name)).toBeTruthy();
      });
      expect(component.getByText(p2.hobby)).toBeTruthy();
    });
  });

  test('linked set components without source', async () => {
    const NameList = linkedSetComponent(
      Person.query((person) => [person.name, person.hobby]),
      ({sources, linkedData}) => {
        let persons = linkedData;
        return (
          <ul>
            {persons.map((person) => {
              return (
                <li key={person.id}>
                  <span>{person.name}</span>
                  <span>{person.hobby}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );
    let persons = new ShapeSet([p1, p2, p3, p4]);
    let component = render(<NameList />);
    await waitFor(() => {
      persons.forEach((person) => {
        expect(component.getByText(person.name)).toBeTruthy();
      });
      expect(component.getByText(p2.hobby)).toBeTruthy();
    });
  });

  test('linked set components with named data prop', async () => {
    let query = Person.query((person) => [person.name, person.hobby]);
    const NameList = linkedSetComponent({persons: query}, ({persons}) => {
      return (
        <ul>
          {persons.map((person) => {
            return (
              <li key={person.id}>
                <span>{person.name}</span>
                <span>{person.hobby}</span>
              </li>
            );
          })}
        </ul>
      );
    });
    let persons = new ShapeSet([p1, p2, p3, p4]);
    let component = render(<NameList />);
    await waitFor(() => {
      persons.forEach((person) => {
        expect(component.getByText(person.name)).toBeTruthy();
      });
      expect(component.getByText(p2.hobby)).toBeTruthy();
    });
  });

  test('linked set components rendered by linked component', async () => {
    let query = Person.query((person) => [person.name, person.hobby]);
    const NameList = linkedSetComponent({persons: query}, ({persons}) => {
      return (
        <ul>
          {persons.map((person) => {
            return (
              <li key={person.id}>
                <span>{person.name}</span>
                <span>{person.hobby}</span>
              </li>
            );
          })}
        </ul>
      );
    });

    const PersonFriends = linkedComponent(
      Person.query((p) => {
        return [p.name, p.friends.preloadFor(NameList)];
      }),
      ({name, friends}) => {
        return (
          <div>
            <span>{name}</span>
            <NameList of={friends} />
          </div>
        );
      },
    );

    let component = render(<PersonFriends of={p1} />);
    await waitFor(() => {
      expect(component.getByText(p1.name)).toBeTruthy();
      expect(component.getByText(p2.name)).toBeTruthy();
      expect(component.getByText(p2.hobby)).toBeTruthy();
      expect(component.getByText(p3.name)).toBeTruthy();
      // expect(component.getByText(p4.name)).toBeFalsy();
    });
  });

  test('linked set component with default page limit', async () => {
    setDefaultPageLimit(2);

    const NameList = linkedSetComponent(
      Person.query((person) => [person.name, person.hobby]),
      ({linkedData}) => {
        let persons = linkedData;
        return (
          <ul>
            {persons.map((person) => {
              return (
                <li key={person.id}>
                  <span role="name">{person.name}</span>
                </li>
              );
            })}
          </ul>
        );
      },
    );
    let component = render(<NameList />);
    await waitFor(() => {
      expect(component.getAllByRole('name').length).toBe(2);
      expect(component.getByText(p1.name)).toBeTruthy();
      expect(component.getByText(p2.name)).toBeTruthy();
    });
  });
  test('outer where with limit', async () => {
    // QResult<Person, {friends: QResult<Person, {}>[]}>[]
    let limitedNames = await Person.select((p) => {
      return p.name;
    })
      .where((p) => {
        return p.name.equals(p1.name).or(p.name.equals(p2.name));
      })
      .limit(1);

    let first = limitedNames[0];
    expect(Array.isArray(limitedNames)).toBe(true);
    expect(limitedNames).toHaveLength(1);
    expect(first.id).toBe(p1.uri);
  });

  test('sort by 1 property - ASC (default)', async () => {
    let sorted = await Person.select((p) => {
      return p.name;
    }).sortBy((p) => p.name);

    //Jinx, Moa, Quinn, Semmy

    expect(Array.isArray(sorted)).toBe(true);
    expect(sorted).toHaveLength(4);
    expect(sorted[0].id).toBe(p3.uri);
    expect(sorted[0].name).toBe('Jinx');
    expect(sorted[1].id).toBe(p2.uri);
    expect(sorted[1].name).toBe('Moa');
    expect(sorted[2].id).toBe(p4.uri);
    expect(sorted[2].name).toBe('Quinn');
    expect(sorted[3].id).toBe(p1.uri);
    expect(sorted[3].name).toBe('Semmy');
  });

  test('sort by 1 property - DESC', async () => {
    let sorted = await Person.select((p) => {
      return p.name;
    }).sortBy((p) => p.name, 'DESC');

    //Semmy, Quinn, Moa, Jinx

    expect(Array.isArray(sorted)).toBe(true);
    expect(sorted).toHaveLength(4);
    expect(sorted[0].id).toBe(p1.uri);
    expect(sorted[0].name).toBe('Semmy');
    expect(sorted[1].id).toBe(p4.uri);
    expect(sorted[1].name).toBe('Quinn');
    expect(sorted[2].id).toBe(p2.uri);
    expect(sorted[2].name).toBe('Moa');
    expect(sorted[3].id).toBe(p3.uri);
    expect(sorted[3].name).toBe('Jinx');
  });

  //TODO: sort by nested query
  // test('sort by nested query',async () => {
  //   const query2 = (ItemList<Action>).query(list => {
  //     return list.itemListElements.select(l => l.item).sortBy(l => l.position,'ASC');
  //   });
  //
  // })


//   test('linked set component with pagination - going to next page', async () => {
//     setDefaultPageLimit(2);
//
//     const NameList = linkedSetComponent(
//       {persons: Person.query((person) => [person.name, person.hobby])},
//       ({persons, query}) => {
//         return (
//           <div>
//             <ul>
//               {persons.map((person) => {
//                 return (
//                   <li key={person.id}>
//                     <span role="name">{person.name}</span>
//                   </li>
//                 );
//               })}
//             </ul>
//             <button
//               role="next-page"
//               onClick={() => {
//                 query.nextPage();
//               }}
//             >
//               Next page
//             </button>
//           </div>
//         );
//       },
//     );
//     let component = render(<NameList />);
//     await waitFor(() => {
//       expect(component.getAllByRole('name').length).toBe(2);
//       expect(component.getByText(p1.name)).toBeTruthy();
//       expect(component.getByText(p2.name)).toBeTruthy();
//     });
//     await act(async () => {
//       let button = await component.findByRole('next-page');
//       button.click();
//     });
//     await waitFor(() => {
//       expect(component.getAllByRole('name').length).toBe(2);
//       expect(component.getByText(p3.name)).toBeTruthy();
//       expect(component.getByText(p4.name)).toBeTruthy();
//     });
//   });
// });
// test('linked set components with pagination with sources from other linked component', async () => {
//   setDefaultPageLimit(2);
//   let req = Person.query((person) => person.name);
//   const NameList = linkedSetComponent({persons: req}, ({persons, query}) => {
//     return (
//       <div>
//         <ul>
//           {persons.map((person) => {
//             return (
//               <li key={person.id}>
//                 <span role={'name'}>{person.name}</span>
//               </li>
//             );
//           })}
//         </ul>
//         <button
//           role="next-page"
//           onClick={() => {
//             query.nextPage();
//           }}
//         >
//           Next page
//         </button>
//       </div>
//     );
//   });
//
//   const PersonFriends = linkedComponent(
//     Person.query((p) => {
//       return [p.pluralTestProp.preloadFor(NameList)];
//     }),
//     ({pluralTestProp}) => {
//       return (
//         <div>
//           <NameList of={pluralTestProp} />
//         </div>
//       );
//     },
//   );
//
//   let component = render(<PersonFriends of={p1} />);
//   await waitFor(() => {
//     expect(component.getAllByRole('name')).toHaveLength(2);
//     expect(component.getByText(p1.name)).toBeTruthy();
//     expect(component.getByText(p2.name)).toBeTruthy();
//   });
//
//   await act(async () => {
//     let button = await component.findByRole('next-page');
//     button.click();
//   });
//   await waitFor(() => {
//     expect(component.getAllByRole('name')).toHaveLength(2);
//     expect(component.getByText(p3.name)).toBeTruthy();
//     expect(component.getByText(p4.name)).toBeTruthy();
//   });
// });
// test('select array of strings',async () =>
  //@TODO: support for properties that return multiple literals
  // Perhaps first change the TraceShape so that it runs on PropertyShapes
  // And also simplify QueryPrimitive
  // And also see if we can entirely remove implementation of get/set methods (for testing rely on quads or on .create() before .update())
  /*
  // PatchedQueryPromise<QueryBuilderObject<string[],QShape<Person,null,''>,'nickNames'>[],Person>
  //PatchedQueryPromise<QueryPrimitiveSet<QueryString<QShape<Person,null,''>,'nickNames'>,string,QShape<Person,null,''>,'nickNames'>[],Person>
  // PatchedQueryPromise<unknown[],Person>
  //QueryPrimitiveSet<QueryString<QShape<Person,null,''>,'nickNames'>,string,QShape<Person,null,''>,'nickNames'> --> unknown
  const qRes2 = await Person.select((p) => {
    let res = [p.nickNames];
    return res;
  }).where(p => p.name.equals('Semmy'));
  expect(qRes2[0]).toBeDefined();
  expect(Array.isArray(qRes2[0].nickNames)).toBeTruthy();
  expect(qRes2[0].nickNames[0]).toEqual('Sem');
  expect(qRes2[0].nickNames[1]).toEqual('Smiley');*/

// })
test('update query 1 - with simple object argument', async () => {

  const originalHobby = p1.hobby || 'Dancing';
  const res = await Person.update(p1,{
    hobby: 'Gaming',
  });

  //check that the result object is correct
  expect(res.id).toBeDefined()
  expect(typeof res.id).toBe('string')
  expect(res.id).toEqual(p1.uri)
  expect(res.hobby).toBeDefined()
  expect(res['name']).toBeUndefined();

  //check that it's indeed changed in the database
  let qRes = await Person.select((p) => [p.hobby,p.name]).where(p => p.name.equals('Semmy'));
  expect(qRes[0]).toBeDefined();
  // expect((qRes[0] as any).name).toBe(undefined);
  expect(qRes[0].id).toBe(p1.uri);
  expect(qRes[0].hobby).toBe('Gaming');

  //now change back again
  let updateRes2 = await Person.update(p1,{
    hobby: originalHobby
  });
  expect(updateRes2.hobby).toBe(originalHobby);

  //and check result in db
  let qRes2 = await Person.select((p) => [p.hobby,p.name]).where(p => p.name.equals('Semmy'));
  expect(qRes2[0]).toBeDefined();
  expect(qRes2[0].hobby).toBe(originalHobby);
});

  test('update query 2 - overwrite a set (default)', async () => {

    let res = await Person.update(p1,{
      friends: [{
        name: 'NewFriend',
      }]
    });

    //check that the result object is correct
    expect(res.id).toBeDefined()
    expect(typeof res.id).toBe('string')
    expect(res.id).toEqual(p1.uri)
    expect(res.friends).toBeDefined();
    //check if res.friends is an object (not an array)
    expect(typeof res.friends).toBe('object');
    expect(Array.isArray(res.friends)).toBe(false);
    expect(res.friends.updatedTo).toBeDefined();
    expect(Array.isArray(res.friends.updatedTo)).toBe(true);
    expect(typeof res.friends.updatedTo[0].id).toBe('string');
    expect(res.friends.updatedTo[0].name).toBe('NewFriend');

    //reselect the new friend
    let qRes2 = await Person.select((p) => {
      return p.friends.name;
    }).where((p) => {
      return p.name.equals(p1.name);
    });

    expect(qRes2[0]).toBeDefined();
    expect(Array.isArray(qRes2[0].friends)).toBeTruthy();
    expect(qRes2[0].friends[0].name).toBe('NewFriend');

  });

  test('update query 3 - unset a single value property', async () => {
    const originalHobby = p1.hobby;

    const res = await Person.update(p1, {
      hobby: undefined
    });

    // Check result object
    expect(res.id).toBeDefined();
    expect(res.id).toEqual(p1.uri);
    expect(res.hobby).toBeUndefined();

    // Check database
    let qRes = await Person.select(p1,p => p.hobby)
      // .where((p) => p.uri.equals(p1.uri));
    expect(qRes).toBeDefined();
    expect(qRes.hobby).toBeUndefined();

    // Restore original value
    await Person.update(p1, { hobby: originalHobby });

    let qRes2 = await Person.select(p1, p => p.hobby)
      // .where((p) => p.uri.equals(p1.uri));
    expect(qRes2).toBeDefined();
    expect(qRes2.hobby).toEqual(originalHobby);
  });

  test('update query 4 - overwrite a nested object argument', async () => {

    let tp = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p5-test-person');
    tp.name = 'Unnamed person';
    tp.set(hasFriend,p1.namedNode);
    tp.set(hasFriend,p2.namedNode);

    let qRes = await Person.select(tp,(p) => p.friends);
    expect(qRes.friends).toBeDefined();
    expect(qRes.friends.length).toEqual(2);

    const res = await Person.update(tp,{
      name: 'Such Name',
      friends:[{
        name:'Much Friend'
      }]
    });

    //check that the result object is correct
    expect(res.id).toBeDefined();
    expect(typeof res.id).toBe('string');
    expect(res.id).toEqual(tp.uri);
    expect(res['hobby']).toBeUndefined();
    expect(res.friends).toBeDefined();
    expect(res.friends.updatedTo.length).toEqual(1);
    let firstFriend = res.friends.updatedTo[0];
    expect(firstFriend.name).toEqual('Much Friend');
    expect(firstFriend.id).toBeDefined();
  });
  test('update query 5 - pass id references', async () => {
    let tp = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'uq5');
    tp.set(hasFriend,p1.namedNode);
    tp.set(hasFriend,p2.namedNode);

    let res = await Person.update(tp,{
      hobby: 'Gaming',
      bestFriend: {
        id:p2.uri,
      },
      friends:[{
        id:p2.uri
      },{
        id:p3.uri
      },{
        name:"New Friend"
      }]
    });

    //check that the result object is correct
    expect(res.id).toBeDefined()
    expect(typeof res.id).toBe('string')
    expect(res.hobby).toBeDefined()
    expect(res.hobby).toEqual('Gaming')
    expect(res['name']).toBeUndefined();
    expect(res.bestFriend).toBeDefined();
    expect(res.bestFriend.id).toEqual(p2.uri);
    expect(Array.isArray(res.friends.updatedTo)).toBeTruthy();
    expect(res.friends.updatedTo.length).toEqual(3);

    let f1 = res.friends.updatedTo[0];
    expect(f1.id).toEqual(p2.uri);

    let f2 = res.friends.updatedTo[1];
    expect(f2.id).toEqual(p3.uri);

    let f3 = res.friends.updatedTo[2];
    expect(f3.name).toEqual('New Friend');

    //check that it's indeed changed in the database
    let res2 = await Person.select(tp,(p) => [
      p.bestFriend,
      p.friends.name,
    ]);
    expect(res2.id).toBe(tp.uri);
    expect(res2.bestFriend).toBeDefined();
    expect(res2.bestFriend.id).toEqual(p2.uri);
    expect(res2.friends).toBeDefined();
    expect(res2.friends.length).toEqual(3);
    expect(res2.friends[0].id).toEqual(p2.uri);
    expect(res2.friends[0].name).toBeDefined();
    expect(res2.friends[0].name).toEqual(p2.name);
    expect(res2.friends[1].id).toEqual(p3.uri);
    let f3b = res2.friends[2];
    expect(f3b.name).toEqual('New Friend');

  });

  test('update query 6 - add to Multi-Value Property (friends)', async () => {
    const res = await Person.update(p1, {
      friends: {
        add: { name: 'Friend Added' },
      },
    });

    expect(res.id).toBe(p1.uri);
    expect(res.friends.added.some((f) => f.name === 'Friend Added')).toBe(true);

    // Cleanup
    const res2 = await Person.update(p1, {
      friends: {
        remove: {
          id: res.friends.added[0].id
        },
      },
    });
    //expect removed friend to be returned
    expect(res2.friends.removed.some((f) => f.id === res.friends.added[0].id)).toBe(true);

    //check its removed
    let qRes = await Person.select(p1, (p) => p.friends.name);
    expect(qRes.friends.some((f) => f.name === 'Friend Added')).toBe(false);
  });
  //
  // test('update query 7 - $remove from Multi-Value Property (friends)', async () => {
  //   // First, ensure p2 is a friend
  //   await Person.update(p1, {
  //     friends: {
  //       $add: { id: p2.uri },
  //     },
  //   });
  //
  //   let verifyAdd = await Person.select(p1, (p) => p.friends);
  //   expect(verifyAdd.friends.some((f) => f.id === p2.uri)).toBe(true);
  //
  //   const res = await Person.update(p1, {
  //     friends: {
  //       $remove: p2.uri,
  //     },
  //   });
  //
  //   expect(res.id).toBe(p1.uri);
  //   expect(res.friends.some((f) => f.id === p2.uri)).toBe(false);
  // });
  //
  // test('update query 8 - $add and $remove in same update', async () => {
  //   await Person.update(p1, {
  //     friends: {
  //       $add: { id: p2.uri },
  //     },
  //   });
  //
  //   const res = await Person.update(p1, {
  //     friends: {
  //       $add: { name: 'Combined Friend' },
  //       $remove: p2.uri,
  //     },
  //   });
  //
  //   expect(res.id).toBe(p1.uri);
  //   expect(res.friends.some((f) => f.name === 'Combined Friend')).toBe(true);
  //   expect(res.friends.some((f) => f.id === p2.uri)).toBe(false);
  //
  //   // Cleanup
  //   await Person.update(p1, {
  //     friends: {
  //       $remove: res.friends.find((f) => f.name === 'Combined Friend')?.id,
  //     },
  //   });
  // });
  //
  // test('update query 9 - unset Multi-Value Property with undefined', async () => {
  //   // First, make sure p1 has some friends
  //   await Person.update(p1, {
  //     friends: [
  //       { id: p2.uri },
  //       { id: p3.uri },
  //     ],
  //   });
  //
  //   const res = await Person.update(p1, {
  //     friends: undefined,
  //   });
  //
  //   expect(res.id).toBe(p1.uri);
  //   expect(Array.isArray(res.friends)).toBe(true);
  //   expect(res.friends.length).toBe(0);
  // });

  // test('update query 6 - function-based set single property', async () => {
  //   const originalHobby = p1.hobby || 'Swimming';
  //
  //   const res = await Person.update(p1, (p) => {
  //     return [p.hobby = 'Skating'];
  //   });
  //
  //   expect(res.id).toEqual(p1.uri);
  //   expect(res.hobby).toBe('Skating');
  //
  //   const qRes = await Person.select(p1, p => p.hobby);
  //   expect(qRes.hobby).toBe('Skating');
  //
  //   await Person.update(p1, p => [p.hobby = originalHobby]);
  // });
  // test('update query 7 - function-based unset single property', async () => {
  //   const originalHobby = p1.hobby;
  //
  //   const res = await Person.update(p1, (p) => {
  //     return [p.hobby = undefined];
  //   });
  //
  //   expect(res.hobby).toBeUndefined();
  //
  //   const qRes = await Person.select(p1, p => p.hobby);
  //   expect(qRes.hobby).toBeUndefined();
  //
  //   await Person.update(p1, p => [p.hobby = originalHobby]);
  // });
  //
  // test('update query 8 - function-based overwrite Multi-Value Property', async () => {
  //   const res = await Person.update(p1, (p) => {
  //     return [
  //       p.friends = [{ name: 'New Pal' }]
  //     ];
  //   });
  //
  //   expect(res.friends.length).toBe(1);
  //   expect(res.friends[0].name).toBe('New Pal');
  //
  //   const qRes = await Person.select(p1, p => p.friends.name);
  //   expect(qRes.friends.length).toBe(1);
  //   expect(qRes.friends[0].name).toBe('New Pal');
  // });
  //
  // test('update query 10 - function-based remove from Multi-Value Property', async () => {
  //   const resAdd = await Person.update(p1, p => [
  //     p.friends.add({ name: 'TempRemove' })
  //   ]);
  //   const toRemove = resAdd.friends.find(f => f.name === 'TempRemove');
  //   expect(toRemove).toBeDefined();
  //
  //   const res = await Person.update(p1, (p) => {
  //     return [
  //       p.friends.remove(toRemove.id)
  //     ];
  //   });
  //
  //   const qRes = await Person.select(p1, p => p.friends.name);
  //   expect(qRes.friends.find(f => f.name === 'TempRemove')).toBeUndefined();
  // });
  //
  // test('update query 11 - function-based nested update of bestFriend', async () => {
  //   let res = await Person.update(p1, (p) => {
  //     return [
  //       p.bestFriend = { name: 'Bestie McBestFace' }
  //     ];
  //   });
  //
  //   expect(res.bestFriend).toBeDefined();
  //   expect(res.bestFriend.name).toBe('Bestie McBestFace');
  //
  //   let qRes = await Person.select(p1, p => p.bestFriend.name);
  //   expect(qRes.bestFriend.name).toBe('Bestie McBestFace');
  // });



// test('update query with object argument', async () => {
//   const res = await Person.update(p1,{
//     hobby: 'Gaming',
//     friends: [{
//       name: 'Jinx',
//       friends:[{
//         name:'Friend 1',
//         friends:[{
//           name:'Nested friend'
//         }]
//       },{
//         //it should be possible to pass an object with just the ID
//         id:p4.uri
//       },{
//         name:'Friend 2'
//       }]
//       // name2:'asdf',
//       // clone: true,
//       // targetClass:Person,
//       // namedNode:null,
//     }]
//   });
//   //queryObject will be
//   //{
//   //   id: p1.uri,
//   //   type:'update',
//   //   fields: [
//   //     {field: hobbyPropShape, value: 'Gaming'},
//   //     {field: friendsPropShape, value: [
//   //       "string alsp possible here",
//   //       [or an array of PropertyValueUpdate]
//   //       {id:singleItemURI} //<-- or a reference to a node
//   //     ]}
//   //   ]
//   //}
//   //so fields is an array of 3 different types of objects
//   //1. A single value that converts to a literal (string, number, boolean, Date)
//   //2. An array of PropertyValueUpdate objects
//   //3. An object with 'id', which is a reference to a node
//
//   //check that the result object is correct
//   expect(res.id).toBeDefined()
//   expect(typeof res.id).toBe('string')
//   expect(res.hobby).toBeDefined()
//   expect(res['name']).toBeUndefined();
//   let f1 = res.friends[0];
//   expect(f1.id).toBeDefined();
//   expect(f1.name).toBeDefined();
//   expect(Array.isArray(f1.friends)).toEqual(true);
//   let f2 = f1.friends[0];
//   expect(f2.id).toBeDefined();
//   expect(f2.name).toBeDefined();
//   expect(Array.isArray(f2.friends)).toEqual(true);
//   let f3 = f2.friends && f2.friends[0];
//   expect(f2.friends[0].id).toBeDefined();
//   expect(f2.friends[0].name).toBeDefined();
//   expect(f1.friends[1].id).toBeDefined();
//   expect(f1.friends[1].name).toBeUndefined();
//   // expect(f1.friends[1].friends).toUnBeDefined();
//   expect(f1.friends[0].id).toBeDefined();
//   expect(f1.friends[1].name).toBeUndefined();
//
//   let qRes = await Person.select((p) => [p.name,p.hobby]).where(p => p.name.equals('Semmy'));
//   expect(qRes[0].name).toBe('Semmy');
//   expect(qRes[0].hobby).toBe('Gaming');
//
//   //now change again
//   await Person.update(p1.uri,{
//     hobby: 'Jogging'
//   });
//   let res2 = await Person.select((p) => [p.name,p.hobby]).where(p => p.name.equals('Semmy'));
//   expect(res2[0].hobby).toBe('Jogging');
// });

test('update query with update function', async () => {
  // const res = await Person.update(p1,p => {
  //   p.hobby = 'Gaming';
  //   p.friends.add(p2.uri);
  // });
  // expect(res.id).toBeDefined()
  // expect(res.hobby).toBeDefined()
  // expect(res['name']).toBeUndefined()
  // expect(res.friends[0].id).toBeDefined()
  // expect(res.friends[0].name).toBeDefined()
  //
  // let qRes = await Person.select((p) => [p.name,p.hobby]).where(p => p.name.equals('Semmy'));
  // expect(qRes[0].name).toBe('Semmy');
  // expect(qRes[0].hobby).toBe('Gaming');
  //
  // //now change again
  // await Person.update(p1.uri,{
  //   hobby: 'Jogging'
  // });
  // let res2 = await Person.select((p) => [p.name,p.hobby]).where(p => p.name.equals('Semmy'));
  // expect(res2[0].hobby).toBe('Jogging');
});

});


//NEXT:
//bring back flat
//Refactor duplicate value in "every"
//Refactor firstPath into an array
//FLAT: old, but keep
// // test('can select sub properties of a first property that returns a set - FLAT result', () => {
// //   let q = Person.select((p) => {
// //     return p.friends.name;
// //   });
// //   let namesOfFriends = resolveLocalFlat(q);
// //   expect(Array.isArray(namesOfFriends)).toBe(true);
// //   expect(namesOfFriends.length).toBe(3);
// //   expect(namesOfFriends.includes('Jinx')).toBe(true);
// //   expect(namesOfFriends.includes('Semmy')).toBe(false);
// // });
//OLD syntax, no longer supported because what would we return? too vague
// test('some without where', async () => {
//   let booleansResult = await Person.select((p) => {
//     return p.friends.some((f) => f.name.equals('Moa'));
//   });
//   expect(Array.isArray(booleansResult)).toBe(true);
//   expect(booleansResult.every((b) => typeof b === 'boolean')).toBe(true);
//   //1 person (person1) has a friend called Moa, so there is only one 'true' value
//   expect(booleansResult[0]).toBe(true);
//   // expect(booleansResult.filter((b) => b === true).length).toBe(1);
// });
// });

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
// [['ubud', 'wateringen', 'etc'], 'Mike'];
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
