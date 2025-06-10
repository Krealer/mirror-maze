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
    choices: [
      { text: "Stay still", next: "ending_a", effects: { fear: 1 } },
      { text: "Run", next: "shadow", effects: { fear: 1, hope: -1 } }
    ]
  },
  shadow: {
    id: "shadow",
    prompt: "A figure mimics you from the dark. It's you — but not quite.",
    choices: [
      { text: "Talk to it", next: "ending_b", effects: { curiosity: 1, hope: 1 } },
      { text: "Attack it", next: "ending_c", effects: { anger: 2, fear: -1 } },
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
    choices: [
      { text: "Press forward", next: "ending_d", effects: { curiosity: 1 } },
      { text: "Retreat", next: "start", effects: { fear: -1 } }
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

// Track which gated choices the player selected
let conditionalChoicesTaken = [];

let playerPath = [];
let emotions = { fear: 0, hope: 0, anger: 0, curiosity: 0 };
let currentEmotionClass = '';
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
    debugPanel.textContent = Object.entries(emotions)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }
}

function showFlashback(text) {
  const box = document.getElementById('flashback-box');
  const txt = document.getElementById('flashback-text');
  const btn = document.getElementById('flashback-ok');
  txt.textContent = text;
  box.classList.add('show');
  document.body.classList.add('flashback-mode');
  const handler = () => {
    box.classList.remove('show');
    document.body.classList.remove('flashback-mode');
    btn.removeEventListener('click', handler);
  };
  btn.addEventListener('click', handler);
}

function checkForFlashbacks() {
  for (const fb of FLASHBACKS) {
    if (!triggeredFlashbacks.includes(fb.id) && fb.condition(playerPath, emotions)) {
      triggeredFlashbacks.push(fb.id);
      showFlashback(fb.text);
      break;
    }
  }
}

function showRoom(roomId) {
  const roomData = MAZE[roomId];
  if (!roomData) return;
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
      if (choice.condition) {
        conditionalChoicesTaken.push(choice.text);
      }
      const next = choice.next;
      if (!MAZE[next] || MAZE[next].choices.length === 0) {
        playerPath.push(next);
        localStorage.setItem('playerPath', JSON.stringify(playerPath));
        localStorage.setItem('emotions', JSON.stringify(emotions));
        localStorage.setItem('dominantEmotion', dominantEmotion());
        localStorage.setItem('triggeredFlashbacks', JSON.stringify(triggeredFlashbacks));
        localStorage.setItem('conditionalChoices', JSON.stringify(conditionalChoicesTaken));
        window.location.href = 'summary.html';
      } else {
        showRoom(next);
      }
    });
    room.appendChild(btn);
  });

  maze.appendChild(room);
  requestAnimationFrame(() => room.classList.add('visible'));
  updateBodyEmotion();
  checkForFlashbacks();
}

document.addEventListener('DOMContentLoaded', () => {
  playerPath = [];
  emotions = { fear: 0, hope: 0, anger: 0, curiosity: 0 };
  triggeredFlashbacks = [];
  conditionalChoicesTaken = [];
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

  showRoom('start');
  updateBodyEmotion();
});

