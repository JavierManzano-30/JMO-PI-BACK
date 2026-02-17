// Loader de arranque: configura una parte de la app al iniciar.
import expressLoader from './express.js';

function init(app) {
  expressLoader(app);
}

export default {
  init,
};
