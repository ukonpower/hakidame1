import * as GLP from 'glpower';

import { canvas, gl, globalUniforms, power } from "~/ts/Globals";
import { PostProcess } from "~/ts/libs/framework/Components/PostProcess";
import { PostProcessPass } from "~/ts/libs/framework/Components/PostProcessPass";
import { Entity, EntityResizeEvent } from "~/ts/libs/framework/Entity";
import { RenderCamera, RenderCameraParam } from '~/ts/libs/framework/Components/Camera/RenderCamera';
import { OrbitControls } from '~/ts/libs/framework/Components/OrbitControls';
import { ComponentResizeEvent, ComponentUpdateEvent } from '~/ts/libs/framework/Components';

import fxaaFrag from './shaders/fxaa.fs';
import bloomBlurFrag from './shaders/bloomBlur.fs';
import bloomBrightFrag from './shaders/bloomBright.fs';
import compositeFrag from './shaders/composite.fs';
import lightShaftFrag from './shaders/lightShaft.fs';
import ssrFrag from './shaders/ssr.fs';


export class MainCamera extends Entity {

	private commonUniforms: GLP.Uniforms;

	private fxaa: PostProcessPass;
	private bloomBright: PostProcessPass;
	private bloomBlur: PostProcessPass[];
	private composite: PostProcessPass;
	private lightShaft: PostProcessPass;
	private ssr: PostProcessPass;


	public rtLightShaft1: GLP.GLPowerFrameBuffer;
	public rtLightShaft2: GLP.GLPowerFrameBuffer;
	public rtSSR1: GLP.GLPowerFrameBuffer;
	public rtSSR2: GLP.GLPowerFrameBuffer;

	constructor( param: RenderCameraParam ) {

		super();

		const cameraComponent = this.addComponent( "camera", new RenderCamera( param ) );
		this.addComponent( 'orbitControls', new OrbitControls( canvas ) );

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

		this.fxaa = new PostProcessPass( {
			input: param.renderTarget.outBuffer.textures,
			frag: fxaaFrag,
			uniforms: this.commonUniforms,
			renderTarget: rt1
		} );

		this.bloomBright = new PostProcessPass( {
			input: rt1.textures,
			frag: bloomBrightFrag,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				threshold: {
					type: '1f',
					value: 0.5,
				},
			} ),
			renderTarget: rt2
		} );

		this.bloomBlur = [];

		// bloom blur

		let bloomInput: GLP.GLPowerTexture[] = rt2.textures;

		for ( let i = 0; i < bloomRenderCount; i ++ ) {

			const rtVertical = rtBloomVertical[ i ];
			const rtHorizonal = rtBloomHorizonal[ i ];

			const resolution = new GLP.Vector();
			resolutionBloom.push( resolution );

			this.bloomBlur.push( new PostProcessPass( {
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

			this.bloomBlur.push( new PostProcessPass( {
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


		// light shaft

		this.rtLightShaft1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );
		this.rtLightShaft2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.lightShaft = new PostProcessPass( {
			input: [],
			frag: lightShaftFrag,
			renderTarget: this.rtLightShaft1,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uLightShaftBackBuffer: {
					value: this.rtLightShaft2.textures[ 0 ],
					type: '1i'
				},
				uDepthTexture: {
					value: param.renderTarget.gBuffer.depthTexture,
					type: '1i'
				},
			} ),
		} );

		// ssr

		this.rtSSR1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.rtSSR2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.ssr = new PostProcessPass( {
			input: [ param.renderTarget.gBuffer.textures[ 0 ], param.renderTarget.gBuffer.textures[ 1 ] ],
			frag: ssrFrag,
			renderTarget: this.rtSSR1,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uResolution: {
					value: resolution,
					type: '2fv',
				},
				uResolutionInv: {
					value: resolutionInv,
					type: '2fv',
				},
				uSceneTex: {
					value: rt1.textures[ 0 ],
					type: '1i'
				},
				uSSRBackBuffer: {
					value: this.rtSSR2.textures[ 0 ],
					type: '1i'
				},
				uDepthTexture: {
					value: param.renderTarget.gBuffer.depthTexture,
					type: '1i'
				},
			} ),
		} );

		// composite

		this.composite = new PostProcessPass( {
			input: [ ...param.renderTarget.gBuffer.textures, rt1.textures[ 0 ] ],
			frag: compositeFrag,
			uniforms: GLP.UniformsUtils.merge( this.commonUniforms, {
				uBloomTexture: {
					value: rtBloomHorizonal.map( rt => rt.textures[ 0 ] ),
					type: '1iv'
				},
				uLightShaftTexture: {
					value: this.rtLightShaft2.textures[ 0 ],
					type: '1i'
				},
				uSSRTexture: {
					value: this.rtSSR2.textures[ 0 ],
					type: '1i'
				},
			} ),
			defines: {
				BLOOM_COUNT: bloomRenderCount.toString()
			},
			renderTarget: null
		} );

		this.addComponent( "postprocess", new PostProcess( {
			input: param.renderTarget.gBuffer.textures,
			passes: [
				this.fxaa,
				this.bloomBright,
				...this.bloomBlur,
				this.lightShaft,
				this.ssr,
				this.composite,
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

			this.rtLightShaft1.setSize( e.resolution );
			this.rtLightShaft2.setSize( e.resolution );

			const lowRes = e.resolution.clone().multiply( 0.5 );
			lowRes.x = Math.max( lowRes.x, 1.0 );
			lowRes.y = Math.max( lowRes.y, 1.0 );

			this.rtSSR1.setSize( lowRes );
			this.rtSSR2.setSize( lowRes );

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

	protected updateImpl( event: ComponentUpdateEvent ): void {

		// light shaft swap

		let tmp = this.rtLightShaft1;
		this.rtLightShaft1 = this.rtLightShaft2;
		this.rtLightShaft2 = tmp;

		this.lightShaft.renderTarget = this.rtLightShaft1;
		this.composite.uniforms.uLightShaftTexture.value = this.rtLightShaft1.textures[ 0 ];
		this.lightShaft.uniforms.uLightShaftBackBuffer.value = this.rtLightShaft2.textures[ 0 ];

		// ssr swap

		tmp = this.rtSSR1;
		this.rtSSR1 = this.rtSSR2;
		this.rtSSR2 = tmp;

		this.ssr.renderTarget = this.rtSSR1;
		this.composite.uniforms.uSSRTexture.value = this.rtSSR1.textures[ 0 ];
		this.ssr.uniforms.uSSRBackBuffer.value = this.rtSSR2.textures[ 0 ];

	}

	protected resizeImpl( e: ComponentResizeEvent ): void {


	}

}
