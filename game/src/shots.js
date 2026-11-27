// Staged screenshot scenes behind ?shot=title|play|caught|escaped.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot, so the frame is what a
// real game looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER, KIND } from './world.js';
import { SCREENS } from './config.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 17;
const CAUGHT_LIMIT_SECONDS = 90;
const ESCAPED_LIMIT_SECONDS = 600;

/** The obstacles ahead of the turkey, nearest first. */
function threatsAhead(world) {
  const t = world.turkey;
  const list = [];
  for (const item of world.items) {
    if (!item.active) continue;
    if (item.kind === KIND.CORN || item.kind === KIND.GOLDEN || item.kind === KIND.FEATHER || item.kind === KIND.CHILI) continue;
    if (item.x + item.w < t.x) continue;
    list.push(item);
  }
  list.sort((a, b) => a.x - b.x);
  return list;
}

/**
 * The autopilot: jump when the next obstacle is about a third of a second
 * away — near the top of the jump's arc, so the turkey is high while the
 * obstacle passes underneath — and double jump over the tall oven, or to
 * stretch one arc over a tight pair of obstacles.
 * `skill` 1 plays well; 0 never jumps and gets caught, like a hurried player.
 */
function autopilot(world, skill) {
  if (skill === 0) return { jump: false, duck: false };
  const t = world.turkey;
  const list = threatsAhead(world);
  if (list.length === 0) return { jump: false, duck: false };
  const first = list[0];
  const second = list[1] || null;
  const gap = first.x - (t.x + t.w);
  const speed = world.currentSpeed();
  if (t.onGround && gap < speed * 0.3 && gap > -10) {
    return { jump: true, duck: false };
  }
  if (!t.onGround && t.jumps === 1 && t.vy > -250) {
    const secondGap = second ? second.x - (t.x + t.w) : Infinity;
    if ((first.kind === KIND.OVEN && gap < 130) || (second !== null && secondGap < speed * 0.45)) {
      return { jump: true, duck: false };
    }
  }
  return { jump: false, duck: false };
}

function runFor(world, seconds, skill) {
  let event = 0;
  for (let i = 0; i < seconds / STEP; i += 1) {
    event = world.step(STEP, autopilot(world, skill));
    if (event & (EVENT_OVER | EVENT_ESCAPED)) break;
  }
  return event;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names stage the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, 1);
    return { screen: SCREENS.PLAY, best: world.score };
  }
  if (name === 'caught') {
    runFor(world, CAUGHT_LIMIT_SECONDS, 0);
    if (!world.over) {
      // The clumsy pilot survived: wear the farmer down instead.
      world.farmerGap = WORLD.farmerCatchGap;
      world.checkFarmerCatch();
    }
    return { screen: SCREENS.CAUGHT, best: world.score };
  }
  if (name === 'escaped') {
    // A skilled run all the way to the forest. Try a few seeds of the same
    // real rules until one makes it; the main seed does on its own.
    const seeds = [20261127, 42, 99, 555, 2026, 31337, 1234, 7];
    let bestDistance = -1;
    let bestSeed = seeds[0];
    for (const seed of seeds) {
      world.seed = seed;
      world.reset();
      runFor(world, ESCAPED_LIMIT_SECONDS, 1);
      if (world.escaped) {
        return { screen: SCREENS.ESCAPED, best: world.score };
      }
      if (world.distanceM > bestDistance) {
        bestDistance = world.distanceM;
        bestSeed = seed;
      }
    }
    // No seed made it: show the longest run's real end rather than faking
    // an escape the game never played.
    world.seed = bestSeed;
    world.reset();
    runFor(world, ESCAPED_LIMIT_SECONDS, 1);
    return { screen: world.over ? SCREENS.CAUGHT : SCREENS.PLAY, best: world.score };
  }
  runFor(world, TITLE_SECONDS, 1);
  return { screen: SCREENS.TITLE, best: 0 };
}
