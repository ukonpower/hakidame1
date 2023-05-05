import * as GLP from 'glpower';

import { gl, power } from "~/ts/Globals";
import { Camera } from "../Components/Camera";
import { Geometry } from "../Components/Geometry";
import { Material, MaterialRenderType } from "../Components/Material";
import { Entity } from "../Entity";
import { ProgramManager } from "./ProgramManager";
import { shaderParse } from "./ShaderParser";

import { PlaneGeometry } from '../Components/Geometry/PlaneGeometry';
import { PostProcess } from '../Components/PostProcess';
import { PostProcessPass } from '../Components/PostProcessPass';

import deferredShadingFrag from './shaders/deferredShading.fs';
import { Light } from '../Components/Light';

export type RenderStack = {
	light: Entity[],
	camera: Entity[],
	envMap: Entity[],
	shadowMap: Entity[],
	deferred: Entity[],
	forward: Entity[],
}

export type Lights = {
	needsUpdate: boolean
	directionalLight: {direction: GLP.Vector, color: GLP.Vector}[],
	directionalLightShadow: ( ShadowMapCamera | null )[]
	spotLight: {position: GLP.Vector, direction: GLP.Vector, color: GLP.Vector, angle: number, blend: number, distance: number, decay: number}[],
	spotLightShadow: ( ShadowMapCamera | null )[]
}

export class Renderer {

	private programManager: ProgramManager;

	private textureUnit: number = 0;

	private canvasSize: GLP.Vector;

	// tmp

	private tmpNormalMatrix: GLP.Matrix;
	private tmpModelViewMatrix: GLP.Matrix;
	private tmpLightDirection: GLP.Vector;
	private tmpModelMatrixInverse: GLP.Matrix;
	private tmpProjectionMatrixInverse: GLP.Matrix;

	// deferred

	private deferredShadingPostprocess: PostProcess;

	// quad

	private quad: Geometry;


	constructor() {

		this.programManager = new ProgramManager( power );
		this.canvasSize = new GLP.Vector();

		// matrix

		this.tmpModelViewMatrix = new GLP.Matrix();
		this.tmpNormalMatrix = new GLP.Matrix();

		// deferred

		this.deferredShadingPostprocess = new PostProcess( { passes: [
			new PostProcessPass( {
				renderTarget: null,
				frag: deferredShadingFrag,
			} )
		] } );

		// quad

		this.quad = new PlaneGeometry( 2.0, 2.0 );

		// tmp

		this.tmpLightDirection = new GLP.Vector();
		this.tmpModelMatrixInverse = new GLP.Matrix();
		this.tmpProjectionMatrixInverse = new GLP.Matrix();

	}

	public update( stack: RenderStack ) {

		// light

		for ( let i = 0; i < stack.light.length; i ++ ) {

			const l = stack.light[ i ];

			this.collectLight( l );

		}


		// shadowmap

		for ( let i = 0; i < stack.light.length; i ++ ) {

			const l = stack.light[ i ];

			this.renderCamera( "shadowMap", l, l.getComponent<Light>( 'light' )!, stack.shadowMap );

		}

		// envmap

		// for ( let i	 = 0; i < 4; i ++ ) {

		// this.render( "envMap", camera );

		// }

		for ( let i = 0; i < stack.camera.length; i ++ ) {

			const cameraEntity = stack.camera[ i ];
			const cameraComponent = cameraEntity.getComponent<Camera>( 'camera' )!;

			this.renderCamera( "deferred", cameraEntity, cameraComponent, stack.deferred );

			this.deferredShadingPostprocess.passes[ 0 ].input = cameraComponent.renderTarget.gBuffer.textures;
			this.deferredShadingPostprocess.passes[ 0 ].renderTarget = cameraComponent.renderTarget.outBuffer;

			this.renderPostProcess( this.deferredShadingPostprocess );

			this.renderCamera( "forward", cameraEntity, cameraComponent, stack.forward );

			const postProcess = cameraEntity.getComponent<PostProcess>( 'postprocess' );

			if ( postProcess ) {

				this.renderPostProcess( postProcess );

			}

		}

	}

	private renderCamera( renderType: MaterialRenderType, cameraEntity: Entity, cameraComponent: Camera, entities: Entity[] ) {

		let renderTarget = null;

		if ( renderType == 'deferred' ) renderTarget = cameraComponent.renderTarget.gBuffer;
		else if ( renderType == 'forward' ) renderTarget = cameraComponent.renderTarget.outBuffer;

		if ( renderTarget ) {

			gl.viewport( 0, 0, renderTarget.size.x, renderTarget.size.y );
			gl.bindFramebuffer( gl.FRAMEBUFFER, renderTarget.getFrameBuffer() );
			gl.drawBuffers( renderTarget.textureAttachmentList );

		} else {

			gl.viewport( 0, 0, this.canvasSize.x, this.canvasSize.y );
			gl.bindFramebuffer( gl.FRAMEBUFFER, null );

		}

		// clear

		if ( renderType == 'deferred' ) {

			gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
			gl.clearDepth( 1.0 );
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		}

		// render

		for ( let i = 0; i < entities.length; i ++ ) {

			const entity = entities[ i ];
			const material = entity.getComponent<Material>( "material" )!;
			const geometry = entity.getComponent<Geometry>( "geometry" )!;

			this.draw( entity.uuid.toString(), renderType, geometry, material, {
				modelMatrixWorld: entity.matrixWorld,
				cameraMatrixWorld: cameraEntity.matrixWorld,
				viewMatrix: cameraComponent.viewMatrix,
				projectionMatrix: cameraComponent.projectionMatrix,
			} );

		}

	}

	private collectLight( lightEntity: Entity ) {

		const lightComponent = lightEntity.getComponent<Light>( 'light' )!;
		const type = lightComponent.type;


	}

	private renderPostProcess( postprocess: PostProcess ) {

		// render

		for ( let i = 0; i < postprocess.passes.length; i ++ ) {

			const pass = postprocess.passes[ i ];

			const renderTarget = pass.renderTarget;

			if ( renderTarget ) {

				gl.viewport( 0, 0, renderTarget.size.x, renderTarget.size.y );
				gl.bindFramebuffer( gl.FRAMEBUFFER, renderTarget.getFrameBuffer() );
				gl.drawBuffers( renderTarget.textureAttachmentList );

			} else {

				gl.viewport( 0, 0, this.canvasSize.x, this.canvasSize.y );
				gl.bindFramebuffer( gl.FRAMEBUFFER, null );

			}

			// clear

			gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
			gl.clearDepth( 1.0 );
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

			if ( pass.input ) {

				for ( let i = 0; i < pass.input.length; i ++ ) {

					pass.uniforms[ 'sampler' + i ] = {
						type: '1i',
						value: pass.input[ i ]
					};

				}

			}

			this.draw( "id", "postprocess", this.quad, pass );

		}

	}

	private draw( drawId: string, renderType: MaterialRenderType, geometry: Geometry, material: Material, matrix?: { modelMatrixWorld?: GLP.Matrix, viewMatrix?: GLP.Matrix, projectionMatrix?: GLP.Matrix, cameraMatrixWorld?: GLP.Matrix } ) {

		this.textureUnit = 0;

		// status

		gl.enable( gl.CULL_FACE );
		gl.enable( gl.DEPTH_TEST );
		gl.disable( gl.BLEND );

		const defines = { ...material.defines };

		if ( renderType == 'deferred' ) defines.IS_DEFERRED = "";
		else if ( renderType == 'forward' || renderType == 'envMap' ) defines.IS_FORWARD = "";
		else if ( renderType == 'shadowMap' ) defines.IS_DEPTH = "";

		const vert = shaderParse( material.vert, defines );
		const frag = shaderParse( material.frag, defines );

		const program = this.programManager.get( vert, frag );

		if ( matrix ) {

			if ( matrix.modelMatrixWorld ) {

				program.setUniform( 'modelMatrix', 'Matrix4fv', matrix.modelMatrixWorld.elm );
				program.setUniform( 'modelMatrixInverse', 'Matrix4fv', this.tmpModelMatrixInverse.copy( matrix.modelMatrixWorld ).inverse().elm );

				if ( matrix.viewMatrix ) {

					this.tmpModelViewMatrix.copy( matrix.modelMatrixWorld ).preMultiply( matrix.viewMatrix );
					this.tmpNormalMatrix.copy( this.tmpModelViewMatrix );
					this.tmpNormalMatrix.inverse();
					this.tmpNormalMatrix.transpose();

					program.setUniform( 'modelViewMatrix', 'Matrix4fv', this.tmpModelViewMatrix.elm );
					program.setUniform( 'normalMatrix', 'Matrix4fv', this.tmpNormalMatrix.elm );

				}

			}

			if ( matrix.viewMatrix ) {

				program.setUniform( 'viewMatrix', 'Matrix4fv', matrix.viewMatrix.elm );

			}

			if ( matrix.projectionMatrix ) {

				program.setUniform( 'projectionMatrix', 'Matrix4fv', matrix.projectionMatrix.elm );
				program.setUniform( 'projectionMatrixInverse', 'Matrix4fv', this.tmpProjectionMatrixInverse.copy( matrix.projectionMatrix ).inverse().elm );

			}

			if ( matrix.cameraMatrixWorld ) {

				program.setUniform( 'cameraMatrix', 'Matrix4fv', matrix.cameraMatrixWorld.elm );

			}

		}

		const keys = Object.keys( material.uniforms );

		for ( let i = 0; i < keys.length; i ++ ) {

			const name = keys[ i ];
			const uni = material.uniforms[ name ];
			const type = uni.type;
			const value = uni.value;

			const arrayValue: ( number | boolean )[] = [];

			const _ = ( v: GLP.Uniformable ) => {

				if ( typeof v == 'number' || typeof v == 'boolean' ) {

					arrayValue.push( v );

				} else if ( 'isVector' in v ) {

					arrayValue.push( ...v.getElm( ( 'vec' + type.charAt( 0 ) ) as any ) );

				} else if ( 'isTexture' in v ) {

					v.activate( this.textureUnit ++ );

					arrayValue.push( v.unit );

				} else {

					arrayValue.push( ...v.elm );

				}

			};

			if ( Array.isArray( value ) ) {

				for ( let j = 0; j < value.length; j ++ ) {

					_( value[ j ] );

				}

			} else {

				_( value );

			}

			program.setUniform( name, type, arrayValue );

		}

		const vao = program.getVAO( drawId.toString() );

		if ( vao ) {

			const geometryNeedsUpdate = geometry.needsUpdate.get( vao );

			if ( geometryNeedsUpdate === undefined || geometryNeedsUpdate === true ) {

				geometry.createBuffer( power );

				geometry.attributes.forEach( ( attr, key ) => {

					if ( attr.buffer === undefined ) return;

					if ( key == 'index' ) {

						vao.setIndex( attr.buffer );

					} else {

						vao.setAttribute( key, attr.buffer, attr.size, attr.opt );

					}

				} );

				geometry.needsUpdate.set( vao, false );

			}

			// draw

			program.use( () => {

				program.uploadUniforms();

				gl.bindVertexArray( vao.getVAO() );

				if ( vao.instanceCount > 0 ) {

					if ( vao.indexBuffer ) {

						gl.drawElementsInstanced( gl.TRIANGLES, vao.indexCount, gl.UNSIGNED_SHORT, 0, vao.instanceCount );

					} else {

						gl.drawArraysInstanced( gl.TRIANGLES, 0, vao.vertCount, vao.instanceCount );

					}

				} else {

					if ( vao.indexBuffer ) {

						gl.drawElements( gl.TRIANGLES, vao.indexCount, gl.UNSIGNED_SHORT, 0 );

					} else {

						gl.drawArrays( gl.TRIANGLES, 0, vao.vertCount );

					}

				}

				gl.bindVertexArray( null );

			} );

		}

	}

	public resize( canvasSize: GLP.Vector ) {

		this.canvasSize.copy( canvasSize );

	}

}
