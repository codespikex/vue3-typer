import {defineConfig}   from "vite"
import vue              from "@vitejs/plugin-vue"
import dts              from "vite-plugin-dts"
import banner           from "vite-plugin-banner"
import {viteStaticCopy} from "vite-plugin-static-copy"
import {resolve as r}   from "path"

import pkg from "./package.json"

const bannerContent = `
/**
 * name: ${pkg.name}
 * version: v${pkg.version}
 * description: ${pkg.description}
 * author: ${pkg.author}
 * homepage: ${pkg.homepage}
 */
`

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            "~": r(__dirname, "src"),
            "play": r(__dirname, "play")
        }
    },
    plugins: [
        vue(),
        dts({
            cleanVueFileName: true,
            staticImport: true
        }),
        banner(bannerContent),
        viteStaticCopy({
            targets: [
                {
                    src: r(__dirname, "src/vue-typer.css"),
                    dest: r(__dirname, "dist")
                }
            ]
        })
    ],
    build: {
        rollupOptions: {
            treeshake: false,
            external: ["vue"],
            output: {
                globals: {
                    vue: "Vue"
                },
                exports: "named"
            }
        },
        lib: {
            entry: r(__dirname, 'src/index.ts'),
            name: "Vue3Typer",
            fileName: (format) => `vue3-typer.${format}.js`
        },
        emptyOutDir: true
    }
})
