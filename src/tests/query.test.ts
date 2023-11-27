import {describe, test} from '@jest/globals';
import {Literal, NamedNode} from '../models';
import {Shape} from '../shapes/Shape';
import {literalProperty, objectProperty} from '../utils/ShapeDecorators';
import {linkedShape} from '../package';
import {ShapeSet} from '../collections/ShapeSet';

let personClass = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'Person');
let name = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'name');
let hasFriend = NamedNode.getOrCreate(NamedNode.TEMP_URI_BASE + 'hasFriend');

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
let p3 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p3-jinx');
p3.name = 'Jinx';
let p4 = Person.getFromURI(NamedNode.TEMP_URI_BASE + 'p4-quinn');
p4.name = 'Quinn';

p1.friends.add(p2);
p1.friends.add(p3);
p2.friends.add(p3);
p2.friends.add(p4);

describe('query tests', () => {
  // test('can select a property of all instances', () => {
  //   let names = Person.select((p) => {
  //     return p.name;
  //   }).localResults();
  //   //["name","name"]
  //
  //   expect(Array.isArray(names)).toBe(true);
  //   expect(names.length).toBe(4);
  //   expect(names.includes('Moa')).toBe(true);
  //   expect(names.includes('Mike')).toBe(false);
  // });
  //
  // test('can select sub properties of a first property that returns a set', () => {
  //   let namesOfFriends = Person.select((p) => {
  //     return p.friends.name;
  //   }).localResults();
  //   //[
  //   // ["name1","name2","name3"]
  //   //]
  //
  //   expect(Array.isArray(namesOfFriends)).toBe(true);
  //   expect(namesOfFriends.length).toBe(3);
  //   expect(namesOfFriends.includes('Semmy')).toBe(false);
  //   expect(namesOfFriends.includes('Moa')).toBe(true);
  // });
  //
  // test('can select multiple property paths', () => {
  //   let result = Person.select((p) => {
  //     return [p.name, p.friends.name];
  //   }).localResults();
  //
  //   expect(Array.isArray(result)).toBe(true);
  //   expect(result.length).toBe(2);
  //
  //   let [names, namesOfFriends] = result;
  //   expect(Array.isArray(names)).toBe(true);
  //   expect(names.length).toBe(4);
  //   expect(names.includes('Moa')).toBe(true);
  //   expect(names.includes('Mike')).toBe(false);
  //   expect(Array.isArray(namesOfFriends)).toBe(true);
  //   expect(namesOfFriends.length).toBe(3);
  //   expect(namesOfFriends.includes('Semmy')).toBe(false);
  //   expect(namesOfFriends.includes('Moa')).toBe(true);
  // });
  //
  // test('can filter a string in a set of Literals with equals', () => {
  //   //we select the friends of all persons, but only those friends whose name is moa
  //   //this will return an array, where each entry represents the results for a single person.
  //   // the entry contains those friends of the person whose name is Moa - (as a set of persons)
  //   let friendsCalledMoa = Person.select((p) => {
  //     return p.friends.where((f) => f.name.equals('Moa'));
  //   }).localResults();
  //
  //   expect(friendsCalledMoa instanceof ShapeSet).toBe(true);
  //   expect(friendsCalledMoa.size).toBe(1);
  //   expect(friendsCalledMoa.first().namedNode).toBe(p2.namedNode);
  // });

  test('can select nested paths', () => {
    //we select the friends of all persons, but only those friends whose name is moa
    //this will return an array, where each entry represents the results for a single person.
    // the entry contains those friends of the person whose name is Moa - (as a set of persons)
    let level2Friends = Person.select((p) => {
      return p.friends.friends;
    }).localResults();

    let level3Friends = Person.select((p) => {
      return p.friends.friends.friends;
    }).localResults();

    expect(level2Friends instanceof ShapeSet).toBe(true);
    expect(level2Friends.size).toBe(2);
    expect(level2Friends.some((f) => f.namedNode === p3.namedNode)).toBe(true);
    expect(level2Friends.some((f) => f.namedNode === p4.namedNode)).toBe(true);

    expect(level3Friends instanceof ShapeSet).toBe(true);
    expect(level3Friends.size).toBe(0);
  });
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
