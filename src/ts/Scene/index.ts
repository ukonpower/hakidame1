import * as GLP from 'glpower';
import { Entity } from '../libs/framework/Entity';
import { Carpenter } from './Carpenter';
import { Renderer } from '../libs/framework/Renderer';
import { Material } from '../libs/framework/Components/Material';

import basicVert from './shaders/basic.vs';
import basicFrag from './shaders/basic.fs';
import { CubeGeometry } from '../libs/framework/Components/Geometry/CubeGeometry';
import { Camera } from '../libs/framework/Components/Camera';

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

		this.camera = new Entity();
		this.camera.addComponent( "camera", new Camera() );
		this.camera.position.set( 0, 0, 5 );
		this.root.add( this.camera );

		// carpenter

		this.carpenter = new Carpenter( this.root, this.camera );

		// debug scene

		const box = new Entity();
		// box.addComponent( 'geometry', new CubeGeometry() );
		// box.addComponent( "material", new Material( {
		// 	type: [ "deferred" ],
		// 	vert: basicVert,
		// 	frag: basicFrag,
		// } ) );

		this.root.add( box );

		this.on( "update", () => {

			box.rotation.x += 0.1;
			box.rotation.y += 0.05;

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

		const aspect = size.x / size.y;

		this.camera.getComponent<Camera>( "camera" )!.resize( aspect );

		this.renderer.resize( size );

	}

	public dispose() {

		this.emit( 'dispose' );

	}

}
