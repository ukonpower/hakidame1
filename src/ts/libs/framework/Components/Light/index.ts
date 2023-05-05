import * as GLP from 'glpower';

import { Camera, CameraParam } from "../Camera";
import { gl } from '~/ts/Globals';

export type LightType = 'directional' | 'spot'

export interface LightParam extends Omit<CameraParam, 'renderTarget'> {
	type: LightType
}

export class Light extends Camera {

	public type: LightType;
	public shadowMapRenderTarget:GLP.GLPowerFrameBuffer;

	constructor( param: LightParam ) {

		super( {
			...param,
			renderTarget: null
		} );

		this.type = param.type;
		this.shadowMapRenderTarget = new GLP.GLPowerFrameBuffer( gl );

	}

}
