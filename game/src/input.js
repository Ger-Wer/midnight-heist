// input.js: keyboard and mouse, kept in one small place.
// Keys are stored lower-cased in a Set the game loop reads each frame.
// Clicks are queued with their canvas coordinates for the coin throw.

export function makeInput(canvas) {
  const keys = new Set();
  const clicks = []; // {x, y} in canvas pixels, consumed by the game loop
  let onFirstGesture = null;

  function gesture() {
    if (onFirstGesture) {
      const f = onFirstGesture;
      onFirstGesture = null;
      f();
    }
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    keys.add(k);
    gesture();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clicks.push({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
    gesture();
  });

  return {
    keys,
    clicks,
    // Called once, on the first key or click: browsers only allow audio
    // after a gesture, so the game starts its sounds here.
    onFirstGesture(fn) {
      onFirstGesture = fn;
    },
  };
}
