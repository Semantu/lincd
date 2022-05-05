LINCD internally uses the following indices


| Index | Example |
|-------|---------|
| SPO   | `subject.getAll(predicate) -> objects (NodeSet)`   |
| SPOQ  | `subject.getQuads(predicate) -> quads (QuadSet)`    |
| OPS   | `object.getInverse(predicate) -> subjects (NodeSet<NamedNode>)`        |
| GQ    | `graph.getContents() -> quads (QuadSet)`      |

[ **S**ubject
**P**redicate
**O**bject
**G**raph
**Q**uad ]

