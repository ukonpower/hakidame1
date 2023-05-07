import * as GLP from 'glpower';
import { blidge } from '~/ts/Globals';
import { Material } from '~/ts/libs/framework/Components/Material';
import { Entity } from '~/ts/libs/framework/Entity';

import basicVert from './shaders/basic.vs';
import basicFrag from './shaders/basic.fs';
import { CubeGeometry } from '~/ts/libs/framework/Components/Geometry/CubeGeometry';
import { BLidger } from '~/ts/libs/framework/Components/BLidger';

export class Carpenter extends GLP.EventEmitter {

	private root: Entity;
	private blidgeRoot: Entity | null;
	private camera: Entity;
	private entities: Map<string, Entity>;

	// frame

	private playing: boolean;
	private playTime: number;

	constructor( root: Entity, camera: Entity ) {

		super();

		this.root = root;
		this.camera = camera;
		this.entities = new Map();

		// state

		this.playing = false;
		this.playTime = 0;

		// blidge

		this.blidgeRoot = null;

		blidge.on( 'sync/scene', this.onSyncScene.bind( this ) );

		blidge.on( 'sync/timeline', ( frame: GLP.BLidgeFrame ) => {
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

		const timeStamp = new Date().getTime();

		const _ = ( param: GLP.BLidgeNode ): Entity => {

			const entity = this.entities.get( param.name ) || new Entity();

			if ( entity ) {

				const blidge = entity.getComponent<BLidger>( "blidger" );

				if ( blidge && param.type != blidge.param.type ) {

					const geoComp = entity.removeComponent( 'geometry' );
					geoComp && geoComp.dispose();

					const matComp = entity.removeComponent( 'material' );
					matComp && matComp.dispose();


				}

			}

			if ( param.type == 'cube' ) {

				entity.addComponent( 'geometry', new CubeGeometry( 2.0, 2.0, 2.0 ) );
				entity.addComponent( "material", new Material( {
					type: [ "deferred" ],
					vert: basicVert,
					frag: basicFrag,
				} ) );

			}

			entity.addComponent( "blidger", new BLidger( param ) );

			param.children.forEach( c => {

				const child = _( c );

				entity.add( child );

			} );

			this.entities.set( entity.name, entity );

			entity.userData.updateTime = timeStamp;

			return entity;

		};

		const newBLidgeRoot = blidge.root && _( blidge.root );

		if ( newBLidgeRoot ) {

			if ( this.blidgeRoot ) {

				this.root.remove( this.blidgeRoot );

			}

			this.blidgeRoot = newBLidgeRoot;

			this.root.add( this.blidgeRoot );

		}

		// remove

		this.entities.forEach( item => {

			if ( item.userData.updateTime != timeStamp ) {

				const parent = item.parent;

				if ( parent ) {

					parent.remove( item );

				}

				item.dispose();
				this.entities.delete( item.name );

			}

		} );

		console.log( this.root.children );


	}

}
