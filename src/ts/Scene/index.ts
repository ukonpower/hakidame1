import * as GLP from 'glpower';
import { Entity, EntityResizeEvent } from '../libs/framework/Entity';
import { Carpenter } from './Carpenter';
import { Renderer } from '../libs/framework/Renderer';
import { Material } from '../libs/framework/Components/Material';
import { CubeGeometry } from '../libs/framework/Components/Geometry/CubeGeometry';
import { gl, power } from '../Globals';

import basicVert from './shaders/basic.vs';
import basicFrag from './shaders/basic.fs';

import { MainCamera } from './Entities/MainCamera';
import { Light } from '../libs/framework/Components/Light';


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

		const outBuffer = new GLP.GLPowerFrameBuffer( gl );
		outBuffer.setDepthBuffer( gBuffer.depthRenderBuffer );
		outBuffer.setTexture( [ power.createTexture() ] );

		const transparencyBuffer = new GLP.GLPowerFrameBuffer( gl, { disableDepthBuffer: true } );
		outBuffer.setTexture( [ power.createTexture() ] );

		this.root.on( 'resize', ( event: EntityResizeEvent ) => {

			gBuffer.setSize( event.resolution );
			outBuffer.setSize( event.resolution );
			transparencyBuffer.setSize( event.resolution );

		} );

		this.camera = new MainCamera( { renderTarget: { gBuffer, outBuffer, transparencyBuffer } } );
		this.camera.position.set( 0, 0, 4 );
		this.root.add( this.camera );

		// carpenter

		this.carpenter = new Carpenter( this.root, this.camera );

		// debug scene

		const box = new Entity();
		box.addComponent( 'geometry', new CubeGeometry() );
		box.addComponent( "material", new Material( {
			type: [ "deferred" ],
			vert: basicVert,
			frag: basicFrag,
		} ) );
		this.root.add( box );

		// light

		const light = new Entity();
		light.addComponent<Light>( 'light', new Light( {
			type: "spot",
			useShadowMap: true,
		} ) );
		light.position.set( 0, 2, 0 );

		this.root.add( light );


		this.on( "update", () => {

			box.rotation.x += 0.05;
			box.rotation.y += 0.01;

		} );

		// renderer

		this.renderer = new Renderer();

	}

	public update() {

		const currentTime = new Date().getTime();
		this.deltaTime = currentTime - this.currentTime;
		this.elapsedTime += this.deltaTime;

		const renderStack = this.root.update( {
			time: this.elapsedTime,
			deltaTime: this.deltaTime,
		} );

		this.emit( "update" );

		this.renderer.update( renderStack );

	}

	public resize( size: GLP.Vector ) {

		this.root.resize( {
			resolution: size
		} );

		this.renderer.resize( size );

	}

	public dispose() {

		this.emit( 'dispose' );

	}

}
