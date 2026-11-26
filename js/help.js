/* ==========================================================================
   JUDGLE HELP CONTENT - one entry per page (matches <meta name="jg-help" content="...">).
   Edit the wording here; no code changes needed. Plain text only.
     title    window heading            purpose  one-line summary
     quick    numbered quick-start steps
     controls groups of [label, what it does] rows (gestures, keys, buttons)
     tips     short reminders and common mistakes
   ========================================================================== */
window.JUDGLE_HELP = {

  index: {
    title: 'Welcome to Judgle',
    purpose: 'Practice tools for trampoline and gymnastics judges: learn the rules, sharpen your eye and build training material.',
    quick: [
      'Choose a tool from the list. Every tool has its own ? help in the top-right corner.',
      'Landing Deductions Trainer: practise landing zones, outbounces and stability.',
      'Qira HD Simulator: learn the HD software, from START to REVIEW and recovery.',
      'Electronic Judging Interface: record execution deductions in real time.',
      'Judge Education Designer: turn your own judging into overlay and training videos.',
      'Resources: Code of Points sheets and the deduction video library.'
    ],
    controls: [
      { heading: 'On every tool', items: [
        ['House icon (top-left)', 'Back to this page.'],
        ['? icon (top-right)', 'Help for the tool you are on.'],
        ['Theme button', 'Cycles Dark, Light and Mono.']
      ] }
    ],
    tips: [
      'Settings, trained handwriting and saved routine logs stay on the device you are using.',
      'Practice scores are for learning only and are not official results.',
      'Always check the current Code of Points for the final word on any rule.'
    ]
  },

  rtinput: {
    title: 'Electronic Judging Interface',
    purpose: 'Record execution deductions for each skill and the landing in real time, then review, adjust and export your log.',
    quick: [
      'Choose the discipline: TRP (10 skills), DMT (2 skills) or TUM (8 skills).',
      'Pick an input method: Number Recognition, Swipe, Multi-Touch or Grid, then tap its Start button.',
      'Enter one deduction after each skill. The last entry is the landing.',
      'On the Review screen, fix any value with the minus and plus buttons and add an optional athlete or routine title.',
      'Tap Confirm & Next Routine. Open Log to revisit routines or export them as CSV.'
    ],
    controls: [
      { heading: 'Swipe', items: [
        ['Tap', '0.0'], ['Flick up', '0.1'], ['Swipe right', '0.2'], ['Flick down', '0.3'],
        ['Swipe left', '0.4 (landing 0.5)'], ['Draw a circle', '0.5 (landing 1.0)']
      ] },
      { heading: 'Multi-Touch', items: [
        ['1 to 5 fingers', '0.1 to 0.5 (landing: 4 fingers 0.5, 5 fingers 1.0)'], ['Long swipe', '0.0']
      ] },
      { heading: 'Number Recognition', items: [
        ['Write 0 to 5', 'That deduction in tenths'], ['Write 10', 'Landing 1.0'],
        ['Quick buttons', 'Tap a value if the handwriting is misread']
      ] },
      { heading: 'Grid', items: [
        ['Tap a zone', 'Skill values 0.0 to 0.5; landing 0.0, 0.1, 0.2, 0.3, 0.5, 1.0']
      ] },
      { heading: 'Any method', items: [
        ['Two-finger double-tap', 'Undo the last entry (touch screens)'], ['Ctrl or Cmd + Z', 'Undo (keyboard)'],
        ['Finish Routine', 'End early when fewer skills were performed']
      ] }
    ],
    tips: [
      'The landing scale is different from the skill scale: 0.0, 0.1, 0.2, 0.3, 0.5, 1.0.',
      'Train the handwriting recogniser by tapping a digit under Number Recognition and drawing it your way.',
      'If the routine ends early, tap Finish Routine, then set the number of skills on the Review screen.',
      'The screen is kept awake while you judge, on browsers that allow it.'
    ]
  },

  jed: {
    title: 'Judge Education Designer',
    purpose: 'Record deductions against a routine video, then burn them into an overlay video or a two-pass training video.',
    quick: [
      '1. Load your routine video, or load a saved routine .json or .csv file.',
      '2. Choose the discipline and (optionally) train your handwriting digits.',
      '3. Pick Directional Swipe, Number Recognizer or Keyboard / Numpad and judge as the video plays: one deduction per skill, then the landing.',
      '4. On Review, add the DD, tick fault tags and adjust any value.',
      '5. Apply Overlay & Play to preview, or Export MP4 / Create Training Video. Use Add to Queue to export several routines in one go.'
    ],
    controls: [
      { heading: 'Live judging', items: [
        ['Swipe', 'Tap 0.0, up 0.1, right 0.2, down 0.3, left 0.4, circle 0.5 (landing: left 0.5, circle 1.0)'],
        ['Number Recognizer', 'Write 0 to 5, or 10 for landing 1.0'],
        ['Keyboard / Numpad', 'Keys 0 to 5 for skills; landing 0, 1, 2, 3, 5, and 9 for 1.0'],
        ['Pause / Restart', 'Buttons at the bottom of the video'],
        ['Finish Early', 'Stops after the skills so far']
      ] },
      { heading: 'Batch CSV sync (section 7)', items: [
        ['Spacebar on Skill 1', 'Marks Skill 1; later skills snap to the purple dots, landing is 3.0 s after'],
        ['Drag markers', 'Fine-tune any skill or landing time on the wave']
      ] }
    ],
    tips: [
      'Title cards, the closing breakdown card and the watermark are set in section 5 and appear in exports.',
      'Training video: a clean pass to judge first, a short fade to black, then the pass again with overlays.',
      'MP4 export needs a recent Chrome, Edge or Safari (16.4 or later). Keep the tab open while it renders.',
      'Each export also downloads a .json and .csv copy of the routine so you can reload it later.'
    ]
  },

  landings: {
    title: 'Landing & Outbounce Trainer',
    purpose: 'Practise ruling DMT, TUM and TRP landings, then compare your ruling with the official one and a magnified footprint view.',
    quick: [
      'Choose DMT, TUM or TRP at the top.',
      'Watch the pass. Use Replay (1x) or Slow-Mo (0.5x) as often as you like.',
      'Select the landing zone (or the outbounce deduction on TRP). Switch on Worse Zone +0.2 if the athlete moved into a worse zone.',
      'Select the stability deduction, then Submit.',
      'Compare with the FIG Official panel and read the explanation. Tap Next Pass to continue.'
    ],
    controls: [
      { heading: 'Keys', items: [
        ['R', 'Replay at normal speed'], ['S', 'Replay in slow motion'], ['Enter or Space', 'Next pass, after you have answered']
      ] },
      { heading: 'Modes', items: [
        ['Combined', 'Zone (or outbounce) and stability together'], ['Zone / Outbounce', 'Practise only the zone or outbounce ruling'],
        ['Stability', 'Practise only the stability ruling']
      ] },
      { heading: 'Sharing', items: [
        ['Share Scenario', 'Copies a link to this exact pass'], ['Package', 'Collect passes, add coaching notes and share a playlist link']
      ] }
    ],
    tips: [
      'An exact result needs the initial zone, the zone change and the stability all to match.',
      'Stepping completely off the landing area is a 1.0 stability deduction, not a zone change.',
      'If a foot touches a worse zone line, the worse zone counts.',
      'Explanations follow the trainer\'s current rule set. Check them against the latest Code of Points.'
    ]
  },

  qira: {
    title: 'Qira HD Simulator',
    purpose: 'Practise operating the Eurotramp HD software: START, ROUTINE, REVIEW, adjusting a result and data recovery.',
    quick: [
      'In READY, press Space (or the red USB button) to start. Warm-up bounces appear.',
      'Press Space when the first skill begins. The state changes to ROUTINE.',
      'Press Space again at the end of the routine to open REVIEW.',
      'Check the result, adjust it with the arrow keys if needed, then press Space to confirm or X to dismiss.'
    ],
    controls: [
      { heading: 'Keys and buttons', items: [
        ['Space or red button', 'Moves to the next state / confirms'], ['X', 'Dismiss the result in REVIEW'],
        ['D', 'Show or hide result details'],
        ['Up / Down arrows', 'Change how many skills the deduction is taken from'],
        ['Left / Right arrows', 'Shift which bounces count as the routine']
      ] },
      { heading: 'Recovery', items: [
        ['ESC three times', 'Opens data recovery'], ['Top slider', 'Drag the handles to choose the time window'],
        ['Lower slider', 'Set where Skill 1 starts, then OK']
      ] }
    ],
    tips: [
      'The previous confirmed HD and time-of-flight show at the top of READY.',
      'On a phone, use the on-screen keys and the red button.',
      'This is a practice simulator and not the real software. Follow the Eurotramp manual for competitions.'
    ]
  },

  judgle: {
    title: 'Judgle Video Quiz & Resources',
    purpose: 'Watch a routine, enter your deductions, and see how close you are to the official result. The library holds guides and reference videos.',
    quick: [
      'The latest video loads automatically. Use the history icon to pick an older one.',
      'Watch the routine and type each deduction. The boxes move on by themselves.',
      'The last box is the landing.',
      'Tap Submit. Green is an exact match, yellow is within the accepted range, and the table explains each element.'
    ],
    controls: [
      { heading: 'Top icons', items: [
        ['House', 'Reset and return to the quiz'], ['Half-circle', 'Cycle the theme'], ['Undo arrow', 'Clear your answers'],
        ['Clock', 'Show older videos'], ['Book', 'Open the Resource Library']
      ] },
      { heading: 'Resource Library', items: [
        ['Tag buttons', 'Filter by topic'], ['Circle on a card', 'Mark a resource as watched'], ['Cross', 'Back to the quiz']
      ] }
    ],
    tips: [
      'Skill boxes accept 0 to 5 (tenths). The landing box accepts 0, 1, 2, 3, 5 or 10.',
      'Quiz scores are practice scores while this tool is in development.'
    ]
  }
};
