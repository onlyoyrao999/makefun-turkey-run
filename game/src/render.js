// Everything the player sees, drawn with canvas paths: the farm, the turkey,
// the farmer, the obstacles, the HUD and the title / end screens. No images,
// no fonts to fetch — the game draws itself.
import { COLORS, GROUND_Y, SCREENS, VIEW, WORLD } from './config.js';
import { KIND } from './world.js';

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clouds = [
      { x: 80, y: 60, s: 1.1, v: 6 },
      { x: 420, y: 38, s: 0.8, v: 9 },
      { x: 720, y: 84, s: 1.3, v: 5 },
      { x: 900, y: 46, s: 0.7, v: 11 },
    ];
    this.hills = [0, 260, 520, 780];
  }

  resizeToWindow() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    this.canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
    this.canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  }

  render(state) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    this.drawSky(ctx, state);
    this.drawHillsAndBarn(ctx, state);
    this.drawGround(ctx, state);
    this.drawLeaves(ctx, state);
    this.drawItems(ctx, state);
    this.drawFarmer(ctx, state);
    this.drawTurkey(ctx, state);
    if (state.screen === SCREENS.PLAY || state.screen === SCREENS.PAUSED) this.drawHud(ctx, state);
    if (state.screen === SCREENS.TITLE) this.drawTitle(ctx, state);
    if (state.screen === SCREENS.PAUSED) this.drawPaused(ctx);
    if (state.screen === SCREENS.CAUGHT) this.drawCaught(ctx, state);
    if (state.screen === SCREENS.ESCAPED) this.drawEscaped(ctx, state);
  }

  drawSky(ctx, state) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, COLORS.skyTop);
    g.addColorStop(0.55, COLORS.skyMid);
    g.addColorStop(1, COLORS.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.width, GROUND_Y + 2);
    // Low autumn sun.
    ctx.fillStyle = COLORS.sun;
    ellipse(ctx, 830, 92, 42, 42);
    ctx.fillStyle = 'rgba(255, 217, 77, 0.35)';
    ellipse(ctx, 830, 92, 58, 58);
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    for (const cloud of this.clouds) {
      const x = ((cloud.x - state.distancePx * 0.02 * cloud.v * 0.2) % 1100 + 1100) % 1100 - 70;
      ellipse(ctx, x, cloud.y, 42 * cloud.s, 16 * cloud.s);
      ellipse(ctx, x + 26 * cloud.s, cloud.y + 5, 30 * cloud.s, 13 * cloud.s);
      ellipse(ctx, x - 28 * cloud.s, cloud.y + 6, 26 * cloud.s, 12 * cloud.s);
    }
  }

  drawHillsAndBarn(ctx, state) {
    // Far hills.
    ctx.fillStyle = COLORS.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW.width; x += 40) {
      const y = GROUND_Y - 46 - Math.sin((x + state.distancePx * 0.08) * 0.008) * 26;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW.width, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // Near hill.
    ctx.fillStyle = COLORS.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW.width; x += 40) {
      const y = GROUND_Y - 18 - Math.sin((x + state.distancePx * 0.15) * 0.011 + 2) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW.width, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // The barn, sliding past slowly in the distance.
    const barnX = 700 - ((state.distancePx * 0.25) % 1400);
    ctx.fillStyle = COLORS.barnRed;
    ctx.fillRect(barnX, GROUND_Y - 118, 150, 118);
    ctx.fillStyle = COLORS.barnRoof;
    ctx.beginPath();
    ctx.moveTo(barnX - 10, GROUND_Y - 118);
    ctx.lineTo(barnX + 75, GROUND_Y - 168);
    ctx.lineTo(barnX + 160, GROUND_Y - 118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(barnX + 55, GROUND_Y - 72, 40, 72);
    ctx.strokeStyle = '#8a6a42';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(barnX + 55, GROUND_Y - 72);
    ctx.lineTo(barnX + 95, GROUND_Y);
    ctx.moveTo(barnX + 95, GROUND_Y - 72);
    ctx.lineTo(barnX + 55, GROUND_Y);
    ctx.stroke();
    // Fence posts marching past.
    ctx.fillStyle = COLORS.fence;
    const spacing = 90;
    const offset = state.distancePx % spacing;
    for (let x = -offset; x < VIEW.width; x += spacing) {
      ctx.fillRect(x, GROUND_Y - 34, 8, 34);
    }
    ctx.fillRect(0, GROUND_Y - 30, VIEW.width, 5);
    ctx.fillRect(0, GROUND_Y - 16, VIEW.width, 5);
  }

  drawGround(ctx, state) {
    ctx.fillStyle = COLORS.dirt;
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = COLORS.dirtDark;
    for (let i = 0; i < 24; i += 1) {
      const x = ((i * 137 - state.distancePx * 1.0) % 1100 + 1100) % 1100 - 70;
      ellipse(ctx, x, GROUND_Y + 14 + ((i * 53) % 62), 10 + ((i * 7) % 14), 3);
    }
    // Grass fringe on top of the dirt.
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, GROUND_Y - 4, VIEW.width, 8);
    ctx.fillStyle = '#6fa04a';
    for (let x = 0; x < VIEW.width; x += 26) {
      const sway = Math.sin((x + state.distancePx) * 0.05) * 2;
      ctx.beginPath();
      ctx.moveTo(x + sway, GROUND_Y - 4);
      ctx.lineTo(x + 4 + sway, GROUND_Y - 14);
      ctx.lineTo(x + 8 + sway, GROUND_Y - 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawLeaves(ctx, state) {
    for (const leaf of state.world.leaves) {
      ctx.fillStyle = leaf.hue < 0.33 ? '#d97b2b' : leaf.hue < 0.66 ? '#c94f2e' : '#e0a32e';
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.x * 0.02);
      ellipse(ctx, 0, 0, leaf.size, leaf.size * 0.55);
      ctx.restore();
    }
  }

  drawItems(ctx, state) {
    for (const item of state.world.items) {
      if (!item.active) continue;
      switch (item.kind) {
        case KIND.HAY: this.drawHay(ctx, item); break;
        case KIND.FENCE: this.drawFenceObstacle(ctx, item); break;
        case KIND.PUMPKIN: this.drawPumpkin(ctx, item); break;
        case KIND.KNIFE: this.drawKnife(ctx, item); break;
        case KIND.OVEN: this.drawOven(ctx, item); break;
        case KIND.MUD: this.drawMud(ctx, item); break;
        case KIND.CORN: this.drawCorn(ctx, item, false); break;
        case KIND.GOLDEN: this.drawCorn(ctx, item, true); break;
        case KIND.FEATHER: this.drawFeather(ctx, item); break;
        case KIND.CHILI: this.drawChili(ctx, item); break;
        default: break;
      }
    }
  }

  drawHay(ctx, item) {
    ctx.fillStyle = COLORS.hay;
    ellipse(ctx, item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2);
    ctx.strokeStyle = '#b98f2e';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2 - 6, item.h / 2 - 6 - Math.abs(i) * 4, 0, Math.PI * (0.15 + i * 0.15), Math.PI * (0.85 + i * 0.15));
      ctx.stroke();
    }
  }

  drawFenceObstacle(ctx, item) {
    ctx.fillStyle = COLORS.fence;
    ctx.fillRect(item.x, item.y, 8, item.h);
    ctx.fillRect(item.x + item.w - 8, item.y, 8, item.h);
    ctx.fillRect(item.x - 4, item.y + 12, item.w + 8, 8);
    ctx.fillRect(item.x - 4, item.y + 36, item.w + 8, 8);
    ctx.fillStyle = '#a87f4e';
    ctx.beginPath();
    ctx.moveTo(item.x - 6, item.y + 12);
    ctx.lineTo(item.x + item.w + 6, item.y + 12);
    ctx.lineTo(item.x + item.w + 6, item.y + 20);
    ctx.lineTo(item.x - 6, item.y + 20);
    ctx.closePath();
    ctx.fill();
  }

  drawPumpkin(ctx, item) {
    ctx.fillStyle = COLORS.pumpkin;
    ellipse(ctx, item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2 - 2);
    ctx.strokeStyle = '#b85a12';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2 - 8 - Math.abs(i) * 5, item.h / 2 - 4, 0, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.fillStyle = '#5d8a3c';
    ctx.fillRect(item.x + item.w / 2 - 3, item.y - 6, 6, 10);
    // Grumpy carved face.
    ctx.fillStyle = '#2b1d12';
    ellipse(ctx, item.x + 15, item.y + 16, 4, 5);
    ellipse(ctx, item.x + 31, item.y + 16, 4, 5);
    ctx.beginPath();
    ctx.moveTo(item.x + 12, item.y + 32);
    ctx.lineTo(item.x + 20, item.y + 27);
    ctx.lineTo(item.x + 28, item.y + 32);
    ctx.lineTo(item.x + 34, item.y + 28);
    ctx.stroke();
  }

  drawKnife(ctx, item) {
    if (item.falling) {
      // Warning glint on the ground where it will land.
      ctx.fillStyle = 'rgba(255, 60, 40, 0.5)';
      ellipse(ctx, item.x + item.w / 2, GROUND_Y + 4, 26, 5);
    }
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
    ctx.rotate(0.12);
    ctx.fillStyle = COLORS.knife;
    ctx.beginPath();
    ctx.moveTo(-6, -item.h / 2);
    ctx.lineTo(6, -item.h / 2 + 12);
    ctx.lineTo(6, 6);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.knifeHandle;
    roundRect(ctx, -6, 6, 12, 22, 4);
    ctx.restore();
  }

  drawOven(ctx, item) {
    ctx.fillStyle = COLORS.oven;
    roundRect(ctx, item.x, item.y, item.w, item.h, 8);
    ctx.fillStyle = '#33333a';
    roundRect(ctx, item.x + 10, item.y + 12, item.w - 20, 44, 6);
    // Roaring fire inside the oven door.
    ctx.fillStyle = COLORS.ovenGlow;
    ctx.beginPath();
    ctx.moveTo(item.x + 20, item.y + 50);
    ctx.quadraticCurveTo(item.x + 30, item.y + 18, item.x + 46, item.y + 34);
    ctx.quadraticCurveTo(item.x + 58, item.y + 20, item.x + 72, item.y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ellipse(ctx, item.x + item.w / 2, item.y + 42, 10, 7);
    ctx.fillStyle = '#c8ccd4';
    ctx.fillRect(item.x + 14, item.y + 66, item.w - 28, 6);
    for (let i = 0; i < 3; i += 1) {
      ellipse(ctx, item.x + 26 + i * 20, item.y + 82, 7, 7);
    }
  }

  drawMud(ctx, item) {
    ctx.fillStyle = COLORS.mud;
    ellipse(ctx, item.x + item.w / 2, item.y + item.h / 2 + 2, item.w / 2, 8);
    ctx.fillStyle = '#7d5a38';
    ellipse(ctx, item.x + item.w / 2 - 18, item.y + item.h / 2, 12, 4);
    ellipse(ctx, item.x + item.w / 2 + 22, item.y + item.h / 2 + 1, 9, 3);
  }

  drawCorn(ctx, item, golden) {
    const bob = Math.sin((item.bob || 0) + item.x * 0.05) * 3;
    const y = item.y + bob;
    ctx.fillStyle = golden ? '#ffe066' : COLORS.corn;
    ctx.save();
    ctx.translate(item.x + item.w / 2, y + item.h / 2);
    ctx.rotate(-0.5);
    ellipse(ctx, 0, 0, 10, 15);
    ctx.restore();
    ctx.strokeStyle = golden ? '#d9a400' : '#c79a12';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(item.x + item.w / 2 + i * 5, y + 4);
      ctx.lineTo(item.x + item.w / 2 + i * 5, y + item.h - 6);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.cornHusk;
    ctx.beginPath();
    ctx.moveTo(item.x + 4, y + item.h - 8);
    ctx.lineTo(item.x + 14, y + item.h + 8);
    ctx.lineTo(item.x + 24, y + item.h - 8);
    ctx.closePath();
    ctx.fill();
    if (golden) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ellipse(ctx, item.x + 9, y + 9, 3, 3);
    }
  }

  drawFeather(ctx, item) {
    const bob = Math.sin((item.bob || 0) + item.x * 0.05) * 3;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2 + bob);
    ctx.rotate(0.6);
    ctx.fillStyle = '#f5e6c8';
    ellipse(ctx, 0, 0, 7, 14);
    ctx.fillStyle = '#d97b4f';
    ellipse(ctx, 0, -4, 4, 8);
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ellipse(ctx, item.x + item.w / 2, item.y + item.h / 2 + bob, 18, 18);
  }

  drawChili(ctx, item) {
    const bob = Math.sin((item.bob || 0) + item.x * 0.05) * 3;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2 + bob);
    ctx.rotate(0.5);
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(12, -2, 2, 14);
    ctx.quadraticCurveTo(-8, 4, -6, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5d8a3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(4, -22, 10, -20);
    ctx.stroke();
    ctx.restore();
  }

  drawTurkey(ctx, state) {
    const w = state.world;
    const t = w.turkey;
    const blink = w.invulnerableTimer > 0 && Math.floor(state.time * 12) % 2 === 0;
    if (blink) return; // invulnerability blink
    const x = t.x;
    const y = t.y;
    const running = t.onGround && !t.ducking;
    const legSwing = running ? Math.sin(t.runPhase * 2.4) * 9 : 0;
    const bob = running ? Math.abs(Math.sin(t.runPhase * 2.4)) * 2 : 0;
    ctx.save();
    ctx.translate(0, -bob);
    if (w.chiliTimer > 0) {
      ctx.fillStyle = 'rgba(255, 80, 30, 0.25)';
      ellipse(ctx, x + t.w / 2, y + t.h / 2, 40, 36);
    }
    if (w.shield) {
      ctx.strokeStyle = 'rgba(120, 200, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x + t.w / 2, y + t.h / 2, 38, 34, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Tail feathers, fanned behind.
    ctx.fillStyle = COLORS.featherDark;
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(x + 8, y + 30);
      ctx.rotate(-0.9 + i * 0.42);
      ellipse(ctx, -16, 0, 20, 7);
      ctx.restore();
    }
    ctx.fillStyle = COLORS.featherLight;
    for (let i = -1; i <= 1; i += 1) {
      ctx.save();
      ctx.translate(x + 8, y + 30);
      ctx.rotate(-0.9 + i * 0.55);
      ellipse(ctx, -13, 0, 15, 5);
      ctx.restore();
    }
    // Legs: running on the ground, tucked up while airborne.
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 4;
    if (t.onGround) {
      ctx.beginPath();
      ctx.moveTo(x + 26, y + t.h - 8);
      ctx.lineTo(x + 26 + legSwing, GROUND_Y);
      ctx.moveTo(x + 38, y + t.h - 8);
      ctx.lineTo(x + 38 - legSwing, GROUND_Y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 26, y + t.h - 8);
      ctx.lineTo(x + 30, y + t.h + 4);
      ctx.moveTo(x + 38, y + t.h - 8);
      ctx.lineTo(x + 42, y + t.h + 4);
      ctx.stroke();
    }
    // Body.
    ctx.fillStyle = COLORS.turkeyBody;
    ellipse(ctx, x + 32, y + t.h - 22, 26, t.ducking ? 16 : 22);
    ctx.fillStyle = COLORS.turkeyBelly;
    ellipse(ctx, x + 38, y + t.h - 18, 16, 13);
    // Wing.
    ctx.fillStyle = COLORS.featherDark;
    ctx.save();
    ctx.translate(x + 30, y + t.h - 26);
    ctx.rotate(running ? Math.sin(t.runPhase * 2.4) * 0.5 - 0.2 : -0.2);
    ellipse(ctx, 0, 0, 16, 8);
    ctx.restore();
    // Neck and head.
    ctx.fillStyle = COLORS.turkeyBody;
    ctx.fillRect(x + 46, y + 2, 9, 22);
    ctx.fillStyle = COLORS.turkeyHead;
    ellipse(ctx, x + 52, y + 6, 11, 10);
    // Beak, wattle and eye.
    ctx.fillStyle = COLORS.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(x + 60, y + 4);
    ctx.lineTo(x + 72, y + 8);
    ctx.lineTo(x + 60, y + 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.turkeyWattle;
    ellipse(ctx, x + 56, y + 16, 4, 6);
    ctx.fillStyle = '#1c1410';
    ellipse(ctx, x + 55, y + 3, 2.4, 2.4);
    ctx.restore();
  }

  drawFarmer(ctx, state) {
    const w = state.world;
    const f = w.farmer;
    const gap = w.farmerGap;
    if (gap > 300) return; // still out of sight, off the left edge
    const x = f.x;
    const y = GROUND_Y - 84;
    const legSwing = Math.sin(f.runPhase * 2.2) * 10;
    // Pitchfork, raised and waving.
    ctx.save();
    ctx.translate(x + 52, y + 10);
    ctx.rotate(Math.sin(f.armPhase) * 0.25 - 0.3);
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.lineTo(0, -34);
    ctx.stroke();
    ctx.strokeStyle = '#c8ccd4';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 7, -34);
      ctx.lineTo(i * 7, -48);
      ctx.stroke();
    }
    ctx.restore();
    // Legs.
    ctx.strokeStyle = COLORS.farmerOveralls;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 52);
    ctx.lineTo(x + 22 + legSwing, GROUND_Y);
    ctx.moveTo(x + 34, y + 52);
    ctx.lineTo(x + 34 - legSwing, GROUND_Y);
    ctx.stroke();
    // Body: overalls and shirt.
    ctx.fillStyle = COLORS.farmerShirt;
    roundRect(ctx, x + 12, y + 22, 34, 32, 8);
    ctx.fillStyle = COLORS.farmerOveralls;
    ctx.fillRect(x + 16, y + 38, 26, 18);
    ctx.fillStyle = COLORS.farmerSkin;
    ellipse(ctx, x + 29, y + 12, 13, 12);
    // Straw hat.
    ctx.fillStyle = COLORS.farmerHat;
    ellipse(ctx, x + 29, y + 4, 20, 5);
    ellipse(ctx, x + 29, y - 2, 11, 7);
    // Angry eyes and moustache.
    ctx.strokeStyle = '#1c1410';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 8);
    ctx.lineTo(x + 27, y + 11);
    ctx.moveTo(x + 38, y + 8);
    ctx.lineTo(x + 31, y + 11);
    ctx.stroke();
    ctx.fillStyle = '#5e3d1c';
    ellipse(ctx, x + 29, y + 19, 7, 3);
    // Shout when close.
    if (gap < 120) {
      ctx.fillStyle = COLORS.panel;
      roundRect(ctx, x + 44, y - 34, 92, 30, 8);
      ctx.fillStyle = COLORS.textDark;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Come back!', x + 52, y - 14);
    }
  }

  drawHud(ctx, state) {
    const w = state.world;
    ctx.fillStyle = 'rgba(43, 29, 18, 0.55)';
    roundRect(ctx, 12, 10, 936, 44, 10);
    ctx.fillStyle = '#fff8e6';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${w.score}`, 26, 39);
    ctx.fillText(`${Math.floor(w.distanceM)} m`, 220, 39);
    ctx.fillText(`LEVEL ${w.level}`, 400, 39);
    ctx.fillText(`CORN ${w.cornCollected}`, 520, 39);
    // Hearts.
    for (let i = 0; i < WORLD.startLives; i += 1) {
      const hx = 640 + i * 32;
      const hy = 32;
      ctx.fillStyle = i < w.lives ? '#e63946' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 6);
      ctx.bezierCurveTo(hx - 10, hy - 4, hx - 2, hy - 12, hx, hy - 4);
      ctx.bezierCurveTo(hx + 2, hy - 12, hx + 10, hy - 4, hx, hy + 6);
      ctx.fill();
    }
    // Farmer danger bar.
    const danger = 1 - w.farmerGap / WORLD.farmerMaxGap;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, 760, 22, 150, 12, 6);
    ctx.fillStyle = danger > 0.7 ? '#e63946' : danger > 0.4 ? '#f2a541' : '#5d8a3c';
    roundRect(ctx, 760, 22, Math.max(8, 150 * danger), 12, 6);
    ctx.fillStyle = '#fff8e6';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('FARMER', 760, 50);
    if (w.chiliTimer > 0) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('CHILI RUSH!', 26, 74);
    } else if (w.shield) {
      ctx.fillStyle = '#bfe3ff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('FEATHER SHIELD', 26, 74);
    }
    if (danger > 0.7) {
      ctx.fillStyle = '#ff5a3c';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('! THE FARMER IS RIGHT BEHIND YOU !', VIEW.width / 2, 84);
      ctx.textAlign = 'left';
    }
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(43, 29, 18, 0.55)';
    const hint = 'SPACE jump · ↓ duck · P pause · M mute';
    const hintWidth = ctx.measureText(hint).width;
    roundRect(ctx, 934 - hintWidth - 12, 60, hintWidth + 24, 22, 8);
    ctx.fillStyle = 'rgba(255,248,230,0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(hint, 934, 76);
    ctx.textAlign = 'left';
  }

  panel(ctx, x, y, w, h) {
    ctx.fillStyle = COLORS.panel;
    roundRect(ctx, x, y, w, h, 16);
    ctx.strokeStyle = '#8a6a42';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  drawTitle(ctx, state) {
    ctx.fillStyle = 'rgba(43, 29, 18, 0.35)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this.panel(ctx, 130, 62, 700, 416);
    ctx.fillStyle = '#b3402e';
    ctx.font = 'bold 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TURKEY RUN', VIEW.width / 2, 140);
    ctx.fillStyle = COLORS.textDark;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Escape Thanksgiving Dinner!', VIEW.width / 2, 178);
    ctx.font = '17px sans-serif';
    ctx.fillText('The farmer is after you. Jump the fences, dodge the', VIEW.width / 2, 222);
    ctx.fillText('carving knives, leap the oven — and run 1500 m to the forest.', VIEW.width / 2, 246);
    ctx.fillText('Grab corn for points, a feather for a shield, chili for a rush.', VIEW.width / 2, 270);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#5d8a3c';
    ctx.fillText('▶  PRESS SPACE OR CLICK TO START  ◀', VIEW.width / 2, 322);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText('SPACE / ↑ / tap — jump (twice for a double jump)      ↓ — duck', VIEW.width / 2, 356);
    ctx.fillText('P — pause      M — mute      R — restart', VIEW.width / 2, 380);
    if (state.best > 0) {
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#b3402e';
      ctx.fillText(`Best score: ${state.best}`, VIEW.width / 2, 420);
    }
    ctx.fillStyle = '#8a6a42';
    ctx.font = '14px sans-serif';
    ctx.fillText('A turkey escape game · made for the make.fun bounty', VIEW.width / 2, 452);
    ctx.textAlign = 'left';
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(43, 29, 18, 0.45)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this.panel(ctx, 330, 190, 300, 140);
    ctx.fillStyle = COLORS.textDark;
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.width / 2, 250);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press P or click to keep running', VIEW.width / 2, 288);
    ctx.textAlign = 'left';
  }

  drawCaught(ctx, state) {
    const w = state.world;
    ctx.fillStyle = 'rgba(43, 29, 18, 0.45)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this.panel(ctx, 180, 88, 600, 364);
    ctx.fillStyle = '#b3402e';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(w.overReason === 'caught' ? 'CAUGHT!' : 'DINNER TIME!', VIEW.width / 2, 168);
    ctx.fillStyle = COLORS.textDark;
    ctx.font = '20px sans-serif';
    ctx.fillText(
      w.overReason === 'caught'
        ? 'The farmer grabbed you by the drumstick…'
        : 'Three stumbles — and the oven was already hot.',
      VIEW.width / 2, 208,
    );
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Score: ${w.score}    ·    Distance: ${Math.floor(w.distanceM)} m`, VIEW.width / 2, 258);
    ctx.fillText(`Corn: ${w.cornCollected}    ·    Level ${w.level}`, VIEW.width / 2, 292);
    if (w.score >= state.best && w.score > 0) {
      ctx.fillStyle = '#b3402e';
      ctx.fillText('★ NEW BEST SCORE! ★', VIEW.width / 2, 330);
    } else if (state.best > 0) {
      ctx.fillStyle = '#8a6a42';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Best score: ${state.best}`, VIEW.width / 2, 330);
    }
    ctx.fillStyle = '#5d8a3c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('▶  PRESS R OR CLICK TO RUN AGAIN  ◀', VIEW.width / 2, 396);
    ctx.textAlign = 'left';
  }

  drawEscaped(ctx, state) {
    const w = state.world;
    ctx.fillStyle = 'rgba(20, 60, 25, 0.4)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    this.panel(ctx, 180, 88, 600, 364);
    ctx.fillStyle = '#2f7a33';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', VIEW.width / 2, 168);
    ctx.fillStyle = COLORS.textDark;
    ctx.font = '20px sans-serif';
    ctx.fillText('You made it to the forest — no Thanksgiving dinner for you!', VIEW.width / 2, 208);
    ctx.fillText('The farmer is still looking under the hay bales.', VIEW.width / 2, 236);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Score: ${w.score}    ·    Distance: ${Math.floor(w.distanceM)} m`, VIEW.width / 2, 286);
    ctx.fillText(`Corn: ${w.cornCollected}    ·    Obstacles smashed: ${w.obstaclesSmashed}`, VIEW.width / 2, 320);
    ctx.fillStyle = '#2f7a33';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('▶  PRESS R OR CLICK TO RUN AGAIN  ◀', VIEW.width / 2, 396);
    ctx.textAlign = 'left';
  }
}
