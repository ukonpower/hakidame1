import * as GLP from 'glpower';
import { Entity, EntityResizeEvent } from '../libs/framework/Entity';
import { Carpenter } from './Carpenter';
import { Renderer } from '../libs/framework/Renderer';
import { gl, globalUniforms, power } from '../Globals';

import { MainCamera } from './Entities/MainCamera';
import { Material } from '../libs/framework/Components/Material';


import basicVert from './shaders/basic.vs';
import basicFrag from './shaders/basic.fs';
import { CubeGeometry } from '../libs/framework/Components/Geometry/CubeGeometry';


export class Scene extends GLP.EventEmitter {

	private currentTime: number;
	private elapsedTime: number;
	private deltaTime: number;

	private root: Entity;
	private camera: Entity;
	private renderer: Renderer;

	private carpenter: Carpenter;

	constructor() {

		super();

		// state

		this.currentTime = new Date().getTime();
		this.elapsedTime = 0;
		this.deltaTime = 0;

		// root

		this.root = new Entity();

		// camera

		const gBuffer = new GLP.GLPowerFrameBuffer( gl );
		gBuffer.setTexture( [
			power.createTexture().setting( { type: gl.FLOAT, internalFormat: gl.RGBA32F, format: gl.RGBA } ),
			power.createTexture().setting( { type: gl.FLOAT, internalFormat: gl.RGBA32F, format: gl.RGBA } ),
			power.createTexture(),
			power.createTexture(),
		] );

		const deferredBuffer = new GLP.GLPowerFrameBuffer( gl, { disableDepthBuffer: true } );
		deferredBuffer.setTexture( [ power.createTexture(), power.createTexture() ] );

		const forwardBuffer = new GLP.GLPowerFrameBuffer( gl, { disableDepthBuffer: true } );
		forwardBuffer.setDepthTexture( gBuffer.depthTexture );
		forwardBuffer.setTexture( [ deferredBuffer.textures[ 0 ] ] );

		this.root.on( 'resize', ( event: EntityResizeEvent ) => {

			gBuffer.setSize( event.resolution );
			deferredBuffer.setSize( event.resolution );
			forwardBuffer.setSize( event.resolution );

		} );

		this.camera = new MainCamera( { renderTarget: { gBuffer, deferredBuffer, forwardBuffer } } );
		this.camera.position.set( 0, 0, 4 );
		this.root.add( this.camera );

		// carpenter

		this.carpenter = new Carpenter( this.root, this.camera );

		// renderer

		this.renderer = new Renderer();
		this.root.add( this.renderer );

	}

	public update() {

		const currentTime = new Date().getTime();
		this.deltaTime = ( currentTime - this.currentTime ) / 1000;
		this.elapsedTime += this.deltaTime;
		this.currentTime = currentTime;

		globalUniforms.time.uTime.value = this.elapsedTime;
		globalUniforms.time.uFractTime.value = this.elapsedTime % 1;

		const renderStack = this.root.update( {
			time: this.elapsedTime,
			deltaTime: this.deltaTime,
		} );

		this.root.noticeRecursive( "sceneUpdated", this.root );

		this.emit( "update" );

		this.renderer.render( renderStack );

	}

	public resize( size: GLP.Vector ) {

		this.root.resize( {
			resolution: size
		} );

	}

	public dispose() {

		this.emit( 'dispose' );

	}

}
