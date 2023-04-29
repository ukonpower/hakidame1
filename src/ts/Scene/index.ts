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
		this.camera = new Entity();

		// carpenter

		this.carpenter = new Carpenter( this.root, this.camera );

		// debug scene

		const box = new Entity();
		box.addComponent( 'geometry', new CubeGeometry() );
		box.addComponent( 'materi', new Material( {
			type: [ "deferred" ],
			vert: basicVert,
			frag: basicFrag,
		} ) );

		this.root.add( box );

		const camera = new Entity();
		camera.addComponent( "camera", new Camera() );
		this.root.add( camera );

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

		this.renderer.update( renderStack );

	}

	public resize( size: GLP.Vector ) {
	}

	public dispose() {

		this.emit( 'dispose' );

	}

}
