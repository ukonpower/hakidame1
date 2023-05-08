import * as GLP from 'glpower';
import { gl, globalUniforms, power } from "~/ts/Globals";
import { PostProcess } from "../../Components/PostProcess";
import { PostProcessPass } from "../../Components/PostProcessPass";
import { RenderCameraTarget } from '../../Components/Camera/RenderCamera';
import deferredShadingFrag from './shaders/deferredShading.fs';
import lightShaftFrag from './shaders/lightShaft.fs';
import ssrFrag from './shaders/ssr.fs';
import deferredCompositeFrag from './shaders/deferredComposite.fs';
import { ComponentResizeEvent, ComponentUpdateEvent } from '../../Components';

export class DeferredPostProcess extends PostProcess {

	private shading: PostProcessPass;
	private lightShaft: PostProcessPass;
	private ssr: PostProcessPass;
	private composite: PostProcessPass;

	private rtLightShaft1: GLP.GLPowerFrameBuffer;
	private rtLightShaft2: GLP.GLPowerFrameBuffer;
	private rtSSR1: GLP.GLPowerFrameBuffer;
	private rtSSR2: GLP.GLPowerFrameBuffer;
	private rtShading: GLP.GLPowerFrameBuffer;

	constructor() {

		const resolution = new GLP.Vector();
		const resolutionInv = new GLP.Vector();

		// shading

		const rtShading = new GLP.GLPowerFrameBuffer( gl, { disableDepthBuffer: true } );
		rtShading.setTexture( [ power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, generateMipmap: true } ) ] );

		const shading = new PostProcessPass( {
			frag: deferredShadingFrag,
			renderTarget: rtShading,
		} );

		// light shaft

		const rtLightShaft1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );
		const rtLightShaft2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		const lightShaft = new PostProcessPass( {
			input: [],
			frag: lightShaftFrag,
			renderTarget: rtLightShaft1,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uLightShaftBackBuffer: {
					value: rtLightShaft2.textures[ 0 ],
					type: '1i'
				},
			} ),
		} );

		// ssr

		const rtSSR1 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		const rtSSR2 = new GLP.GLPowerFrameBuffer( gl ).setTexture( [
			power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR } ),
		] );

		const ssr = new PostProcessPass( {
			input: [],
			frag: ssrFrag,
			renderTarget: rtSSR1,
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
					value: rtShading.textures[ 0 ],
					type: '1i'
				},
				uSSRBackBuffer: {
					value: rtSSR2.textures[ 0 ],
					type: '1i'
				},
			} ),
		} );

		// composite

		const composite = new PostProcessPass( {
			input: rtShading.textures,
			frag: deferredCompositeFrag,
			renderTarget: null,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
				uLightShaftTexture: {
					value: rtLightShaft2.textures[ 0 ],
					type: '1i'
				},
				uSSRTexture: {
					value: rtSSR2.textures[ 0 ],
					type: '1i'
				},
			} )
		} );

		super( { passes: [
			shading,
			lightShaft,
			ssr,
			composite
		] } );

		this.shading = shading;
		this.lightShaft = lightShaft;
		this.ssr = ssr;
		this.composite = composite;

		this.rtShading = rtShading;
		this.rtLightShaft1 = rtLightShaft1;
		this.rtLightShaft2 = rtLightShaft2;
		this.rtSSR1 = rtSSR1;
		this.rtSSR2 = rtSSR2;

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		// light shaft swap

		let tmp = this.rtLightShaft1;
		this.rtLightShaft1 = this.rtLightShaft2;
		this.rtLightShaft2 = tmp;

		this.lightShaft.renderTarget = this.rtLightShaft1;

		if ( this.lightShaft.uniforms && this.composite.uniforms ) {

			this.composite.uniforms.uLightShaftTexture.value = this.rtLightShaft1.textures[ 0 ];
			this.lightShaft.uniforms.uLightShaftBackBuffer.value = this.rtLightShaft2.textures[ 0 ];

		}

		// ssr swap

		tmp = this.rtSSR1;
		this.rtSSR1 = this.rtSSR2;
		this.rtSSR2 = tmp;

		this.ssr.renderTarget = this.rtSSR1;

		if ( this.ssr.uniforms && this.composite.uniforms ) {

			this.composite.uniforms.uSSRTexture.value = this.rtSSR1.textures[ 0 ];
			this.ssr.uniforms.uSSRBackBuffer.value = this.rtSSR2.textures[ 0 ];

		}

	}

	protected resizeImpl( e: ComponentResizeEvent ): void {

		this.rtShading.setSize( e.resolution );

		this.rtLightShaft1.setSize( e.resolution );
		this.rtLightShaft2.setSize( e.resolution );

		const lowRes = e.resolution.clone().multiply( 0.5 );
		lowRes.x = Math.max( lowRes.x, 1.0 );
		lowRes.y = Math.max( lowRes.y, 1.0 );

		this.rtSSR1.setSize( lowRes );
		this.rtSSR2.setSize( lowRes );

	}

	public setRenderTarget( renderTarget: RenderCameraTarget ) {

		this.shading.input = renderTarget.gBuffer.textures;
		this.lightShaft.input = renderTarget.gBuffer.textures;
		this.ssr.input = renderTarget.gBuffer.textures;

		this.composite.renderTarget = renderTarget.outBuffer;

	}

}
