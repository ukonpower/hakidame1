import * as GLP from 'glpower';
import { Entity, EntityUpdateEvent } from '../Entity';

export type ComponentUpdateEvent = EntityUpdateEvent & {
	entity: Entity
}

export class Component extends GLP.EventEmitter {

	constructor() {

		super();

	}

	public update( event: ComponentUpdateEvent ) {

	}

}
