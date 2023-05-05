import * as GLP from 'glpower';

import { Material, MaterialParam } from '../Material';

export interface PostProcessPassParam extends Omit<MaterialParam, 'vert'> {
	input?: GLP.GLPowerTexture[],
	renderTarget: GLP.GLPowerFrameBuffer | null,
	vert?: string,
}

import quadVert from './shaders/quad.vs';

export class PostProcessPass extends Material {

	public input: GLP.GLPowerTexture[];
	public renderTarget: GLP.GLPowerFrameBuffer | null;

	constructor( param: PostProcessPassParam ) {

		super( { ...param, vert: param.vert || quadVert } );

		this.renderTarget = param.renderTarget;
		this.input = param.input || [];

	}

}
