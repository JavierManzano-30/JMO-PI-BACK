import config from '../config.js';
import { startWeeklyContestScheduler } from '../services/weeklyContests.js';

export default function weeklyContestsLoader() {
  if (config.app.env === 'test' || !config.contests.weeklyAutomationEnabled) {
    return;
  }

  startWeeklyContestScheduler();
}
