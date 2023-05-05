import * as GLP from 'glpower';

import { gl, power } from "~/ts/Globals";
import { Geometry } from "../Components/Geometry";
import { Material, MaterialRenderType } from "../Components/Material";
import { Entity } from "../Entity";
import { ProgramManager } from "./ProgramManager";
import { shaderParse } from "./ShaderParser";

import { PlaneGeometry } from '../Components/Geometry/PlaneGeometry';
import { PostProcess } from '../Components/PostProcess';
import { PostProcessPass } from '../Components/PostProcessPass';

import { RenderCamera } from '../Components/Camera/RenderCamera';
import { Light } from '../Components/Light';

import deferredShadingFrag from './shaders/deferredShading.fs';

export type RenderStack = {
	light: Entity[];
	camera: Entity[];
	envMap: Entity[];
	shadowMap: Entity[];
	deferred: Entity[];
	forward: Entity[];
}

type LightInfo = {
	position: GLP.Vector;
	direction: GLP.Vector;
	color: GLP.Vector;
	component: Light;
}

export type CollectedLights = {
	needsUpdate: boolean;
	directionalLight: LightInfo[];
	spotLight: LightInfo[];
}

type CameraMatrix = {
	viewMatrix?: GLP.Matrix;
	projectionMatrix?: GLP.Matrix;
	cameraMatrixWorld?: GLP.Matrix;
}

type RenderMatrix = CameraMatrix & { modelMatrixWorld?: GLP.Matrix }

export class Renderer {

	private programManager: ProgramManager;

	private textureUnit: number = 0;

	private canvasSize: GLP.Vector;

	// lights

	private lights: CollectedLights;

	// deferred

	private deferredShadingPostprocess: PostProcess;

	// quad

	private quad: Geometry;

	// tmp

	private tmpNormalMatrix: GLP.Matrix;
	private tmpModelViewMatrix: GLP.Matrix;
	private tmpLightDirection: GLP.Vector;
	private tmpModelMatrixInverse: GLP.Matrix;
	private tmpProjectionMatrixInverse: GLP.Matrix;

	constructor() {

		this.programManager = new ProgramManager( power );
		this.canvasSize = new GLP.Vector();

		// lights

		this.lights = {
			needsUpdate: false,
			directionalLight: [],
			spotLight: [],
		};

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
		this.tmpModelViewMatrix = new GLP.Matrix();
		this.tmpNormalMatrix = new GLP.Matrix();

	}

	public update( stack: RenderStack ) {

		// light

		const shadowMapLightList: Entity[] = [];

		this.lights.directionalLight.length = 0;
		this.lights.spotLight.length = 0;

		for ( let i = 0; i < stack.light.length; i ++ ) {

			const light = stack.light[ i ];

			if ( this.collectLight( light ) ) {

				shadowMapLightList.push( light );

			}

		}

		// shadowmap

		for ( let i = 0; i < shadowMapLightList.length; i ++ ) {

			const lightEntity = shadowMapLightList[ i ];
			const lightComponent = lightEntity.getComponent<Light>( 'light' )!;

			if ( lightComponent.renderTarget ) {

				this.renderCamera( "shadowMap", lightComponent.renderTarget, {
					viewMatrix: lightComponent.viewMatrix,
					projectionMatrix: lightComponent.projectionMatrix,
					cameraMatrixWorld: lightEntity.matrixWorld,
				}, stack.shadowMap );

			}

		}

		// envmap

		// for ( let i	 = 0; i < 4; i ++ ) {

		// this.render( "envMap", camera );

		// }

		for ( let i = 0; i < stack.camera.length; i ++ ) {

			const cameraEntity = stack.camera[ i ];
			const cameraComponent = cameraEntity.getComponent<RenderCamera>( 'camera' )!;

			const cameraMatirx: CameraMatrix = {
				viewMatrix: cameraComponent.viewMatrix,
				projectionMatrix: cameraComponent.projectionMatrix,
				cameraMatrixWorld: cameraEntity.matrixWorld
			};

			this.renderCamera( "deferred", cameraComponent.renderTarget.gBuffer, cameraMatirx, stack.deferred, true );

			this.deferredShadingPostprocess.passes[ 0 ].input = cameraComponent.renderTarget.gBuffer.textures;
			this.deferredShadingPostprocess.passes[ 0 ].renderTarget = cameraComponent.renderTarget.outBuffer;

			this.renderPostProcess( this.deferredShadingPostprocess, {
				viewMatrix: cameraComponent.viewMatrix,
				projectionMatrix: cameraComponent.projectionMatrix,
				cameraMatrixWorld: cameraEntity.matrixWorld,
			}, );

			this.renderCamera( "forward", cameraComponent.renderTarget.outBuffer, cameraMatirx, stack.forward );

			const postProcess = cameraEntity.getComponent<PostProcess>( 'postprocess' );

			if ( postProcess ) {

				this.renderPostProcess( postProcess );

			}

		}

	}

	private renderCamera( renderType: MaterialRenderType, renderTarget: GLP.GLPowerFrameBuffer | null, cameraMatirx: CameraMatrix, entities: Entity[], clear?:boolean ) {

		if ( renderTarget ) {

			gl.viewport( 0, 0, renderTarget.size.x, renderTarget.size.y );
			gl.bindFramebuffer( gl.FRAMEBUFFER, renderTarget.getFrameBuffer() );
			gl.drawBuffers( renderTarget.textureAttachmentList );

		} else {

			gl.viewport( 0, 0, this.canvasSize.x, this.canvasSize.y );
			gl.bindFramebuffer( gl.FRAMEBUFFER, null );

		}

		// clear

		if ( clear ) {

			gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
			gl.clearDepth( 1.0 );
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		}

		// render

		for ( let i = 0; i < entities.length; i ++ ) {

			const entity = entities[ i ];
			const material = entity.getComponent<Material>( "material" )!;
			const geometry = entity.getComponent<Geometry>( "geometry" )!;

			this.draw( entity.uuid.toString(), renderType, geometry, material, { ...cameraMatirx, modelMatrixWorld: entity.matrixWorld } );

		}

	}

	private collectLight( lightEntity: Entity ) {

		const lightComponent = lightEntity.getComponent<Light>( 'light' )!;
		const type = lightComponent.type;

		const info: LightInfo = {
			position: new GLP.Vector( 0.0, 0.0, 0.0, 1.0 ).applyMatrix4( lightEntity.matrixWorld ),
			direction: new GLP.Vector( 0.0, 1.0, 0.0, 0.0 ).applyMatrix4( lightEntity.matrixWorld ).normalize(),
			color: new GLP.Vector( lightComponent.color.x, lightComponent.color.y, lightComponent.color.z ).multiply( lightComponent.intensity ),
			component: lightComponent,
		};

		if ( type == 'directional' ) {

			this.lights.directionalLight.push( info );

		} else if ( type == 'spot' ) {

			this.lights.spotLight.push( info );

		}

		return lightComponent.renderTarget != null;

	}

	private renderPostProcess( postprocess: PostProcess, matrix?: CameraMatrix ) {

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

			this.draw( "id", "postprocess", this.quad, pass, matrix );

		}

	}

	private draw( drawId: string, renderType: MaterialRenderType, geometry: Geometry, material: Material, matrix?: RenderMatrix ) {

		this.textureUnit = 0;

		// status

		gl.enable( gl.CULL_FACE );
		gl.enable( gl.DEPTH_TEST );
		gl.disable( gl.BLEND );

		const defines = { ...material.defines };

		if ( renderType == 'deferred' ) defines.IS_DEFERRED = "";
		else if ( renderType == 'forward' || renderType == 'envMap' ) defines.IS_FORWARD = "";
		else if ( renderType == 'shadowMap' ) defines.IS_DEPTH = "";

		const vert = shaderParse( material.vert, defines, this.lights );
		const frag = shaderParse( material.frag, defines, this.lights );

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

		if ( material.useLight ) {

			for ( let i = 0; i < this.lights.directionalLight.length; i ++ ) {

				const dLight = this.lights.directionalLight[ i ];

				program.setUniform( 'directionalLight[' + i + '].direction', '3fv', dLight.direction.getElm( 'vec3' ) );
				program.setUniform( 'directionalLight[' + i + '].color', '3fv', dLight.color.getElm( 'vec3' ) );

				if ( dLight.component.renderTarget ) {

					const texture = dLight.component.renderTarget.textures[ 0 ].activate( this.textureUnit ++ );

					program.setUniform( 'directionalLightCamera[' + i + '].near', '1fv', [ dLight.component.near ] );
					program.setUniform( 'directionalLightCamera[' + i + '].far', '1fv', [ dLight.component.far ] );
					program.setUniform( 'directionalLightCamera[' + i + '].viewMatrix', 'Matrix4fv', dLight.component.viewMatrix.elm );
					program.setUniform( 'directionalLightCamera[' + i + '].projectionMatrix', 'Matrix4fv', dLight.component.projectionMatrix.elm );
					program.setUniform( 'directionalLightCamera[' + i + '].resolution', '2fv', texture.size.getElm( "vec2" ) );
					program.setUniform( 'directionalLightShadowMap[' + i + ']', '1i', [ texture.unit ] );

				}

			}

			for ( let i = 0; i < this.lights.spotLight.length; i ++ ) {

				const sLight = this.lights.spotLight[ i ];

				if ( matrix && matrix.viewMatrix ) {

					this.tmpLightDirection.copy( sLight.direction ).applyMatrix3( matrix.viewMatrix );

				}

				program.setUniform( 'spotLight[' + i + '].position', '3fv', sLight.position.getElm( 'vec3' ) );
				program.setUniform( 'spotLight[' + i + '].direction', '3fv', sLight.direction.getElm( 'vec3' ) );
				program.setUniform( 'spotLight[' + i + '].color', '3fv', sLight.color.getElm( 'vec3' ) );
				program.setUniform( 'spotLight[' + i + '].angle', '1fv', [ sLight.component.angle ] );
				program.setUniform( 'spotLight[' + i + '].blend', '1fv', [ sLight.component.blend ] );
				program.setUniform( 'spotLight[' + i + '].distance', '1fv', [ sLight.component.distance ] );
				program.setUniform( 'spotLight[' + i + '].decay', '1fv', [ sLight.component.decay ] );

				if ( sLight.component.renderTarget ) {

					const texture = sLight.component.renderTarget.textures[ 0 ].activate( this.textureUnit ++ );

					program.setUniform( 'spotLightCamera[' + i + '].near', '1fv', [ sLight.component.near ] );
					program.setUniform( 'spotLightCamera[' + i + '].far', '1fv', [ sLight.component.far ] );
					program.setUniform( 'spotLightCamera[' + i + '].viewMatrix', 'Matrix4fv', sLight.component.viewMatrix.elm );
					program.setUniform( 'spotLightCamera[' + i + '].projectionMatrix', 'Matrix4fv', sLight.component.projectionMatrix.elm );
					program.setUniform( 'spotLightCamera[' + i + '].resolution', '2fv', texture.size.getElm( "vec2" ) );
					program.setUniform( 'spotLightShadowMap[' + i + ']', '1i', [ texture.unit ] );

				}

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
