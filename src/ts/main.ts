import * as GLP from 'glpower';
import { canvas } from './Globals';
import { Scene } from "./Scene";

class App {

	private scene: Scene;

	private canvas: HTMLCanvasElement;
	private canvasWrap: HTMLElement;

	constructor() {

		// elms

		document.body.innerHTML = `
		<style>
			body{margin:0;}
			.cw{position:relative;width:100%;height:100%;background:#000;}
			canvas{width:100%;height:100%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}
		</style>
		<div class="cw"></div>
		`;

		this.canvasWrap = document.querySelector( '.cw' )!;

		this.canvas = canvas;
		this.canvasWrap.appendChild( this.canvas );

		// scene

		this.scene = new Scene();

		// event

		window.addEventListener( 'resize', this.resize.bind( this ) );

		this.resize();

		// animate

		this.animate();

	}


	private animate() {

		this.scene.update();

		window.requestAnimationFrame( this.animate.bind( this ) );

	}

	private resize() {

		const scale = 1.0;
		const width = window.innerWidth * scale, height = window.innerHeight * scale;

		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.style.width = width / scale + "";
		this.canvas.style.height = height / scale + "";

		this.scene.resize( new GLP.Vector( this.canvas.width, this.canvas.height ) );

	}

}

new App();
