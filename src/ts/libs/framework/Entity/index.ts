import * as GLP from 'glpower';
import { Material } from '../Components/Material';
import { BuiltInComponents, Component } from '../Components/Component';
import { Light } from '../Components/Light';

export type RenderStack = {
	light: Entity[],
	shadowMap: Entity[],
	deferred: Entity[],
	forward: Entity[],
	envMap: Entity[],
}

export type EntityUpdateEvent = {
	time: number,
	deltaTime: number,
	matrix?: GLP.Matrix,
	renderStack?: RenderStack;
}

export type EntityRenderQueue = {
	light: [],
	deferred: [],
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

		// stack

		if ( ! event.renderStack ) event.renderStack = {
			light: [],
			shadowMap: [],
			deferred: [],
			forward: [],
			envMap: [],
		};

		const material = this.getComponent<Material>( 'material' );

		if ( material ) {

			if ( material.visibility.deferred ) event.renderStack.deferred.push( this );
			if ( material.visibility.forward ) event.renderStack.forward.push( this );
			if ( material.visibility.envMap ) event.renderStack.envMap.push( this );

		}

		const light = this.getComponent<Light>( 'light' );

		if ( light ) {

			event.renderStack.light.push( this );

		}

		// matrix

		if ( ! event.matrix ) event.matrix = new GLP.Matrix();

		event.matrix = this.matrix;

		// components

		const componentEvent = { ...event, entity: this };

		this.components.forEach( c => {

			c.update( componentEvent );

		} );

		// children

		for ( let i = 0; i < this.children.length; i ++ ) {

			this.children[ i ].update( event );

		}

		return event.renderStack;

	}

	/*-------------------------------
		Components
	-------------------------------*/

	public addComponent<T extends Component>( name: BuiltInComponents, component: T ) {

		this.components.set( name, component );

	}

	public getComponent<T extends Component>( name: BuiltInComponents ): T | undefined {

		return this.components.get( name ) as T;

	}

	public removeComponent( name: string ) {

		this.components.delete( name );

	}

}
