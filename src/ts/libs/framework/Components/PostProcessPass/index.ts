import * as GLP from 'glpower';

import { Material, MaterialParam } from '../Material';

export interface PostProcessPassParam extends Omit<MaterialParam, 'vert'> {
	input: GLP.GLPowerFrameBuffer[],
	renderTarget: GLP.GLPowerFrameBuffer | null,
	vert?: string,
}

import quadVert from './shaders/quad.vs';

export class PostProcessPass extends Material {

	constructor( param: PostProcessPassParam ) {

		super( { ...param, vert: param.vert || quadVert } );

	}

}
