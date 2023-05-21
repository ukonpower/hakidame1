import * as GLP from 'glpower';

import { Material } from '~/ts/libs/framework/Components/Material';
import { Entity } from '~/ts/libs/framework/Entity';
import { hotGet, hotUpdate } from '~/ts/libs/framework/Utils/Hot';
import content1Frag from './shaders/content1.fs';
import { globalUniforms } from '~/ts/Globals';

export class Content1 extends Entity {

	constructor() {

		super();

		const mat = this.addComponent( "material", new Material( {
			type: [ "deferred", "shadowMap" ],
			uniforms: GLP.UniformsUtils.merge( globalUniforms.time ),
			frag: hotGet( 'content1Frag', content1Frag )
		} ) );

		if ( import.meta.hot ) {

			import.meta.hot.accept( "./shaders/content1.fs", ( module ) => {

				if ( module ) {

					mat.frag = hotUpdate( 'content1', module.default );
					mat.requestUpdate();

				}

			} );

		}

	}

}
