/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from './NamedNode';
import {QuadSet} from '../collections/QuadSet';
import {Quad} from './Quad';
import {CoreMap} from '../collections/CoreMap';
import {Term} from 'rdflib/lib/tf-types';

export class Graph implements Term {
	private static graphs: CoreMap<string, Graph> = new CoreMap<string, Graph>();
	private quads: QuadSet;
	private _node: NamedNode;
	termType: string = 'Graph';

	constructor(public value: string, quads?: QuadSet) {
		this._node = NamedNode.getOrCreate(value);
		this.quads = quads ? quads : new QuadSet();
	}

	equals(other: Term) {
		return other === this;
	}

	get node(): NamedNode {
		return this._node;
	}

	//Static methods
	/**
	 * Resets the map of resources that is known in this environment
	 */
	static reset() {
		this.graphs = new CoreMap<string, Graph>();
	}

	registerQuad(quad: Quad) {
		this.quads.add(quad);
	}

	hasQuad(quad: Quad) {
		return this.quads.has(quad);
	}

	//Note: cannot name this getQuads, because NamedNode already uses that for getting all quads of all its properties
	getContents(): QuadSet {
		return this.quads;
	}

	toString() {
		return (
			'Graph: [' +
			this.node.uri.toString() +
			' - ' +
			this.quads.size +
			' quads]'
		);
	}

	static create(quads?: QuadSet): Graph {
		var uri = NamedNode.createNewTempUri();
		return this._create(uri, quads);
	}

	private static _create(uri: string, quads?: QuadSet): Graph {
		var graph = new Graph(uri, quads);
		this.register(graph);
		return graph;
	}

	static register(graph: Graph) {
		if (this.graphs.has(graph.node.uri)) {
			throw new Error(
				'A graph with this URI already exists. You should probably use Graph.getOrCreate instead of Graph.create (' +
					graph.node.uri +
					')',
			);
		}
		this.graphs.set(graph.node.uri, graph);
		// super.register(graph);
	}

	static unregister(graph: Graph) {
		if (!this.graphs.has(graph.node.uri)) {
			throw new Error(
				'This node has already been removed from the registry: ' +
					graph.node.uri,
			);
		}
		this.graphs.delete(graph.node.uri);
		// super.unregister(graph);
	}

	static getOrCreate(uri: string) {
		return this.getGraph(uri) || this._create(uri);
	}

	static getGraph(uri: string, mustExist: boolean = false): Graph | null {
		//look it up in known full uri node map
		if (this.graphs.has(uri)) {
			return this.graphs.get(uri);
		}

		//by default at the moment, quads are not in any graph unless specifically assigned to one
		//this may change whenever we truly need to be able to query the quads in the default graph (that are not in any other named graph)
		//and we will need to think about behaviour, because different stores use different solutions
		//is the default graph the combined graph of all graphs + quads without graph? (like GraphDB)
		//or just the graph of quads without graph?
		//and where do inferred quads go to? (currently no graph but we could put them in the right graph)

		if (mustExist) {
			throw Error('could not find graph for: ' + uri);
		}
		return null;
	}

	static updateUri(graph: Graph, uri: string) {
		(graph.node as NamedNode).uri = uri;
	}

	static getAll(): CoreMap<string, Graph> {
		return this.graphs;
	}
}
