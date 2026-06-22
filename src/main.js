/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";

// Composable
import {createApp} from "vue";

// Plugins
import {registerPlugins} from "@/plugins";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import 'highlight.js/styles/github.css';
import {brand} from "@/brand";


document.title = brand.documentTitle;

const app = createApp(App);
app.use(ElementPlus);
// app.use(router).mount('#app')

registerPlugins(app);

app.mount("#app");
