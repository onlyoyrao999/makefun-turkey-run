// Keyboard, mouse and touch input. The game reads a small set of named actions
// so the world never touches DOM events directly.
export class Input {
  constructor(canvas, hooks) {
    this.hooks = hooks; // { jump, duck, togglePause, toggleMute, restart, start }
    this.duckHeld = false;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  onKeyDown(event) {
    if (event.repeat) return;
    const code = event.code;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
      event.preventDefault();
      this.hooks.jump();
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      event.preventDefault();
      this.duckHeld = true;
      this.hooks.duck(true);
    } else if (code === 'KeyP' || code === 'Escape') {
      this.hooks.togglePause();
    } else if (code === 'KeyM') {
      this.hooks.toggleMute();
    } else if (code === 'KeyR') {
      this.hooks.restart();
    } else if (code === 'Enter') {
      this.hooks.start();
    }
  }

  onKeyUp(event) {
    const code = event.code;
    if (code === 'ArrowDown' || code === 'KeyS') {
      this.duckHeld = false;
      this.hooks.duck(false);
    }
  }

  onPointerDown(event) {
    event.preventDefault();
    this.hooks.pointer(event.clientX, event.clientY);
  }
}
