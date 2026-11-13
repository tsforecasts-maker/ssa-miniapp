import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// GitHub Pages serves the project at /ssa-miniapp/
export default defineConfig({ base: "/ssa-miniapp/", plugins: [preact()], build: { target: "es2020", sourcemap: false } });
