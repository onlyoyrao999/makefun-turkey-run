// Turkey Run: Thanksgiving Escape — bootstrap and game loop.
// Owns the screens (title / play / paused / caught / escaped), the clock,
// the best score and the sound hooks; the world owns the rules, the
// renderer owns the drawing.
import { EVENT_ESCAPED, EVENT_OVER, TurkeyWorld } from './world.js';
import { GameRenderer } from './render.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { SCREENS, STEP, VIEW } from './config.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const BEST_KEY = 'turkey-run-best-score';

const renderer = new GameRenderer(canvas);
const sounds = new SoundBank();
const world = new TurkeyWorld(20261127);

const state = {
  screen: SCREENS.TITLE,
  world,
  time: 0,
  distancePx: 0,
  best: Number(window.localStorage?.getItem(BEST_KEY) || 0),
  muted: false,
};

function saveBest() {
  if (world.score > state.best) {
    state.best = world.score;
    try {
      window.localStorage?.setItem(BEST_KEY, String(state.best));
    } catch {
      // Private mode or no storage: the score still shows this session.
    }
  }
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function startRun() {
  sounds.ensure();
  sounds.gobble();
  sounds.startMusic();
  world.reset();
  state.screen = SCREENS.PLAY;
  announce('The turkey is running! Jump with Space, duck with the down arrow.');
}

function togglePause() {
  if (state.screen === SCREENS.PLAY) {
    state.screen = SCREENS.PAUSED;
    sounds.stopMusic();
    announce('Paused.');
  } else if (state.screen === SCREENS.PAUSED) {
    state.screen = SCREENS.PLAY;
    sounds.startMusic();
    announce('Running again.');
  }
}

function endRun() {
  saveBest();
  state.screen = world.escaped ? SCREENS.ESCAPED : SCREENS.CAUGHT;
  sounds.stopMusic();
  if (world.escaped) {
    sounds.fanfare();
    announce(`Escaped! Score ${world.score}. Press R to run again.`);
  } else {
    sounds.caught();
    announce(`Caught! Score ${world.score}. Press R to run again.`);
  }
}

let jumpQueued = false;
let duckHeld = false;

const input = new Input(canvas, {
  jump() {
    if (state.screen === SCREENS.TITLE) {
      startRun();
      return;
    }
    if (state.screen === SCREENS.CAUGHT || state.screen === SCREENS.ESCAPED) {
      startRun();
      return;
    }
    if (state.screen === SCREENS.PAUSED) {
      togglePause();
      return;
    }
    jumpQueued = true;
  },
  duck(held) {
    duckHeld = held;
  },
  togglePause() {
    togglePause();
  },
  toggleMute() {
    state.muted = sounds.toggleMute();
    announce(state.muted ? 'Sound off.' : 'Sound on.');
  },
  restart() {
    if (state.screen !== SCREENS.TITLE) startRun();
  },
  start() {
    if (state.screen === SCREENS.TITLE) startRun();
    else if (state.screen === SCREENS.CAUGHT || state.screen === SCREENS.ESCAPED) startRun();
  },
  pointer(x, y) {
    sounds.ensure();
    if (state.screen === SCREENS.TITLE || state.screen === SCREENS.CAUGHT || state.screen === SCREENS.ESCAPED) {
      startRun();
      return;
    }
    if (state.screen === SCREENS.PAUSED) {
      togglePause();
      return;
    }
    jumpQueued = true;
  },
});

// Sound hooks: the world calls these when things happen.
world.onCorn = () => sounds.corn();
world.onGolden = () => sounds.golden();
world.onFeather = () => sounds.feather();
world.onChili = () => sounds.chili();
world.onHit = () => sounds.thud();
world.onSmash = () => sounds.smash();
world.onShieldBreak = () => sounds.thud();

// Screenshot mode: ?shot=title|play|caught|escaped stages one real frame
// of the game and draws it at once, so a headless browser can capture it.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot, world);
  state.screen = staged.screen;
  state.best = staged.best;
  state.distancePx = world.distancePx;
  state.time = world.time;
  renderer.resizeToWindow();
  renderer.render(state);
} else {
  // The live game: fixed-step simulation, rendered every animation frame.
  renderer.resizeToWindow();
  window.addEventListener('resize', () => renderer.resizeToWindow());
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (state.screen === SCREENS.PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const jump = jumpQueued;
        jumpQueued = false;
        const event = world.step(STEP, { jump, duck: duckHeld });
        state.time = world.time;
        state.distancePx = world.distancePx;
        if (event & (EVENT_OVER | EVENT_ESCAPED)) {
          endRun();
          break;
        }
      }
    } else if (state.screen === SCREENS.TITLE) {
      // Attract mode: the farm scrolls gently behind the title.
      state.time += dt;
      world.time += dt;
      world.distancePx += 40 * dt;
      state.distancePx = world.distancePx;
    }
    renderer.render(state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
