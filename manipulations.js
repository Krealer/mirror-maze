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
  document.addEventListener('keydown', handleManipInfoKey);
  lastFocusedElement = document.activeElement;
  btn.focus();
  const handler = () => {
    box.classList.remove('show');
    btn.removeEventListener('click', handler);
    document.removeEventListener('keydown', handleManipInfoKey);
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
  const firstBtn = maze.querySelector('button');
  if (firstBtn) firstBtn.focus();
  maze.addEventListener('keydown', handleChoiceNavigation);
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
  const firstBtn = maze.querySelector('button');
  if (firstBtn) firstBtn.focus();
  maze.addEventListener('keydown', handleChoiceNavigation);
}
