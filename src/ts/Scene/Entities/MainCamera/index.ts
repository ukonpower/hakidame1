import * as GLP from 'glpower';

import { gl, power } from "~/ts/Globals";
import { Camera, CameraParam } from "~/ts/libs/framework/Components/Camera";
import { PostProcess } from "~/ts/libs/framework/Components/PostProcess";
import { PostProcessPass } from "~/ts/libs/framework/Components/PostProcessPass";
import { Entity, EntityResizeEvent } from "~/ts/libs/framework/Entity";

import compositeFrag from './shaders/composite.fs';
import fxaaFrag from './shaders/fxaa.fs';

export class MainCamera extends Entity {

	private uniforms: GLP.Uniforms;

	constructor( param: CameraParam ) {

		super();

		const rt1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		const rt2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		const rt3 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );

		const cameraComponent = this.addComponent( "camera", new Camera( param ) );

		this.uniforms = GLP.UniformsUtils.merge( {
			uResolution: {
				type: "2f",
				value: new GLP.Vector()
			},
			uResolutionInv: {
				type: "2f",
				value: new GLP.Vector()
			}
		} );

		this.addComponent( "postprocess", new PostProcess( {
			input: param.renderTarget.gBuffer.textures,
			passes: [
				new PostProcessPass( {
					input: param.renderTarget.outBuffer.textures,
					frag: compositeFrag,
					renderTarget: rt1
				} ),
				new PostProcessPass( {
					input: rt1.textures,
					frag: fxaaFrag,
					uniforms: this.uniforms,
					renderTarget: null
				} ),
			] } )
		);

		this.on( "resize", ( e: EntityResizeEvent ) => {

			this.uniforms.uResolution.value.copy( e.resolution );
			this.uniforms.uResolutionInv.value.set( 1.0 / e.resolution.x, 1.0 / e.resolution.y, 0.0, 0.0 );

			rt1.setSize( e.resolution );
			rt2.setSize( e.resolution );
			rt3.setSize( e.resolution );

			cameraComponent.aspect = e.resolution.x / e.resolution.y;
			cameraComponent.updateProjectionMatrix();

		} );

	}

}
