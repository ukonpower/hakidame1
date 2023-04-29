import * as GLP from 'glpower';

import { gl, power } from "~/ts/Globals";
import { Camera } from "../Components/Camera";
import { Geometry } from "../Components/Geometry";
import { Material, MaterialType } from "../Components/Material";
import { Entity } from "../Entity";
import { ProgramManager } from "./ProgramManager";
import { shaderParse } from "./ShaderParser";

export type RenderStack = {
	light: Entity[],
	camera: Entity[],
	envMap: Entity[],
	deferred: Entity[],
	forward: Entity[],
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

	constructor() {

		this.programManager = new ProgramManager( power );

		// matrix

		this.tmpModelViewMatrix = new GLP.Matrix();
		this.tmpNormalMatrix = new GLP.Matrix();

		this.canvasSize = new GLP.Vector();

		// tmp

		this.tmpLightDirection = new GLP.Vector();
		this.tmpModelMatrixInverse = new GLP.Matrix();
		this.tmpProjectionMatrixInverse = new GLP.Matrix();

	}

	public update( stack: RenderStack ) {

		// shadowmap

		// for ( let i = 0; i < stack.light.length; i ++ ) {

		// 	const l = stack.light[ i ];

		// 	this.render( "depth", );

		// }

		// envmap

		// for ( let i	 = 0; i < 4; i ++ ) {

		// this.render( "envMap", camera );

		// }

		for ( let i = 0; i < stack.camera.length; i ++ ) {

			this.render( "deferred", stack.camera[ i ], stack.deferred );

			// this.render( "forward", s/tack.camera[ i ], stack.forward );

		}

		// for ( let i = 0; i < postprocess.length; i++ ) {

		// postprocess

		// }

	}

	public resize( canvasSize: GLP.Vector ) {

		this.canvasSize.copy( canvasSize );

	}

	private render( materialType: MaterialType, camera: Entity, entities: Entity[] ) {

		const cameraComponent = camera.getComponent<Camera>( 'camera' )!;

		const renderTarget = null;

		if ( renderTarget ) {

			// gl.viewport( 0, 0, renderTarget.size.x, renderTarget.size.y );
			// gl.bindFramebuffer( gl.FRAMEBUFFER, renderTarget.getFrameBuffer() );
			// gl.drawBuffers( renderTarget.textureAttachmentList );

		} else {

			gl.viewport( 0, 0, this.canvasSize.x, this.canvasSize.y );
			gl.bindFramebuffer( gl.FRAMEBUFFER, null );

		}

		// clear

		gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
		gl.clearDepth( 1.0 );
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		// status

		gl.enable( gl.CULL_FACE );
		gl.enable( gl.DEPTH_TEST );
		gl.disable( gl.BLEND );

		// render

		for ( let i = 0; i < entities.length; i ++ ) {

			const entity = entities[ i ];

			const material = entity.getComponent<Material>( "material" )!;
			const geometry = entity.getComponent<Geometry>( "geometry" )!;

			const vert = shaderParse( material.vert, {} );
			const frag = shaderParse( material.frag, {} );

			const program = this.programManager.get( vert, frag );

			program.setUniform( 'modelMatrix', 'Matrix4fv', entity.matrixWorld.elm );
			program.setUniform( 'modelMatrixInverse', 'Matrix4fv', this.tmpModelMatrixInverse.copy( entity.matrixWorld ).inverse().elm );

			this.tmpModelViewMatrix.copy( entity.matrixWorld ).preMultiply( cameraComponent.viewMatrix );

			this.tmpNormalMatrix.copy( this.tmpModelViewMatrix );
			this.tmpNormalMatrix.inverse();
			this.tmpNormalMatrix.transpose();

			program.setUniform( 'normalMatrix', 'Matrix4fv', this.tmpNormalMatrix.elm );
			program.setUniform( 'modelViewMatrix', 'Matrix4fv', this.tmpModelViewMatrix.elm );

			program.setUniform( 'cameraMatrix', 'Matrix4fv', camera.matrixWorld.elm );
			program.setUniform( 'viewMatrix', 'Matrix4fv', cameraComponent.viewMatrix.elm );
			program.setUniform( 'projectionMatrix', 'Matrix4fv', cameraComponent.projectionMatrix.elm );
			program.setUniform( 'projectionMatrixInverse', 'Matrix4fv', this.tmpProjectionMatrixInverse.copy( cameraComponent.projectionMatrix ).inverse().elm );

			const vao = program.getVAO( entity.uuid.toString() );

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

	}

}
