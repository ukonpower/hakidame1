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
import lightShaftFrag from './shaders/lightShaft.fs';
import ssrFrag from './shaders/ssr.fs';
import dofCoc from './shaders/dofCoc.fs';
import dofDownSampling from './shaders/dofDownSampling.fs';
import dofBokeh from './shaders/dofBokeh.fs';
import compositeFrag from './shaders/composite.fs';

export class MainCamera extends Entity {

	private commonUniforms: GLP.Uniforms;

	private fxaa: PostProcessPass;
	private bloomBright: PostProcessPass;
	private bloomBlur: PostProcessPass[];

	private lightShaft: PostProcessPass;
	public rtLightShaft1: GLP.GLPowerFrameBuffer;
	public rtLightShaft2: GLP.GLPowerFrameBuffer;

	private ssr: PostProcessPass;
	public rtSSR1: GLP.GLPowerFrameBuffer;
	public rtSSR2: GLP.GLPowerFrameBuffer;

	public dofCoc: PostProcessPass;
	public dofBokeh: PostProcessPass;
	public dofDownSampling: PostProcessPass;
	public rtDofCoc: GLP.GLPowerFrameBuffer;
	public rtDofBokeh: GLP.GLPowerFrameBuffer;
	public rtDofDownSampling: GLP.GLPowerFrameBuffer;

	private composite: PostProcessPass;

	constructor( param: RenderCameraParam ) {

		super();

		// camera component

		const cameraComponent = this.addComponent( "camera", new RenderCamera( param ) );
		this.addComponent( 'orbitControls', new OrbitControls( canvas ) );

		// resolution

		const resolution = new GLP.Vector();
		const resolutionInv = new GLP.Vector();
		const resolutionBloom: GLP.Vector[] = [];

		// rt

		const rt1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		const rt2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );
		const rt3 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [ power.createTexture() ] );

		// uniforms

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

		// fxaa

		this.fxaa = new PostProcessPass( {
			input: param.renderTarget.deferredBuffer.textures,
			frag: fxaaFrag,
			uniforms: this.commonUniforms,
			renderTarget: rt1
		} );

		// bloom

		const bloomRenderCount = 4;

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
			renderTarget: rt2
		} );

		// dof

		this.rtDofCoc = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, internalFormat: gl.RGBA16F, type: gl.HALF_FLOAT, format: gl.RGBA } ),
		] );

		this.rtDofBokeh = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		this.rtDofDownSampling = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, internalFormat: gl.RGBA16F, type: gl.HALF_FLOAT, format: gl.RGBA } ),
		] );

		const focalLength = 50.0 / 1000;
		const focusDistance = 13;
		const aperture = 5.0;
		// const A = focalLength / aperture;
		const maxCoc = ( aperture * focalLength ) / ( focusDistance - focalLength );

		this.dofCoc = new PostProcessPass( {
			input: [ param.renderTarget.gBuffer.depthTexture ],
			frag: dofCoc,
			uniforms: {
				uParams: {
					value: new GLP.Vector( focusDistance, 100, maxCoc, 1 ),
					type: '4f'
				}
			},
			renderTarget: this.rtDofCoc,
		} );

		this.dofDownSampling = new PostProcessPass( {
			input: [ rt2.textures[ 0 ], this.rtDofCoc.textures[ 0 ] ],
			frag: dofDownSampling,
			uniforms: GLP.UniformsUtils.merge( {} ),
			renderTarget: this.rtDofDownSampling
		} );

		this.dofBokeh = new PostProcessPass( {
			input: [ rt2.textures[ 0 ], this.rtDofDownSampling.textures[ 0 ] ],
			frag: dofBokeh,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time ),
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
				this.dofCoc,
				this.dofDownSampling,
				this.dofBokeh,
			] } )
		);

		// events

		this.on( "resize", ( e: EntityResizeEvent ) => {

			resolution.copy( e.resolution );
			resolutionInv.set( 1.0 / e.resolution.x, 1.0 / e.resolution.y, 0.0, 0.0 );

			const resolutionHalf = resolution.clone().divide( 2 );
			resolutionHalf.x = Math.max( Math.floor( resolutionHalf.x ), 1.0 );
			resolutionHalf.y = Math.max( Math.floor( resolutionHalf.y ), 1.0 );

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

			this.rtSSR1.setSize( resolutionHalf );
			this.rtSSR2.setSize( resolutionHalf );

			this.rtDofCoc.setSize( resolution );
			this.rtDofBokeh.setSize( resolution );
			this.rtDofDownSampling.setSize( resolutionHalf );

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
