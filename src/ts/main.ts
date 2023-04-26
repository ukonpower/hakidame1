import * as GLP from 'glpower';
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
		<div class="cw"><canvas></div>
		`;

		this.canvas = document.querySelector( 'canvas' )!;
		this.canvasWrap = this.canvas.parentElement!;

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
		const width = 1920 * scale, height = 1080 * scale;
		const aspect = width / height;

		const wrapperWidth = this.canvasWrap.clientWidth;
		const wrapperHeight = this.canvasWrap.clientHeight;
		const wrapperAspect = wrapperWidth / wrapperHeight;

		let canvasStyleWidth = 0;
		let canvasStyleHeight = 0;

		if ( wrapperAspect > aspect ) {

			canvasStyleHeight = wrapperHeight;
			canvasStyleWidth = canvasStyleHeight * aspect;

		} else {

			canvasStyleWidth = wrapperWidth;
			canvasStyleHeight = canvasStyleWidth / aspect;

		}

		this.canvas.style.width = canvasStyleWidth + 'px';
		this.canvas.style.height = canvasStyleHeight + 'px';

		this.canvas.width = width;
		this.canvas.height = height;

		this.scene.resize( new GLP.Vector( this.canvas.width, this.canvas.height ) );

	}

}

new App();
