import * as GLP from 'glpower';

import { Component, ComponentUpdateEvent } from "..";
import { Entity } from '../../Entity';

export class BLidger extends Component {

	public param: GLP.BLidgeNode;
	private rotationOffsetX: number;

	constructor( param: GLP.BLidgeNode ) {

		super();

		this.param = param;

		this.rotationOffsetX = 0;

		if ( this.param.type == "camera" ) {

			this.rotationOffsetX = - Math.PI / 2;

		}

	}

	public onSetEntity( entity: Entity ): void {

		entity.name = this.param.name;

		entity.position.copy( this.param.position );

		entity.rotation.copy( this.param.rotation );
		entity.rotation.x += this.rotationOffsetX;
		entity.rotation.order = "YZX";

		entity.scale.copy( this.param.scale );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

	}

}
