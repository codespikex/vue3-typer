/// <reference types="vitest" />

import {defineConfig} from "vite"
import Vue            from "@vitejs/plugin-vue"
import {resolve as r} from "path"

export default defineConfig({
    resolve: {
        alias: {
            "~": r(__dirname, "src")
        }
    },
    plugins: [
        Vue()
    ],
    test: {
        globals: true,
        environment: "jsdom"
    }
})
