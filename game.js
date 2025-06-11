function handleChoiceNavigation(e) {
  const keys = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
  if (!keys.includes(e.key)) return;
  const buttons = Array.from(e.currentTarget.querySelectorAll('button'));
  const idx = buttons.indexOf(document.activeElement);
  if (idx === -1) return;
  e.preventDefault();
  let next = idx;
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    next = idx > 0 ? idx - 1 : buttons.length - 1;
  } else {
    next = idx < buttons.length - 1 ? idx + 1 : 0;
  }
  buttons[next].focus();
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
  const firstBtn = room.querySelector('button');
  if (firstBtn) firstBtn.focus();
  room.addEventListener('keydown', handleChoiceNavigation);
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
  const isDebug = ['localhost', '127.0.0.1'].includes(location.hostname) ||
    new URLSearchParams(location.search).has('debug');

  if (isDebug) {
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
  }

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

