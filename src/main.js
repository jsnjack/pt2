import { createApp, provide } from "vue";
import App from "./App.vue";
import eventBus from './eventBus';

const app = createApp(App);

app.provide('eventBus', eventBus);

app.mount('#app');
