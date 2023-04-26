import { Component } from "../Component";

export type MaterialType = "deferred" | "forward" | "envMap"

type MaterialVisiblity = {[K in MaterialType]: boolean}

export type MaterialParam = {
	type: MaterialType[],
	frag: string,
	vert: string,
}

export class Material extends Component {

	public type: MaterialType[];
	public visibility: MaterialVisiblity;

	constructor( opt: MaterialParam ) {

		super();

		this.type = opt.type;

		this.visibility = {
			deferred: opt.type.indexOf( 'deferred' ) > - 1,
			forward: opt.type.indexOf( 'forward' ) > - 1,
			envMap: opt.type.indexOf( 'envMap' ) > - 1
		};

	}

}
