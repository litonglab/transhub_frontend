/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from "./App.vue";

// Composables
import {createApp} from "vue";

// Plugins
import {registerPlugins} from "@/plugins";
import {createVuetify} from "vuetify";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import {createPinia} from "pinia";
import 'highlight.js/styles/github.css'; // 或者选择其他主题，如 'monokai.css';

const pinia = createPinia();

const vuetify = createVuetify();

const app = createApp(App);
app.use(vuetify);
app.use(ElementPlus);
app.use(pinia);
// app.use(router).mount('#app')

registerPlugins(app);

app.mount("#app");
