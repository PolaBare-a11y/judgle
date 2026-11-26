  /* Handwriting recogniser + trainer are shared: js/judgle-recognizer.js, js/judgle-trainer.js */
  const { Point, PDollarPointSet } = JudgleRecognizer;
  const dollarRecognizer = JudgleRecognizer.shared;
  const ROUTINE_LOGS_STORAGE_KEY = JudgleStorage.KEYS.routineLogs;

  // Presets & FIG Landing Scale
  const PRESETS = {
    fig:     [0.0, 0.1, 0.2, 0.3, 0.4, 0.5],
    coarse:  [0.0, 0.1, 0.2, 0.3, 0.5, 0.5],
    synchro: [0.00, 0.05, 0.10, 0.15, 0.20, 0.30],
    flipped: [0.1, 0.0, 0.3, 0.2, 0.5, 0.4]
  };

  const LANDING_PRESET = JudgleRules.LANDING_SCALE;

  const DISCIPLINE_SKILLS = JudgleRules.SKILL_COUNTS;

  let currentDiscipline = 'TRP';

  function getMaxSkills() {
    return DISCIPLINE_SKILLS[currentDiscipline] || 10;
  }

  let currentInterface = 'grid'; // 'grid', 'swipe', 'multitouch', or 'recognizer'
  let currentPresetKey = 'fig';
  let activeRoutineZones = [...PRESETS.fig];
  let phase = 'setup';
  let currentSkillIndex = 0;
  let skillDeductions = new Array(10).fill(0);
  let skillThumbnails = new Array(10).fill(null);
  let skillMatchScores = new Array(10).fill(null);
  let landingDeduction = 0;
  let landingThumbnail = null;
  let landingMatchScore = null;
  let skillsPerformed = 10;
  let customTrainedDigits = {};
  let currentRoutineTitle = '';

  let routineLogHistory = [];
  let routineCounter = 1;
  let currentViewingLogIndex = -1;

  // DOM Elements
  const setupScreen          = document.getElementById('setupScreen');
  const gridScreen           = document.getElementById('gridScreen');
  const swipeScreen          = document.getElementById('swipeScreen');
  const multiTouchScreen     = document.getElementById('multiTouchScreen');
  const recognizerScreen     = document.getElementById('recognizerScreen');
  const reviewScreen         = document.getElementById('reviewScreen');
  const phaseBadge           = document.getElementById('phaseBadge');
  const skillCounter         = document.getElementById('skillCounter');
  const btnFinishRoutine     = document.getElementById('btnFinishRoutine');
  const btnHeaderLog         = document.getElementById('btnHeaderLog');
  const logModal             = document.getElementById('logModal');
  const logListContainer     = document.getElementById('logListContainer');
  const headerLogCountBadge  = document.getElementById('headerLogCountBadge');
  const reviewLogCountBadge  = document.getElementById('reviewLogCountBadge');
  const btnResetPatterns     = document.getElementById('btnResetPatterns');
  const routineTitleInput    = document.getElementById('routineTitleInput');
  const titleEditBadge       = document.getElementById('titleEditBadge');
  const btnClearTitle        = document.getElementById('btnClearTitle');
  const recentTitleChips     = document.getElementById('recentTitleChips');

  const canvas               = document.getElementById('gestureCanvas');
  const ctx                  = canvas ? canvas.getContext('2d') : null;

  const mtCanvas             = document.getElementById('multiTouchCanvas');
  const mtCtx                = mtCanvas ? mtCanvas.getContext('2d') : null;

  const recCanvas            = document.getElementById('recognizerCanvas');
  const recCtx               = recCanvas ? recCanvas.getContext('2d') : null;

  /* ==========================================================================
     SCREEN WAKE LOCK MANAGEMENT (KEEPS DISPLAY AWAKE DURING JUDGING)
     ========================================================================== */
  let wakeLockSentinel = null;

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      if (wakeLockSentinel) return;
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } catch (err) {
      // Silently ignore if low-battery mode or platform blocks wake lock
    }
  }

  async function releaseWakeLock() {
    if (!wakeLockSentinel) return;
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    } catch (err) {
      wakeLockSentinel = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (phase === 'routine' || phase === 'landing')) {
      requestWakeLock();
    }
  });

  /* ==========================================================================
     LOCAL STORAGE PERSISTENCE FOR CUSTOM PATTERNS & ROUTINE LOGS
     ========================================================================== */
  function loadLogsFromStorage() {
    try {
      const raw = localStorage.getItem(ROUTINE_LOGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        routineLogHistory = parsed;
        routineCounter = routineLogHistory.length > 0
          ? (Math.max(...routineLogHistory.map(r => r.routineNum || 0)) + 1)
          : 1;
        updateLogBadges();
      }
    } catch (e) {
      console.warn('Unable to load routine logs from localStorage:', e);
    }
  }

  function persistLogsToStorage() {
    try {
      localStorage.setItem(ROUTINE_LOGS_STORAGE_KEY, JSON.stringify(routineLogHistory));
    } catch (e) {
      try {
        const trimmedLogs = routineLogHistory.map((entry, idx) => {
          if (idx < routineLogHistory.length - 10) {
            return {
              ...entry,
              skillThumbnails: [],
              landingThumbnail: null
            };
          }
          return entry;
        });
        localStorage.setItem(ROUTINE_LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));
      } catch (innerErr) {
        console.warn('Unable to save routine logs to localStorage:', innerErr);
      }
    }
  }

  /* ==========================================================================
     CANVAS BOUNDING BOX CROPPING UTILITY
     ========================================================================== */
  function createCroppedThumbnail(sourceCanvas, minX, minY, maxX, maxY, padding = 20) {
    if (!sourceCanvas || !isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return sourceCanvas ? sourceCanvas.toDataURL('image/png') : null;
    }

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    let x1 = Math.max(0, Math.floor(minX - padding));
    let y1 = Math.max(0, Math.floor(minY - padding));
    let x2 = Math.min(width, Math.ceil(maxX + padding));
    let y2 = Math.min(height, Math.ceil(maxY + padding));

    let cropWidth = x2 - x1;
    let cropHeight = y2 - y1;

    if (cropWidth <= 5 || cropHeight <= 5) {
      return sourceCanvas.toDataURL('image/png');
    }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');

    cropCtx.drawImage(sourceCanvas, x1, y1, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    return cropCanvas.toDataURL('image/png');
  }

  /* ==========================================================================
     AUDIO & HAPTIC FEEDBACK WITH PITCH STEPPING
     ========================================================================== */
  /* Audio + haptic feedback is shared: js/judgle-utils.js */
  function triggerFeedback(type = 'tap') {
    JudgleFeedback.trigger(type, { step: currentSkillIndex, steps: getMaxSkills() });
  }

  function showUndoToast(msg) {
    const existing = document.querySelector('.undo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'undo-toast';
    toast.textContent = `↩️ ${msg}`;
    document.querySelector('.app-wrapper').appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 1250);
  }

  /* ==========================================================================
     QUICK UNDO MECHANISM
     ========================================================================== */
  let lastTwoFingerTapTime = 0;

  document.addEventListener('touchstart', (e) => {
    if (phase !== 'routine' && phase !== 'landing') return;
    if (currentInterface === 'multitouch') return; // Multi-touch interface handles 2-finger tap as deduction 0.2

    if (e.touches.length === 2) {
      const now = Date.now();
      if (now - lastTwoFingerTapTime < 450) {
        e.preventDefault();
        performUndo();
        lastTwoFingerTapTime = 0;
      } else {
        lastTwoFingerTapTime = now;
      }
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (phase === 'routine' || phase === 'landing') {
        e.preventDefault();
        performUndo();
      }
    }
  });

  function performUndo() {
    clearPendingRecognizerState();
    const maxSkills = getMaxSkills();

    if (phase === 'landing') {
      phase = 'routine';
      currentSkillIndex = maxSkills - 1;
      landingDeduction = 0;
      landingThumbnail = null;
      landingMatchScore = null;

      skillDeductions[maxSkills - 1] = 0;
      skillThumbnails[maxSkills - 1] = null;
      skillMatchScores[maxSkills - 1] = null;

      phaseBadge.textContent = 'Routine';
      phaseBadge.className = 'phase-badge badge-routine';

      if (currentInterface === 'grid') {
        renderGrid(activeRoutineZones);
      } else if (currentInterface === 'swipe') {
        updateSwipeDisplay(0.0, `Undone: Reverted to Skill ${maxSkills}`);
      } else if (currentInterface === 'multitouch') {
        updateMultiTouchDisplay(0.0, `Undone: Reverted to Skill ${maxSkills}`);
      } else if (currentInterface === 'recognizer') {
        updateRecognizerDisplay(0.0, `Undone: Reverted to Skill ${maxSkills}`);
      }

      updateCounter();
      triggerFeedback('transition');
      showUndoToast(`Undone Landing -> Skill ${maxSkills}`);
      return;
    }

    if (phase === 'routine') {
      if (currentSkillIndex > 0) {
        currentSkillIndex--;
        const undoneSkillNum = currentSkillIndex + 1;
        skillDeductions[currentSkillIndex] = 0;
        skillThumbnails[currentSkillIndex] = null;
        skillMatchScores[currentSkillIndex] = null;

        if (currentInterface === 'swipe') {
          updateSwipeDisplay(0.0, `Undone Skill ${undoneSkillNum}`);
        } else if (currentInterface === 'multitouch') {
          updateMultiTouchDisplay(0.0, `Undone Skill ${undoneSkillNum}`);
        } else if (currentInterface === 'recognizer') {
          updateRecognizerDisplay(0.0, `Undone Skill ${undoneSkillNum}`);
        }

        updateCounter();
        triggerFeedback('transition');
        showUndoToast(`Undone Skill ${undoneSkillNum}`);
      } else {
        showUndoToast('Already at Skill 1');
      }
    }
  }

  function selectDiscipline(discKey, el) {
    currentDiscipline = discKey;
    document.getElementById('discTrpCard').classList.remove('selected');
    document.getElementById('discDmtCard').classList.remove('selected');
    document.getElementById('discTumCard').classList.remove('selected');
    el.classList.add('selected');
  }

  function selectPreset(key, el) {
    currentPresetKey = key;
    activeRoutineZones = [...PRESETS[key]];
    document.getElementById('presetFigCard').classList.remove('selected');
    document.getElementById('presetFlippedCard').classList.remove('selected');
    el.classList.add('selected');
  }

  function renderGrid(values) {
    for (let i = 0; i < 6; i++) {
      const btn = document.getElementById(`zone${i}`);
      const val = values[i];
      btn.querySelector('.val').textContent = typeof val === 'number' ? val.toFixed(1) : val;
    }
  }

  function updateSwipeDisplay(recordedVal = 0, lastActionName = '') {
    const feedbackLabel = document.getElementById('swipeFeedbackLabel');
    const feedbackVal   = document.getElementById('swipeFeedbackVal');
    const lastActionEl  = document.getElementById('swipeLastAction');
    const maxSkills     = getMaxSkills();

    if (phase === 'routine') {
      feedbackLabel.textContent = `Skill ${currentSkillIndex + 1} / ${maxSkills}`;
      feedbackVal.textContent = typeof recordedVal === 'number' ? `-${recordedVal.toFixed(1)}` : recordedVal;
    } else if (phase === 'landing') {
      feedbackLabel.textContent = `Landing Deduction`;
      feedbackVal.textContent = typeof recordedVal === 'number' ? `-${recordedVal.toFixed(1)}` : recordedVal;
    }

    if (lastActionName) {
      lastActionEl.textContent = lastActionName;
    }
  }

  function updateMultiTouchDisplay(recordedVal = 0, lastActionName = '') {
    const feedbackLabel = document.getElementById('mtFeedbackLabel');
    const feedbackVal   = document.getElementById('mtFeedbackVal');
    const lastActionEl  = document.getElementById('mtLastAction');
    const maxSkills     = getMaxSkills();

    if (phase === 'routine') {
      feedbackLabel.textContent = `Skill ${currentSkillIndex + 1} / ${maxSkills}`;
      feedbackVal.textContent = typeof recordedVal === 'number' ? `-${recordedVal.toFixed(1)}` : recordedVal;
    } else if (phase === 'landing') {
      feedbackLabel.textContent = `Landing Deduction`;
      feedbackVal.textContent = typeof recordedVal === 'number' ? `-${recordedVal.toFixed(1)}` : recordedVal;
    }

    if (lastActionName) {
      lastActionEl.textContent = lastActionName;
    }
  }

  function updateRecognizerDisplay(recordedVal = 0, lastActionName = '') {
    syncQuickButtons();
    const feedbackLabel = document.getElementById('recFeedbackLabel');
    const feedbackVal   = document.getElementById('recFeedbackVal');
    const lastActionEl  = document.getElementById('recLastAction');
    const maxSkills     = getMaxSkills();

    if (phase === 'routine') {
      feedbackLabel.textContent = `Skill ${currentSkillIndex + 1} / ${maxSkills}`;
      feedbackVal.textContent = typeof recordedVal === 'number' ? `-${recordedVal.toFixed(1)}` : recordedVal;
    } else if (phase === 'landing') {
      feedbackLabel.textContent = `Landing Deduction`;
      feedbackVal.textContent = typeof recordedVal === 'number' ? `-${recordedVal.toFixed(1)}` : recordedVal;
    }

    if (lastActionName) {
      lastActionEl.textContent = lastActionName;
    }
  }

  function clearPendingRecognizerState() {
    if (recognizerTimer) {
      clearTimeout(recognizerTimer);
      recognizerTimer = null;
    }
    accumulatedRecPoints = [];
    currentStrokeId = 0;
    if (recCtx && recCanvas) {
      recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
    }
  }

  function getNextRoutineNumber() {
    return routineLogHistory.length > 0
      ? (Math.max(...routineLogHistory.map(r => r.routineNum)) + 1)
      : 1;
  }

  function startRoutine(mode) {
    if (mode) {
      currentInterface = mode;
    }
    const maxSkills = getMaxSkills();
    phase = 'routine';
    currentSkillIndex = 0;
    currentViewingLogIndex = -1;
    currentRoutineTitle = '';
    skillDeductions = new Array(maxSkills).fill(0);
    skillThumbnails = new Array(maxSkills).fill(null);
    skillMatchScores = new Array(maxSkills).fill(null);
    landingDeduction = 0;
    landingThumbnail = null;
    landingMatchScore = null;
    skillsPerformed = maxSkills;

    clearPendingRecognizerState();

    setupScreen.classList.add('hidden');
    reviewScreen.classList.add('hidden');
    gridScreen.classList.add('hidden');
    swipeScreen.classList.add('hidden');
    multiTouchScreen.classList.add('hidden');
    recognizerScreen.classList.add('hidden');

    if (btnFinishRoutine) btnFinishRoutine.classList.remove('hidden');
    if (btnHeaderLog) btnHeaderLog.classList.add('hidden');
    if (skillCounter) skillCounter.classList.remove('hidden');

    if (currentInterface === 'grid') {
      gridScreen.classList.remove('hidden');
      renderGrid(activeRoutineZones);
    } else if (currentInterface === 'swipe') {
      swipeScreen.classList.remove('hidden');
      updateSwipeDisplay(0.0, 'Ready for gesture input');
      setTimeout(initCanvasSize, 50);
    } else if (currentInterface === 'multitouch') {
      multiTouchScreen.classList.remove('hidden');
      updateMultiTouchDisplay(0.0, 'Tap with 1 to 5 fingers or long swipe for 0.0');
      setTimeout(initMtCanvasSize, 50);
    } else if (currentInterface === 'recognizer') {
      recognizerScreen.classList.remove('hidden');
      updateRecognizerDisplay(0.0, 'Draw digit on canvas');
      setTimeout(initRecCanvasSize, 50);
    }

    phaseBadge.textContent = 'Routine';
    phaseBadge.className = 'phase-badge badge-routine';
    updateCounter();

    requestWakeLock();
    triggerFeedback('transition');
  }

  function finishRoutineEarly() {
    triggerFeedback('tap');
    clearPendingRecognizerState();

    if (phase === 'routine') {
      skillsPerformed = currentSkillIndex;
    }

    enterReviewPhase();
  }

  function enterReviewPhase() {
    phase = 'review';
    releaseWakeLock();

    gridScreen.classList.add('hidden');
    swipeScreen.classList.add('hidden');
    multiTouchScreen.classList.add('hidden');
    recognizerScreen.classList.add('hidden');
    reviewScreen.classList.remove('hidden');

    if (btnFinishRoutine) btnFinishRoutine.classList.add('hidden');
    if (btnHeaderLog) btnHeaderLog.classList.remove('hidden');

    phaseBadge.textContent = 'Review';
    phaseBadge.className = 'phase-badge badge-review';
    updateCounter();

    currentViewingLogIndex = -1;
    currentRoutineTitle = '';

    renderReviewSummary();
    triggerFeedback('complete');
  }

  function confirmAndNextRoutine() {
    saveCurrentReviewToLog();
    routineCounter = routineLogHistory.length + 1;
    startRoutine();
  }

  function updateCounter() {
    const maxSkills = getMaxSkills();
    if (phase === 'routine') {
      skillCounter.textContent = `Skill ${currentSkillIndex + 1} / ${maxSkills}`;
    } else if (phase === 'landing') {
      skillCounter.textContent = `Landing Deduction`;
    } else if (phase === 'review') {
      skillCounter.textContent = `Complete`;
    }
  }

  const zoneButtons = document.querySelectorAll('.zone-btn');
  zoneButtons.forEach((btn, index) => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('active-touch');
      handleZoneInput(index);
    });

    btn.addEventListener('pointerup', () => btn.classList.remove('active-touch'));
    btn.addEventListener('pointerleave', () => btn.classList.remove('active-touch'));
  });

  function handleZoneInput(zoneIndex, actionLabel = '', thumbnailData = null, matchScore = null) {
    const activeSet = (phase === 'landing') ? LANDING_PRESET : activeRoutineZones;
    const val = activeSet[zoneIndex];
    const maxSkills = getMaxSkills();

    if (phase === 'routine') {
      triggerFeedback('tap');

      skillDeductions[currentSkillIndex] = val;
      if (thumbnailData) skillThumbnails[currentSkillIndex] = thumbnailData;
      if (matchScore !== null && matchScore !== undefined) skillMatchScores[currentSkillIndex] = matchScore;

      currentSkillIndex++;

      if (currentSkillIndex >= maxSkills) {
        phase = 'landing';
        if (currentInterface === 'grid') {
          renderGrid(LANDING_PRESET);
        } else if (currentInterface === 'swipe') {
          updateSwipeDisplay(val, actionLabel ? `${actionLabel} (Skill ${maxSkills})` : '');
        } else if (currentInterface === 'multitouch') {
          updateMultiTouchDisplay(val, actionLabel ? `${actionLabel} (Skill ${maxSkills})` : '');
        } else if (currentInterface === 'recognizer') {
          updateRecognizerDisplay(val, actionLabel ? `${actionLabel} (Skill ${maxSkills})` : '');
        }
        phaseBadge.textContent = 'Landing';
        phaseBadge.className = 'phase-badge badge-landing';
        triggerFeedback('landing');
      } else {
        if (currentInterface === 'swipe') {
          updateSwipeDisplay(val, actionLabel ? `${actionLabel} (Skill ${currentSkillIndex})` : '');
        } else if (currentInterface === 'multitouch') {
          updateMultiTouchDisplay(val, actionLabel ? `${actionLabel} (Skill ${currentSkillIndex})` : '');
        } else if (currentInterface === 'recognizer') {
          updateRecognizerDisplay(val, actionLabel ? `${actionLabel} (Skill ${currentSkillIndex})` : '');
        }
      }
      updateCounter();

    } else if (phase === 'landing') {
      landingDeduction = val;
      if (thumbnailData) landingThumbnail = thumbnailData;
      if (matchScore !== null && matchScore !== undefined) landingMatchScore = matchScore;

      enterReviewPhase();
    }
  }

  /* ==========================================================================
     SWIPE GESTURE RECOGNITION ENGINE
     ========================================================================== */
  let pointerPoints = [];
  let isPointerDown = false;

  function initCanvasSize() {
    if (!canvas || !swipeScreen) return;
    canvas.width = swipeScreen.offsetWidth || window.innerWidth;
    canvas.height = swipeScreen.offsetHeight || window.innerHeight;
  }

  window.addEventListener('resize', () => {
    initCanvasSize();
    initMtCanvasSize();
    initRecCanvasSize();
    initTrainerCanvas();
  });

  if (swipeScreen) {
    swipeScreen.addEventListener('pointerdown', (e) => {
      if (phase !== 'routine' && phase !== 'landing') return;
      e.preventDefault();
      try { swipeScreen.setPointerCapture(e.pointerId); } catch(err) {}
      isPointerDown = true;
      pointerPoints = [{ x: e.clientX, y: e.clientY, t: Date.now() }];
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
        ctx.strokeStyle = '#e68a00';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    });

    swipeScreen.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      e.preventDefault();
      pointerPoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (ctx) {
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
      }
    });

    swipeScreen.addEventListener('pointerup', (e) => {
      if (!isPointerDown) return;
      e.preventDefault();
      isPointerDown = false;
      try { swipeScreen.releasePointerCapture(e.pointerId); } catch(err) {}

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let pathLen = 0;

      pointerPoints.forEach((p, idx) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
        if (idx > 0) {
          const dx = p.x - pointerPoints[idx - 1].x;
          const dy = p.y - pointerPoints[idx - 1].y;
          pathLen += Math.sqrt(dx * dx + dy * dy);
        }
      });

      // Decorate thumbnail stroke with origin dot + directional arrowhead at release end
      if (ctx && pointerPoints.length > 0) {
        const startPt = pointerPoints[0];
        const endPt = pointerPoints[pointerPoints.length - 1];

        ctx.fillStyle = '#e68a00';
        ctx.strokeStyle = '#e68a00';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (pathLen < 30) {
          ctx.beginPath();
          ctx.arc(startPt.x, startPt.y, 10, 0, Math.PI * 2);
          ctx.fill();
          minX = Math.min(minX, startPt.x - 10);
          maxX = Math.max(maxX, startPt.x + 10);
          minY = Math.min(minY, startPt.y - 10);
          maxY = Math.max(maxY, startPt.y + 10);
        } else {
          ctx.beginPath();
          ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
          ctx.fill();

          let refPt = pointerPoints[0];
          for (let i = pointerPoints.length - 2; i >= 0; i--) {
            const dx = endPt.x - pointerPoints[i].x;
            const dy = endPt.y - pointerPoints[i].y;
            if (Math.sqrt(dx * dx + dy * dy) >= 12) {
              refPt = pointerPoints[i];
              break;
            }
          }

          const angle = Math.atan2(endPt.y - refPt.y, endPt.x - refPt.x);
          const headLen = 20;
          const wingAngle = Math.PI / 5.5;

          const leftX = endPt.x - headLen * Math.cos(angle - wingAngle);
          const leftY = endPt.y - headLen * Math.sin(angle - wingAngle);
          const rightX = endPt.x - headLen * Math.cos(angle + wingAngle);
          const rightY = endPt.y - headLen * Math.sin(angle + wingAngle);

          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(leftX, leftY);
          ctx.lineTo(endPt.x, endPt.y);
          ctx.lineTo(rightX, rightY);
          ctx.stroke();

          minX = Math.min(minX, leftX, rightX);
          maxX = Math.max(maxX, leftX, rightX);
          minY = Math.min(minY, leftY, rightY);
          maxY = Math.max(maxY, leftY, rightY);
        }
      }

      const thumbData = createCroppedThumbnail(canvas, minX, minY, maxX, maxY, 20);

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      processGesturePoints(pointerPoints, thumbData);
    });

    swipeScreen.addEventListener('pointercancel', (e) => {
      isPointerDown = false;
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  /* Every input method resolves to a deduction value (rules in js/judgle-rules.js), then to a slot on the active scale */
  function handleDeductionValue(val, actionLabel = '', thumbnailData = null, matchScore = null) {
    const set = (phase === 'landing') ? LANDING_PRESET : activeRoutineZones;
    let idx = set.findIndex(v => Math.abs(v - val) < 0.001);
    if (idx === -1) {
      idx = set.reduce((best, v, i) => Math.abs(v - val) < Math.abs(set[best] - val) ? i : best, 0);
    }
    handleZoneInput(idx, actionLabel, thumbnailData, matchScore);
  }

  function processGesturePoints(points, thumbData = null) {
    const dir = JudgleGestures.classifySwipe(points);
    if (!dir) return;
    const val = JudgleRules.swipeValue(dir, phase === 'landing');
    handleDeductionValue(val, `${JudgleRules.SWIPE_LABELS[dir]} (-${val.toFixed(1)})`, thumbData);
  }

  /* ==========================================================================
     MULTI-TOUCH RECOGNITION ENGINE (LONGER SWIPE=0.0, 1 FINGER=.1, 2 FINGERS=.2, etc.)
     ========================================================================== */
  let mtMaxFingers = 0;
  let mtIsSwiped = false;
  let mtStartTouchesMap = {};
  let mtTouchPoints = [];
  let mtActive = false;

  const MULTITOUCH_SWIPE_THRESHOLD_PX = 85;

  function initMtCanvasSize() {
    if (!mtCanvas || !multiTouchScreen) return;
    mtCanvas.width = multiTouchScreen.offsetWidth || window.innerWidth;
    mtCanvas.height = multiTouchScreen.offsetHeight || window.innerHeight;
  }

  if (multiTouchScreen) {
    multiTouchScreen.addEventListener('touchstart', (e) => {
      if (phase !== 'routine' && phase !== 'landing') return;
      e.preventDefault();

      const rect = mtCanvas.getBoundingClientRect();

      if (!mtActive) {
        mtActive = true;
        mtMaxFingers = e.touches.length;
        mtIsSwiped = false;
        mtStartTouchesMap = {};
        mtTouchPoints = [];
        Array.from(e.touches).forEach(t => {
          mtStartTouchesMap[t.identifier] = { x: t.clientX, y: t.clientY };
          mtTouchPoints.push({ x: t.clientX - rect.left, y: t.clientY - rect.top });
        });
        if (mtCtx) mtCtx.clearRect(0, 0, mtCanvas.width, mtCanvas.height);
      } else {
        mtMaxFingers = Math.max(mtMaxFingers, e.touches.length);
        Array.from(e.touches).forEach(t => {
          if (!mtStartTouchesMap[t.identifier]) {
            mtStartTouchesMap[t.identifier] = { x: t.clientX, y: t.clientY };
          }
          mtTouchPoints.push({ x: t.clientX - rect.left, y: t.clientY - rect.top });
        });
      }

      if (mtCtx) {
        mtCtx.fillStyle = '#e68a00';
        Array.from(e.touches).forEach(t => {
          mtCtx.beginPath();
          mtCtx.arc(t.clientX - rect.left, t.clientY - rect.top, 24, 0, 2 * Math.PI);
          mtCtx.fill();
        });
      }
    }, { passive: false });

    multiTouchScreen.addEventListener('touchmove', (e) => {
      if (!mtActive) return;
      e.preventDefault();

      const rect = mtCanvas.getBoundingClientRect();
      Array.from(e.touches).forEach(t => {
        mtTouchPoints.push({ x: t.clientX - rect.left, y: t.clientY - rect.top });
        const start = mtStartTouchesMap[t.identifier];
        if (start) {
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.sqrt(dx * dx + dy * dy) > MULTITOUCH_SWIPE_THRESHOLD_PX) {
            mtIsSwiped = true;
          }
        }
      });
    }, { passive: false });

    multiTouchScreen.addEventListener('touchend', (e) => {
      if (!mtActive) return;
      e.preventDefault();

      if (e.touches.length === 0) {
        mtActive = false;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        mtTouchPoints.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        const thumbData = createCroppedThumbnail(mtCanvas, minX, minY, maxX, maxY, 30);
        if (mtCtx) mtCtx.clearRect(0, 0, mtCanvas.width, mtCanvas.height);

        processMultiTouchInput(mtIsSwiped, mtMaxFingers, thumbData);
      }
    }, { passive: false });

    multiTouchScreen.addEventListener('touchcancel', () => {
      mtActive = false;
      if (mtCtx) mtCtx.clearRect(0, 0, mtCanvas.width, mtCanvas.height);
    });
  }

  function processMultiTouchInput(isSwiped, fingerCount, thumbData) {
    const val = JudgleRules.multitouchValue(fingerCount, isSwiped, phase === 'landing');
    const label = isSwiped
      ? 'Long Swipe (-0.0)'
      : `${Math.min(5, Math.max(1, fingerCount))} Finger Tap (-${val.toFixed(1)})`;
    handleDeductionValue(val, label, thumbData);
  }

  /* ==========================================================================
     NUMBER RECOGNITION INTERFACE ($P POINT SPACE ENGINE)
     ========================================================================== */
  let accumulatedRecPoints = [];
  let currentStrokeId = 0;
  let isRecPointerDown = false;
  let recognizerTimer = null;

  function initRecCanvasSize() {
    if (!recCanvas || !recognizerScreen) return;
    recCanvas.width = recognizerScreen.offsetWidth || window.innerWidth;
    recCanvas.height = recognizerScreen.offsetHeight || window.innerHeight;
  }

  if (recCanvas) {
    recCanvas.addEventListener('pointerdown', (e) => {
      if (phase !== 'routine' && phase !== 'landing') return;
      e.preventDefault();
      try { recCanvas.setPointerCapture(e.pointerId); } catch(err) {}

      if (recognizerTimer) {
        clearTimeout(recognizerTimer);
        recognizerTimer = null;
      }

      isRecPointerDown = true;
      currentStrokeId++;

      const rect = recCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      accumulatedRecPoints.push(new Point(x, y, currentStrokeId));

      if (recCtx) {
        recCtx.beginPath();
        recCtx.moveTo(x, y);
        recCtx.strokeStyle = '#e68a00';
        recCtx.lineWidth = 8;
        recCtx.lineCap = 'round';
        recCtx.lineJoin = 'round';
      }
    });

    recCanvas.addEventListener('pointermove', (e) => {
      if (!isRecPointerDown) return;
      e.preventDefault();

      const rect = recCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      accumulatedRecPoints.push(new Point(x, y, currentStrokeId));

      if (recCtx) {
        recCtx.lineTo(x, y);
        recCtx.stroke();
      }
    });

    recCanvas.addEventListener('pointerup', (e) => {
      if (!isRecPointerDown) return;
      e.preventDefault();
      isRecPointerDown = false;
      try { recCanvas.releasePointerCapture(e.pointerId); } catch(err) {}

      recognizerTimer = setTimeout(() => {
        finalizeRecognizerDrawing();
      }, 250);
    });

    recCanvas.addEventListener('pointercancel', () => {
      isRecPointerDown = false;
      clearPendingRecognizerState();
    });
  }

  function finalizeRecognizerDrawing() {
    recognizerTimer = null;
    if (!accumulatedRecPoints || accumulatedRecPoints.length < 3) {
      clearPendingRecognizerState();
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    accumulatedRecPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const thumbData = createCroppedThumbnail(recCanvas, minX, minY, maxX, maxY, 24);

    if (recCtx) {
      recCtx.clearRect(0, 0, recCanvas.width, recCanvas.height);
    }

    const pointsToRecognize = [...accumulatedRecPoints];
    accumulatedRecPoints = [];
    currentStrokeId = 0;

    processNumberRecognition(pointsToRecognize, thumbData);
  }

  function processNumberRecognition(points, thumbData) {
    if (!points || points.length < 3) return;
    const result = dollarRecognizer.Recognize(points);
    const matchedName = result ? result.Name : "0";
    const scorePct = result ? Math.round(result.Score * 100) : 0;
    const val = JudgleRules.digitValue(matchedName, phase === 'landing');
    if (val === null) return;
    handleDeductionValue(val, `Recognized "${matchedName}" (-${val.toFixed(1)})`, thumbData, scorePct);
  }

  /* Quick buttons are positional: slot N is the Nth value on the active scale (skill or landing) */
  function quickSelectRecognized(slot) {
    clearPendingRecognizerState();
    const scale = (phase === 'landing') ? JudgleRules.LANDING_SCALE : JudgleRules.SKILL_SCALE;
    const val = scale[slot];
    if (val === undefined) return;
    handleDeductionValue(val, `Quick ${val.toFixed(1)}`);
  }

  function syncQuickButtons() {
    const scale = (phase === 'landing') ? JudgleRules.LANDING_SCALE : JudgleRules.SKILL_SCALE;
    document.querySelectorAll('.quick-btn').forEach((btn, i) => {
      if (scale[i] !== undefined) btn.textContent = scale[i].toFixed(1);
    });
  }

  /* ==========================================================================
     REVIEW TITLE & DYNAMIC RECENT-NAME CHIPS (ROLLING LAST 4, SINGLE ROW)
     ========================================================================== */
  function syncTitleFieldControls() {
    const hasText = routineTitleInput && routineTitleInput.value.trim().length > 0;
    if (titleEditBadge) {
      titleEditBadge.classList.toggle('hidden', hasText);
    }
    if (btnClearTitle) {
      btnClearTitle.classList.toggle('hidden', !hasText);
    }
  }

  function handleRoutineTitleInput() {
    if (!routineTitleInput) return;
    currentRoutineTitle = routineTitleInput.value;
    syncTitleFieldControls();

    if (currentViewingLogIndex >= 0 && currentViewingLogIndex < routineLogHistory.length) {
      const fallbackTitle = `Routine #${routineLogHistory[currentViewingLogIndex].routineNum}`;
      routineLogHistory[currentViewingLogIndex].title = currentRoutineTitle.trim() || fallbackTitle;
      persistLogsToStorage();
    }
  }

  function clearRoutineTitleInput() {
    if (!routineTitleInput) return;
    routineTitleInput.value = '';
    currentRoutineTitle = '';
    syncTitleFieldControls();
    if (currentViewingLogIndex >= 0 && currentViewingLogIndex < routineLogHistory.length) {
      routineLogHistory[currentViewingLogIndex].title = `Routine #${routineLogHistory[currentViewingLogIndex].routineNum}`;
      persistLogsToStorage();
    }
    routineTitleInput.focus();
  }

  function applyTitleChip(label) {
    if (!routineTitleInput) return;
    routineTitleInput.value = label;
    currentRoutineTitle = label;
    syncTitleFieldControls();
    triggerFeedback('transition');
    if (currentViewingLogIndex >= 0 && currentViewingLogIndex < routineLogHistory.length) {
      routineLogHistory[currentViewingLogIndex].title = label;
      persistLogsToStorage();
    }
  }

  function renderRecentTitleChips() {
    if (!recentTitleChips) return;

    const seen = new Set();
    const uniqueNames = [];

    for (let i = routineLogHistory.length - 1; i >= 0; i--) {
      const title = (routineLogHistory[i].title || '').trim();
      if (!title) continue;
      if (/^Routine #\d+$/i.test(title)) continue;

      const lowerKey = title.toLowerCase();
      if (!seen.has(lowerKey)) {
        seen.add(lowerKey);
        uniqueNames.push(title);
      }
      if (uniqueNames.length >= 4) break;
    }

    if (uniqueNames.length === 0) {
      recentTitleChips.classList.add('hidden');
      recentTitleChips.innerHTML = '';
      return;
    }

    recentTitleChips.innerHTML = '';
    uniqueNames.forEach(name => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'title-chip';
      chip.textContent = name;
      chip.title = name;
      chip.onclick = () => applyTitleChip(name);
      recentTitleChips.appendChild(chip);
    });
    recentTitleChips.classList.remove('hidden');
  }

  /* ==========================================================================
     DEDUCTION SEVERITY COLOUR MAPPING (0/1 = Green, 2/3 = Orange, 4/5/10 = Red)
     ========================================================================== */
  function getDeductionColorClass(val) {
    return 'deduct-col-' + JudgleRules.severity(val);
  }

  function adjustSkillsCount(delta) {
    triggerFeedback('transition');
    const maxSkills = getMaxSkills();
    skillsPerformed = Math.min(maxSkills, Math.max(0, skillsPerformed + delta));
    renderReviewSummary();
  }

  function renderReviewSummary() {
    const maxSkills = getMaxSkills();
    document.getElementById('skillsCountDisplay').textContent = skillsPerformed;

    if (routineTitleInput) {
      routineTitleInput.value = currentRoutineTitle;
    }
    syncTitleFieldControls();
    renderRecentTitleChips();

    const isLandingActive = (skillsPerformed === maxSkills);

    const { totalDeduct, netScore } = JudgleRules.computeRoutine(currentDiscipline, skillsPerformed, skillDeductions, landingDeduction);
    const showThumbnails = currentInterface === 'recognizer' || currentInterface === 'swipe' || currentInterface === 'multitouch';

    document.getElementById('totalDeductDisplay').textContent = totalDeduct.toFixed(1);
    document.getElementById('netScoreDisplay').textContent = netScore.toFixed(1);

    updateReviewLogHeader();

    const listContainer = document.getElementById('reviewList');
    listContainer.innerHTML = '';

    skillDeductions.forEach((val, i) => {
      const isPerformed = i < skillsPerformed;
      const row = document.createElement('div');
      row.className = `review-row ${isPerformed ? '' : 'disabled-row'}`;

      const thumbUrl = skillThumbnails[i];
      const matchScore = skillMatchScores[i];
      const scoreStr = (matchScore !== null && matchScore !== undefined) ? `${matchScore}%` : '';
      const valColorClass = isPerformed ? getDeductionColorClass(val) : '';

      row.innerHTML = `
        <span class="sk-lbl">Skill ${i + 1} ${isPerformed ? '' : '<small>(Excl)</small>'}</span>
        ${showThumbnails ? `
          <div style="display:flex; align-items:center; gap:6px;">
            <div class="review-thumb-box">
              ${thumbUrl ? `<img src="${thumbUrl}" class="review-thumb-img" alt="S${i+1}">` : '<span class="review-thumb-empty">—</span>'}
            </div>
            <span class="review-score-tag">${scoreStr}</span>
          </div>
        ` : ''}
        <div class="value-controls-group">
          ${isPerformed ? `<button class="btn-step" onclick="stepSkillValue(${i}, -1)">−</button>` : ''}
          <span class="sk-val ${valColorClass}">${isPerformed ? `-${val.toFixed(1)}` : '—'}</span>
          ${isPerformed ? `<button class="btn-step" onclick="stepSkillValue(${i}, 1)">+</button>` : ''}
        </div>
      `;
      listContainer.appendChild(row);
    });

    const landingRow = document.createElement('div');
    landingRow.className = `review-row landing-row ${isLandingActive ? '' : 'disabled-row'}`;
    const landingScoreStr = (landingMatchScore !== null && landingMatchScore !== undefined) ? `${landingMatchScore}%` : '';
    const landingColorClass = isLandingActive ? getDeductionColorClass(landingDeduction) : '';

    landingRow.innerHTML = `
      <span class="sk-lbl">Landing ${isLandingActive ? '' : '<small>(Excl)</small>'}</span>
      ${showThumbnails ? `
        <div style="display:flex; align-items:center; gap:6px;">
          <div class="review-thumb-box">
            ${landingThumbnail ? `<img src="${landingThumbnail}" class="review-thumb-img" alt="Landing">` : '<span class="review-thumb-empty">—</span>'}
          </div>
          <span class="review-score-tag">${landingScoreStr}</span>
        </div>
      ` : ''}
      <div class="value-controls-group">
        ${isLandingActive ? `<button class="btn-step" onclick="stepLandingValue(-1)">−</button>` : ''}
        <span class="sk-val ${landingColorClass}">${isLandingActive ? `-${landingDeduction.toFixed(1)}` : '—'}</span>
        ${isLandingActive ? `<button class="btn-step" onclick="stepLandingValue(1)">+</button>` : ''}
      </div>
    `;
    listContainer.appendChild(landingRow);
  }

  function updateReviewLogHeader() {
    const totalLogs = routineLogHistory.length;
    const btnPrev = document.getElementById('btnNavPrev');
    const btnNext = document.getElementById('btnNavNext');
    const logTitle = document.getElementById('logNavTitle');

    if (totalLogs === 0) {
      logTitle.innerHTML = `<span>📋</span> Unsaved Routine (<span id="logNavDisc">${currentDiscipline}</span>)`;
      if (btnPrev) btnPrev.disabled = true;
      if (btnNext) btnNext.disabled = true;
      return;
    }

    if (currentViewingLogIndex >= 0 && currentViewingLogIndex < totalLogs) {
      const activeEntry = routineLogHistory[currentViewingLogIndex];
      const displayNum = activeEntry ? activeEntry.routineNum : (currentViewingLogIndex + 1);
      const disc = activeEntry ? activeEntry.discipline : currentDiscipline;

      logTitle.innerHTML = `<span>📋</span> Routine #${displayNum} of ${totalLogs} (${disc})`;
      if (btnPrev) btnPrev.disabled = (currentViewingLogIndex <= 0);
      if (btnNext) btnNext.disabled = (currentViewingLogIndex >= totalLogs - 1);
    } else {
      logTitle.innerHTML = `<span>📋</span> Unsaved Routine (<span id="logNavDisc">${currentDiscipline}</span>)`;
      if (btnPrev) btnPrev.disabled = (totalLogs === 0);
      if (btnNext) btnNext.disabled = true;
    }
  }

  function cycleLogEntry(delta) {
    if (phase !== 'review') return;
    saveCurrentReviewToLog();

    if (routineLogHistory.length === 0) return;

    let targetIndex = currentViewingLogIndex;
    if (targetIndex === -1) {
      targetIndex = routineLogHistory.length - 1;
    } else {
      targetIndex += delta;
    }

    if (targetIndex >= 0 && targetIndex < routineLogHistory.length) {
      loadLogEntryToReview(targetIndex, false);
      triggerFeedback('transition');
    }
  }

  function stepSkillValue(index, direction) {
    triggerFeedback('transition');
    let currentVal = skillDeductions[index];
    let sortedPreset = [...new Set(activeRoutineZones)].sort((a,b) => a - b);
    let matchIdx = sortedPreset.indexOf(currentVal);

    if (matchIdx !== -1) {
      let newIdx = Math.min(sortedPreset.length - 1, Math.max(0, matchIdx + direction));
      skillDeductions[index] = sortedPreset[newIdx];
    } else {
      let updated = Math.round((currentVal + (direction * 0.1)) * 10) / 10;
      skillDeductions[index] = Math.min(0.5, Math.max(0.0, updated));
    }
    renderReviewSummary();
  }

  function stepLandingValue(direction) {
    triggerFeedback('transition');
    let currentIdx = LANDING_PRESET.indexOf(landingDeduction);
    if (currentIdx === -1) {
      currentIdx = LANDING_PRESET.reduce((closest, val, idx) => 
        Math.abs(val - landingDeduction) < Math.abs(LANDING_PRESET[closest] - landingDeduction) ? idx : closest, 0);
    }

    let newIdx = Math.min(LANDING_PRESET.length - 1, Math.max(0, currentIdx + direction));
    landingDeduction = LANDING_PRESET[newIdx];

    renderReviewSummary();
  }

  /* ==========================================================================
     ROUTINE LOG HISTORY MANAGEMENT
     ========================================================================== */
  function updateLogBadges() {
    const countStr = routineLogHistory.length.toString();
    if (headerLogCountBadge) headerLogCountBadge.textContent = countStr;
    if (reviewLogCountBadge) reviewLogCountBadge.textContent = countStr;
  }

  function saveCurrentReviewToLog() {
    if (phase !== 'review') return;

    const maxSkills = getMaxSkills();
    const isLandingActive = (skillsPerformed === maxSkills);
    const { totalDeduct, netScore } = JudgleRules.computeRoutine(currentDiscipline, skillsPerformed, skillDeductions, landingDeduction);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const rawTitleInput = routineTitleInput ? routineTitleInput.value.trim() : currentRoutineTitle.trim();

    if (currentViewingLogIndex >= 0 && currentViewingLogIndex < routineLogHistory.length) {
      const existingEntry = routineLogHistory[currentViewingLogIndex];
      const finalTitle = rawTitleInput || `Routine #${existingEntry.routineNum}`;
      routineLogHistory[currentViewingLogIndex] = {
        ...existingEntry,
        title: finalTitle,
        discipline: currentDiscipline,
        skillsPerformed: skillsPerformed,
        maxSkills: maxSkills,
        skillDeductions: [...skillDeductions],
        skillThumbnails: [...skillThumbnails],
        skillMatchScores: [...skillMatchScores],
        landingDeduction: isLandingActive ? landingDeduction : 0.0,
        landingThumbnail: landingThumbnail,
        landingMatchScore: landingMatchScore,
        totalDeductions: totalDeduct,
        netScore: netScore
      };
    } else {
      const nextNum = getNextRoutineNumber();
      const finalTitle = rawTitleInput || `Routine #${nextNum}`;
      const logEntry = {
        routineNum: nextNum,
        title: finalTitle,
        time: timeStr,
        discipline: currentDiscipline,
        interface: currentInterface.toUpperCase(),
        skillsPerformed: skillsPerformed,
        maxSkills: maxSkills,
        skillDeductions: [...skillDeductions],
        skillThumbnails: [...skillThumbnails],
        skillMatchScores: [...skillMatchScores],
        landingDeduction: isLandingActive ? landingDeduction : 0.0,
        landingThumbnail: landingThumbnail,
        landingMatchScore: landingMatchScore,
        totalDeductions: totalDeduct,
        netScore: netScore
      };
      routineLogHistory.push(logEntry);
      currentViewingLogIndex = routineLogHistory.length - 1;
    }

    updateLogBadges();
    persistLogsToStorage();
  }

  function loadLogEntryToReview(logIndex, closeModal = true) {
    if (logIndex < 0 || logIndex >= routineLogHistory.length) return;

    const entry = routineLogHistory[logIndex];
    currentViewingLogIndex = logIndex;
    currentDiscipline = entry.discipline;
    skillsPerformed = entry.skillsPerformed;

    const rawSavedTitle = (entry.title || '').trim();
    currentRoutineTitle = /^Routine #\d+$/i.test(rawSavedTitle) ? '' : rawSavedTitle;

    const maxSkills = getMaxSkills();
    skillDeductions = new Array(maxSkills).fill(0);
    skillThumbnails = new Array(maxSkills).fill(null);
    skillMatchScores = new Array(maxSkills).fill(null);

    for (let i = 0; i < Math.min(maxSkills, entry.skillDeductions.length); i++) {
      skillDeductions[i] = entry.skillDeductions[i] || 0;
      if (entry.skillThumbnails) skillThumbnails[i] = entry.skillThumbnails[i] || null;
      if (entry.skillMatchScores) skillMatchScores[i] = entry.skillMatchScores[i] || null;
    }

    landingDeduction = entry.landingDeduction !== null ? entry.landingDeduction : 0.0;
    landingThumbnail = entry.landingThumbnail || null;
    landingMatchScore = entry.landingMatchScore || null;

    if (closeModal) {
      closeLogModal();
    }

    phase = 'review';
    releaseWakeLock();

    setupScreen.classList.add('hidden');
    gridScreen.classList.add('hidden');
    swipeScreen.classList.add('hidden');
    multiTouchScreen.classList.add('hidden');
    recognizerScreen.classList.add('hidden');
    reviewScreen.classList.remove('hidden');

    if (btnFinishRoutine) btnFinishRoutine.classList.add('hidden');
    if (btnHeaderLog) btnHeaderLog.classList.remove('hidden');

    phaseBadge.textContent = 'Review';
    phaseBadge.className = 'phase-badge badge-review';
    updateCounter();

    renderReviewSummary();
  }

  function openLogModal() {
    triggerFeedback('tap');
    if (phase === 'review') {
      saveCurrentReviewToLog();
    }
    renderLogList();
    logModal.classList.remove('hidden');
  }

  function closeLogModal() {
    logModal.classList.add('hidden');
  }

  function escapeHtml(str) { return JudgleUtils.escapeHtml(str); }

  function renderLogList() {
    logListContainer.innerHTML = '';

    if (routineLogHistory.length === 0) {
      logListContainer.innerHTML = `<div class="log-empty-msg">No completed routines recorded yet.</div>`;
      return;
    }

    [...routineLogHistory].reverse().forEach((entry, reverseIdx) => {
      const actualIndex = routineLogHistory.length - 1 - reverseIdx;
      const card = document.createElement('div');
      card.className = 'log-entry-card';
      card.onclick = () => loadLogEntryToReview(actualIndex, true);

      const defaultTitle = `Routine #${entry.routineNum}`;
      const displayTitle = escapeHtml(entry.title || defaultTitle);
      const hasCustomTitle = entry.title && entry.title.trim() !== defaultTitle;

      let breakdownStr = entry.skillDeductions.slice(0, entry.skillsPerformed).map((d, idx) => `S${idx+1}: -${d.toFixed(1)}`).join(' | ');
      if (entry.skillsPerformed === entry.maxSkills && entry.landingDeduction !== null) {
        breakdownStr += ` | L: -${entry.landingDeduction.toFixed(1)}`;
      }

      card.innerHTML = `
        <div class="log-entry-header">
          <div class="log-num-badge">
            <span>${displayTitle}</span>
            ${hasCustomTitle ? `<span class="log-sub-num">#${entry.routineNum}</span>` : ''}
            <span class="log-disc-tag">${entry.discipline}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <span class="log-time">🕒 ${entry.time}</span>
            <button class="btn-delete-log" onclick="deleteLogEntry(event, ${actualIndex})" title="Delete routine">🗑️</button>
          </div>
        </div>
        <div class="log-score-row">
          <div>
            <div style="font-size:0.65rem; color:var(--text-sub); text-transform:uppercase;">Net Score</div>
            <div class="log-score-val">${entry.netScore.toFixed(1)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.65rem; color:var(--text-sub); text-transform:uppercase;">Total Deductions</div>
            <div class="log-deduct-val">-${entry.totalDeductions.toFixed(1)}</div>
          </div>
        </div>
        <div class="log-breakdown">${breakdownStr}</div>
        <div class="log-card-footer">
          <span class="btn-load-log">Load into Review ➔</span>
        </div>
      `;
      logListContainer.appendChild(card);
    });
  }

  function deleteLogEntry(event, index) {
    if (event) event.stopPropagation();

    if (index < 0 || index >= routineLogHistory.length) return;

    const removedLabel = routineLogHistory[index].title || `Routine #${routineLogHistory[index].routineNum}`;
    routineLogHistory.splice(index, 1);

    if (currentViewingLogIndex === index) {
      currentViewingLogIndex = -1;
    } else if (currentViewingLogIndex > index) {
      currentViewingLogIndex--;
    }

    updateLogBadges();
    persistLogsToStorage();
    renderLogList();

    if (phase === 'review') {
      renderReviewSummary();
    }

    triggerFeedback('transition');
    showUndoToast(`${removedLabel} deleted`);
  }

  function clearLogHistory() {
    if (routineLogHistory.length === 0) return;
    if (confirm("Are you sure you want to clear all routine logs?")) {
      routineLogHistory = [];
      routineCounter = 1;
      currentViewingLogIndex = -1;
      updateLogBadges();
      persistLogsToStorage();
      renderLogList();
      if (phase === 'review') {
        renderReviewSummary();
      }
      triggerFeedback('transition');
      showUndoToast("Log Cleared");
    }
  }

  function exportLogCSV() {
    if (phase === 'review') {
      saveCurrentReviewToLog();
    }

    if (routineLogHistory.length === 0) {
      alert("No routine log entries available to export.");
      return;
    }

    let csvContent = "Routine #,Title,Time,Discipline,Interface,Skills Performed,Max Skills,Total Deductions,Net Score,Deduction Breakdown\n";

    routineLogHistory.forEach(entry => {
      let breakdownStr = entry.skillDeductions.slice(0, entry.skillsPerformed).map((d, idx) => `S${idx+1}:-${d.toFixed(1)}`).join(' ');
      if (entry.skillsPerformed === entry.maxSkills && entry.landingDeduction !== null) {
        breakdownStr += ` L:-${entry.landingDeduction.toFixed(1)}`;
      }

      const safeTitle = (entry.title || `Routine #${entry.routineNum}`).replace(/"/g, '""');

      const row = [
        entry.routineNum,
        `"${safeTitle}"`,
        `"${entry.time}"`,
        entry.discipline,
        entry.interface,
        entry.skillsPerformed,
        entry.maxSkills,
        entry.totalDeductions.toFixed(1),
        entry.netScore.toFixed(1),
        `"${breakdownStr}"`
      ];

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `judgle_routine_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerFeedback('complete');
  }

  function resetToSetup() {
    if (phase === 'review') {
      saveCurrentReviewToLog();
    }

    phase = 'setup';
    releaseWakeLock();

    currentViewingLogIndex = -1;
    const maxSkills = getMaxSkills();
    skillsPerformed = maxSkills;
    clearPendingRecognizerState();
    closeTemplateTrainer();
    closeLogModal();
    setupScreen.classList.remove('hidden');
    gridScreen.classList.add('hidden');
    swipeScreen.classList.add('hidden');
    multiTouchScreen.classList.add('hidden');
    recognizerScreen.classList.add('hidden');
    reviewScreen.classList.add('hidden');
    if (btnFinishRoutine) btnFinishRoutine.classList.add('hidden');
    if (btnHeaderLog) btnHeaderLog.classList.remove('hidden');
    if (skillCounter) skillCounter.classList.add('hidden');
    phaseBadge.textContent = 'Setup';
    phaseBadge.className = 'phase-badge badge-routine';
    skillCounter.textContent = `Skill 1 / ${maxSkills}`;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // Restore saved custom digit patterns and routine history logs on startup
  loadLogsFromStorage();
