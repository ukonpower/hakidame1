import * as GLP from 'glpower';

import { Component, ComponentUpdateEvent } from "../Component";

export class Camera extends Component {

	public projectionMatrix: GLP.Matrix;
	public viewMatrix: GLP.Matrix;
	public renderTarget: GLP.GLPowerFrameBuffer | null;

	constructor() {

		super();

		this.viewMatrix = new GLP.Matrix();
		this.projectionMatrix = new GLP.Matrix();

		this.renderTarget = null;

	}

	public updateProjectionMatrix() {
	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		this.viewMatrix.copy( event.entity.matrix ).inverse();

	}

	public setRenderTarget( renderTarget: GLP.GLPowerFrameBuffer | null ) {

		this.renderTarget = renderTarget;

	}

}
