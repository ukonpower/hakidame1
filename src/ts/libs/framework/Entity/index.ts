import * as GLP from 'glpower';
import { Material } from '../Components/Material';
import { BuiltInComponents, Component } from '../Components/Component';
import { Light } from '../Components/Light';
import { RenderStack } from '../Renderer';
import { Camera } from '../Components/Camera';

export type EntityUpdateEvent = {
	time: number,
	deltaTime: number,
	matrix?: GLP.Matrix,
	renderStack?: RenderStack;
}

export class Entity extends GLP.EventEmitter {

	public name: string;
	public uuid: number;

	public position: GLP.Vector;
	public rotation: GLP.Vector;
	public quaternion: GLP.Quaternion;
	public scale: GLP.Vector;

	public matrix: GLP.Matrix;
	public matrixWorld: GLP.Matrix;

	public parent: Entity | null;
	public children: Entity[];
	public components: Map<string, Component>;

	constructor() {

		super();

		this.name = "";
		this.uuid = new Date().getTime() + Math.floor( Math.random() * 1000000 );

		this.position = new GLP.Vector();
		this.rotation = new GLP.Vector();
		this.quaternion = new GLP.Quaternion();
		this.scale = new GLP.Vector();

		this.matrix = new GLP.Matrix();
		this.matrixWorld = new GLP.Matrix();

		this.parent = null;
		this.children = [];

		this.components = new Map();

	}

	/*-------------------------------
		Update
	-------------------------------*/

	public update( event: EntityUpdateEvent ) {

		// stack

		if ( ! event.renderStack ) event.renderStack = {
			camera: [],
			light: [],
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

		const camera = this.getComponent<Camera>( 'camera' );

		if ( camera ) {

			event.renderStack.camera.push( this );

		}

		const light = this.getComponent<Light>( 'light' );

		if ( light ) {

			event.renderStack.light.push( this );

		}

		// matrix

		if ( ! event.matrix ) event.matrix = new GLP.Matrix();

		this.matrix.setFromTransform( this.position, this.quaternion, this.scale );

		this.matrixWorld.copy( this.matrix ).preMultiply( event.matrix );

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
		SceneGraph
	-------------------------------*/

	public add( entity: Entity ) {

		entity.parent = this;

		this.children.push( entity );

	}

	public remove( entity: Entity ) {

		this.children = this.children.filter( c => c.uuid != entity.uuid );

	}

	/*-------------------------------
		Components
	-------------------------------*/

	public addComponent<T extends Component>( name: BuiltInComponents, component: T ) {

		component.setEntity( this );

		this.components.set( name, component );

	}

	public getComponent<T extends Component>( name: BuiltInComponents ): T | undefined {

		return this.components.get( name ) as T;

	}

	public removeComponent( name: string ) {

		this.components.delete( name );

	}

	/*-------------------------------
		Dispose
	-------------------------------*/

	public dispose() {

		this.emit( "dispose" );

		this.parent && this.parent.remove( this );

		this.children.forEach( c => c.parent = null );

		this.components.forEach( c => c.setEntity( null ) );

	}

}
