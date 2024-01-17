import { readonly } from 'vue';
import mitt from 'mitt';

const emitter = mitt();

export default readonly(emitter);
