const MAZE = {
  start: {
    id: "start",
    prompt: "You wake up in a strange mirror room. Your reflection is missing. What do you do?",
    choices: [
      { text: "Call out", next: "echo", effects: { hope: 1, fear: -1 } },
      { text: "Search silently", next: "shadow", effects: { curiosity: 1, fear: 1 } },
      {
        text: "Remember the promise",
        next: "echo",
        condition: (_p, _e, flash) => flash.includes('promise'),
        effects: { hope: 1 }
      }
    ]
  },
  echo: {
    id: "echo",
    prompt: "Your voice bounces endlessly. You feel watched.",
    manipulation: "gaslighting",
    choices: [
      { text: "Stay still", next: "ending_a", effects: { fear: 1 } },
      { text: "Run", next: "shadow", effects: { fear: 1, hope: -1 } },
      { text: "Reach for the warm glow", next: "idol_room", effects: { hope: 1 } }
    ]
  },
  shadow: {
    id: "shadow",
    prompt: "A figure mimics you from the dark. It's you — but not quite.",
    manipulation: "guilt_pit",
    choices: [
      { text: "Talk to it", next: "ending_b", effects: { curiosity: 1, hope: 1 } },
      { text: "Attack it", next: "ending_c", effects: { anger: 2, fear: -1 } },
      { text: "Let it draw nearer", next: "cornered", effects: { fear: 1 } },
      {
        text: "Back away slowly",
        next: "hidden",
        condition: (_p, emo) => emo.fear >= 2,
        effects: { fear: -1 }
      }
    ]
  },
  hidden: {
    id: "hidden",
    prompt: "You slip into a narrow corridor. The air is thick with mist.",
    manipulation: "false_hope",
    choices: [
      { text: "Press forward", next: "ending_d", effects: { curiosity: 1 } },
      { text: "Retreat", next: "start", effects: { fear: -1 } },
      { text: "Listen to the accusing whispers", next: "guilt_chamber", effects: { fear: 1 } }
    ]
  },
  idol_room: {
    id: "idol_room",
    prompt: "A warm glow surrounds you with praise from unseen voices.",
    manipulation: "love_bombing",
    choices: [
      { text: "Bask in it", next: "ending_b", effects: { hope: 1 } },
      { text: "Step away", next: "hidden", effects: { curiosity: 1 } }
    ]
  },
  cornered: {
    id: "cornered",
    prompt: "Mirrors close in around you, leaving no escape.",
    manipulation: "threat_escalation",
    choices: [
      { text: "Push through", next: "hidden", effects: { anger: 1 } },
      { text: "Collapse", next: "ending_a", effects: { fear: 2 } }
    ]
  },
  ending_a: {
    id: "ending_a",
    prompt: "You fade into silence. End.",
    choices: []
  },
  ending_b: {
    id: "ending_b",
    prompt: "It whispers secrets only you know. End.",
    choices: []
  },
  ending_c: {
    id: "ending_c",
    prompt: "You strike and shatter into pieces. End.",
    choices: []
  },
  ending_d: {
    id: "ending_d",
    prompt: "A final door opens and you vanish beyond the mirrors. End.",
    choices: []
  }
};

const manipulationRooms = {
  guilt_chamber: {
    id: "guilt_chamber",
    type: "manipulation",
    tactic: "Guilt Trip",
    text: "You remember her voice. Cold. Disappointed.\n\n'After everything, you still don\u2019t listen...'",
    manipulatedChoices: [
      { text: "I\u2019m sorry. I\u2019ll change.", next: "ending_a", effect: "submit" },
      { text: "You\u2019re right. I\u2019ve failed.", next: "ending_a", effect: "submit" }
    ],
    resistChoice: {
      text: "[Recognize Guilt Trap] My decisions are my own.",
      next: "hidden",
      effect: "resist"
    },
    explanation: "This was a guilt trip: reframing control as care, and making disobedience feel selfish."
  }
};

// Flashback fragments triggered by emotions or path choices
const FLASHBACKS = [
  {
    id: 'hallway',
    condition: (path, emo) => emo.fear > 3 && path.includes('shadow'),
    text: 'A dark hallway from your childhood closes in around you. Damp stone, distant screams \u2014 you\'d tried to forget.'
  },
  {
    id: 'promise',
    condition: (path, emo) => emo.hope > 2 && path.includes('echo'),
    text: 'You remember a warm hand and the promise you whispered to never let go.'
  }
];

let triggeredFlashbacks = [];

const MANIPULATION_TACTICS = {
  gaslighting: {
    type: "Gaslighting",
    text: "The voice scoffs: 'You imagined that. None of this is real.'",
    manipulatedChoices: [
      { text: "Maybe I did imagine it…", effect: "doubt" },
      { text: "You're right, I'm confused.", effect: "submit" }
    ],
    resistChoice: {
      text: "[Hold to your memory] I know what I heard.",
      effect: "resist_gaslighting"
    },
    explanation: "Gaslighting tries to overwrite your reality so you question yourself."
  },
  love_bombing: {
    type: "Love Bombing",
    text: "Affection floods the hall. 'You're perfect. Stay forever.'",
    manipulatedChoices: [
      { text: "Yes, don't leave me.", effect: "cling" },
      { text: "I finally feel valued.", effect: "give_in" }
    ],
    resistChoice: {
      text: "[See through it] I can stand on my own.",
      effect: "resist_love"
    },
    explanation: "Love bombing smothers you with praise to lower your guard."
  },
  false_hope: {
    type: "False Hope",
    text: "'Just one more door and you're free,' the reflection promises.",
    manipulatedChoices: [
      { text: "Lead the way.", effect: "chase_hope" },
      { text: "Finally, a way out!", effect: "submit" }
    ],
    resistChoice: {
      text: "[Doubt it] I've heard this before.",
      effect: "resist_false_hope"
    },
    explanation: "False hope keeps you compliant with empty promises."
  },
  threat_escalation: {
    type: "Threat Escalation",
    text: "The walls close in. 'Obey, or the mirrors will break you.'",
    manipulatedChoices: [
      { text: "I'll do whatever you want.", effect: "submit" },
      { text: "Please, don't hurt me.", effect: "fear" }
    ],
    resistChoice: {
      text: "[Stand firm] Do your worst.",
      effect: "resist_threat"
    },
    explanation: "Threat escalation intimidates you into obedience."
  }
};

const manipulationEncounters = [
  {
    id: "guilt_pit",
    type: "Guilt Trip",
    text: "They only ever wanted what’s best for you. Why are you always so difficult?",
    manipulatedChoices: [
      { text: "You’re right. I’ve failed.", effect: "accept_guilt" },
      { text: "Maybe I should just give in.", effect: "surrender" }
    ],
    resistChoice: {
      text: "[Recognize Manipulation] This isn’t about what I want.",
      effect: "resist_guilt"
    },
    explanation: "You spotted a guilt trip — a tactic that reframes control as care."
  }
];

let manipulationLog = [];
let triggeredManipulations = [];

// Possible epilogue endings evaluated at the summary screen
const endings = [
  {
    id: "ending_fear_shadow",
    condition: (state) =>
      state.emotions.fear > 3 && state.triggeredFlashbacks.includes("hallway"),
    text: "You fled every reflection. Now, the silence answers for you."
  },
  {
    id: "ending_hope_voice",
    condition: (state) =>
      state.emotions.hope >= 3 && state.triggeredFlashbacks.includes("promise"),
    text: "You listened, even when the world didn’t. That’s why you heard the exit."
  },
  {
    id: "ending_generic",
    condition: () => true,
    text: "The maze remains — not solved, but seen. Sometimes, that is enough."
  }
];

const nullDialogs = [
  { text: "You are being observed." },
  { text: () => `Your ${dominantEmotion()} is noted.` },
  { text: "Compliance is your only freedom.", condition: (s) => s.emotions.fear > 2 },
  { text: "The mirror is not your ally.", condition: (s) => s.triggeredFlashbacks.includes('hallway') },
  { text: "You will remember this command." }
];

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
  lastFocusedElement = document.activeElement;
  btn.focus();
  const handler = () => {
    box.classList.remove('show');
    document.body.classList.remove('flashback-mode');
    btn.removeEventListener('click', handler);
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
  lastFocusedElement = document.activeElement;
  const closeBtn = document.getElementById('self-map-close');
  if (closeBtn) closeBtn.focus();
}

function closeSelfMap() {
  const overlay = document.getElementById('self-map-overlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
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
  lastFocusedElement = document.activeElement;
  const closeBtn = document.getElementById('skills-close');
  if (closeBtn) closeBtn.focus();
}

function closeSkills() {
  const overlay = document.getElementById('skills-overlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
  if (lastFocusedElement) lastFocusedElement.focus();
}

function showManipulationInfo(text, cb) {
  const box = document.getElementById('manipulation-info');
  const txt = document.getElementById('manipulation-text');
  const btn = document.getElementById('manipulation-ok');
  if (!box || !txt || !btn) {
    alert(text);
    cb();
    return;
  }
  txt.textContent = text;
  box.classList.add('show');
  lastFocusedElement = document.activeElement;
  btn.focus();
  const handler = () => {
    box.classList.remove('show');
    btn.removeEventListener('click', handler);
    if (lastFocusedElement) lastFocusedElement.focus();
    cb();
  };
  btn.addEventListener('click', handler);
}

function showManipulation(id, cb) {
  let event = manipulationEncounters.find(m => m.id === id);
  if (!event && MANIPULATION_TACTICS[id]) {
    event = { id, ...MANIPULATION_TACTICS[id] };
  }
  if (!event) { cb(); return; }
  const maze = document.getElementById('maze');
  maze.innerHTML = '';
  document.body.classList.add('manipulation-mode');

  const p = document.createElement('p');
  p.textContent = event.text;
  maze.appendChild(p);

  event.manipulatedChoices.forEach(ch => {
    const b = document.createElement('button');
    b.textContent = ch.text;
    b.addEventListener('click', () => {
      manipulationLog.push({ room: event.id, tactic: event.type, outcome: 'submitted' });
      increaseCorruption();
      document.body.classList.remove('manipulation-mode');
      cb();
    });
    maze.appendChild(b);
  });

  const r = document.createElement('button');
  r.textContent = event.resistChoice.text;
  applyCorruptionToButton(r);
  r.addEventListener('click', () => {
    manipulationLog.push({ room: event.id, tactic: event.type, outcome: 'resisted' });
    document.body.classList.remove('manipulation-mode');
    maybeGrantAnchor();
    if (!skills.patternSense) {
      skills.patternSense = true;
      showSkillUnlock("Skill Unlocked: Pattern Sense");
    }
    increaseCorruption();
    showManipulationInfo(event.explanation, cb);
  });
  r.classList.add('resist');
  maze.appendChild(r);

  if (skills.anchor > 0) {
    const a = document.createElement('button');
    a.textContent = '[Emotional Anchor] Hold to my truth';
    a.classList.add('anchor');
    applyCorruptionToButton(a);
    a.addEventListener('click', () => {
      skills.anchor -= 1;
      skills.anchorUses = (skills.anchorUses || 0) + 1;
      manipulationLog.push({ room: event.id, tactic: event.type, outcome: 'anchored' });
      increaseCorruption();
      document.body.classList.remove('manipulation-mode');
      showSkillUnlock('Emotional Anchor Used');
      cb();
    });
    maze.appendChild(a);
  }
}

function renderManipulationRoom(room) {
  const maze = document.getElementById('maze');
  maze.innerHTML = '';
  document.body.classList.add('manipulation-mode');

  const p = document.createElement('p');
  p.textContent = room.text;
  maze.appendChild(p);

  room.manipulatedChoices.forEach(choice => {
    const b = document.createElement('button');
    b.textContent = choice.text;
    b.addEventListener('click', () => {
      manipulationLog.push({ room: room.id, tactic: room.tactic, outcome: 'submitted' });
      increaseCorruption();
      document.body.classList.remove('manipulation-mode');
      playerPath.push(room.id);
      playerJourney.push({ roomId: room.id, choiceText: choice.text, emotionSnapshot: dominantEmotion() });
      renderRoom(choice.next);
    });
    maze.appendChild(b);
  });

  const r = document.createElement('button');
  r.textContent = room.resistChoice.text;
  r.classList.add('resist');
  applyCorruptionToButton(r);
  r.addEventListener('click', () => {
    manipulationLog.push({ room: room.id, tactic: room.tactic, outcome: 'resisted' });
    document.body.classList.remove('manipulation-mode');
    playerPath.push(room.id);
    playerJourney.push({ roomId: room.id, choiceText: r.textContent, emotionSnapshot: dominantEmotion() });
    maybeGrantAnchor();
    if (!skills.patternSense) {
      skills.patternSense = true;
      showSkillUnlock("Skill Unlocked: Pattern Sense");
    }
    increaseCorruption();
    showManipulationInfo(room.explanation, () => renderRoom(room.resistChoice.next));
  });
  maze.appendChild(r);

  if (skills.anchor > 0) {
    const a = document.createElement('button');
    a.textContent = '[Emotional Anchor] Hold to my truth';
    a.classList.add('anchor');
    applyCorruptionToButton(a);
    a.addEventListener('click', () => {
      skills.anchor -= 1;
      skills.anchorUses = (skills.anchorUses || 0) + 1;
      manipulationLog.push({ room: room.id, tactic: room.tactic, outcome: 'anchored' });
      increaseCorruption();
      document.body.classList.remove('manipulation-mode');
      playerPath.push(room.id);
      playerJourney.push({ roomId: room.id, choiceText: a.textContent, emotionSnapshot: dominantEmotion() });
      showSkillUnlock('Emotional Anchor Used');
      renderRoom(room.resistChoice.next);
    });
    maze.appendChild(a);
  }
}

function renderRoom(roomId) {
  currentRoom = roomId;
  const roomData = MAZE[roomId] || manipulationRooms[roomId];
  if (!roomData) return;
  if (roomData.manipulation && !triggeredManipulations.includes(roomData.manipulation)) {
    const run = () => {
      showManipulation(roomData.manipulation, () => {
        triggeredManipulations.push(roomData.manipulation);
        renderRoom(roomId);
      });
    };
    if (skills.patternSense) {
      const t = MANIPULATION_TACTICS[roomData.manipulation]?.type || roomData.manipulation;
      showPatternWarning(`You sense ${t}...`, run);
    } else {
      run();
    }
    return;
  }
  if (roomData.type === 'manipulation') {
    renderManipulationRoom(roomData);
    return;
  }
  const maze = document.getElementById('maze');
  maze.innerHTML = '';

  const room = document.createElement('div');
  room.className = 'room';

  const p = document.createElement('p');
  p.textContent = roomData.prompt;
  room.appendChild(p);

  const available = roomData.choices.filter(ch => {
    if (!ch.condition) return true;
    try {
      return ch.condition(playerPath.slice(), emotions, triggeredFlashbacks.slice());
    } catch (e) {
      return false;
    }
  });

  if (available.length === 0 && roomData.choices.length) {
    available.push(roomData.choices[0]);
  }

  available.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    if (choice.condition) {
      btn.dataset.gated = 'true';
    }
    btn.addEventListener('click', () => {
      playerPath.push(roomId);
      applyEffects(choice.effects);
      updateBodyEmotion();
      playerJourney.push({ roomId, choiceText: choice.text, emotionSnapshot: dominantEmotion() });
      if (choice.condition) {
        conditionalChoicesTaken.push(choice.text);
      }
      const next = choice.next;
      if (!MAZE[next] || MAZE[next].choices.length === 0) {
        playerPath.push(next);
        playerJourney.push({ roomId: next, choiceText: 'End', emotionSnapshot: dominantEmotion() });
        saveGameState();
        window.location.href = 'summary.html';
      } else {
        renderRoom(next);
      }
    });
    room.appendChild(btn);
  });

  maze.appendChild(room);
  requestAnimationFrame(() => room.classList.add('visible'));
  updateBodyEmotion();
  checkForFlashbacks();
  maybeTriggerNullDialog();
}

  document.addEventListener('DOMContentLoaded', () => {
    playerPath = JSON.parse(localStorage.getItem('playerPath') || '[]');
    playerJourney = JSON.parse(localStorage.getItem('playerJourney') || '[]');
    emotions = JSON.parse(
      localStorage.getItem('emotions') ||
        JSON.stringify({ fear: 0, hope: 0, anger: 0, curiosity: 0 })
    );
    triggeredFlashbacks = JSON.parse(localStorage.getItem('triggeredFlashbacks') || '[]');
    skills = Object.assign(skills, JSON.parse(localStorage.getItem('skills') || '{}'));
    manipulationLog = JSON.parse(localStorage.getItem('manipulationLog') || '[]');
    triggeredManipulations = [];
    conditionalChoicesTaken = JSON.parse(localStorage.getItem('conditionalChoices') || '[]');
    triggeredNullDialogs = JSON.parse(localStorage.getItem('nullDialogs') || '[]');
    lastNullRoom = -3;
    mazeCorruption = parseInt(localStorage.getItem('corruption') || '0');
    currentRoom = localStorage.getItem('currentRoom') || 'start';
  debugPanel = document.createElement('div');
  debugPanel.id = 'debug';
  debugPanel.style.position = 'fixed';
  debugPanel.style.bottom = '10px';
  debugPanel.style.right = '10px';
  debugPanel.style.padding = '4px 6px';
  debugPanel.style.background = 'rgba(0,0,0,0.6)';
  debugPanel.style.color = '#fff';
  debugPanel.style.fontSize = '0.8em';
  debugPanel.style.display = 'none';
  document.body.appendChild(debugPanel);

  const toggle = document.createElement('button');
  toggle.id = 'debug-toggle';
  toggle.textContent = 'Debug';
  toggle.style.position = 'fixed';
  toggle.style.bottom = '10px';
  toggle.style.left = '10px';
  toggle.style.fontSize = '0.8em';
  toggle.addEventListener('click', () => {
    debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    if (debugPanel.style.display === 'block') {
      document.body.classList.add('debug-mode');
    } else {
      document.body.classList.remove('debug-mode');
    }
    updateBodyEmotion();
  });
    document.body.appendChild(toggle);

    const mapBtn = document.getElementById('self-map-btn');
    const mapClose = document.getElementById('self-map-close');
    if (mapBtn && mapClose) {
      mapBtn.addEventListener('click', openSelfMap);
      mapClose.addEventListener('click', closeSelfMap);
    }

    const skillsBtn = document.getElementById('skills-btn');
    const skillsClose = document.getElementById('skills-close');
    if (skillsBtn && skillsClose) {
      skillsBtn.addEventListener('click', openSkills);
      skillsClose.addEventListener('click', closeSkills);
    }

  renderRoom(currentRoom);
  updateBodyEmotion();
});

// expose helpers for summary page
window.getFinalEnding = getFinalEnding;
window.getDominantEmotion = getDominantEmotion;
window.saveGameState = saveGameState;
window.endings = endings;
window.renderRoom = renderRoom;

