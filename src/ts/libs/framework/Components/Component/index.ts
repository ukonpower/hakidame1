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
( string & {} );

export class Component extends GLP.EventEmitter {

	protected entity: Entity;

	constructor( entity: Entity ) {

		super();

		this.entity = entity;

	}

	public update( event: ComponentUpdateEvent ) {

	}

}
