import { Component } from '..';
import { PostProcessPass } from '../PostProcessPass';

export interface PostProcessParam {
	passes: PostProcessPass[]
}

export class PostProcess extends Component {

	public passes: PostProcessPass[];

	constructor( param: PostProcessParam ) {

		super();

		this.passes = param.passes;

	}

}
