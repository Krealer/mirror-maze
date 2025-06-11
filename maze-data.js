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
      { text: "Listen to the accusing whispers", next: "guilt_chamber", effects: { fear: 1 } },
      {
        text: "Seek the Null Gate",
        next: "null_gate",
        condition: (_p, _e, _f) => skills.patternSense && skills.anchorUnlocked && skills.truthSense,
        effects: { curiosity: 2 }
      }
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
  },
  null_gate: {
    id: "null_gate",
    prompt: "A silent doorway of negative space reflects every choice you've made. It asks: Who guides you now?",
    choices: [
      { text: "The maze decides my fate", next: "null_fail", effects: { fear: 1 } },
      { text: "Whichever feeling is loudest", next: "null_fail", effects: { curiosity: 1 } },
      {
        text: "I trust my anchor, pattern, and truth",
        next: "null_pass",
        condition: (_p, _e, _f) => skills.patternSense && skills.anchorUnlocked && skills.truthSense,
        effects: { hope: 2 }
      }
    ]
  },
  null_pass: {
    id: "null_pass",
    prompt: "The gate dissolves, leaving only clarity. You move forward." ,
    choices: [ { text: "Step through", next: "ending_d", effects: { hope: 1 } } ]
  },
  null_fail: {
    id: "null_fail",
    prompt: "The gate remains closed. Your reflection fades. End.",
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

const DISTORTIONS = [
  {
    id: 'false_escape',
    condition: (s) => s.playerPath.length >= 3,
    text: 'You remember stepping outside the maze already... yet here you stand.'
  },
  {
    id: 'twisted_promise',
    condition: (s) => s.triggeredFlashbacks.includes('promise') && s.emotions.fear >= 3,
    text: 'A new memory surfaces: a vow to remain trapped forever. Did you really say that?'
  },
  {
    id: 'room_shift',
    condition: (s) => s.playerPath.includes('hidden') && s.playerPath.length > 4,
    text: 'The walls ripple. For a heartbeat the corridor resembles a childhood bedroom.',
    alterPrompt: 'This room shouldn\'t look so familiar. The comfort is unsettling.'
  }
];
