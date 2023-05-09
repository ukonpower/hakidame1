import * as GLP from 'glpower';

import { Component } from "..";

export type MaterialRenderType = "shadowMap" | "deferred" | "forward" | "envMap" | 'postprocess'

type MaterialDefines = {[key: string]: any};
type MaterialVisibility = {[K in MaterialRenderType]?: boolean}
type MaterialProgramCache = {[K in MaterialRenderType]?: GLP.GLPowerProgram}

export type MaterialParam = {
	type?: MaterialRenderType[],
	frag: string,
	vert: string,
	defines?: MaterialDefines,
	uniforms?: GLP.Uniforms,
	depthTest?: boolean,
	cullFace? :boolean,
}

export class Material extends Component {

	public type: MaterialRenderType[];

	public vert: string;
	public frag: string;
	public defines: MaterialDefines;
	public uniforms: GLP.Uniforms;

	public useLight: boolean;
	public depthTest: boolean;
	public cullFace: boolean;

	public visibilityFlag: MaterialVisibility;
	public programCache: MaterialProgramCache;

	constructor( opt: MaterialParam ) {

		super();

		this.type = opt.type || [];

		this.visibilityFlag = {
			shadowMap: this.type.indexOf( 'shadowMap' ) > - 1 || this.type.indexOf( 'deferred' ) > - 1,
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
		this.depthTest = opt.depthTest !== undefined ? opt.depthTest : true;
		this.cullFace = opt.cullFace !== undefined ? opt.cullFace : true;
		this.programCache = {};

	}

	public requestUpdate() {

		this.programCache = {};

	}

}
