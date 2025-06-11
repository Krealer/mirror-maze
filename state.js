let triggeredFlashbacks = [];
let manipulationLog = [];
let triggeredManipulations = [];
let triggeredNullDialogs = [];
let lastNullRoom = -3;

// Track which gated choices the player selected
let conditionalChoicesTaken = [];

let playerPath = [];
let playerJourney = [];
let emotions = { fear: 0, hope: 0, anger: 0, curiosity: 0 };
let currentEmotionClass = '';
let currentRoom = 'start';
let lastFocusedElement = null;
let skills = {
  patternSense: false,
  patternSenseUses: 0,
  anchor: 0,
  anchorUnlocked: false,
  anchorUses: 0
};
let mazeCorruption = 0;
let debugPanel = null;

function handleSelfMapKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeSelfMap();
  }
}

function handleSkillsKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeSkills();
  }
}

function handleFlashbackKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    const btn = document.getElementById('flashback-ok');
    if (btn) btn.click();
  }
}

function handleManipInfoKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    const btn = document.getElementById('manipulation-ok');
    if (btn) btn.click();
  }
}

function applyEffects(effects) {
  if (!effects) return;
  for (const key in effects) {
    if (emotions.hasOwnProperty(key)) {
      emotions[key] += effects[key];
    }
  }
}

function dominantEmotion() {
  let top = null;
  for (const key in emotions) {
    if (top === null || emotions[key] > emotions[top]) {
      top = key;
    }
  }
  return top;
}

function getDominantEmotion(emoObj) {
  let top = null;
  for (const key in emoObj) {
    if (top === null || emoObj[key] > emoObj[top]) {
      top = key;
    }
  }
  return top;
}

function increaseCorruption(amount = 1) {
  mazeCorruption += amount;
}

function applyCorruptionToButton(btn) {
  if (mazeCorruption >= 5) {
    btn.disabled = true;
    setTimeout(() => (btn.disabled = false), 800);
  }
  if (mazeCorruption >= 3 && Math.random() < 0.3) {
    btn.style.visibility = 'hidden';
    setTimeout(() => (btn.style.visibility = ''), 600);
  }
}

function updateBodyEmotion() {
  const dom = dominantEmotion();
  const cls = dom ? `emotion-${dom}` : '';
  if (cls !== currentEmotionClass) {
    if (currentEmotionClass) {
      document.body.classList.remove(currentEmotionClass);
    }
    if (cls) {
      document.body.classList.add(cls);
    }
    currentEmotionClass = cls;
  }
  if (debugPanel) {
    const emoStr = Object.entries(emotions)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    debugPanel.textContent = `${emoStr} | corruption: ${mazeCorruption}`;
  }
}

function showNullDialog(text) {
  const box = document.getElementById('null-dialog');
  box.textContent = text;
  box.classList.add('null-dialog-active');
  const hide = () => {
    box.classList.remove('null-dialog-active');
    box.removeEventListener('click', hide);
  };
  box.addEventListener('click', hide);
  setTimeout(hide, 3500);
}

function maybeTriggerNullDialog() {
  const currentIndex = playerPath.length;
  if (currentIndex - lastNullRoom < 2) return;
  if (document.body.classList.contains('flashback-mode')) return;
  const state = { emotions, triggeredFlashbacks };
  const available = nullDialogs.filter(d => !d.condition || d.condition(state));
  if (available.length && Math.random() < 0.3) {
    const pick = available[Math.floor(Math.random() * available.length)];
    const text = typeof pick.text === 'function' ? pick.text(state) : pick.text;
    showNullDialog(text);
    triggeredNullDialogs.push(text);
    lastNullRoom = currentIndex;
  }
}
function showPatternWarning(text, cb) {
  const box = document.getElementById("pattern-warning");
  if (skills.patternSense) {
    skills.patternSenseUses = (skills.patternSenseUses || 0) + 1;
  }
  if (!box) { if (cb) cb(); return; }
  box.textContent = text;
  box.classList.add("show");
  const hide = () => {
    box.classList.remove("show");
    box.removeEventListener("click", hide);
    if (cb) cb();
  };
  box.addEventListener("click", hide);
  setTimeout(hide, 2500);
}

function showSkillUnlock(text) {
  const box = document.getElementById("skill-unlock");
  if (!box) { alert(text); return; }
  box.textContent = text;
  box.classList.add("show");
  const hide = () => {
    box.classList.remove("show");
    box.removeEventListener("click", hide);
  };
  box.addEventListener("click", hide);
  setTimeout(hide, 3000);
}

function maybeGrantAnchor() {
  if (skills.anchorUnlocked) return;
  const resisted = manipulationLog.filter(m => m.outcome === 'resisted').length;
  if (resisted >= 2 && triggeredFlashbacks.includes('promise')) {
    skills.anchor = 1;
    skills.anchorUnlocked = true;
    showSkillUnlock('Skill Unlocked: Emotional Anchor');
  }
}


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

function getFinalEnding(state) {
  for (const end of endings) {
    try {
      if (end.condition(state)) return end;
    } catch (_) {
      continue;
    }
  }
  return endings[endings.length - 1];
}

function saveGameState() {
  localStorage.setItem('playerPath', JSON.stringify(playerPath));
  localStorage.setItem('emotions', JSON.stringify(emotions));
  localStorage.setItem('dominantEmotion', dominantEmotion());
  localStorage.setItem('triggeredFlashbacks', JSON.stringify(triggeredFlashbacks));
  localStorage.setItem('conditionalChoices', JSON.stringify(conditionalChoicesTaken));
  localStorage.setItem('nullDialogs', JSON.stringify(triggeredNullDialogs));
  localStorage.setItem('playerJourney', JSON.stringify(playerJourney));
  localStorage.setItem('manipulationLog', JSON.stringify(manipulationLog));
  localStorage.setItem('skills', JSON.stringify(skills));
  localStorage.setItem('corruption', mazeCorruption);
  localStorage.setItem('currentRoom', currentRoom);
}

function openSelfMap() {
  const overlay = document.getElementById('self-map-overlay');
  const list = document.getElementById('self-map-content');
  list.innerHTML = '';
  let journey = playerJourney.slice();
  if (mazeCorruption >= 7) {
    const forget = Math.min(journey.length - 1, Math.floor(mazeCorruption / 2));
    journey = journey.slice(forget);
  }
  journey.forEach((step, idx) => {
    const div = document.createElement('div');
    div.className = 'self-map-entry';
    const line = document.createElement('div');
    line.textContent = `${idx + 1}. ${step.roomId} \u2192 ${step.choiceText}`;
    const emo = document.createElement('span');
    emo.className = `emotion-tag emotion-color-${step.emotionSnapshot}`;
    emo.textContent = step.emotionSnapshot;
    line.appendChild(emo);
    div.appendChild(line);
    list.appendChild(div);
  });
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.addEventListener('keydown', handleSelfMapKey);
  lastFocusedElement = document.activeElement;
  const closeBtn = document.getElementById('self-map-close');
  if (closeBtn) closeBtn.focus();
}

function closeSelfMap() {
  const overlay = document.getElementById('self-map-overlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.removeEventListener('keydown', handleSelfMapKey);
  if (lastFocusedElement) lastFocusedElement.focus();
}

function openSkills() {
  const overlay = document.getElementById('skills-overlay');
  const list = document.getElementById('skills-content');
  list.innerHTML = '';
  const entries = [];
  entries.push({
    unlocked: skills.patternSense,
    name: 'Pattern Sense',
    uses: skills.patternSenseUses || 0,
    desc: 'Recognize manipulation tactics before they unfold.'
  });
  entries.push({
    unlocked: skills.anchorUnlocked,
    name: 'Emotional Anchor',
    uses: skills.anchorUses || 0,
    desc: 'Ground yourself in self-trust to resist manipulation.'
  });
  entries.forEach(e => {
    const div = document.createElement('div');
    div.className = 'self-map-entry';
    const title = document.createElement('strong');
    title.textContent = e.name + (e.unlocked ? '' : ' (Locked)');
    div.appendChild(title);
    const info = document.createElement('div');
    info.textContent = e.desc + (e.unlocked ? ` - Used ${e.uses} times` : '');
    div.appendChild(info);
    list.appendChild(div);
  });
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  document.addEventListener('keydown', handleSkillsKey);
  lastFocusedElement = document.activeElement;
  const closeBtn = document.getElementById('skills-close');
  if (closeBtn) closeBtn.focus();
}

function closeSkills() {
  const overlay = document.getElementById('skills-overlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  document.removeEventListener('keydown', handleSkillsKey);
  if (lastFocusedElement) lastFocusedElement.focus();
}
