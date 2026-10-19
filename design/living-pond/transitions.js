// The isolated review and application deliberately use the exact same controller.
import '../../web/lake-transitions.js';
export const play = options => window.OrbiterLake.play(options);
export const start = () => window.OrbiterLake.start();
export const stats = () => window.OrbiterLake.stats();
