import * as GLP from 'glpower';

import { Material, MaterialParam } from '../Material';

export interface PostProcessPassParam extends Omit<MaterialParam, 'vert'> {
	input?: GLP.GLPowerTexture[],
	renderTarget: GLP.GLPowerFrameBuffer | null,
	vert?: string,
	clearColor?: GLP.Vector;
	clearDepth?: number;
}

import quadVert from './shaders/quad.vs';

export class PostProcessPass extends Material {

	public input: GLP.GLPowerTexture[];
	public renderTarget: GLP.GLPowerFrameBuffer | null;

	public clearColor: GLP.Vector | null;
	public clearDepth: number | null;

	constructor( param: PostProcessPassParam ) {

		super( { ...param, vert: param.vert || quadVert } );

		this.renderTarget = param.renderTarget;
		this.input = param.input || [];

		this.clearColor = param.clearColor ?? null;
		this.clearDepth = param.clearDepth ?? null;
		this.depthTest = param.depthTest !== undefined ? param.depthTest : false;

	}

}
