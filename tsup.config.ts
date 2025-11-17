import { defineConfig } from 'tsup'

export default defineConfig({
	entry: {
		server: 'src/server.ts',
	},
	format: ['cjs'],
	splitting: false,
	sourcemap: true,
	outDir: 'build',
	tsconfig: 'tsconfig.json',
})
