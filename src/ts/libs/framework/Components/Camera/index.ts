import * as GLP from 'glpower';

import { Component, ComponentUpdateEvent } from "..";

export class Camera extends Component {

	public projectionMatrix: GLP.Matrix;
	public viewMatrix: GLP.Matrix;
	public renderTarget: GLP.GLPowerFrameBuffer | null;

	public fov: number;
	public aspect: number;
	public near: number;
	public far: number;

	constructor() {

		super();

		this.viewMatrix = new GLP.Matrix();
		this.projectionMatrix = new GLP.Matrix();

		this.renderTarget = null;

		this.fov = 50;
		this.near = 0.01;
		this.far = 1000;
		this.aspect = 1.0;

	}

	public updateProjectionMatrix() {

		this.projectionMatrix.perspective( this.fov, this.aspect, this.near, this.far );

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		this.viewMatrix.copy( event.entity.matrixWorld ).inverse();

	}

	public setRenderTarget( renderTarget: GLP.GLPowerFrameBuffer | null ) {

		this.renderTarget = renderTarget;

	}

	public resize( aspect: number ) {

		this.aspect = aspect;

		this.updateProjectionMatrix();

	}

}
