import path from 'path';
import { defineConfig } from 'vite';
import glslify from 'rollup-plugin-glslify';
import shaderminifier from './plugins/shader-minifier-loader';
import { visualizer } from 'rollup-plugin-visualizer';

const basePath = '/1';

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
			},
			output: {
				dir: './public',
			}
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
		// {
		// 	...shaderminifier(),
		// 	enforce: 'pre'
		// },
		visualizer( {
			template: "treemap"
		} ),
	],
	define: {
		BASE_PATH: `"${basePath}"`
	}
} );
