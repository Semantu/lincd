# LINCD.js
<span style="color:gray; font-size:1.3rem">**L**inked **IN**teropeable **C**ode & **D**ata</span>
### **All the tools you need to build [Linked Data](https://www.w3.org/standards/semanticweb/data) applications with React**

LINCD.js is a modern TypeScript library for building React applications powered by RDF and SHACL Shapes. Create clean, type-safe code that queries, creates, updates, and deletes linked data through object-oriented APIs, with automatic data loading and reactive components.

> New to Linked Data? It is a [W3C standard](https://www.w3.org/standards/semanticweb/data) based on [RDF](https://www.w3.org/RDF/) used to build interconnected knowledge graphs. It is also known
> as [Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) which can
> help search engines to present rich snippets in search results.

LINCD.js is compatible with the [RDFJS data model](https://github.com/rdfjs/data-model-spec)

See also
- [documentation](https://docs.lincd.org)
- [examples](https://lincd.org/examples)
- [registry](https://www.lincd.org)

## LINCD offers:

- **[Schema-Parameterized Query DSL](#schema-parameterized-query-dsl)**: TypeScript-embedded declarative query language that compiles to backends like SPARQL
- **[Shape Classes](#shapes)**: TypeScript classes that generate SHACL shapes for validation and OO data access
- **[Object-Oriented Data Operations](#queries-create-update-delete)**: Query, create, update, and delete RDF data using clean OO code
- **[Automatic Data Loading](#automatic-data-loading)**: Flexible storage layer supporting multiple backends with automatic data fetching
- **[React Linked Components](#react-linked-components)**: Components tied to queries that automatically load data and convert results to props
- **[Reactive Queries](#reactive-queries)**: Query-level reactivity with automatic component updates when shared data changes
- **[Automatic Data Validation](#automatic-data-validation)**: Data validated against SHACL shapes automatically
- **[A registry of plug & play UI components, shapes & ontologies](https://www.lincd.org)**

## Why?

LINCD is built from the ground up with a modern tech stack and integrates the latest developments.
This allows us to offer advanced features that go beyond other existing [RDF JavaScript libraries](https://rdf.js.org/).
Whilst also offering solutions for some major challenges in the world of Linked Data:

### Making Linked Data app development easy

Graph databases are [being](https://business-of-data.com/articles/graph-databases/) [adopted](https://www.techtarget.com/searchbusinessanalytics/news/252507769/Gartner-predicts-exponential-growth-of-graph-technology) [everywhere](https://www.computerweekly.com/news/252524802/How-graph-technology-is-making-a-dent-in-the-database-market). Tons of [Open Linked Data](https://lod-cloud.net/) is being published.
Tools have matured, but the learning curve for developers is still steep.

LINCD significantly reduces the amount of learning required and makes it _much_ easier to work with Linked Data.

### Reusable code for Linked Data

There are tons of ontologies (reusable linked data structures) available. But without a good searchable registry, it's hard to find the right one. And starting to use a specific ontology can be time-consuming still.
Reusable UI components built specifically for Linked Data are virtually non-existent. 

[LINCD.org](https://www.lincd.org) offers an open registry of quality ontologies and UI components built for those ontologies. Each of these ontology and components can be imported and used with just a few lines of code. 
This library makes it easy to develop and share such ontologies and components in the registry.

### Solving data validation & more

Another hurdle in the adoption of Linked Data has been the openness of the RDF model.
With a lack of proper data restriction and data validation tools, maintaining a clean dataset in real life applications
has been a challenge.
W3C has since published [SHACL](https://www.w3.org/TR/shacl/), which is an excellent standard to tackle this. However,
the tools to work with SHACL have been minimal.

LINCD goes full in on SHACL and places SHACL's data "Shapes" right at the center of development. This creates much
simpler and cleaner code, frees developers up from thinking about which classes & properties to use and allows us to
offer advanced features like automatic data loading and data validation that to our knowledge no other Linked Data library or framework offers.

## Installation

**npm + node.js**
```bash
npm install lincd
```

```typescript
import { Shape, linkedComponent } from 'lincd';
```

See [this tutorial](https://docs.lincd.org/docs/category/tutorial---linked-data) on how to build linked data applications with LINCD.js

## LINCD Package Setup

LINCD packages expose shapes, components, utilities, and ontologies through a small `package.ts` file. This makes module exports discoverable across LINCD modules and enables linked decorators.

**Minimal `package.ts`**
```typescript
import { linkedPackage } from 'lincd/utils/Package';

export const {
  linkedComponent,
  linkedSetComponent,
  linkedShape,
  linkedUtil,
  linkedOntology,
  registerPackageExport,
  registerPackageModule,
  packageExports,
  getPackageShape,
} = linkedPackage('my-package-name');
```

**Decorators and helpers**
- `@linkedShape`: registers a Shape class and generates a SHACL shape
- `linkedComponent`, `linkedSetComponent`: bind React components to Shapes
- `@linkedUtil`: exposes utilities to other LINCD modules
- `linkedOntology(...)`: registers an ontology and (optionally) its data loader
- `registerPackageExport(...)`: manually export something into the LINCD package tree
- `registerPackageModule(...)`: lower-level module registration
- `getPackageShape(...)`: resolve a Shape class by name to avoid circular imports

## Shapes

LINCD introduces Shape classes that generate SHACL Shapes.

These classes enable automatic data validation and abstract away RDF implementation details.

Consider this example shape:

#### Definition
```typescript
@linkedShape
export class Person extends Shape {
 /**
  * indicates that instances of this shape need to have this rdf.type
  */
  static targetClass: NamedNode = foaf.Person;

 /**
  * instances of this person shape are REQUIRED to have exactly one foaf.name property
  */
  @literalProperty({
    path: foaf.name,
    required: true,
    maxCount: 1,
  })
  get name() {
    return this.getValue(foaf.name);
  }
  set name(val: string) {
    this.overwrite(foaf.name, new Literal(val));
  }

  /**
   * values of the property foaf.knows needs to be valid instances of this Person shape as well
   */
  @objectProperty({
    path: foaf.knows,
    shape: Person,
  })
  get knows(): ShapeSet<Person> {
    return Person.getSetOf(this.getAll(foaf.knows));
  }
}
```

#### Property decorators

- `@literalProperty(...)`: link a getter/setter to a literal value (e.g. string, number, boolean, date)
- `@objectProperty(...)`: link a getter/setter to a node value (and optionally a Shape via `shape:`)
- `@linkedProperty(...)`: low-level variant used by the above decorators

Common config fields: `path`, `required`, `minCount`, `maxCount`, `datatype`, `shape`, `nodeKind`

#### Usage

Now when we use the shape above, we can simply use plain and simple object-oriented code. 
The code below creates RDF triples in the graph, but it ***does not need to know about any specific RDF properties or classes*** to use.

Instead, it simply uses the accessors from the Shape.

Furthermore, the shape class allows us to validate our graph. This happens automatically when visualizing specific shapes from the graph with [Linked Components](#react-linked-components)

```typescript
let person = new Person();
person.name = "Rene";

let person2 = new Person();
person2.name = "Jenny";

person.knows.add(person2);

//both persons are valid instances of Person
console.log(Person.validate(person)); //true
console.log(Person.validate(person2));//true
```

## Queries: Create, Select, Update, Delete

LINCD provides object-oriented methods for creating, querying, updating, and deleting RDF data:

### Create

```typescript
let newPerson = await Person.create({
  name: 'Alice',
  knows: [{id: existingPerson.id}]
});

let withFriends = await Person.create({
  name: 'Test With Friends',
  friends: [
    {name: 'Brand New Friend'},
    {id: existingPerson.id},
  ],
});

let fixedId = await Person.create({
  __id: 'http://example.com/#person-1',
  name: 'Fixed ID',
});
```

### Select

## Schema-Parameterized Query DSL

LINCD Queries is a TypeScript-embedded declarative query language that compiles its query AST to backends like SPARQL. You define your own SHACL shape schemas, making the DSL **schema-parameterized** and domain-agnostic — you apply the generic DSL to your specific domain.

The query language provides a type-safe, object-oriented interface that works with any domain through custom Shape classes. Below is the **current** set of query features (based on `query-tests.tsx`):

### Query DSL Reference (current)

- [Basic selection](#query-basic-selection)
- [Targeting a specific subject](#query-target-specific-subject)
- [Multiple paths and mixed results](#query-multiple-paths)
- [Nested paths (deep selection)](#query-nested-paths)
- [Sub-queries](#query-sub-queries)
- [Filtering with where + equals](#query-where-equals)
- [AND/OR combinations](#query-and-or)
- [Filtering sets with where/some/every](#query-set-filtering)
- [Outer where chaining](#query-outer-where)
- [Aggregations with size()](#query-size)
- [Custom result objects](#query-custom-results)
- [Type casting with as(Shape)](#query-as)
- [Sorting, limiting, one()](#query-sort-limit-one)
- [Query context variables](#query-context)
- [Preloading for linked components](#query-preload)

#### Query Basic Selection

Select literal, object, date, and boolean properties. Undefined properties return `null` in results.

```typescript
let names = await Person.select(p => p.name);
let friends = await Person.select(p => p.friends);
let dates = await Person.select(p => [p.birthDate, p.name]);
let flags = await Person.select(p => p.isRealPerson);
```

#### Query Target Specific Subject

Select against a single subject by instance or `{id}`, and handle missing nodes.

```typescript
let a = await Person.select(p1, p => p.name);
let b = await Person.select({id: p1.uri}, p => p.name);
let missing = await Person.select({id: 'https://does.not/exist'}, p => p.name); // undefined
```

#### Query Multiple Paths

Mix multiple property paths in a single selection.

```typescript
let res = await Person.select(p => [p.name, p.friends, p.bestFriend.name]);
```

#### Query Nested Paths

Select nested sets and deep property paths.

```typescript
let friendsNames = await Person.select(p => p.friends.name);
let friendsOfFriends = await Person.select(p => p.friends.friends);
let deep = await Person.select(p => p.friends.friends.friends);
```

#### Query Sub-Queries

Use `.select(...)` on a set or single object property to shape nested results.

```typescript
let detailedFriends = await Person.select(p =>
  p.friends.select(f => ({ name: f.name, hobby: f.hobby }))
);

let bestFriendProps = await Person.select(p =>
  p.bestFriend.select(f => ({ name: f.name }))
);
```

#### Query Where Equals

Filter by property values and compare to literals or other query values.

```typescript
let filtered = await Person.select().where(p => p.name.equals('Semmy'));
let hobbies = await Person.select(p => p.hobby.where(h => h.equals(p2.hobby)));
let hasBestFriend = await Person.select().where(p => p.bestFriend.equals({id: p3.uri}));
let nameFilter = await Person.select(p =>
  p.name.where(n => n.equals('Semmy'))
);
```

#### Query And Or

Combine where clauses with `and` / `or`.

```typescript
let friends = await Person.select(p =>
  p.friends.where(f => f.name.equals('Moa').and(f.hobby.equals('Jogging')))
);

let orFriends = await Person.select(p =>
  p.friends.where(f => f.name.equals('Jinx').or(f.hobby.equals('Jogging')))
);
```

#### Query Set Filtering

Filter sets with `.where(...)`, or use quantifiers with `.some(...)` and `.every(...)`.
Implicit `some()` is supported on set paths.

```typescript
let friendsCalledMoa = await Person.select(p =>
  p.friends.where(f => f.name.equals('Moa'))
);

let implicitSome = await Person.select().where(p => p.friends.name.equals('Moa'));
let explicitSome = await Person.select().where(p =>
  p.friends.some(f => f.name.equals('Moa'))
);
let allFriends = await Person.select().where(p =>
  p.friends.every(f => f.name.equals('Moa').or(f.name.equals('Jinx')))
);
```

#### Query Outer Where

Chain `.where(...)` after `.select(...)` to filter the outer result set.

```typescript
let friendsOfP1 = await Person.select(p => p.friends.name).where(p =>
  p.name.equals(p1.name)
);
```

#### Query Size

Use `.size()` to count items in a set (including nested sets).

```typescript
let numFriends = await Person.select(p => p.friends.size());
let numFriends2 = await Person.select(p => p.friends.friends.size());
```

#### Query Custom Results

Return custom objects with computed booleans, counts, and mixed fields.

```typescript
let custom = await Person.select(p => ({
  nameIsMoa: p.name.equals('Moa'),
  moaAsFriend: p.friends.some(f => f.name.equals('Moa')),
  numFriends: p.friends.size(),
}));
```

#### Query As

Cast object/sets to a specific Shape to access subclass properties.

```typescript
let guards1 = await Person.select(p => p.pets.as(Dog).guardDogLevel);
let guards2 = await Person.select(p => p.firstPet.as(Dog).guardDogLevel);
```

#### Query Sort Limit One

Sort and limit results, or fetch a single result with `.one()`.

```typescript
let sorted = await Person.select(p => p.name).sortBy(p => p.name, 'ASC');
let limited = await Person.select(p => p.name).limit(1);
let single = await Person.select(p => p.name).where(p => p.name.equals('Semmy')).one();
```

#### Query Context

Use query context variables inside `where` clauses.

```typescript
setQueryContext('user', p3, Person);
let res = await Person.select(p => p.name).where(p =>
  p.bestFriend.equals(getQueryContext('user'))
);
```

#### Query Preload

Preload data for linked components directly from queries.

```typescript
let withChild = await Person.select(p => [
  p.hobby,
  p.bestFriend.preloadFor(ChildComponent),
]);

let withList = await Person.select(p => [
  p.name,
  p.friends.preloadFor(NameList),
]);
```

The query DSL automatically converts to backend query languages (like SPARQL) and executes against your configured storage layer.

### Update

```typescript
await Person.update({id: personId}, {
  name: 'Alice Updated',
  hobby: 'Reading'
});

// Replace a multi-valued property
await Person.update({id: personId}, {
  friends: [{id: friendId}, {name: 'New Friend'}],
});

// Add/remove for multi-valued properties
await Person.update({id: personId}, {
  friends: {
    add: {id: friendId},
    remove: {id: exId},
  },
});

// Unset a multi-valued property
await Person.update({id: personId}, {
  friends: undefined,
});

// Create nested object with predefined ID
await Person.update({id: personId}, {
  bestFriend: {__id: 'http://example.com/#bf-1', name: 'Bestie'},
});
```

### Delete

```typescript
await Person.delete({id: personId});
// or delete multiple
await Person.delete([{id: id1}, {id: id2}]);
```

## Automatic Data Loading

LINCD provides a flexible storage layer that can connect to multiple backend types. Components automatically load the data they need based on their queries — you just specify what data to load, and LINCD handles fetching it from your configured storage.
When you use a Linked Component with a query, LINCD analyzes the query, loads the required data from your configured storage, and converts results into props. The subject of the query depends on the `of` prop you pass to the component. For example, `<PersonCard of={{id: me.id}} />` will automatically load data for the node with that URI.

## React Linked Components

React Linked Components are UI components tied to LINCD queries. They automatically load data from your configured storage, convert query results to props, and handle smart caching.

> Currently LINCD exclusively supports React components, though other libraries may be added in the future.

### Creating a Linked Component

```typescript
import { linkedComponent } from 'lincd';
import { Person } from './shapes/Person';

const PersonCard = linkedComponent(
  Person.query(p => ({ 
    name: p.name, 
    friends: p.friends.name,
    isLoading
  })),
  ({ name, friends }) => {
    return (
      <div>
        <h1>{name}</h1>
        <ul>
          {friends?.map(friend => (
            <li key={friend.id}>{friend.name}</li>
          ))}
        </ul>
      </div>
    );
  }
);
```

### Linked Queries (more examples)

```typescript
// Simple linked query
const PersonName = linkedComponent(
  Person.query(p => p.name),
  ({ name }) => <h1>{name}</h1>
);

// Nested data
const FriendNames = linkedComponent(
  Person.query(p => p.friends.name),
  ({ friends }) => (
    <ul>{friends?.map(f => <li key={f.id}>{f.name}</li>)}</ul>
  )
);

// Filtered friends
const JoggingFriends = linkedComponent(
  Person.query(p =>
    p.friends.where(f => f.hobby.equals('Jogging')).name
  ),
  ({ friends }) => (
    <ul>{friends?.map(f => <li key={f.id}>{f.name}</li>)}</ul>
  )
);

// Counts
const FriendCount = linkedComponent(
  Person.query(p => ({ numFriends: p.friends.size() })),
  ({ numFriends }) => <span>{numFriends}</span>
);

// Custom result object
const PersonSummary = linkedComponent(
  Person.query(p => ({
    nameIsMoa: p.name.equals('Moa'),
    moaAsFriend: p.friends.some(f => f.name.equals('Moa')),
    numFriends: p.friends.size(),
  })),
  ({ nameIsMoa, moaAsFriend, numFriends }) => (
    <div>{nameIsMoa && 'Moa'} {moaAsFriend ? 'has Moa' : 'no Moa'} ({numFriends})</div>
  )
);
```

### Preloading for Linked Components

Use `preloadFor(...)` inside a query to tell LINCD to preload the data required by another linked component.

```typescript
const ChildComponent = linkedComponent(
  Person.query(p => ({ name: p.name, hobby: p.hobby })),
  ({ name, hobby }) => <div>{name} – {hobby}</div>
);

const Parent = linkedComponent(
  Person.query(p => [
    p.hobby,
    p.bestFriend.preloadFor(ChildComponent),
  ]),
  ({ hobby, bestFriend }) => (
    <div>
      <div>Hobby: {hobby}</div>
      {bestFriend && <ChildComponent of={bestFriend} />}
    </div>
  )
);

const NameList = linkedSetComponent(
  Person.query(p => p.name),
  ({ sources }) => <ul>{sources.map(s => <li key={s.id}>{s.name}</li>)}</ul>
);

const WithList = linkedComponent(
  Person.query(p => [
    p.name,
    p.friends.preloadFor(NameList),
  ]),
  ({ friends }) => <NameList of={friends} />
);
```

### Using a Linked Component

```typescript
// Automatically loads data for the specified node
<PersonCard of={{id: 'http://example.com/#me'}} />

// Or with a Shape instance
let person = new Person('http://example.com/#me');
<PersonCard of={person} />
```

### How It Works

1. **Automatic Data Loading**: When the component mounts, LINCD analyzes the query and automatically fetches the required data from your storage backend.

2. **Data Conversion**: Query results are automatically converted to plain JavaScript objects and passed as `linkedData` props.

3. **Smart Caching**: LINCD uses a shape-aware query cache. Components sharing the same shape data will share cached results.

4. **Subject from Props**: The `of` prop determines which node to load data for. You can pass:
   - A `QResult` object: `{id: 'http://example.com/#me'}`
   - A Shape instance: `new Person('http://example.com/#me')`
   - A Node: `NamedNode.getOrCreate('http://example.com/#me')`

## Automatic Data Validation

Once you have linked your component to specific shapes (data structures), LINCD.js ensures that _only those nodes_ in the graph that match with this shape will be allowed to be used with this component.
Because of this, you can rest assured that all the data will be there and in the right format.

That is, `PersonView` will only render once LINCD has confirmed that the provided `person` instance is a valid instance of the `Person` shape. With the `Person` example above, this would mean it has exactly one name defined under `person.name` and `person.knows` returns a set of valid `Person` instances.

Validation happens automatically when:
- Creating new Shape instances
- Loading data from storage
- Using Linked Components
- Executing queries

All operations use your Shape classes and are validated against SHACL constraints.

## Backends and Storage

Backend connectors and storage configuration are under active development and will live in the `lincd-server` package. When you bootstrap an app with `https://www.npmjs.com/package/create-lincd-app`, you’ll see `storage-config` and `config-frontend.ts` files that configure storage, and all LINCD queries resolve against that configured RDF storage.

## A registry of reusable UI components, Shapes & ontologies

[LINCD.org](https://www.lincd.org/) is a registry of components, shapes and ontologies built with LINCD.js. Each of these can be imported and used with a few lines. This is the best place to get started to build an application powered by linked data.

## Documentation

See [docs.lincd.org](https://docs.lincd.org) for the full documentation plus helpful tutorials for LINCD.js 

## Examples

See [lincd.org/examples](https://lincd.org/examples) for a list of examples with source code on github.

## Contributing

To make changes to `lincd.js`, clone this repository and install dependencies with `npm install`.
Then run `npm run dev` to start the development process which watches for source file changes in `src` and automatically
updates the individual transpiled files in the `lib` _and_ the bundles in the `dist` folder.

Alternatively run `npm run build` to build the project just once.

We welcome pull requests.

## License
[MPL v2](https://www.mozilla.org/en-US/MPL/2.0/)
