// The turkey's world: physics, spawning, collisions, the farmer's chase,
// scoring and the win/lose rules. Pure state plus a fixed step — no drawing,
// no DOM, so the screenshot stager can run it forward headlessly.
import { GROUND_Y, SCORE, SPAWN, STEP, TURKEY, WORLD } from './config.js';
import { makeRandom, range } from './random.js';

export const KIND = {
  HAY: 'hay',
  FENCE: 'fence',
  PUMPKIN: 'pumpkin',
  KNIFE: 'knife',
  OVEN: 'oven',
  MUD: 'mud',
  CORN: 'corn',
  GOLDEN: 'golden',
  FEATHER: 'feather',
  CHILI: 'chili',
};

export const EVENT_OVER = 1;
export const EVENT_ESCAPED = 2;

const OBSTACLE_DEFS = {
  [KIND.HAY]: { w: 58, h: 46 },
  [KIND.FENCE]: { w: 34, h: 66 },
  [KIND.PUMPKIN]: { w: 46, h: 42 },
  [KIND.KNIFE]: { w: 16, h: 78 },
  [KIND.OVEN]: { w: 92, h: 98 },
  [KIND.MUD]: { w: 96, h: 14 },
};

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class TurkeyWorld {
  constructor(seed = 20261127) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.rng = makeRandom(this.seed);
    this.time = 0;
    this.distancePx = 0;
    this.distanceM = 0;
    this.score = 0;
    this.best = 0;
    this.lives = WORLD.startLives;
    this.level = 1;
    this.farmerGap = WORLD.startFarmerGap;
    this.speed = WORLD.baseSpeed;
    this.stumbleTimer = 0;
    this.invulnerableTimer = 0;
    this.chiliTimer = 0;
    this.shield = false;
    this.escaped = false;
    this.over = false;
    this.overReason = null; // 'caught' | 'lives'
    this.cornCollected = 0;
    this.obstaclesSmashed = 0;
    this.bonusScore = 0;
    this.nextSpawnX = 700;
    this.items = [];
    this.leaves = [];
    this.turkey = {
      x: TURKEY.x,
      y: GROUND_Y - TURKEY.height,
      w: TURKEY.width,
      h: TURKEY.height,
      vy: 0,
      jumps: 0,
      ducking: false,
      onGround: true,
      runPhase: 0,
      inMud: false,
    };
    this.farmer = { x: TURKEY.x - this.farmerGap, runPhase: 0, armPhase: 0 };
    for (let i = 0; i < 26; i += 1) {
      this.leaves.push({
        x: this.rng() * 960,
        y: this.rng() * 540,
        size: 4 + this.rng() * 6,
        drift: 12 + this.rng() * 22,
        fall: 14 + this.rng() * 26,
        hue: this.rng(),
      });
    }
  }

  currentSpeed() {
    let speed = this.speed;
    if (this.stumbleTimer > 0) speed *= WORLD.stumbleSlowFactor;
    if (this.turkey.inMud) speed *= 0.6;
    if (this.chiliTimer > 0) speed *= 1.35;
    return speed;
  }

  levelFor(meters) {
    return Math.floor(meters / WORLD.levelEveryMeters) + 1;
  }

  speedForLevel(level) {
    return Math.min(WORLD.maxSpeed, WORLD.baseSpeed + (level - 1) * WORLD.speedPerLevel);
  }

  /** One fixed step. `action` is { jump: bool, duck: bool }. Returns event flags. */
  step(dt, action) {
    if (this.over || this.escaped) return 0;
    this.time += dt;
    const t = this.turkey;
    t.ducking = Boolean(action.duck) && t.onGround;

    if (action.jump) this.tryJump();

    // Vertical physics.
    t.vy += TURKEY.gravity * dt;
    t.y += t.vy * dt;
    const groundY = GROUND_Y - (t.ducking ? TURKEY.duckHeight : TURKEY.height);
    if (t.y >= groundY) {
      t.y = groundY;
      t.vy = 0;
      t.onGround = true;
      t.jumps = 0;
    } else {
      t.onGround = false;
    }
    t.h = t.ducking ? TURKEY.duckHeight : TURKEY.height;
    t.runPhase += dt * (t.onGround ? this.currentSpeed() / 28 : 0);

    // Forward motion.
    const speed = this.currentSpeed();
    const advance = speed * dt;
    this.distancePx += advance;
    this.distanceM = this.distancePx / WORLD.pxPerMeter;
    this.level = this.levelFor(this.distanceM);
    this.speed = this.speedForLevel(this.level);
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.chiliTimer > 0) this.chiliTimer -= dt;

    // The farmer: gains on every stumble and in the mud, loses ground while
    // the turkey runs clean. Too close and the run is over.
    const gapDelta = (this.stumbleTimer > 0 || t.inMud ? 0 : WORLD.cleanGapGainPerSec * dt)
      - (t.inMud ? WORLD.mudGapLossPerSec * dt : 0);
    this.farmerGap = Math.min(WORLD.farmerMaxGap, this.farmerGap + gapDelta);
    this.farmer.x = TURKEY.x - this.farmerGap - 46;
    this.farmer.runPhase += dt * 11;
    this.farmer.armPhase += dt * 5;

    // Move everything left, spawn ahead, cull behind.
    for (const item of this.items) {
      item.x -= advance;
      if (item.kind === KIND.PUMPKIN) item.x -= 55 * dt; // pumpkins roll at you
      if (item.kind === KIND.KNIFE && item.falling) {
        item.y += item.fallSpeed * dt;
        if (item.y >= GROUND_Y - item.h + 6) {
          item.y = GROUND_Y - item.h + 6;
          item.falling = false;
        }
      }
    }
    this.items = this.items.filter((item) => item.x + item.w > -80);
    this.nextSpawnX -= advance;
    this.spawnAhead();

    // Falling leaves drift.
    for (const leaf of this.leaves) {
      leaf.x -= (advance * 0.25 + leaf.drift * dt);
      leaf.y += leaf.fall * dt;
      if (leaf.y > 560) {
        leaf.y = -10;
        leaf.x = 960 + this.rng() * 120;
      }
      if (leaf.x < -20) leaf.x = 960 + this.rng() * 60;
    }

    this.checkPickupsAndHits();
    this.checkFarmerCatch();

    if (!this.over && this.distanceM >= WORLD.escapeMeters) {
      this.escaped = true;
      return EVENT_ESCAPED;
    }
    if (this.over) return EVENT_OVER;
    return 0;
  }

  tryJump() {
    const t = this.turkey;
    if (t.onGround) {
      t.vy = TURKEY.jumpVelocity;
      t.jumps = 1;
      t.onGround = false;
      return 'jump';
    }
    if (t.jumps === 1) {
      t.vy = TURKEY.doubleJumpVelocity;
      t.jumps = 2;
      return 'double';
    }
    return null;
  }

  spawnAhead() {
    // Spawn obstacles just off the right edge, keeping a fair gap between them.
    while (this.nextSpawnX < 960 + 240) {
      const x = this.nextSpawnX;
      const level = this.level;
      const roll = this.rng();
      let kind;
      if (level >= 2 && roll < 0.12) kind = KIND.OVEN;
      else if (roll < 0.3) kind = KIND.HAY;
      else if (roll < 0.5) kind = KIND.FENCE;
      else if (roll < 0.68) kind = KIND.PUMPKIN;
      else if (roll < 0.84) kind = KIND.KNIFE;
      else kind = KIND.MUD;
      this.spawnObstacle(kind, x);
      this.maybeSpawnPickup(x);
      const gap = range(this.rng, SPAWN.minGapPx, SPAWN.maxGapPx) * (1 - Math.min(0.3, (level - 1) * 0.05));
      this.nextSpawnX = x + gap + OBSTACLE_DEFS[kind].w;
    }
  }

  spawnObstacle(kind, x) {
    const def = OBSTACLE_DEFS[kind];
    if (kind === KIND.KNIFE) {
      // Knives fall from the sky onto a spot ahead, with a warning glint.
      this.items.push({
        kind, x: x + range(this.rng, -30, 60), y: -90, w: def.w, h: def.h,
        falling: true, fallSpeed: 620 + this.rng() * 160, active: true,
      });
      return;
    }
    if (kind === KIND.MUD) {
      this.items.push({ kind, x, y: GROUND_Y - 4, w: def.w, h: def.h, active: true });
      return;
    }
    this.items.push({ kind, x, y: GROUND_Y - def.h, w: def.w, h: def.h, active: true });
  }

  maybeSpawnPickup(x) {
    const roll = this.rng();
    const arcY = GROUND_Y - 150;
    if (roll < SPAWN.goldenChance) {
      this.items.push({ kind: KIND.GOLDEN, x: x + 30, y: arcY - 30, w: 30, h: 34, active: true, bob: this.rng() * 6 });
    } else if (roll < SPAWN.goldenChance + SPAWN.featherChance) {
      this.items.push({ kind: KIND.FEATHER, x: x + 30, y: arcY - 10, w: 30, h: 30, active: true, bob: this.rng() * 6 });
    } else if (roll < SPAWN.goldenChance + SPAWN.featherChance + SPAWN.chiliChance) {
      this.items.push({ kind: KIND.CHILI, x: x + 30, y: arcY - 10, w: 28, h: 34, active: true, bob: this.rng() * 6 });
    } else if (roll < SPAWN.cornChance + SPAWN.goldenChance + SPAWN.featherChance + SPAWN.chiliChance) {
      // A little row of corn along the jump arc over the obstacle.
      for (let i = 0; i < 3; i += 1) {
        this.items.push({
          kind: KIND.CORN, x: x - 30 + i * 46, y: arcY - Math.abs(i - 1) * -22 - (i === 1 ? 26 : 0),
          w: 28, h: 32, active: true, bob: this.rng() * 6,
        });
      }
    }
  }

  checkPickupsAndHits() {
    const t = this.turkey;
    const body = { x: t.x + 6, y: t.y + 4, w: t.w - 12, h: t.h - 6 };
    t.inMud = false;
    for (const item of this.items) {
      if (!item.active) continue;
      const box = { x: item.x, y: item.y, w: item.w, h: item.h };
      if (item.kind === KIND.MUD) {
        if (overlaps(body, box)) t.inMud = true;
        continue;
      }
      if (item.kind === KIND.CORN || item.kind === KIND.GOLDEN || item.kind === KIND.FEATHER || item.kind === KIND.CHILI) {
        const pickupBox = { x: item.x - 4, y: item.y - 4, w: item.w + 8, h: item.h + 8 };
        if (overlaps(body, pickupBox)) {
          item.active = false;
          this.collect(item.kind);
        }
        continue;
      }
      // Obstacles.
      if (!overlaps(body, box)) continue;
      if (this.chiliTimer > 0) {
        item.active = false;
        this.obstaclesSmashed += 1;
        this.bonusScore += SCORE.smashBonus;
        this.onSmash?.();
        continue;
      }
      if (this.invulnerableTimer > 0) continue;
      item.active = false;
      if (this.shield) {
        this.shield = false;
        this.invulnerableTimer = WORLD.invulnerableSeconds;
        this.onShieldBreak?.();
        continue;
      }
      this.hitObstacle();
    }
    // Recompute the score from distance plus bonuses.
    this.score = Math.floor(this.distanceM) * SCORE.meterPoint + this.bonusScore;
  }

  collect(kind) {
    if (kind === KIND.CORN) {
      this.bonusScore += SCORE.corn;
      this.cornCollected += 1;
      this.farmerGap = Math.min(WORLD.farmerMaxGap, this.farmerGap + WORLD.cornGapBonus);
      this.onCorn?.();
    } else if (kind === KIND.GOLDEN) {
      this.bonusScore += SCORE.goldenCorn;
      this.cornCollected += 1;
      this.farmerGap = Math.min(WORLD.farmerMaxGap, this.farmerGap + WORLD.goldenGapBonus);
      this.onGolden?.();
    } else if (kind === KIND.FEATHER) {
      this.shield = true;
      this.onFeather?.();
    } else if (kind === KIND.CHILI) {
      this.chiliTimer = WORLD.chiliSeconds;
      this.onChili?.();
    }
  }

  hitObstacle() {
    this.lives -= 1;
    this.stumbleTimer = WORLD.stumbleSlowSeconds;
    this.invulnerableTimer = WORLD.invulnerableSeconds;
    this.farmerGap = Math.max(0, this.farmerGap - WORLD.stumbleGapLoss);
    this.onHit?.();
    if (this.lives <= 0) {
      this.over = true;
      this.overReason = 'lives';
    }
    if (this.farmerGap <= WORLD.farmerCatchGap) {
      this.over = true;
      this.overReason = 'caught';
    }
  }

  /** The farmer closes in — checked every step, not only on hits. */
  checkFarmerCatch() {
    if (!this.over && this.farmerGap <= WORLD.farmerCatchGap) {
      this.over = true;
      this.overReason = 'caught';
    }
  }
}
