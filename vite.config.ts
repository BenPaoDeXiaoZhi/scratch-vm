import { defineConfig } from "vite";

// Shared resolver and env shim for both the site and library builds.
const commonConfig = {
  resolve: {
    extensions: [".ts", ".js"],
  },
  define: {
    process: {
      env: {
        STUDY_WEB_HOST: "",
      },
    },
  },
};

export default defineConfig(({ mode }) => {
  // Library build: `npm run build:lib` runs `vite build --mode lib`.
  // Bundles src/index.ts as a distributable ES + CJS library.
  if (mode === "lib") {
    return {
      ...commonConfig,
      build: {
        lib: {
          entry: "src/index.ts",
          name: "ScratchVM",
          formats: ["es", "cjs"],
          fileName: (format) => {
            if (format === "es") return "index.js";
            if (format === "cjs") return "index.cjs";
            return `index.${format}.js`;
          },
        },
        outDir: "lib",
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
          // Keep runtime dependencies external so consumers install them
          // themselves (Vite does this for `dependencies` by default, but
          // we also externalize common node globals/builtins that may leak in).
          external: ["buffer"],
        },
      },
      base: "./"
    };
  }

  // Site build (default): `vite build`. Serves the playground as the homepage.
  return {
    root: "src/playground",
    ...commonConfig,
    build: {
      outDir: "../../dist",
      // outDir lives outside `root` (src/playground), so Vite won't empty it
      // unless we opt in explicitly.
      emptyOutDir: true,
    },
    base: "./"
  };
});
