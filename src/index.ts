import type {App} from "vue"

import Typer from "~/components/Typer.vue"

Typer.install = function (app: App) {
    app.component(Typer.name, Typer)
}
export default Typer
export {
    Typer
}
