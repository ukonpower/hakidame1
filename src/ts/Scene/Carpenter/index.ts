import * as GLP from 'glpower';
import { blidge } from '~/ts/Globals';
import { BLidgeNode } from '~/ts/libs/framework/Components/BLidgeNode';
import { Entity } from '~/ts/libs/framework/Entity';

export class Carpenter extends GLP.EventEmitter {

	private root: Entity;
	private camera: Entity;
	private objects: Map<string, Entity>;

	// frame

	private playing: boolean;
	private playTime: number;

	constructor( root: Entity, camera: Entity ) {

		super();

		this.root = root;
		this.camera = camera;
		this.objects = new Map();

		// state

		this.playing = false;
		this.playTime = 0;

		// blidge

		blidge.on( 'sync/scene', this.onSyncScene.bind( this ) );

		blidge.on( 'sync/timeline', ( frame: GLP.BLidgeSceneFrame ) => {
		} );

		if ( process.env.NODE_ENV == "development" ) {

			blidge.connect( 'ws://localhost:3100' );

			blidge.on( 'error', () => {

				// blidge.loadScene( SceneData );

			} );

		} else {

			// blidge.loadScene( SceneData );

		}

	}

	private onSyncScene( blidge: GLP.BLidge ) {

		// const timeStamp = new Date().getTime();

		const _ = ( param: GLP.BLidgeNodeParam ): Entity => {

			const obj = new Entity();

			if ( this.objects.get( param.name ) ) obj.dispose();

			obj.addComponent( "blidge", new BLidgeNode( param ) );

			param.children.forEach( c => {

				const child = _( c );

				obj.add( child );

			} );

			return obj;

		};

		const root = blidge.scene && _( blidge.scene );

		if ( root ) {

			this.root.add( root );

		}

		console.log( root );

		// remove

	}

}
