import * as GLP from 'glpower';

import { gl, globalUniforms, power } from "~/ts/Globals";
import { PostProcess } from "~/ts/libs/framework/Components/PostProcess";
import { PostProcessPass } from "~/ts/libs/framework/Components/PostProcessPass";
import { Entity, EntityResizeEvent } from "~/ts/libs/framework/Entity";
import { RenderCamera, RenderCameraParam } from '~/ts/libs/framework/Components/Camera/RenderCamera';

import fxaaFrag from './shaders/fxaa.fs';
import bloomBlurFrag from './shaders/bloomBlur.fs';
import bloomBrightFrag from './shaders/bloomBright.fs';
import compositeFrag from './shaders/composite.fs';

export class MainCamera extends Entity {

	private commonUniforms: GLP.Uniforms;

	constructor( param: RenderCameraParam ) {

		super();

		const bloomRenderCount = 4;

		const rt1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		const rt2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		const rt3 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );

		const rtBloomVertical: GLP.GLPowerFrameBuffer[] = [];
		const rtBloomHorizonal: GLP.GLPowerFrameBuffer[] = [];

		for ( let i = 0; i < bloomRenderCount; i ++ ) {

			rtBloomVertical.push( new GLP.GLPowerFrameBuffer( gl ).setTexture( [
				power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
			] ) );

			rtBloomHorizonal.push( new GLP.GLPowerFrameBuffer( gl ).setTexture( [
				power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
			] ) );

		}

		const cameraComponent = this.addComponent( "camera", new RenderCamera( param ) );

		// resolution

		const resolution = new GLP.Vector();
		const resolutionInv = new GLP.Vector();
		const resolutionBloom: GLP.Vector[] = [];

		this.commonUniforms = GLP.UniformsUtils.merge( {
			uResolution: {
				type: "2f",
				value: resolution
			},
			uResolutionInv: {
				type: "2f",
				value: resolutionInv
			}
		} );

		this.addComponent( "postprocess", new PostProcess( {
			input: param.renderTarget.gBuffer.textures,
			passes: [
				new PostProcessPass( {
					input: param.renderTarget.outBuffer.textures,
					frag: fxaaFrag,
					uniforms: this.commonUniforms,
					renderTarget: rt1
				} ),
				new PostProcessPass( {
					input: rt1.textures,
					frag: bloomBrightFrag,
					uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
						threshold: {
							type: '1f',
							value: 0.5,
						},
					} ),
					renderTarget: rt2
				} ),
				...( ()=>{

					const res: PostProcessPass[] = [];

					// bloom blur

					let bloomInput: GLP.GLPowerTexture[] = rt2.textures;

					for ( let i = 0; i < bloomRenderCount; i ++ ) {

						const rtVertical = rtBloomVertical[ i ];
						const rtHorizonal = rtBloomHorizonal[ i ];

						const resolution = new GLP.Vector();
						resolutionBloom.push( resolution );

						res.push( new PostProcessPass( {
							input: bloomInput,
							renderTarget: rtVertical,
							frag: bloomBlurFrag,
							uniforms: {
								uIsVertical: {
									type: '1i',
									value: true
								},
								uWeights: {
									type: '1fv',
									value: this.guassWeight( bloomRenderCount )
								},
								uResolution: {
									type: '2fv',
									value: resolution,
								}
							},
							defines: {
								GAUSS_WEIGHTS: bloomRenderCount.toString()
							}
						} ) );

						res.push( new PostProcessPass( {
							input: rtVertical.textures,
							renderTarget: rtHorizonal,
							frag: bloomBlurFrag,
							uniforms: {
								uIsVertical: {
									type: '1i',
									value: false
								},
								uWeights: {
									type: '1fv',
									value: this.guassWeight( bloomRenderCount )
								},
								uResolution: {
									type: '2fv',
									value: resolution,
								}
							},
							defines: {
								GAUSS_WEIGHTS: bloomRenderCount.toString()
							} } ) );

						bloomInput = rtHorizonal.textures;

					}

					return res;

				} )(),
				new PostProcessPass( {
					input: rt1.textures,
					frag: compositeFrag,
					uniforms: GLP.UniformsUtils.merge( this.commonUniforms, {
						uBloomTexture: {
							value: rtBloomHorizonal.map( rt => rt.textures[ 0 ] ),
							type: '1iv'
						}
					} ),
					defines: {
						BLOOM_COUNT: bloomRenderCount.toString()
					},
					renderTarget: null
				} ),
			] } )
		);

		this.on( "resize", ( e: EntityResizeEvent ) => {

			resolution.copy( e.resolution );
			resolutionInv.set( 1.0 / e.resolution.x, 1.0 / e.resolution.y, 0.0, 0.0 );

			rt1.setSize( e.resolution );
			rt2.setSize( e.resolution );
			rt3.setSize( e.resolution );

			cameraComponent.aspect = e.resolution.x / e.resolution.y;
			cameraComponent.updateProjectionMatrix();

			let scale = 2;

			for ( let i = 0; i < bloomRenderCount; i ++ ) {

				resolutionBloom[ i ].copy( e.resolution ).multiply( 1.0 / scale );

				rtBloomHorizonal[ i ].setSize( resolutionBloom[ i ] );
				rtBloomVertical[ i ].setSize( resolutionBloom[ i ] );

				scale *= 2.0;

			}

		} );

	}

	private guassWeight( num: number ) {

		const weight = new Array( num );

		// https://wgld.org/d/webgl/w057.html

		let t = 0.0;
		const d = 100;

		for ( let i = 0; i < weight.length; i ++ ) {

			const r = 1.0 + 2.0 * i;
			let w = Math.exp( - 0.5 * ( r * r ) / d );
			weight[ i ] = w;

			if ( i > 0 ) {

				w *= 2.0;

			}

			t += w;

		}

		for ( let i = 0; i < weight.length; i ++ ) {

			weight[ i ] /= t;

		}

		return weight;

	}


}
