import * as GLP from 'glpower';

import { Component } from "..";

export type GeometryParam = {
}

type Attribute = {
	array: GLP.TArrayBuffer;
	size: number;
	__buffer?: GLP.GLPowerBuffer
}

type DefaultAttributeName = 'position' | 'uv' | 'normal' | 'index';

export class Geometry extends Component {

	public count: number;
	public attributes: Map<string, Attribute >;
	public needsUpdate: Map<GLP.GLPowerVAO, boolean>;

	constructor() {

		super();

		this.count = 0;
		this.attributes = new Map();
		this.needsUpdate = new Map();

	}

	public setAttribute( name: DefaultAttributeName | ( string & {} ), array: GLP.TArrayBuffer, size: number ) {

		this.attributes.set( name, {
			array,
			size
		} );

		this.updateVertCount();

		return this;

	}

	public getAttribute( name: DefaultAttributeName | ( string & {} ) ) {

		return this.attributes.get( name );

	}

	private updateVertCount() {

		const keys = Object.keys( this.attributes );

		this.count = keys.length > 0 ? Infinity : 0;

		this.attributes.forEach( ( attribute, name ) => {

			if ( name != 'index' ) {

				this.count = Math.min( attribute.array.length / attribute.size, this.count );

			}

		} );


	}

}
