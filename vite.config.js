import path from 'path';
import { defineConfig } from 'vite';

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
	define: {
		BASE_PATH: `"${basePath}"`
	}
} );
