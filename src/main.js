import './assets/main.css'

import { createApp, reactive } from 'vue'
import App from './App.vue'

const eventBus = reactive({
    emit(event, ...args) {
        this[event] && this[event](...args)
    },
    on(event, callback) {
        this[event] = callback
    }
})

createApp(App).provide('eventBus', eventBus).mount('#app')
