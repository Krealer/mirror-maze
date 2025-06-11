function showFlashback(text) {
  const box = document.getElementById('flashback-box');
  const txt = document.getElementById('flashback-text');
  const btn = document.getElementById('flashback-ok');
  txt.textContent = text;
  box.classList.add('show');
  document.body.classList.add('flashback-mode');
  document.addEventListener('keydown', handleFlashbackKey);
  lastFocusedElement = document.activeElement;
  btn.focus();
  const handler = () => {
    box.classList.remove('show');
    document.body.classList.remove('flashback-mode');
    btn.removeEventListener('click', handler);
    document.removeEventListener('keydown', handleFlashbackKey);
    if (lastFocusedElement) lastFocusedElement.focus();
  };
  btn.addEventListener('click', handler);
}

function checkForFlashbacks() {
  for (const fb of FLASHBACKS) {
    if (!triggeredFlashbacks.includes(fb.id) && fb.condition(playerPath, emotions)) {
      triggeredFlashbacks.push(fb.id);
      showFlashback(fb.text);
      maybeGrantAnchor();
      break;
    }
  }
}
