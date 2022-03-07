#LINCD.js
**Javascript library implementing the [LINCD protocol](https://www.lincd.org).**

## About LINCD
Even today, most projects use their own data structures, thus creating data silos. 
Projects that want to share data need understand each others APIs to extract the right data, and then convert that data using custom code.

LINCD aims to remove these barriers to collaboration and interoperability by creating a place where projects can collectively define shared data structures and shared code.

## About LINCD.js
`LINCD.js` is a lightweight Javascript library that implements the [LINCD protocol](https://www.lincd.org).

With the help of modules built with `lincd.js` you can integrate data from different sources and build visualizations with ease.

### Main Library Features

- Convert your data to Linked Data and validated [SHACL Shapes](https://www.w3.org/TR/shacl/#shapes) with ease
- Access the in-memory graph database with an accessible resource-centric API.
- Observe changes in the graph with the built-in event system
- Abstract away ontologies & RDF specifics in Shape Classes
- Create interface components based on Shape Classes, which abstracts away ontology details from the UI layer  
- Compatible with [RDFJS task force spec](https://github.com/rdfjs/data-model-spec)


### Examples & documentation
Are currently actively developed.
[Signup here](http://eepurl.com/hVBG0n) to be notified as LINCD is launching

[//]: # (## Examples)

[//]: # ()
[//]: # (## Documentation)

[//]: # (- Consuming a LINCD components)

[//]: # ()
[//]: # (### Building your own LINCD Modules)

[//]: # ()
[//]: # (With LINCD.js, you can link code to [SHACL Shapes]&#40;https://www.w3.org/TR/shacl/#shapes&#41;. )

[//]: # ()
[//]: # (By doing so, you make your code easily applicable to anyone who structures their data with these Shapes.)

[//]: # ()
[//]: # (Modules built with LINCD.js can be published to the LINCD repository &#40;with `npm run publish`&#41; which makes your module and it's required data Shapes easy to find and use.  )

[//]: # ()
[//]: # (See the documentation )

[//]: # ()
[//]: # (---)

[//]: # (Create and share code modules across different environments using W3C’s Linked Data standards.)

[//]: # ()
[//]: # ()
[//]: # ()
[//]: # ()
[//]: # (- Link your code to SHACL Shapes)

[//]: # (- )

[//]: # (- )

[//]: # ()
[//]: # (    Reads and writes RDF/XML, Turtle and N3; Reads RDFa and JSON-LD)

[//]: # (    Read/Write Linked Data client, using WebDav or SPARQL/Update)

[//]: # (    Real-Time Collaborative editing with web sockets and PATCHes)

[//]: # (    Local API for querying a store)

[//]: # (    Compatible with RDFJS task force spec)

[//]: # (    SPARQL queries &#40;not full SPARQL - just graph match and optional&#41;)

[//]: # (    Smushing of nodes from owl:sameAs, and owl:{f,inverseF}unctionProperty)

[//]: # (    Tracks provenance of triples keeps metadata &#40;in RDF&#41; from HTTP accesses)

[//]: # ()
[//]: # ()
[//]: # (## LINCD - Linked Interoperable Code & Data)

[//]: # (The LINCD Protocol specifies how )

[//]: # ()
[//]: # ()
[//]: # (## Installation)

[//]: # (```)

[//]: # (npm install lincd)

[//]: # (```)

[//]: # ()
[//]: # (## Usage)

[//]: # (Javascript)

[//]: # (```)

[//]: # (let lincd = require&#40;"lincd"&#41;)

[//]: # (```)

[//]: # ()
[//]: # (Typescript)

[//]: # (```)

[//]: # (import lincd from "lincd")

[//]: # (```)

## Contributing
To make changes to `lincd.js`, clone this repository and install dependencies with `npm install`. 
Then run `npm run dev` to start the development process which watches for source file changes in `src` and automatically updates the individual transpiled files in the `lib` _and_ the bundles in the `dist` folder. 

Alternatively run `npm run build` to build the project just once.

We welcome pull requests.

[//]: # (## LICENSE)

[//]: # ([MPL v2]&#40;https://www.mozilla.org/en-US/MPL/2.0/&#41;)
