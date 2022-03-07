/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreMap} from '../collections/CoreMap';
import {NamedNode} from './NamedNode';
import {Node} from './Node';
import {QuadSet} from '../collections/QuadSet';
import {EventEmitter} from '../events/EventEmitter';
import {eventBatcher} from '../events/EventBatcher';
import {Graph} from './Graph';
import {defaultGraph} from '../index';

export class Quad extends EventEmitter {
	/**
	 * Emitter used by the class itself by static methods emitting events.
	 * Anyone wanting to listen to that should therefore add a listener with Quad.emitter.on(...)
	 * @internal
	 */
	static emitter = new EventEmitter();

	/**
	 * The number of quads active in this system
	 */
	static globalNumQuads: number = 0;

	private static newQuads: QuadSet = new QuadSet();
	private static removedQuads: QuadSet = new QuadSet();

	//altered quads are those that contain changes made by methods of existing Resources as opposed to methods that use Quad.getOrCreate
	//this separation is used for example by automatic storage of changes made due to user input, see storage controllers.
	// private static alteredQuads = new QuadSet();
	private static alteredQuadsRemoved: QuadSet = new QuadSet();
	private static alteredQuadsCreated: QuadSet = new QuadSet();
	private static alteredQuadsUpdated: CoreMap<
		NamedNode,
		CoreMap<NamedNode, [Node, Node]>
	> = new CoreMap(); //NamedNode,string,string]>();

	/**
	 * @internal
	 * emitted when new quads have been created
	 */
	static TRIPLES_CREATED: string = 'TRIPLES_CREATED';

	/**
	 * @internal
	 * emitted when quads have been removed
	 */
	static TRIPLES_REMOVED: string = 'TRIPLES_REMOVED';

	/**
	 * emitted by a quad when that quad is being removed
	 */
	static TRIPLE_REMOVED: string = 'TRIPLE_REMOVED';

	/**
	 * emitted by a quad when the value of that quad is being changed (without removing and creating a new quad locally)
	 */
	static VALUE_CHANGED: string = 'VALUE_CHANGED';

	/**
	 * emitted when quads have been altered by user interaction
	 * @internal
	 */
	static TRIPLES_ALTERED: string = 'TRIPLES_ALTERED';

	private _removed: boolean;
	private _altered: boolean;

	/**
	 * Creates the quad
	 * @param subject - the subject of the quad
	 * @param predicate
	 * @param object
	 */
	constructor(
		public subject: NamedNode,
		public predicate: NamedNode,
		public object: Node,
		public graph: Graph = defaultGraph,
		public implicit: boolean = false,
		alteration: boolean = false,
	) {
		super();

		this.setup(alteration);
	}

	private setup(alteration: boolean = false) {
		// if(this.predicate.uri == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && this.object['uri'] == "http://data.dacore.org/ontologies/core/Editor")
		// {
		// 	debugger;
		// }

		//lets resources take note of this quad in which they occur
		//first of all we overwrite the property this.object with the result of register because a Literal may return a clone
		this.object = this.object.registerInverseProperty(this, alteration);
		this.subject.registerProperty(this, alteration);
		this.predicate.registerAsPredicate(this, alteration);
		this.graph.registerQuad(this);

		//new quad events are batched together and emitted on the next tick
		//so here we make sure the Quad class will emit its batched events on the next tick
		eventBatcher.register(Quad);
		//and here we save this quad to a set of newQuads which is a static property of the Quad class
		Quad.newQuads.add(this);

		//only if its an alteration AND its relevant to storage controllers do we emit the TRIPLES_ALTERED event for this quad
		if (
			alteration &&
			!this.implicit &&
			!this.subject.isLocalResource &&
			!this.predicate.isLocalResource &&
			(!(this.object instanceof NamedNode) ||
				!(this.object as NamedNode).isLocalResource)
		) {
			Quad.alteredQuadsCreated.add(this);
		}
		Quad.globalNumQuads++;
	}

	/**
	 * Turns off a quad. Meaning it will no longer be active in the graph.
	 * Comes in handy in very specific use cases when for example quads have already been created, but you want to check what the state was before these quads were created
	 */
	turnOff() {
		this.subject.unregisterProperty(this, false, false);
		this.predicate.unregisterAsPredicate(this, false, false);
		this.object.unregisterInverseProperty(this, false, false);
	}

	/**
	 * Turns on a quad. Meaning it will be active (again) in the graph.
	 * Only use this if you've had to turn quads off first.
	 */
	turnOn() {
		this.subject.registerProperty(this, false, false);
		this.predicate.registerAsPredicate(this, false, false);
		this.object.registerInverseProperty(this, false, false);
	}

	/**
	 * Turn an implicit quad into an explicit quad (because an explicit user action generated it as an independent explicit fact now)
	 */
	makeExplicit() {
		//unregister and make explicit
		this.turnOff();
		this.implicit = false;
		//re-register and make it an 'alteration' so it will be picked up by the storage
		this.setup(true);
	}

	/**
	 * @internal
	 * Returns true if events of newly created quads or removed quads are currently batched and waiting to be emitted
	 */
	static hasBatchedEvents() {
		return this.newQuads.size > 0 || this.removedQuads.size > 0;
	}

	/**
	 * @internal
	 */
	static emitBatchedEvents() {
		if (this.newQuads.size > 0) {
			this.emitter.emit(Quad.TRIPLES_CREATED, this.newQuads);
			this.newQuads = new QuadSet();
		}
		if (this.removedQuads.size > 0) {
			this.emitter.emit(Quad.TRIPLES_REMOVED, this.removedQuads);
			this.removedQuads = new QuadSet();
		}
		if (
			this.alteredQuadsCreated.size > 0 ||
			this.alteredQuadsRemoved.size > 0 ||
			this.alteredQuadsUpdated.size > 0
		) {
			this.emitter.emit(
				Quad.TRIPLES_ALTERED,
				this.alteredQuadsCreated,
				this.alteredQuadsRemoved,
				this.alteredQuadsUpdated,
			);
			this.alteredQuadsCreated = new QuadSet();
			this.alteredQuadsRemoved = new QuadSet();
			this.alteredQuadsUpdated = new CoreMap();
		}
	}

	/**
	 * Get the existing quad for the given subject,predicate and object, or create it if it didn't exists yet.
	 * @param subject
	 * @param predicate
	 * @param object
	 * @param implicit
	 * @param alteration - states whether this quad has been created by a user interaction (true) or simply because of updated data has been loaded
	 */
	static getOrCreate(
		subject: NamedNode,
		predicate: NamedNode,
		object: Node,
		graph: Graph = defaultGraph,
		implicit: boolean = false,
		alteration: boolean = false,
	) {
		return (
			this.get(subject, predicate, object) ||
			new Quad(subject, predicate, object, graph, implicit, alteration)
		);
	}

	/**
	 * Gets the existing quad for the given subject,predicate and object.
	 * Will return any quad with an equivalent object. See Literal.isEquivalentTo() and NamedNode.isEquivalentTo() for more information.
	 * @param subject
	 * @param predicate
	 * @param object
	 */
	static get(
		subject: NamedNode,
		predicate: NamedNode,
		object: Node,
	): Quad | null {
		if (!subject || !predicate || !object) return null;

		if (subject.has(predicate, object)) {
			//.has will also check equivalent literalresources, but getQuad does not, so if it returns true
			//we need to find the literal that already exists as value of this predicate
			//NOTE: we check if not uriresource because that means its a literalresource, but we dont have to include it in this file (caused dependency circle errors)
			if (!(object instanceof NamedNode)) {
				for (let [key, quad] of subject.getQuads(predicate).entries()) {
					if (object.equals(key)) {
						return quad;
					}
				}
			} else {
				return subject.getQuad(predicate, object);
			}
		}
	}

	/**
	 * Returns true if this quad was created because of a user action/input, as opposed to coming from some data that already existed
	 */
	get altered() {
		return this._altered;
	}

	/**
	 * Listen to change of the quads' literal value.
	 * @param listener
	 */
	onValueChange(listener) {
		this.on(Quad.VALUE_CHANGED, listener);
	}

	/**
	 * Stop listening to value changes
	 * @param listener
	 */
	offValueChange(listener) {
		this.off(Quad.VALUE_CHANGED, listener);
	}

	/**
	 * used by Literal to notify this quad of changes to the literel value of its object, therefor the quad is getting modified
	 * @internal
	 * @param oldValue
	 * @param newValue
	 * @param alteration
	 */
	registerValueChange(
		oldValue: Node,
		newValue: Node,
		alteration: boolean = false,
	) {
		//setting altered = true here, will be reset / deleted by emitting change events
		this._altered = true;
		this.emit(Quad.VALUE_CHANGED, oldValue, newValue, alteration);

		if (
			alteration &&
			!this.implicit &&
			!this.subject.isLocalResource &&
			!this.predicate.isLocalResource &&
			(!(this.object instanceof NamedNode) ||
				!(this.object as NamedNode).isLocalResource)
		) {
			eventBatcher.register(Quad);
			//make sure subject map exists
			if (!Quad.alteredQuadsUpdated.has(this.subject)) {
				Quad.alteredQuadsUpdated.set(this.subject, new CoreMap());
			}
			let map = Quad.alteredQuadsUpdated.get(this.subject);
			//if first time we set a new value for this predicate
			if (!map.has(this.predicate)) {
				//set it
				map.set(this.predicate, [oldValue, newValue]);
			} else {
				//else overwrite with a new array, reusing the old value of last time (so we keep the oldest old value)
				map.set(this.predicate, [map.get(this.predicate)[0], newValue]);
			}
		}
	}

	/**
	 * Remove this quad from the graph
	 * Will be removed both locally and from the graph database
	 * @param alteration
	 */
	remove(alteration: boolean = false): void {
		if (this._removed) return;

		//first set removed is true so event handlers can detect the difference between added or removed values
		this._removed = true;

		this.subject.unregisterProperty(this);
		this.predicate.unregisterAsPredicate(this);
		this.object.unregisterInverseProperty(this);

		//removed quad events are batched together and emitted on the next tick
		//so here we make sure the Quad class will emit its batched events on the next tick
		eventBatcher.register(Quad);
		//and here we save this quad to a set of removedQuads which is a static property of the Quad class
		Quad.removedQuads.add(this);

		if (
			alteration &&
			!this.implicit &&
			!this.subject.isLocalResource &&
			!this.predicate.isLocalResource &&
			(!(this.object instanceof NamedNode) ||
				!(this.object as NamedNode).isLocalResource)
		) {
			Quad.alteredQuadsRemoved.add(this);
		}

		//we need to let this quad emit this event straight away because for example the reasoner needs to listen to this exact quad to retract
		this.emit(Quad.TRIPLE_REMOVED);

		Quad.globalNumQuads--;

		//TODO:remove all event listeners here?
	}

	/**
	 * Cancel the removal of a quad
	 */
	undoRemoval() {
		this.setup();
		this._removed = false;
	}

	/**
	 * Returns true if this quad still exists as an object in memory, but is no longer actively used in the graph
	 */
	get isRemoved(): boolean {
		return this._removed;
	}

	/**
	 * Print this quad as a string
	 */
	toString() {
		return (
			this.subject.toString() +
			' ' +
			this.predicate.toString() +
			' ' +
			this.object.toString()
		);
	}
}
