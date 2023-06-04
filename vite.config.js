import path from 'path';
import { defineConfig } from 'vite';
import glslify from 'rollup-plugin-glslify';
import { visualizer } from 'rollup-plugin-visualizer';

const basePath = '/1/';

export default defineConfig( {
	root: 'src',
	publicDir: 'public',
	base: basePath,
	server: {
		port: 3000,
		host: "0.0.0.0",
	},
	build: {
		outDir: '../public/',
		minify: 'terser',
		rollupOptions: {
			input: {
				index: path.resolve( __dirname, 'src/index.html' ),
			},
		}
	},
	resolve: {
		alias: {
			"glpower": path.join( __dirname, "src/ts/libs/glpower_local" ),
			"~": path.join( __dirname, "src" ),
		},
	},
	plugins: [
		{
			...glslify( {
				basedir: './src/glsl/',
				transform: [
					[ 'glslify-hex' ],
					[ 'glslify-import' ]
				],
				compress: false,
			} ),
			enforce: 'pre'
		},
		visualizer( {
			template: "treemap"
		} ),
	],
	define: {
		BASE_PATH: `"${basePath}"`
	}
} );
