// Midnight Heist — input: WASD/arrows to move, mouse click to throw a
// coin, Q for smoke, E for EMP, hold F to crack the safe. All keys are
// read fresh every frame from a held-set, so holding a key keeps moving.

export function createInput() {
  const keys = new Set();
  const queue = [];
  let mouse = { x: 0, y: 0, clicked: false };
  let started = false;

  function onKeyDown(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (k === 'q') queue.push('smoke');
    if (k === 'e') queue.push('emp');
    keys.add(k);
  }

  function onKeyUp(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.delete(k);
  }

  function onMouseDown(e) {
    mouse.clicked = true;
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
  }

  function onMouseMove(e) {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
  }

  return {
    attach(canvas) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
    },
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
    // Normalised move vector from the held keys.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const n = Math.hypot(x, y);
        x /= n;
        y /= n;
      }
      return { x, y };
    },
    holdingF() {
      return keys.has('f');
    },
    // One-shot actions queued since the last frame.
    drainActions() {
      const out = queue.splice(0, queue.length);
      if (mouse.clicked) {
        mouse.clicked = false;
        out.push({ type: 'coin', x: mouse.x, y: mouse.y });
      }
      return out;
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    markStarted() {
      started = true;
    },
    isStarted() {
      return started;
    },
  };
}
