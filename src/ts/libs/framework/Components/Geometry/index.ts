import * as GLP from 'glpower';

import { Component } from "../Component";

type ComponentGeometryAttribute = Omit<GLP.AttributeBuffer, 'count'>;
export type GeometryParam = {
}

export class Geometry extends Component {

	public attributes: ( { name: string } & ComponentGeometryAttribute )[];
	public index?: ComponentGeometryAttribute;
	public needsUpdate?: Map< GLP.GLPowerVAO, boolean>;

	constructor( param: GeometryParam ) {

		super();

		this.attributes = [];

	}

}
