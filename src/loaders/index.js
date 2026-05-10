// Loader de arranque: configura una parte de la app al iniciar.
import expressLoader from './express.js';
import weeklyContestsLoader from './weeklyContests.js';

function init(app) {
  expressLoader(app);
  weeklyContestsLoader();
}

export default {
  init,
};
