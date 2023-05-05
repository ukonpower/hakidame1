import * as GLP from 'glpower';

import { Camera, CameraParam } from '..';

export interface ShadowMapCameraParam extends CameraParam {
	renderTarget: GLP.GLPowerFrameBuffer
}

export class ShadowMapCamera extends Camera {

	public renderTarget: GLP.GLPowerFrameBuffer;

	constructor( param: ShadowMapCameraParam ) {

		super( param );

		this.renderTarget = param.renderTarget;

	}

}
