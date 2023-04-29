import { Component } from "..";

export type MaterialType = "depth" | "deferred" | "forward" | "envMap"

type MaterialVisiblity = {[K in MaterialType]: boolean}

export type MaterialParam = {
	type: MaterialType[],
	frag: string,
	vert: string,
}

export class Material extends Component {

	public type: MaterialType[];
	public visibility: MaterialVisiblity;

	public vert: string;
	public frag: string;

	constructor( opt: MaterialParam ) {

		super();

		this.type = opt.type;

		this.visibility = {
			depth: opt.type.indexOf( 'deferred' ) > - 1,
			deferred: opt.type.indexOf( 'deferred' ) > - 1,
			forward: opt.type.indexOf( 'forward' ) > - 1,
			envMap: opt.type.indexOf( 'envMap' ) > - 1
		};

		this.vert = opt.vert;
		this.frag = opt.frag;

	}

}
