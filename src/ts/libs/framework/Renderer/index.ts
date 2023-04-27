import { Entity } from "../Entity";

export type RenderStack = {
	light: Entity[],
	shadowMap: Entity[],
	deferred: Entity[],
	forward: Entity[],
	envMap: Entity[],
}

export class Renderer {

	constructor() {

	}

	public update( stack: RenderStack ) {


	}

}
