import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	build: {
		outDir: "../src/main/resources/static",
		emptyOutDir: true,
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ["phaser"],
				},
			},
		},
	},
	server: {
		port: 8080,
	},
});
