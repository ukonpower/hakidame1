import * as GLP from 'glpower';
import { Entity } from '../libs/framework/Entity';

export class Scene extends GLP.EventEmitter {

	private root: Entity;

	constructor() {

		super();

		this.root = new Entity();

	}

	public update() {
	}

	public resize( size: GLP.Vector ) {
	}

	public dispose() {

		this.emit( 'dispose' );

	}

}
