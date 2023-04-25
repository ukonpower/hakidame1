import * as GLP from 'glpower';
import { Component } from '../Component';

export type EntityUpdateEvent = {
	time: number,
	deltaTime: number,
	matrix: GLP.Matrix,
}

export class Entity extends GLP.EventEmitter {

	public position: GLP.Vector;
	public rotation: GLP.Vector;
	public quaternion: GLP.Quaternion;
	public scale: GLP.Vector;

	private matrix: GLP.Matrix;
	private matrixWorld: GLP.Matrix;

	private children: Entity[];
	private components: Map<string, Component>;

	constructor() {

		super();

		this.position = new GLP.Vector();
		this.rotation = new GLP.Vector();
		this.quaternion = new GLP.Quaternion();
		this.scale = new GLP.Vector();

		this.matrix = new GLP.Matrix();
		this.matrixWorld = new GLP.Matrix();

		this.children = [];

		this.components = new Map();

	}

	/*-------------------------------
		Update
	-------------------------------*/

	public update( event: EntityUpdateEvent ) {

		// update matrix

		const componentEvent = { ...event, entity: this };

		this.components.forEach( c => {

			c.update( componentEvent );

		} );

		event.matrix = this.matrix;

		for ( let i = 0; i < this.children.length; i ++ ) {

			this.children[ i ].update( event );

		}

	}

	/*-------------------------------
		Components
	-------------------------------*/

	public addComponent<T extends Component>( name: string, component: Component ) {

		this.components.set( name, component );

	}

	public getComponent<T extends Component>( name: string ): T | undefined {

		return this.components.get( name ) as T;

	}

	public removeComponent( name: string ) {

		this.components.delete( name );

	}

}
