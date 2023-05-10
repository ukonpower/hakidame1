import * as GLP from 'glpower';
import { gl, globalUniforms, power } from "~/ts/Globals";
import { PostProcess } from "../../Components/PostProcess";
import { PostProcessPass } from "../../Components/PostProcessPass";
import { RenderCameraTarget } from '../../Components/Camera/RenderCamera';
import deferredShadingFrag from './shaders/deferredShading.fs';
import deferredCompositeFrag from './shaders/deferredComposite.fs';
import { ComponentResizeEvent } from '../../Components';

export class DeferredPostProcess extends PostProcess {

	private shading: PostProcessPass;
	private composite: PostProcessPass;

	public rtDeferredShading: GLP.GLPowerFrameBuffer;

	constructor() {

		// shading

		const rtShading = new GLP.GLPowerFrameBuffer( gl, { disableDepthBuffer: true } );
		rtShading.setTexture( [ power.createTexture().setting( { magFilter: gl.LINEAR, minFilter: gl.LINEAR, generateMipmap: true } ) ] );

		const shading = new PostProcessPass( {
			frag: deferredShadingFrag,
			renderTarget: rtShading,
		} );

		// composite

		const composite = new PostProcessPass( {
			input: [],
			frag: deferredCompositeFrag,
			renderTarget: null,
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time, {
			} )
		} );

		super( { passes: [
			shading,
			composite
		] } );

		this.shading = shading;
		this.composite = composite;

		this.rtDeferredShading = rtShading;

	}

	protected resizeImpl( e: ComponentResizeEvent ): void {

		this.rtDeferredShading.setSize( e.resolution );

	}

	public setRenderTarget( renderTarget: RenderCameraTarget ) {

		this.shading.input = renderTarget.gBuffer.textures;
		this.composite.input = [ this.rtDeferredShading.textures[ 0 ] ];
		this.composite.renderTarget = renderTarget.outBuffer;

	}

}
