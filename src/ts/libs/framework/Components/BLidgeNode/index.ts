import * as GLP from 'glpower';

import { Component, ComponentUpdateEvent } from "../Component";
import { Entity } from '../../Entity';

export class BLidgeNode extends Component {

	private param: GLP.BLidgeNodeParam;

	constructor( param: GLP.BLidgeNodeParam ) {

		super();

		this.param = param;

	}

	public onSetEntity( entity: Entity ): void {

		entity.name = this.param.name;

		entity.position.copy( this.param.position );
		entity.rotation.copy( this.param.rotation );
		entity.scale.copy( this.param.scale );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

	}

}
