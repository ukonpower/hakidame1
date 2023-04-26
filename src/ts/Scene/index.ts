import * as GLP from 'glpower';
import { Entity } from '../libs/framework/Entity';
import { Carpenter } from './Carpenter';

export class Scene extends GLP.EventEmitter {

	private currentTime: number;
	private elapsedTime: number;
	private deltaTime: number;

	private root: Entity;
	private camera: Entity;

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

	}

	public update() {

		const currentTime = new Date().getTime();
		this.deltaTime = currentTime - this.currentTime;
		this.elapsedTime += this.deltaTime;

		const stack = this.root.update( {
			time: this.elapsedTime,
			deltaTime: this.deltaTime,
		} );

		// console.log( stack );

	}

	public resize( size: GLP.Vector ) {
	}

	public dispose() {

		this.emit( 'dispose' );

	}

}
