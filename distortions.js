// Memory distortion events
let triggeredDistortions = [];

function handleDistortionKey(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    const btn = document.getElementById('distortion-ok');
    if (btn) btn.click();
  }
}

function showDistortion(text, alterPrompt) {
  const box = document.getElementById('distortion-box');
  const txt = document.getElementById('distortion-text');
  const btn = document.getElementById('distortion-ok');
  if (!box || !txt || !btn) { return; }
  txt.textContent = text;
  box.classList.add('show');
  document.body.classList.add('distortion-mode');
  document.addEventListener('keydown', handleDistortionKey);
  lastFocusedElement = document.activeElement;
  btn.focus();
  const handler = () => {
    box.classList.remove('show');
    document.body.classList.remove('distortion-mode');
    btn.removeEventListener('click', handler);
    document.removeEventListener('keydown', handleDistortionKey);
    if (alterPrompt) {
      const roomPara = document.querySelector('#maze .room p');
      if (roomPara) roomPara.textContent = alterPrompt;
    }
    if (lastFocusedElement) lastFocusedElement.focus();
  };
  btn.addEventListener('click', handler);
}

function checkForDistortions() {
  const state = { playerPath, emotions, triggeredFlashbacks };
  for (const d of DISTORTIONS) {
    if (!triggeredDistortions.includes(d.id) && d.condition(state)) {
      triggeredDistortions.push(d.id);
      showDistortion(d.text, d.alterPrompt);
      increaseCorruption(1);
      break;
    }
  }
}
