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
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
		<style>
			body{margin:0;width:100%;height:100%;overflow:hidden;}
			.cw{position:relative;width:100%;height:100%;background:#000;}
			canvas{width:100%;height:100%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}
			h1,h2{position:absolute;font-family:'Bebas Neue',sans-serif;}
			h1{left:1%;top:7%;font-size:20vmin;}
			h2{right:1vmin;bottom:-11vmin;font-size:40vmin;mix-blend-mode:difference;}
		</style>
		<div class="cw"></div>
		<h1>HAKIDAME</h1>
		<h2>1</h2>
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

		const canvasAspect = window.innerWidth / window.innerHeight;

		const scale = canvasAspect < 1.0 ? 0.9 : 1.0;

		const blkRatioX = canvasAspect < 1.0 ? 0.75 : 1.0;
		const blkRatioY = canvasAspect < 1.0 ? 0.7 : 0.5;

		const width = window.innerWidth * scale * blkRatioX;
		const height = window.innerHeight * scale * blkRatioY;

		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.style.width = width / scale + "";
		this.canvas.style.height = height / scale + "";

		this.scene.resize( new GLP.Vector( this.canvas.width, this.canvas.height ) );

	}

}

new App();
