/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Quad} from './Quad';
import {NamedNode} from './NamedNode';
import {NodeSet} from '../collections/NodeSet';
import {QuadMap} from '../collections/QuadMap';
import {QuadArray} from '../collections/QuadArray';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {Node} from './Node';
import {Literal as ILiteral,Term} from 'rdflib/lib/tf-types';
import {IShape} from '../interfaces/IShape';
import {IGraphObject} from '../interfaces/IGraphObject';

declare var dprint: (item, includeIncomingProperties?: boolean) => void;

//cannot import from xsd ontology here without creating circular dependencies
var rdfLangString: NamedNode = NamedNode.getOrCreate(
	'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',
);
var xsdString: NamedNode = NamedNode.getOrCreate(
	'http://www.w3.org/2001/XMLSchema#string',
);

/**
 * One of the two main classes of resources (nodes) in the graph.
 * Literals are endpoints. They do NOT have outgoing connections (edges) to other resources in the graph.
 * Though a NamedNode can point to a Literal.
 * Each literal node has a literal value, like a string.
 * Besides that is can also have a language tag or a data type.
 * Literals are often saved as a single string, for example '"yes"@en' (yes in english) or '"true"^^xsd:boolean (the value true with datatype english)
 * This class represents those properties.
 * See also: https://www.w3.org/TR/rdf-concepts/#section-Graph-Literal
 */
export class Literal extends Node implements IGraphObject, ILiteral {
	private referenceQuad: Quad;

	/**
	 * @internal
	 */
	previousValue: Literal;

	termType: 'Literal' = 'Literal';

	/**
	 * Other than with NamedNodes, its fine to do `new Literal("my string value")`
	 * Datatype and language tags are optional
	 * @param value
	 * @param datatype
	 * @param language
	 */
	constructor(
		value: string,
		protected _datatype: NamedNode = null,
		private _language: string = '',
	) {
		super(value);
	}

	getAs<T extends IShape>(type: {new (): T; getOf(resource: Node): T}): T {
		return type.getOf(this);
	}

	/**
	 * @internal
	 * @param quad
	 */
	registerProperty(quad: Quad): void {
		throw new Error('Literal resources should not be used as subjects');
	}

	/**
	 * registers the use of a quad. Since a quad can only be used in 1 quad
	 * this method makes a clone of the Literal if it's used a second time,
	 * and returns that new Literal so it will be used by the quad
	 * @internal
	 * @param quad
	 */
	registerInverseProperty(quad: Quad): Node {
		if (this.referenceQuad) {
			return this.clone().registerInverseProperty(quad);
			// throw new Error("Literals should not be reused, create a clone instead");
		}
		this.referenceQuad = quad;
		return this;
	}

	/**
	 * @internal
	 * @param quad
	 */
	unregisterProperty(quad: Quad): void {
		throw new Error('Literal resources should not be used as subjects');
	}

	/**
	 * @internal
	 * @param quad
	 */
	unregisterInverseProperty(quad: Quad): void {
		this.referenceQuad = null;
	}

	/**
	 * returns true if this literal node has a language tag
	 */
	hasLanguage(): boolean {
		return this._language != '';
	}

	/**
	 * get the language tag of this literal which states which language this literal is written in
	 * See also: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	 */
	get language(): string {
		//list of language tags: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
		return this._language;
	}

	/**
	 * returns true if the language tag of this literal matches the given language
	 */
	isOfLanguage(language: string) {
		return this._language === language;
	}

	/**
	 * update the language tag of this literal
	 */
	set language(lang: string) {
		this._language = lang;

		//the datatype of any literal with a language tag is rdf:langString
		this._datatype = rdfLangString;
	}

	/**
	 * returns true if this literal has a datatype
	 */
	hasDatatype(): boolean {
		//checks for null and undefined
		return this._datatype != null;
	}

	/**
	 * returns the datatype of this literal
	 * Note that datatypes are NamedNodes themselves, who always have rdf:type rdf:Datatype
	 * If no datatype is set, the default datatype xsd:string will be returned
	 * If a language tag is set, the returned datatype will be rdf:langString
	 */
	get datatype(): NamedNode {
		if (this._datatype) {
			return this._datatype;
		}
		//default datatype is xsd:string, if language is set this.datatype should be langString already
		return xsdString;
	}

	/**
	 * Update the datatype of this literal
	 * @param datatype
	 */
	set datatype(datatype: NamedNode) {
		this._datatype = datatype;
	}

	/**
	 * Return the value of this literal
	 * @param datatype
	 */
	get value(): string {
		return this._value;
	}

	/**
	 * update the literal value of this literal
	 * @param datatype
	 */
	set value(value: string) {
		if (this.referenceQuad) {
			// var oldValue = this.toString();
			//do we also need to save / do this for datatype / language
			if (!this.previousValue) {
				this.previousValue = this.clone();
			}
		}
		this._value = value;
		if (this.referenceQuad) {
			// var newValue = this.toString();
			this.referenceQuad.subject.registerValueChange(this.referenceQuad, true);
			this.referenceQuad.registerValueChange(this.previousValue, this, true);
		}
	}

	/**
	 * Returns true if both are literal resources, with equal literal values, equal language tags and equal data types
	 * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
	 * @param other
	 * @param caseSensitive
	 */
	equals(other: Term): boolean {
		return this._equals(other);
	}

	/**
	 * Returns true if both are literal resources, with equal literal values (CASE INSENSITIVE CHECK), equal language tags and equal data types
	 * Other than NamedNodes, two different literal node instances can be deemed equivalent if all their properties are the same
	 * @param other
	 */

	equalsCaseInsensitive(other: Term) {
		return this._equals(other, false);
	}

	private _equals(other: Term, caseSensitive: boolean = true) {
		if (other === this) return true;

		var valueToMatch: string;
		var languageToMatch: string;
		var dataTypeToMatch: NamedNode;

		if (other instanceof Literal) {
			valueToMatch = other.value;
			languageToMatch = other.language;
			dataTypeToMatch = other.datatype; //direct access to avoid default, alternatively build a boolean parameter 'returnDefault=true' into getDataType()
		} else {
			var type = typeof other;
			if (type == 'string' || type == 'number' || type == 'boolean') {
				//if you don't specify a datatype we accept all
				valueToMatch = other.toString();
				languageToMatch = '';
				dataTypeToMatch = null;
			} else {
				return false;
			}
		}

		//do the actual matching
		var valueMatch: boolean;
		if (caseSensitive) {
			valueMatch = this._value === valueToMatch;
		} else {
			valueMatch =
				this._value.toLocaleLowerCase() == valueToMatch.toLocaleLowerCase();
		}

		//if values match
		if (valueMatch) {
			//if there is a language
			if (this.hasLanguage()) {
				//then only the languages need to match
				return this.language == languageToMatch;
			} else {
				//no language = datatypes need to match
				//we check with this.datatype, not this.datatype which can return the default xsd:String
				//a literal without datatypespecified is however considered different from a a literal with a explicit xsd:String datatype
				//that is, like some SPARQL quad stores, you should be able to create two otherwise identical (sub&pred) quads for those two literals
				return this.datatype === dataTypeToMatch;
			}
		}
		return false;
	}

	/**
	 * Creates a new Literal with exact the same properties (value,datatype and language)
	 */
	clone(): Literal {
		return new Literal(this._value, this.datatype, this.language) as this;
	}

	/**
	 * Returns the literal value of the first Literal that occurs as object for the given subject and property and optionally also matches the given language
	 * @param subject
	 * @param property
	 * @param language
	 * @deprecated
	 * @returns {string|undefined}
	 */
	static getValue(
		subject: NamedNode,
		property: NamedNode,
		language: string = '',
	): string | undefined {
		for (var value of subject.getAll(property)) {
			if (
				value instanceof Literal &&
				(!language || value.isOfLanguage(language))
			) {
				return value.value;
			}
		}
		return undefined;
	}

	/**
	 * Returns all literal values of the Literals that occur as object for the given subject and property and optionally also match the given language
	 * @param subject
	 * @param property
	 * @param language
	 * @returns {string[]}
	 */
	static getValues(
		subject: NamedNode,
		property: NamedNode,
		language: string = '',
	): string[] {
		var res = [];
		for (var value of subject.getAll(property)) {
			if (
				value instanceof Literal &&
				(!language || value.isOfLanguage(language))
			) {
				res.push(value.value);
			}
		}
		return res;
	}

	getReferenceQuad() {
		return this.referenceQuad;
	}
	hasInverseProperty(property: NamedNode): boolean {
		return this.referenceQuad && this.referenceQuad.predicate === property;
	}

	hasInverse(property: NamedNode, value: Node): boolean {
		return (
			this.referenceQuad &&
			this.referenceQuad.predicate === property &&
			this.referenceQuad.subject === value
		);
	}

	getOneInverse(property: NamedNode): NamedNode | undefined {
		return this.referenceQuad && this.referenceQuad.predicate === property
			? this.referenceQuad.subject
			: undefined;
	}

	getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet<NamedNode> {
		if (properties.find((p) => p === this.referenceQuad.predicate)) {
			return new NodeSet<NamedNode>([this.referenceQuad.subject]);
		}
		return new NodeSet<NamedNode>();
	}

	getInverseQuad(property: NamedNode, subject: NamedNode): Quad | undefined {
		return this.referenceQuad &&
			this.referenceQuad.predicate === property &&
			this.referenceQuad.subject === subject
			? this.referenceQuad
			: undefined;
	}

	getInverseQuads(property: NamedNode): QuadMap {
		return this.referenceQuad && this.referenceQuad.predicate === property
			? new QuadMap([[this, this.referenceQuad]])
			: new QuadMap();
	}

	getAllInverseQuads(includeImplicit?: boolean): QuadArray {
		return !includeImplicit || !this.referenceQuad.implicit
			? new QuadArray(this.referenceQuad)
			: new QuadArray();
	}

	getAllQuads(
		includeAsObject: boolean = false,
		includeImplicit: boolean = false,
	): QuadArray {
		return includeAsObject && (!includeImplicit || !this.referenceQuad.implicit)
			? new QuadArray(this.referenceQuad)
			: new QuadArray();
	}

	promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean> {
		return Promise.resolve(true);
	}

	isLoaded(includingInverseProperties: boolean = false): boolean {
		return true;
	}

	toString(): string {
		//quotes are needed to differentiate the literal "http://test.com" from the URI http://test.com, so the literal value is always surrounded by quotes
		//quad quotes are needed in case of newlines
		// let quotes = this._value.indexOf("\n") != -1 ? '"""' : '"';
		let quotes = '"';
		let suffix = '';
		if (this.hasLanguage()) {
			suffix = '@' + this.language;
		} else if (this.hasDatatype()) {
			suffix = '^^<' + this.datatype.uri + '>';
		}
		//quotes in the value need to be escaped
		return (
			quotes +
			this._value.replace(/\"/g, '\\"').replace(/\n/g, '\\n') +
			quotes +
			suffix
		);
	}

	print(includeIncomingProperties: boolean = true) {
		dprint(this, includeIncomingProperties);
	}

	static isLiteralString(literalString: string): boolean {
		var regex = new RegExp(
			'(\\"[^\\"^\\n]*\\")(@[a-z]{1,3}|\\^\\^[a-zA-Z]+\\:[a-zA-Z0-9_-]+|\\<https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)\\>)?',
		);
		return regex.test(literalString);
	}

	static fromString(literalString: string): Literal {
		//self made regex thatL
		// match anything between quotes or quad quotes (the quotes are group 1 and 3)
		// except escaped quotes (2)
		//and everything behind it (4) for language or datatype
		//..with a little help on the escaped quotes from here
		//https://stackoverflow.com/questions/38563414/javascript-regex-to-select-quoted-string-but-not-escape-quotes

		let match = literalString.match(
			/("|""")([^"\\]*(?:\\.[^"\\]*)*)("|""")(.*)/,
		);

		//NOTE: if \n replacement turns out to be not correct here it should at least be moved to JSONLDParser, see https://github.com/digitalbazaar/jsonld.js/issues/242
		let literal = (match[2] ? match[2] : '')
			.replace(/\\"/g, '"')
			.replace(/\\n/g, '\n');
		let suffix = match[4];
		if (!suffix) {
			return new Literal(literal);
		}
		if (suffix[0] == '@') {
			return new Literal(literal, null, suffix.substr(1));
		} else if (suffix[0] == '^') {
			var dataType = NamedNode.fromString(suffix.substr(2));
			return new Literal(literal, dataType);
		} else {
			throw new Error('Invalid literal string format: ' + literalString);
		}
	}
}
