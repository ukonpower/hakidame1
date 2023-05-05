import * as GLP from 'glpower';
import { Entity, EntityResizeEvent, EntityUpdateEvent } from '../Entity';

export type ComponentUpdateEvent = EntityUpdateEvent & {
	entity: Entity,
}

export type ComponentResizeEvent = EntityResizeEvent & {
	entity: Entity,
}

export type BuiltInComponents =
	'camera' |
	'cameraShadowMap' |
	'perspective' |
	"orthographic" |
	'material' |
	'geometry' |
	'light' |
	'blidge' |
( string & {} );

export class Component extends GLP.EventEmitter {

	protected entity: Entity | null;

	constructor() {

		super();

		this.entity = null;

	}

	public setEntity( entity: Entity | null ) {

		if ( this.entity ) {

			this.onRemoveEnpty( this.entity );

		}

		this.entity = entity;

		if ( this.entity ) {

			this.onSetEntity( this.entity );

		}

	}

	public update( event: ComponentUpdateEvent ) {

		if ( this.entity ) {

			this.updateImpl( event );

		}

	}

	public resize( event: ComponentResizeEvent ) {

		if ( this.entity ) {

			this.resizeImpl( event );

		}

	}


	protected onSetEntity( entity: Entity ) {
	}

	protected onRemoveEnpty( entity: Entity ) {
	}

	protected updateImpl( event: ComponentUpdateEvent ) {
	}

	protected resizeImpl( event: ComponentResizeEvent ) {}

}
