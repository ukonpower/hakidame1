import * as GLP from 'glpower';

import { Component } from "..";

export type MaterialRenderType = "shadowMap" | "deferred" | "forward" | "envMap" | 'postprocess'

type MaterialVisiblity = {[K in MaterialRenderType]: boolean}
type MaterialDefines = {[key: string]: any};

export type MaterialParam = {
	type?: MaterialRenderType[],
	frag: string,
	vert: string,
	defines?: MaterialDefines,
	uniforms?: GLP.Uniforms,
}

export class Material extends Component {

	public type: MaterialRenderType[];
	public visibility: MaterialVisiblity;

	public vert: string;
	public frag: string;
	public defines: MaterialDefines;
	public useLight: boolean;

	public uniforms: GLP.Uniforms;

	constructor( opt: MaterialParam ) {

		super();

		this.type = opt.type || [];

		this.visibility = {
			shadowMap: this.type.indexOf( 'shadowMap' ) > - 1,
			deferred: this.type.indexOf( 'deferred' ) > - 1,
			forward: this.type.indexOf( 'forward' ) > - 1,
			envMap: this.type.indexOf( 'envMap' ) > - 1,
			postprocess: this.type.indexOf( 'postprocess' ) > - 1,
		};

		this.vert = opt.vert;
		this.frag = opt.frag;
		this.defines = opt.defines || {};
		this.uniforms = opt.uniforms || {};
		this.useLight = true;

	}

}
