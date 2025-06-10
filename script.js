const MAZE = {
  start: {
    id: "start",
    prompt: "You wake up in a strange mirror room. Your reflection is missing. What do you do?",
    choices: [
      { text: "Call out", next: "echo", effects: { hope: 1, fear: -1 } },
      { text: "Search silently", next: "shadow", effects: { curiosity: 1, fear: 1 } }
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
      { text: "Attack it", next: "ending_c", effects: { anger: 2, fear: -1 } }
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
  }
};

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

  roomData.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      playerPath.push(roomId);
      applyEffects(choice.effects);
      updateBodyEmotion();
      const next = choice.next;
      if (!MAZE[next] || MAZE[next].choices.length === 0) {
        playerPath.push(next);
        localStorage.setItem('playerPath', JSON.stringify(playerPath));
        localStorage.setItem('emotions', JSON.stringify(emotions));
        localStorage.setItem('dominantEmotion', dominantEmotion());
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
}

document.addEventListener('DOMContentLoaded', () => {
  playerPath = [];
  emotions = { fear: 0, hope: 0, anger: 0, curiosity: 0 };
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
    updateBodyEmotion();
  });
  document.body.appendChild(toggle);

  showRoom('start');
  updateBodyEmotion();
});

