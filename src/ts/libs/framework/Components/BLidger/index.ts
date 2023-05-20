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

	public setEntityImpl( entity: Entity ): void {

		entity.name = this.param.name;

		entity.position.copy( this.param.position );

		entity.quaternion.setFromEuler( {
			x: this.param.rotation.x + this.rotationOffsetX,
			y: this.param.rotation.y,
			z: this.param.rotation.z,
		}, 'YZX' );

		entity.scale.copy( this.param.scale );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

	}

	public onCompleteSyncScene() {

		console.log( "aaaa" );


	}

}
