import * as GLP from 'glpower';
import { Component, ComponentUpdateEvent } from '..';
import { Pointer, PointerEventArgs } from '~/ts/libs/Pointer';

export class OrbitControls extends Component {

	private pointer: Pointer;
	private offsetRot: GLP.Vector;
	private offsetPos: GLP.Vector;

	constructor( targetElm: HTMLCanvasElement ) {

		super();

		this.pointer = new Pointer();
		this.offsetRot = new GLP.Vector();
		this.offsetPos = new GLP.Vector();

		this.pointer.registerElement( targetElm );

		let touching = false;

		this.pointer.on( "start", ( e: PointerEventArgs ) => {

			if ( touching ) return;

			touching = true;

		} );

		this.pointer.on( "move", ( e: PointerEventArgs ) => {

			if ( ! touching ) return;

			this.offsetRot.add( { x: e.delta.x * 0.003, y: e.delta.y * 0.003 } );

		} );

		this.pointer.on( "end", ( e: PointerEventArgs ) => {

			if ( ! touching ) return;

			touching = false;

			this.offsetRot.set( 0, 0 );

		} );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		const entity = event.entity;

		const qua = new GLP.Quaternion().copy( event.entity.quaternion );

		this.offsetPos.set( this.offsetRot.x, - this.offsetRot.y, 0.0, 1.0 );
		this.offsetPos.applyMatrix4( new GLP.Matrix().applyQuaternion( qua ) );

		entity.position.set( 0, 0, 0, 1 );
		entity.position.applyMatrix4( new GLP.Matrix().applyPosition( this.offsetPos ) );

		// positionComponent.x = pos.x;
		// positionComponent.y = pos.y;
		// positionComponent.z = pos.z;

		// rotComponent.x = qua.x;
		// rotComponent.y = qua.y;
		// rotComponent.z = qua.z;
		// rotComponent.w = qua.w;

	}


}
