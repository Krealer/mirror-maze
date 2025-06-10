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
}

document.addEventListener('DOMContentLoaded', () => {
  playerPath = [];
  emotions = { fear: 0, hope: 0, anger: 0, curiosity: 0 };
  showRoom('start');
});
