import * as GLP from 'glpower';
import { Entity, EntityUpdateEvent } from '../../Entity';

export type ComponentUpdateEvent = EntityUpdateEvent & {
	entity: Entity
}

export type BuiltInComponents =
	'camera' |
	'perspective' |
	"orthographic" |
	'material' |
	'geometry' |
	'light' |
	'blidge' |
( string & {} );

export class Component extends GLP.EventEmitter {

	protected entity: Entity | null;

	constructor( ) {

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

	protected onSetEntity( entity: Entity ) {
	}

	protected onRemoveEnpty( entity: Entity ) {
	}

	protected updateImpl( event: ComponentUpdateEvent ) {
	}

}
