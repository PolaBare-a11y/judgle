  /* ==========================================================================
     COLOUR SCHEME MANAGEMENT (DEFAULT WGYM VS MONOCHROMATIC)
     ========================================================================== */
    let currentColorScheme = 'default';

  function setColorScheme(scheme, persist = true) {
    // scheme: 'default' (dark) | 'mono' | 'light'. Burned-in exports only use dark or mono palettes.
    const mode = (scheme === 'mono' || scheme === 'light') ? scheme : 'default';
    currentColorScheme = (mode === 'mono') ? 'mono' : 'default';
    JudgleTheme.set(mode === 'default' ? 'dark' : mode, persist);
    [['themeDefaultCard', 'default'], ['themeMonoCard', 'mono'], ['themeLightCard', 'light']].forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('selected', mode === key);
    });
  }

  function loadSavedColorScheme() {
    const t = JudgleTheme.get();
    setColorScheme(t === 'dark' ? 'default' : t, false);
  }

  function getThemeCanvasColors() {
    if (currentColorScheme === 'mono') {
      return {
        bgDark: '#09090b',
        cardBg: 'rgba(20, 20, 23, 0.85)',
        blue: '#d4d4dc',
        purple: '#8e8e9e',
        pink: '#b0b0be',
        green: '#f2f2f7',
        orange: '#ffffff',
        red: '#9e9eae',
        border: '#2b2b33',
        textSub: '#8e8e98',
        strokeDraw: '#ffffff',
        strokeTrain: '#f2f2f7'
      };
    }
    return {
      bgDark: '#0a0a0f',
      cardBg: 'rgba(20, 20, 31, 0.85)',
      blue: '#4495e5',
      purple: '#7d5fb3',
      pink: '#dc5183',
      green: '#9bd98b',
      orange: '#e68a00',
      red: '#f44336',
      border: '#2c2940',
      textSub: '#8a8a9e',
      strokeDraw: '#e68a00',
      strokeTrain: '#9bd98b'
    };
  }

  loadSavedColorScheme();

  /* ==========================================================================
     INTRO SLATE (TITLE CARD) & BOTTOM-LEFT FAINT WATERMARK PERSISTENCE
     ========================================================================== */
  const BRANDING_STORAGE_KEY = JudgleStorage.KEYS.branding;
  let brandingState = {
    slateEnabled: false,
    slateTitle: '',
    slateSubtitle: '',
    slateDurationSec: 3,
    endSlateEnabled: true,
    endSlateDurationSec: 4,
    watermarkText: '',
    sliceSkillsEnabled: false
  };

  function loadSavedBrandingSettings() {
    try {
      const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          brandingState.slateEnabled = Boolean(parsed.slateEnabled);
          brandingState.slateTitle = String(parsed.slateTitle || '');
          brandingState.slateSubtitle = String(parsed.slateSubtitle || '');
          brandingState.slateDurationSec = [2, 3, 4, 5].includes(Number(parsed.slateDurationSec))
            ? Number(parsed.slateDurationSec)
            : 3;
          brandingState.endSlateEnabled = (parsed.endSlateEnabled !== undefined)
            ? Boolean(parsed.endSlateEnabled)
            : true;
          brandingState.endSlateDurationSec = [3, 4, 5, 6].includes(Number(parsed.endSlateDurationSec))
            ? Number(parsed.endSlateDurationSec)
            : 4;
          brandingState.watermarkText = String(parsed.watermarkText || '');
          brandingState.sliceSkillsEnabled = Boolean(parsed.sliceSkillsEnabled);
        }
      }
    } catch (e) {}
    applyBrandingStateToInputs();
  }

  function handleSliceSkillsSettingChange(checked) {
    brandingState.sliceSkillsEnabled = Boolean(checked);
    const modalCb = document.getElementById('modalSliceSkillsCheckbox');
    const batchCb = document.getElementById('batchSliceSkillsCheckbox');
    if (modalCb) modalCb.checked = brandingState.sliceSkillsEnabled;
    if (batchCb) batchCb.checked = brandingState.sliceSkillsEnabled;
    persistBrandingSettings();
  }

  function persistBrandingSettings() {
    try {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(brandingState));
    } catch (e) {}
  }

  function applyBrandingStateToInputs() {
    const enabledEl    = document.getElementById('introSlateEnabledCheckbox');
    const titleEl      = document.getElementById('introSlateTitleInput');
    const subEl        = document.getElementById('introSlateSubtitleInput');
    const endEnabledEl = document.getElementById('endSlateEnabledCheckbox');
    const wmEl         = document.getElementById('watermarkTextInput');
    const modalSliceEl = document.getElementById('modalSliceSkillsCheckbox');
    const batchSliceEl = document.getElementById('batchSliceSkillsCheckbox');

    if (enabledEl) enabledEl.checked = brandingState.slateEnabled;
    if (titleEl) titleEl.value = brandingState.slateTitle;
    if (subEl) subEl.value = brandingState.slateSubtitle;
    if (endEnabledEl) endEnabledEl.checked = brandingState.endSlateEnabled;
    if (wmEl) wmEl.value = brandingState.watermarkText;
    if (modalSliceEl) modalSliceEl.checked = brandingState.sliceSkillsEnabled;
    if (batchSliceEl) batchSliceEl.checked = brandingState.sliceSkillsEnabled;

    const pills = document.querySelectorAll('#slateDurationPills .duration-pill-btn');
    pills.forEach(btn => {
      const sec = Number(btn.getAttribute('data-sec'));
      btn.classList.toggle('selected', sec === brandingState.slateDurationSec);
    });

    const endPills = document.querySelectorAll('#endSlateDurationPills .duration-pill-btn');
    endPills.forEach(btn => {
      const sec = Number(btn.getAttribute('data-sec'));
      btn.classList.toggle('selected', sec === brandingState.endSlateDurationSec);
    });
  }

  function handleBrandingSettingsChange() {
    const enabledEl    = document.getElementById('introSlateEnabledCheckbox');
    const titleEl      = document.getElementById('introSlateTitleInput');
    const subEl        = document.getElementById('introSlateSubtitleInput');
    const endEnabledEl = document.getElementById('endSlateEnabledCheckbox');
    const wmEl         = document.getElementById('watermarkTextInput');

    const prevTitle = brandingState.slateTitle;
    const prevSub   = brandingState.slateSubtitle;

    brandingState.slateTitle    = titleEl ? titleEl.value : '';
    brandingState.slateSubtitle = subEl ? subEl.value : '';
    brandingState.watermarkText = wmEl ? wmEl.value : '';

    if (enabledEl) {
      const hadNoText = !prevTitle.trim() && !prevSub.trim();
      const hasNewText = Boolean(brandingState.slateTitle.trim() || brandingState.slateSubtitle.trim());
      if (hadNoText && hasNewText && !enabledEl.checked) {
        enabledEl.checked = true;
      }
      brandingState.slateEnabled = enabledEl.checked;
    }

    if (endEnabledEl) {
      brandingState.endSlateEnabled = endEnabledEl.checked;
    }

    persistBrandingSettings();
  }

  function setIntroSlateDuration(sec) {
    brandingState.slateDurationSec = sec;
    applyBrandingStateToInputs();
    persistBrandingSettings();
  }

  function setEndSlateDuration(sec) {
    brandingState.endSlateDurationSec = sec;
    applyBrandingStateToInputs();
    persistBrandingSettings();
  }

  function syncModalSlateToSetup() {
    const mEnabled    = document.getElementById('modalSlateEnabledCheckbox');
    const mTitle      = document.getElementById('modalSlateTitleInput');
    const mSub        = document.getElementById('modalSlateSubtitleInput');
    const mEndEnabled = document.getElementById('modalEndSlateEnabledCheckbox');

    if (mEnabled) brandingState.slateEnabled = mEnabled.checked;
    if (mTitle) brandingState.slateTitle = mTitle.value;
    if (mSub) brandingState.slateSubtitle = mSub.value;
    if (mEndEnabled) brandingState.endSlateEnabled = mEndEnabled.checked;

    applyBrandingStateToInputs();
    persistBrandingSettings();
  }

  function isIntroSlateActive(slateConfig = brandingState) {
    return slateConfig.slateEnabled && Boolean((slateConfig.slateTitle || '').trim() || (slateConfig.slateSubtitle || '').trim());
  }

  function isEndSlateActive(slateConfig = brandingState) {
    return Boolean(slateConfig.endSlateEnabled);
  }

  function getDisciplineFullName(disc) {
    return JudgleRules.fullName(disc);
  }

  loadSavedBrandingSettings();

  /* Handwriting recogniser + trainer are shared: js/judgle-recognizer.js, js/judgle-trainer.js */
  const { Point, PDollarPointSet } = JudgleRecognizer;
  const dollarRecognizer = JudgleRecognizer.shared;

  /* ==========================================================================
     BOUNDING-BOX THUMBNAIL CROPPING HELPER
     ========================================================================== */
  function getCroppedThumbnailFromPoints(points, sourceCanvas, padding = 20) {
    if (!points || points.length === 0 || !sourceCanvas) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    let w = maxX - minX;
    let h = maxY - minY;
    if (w < 10) { minX -= 15; maxX += 15; }
    if (h < 10) { minY -= 15; maxY += 15; }

    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(sourceCanvas.width, maxX + padding);
    maxY = Math.min(sourceCanvas.height, maxY + padding);

    const cropW = Math.max(1, maxX - minX);
    const cropH = Math.max(1, maxY - minY);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = '#DCE0DC';
    tempCtx.fillRect(0, 0, cropW, cropH);

    tempCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    return tempCanvas.toDataURL('image/png');
  }

  function escapeHtml(str) { return JudgleUtils.escapeHtml(str); }

  /* ==========================================================================
     APP STATE & CONFIGURATION
     ========================================================================== */
  const DISCIPLINE_SKILLS = JudgleRules.SKILL_COUNTS;
  const LANDING_DEDUCTION_SCALE = JudgleRules.LANDING_SCALE;
  const RECOGNIZER_DEBOUNCE_MS = 400;

  const SKILL_FAULT_PRESETS = [
    'Shape',
    'Opening',
    'Keeping',
    'Legs',
    'Arms',
    'Twist'
  ];

  const LANDING_FAULT_PRESETS = [
    'Step',
    'Arm',
    'Body',
    'Touch',
    'Fall'
  ];

  let currentDiscipline = 'TRP';
  let videoObjectUrl = null;
  let loadedVideoBaseName = '';
  let currentInterface = 'swipe';
  let phase = 'setup';

  let currentSkillIndex = 0;
  let skillDeductions = new Array(10).fill(0);
  let skillTimestamps = new Array(10).fill(0);
  let skillThumbnails = new Array(10).fill(null);
  let skillMatchScores = new Array(10).fill(null);
  let skillDDs = new Array(10).fill('');
  let skillFaults = Array.from({ length: 10 }, () => []);

  let landingDeduction = 0;
  let landingTimestamp = 0;
  let landingThumbnail = null;
  let landingMatchScore = null;
  let landingFaults = [];

  let skillsPerformed = 10;

  // Batch Processing Queue State
  let batchQueue = [];

  // DOM Elements
  const setupScreen          = document.getElementById('setupScreen');
  const judgingStage         = document.getElementById('judgingStage');
  const reviewScreen         = document.getElementById('reviewScreen');
  const playbackOverlayStage = document.getElementById('playbackOverlayStage');

  const judgingVideo         = document.getElementById('judgingVideo');
  const playbackVideo        = document.getElementById('playbackVideo');
  const gestureOverlayCanvas = document.getElementById('gestureOverlayCanvas');
  const overlayCtx           = gestureOverlayCanvas ? gestureOverlayCanvas.getContext('2d') : null;

  const phaseBadge           = document.getElementById('phaseBadge');
  const skillCounter         = document.getElementById('skillCounter');
  const btnFinishRoutine     = document.getElementById('btnFinishRoutine');

  /* ==========================================================================
     AUDIO SYNTHESIS FEEDBACK
     ========================================================================== */
  /* Audio + haptic feedback is shared: js/judgle-utils.js */
  function triggerFeedback(type = 'tap') { JudgleFeedback.trigger(type); }

  function getMaxSkills(disc = currentDiscipline) { return DISCIPLINE_SKILLS[disc] || 10; }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00.0";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  }

  function getDeductionBadgeColor(deductionVal) {
    return 'var(--fig-' + JudgleRules.severity(deductionVal) + ')';
  }

  function getDeductionHexColor(deductionVal) {
    return getThemeCanvasColors()[JudgleRules.severity(deductionVal)];
  }

  function computeRoutineScores(disc, performedCount, skillDeductArr, landDeduct) {
    const r = JudgleRules.computeRoutine(disc, performedCount, skillDeductArr, landDeduct);
    return { totalDeduct: r.totalDeduct, netScore: r.netScore };
  }

  function isObjectUrlInBatchQueue(url) {
    return Boolean(url) && batchQueue.some(item => item.videoObjectUrl === url);
  }

  /* ==========================================================================
     VIDEO FILE LOADING
     ========================================================================== */
  function handleVideoFileSelected(event) {
    const file = event.target.files[0];
    if (file) {
      if (videoObjectUrl && !isObjectUrlInBatchQueue(videoObjectUrl)) {
        URL.revokeObjectURL(videoObjectUrl);
      }
      videoObjectUrl = URL.createObjectURL(file);
      loadedVideoBaseName = file.name.replace(/\.[^/.]+$/, '');
      judgingVideo.src = videoObjectUrl;
      playbackVideo.src = videoObjectUrl;

      const badge = document.getElementById('selectedVideoName');
      badge.textContent = `✓ Loaded: ${file.name}`;
      badge.classList.remove('hidden');
    }
  }

  function selectDiscipline(discKey, el) {
    currentDiscipline = discKey;
    document.getElementById('discTrpCard').classList.remove('selected');
    document.getElementById('discDmtCard').classList.remove('selected');
    document.getElementById('discTumCard').classList.remove('selected');
    el.classList.add('selected');
  }

  /* ==========================================================================
     BATCH QUEUE MANAGEMENT (ADD, EDIT FILENAME, REMOVE, CLEAR)
     ========================================================================== */
  function addCurrentRoutineToBatchQueue() {
    if (!videoObjectUrl) {
      alert("No routine video loaded to add to queue.");
      return;
    }

    const maxSkills = getMaxSkills(currentDiscipline);
    const { totalDeduct, netScore } = computeRoutineScores(
      currentDiscipline,
      skillsPerformed,
      skillDeductions,
      landingDeduction
    );

    const queueNum = batchQueue.length + 1;
    const basePrefix = loadedVideoBaseName
      ? `${loadedVideoBaseName}_`
      : `Routine_${queueNum}_`;
    const defaultOutputName = `${basePrefix}${currentDiscipline}`;

    batchQueue.push({
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      videoObjectUrl: videoObjectUrl,
      rawVideoBaseName: loadedVideoBaseName || `Routine_${queueNum}`,
      outputBaseName: defaultOutputName,
      discipline: currentDiscipline,
      skillsPerformed: skillsPerformed,
      skillDeductions: skillDeductions.slice(0, maxSkills),
      skillTimestamps: skillTimestamps.slice(0, maxSkills),
      skillDDs: skillDDs.slice(0, maxSkills),
      skillFaults: skillFaults.slice(0, maxSkills).map(arr => [...arr]),
      landingDeduction: landingDeduction,
      landingTimestamp: landingTimestamp,
      landingFaults: [...landingFaults],
      totalDeduct: totalDeduct,
      netScore: netScore,
      slateEnabled: brandingState.slateEnabled,
      slateTitle: brandingState.slateTitle,
      slateSubtitle: brandingState.slateSubtitle,
      slateDurationSec: brandingState.slateDurationSec,
      endSlateEnabled: brandingState.endSlateEnabled,
      endSlateDurationSec: brandingState.endSlateDurationSec,
      watermarkText: brandingState.watermarkText
    });

    videoObjectUrl = null;
    loadedVideoBaseName = '';
    const fileInput = document.getElementById('videoFileInput');
    if (fileInput) fileInput.value = '';
    const badge = document.getElementById('selectedVideoName');
    if (badge) {
      badge.textContent = 'No File Loaded';
      badge.classList.add('hidden');
    }

    renderBatchQueueCard();
    triggerFeedback('complete');
    resetToSetup();
    if (setupScreen) setupScreen.scrollTop = 0;
  }

  function updateBatchQueueItemName(index, newVal) {
    if (!batchQueue[index]) return;
    batchQueue[index].outputBaseName = String(newVal || '');
  }

  function removeBatchQueueItem(index) {
    const removed = batchQueue[index];
    if (!removed) return;
    batchQueue.splice(index, 1);

    if (
      removed.videoObjectUrl &&
      removed.videoObjectUrl !== videoObjectUrl &&
      !isObjectUrlInBatchQueue(removed.videoObjectUrl) &&
      !isObjectUrlInBatchSync(removed.videoObjectUrl)
    ) {
      URL.revokeObjectURL(removed.videoObjectUrl);
    }

    renderBatchQueueCard();
    triggerFeedback('tap');
  }

  function clearBatchQueue() {
    if (batchQueue.length === 0) return;
    if (!confirm(`Remove all ${batchQueue.length} routine(s) from the batch queue?`)) return;

    const urlsToCheck = batchQueue.map(item => item.videoObjectUrl);
    batchQueue = [];

    urlsToCheck.forEach(url => {
      if (url && url !== videoObjectUrl && !isObjectUrlInBatchQueue(url) && !isObjectUrlInBatchSync(url)) {
        URL.revokeObjectURL(url);
      }
    });

    renderBatchQueueCard();
    triggerFeedback('tap');
  }

  function renderBatchQueueCard() {
    const cardEl = document.getElementById('batchQueueCard');
    const countEl = document.getElementById('batchQueueCountLabel');
    const listEl = document.getElementById('batchQueueList');
    const bsStdBtn = document.getElementById('bsBtnExportStandard');
    const bsTrnBtn = document.getElementById('bsBtnExportTraining');

    if (bsStdBtn) {
      bsStdBtn.disabled = batchQueue.length === 0;
      bsStdBtn.textContent = `🎬 Bulk Export MP4s (${batchQueue.length})`;
    }
    if (bsTrnBtn) {
      bsTrnBtn.disabled = batchQueue.length === 0;
      bsTrnBtn.textContent = `🎓 Bulk Training MP4s (${batchQueue.length})`;
    }

    if (!cardEl || !countEl || !listEl) return;

    if (batchQueue.length === 0) {
      cardEl.classList.add('hidden');
      listEl.innerHTML = '';
      return;
    }

    cardEl.classList.remove('hidden');
    countEl.textContent = String(batchQueue.length);
    listEl.innerHTML = '';

    batchQueue.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'batch-queue-item';
      row.innerHTML = `
        <span class="batch-item-index">#${idx + 1}</span>
        <div class="batch-item-meta">
          <span class="batch-item-disc">${escapeHtml(item.discipline)} (${item.skillsPerformed} sk)</span>
          <span class="batch-item-score">E: ${item.netScore.toFixed(1)}</span>
        </div>
        <input type="text" class="batch-item-name-input" value="${escapeHtml(item.outputBaseName)}" placeholder="Output filename" oninput="updateBatchQueueItemName(${idx}, this.value)">
        <button type="button" class="btn-remove-queue-item" title="Remove from queue" onclick="removeBatchQueueItem(${idx})">✕</button>
      `;
      listEl.appendChild(row);
    });
  }

  /* ==========================================================================
     LIVE VIDEO JUDGING PHASE
     ========================================================================== */
  function startVideoJudging(mode) {
    if (!videoObjectUrl) {
      alert("Please select a video file first.");
      return;
    }

    clearPendingRecognizerState();
    currentInterface = mode;
    const maxSkills = getMaxSkills();
    phase = 'routine';
    currentSkillIndex = 0;
    skillDeductions = new Array(maxSkills).fill(0);
    skillTimestamps = new Array(maxSkills).fill(0);
    skillThumbnails = new Array(maxSkills).fill(null);
    skillMatchScores = new Array(maxSkills).fill(null);
    skillDDs = new Array(maxSkills).fill('');
    skillFaults = Array.from({ length: maxSkills }, () => []);

    landingDeduction = 0;
    landingTimestamp = 0;
    landingThumbnail = null;
    landingMatchScore = null;
    landingFaults = [];
    skillsPerformed = maxSkills;

    setupScreen.classList.add('hidden');
    reviewScreen.classList.add('hidden');
    playbackOverlayStage.classList.add('hidden');
    judgingStage.classList.remove('hidden');
    btnFinishRoutine.classList.remove('hidden');
    skillCounter.classList.remove('hidden');

    phaseBadge.textContent = 'Live Video';
    phaseBadge.className = 'phase-badge badge-routine';
    updateCounter();

    initCanvasOverlaySize();

    if (gestureOverlayCanvas) {
      gestureOverlayCanvas.style.pointerEvents = (mode === 'keyboard') ? 'none' : 'auto';
    }

    judgingVideo.currentTime = 0;
    judgingVideo.play().catch(() => {});
    document.getElementById('playPauseIcon').textContent = '⏸️';

    updateLiveHud(0.0, mode === 'keyboard' ? "Type 0–5 (Landing: 0–3, 5, 9)" : "Ready for input");
  }

  function initCanvasOverlaySize() {
    if (!gestureOverlayCanvas || !judgingStage) return;
    gestureOverlayCanvas.width = judgingStage.offsetWidth;
    gestureOverlayCanvas.height = judgingStage.offsetHeight;
  }

  window.addEventListener('resize', () => {
    initCanvasOverlaySize();
    initTrainerCanvas();
  });

  function togglePlayPauseLiveVideo() {
    if (judgingVideo.paused) {
      judgingVideo.play();
      document.getElementById('playPauseIcon').textContent = '⏸️';
    } else {
      judgingVideo.pause();
      document.getElementById('playPauseIcon').textContent = '▶';
    }
  }

  function restartLiveVideo() {
    clearPendingRecognizerState();
    judgingVideo.currentTime = 0;
    judgingVideo.play();
    document.getElementById('playPauseIcon').textContent = '⏸️';
  }

  function updateCounter() {
    const maxSkills = getMaxSkills();
    if (phase === 'routine') {
      skillCounter.classList.remove('hidden');
      skillCounter.textContent = `Skill ${currentSkillIndex + 1} / ${maxSkills}`;
    } else if (phase === 'landing') {
      skillCounter.classList.remove('hidden');
      skillCounter.textContent = `Landing Deduction`;
    } else {
      skillCounter.classList.add('hidden');
    }
  }

  function updateLiveHud(val, actionName = '') {
    const maxSkills = getMaxSkills();
    const lbl = (phase === 'landing') ? 'Landing' : `Skill ${currentSkillIndex + 1} / ${maxSkills}`;
    document.getElementById('hudSkillLabel').textContent = lbl;
    document.getElementById('hudDeductVal').textContent = `-${val.toFixed(1)}`;
    document.getElementById('hudTimeVal').textContent = formatTime(judgingVideo.currentTime);
  }

  function recordLiveDeduction(val, actionLabel = '', thumbData = null, matchScore = null, exactTimestamp = null) {
    const currentTime = (exactTimestamp !== null) ? exactTimestamp : judgingVideo.currentTime;
    const maxSkills = getMaxSkills();

    if (phase === 'routine') {
      triggerFeedback('tap');
      skillDeductions[currentSkillIndex] = val;
      skillTimestamps[currentSkillIndex] = currentTime;
      if (thumbData) skillThumbnails[currentSkillIndex] = thumbData;
      if (matchScore !== null) skillMatchScores[currentSkillIndex] = matchScore;

      currentSkillIndex++;

      if (currentSkillIndex >= maxSkills) {
        phase = 'landing';
        phaseBadge.textContent = 'Landing';
        phaseBadge.className = 'phase-badge badge-landing';
        triggerFeedback('landing');
      }
      updateCounter();
      updateLiveHud(val, actionLabel);

    } else if (phase === 'landing') {
      landingDeduction = val;
      landingTimestamp = currentTime;
      if (thumbData) landingThumbnail = thumbData;
      if (matchScore !== null) landingMatchScore = matchScore;

      judgingVideo.pause();
      enterReviewPhase();
    }
  }

  function finishRoutineEarly() {
    clearPendingRecognizerState();
    judgingVideo.pause();
    skillsPerformed = currentSkillIndex;
    enterReviewPhase();
  }

  /* ==========================================================================
     GESTURE RECOGNITION (SWIPE & DEBOUNCED MULTI-STROKE RECOGNITION FOR SKILLS & LANDING)
     ========================================================================== */
  let pointerPoints = [];
  let isPointerDown = false;
  let recognizerTimer = null;
  let accumulatedRecPoints = [];
  let currentStrokeId = 0;
  let gestureStartTime = 0;

  function clearPendingRecognizerState() {
    if (recognizerTimer) {
      clearTimeout(recognizerTimer);
      recognizerTimer = null;
    }
    accumulatedRecPoints = [];
    currentStrokeId = 0;
    pointerPoints = [];
    isPointerDown = false;
    if (overlayCtx && gestureOverlayCanvas) {
      overlayCtx.clearRect(0, 0, gestureOverlayCanvas.width, gestureOverlayCanvas.height);
    }
  }

  function scheduleRecognizerEvaluation() {
    if (recognizerTimer) {
      clearTimeout(recognizerTimer);
      recognizerTimer = null;
    }
    recognizerTimer = setTimeout(() => {
      recognizerTimer = null;
      if (phase !== 'routine' && phase !== 'landing') {
        accumulatedRecPoints = [];
        currentStrokeId = 0;
        return;
      }
      const pointsToProcess = [...accumulatedRecPoints];
      const capturedStartTime = gestureStartTime;
      const croppedThumb = getCroppedThumbnailFromPoints(pointsToProcess, gestureOverlayCanvas);
      if (overlayCtx) overlayCtx.clearRect(0, 0, gestureOverlayCanvas.width, gestureOverlayCanvas.height);
      accumulatedRecPoints = [];
      currentStrokeId = 0;
      processNumberRecognitionPoints(pointsToProcess, croppedThumb, capturedStartTime);
    }, RECOGNIZER_DEBOUNCE_MS);
  }

  if (gestureOverlayCanvas) {
    gestureOverlayCanvas.addEventListener('pointerdown', (e) => {
      if (phase !== 'routine' && phase !== 'landing') return;
      e.preventDefault();
      try { gestureOverlayCanvas.setPointerCapture(e.pointerId); } catch(err) {}

      isPointerDown = true;
      const rect = gestureOverlayCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (currentInterface === 'swipe') {
        pointerPoints = [{ x: e.clientX, y: e.clientY, t: Date.now() }];
        gestureStartTime = judgingVideo.currentTime;
      } else {
        if (recognizerTimer) {
          clearTimeout(recognizerTimer);
          recognizerTimer = null;
        }
        if (accumulatedRecPoints.length === 0) {
          gestureStartTime = judgingVideo.currentTime;
        }
        currentStrokeId++;
        accumulatedRecPoints.push(new Point(x, y, currentStrokeId));
      }

      if (overlayCtx) {
        if (currentInterface === 'swipe') {
          overlayCtx.clearRect(0, 0, gestureOverlayCanvas.width, gestureOverlayCanvas.height);
        }
        overlayCtx.beginPath();
        overlayCtx.moveTo(x, y);
        overlayCtx.strokeStyle = getThemeCanvasColors().strokeDraw;
        overlayCtx.lineWidth = 8;
        overlayCtx.lineCap = 'round';
        overlayCtx.lineJoin = 'round';
      }
    });

    gestureOverlayCanvas.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      e.preventDefault();
      const rect = gestureOverlayCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (currentInterface === 'swipe') {
        pointerPoints.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      } else {
        accumulatedRecPoints.push(new Point(x, y, currentStrokeId));
      }

      if (overlayCtx) {
        overlayCtx.lineTo(x, y);
        overlayCtx.stroke();
      }
    });

    const handleGesturePointerEnd = (e) => {
      if (!isPointerDown) return;
      e.preventDefault();
      isPointerDown = false;
      try { gestureOverlayCanvas.releasePointerCapture(e.pointerId); } catch(err) {}

      if (currentInterface === 'swipe') {
        const croppedThumb = getCroppedThumbnailFromPoints(pointerPoints, gestureOverlayCanvas);
        if (overlayCtx) overlayCtx.clearRect(0, 0, gestureOverlayCanvas.width, gestureOverlayCanvas.height);
        processSwipePoints(pointerPoints, croppedThumb, gestureStartTime);
      } else {
        scheduleRecognizerEvaluation();
      }
    };

    gestureOverlayCanvas.addEventListener('pointerup', handleGesturePointerEnd);
    gestureOverlayCanvas.addEventListener('pointercancel', handleGesturePointerEnd);
  }

  function handleLiveKeyboardDeduction(event) {
    if (currentInterface !== 'keyboard') return;
    if (phase !== 'routine' && phase !== 'landing') return;
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') return;

    let digit = null;
    if (/^Numpad([0-9])$/.test(event.code)) {
      digit = event.code.replace('Numpad', '');
    } else if (/^Digit([0-9])$/.test(event.code)) {
      digit = event.code.replace('Digit', '');
    } else if (/^[0-9]$/.test(event.key)) {
      digit = event.key;
    }

    if (digit === null) return;

    const isLanding = (phase === 'landing');
    const val = JudgleRules.keyboardValue(digit, isLanding);
    if (val === null) {
      if (isLanding && digit === '4') event.preventDefault();
      return;
    }
    event.preventDefault();
    recordLiveDeduction(val, `Key ${digit} (-${val.toFixed(1)})`, null, null, judgingVideo ? judgingVideo.currentTime : 0);
  }

  document.addEventListener('keydown', handleLiveKeyboardDeduction);

  function processSwipePoints(points, thumbData, exactTime) {
    const dir = JudgleGestures.classifySwipe(points);
    if (!dir) return;
    const val = JudgleRules.swipeValue(dir, phase === 'landing');
    recordLiveDeduction(val, `${JudgleRules.SWIPE_LABELS[dir]} (${val.toFixed(1)})`, thumbData, null, exactTime);
  }

  function processNumberRecognitionPoints(points, thumbData, exactTime) {
    if (!points || points.length < 3) return;
    const result = dollarRecognizer.Recognize(points);
    const digit = result ? result.Name : "0";
    const matchScore = result ? Math.round(result.Score * 100) : null;
    const val = JudgleRules.digitValue(digit, phase === 'landing');
    recordLiveDeduction(val === null ? 0.0 : val, `Digit "${digit}"`, thumbData, matchScore, exactTime);
  }

  /* ==========================================================================
     REVIEW SCREEN & CHECKPOINT (WITH QUICK-TAP FAULT PILLS)
     ========================================================================== */
  function enterReviewPhase() {
    clearPendingRecognizerState();
    phase = 'review';
    judgingStage.classList.add('hidden');
    playbackOverlayStage.classList.add('hidden');
    reviewScreen.classList.remove('hidden');
    btnFinishRoutine.classList.add('hidden');
    skillCounter.classList.add('hidden');

    phaseBadge.textContent = 'Review & Edit';
    phaseBadge.className = 'phase-badge badge-review';

    renderReviewSummary();
    triggerFeedback('complete');
  }

  function updateSkillDD(index, rawValue) {
    skillDDs[index] = String(rawValue || '').slice(0, 20);
  }

  function toggleSkillFault(skillIdx, faultTag, btnEl) {
    if (!skillFaults[skillIdx]) skillFaults[skillIdx] = [];
    const existingIdx = skillFaults[skillIdx].indexOf(faultTag);
    if (existingIdx >= 0) {
      skillFaults[skillIdx].splice(existingIdx, 1);
      if (btnEl) btnEl.classList.remove('selected');
    } else {
      skillFaults[skillIdx].push(faultTag);
      if (btnEl) btnEl.classList.add('selected');
    }
    triggerFeedback('tap');
  }

  function toggleLandingFault(faultTag, btnEl) {
    const existingIdx = landingFaults.indexOf(faultTag);
    if (existingIdx >= 0) {
      landingFaults.splice(existingIdx, 1);
      if (btnEl) btnEl.classList.remove('selected');
    } else {
      landingFaults.push(faultTag);
      if (btnEl) btnEl.classList.add('selected');
    }
    triggerFeedback('tap');
  }

  function renderReviewSummary() {
    const maxSkills = getMaxSkills();
    document.getElementById('skillsCountDisplay').textContent = skillsPerformed;

    const isLandingActive = (skillsPerformed === maxSkills);
    const { totalDeduct, netScore } = computeRoutineScores(
      currentDiscipline,
      skillsPerformed,
      skillDeductions,
      landingDeduction
    );

    document.getElementById('totalDeductDisplay').textContent = totalDeduct.toFixed(1);
    document.getElementById('netScoreDisplay').textContent = netScore.toFixed(1);

    const listContainer = document.getElementById('reviewList');
    listContainer.innerHTML = '';

    skillDeductions.forEach((val, i) => {
      const isPerformed = i < skillsPerformed;
      const row = document.createElement('div');
      row.className = `review-row ${isPerformed ? '' : 'disabled-row'}`;

      const thumbUrl = skillThumbnails[i];
      const ddValue = escapeHtml(skillDDs[i] || '');
      const selectedFaults = skillFaults[i] || [];

      const pillsHtml = SKILL_FAULT_PRESETS.map(tag => {
        const isSel = selectedFaults.includes(tag);
        return `<button type="button" class="fault-pill-btn ${isSel ? 'selected' : ''}" ${isPerformed ? '' : 'disabled'} onclick="toggleSkillFault(${i}, '${tag}', this)">${tag}</button>`;
      }).join('');

      row.innerHTML = `
        <div class="review-row-main">
          <span class="sk-lbl">Skill ${i + 1}</span>
          
          <div class="review-mid-group">
            <div class="review-thumb-box">
              ${thumbUrl ? `<img src="${thumbUrl}" class="review-thumb-img" alt="S${i+1}">` : '<span class="review-thumb-empty">—</span>'}
            </div>
            <div class="dd-input-wrapper">
              <span class="dd-prefix-lbl">DD</span>
              <input type="text" maxlength="20" class="dd-text-input" placeholder="—" value="${ddValue}" ${isPerformed ? '' : 'disabled'} oninput="updateSkillDD(${i}, this.value)">
            </div>
          </div>

          <div class="value-controls-group">
            ${isPerformed ? `<button class="btn-step" onclick="stepSkillValue(${i}, -1)">−</button>` : ''}
            <span class="sk-val">${isPerformed ? `-${val.toFixed(1)}` : '—'}</span>
            ${isPerformed ? `<button class="btn-step" onclick="stepSkillValue(${i}, 1)">+</button>` : ''}
          </div>
        </div>
        <div class="fault-pills-strip">${pillsHtml}</div>
      `;
      listContainer.appendChild(row);
    });

    const landingRow = document.createElement('div');
    landingRow.className = `review-row landing-row ${isLandingActive ? '' : 'disabled-row'}`;

    const landingPillsHtml = LANDING_FAULT_PRESETS.map(tag => {
      const isSel = landingFaults.includes(tag);
      return `<button type="button" class="fault-pill-btn ${isSel ? 'selected' : ''}" ${isLandingActive ? '' : 'disabled'} onclick="toggleLandingFault('${tag}', this)">${tag}</button>`;
    }).join('');

    landingRow.innerHTML = `
      <div class="review-row-main">
        <span class="sk-lbl">Landing</span>
        
        <div class="review-mid-group">
          <div class="review-thumb-box">
            ${landingThumbnail ? `<img src="${landingThumbnail}" class="review-thumb-img" alt="Landing">` : '<span class="review-thumb-empty">—</span>'}
          </div>
        </div>

        <div class="value-controls-group">
          ${isLandingActive ? `<button class="btn-step" onclick="stepLandingValue(-1)">−</button>` : ''}
          <span class="sk-val">${isLandingActive ? `-${landingDeduction.toFixed(1)}` : '—'}</span>
          ${isLandingActive ? `<button class="btn-step" onclick="stepLandingValue(1)">+</button>` : ''}
        </div>
      </div>
      <div class="fault-pills-strip">${landingPillsHtml}</div>
    `;
    listContainer.appendChild(landingRow);
  }

  function adjustSkillsCount(delta) {
    const maxSkills = getMaxSkills();
    skillsPerformed = Math.min(maxSkills, Math.max(0, skillsPerformed + delta));
    renderReviewSummary();
  }

  function stepSkillValue(index, direction) {
    let currentVal = skillDeductions[index];
    let updated = Math.round((currentVal + (direction * 0.1)) * 10) / 10;
    skillDeductions[index] = Math.min(0.5, Math.max(0.0, updated));
    renderReviewSummary();
  }

  function stepLandingValue(direction) {
    let idx = LANDING_DEDUCTION_SCALE.findIndex(v => Math.abs(v - landingDeduction) < 0.01);
    if (idx === -1) idx = 0;
    let nextIdx = Math.min(LANDING_DEDUCTION_SCALE.length - 1, Math.max(0, idx + direction));
    landingDeduction = LANDING_DEDUCTION_SCALE[nextIdx];
    renderReviewSummary();
  }

  /* ==========================================================================
     PARAMETERIZED ROUTINE DATA HELPER (SUPPORTS ACTIVE ROUTINE OR QUEUED ITEMS)
     ========================================================================== */
  function getActiveRoutineSnapshot(customOutputName = '') {
    return {
      videoObjectUrl,
      rawVideoBaseName: loadedVideoBaseName || `Routine_${currentDiscipline}`,
      outputBaseName: customOutputName,
      discipline: currentDiscipline,
      skillsPerformed,
      skillDeductions: [...skillDeductions],
      skillTimestamps: [...skillTimestamps],
      skillDDs: [...skillDDs],
      skillFaults: skillFaults.map(arr => [...arr]),
      landingDeduction,
      landingTimestamp,
      landingFaults: [...landingFaults],
      slateEnabled: brandingState.slateEnabled,
      slateTitle: brandingState.slateTitle,
      slateSubtitle: brandingState.slateSubtitle,
      slateDurationSec: brandingState.slateDurationSec,
      endSlateEnabled: brandingState.endSlateEnabled,
      endSlateDurationSec: brandingState.endSlateDurationSec,
      watermarkText: brandingState.watermarkText
    };
  }

  /* ==========================================================================
     ACTIVE OVERLAY EVENT RESOLVER WITH SKILL-TO-SKILL TRANSITION TIMING
     ========================================================================== */
  function getActiveOverlayEvent(currentTime, routineData = null) {
    const data = routineData || {
      discipline: currentDiscipline,
      skillsPerformed,
      skillDeductions,
      skillTimestamps,
      skillDDs,
      skillFaults,
      landingDeduction,
      landingTimestamp,
      landingFaults
    };

    const events = [];
    for (let i = 0; i < data.skillsPerformed; i++) {
      const t = data.skillTimestamps[i];
      if (t > 0) {
        events.push({
          key: `skill_${i}`,
          label: `SKILL ${i + 1}`,
          val: data.skillDeductions[i],
          dd: (data.skillDDs[i] || '').trim(),
          faults: Array.isArray(data.skillFaults?.[i]) ? data.skillFaults[i] : [],
          start: t,
          maxDur: 1.8
        });
      }
    }

    if (data.skillsPerformed === getMaxSkills(data.discipline) && data.landingTimestamp > 0) {
      events.push({
        key: 'landing',
        label: 'LANDING',
        val: data.landingDeduction,
        dd: '',
        faults: Array.isArray(data.landingFaults) ? data.landingFaults : [],
        start: data.landingTimestamp,
        maxDur: 2.2
      });
    }

    events.sort((a, b) => a.start - b.start);

    const TRANSITION_GAP_SEC = 0.16;
    const FADE_SEC = 0.14;

    for (let idx = 0; idx < events.length; idx++) {
      const ev = events[idx];
      const nextEv = events[idx + 1];
      let end = ev.start + ev.maxDur;

      if (nextEv && nextEv.start > ev.start) {
        const cappedEnd = nextEv.start - TRANSITION_GAP_SEC;
        if (cappedEnd < end) {
          end = Math.max(ev.start + 0.12, cappedEnd);
        }
      }

      if (currentTime >= ev.start && currentTime <= end) {
        const elapsed = currentTime - ev.start;
        const remaining = end - currentTime;

        let alpha = 1.0;
        let scale = 1.0;

        if (elapsed < FADE_SEC) {
          const p = elapsed / FADE_SEC;
          alpha = p;
          scale = 0.78 + 0.22 * p;
        } else if (remaining < FADE_SEC) {
          const p = Math.max(0, remaining / FADE_SEC);
          alpha = p;
          scale = 0.84 + 0.16 * p;
        }

        return {
          ...ev,
          alpha,
          scale
        };
      }
    }

    return null;
  }

  /* ==========================================================================
     RUNNING LIST VISIBILITY TIMING HELPER
     Shows running list only 150ms after landing deduction is shown
     ========================================================================== */
  function shouldShowRunningList(currentTime, isEnded, routineData = null) {
    const disc = routineData ? routineData.discipline : currentDiscipline;
    const performed = routineData ? routineData.skillsPerformed : skillsPerformed;
    const landTs = routineData ? routineData.landingTimestamp : landingTimestamp;

    const isLandingActive = (performed === getMaxSkills(disc));
    if (isLandingActive && landTs > 0) {
      return currentTime >= (landTs + 0.15);
    }
    return isEnded;
  }

  /* ==========================================================================
     PHASE 2: WEBCODECS + MP4-MUXER STANDARD MP4 VIDEO EXPORTER
     ========================================================================== */
  let activeExportVideo = null;
  let activeExportEncoder = null;
  let isExportCancelled = false;
  let currentExportMode = 'standard'; // 'standard' | 'training'
  let pendingShareFile = null;

  function getSafeEncoderDimensions(rawW, rawH, maxDimension = 1920) {
    let w = rawW || 1280;
    let h = rawH || 720;

    if (w > maxDimension || h > maxDimension) {
      const scale = maxDimension / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    w = w % 2 === 0 ? w : w - 1;
    h = h % 2 === 0 ? h : h - 1;
    return { w, h };
  }

  async function getSupportedH264Config(width, height) {
    if (typeof VideoEncoder === 'undefined') {
      throw new Error('WebCodecs VideoEncoder is not supported in this browser. Please use Chrome, Edge, or Safari 16.4+.');
    }
    if (typeof Mp4Muxer === 'undefined') {
      throw new Error('MP4 Muxer library failed to load. Please check your internet connection and reload.');
    }

    const codecs = [
      'avc1.640033',
      'avc1.4d0033',
      'avc1.640032',
      'avc1.64002a',
      'avc1.4d002a',
      'avc1.42002a',
      'avc1.64001f',
      'avc1.4d001f',
      'avc1.42001f'
    ];

    const evenW = width % 2 === 0 ? width : width - 1;
    const evenH = height % 2 === 0 ? height : height - 1;

    for (const codec of codecs) {
      const config = {
        codec,
        width: evenW,
        height: evenH,
        bitrate: 8_000_000,
        framerate: 30
      };
      try {
        const support = await VideoEncoder.isConfigSupported(config);
        if (support && support.supported) return config;
      } catch (e) {}
    }

    throw new Error(`No supported H.264 encoder profile found for ${evenW}x${evenH}.`);
  }

  function sanitizeFileBaseName(rawName, fallbackPrefix) {
    let clean = String(rawName || '').trim();
    clean = clean.replace(/\.(mp4|webm|mov)$/i, '').replace(/[\\/:*?"<>|]/g, '_');
    return clean || `${fallbackPrefix}_${Date.now()}`;
  }

  function openFilenameModal(mode = 'standard') {
    if (!videoObjectUrl) {
      alert("No video loaded to export.");
      return;
    }

    if (typeof VideoEncoder === 'undefined' || typeof Mp4Muxer === 'undefined') {
      alert("Your browser does not support WebCodecs MP4 encoding. Please use Chrome, Edge, or Safari 16.4+.");
      return;
    }

    currentExportMode = mode;
    const isTraining = (mode === 'training');

    document.getElementById('filenameModalTitle').textContent = isTraining
      ? 'Create Training Video'
      : 'Export Burned MP4 Video';
    document.getElementById('filenameModalSubtitle').textContent = isTraining
      ? 'Plays clean routine first to judge, fades to black for 1s, then fades in with overlays (standard MP4).'
      : 'Enter a filename to download or share a standard MP4 to Google Drive';

    document.getElementById('exportFileExtBadge').textContent = '.mp4';

    const basePrefix = loadedVideoBaseName ? `${loadedVideoBaseName}_` : '';
    const suffix = isTraining ? `Training_${currentDiscipline}` : `Judging_${currentDiscipline}`;
    const defaultName = `${basePrefix}${suffix}`;
    const inputEl = document.getElementById('exportFilenameInput');
    inputEl.value = defaultName;

    const mEnabled    = document.getElementById('modalSlateEnabledCheckbox');
    const mTitle      = document.getElementById('modalSlateTitleInput');
    const mSub        = document.getElementById('modalSlateSubtitleInput');
    const mEndEnabled = document.getElementById('modalEndSlateEnabledCheckbox');
    const mSliceEl    = document.getElementById('modalSliceSkillsCheckbox');
    if (mEnabled) mEnabled.checked = brandingState.slateEnabled;
    if (mTitle) mTitle.value = brandingState.slateTitle;
    if (mSub) mSub.value = brandingState.slateSubtitle;
    if (mEndEnabled) mEndEnabled.checked = brandingState.endSlateEnabled;
    if (mSliceEl) mSliceEl.checked = brandingState.sliceSkillsEnabled;

    document.getElementById('filenameModal').classList.remove('hidden');
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 50);
  }

  function closeFilenameModal() {
    document.getElementById('filenameModal').classList.add('hidden');
  }

  function confirmFilenameAndExport(deliveryAction = 'download') {
    syncModalSlateToSetup();
    const inputEl = document.getElementById('exportFilenameInput');
    const fallbackPrefix = currentExportMode === 'training'
      ? `Training_Video_${currentDiscipline}`
      : `Judging_Video_${currentDiscipline}`;
    const cleanBaseName = sanitizeFileBaseName(inputEl.value, fallbackPrefix);
    closeFilenameModal();

    const routineSnapshot = getActiveRoutineSnapshot(cleanBaseName);
    exportSingleRoutine(routineSnapshot, currentExportMode, deliveryAction);
  }

  function triggerBlobDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function buildRoutineFlatJsonPayload(routineData, mode = 'standard', exportedVideoFileName = '') {
    const maxSkills = getMaxSkills(routineData.discipline);
    const performed = Number(routineData.skillsPerformed || 0);
    const isLandingActive = (performed === maxSkills);
    const { totalDeduct, netScore } = computeRoutineScores(
      routineData.discipline,
      performed,
      routineData.skillDeductions || [],
      Number(routineData.landingDeduction || 0)
    );

    const skills = [];
    for (let i = 0; i < performed; i++) {
      const ddStr = String(routineData.skillDDs?.[i] || '').trim();
      const deductVal = Number(routineData.skillDeductions?.[i] || 0);
      const tsVal = Number(routineData.skillTimestamps?.[i] || 0);
      const faultsArr = Array.isArray(routineData.skillFaults?.[i]) ? [...routineData.skillFaults[i]] : [];
      skills.push({
        skillNumber: i + 1,
        timestampSec: Number(tsVal.toFixed(3)),
        timestampFormatted: formatTime(tsVal),
        dd: ddStr || null,
        deduction: Number(deductVal.toFixed(1)),
        faults: faultsArr
      });
    }

    const payload = {
      schemaVersion: 'judgle-routine-v1',
      exportedAt: new Date().toISOString(),
      exportMode: mode,
      sourceVideoName: routineData.rawVideoBaseName || null,
      exportedVideoFileName: exportedVideoFileName || null,
      discipline: routineData.discipline,
      maxSkills,
      skillsPerformed: performed,
      summary: {
        totalDeductions: Number(totalDeduct.toFixed(1)),
        netEScore: Number(netScore.toFixed(1)),
        landingIncluded: isLandingActive
      },
      skills,
      landing: isLandingActive ? {
        timestampSec: Number((routineData.landingTimestamp || 0).toFixed(3)),
        timestampFormatted: formatTime(routineData.landingTimestamp || 0),
        deduction: Number((routineData.landingDeduction || 0).toFixed(1)),
        faults: Array.isArray(routineData.landingFaults) ? [...routineData.landingFaults] : []
      } : null,
      branding: {
        slateEnabled: Boolean(routineData.slateEnabled),
        slateTitle: String(routineData.slateTitle || ''),
        slateSubtitle: String(routineData.slateSubtitle || ''),
        slateDurationSec: Number(routineData.slateDurationSec || 3),
        endSlateEnabled: Boolean(routineData.endSlateEnabled),
        endSlateDurationSec: Number(routineData.endSlateDurationSec || 4),
        watermarkText: String(routineData.watermarkText || '')
      }
    };

    const jsonText = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json' });
    const baseName = exportedVideoFileName
      ? exportedVideoFileName.replace(/\.mp4$/i, '')
      : sanitizeFileBaseName(routineData.outputBaseName, `Routine_${routineData.discipline}`);

    return {
      blob,
      fileName: `${baseName}.json`,
      payload
    };
  }

  function escapeCsvCell(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function buildRoutineFlatCsvPayload(routineData, mode = 'standard', exportedVideoFileName = '') {
    const jsonBuilt = buildRoutineFlatJsonPayload(routineData, mode, exportedVideoFileName);
    const p = jsonBuilt.payload;

    const headers = [
      'SchemaVersion',
      'ExportedAt',
      'ExportMode',
      'SourceVideoName',
      'ExportedVideoFileName',
      'Discipline',
      'MaxSkills',
      'SkillsPerformed',
      'TotalDeductions',
      'NetEScore',
      'EntryType',
      'SkillNumber',
      'TimestampSec',
      'TimestampFormatted',
      'DD',
      'Deduction',
      'Faults',
      'SlateEnabled',
      'SlateTitle',
      'SlateSubtitle',
      'SlateDurationSec',
      'EndSlateEnabled',
      'EndSlateDurationSec',
      'WatermarkText'
    ];

    const makeRow = (entryType, skillNum, tsSec, tsFmt, dd, deduct, faultsArr) => [
      p.schemaVersion,
      p.exportedAt,
      p.exportMode,
      p.sourceVideoName || '',
      p.exportedVideoFileName || '',
      p.discipline,
      p.maxSkills,
      p.skillsPerformed,
      p.summary.totalDeductions.toFixed(1),
      p.summary.netEScore.toFixed(1),
      entryType,
      skillNum,
      Number(tsSec || 0).toFixed(3),
      tsFmt || formatTime(tsSec || 0),
      dd || '',
      Number(deduct || 0).toFixed(1),
      Array.isArray(faultsArr) ? faultsArr.join('; ') : '',
      p.branding.slateEnabled ? 'true' : 'false',
      p.branding.slateTitle,
      p.branding.slateSubtitle,
      p.branding.slateDurationSec,
      p.branding.endSlateEnabled ? 'true' : 'false',
      p.branding.endSlateDurationSec,
      p.branding.watermarkText
    ].map(escapeCsvCell).join(',');

    const lines = [headers.join(',')];

    if (p.skills.length === 0 && !p.landing) {
      lines.push(makeRow('Summary', '', 0, '00:00.0', '', 0, []));
    } else {
      p.skills.forEach((sk) => {
        lines.push(makeRow(
          'Skill',
          sk.skillNumber,
          sk.timestampSec,
          sk.timestampFormatted,
          sk.dd || '',
          sk.deduction,
          sk.faults
        ));
      });
      if (p.landing) {
        lines.push(makeRow(
          'Landing',
          '',
          p.landing.timestampSec,
          p.landing.timestampFormatted,
          '',
          p.landing.deduction,
          p.landing.faults
        ));
      }
    }

    const csvText = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const baseName = exportedVideoFileName
      ? exportedVideoFileName.replace(/\.mp4$/i, '')
      : sanitizeFileBaseName(routineData.outputBaseName, `Routine_${routineData.discipline}`);

    return {
      blob,
      fileName: `${baseName}.csv`
    };
  }

  function parseCsvRows(csvText) {
    const cleanText = String(csvText || '').replace(/^\uFEFF/, '');
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const ch = cleanText[i];
      const next = cleanText[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          currentVal += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentVal += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentVal);
          currentVal = '';
        } else if (ch === '\r' && next === '\n') {
          currentRow.push(currentVal);
          rows.push(currentRow);
          currentRow = [];
          currentVal = '';
          i++;
        } else if (ch === '\n' || ch === '\r') {
          currentRow.push(currentVal);
          rows.push(currentRow);
          currentRow = [];
          currentVal = '';
        } else {
          currentVal += ch;
        }
      }
    }
    if (currentVal.length > 0 || currentRow.length > 0) {
      currentRow.push(currentVal);
      rows.push(currentRow);
    }
    return rows.filter(r => r.some(cell => cell.trim() !== ''));
  }

  function parseRoutineCsvToStructuredObject(csvText) {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) throw new Error('CSV file has no data rows.');

    const headers = rows[0].map(h => h.trim());
    const idxOf = (name) => headers.indexOf(name);

    const discIdx = idxOf('Discipline');
    const entryTypeIdx = idxOf('EntryType');
    if (discIdx === -1 || entryTypeIdx === -1) {
      throw new Error('Missing required CSV columns (Discipline, EntryType).');
    }

    const firstData = rows[1];
    const discipline = firstData[discIdx] || 'TRP';
    const skillsPerformed = Number(firstData[idxOf('SkillsPerformed')] || 0);
    const sourceVideoName = firstData[idxOf('SourceVideoName')] || null;

    const skills = [];
    let landing = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const entryType = (row[entryTypeIdx] || '').trim().toLowerCase();
      const faultsRaw = (row[idxOf('Faults')] || '').trim();
      const faults = faultsRaw ? faultsRaw.split(/\s*;\s*/).filter(Boolean) : [];
      const tsSec = Number(row[idxOf('TimestampSec')] || 0);
      const deduct = Number(row[idxOf('Deduction')] || 0);

      if (entryType === 'skill') {
        skills.push({
          skillNumber: Number(row[idxOf('SkillNumber')] || (skills.length + 1)),
          timestampSec: tsSec,
          dd: (row[idxOf('DD')] || '').trim() || null,
          deduction: deduct,
          faults
        });
      } else if (entryType === 'landing') {
        landing = {
          timestampSec: tsSec,
          deduction: deduct,
          faults
        };
      }
    }

    const slateEnabledIdx = idxOf('SlateEnabled');
    const branding = slateEnabledIdx !== -1 ? {
      slateEnabled: String(firstData[slateEnabledIdx] || '').toLowerCase() === 'true',
      slateTitle: firstData[idxOf('SlateTitle')] || '',
      slateSubtitle: firstData[idxOf('SlateSubtitle')] || '',
      slateDurationSec: Number(firstData[idxOf('SlateDurationSec')] || 3),
      endSlateEnabled: String(firstData[idxOf('EndSlateEnabled')] || 'true').toLowerCase() === 'true',
      endSlateDurationSec: Number(firstData[idxOf('EndSlateDurationSec')] || 4),
      watermarkText: firstData[idxOf('WatermarkText')] || ''
    } : null;

    return {
      discipline,
      skillsPerformed: skillsPerformed || skills.length,
      sourceVideoName,
      skills,
      landing,
      branding
    };
  }

  function handleRoutineJsonSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = String(e.target.result || '');
        const isCsvFile = file.name.toLowerCase().endsWith('.csv') || !rawContent.trim().startsWith('{');
        const parsed = isCsvFile
          ? parseRoutineCsvToStructuredObject(rawContent)
          : JSON.parse(rawContent || '{}');
        if (!parsed || !Array.isArray(parsed.skills) || !parsed.discipline) {
          throw new Error('Invalid routine JSON/CSV format.');
        }

        const disc = ['TRP', 'DMT', 'TUM'].includes(parsed.discipline) ? parsed.discipline : 'TRP';
        const discCardId = disc === 'DMT' ? 'discDmtCard' : (disc === 'TUM' ? 'discTumCard' : 'discTrpCard');
        const discCardEl = document.getElementById(discCardId);
        if (discCardEl) selectDiscipline(disc, discCardEl);

        const maxSkills = getMaxSkills(disc);
        const performed = Math.min(maxSkills, Math.max(0, Number(parsed.skillsPerformed ?? parsed.skills.length)));

        skillDeductions = new Array(maxSkills).fill(0);
        skillTimestamps = new Array(maxSkills).fill(0);
        skillThumbnails = new Array(maxSkills).fill(null);
        skillMatchScores = new Array(maxSkills).fill(null);
        skillDDs = new Array(maxSkills).fill('');
        skillFaults = Array.from({ length: maxSkills }, () => []);

        parsed.skills.forEach((sk, idx) => {
          const slot = (typeof sk.skillNumber === 'number' && sk.skillNumber >= 1 && sk.skillNumber <= maxSkills)
            ? sk.skillNumber - 1
            : idx;
          if (slot < maxSkills) {
            skillDeductions[slot] = Number(sk.deduction || 0);
            skillTimestamps[slot] = Number(sk.timestampSec || 0);
            skillDDs[slot] = sk.dd ? String(sk.dd) : '';
            skillFaults[slot] = Array.isArray(sk.faults) ? sk.faults.map(String) : [];
          }
        });

        if (parsed.landing && typeof parsed.landing === 'object') {
          landingDeduction = Number(parsed.landing.deduction || 0);
          landingTimestamp = Number(parsed.landing.timestampSec || 0);
          landingFaults = Array.isArray(parsed.landing.faults) ? parsed.landing.faults.map(String) : [];
        } else {
          landingDeduction = 0;
          landingTimestamp = 0;
          landingFaults = [];
        }
        landingThumbnail = null;
        landingMatchScore = null;
        skillsPerformed = performed;

        if (parsed.branding && typeof parsed.branding === 'object') {
          brandingState.slateEnabled = Boolean(parsed.branding.slateEnabled);
          brandingState.slateTitle = String(parsed.branding.slateTitle || '');
          brandingState.slateSubtitle = String(parsed.branding.slateSubtitle || '');
          if ([2, 3, 4, 5].includes(Number(parsed.branding.slateDurationSec))) {
            brandingState.slateDurationSec = Number(parsed.branding.slateDurationSec);
          }
          if (parsed.branding.endSlateEnabled !== undefined) {
            brandingState.endSlateEnabled = Boolean(parsed.branding.endSlateEnabled);
          }
          if ([3, 4, 5, 6].includes(Number(parsed.branding.endSlateDurationSec))) {
            brandingState.endSlateDurationSec = Number(parsed.branding.endSlateDurationSec);
          }
          brandingState.watermarkText = String(parsed.branding.watermarkText || '');
          applyBrandingStateToInputs();
          persistBrandingSettings();
        }

        const statusEl = document.getElementById('loadedJsonStatus');
        if (statusEl) {
          const hintVid = parsed.sourceVideoName ? ` (match with "${escapeHtml(parsed.sourceVideoName)}")` : '';
          statusEl.innerHTML = `<span style="color:var(--fig-green); font-weight:700;">✓ Loaded ${escapeHtml(file.name)}</span>${hintVid}`;
        }

        triggerFeedback('complete');
        if (videoObjectUrl) {
          enterReviewPhase();
        } else {
          alert(`Loaded routine data from "${file.name}". Select the matching routine video above, or click Review to inspect deductions.`);
          enterReviewPhase();
        }
      } catch (err) {
        alert('Could not load routine JSON: ' + err.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function openShareReadyModal(videoFile) {
    pendingShareFile = videoFile;
    const canNativeFileShare = typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function'
      && navigator.canShare({ files: [videoFile] });

    const shareBtn = document.getElementById('btnTriggerNativeShare');
    const subtitleEl = document.getElementById('shareReadySubtitle');

    if (canNativeFileShare) {
      shareBtn.classList.remove('hidden');
      subtitleEl.textContent = `"${videoFile.name}" is ready. Tap Share / Drive to open your device Share Sheet and select Google Drive.`;
    } else {
      shareBtn.classList.add('hidden');
      subtitleEl.textContent = `Direct file sharing is not supported in this browser. Tap Download to save "${videoFile.name}" to your device.`;
    }

    document.getElementById('shareReadyModal').classList.remove('hidden');
  }

  function closeShareReadyModal() {
    pendingShareFile = null;
    document.getElementById('shareReadyModal').classList.add('hidden');
  }

  function downloadPendingShareFile() {
    if (!pendingShareFile) return;
    triggerBlobDownload(pendingShareFile, pendingShareFile.name);
    triggerFeedback('complete');
    closeShareReadyModal();
  }

  async function triggerNativeFileShare() {
    if (!pendingShareFile) return;
    try {
      await navigator.share({
        files: [pendingShareFile],
        title: pendingShareFile.name
      });
      triggerFeedback('complete');
      closeShareReadyModal();
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return;
      }
      alert("Unable to open Share Sheet on this device. Downloading video instead.");
      downloadPendingShareFile();
    }
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function wrapCanvasTextLines(ctx, text, maxWidth) {
    const words = String(text || '').trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = words[i];
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function drawBurnedWatermark(ctx, w, h, wmRawText) {
    const wmText = String(wmRawText || '').trim();
    if (!wmText) return;

    const scale = Math.max(0.5, h / 720);
    const pad = 20 * scale;
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    ctx.save();
    ctx.font = `700 ${15 * scale}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1 * scale;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.fillText(wmText, pad, h - pad, w * 0.62);
    ctx.restore();
  }

  function drawIntroSlateFrame(ctx, w, h, routineData, fadeAlpha = 0) {
    const themeCols = getThemeCanvasColors();
    const scale = Math.max(0.5, h / 720);
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    const titleText = String(routineData.slateTitle || '').trim();
    const subtitleText = String(routineData.slateSubtitle || '').trim();
    const discHeader = `${getDisciplineFullName(routineData.discipline)} • JUDGE EDUCATION`;

    ctx.save();

    ctx.fillStyle = themeCols.bgDark;
    ctx.fillRect(0, 0, w, h);

    const maxCardW = Math.min(w * 0.84, 860 * scale);
    const innerTextMaxW = maxCardW - 88 * scale;

    ctx.font = `900 ${38 * scale}px ${fontFamily}`;
    const titleLines = titleText ? wrapCanvasTextLines(ctx, titleText, innerTextMaxW) : [];

    ctx.font = `600 ${20 * scale}px ${fontFamily}`;
    const subLines = subtitleText ? wrapCanvasTextLines(ctx, subtitleText, innerTextMaxW) : [];

    const titleLineH = 46 * scale;
    const subLineH = 28 * scale;
    const cardPadY = 42 * scale;
    const cardH = cardPadY * 2
      + 10 * scale
      + 26 * scale
      + (titleLines.length > 0 ? titleLines.length * titleLineH + 10 * scale : 0)
      + (subLines.length > 0 ? subLines.length * subLineH + 8 * scale : 0);

    const cardX = (w - maxCardW) / 2;
    const cardY = (h - cardH) / 2;

    ctx.fillStyle = themeCols.cardBg;
    drawRoundedRect(ctx, cardX, cardY, maxCardW, cardH, 18 * scale);
    ctx.fill();

    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = themeCols.border;
    ctx.stroke();

    let cursorY = cardY + cardPadY;

    const barW = 72 * scale;
    const barH = 5 * scale;
    const grad = ctx.createLinearGradient(w / 2 - barW / 2, cursorY, w / 2 + barW / 2, cursorY);
    grad.addColorStop(0, themeCols.blue);
    grad.addColorStop(1, themeCols.purple);
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, w / 2 - barW / 2, cursorY, barW, barH, 3 * scale);
    ctx.fill();

    cursorY += barH + 16 * scale;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `800 ${14 * scale}px ${fontFamily}`;
    ctx.fillStyle = themeCols.blue;
    ctx.fillText(discHeader, w / 2, cursorY);

    cursorY += 28 * scale;

    if (titleLines.length > 0) {
      ctx.font = `900 ${38 * scale}px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      titleLines.forEach(line => {
        ctx.fillText(line, w / 2, cursorY);
        cursorY += titleLineH;
      });
      cursorY += 6 * scale;
    }

    if (subLines.length > 0) {
      ctx.font = `600 ${20 * scale}px ${fontFamily}`;
      ctx.fillStyle = themeCols.textSub;
      subLines.forEach(line => {
        ctx.fillText(line, w / 2, cursorY);
        cursorY += subLineH;
      });
    }

    drawBurnedWatermark(ctx, w, h, routineData.watermarkText);

    if (fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, fadeAlpha)).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  function drawEndSlateFrame(ctx, w, h, routineData, bgCanvas = null, cardAlpha = 1.0) {
    const themeCols = getThemeCanvasColors();
    const scale = Math.max(0.5, h / 720);
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const monoFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

    const maxSkills = getMaxSkills(routineData.discipline);
    const isLandingActive = (routineData.skillsPerformed === maxSkills);
    const { totalDeduct, netScore } = computeRoutineScores(
      routineData.discipline,
      routineData.skillsPerformed,
      routineData.skillDeductions,
      routineData.landingDeduction
    );

    const discFull = getDisciplineFullName(routineData.discipline);
    const customTitle = String(routineData.slateTitle || '').trim();
    const headerTitle = customTitle || 'Routine Execution Breakdown';
    const subMeta = `${routineData.skillsPerformed} Skill${routineData.skillsPerformed === 1 ? '' : 's'}${isLandingActive ? ' + Landing' : ' (Incomplete Routine)'}`;

    const rows = [];
    for (let i = 0; i < routineData.skillsPerformed; i++) {
      const ddStr = String(routineData.skillDDs?.[i] || '').trim();
      const faultsArr = Array.isArray(routineData.skillFaults?.[i]) ? routineData.skillFaults[i] : [];
      rows.push({
        label: `Skill ${i + 1}`,
        dd: ddStr,
        faults: faultsArr.join(' • '),
        valNum: routineData.skillDeductions[i] || 0,
        isLanding: false
      });
    }
    if (isLandingActive) {
      const lFaults = Array.isArray(routineData.landingFaults) ? routineData.landingFaults : [];
      rows.push({
        label: 'Landing',
        dd: '',
        faults: lFaults.join(' • '),
        valNum: routineData.landingDeduction || 0,
        isLanding: true
      });
    }

    ctx.save();

    if (bgCanvas) {
      ctx.drawImage(bgCanvas, 0, 0, w, h);
    } else {
      ctx.fillStyle = themeCols.bgDark;
      ctx.fillRect(0, 0, w, h);
    }

    const alpha = Math.min(1, Math.max(0, cardAlpha));
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(10, 10, 15, 0.38)';
    ctx.fillRect(0, 0, w, h);

    const isPortrait = h > w;
    const cols = (!isPortrait && rows.length > 4) ? 2 : 1;
    const rowsPerCol = Math.ceil(rows.length / cols);

    const cardW = Math.min(w * 0.90, (cols === 2 ? 960 : 620) * scale);
    const cardPadX = 28 * scale;
    const cardPadY = 24 * scale;
    const headerH = 82 * scale;
    const rowH = Math.min(42 * scale, Math.max(30 * scale, ((h * 0.72) - headerH) / Math.max(1, rowsPerCol)));
    const rowGap = 7 * scale;
    const gridH = rowsPerCol * rowH + Math.max(0, rowsPerCol - 1) * rowGap;
    const cardH = Math.min(h * 0.90, cardPadY * 2 + headerH + 14 * scale + gridH);

    const cardX = (w - cardW) / 2;
    const cardY = (h - cardH) / 2;

    ctx.fillStyle = themeCols.cardBg;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 18 * scale);
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = themeCols.border;
    ctx.stroke();

    const innerX = cardX + cardPadX;
    const innerW = cardW - cardPadX * 2;
    const headerTop = cardY + cardPadY;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = `800 ${12 * scale}px ${fontFamily}`;
    ctx.fillStyle = themeCols.blue;
    ctx.fillText(`${discFull} • ROUTINE SUMMARY`, innerX, headerTop);

    ctx.font = `900 ${24 * scale}px ${fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(headerTitle, innerX, headerTop + 18 * scale, innerW - 195 * scale);

    ctx.font = `600 ${13 * scale}px ${fontFamily}`;
    ctx.fillStyle = themeCols.textSub;
    ctx.fillText(subMeta, innerX, headerTop + 48 * scale, innerW - 195 * scale);

    const pillW = 178 * scale;
    const pillH = 68 * scale;
    const pillX = innerX + innerW - pillW;
    const pillY = headerTop - 2 * scale;

    ctx.fillStyle = currentColorScheme === 'mono'
      ? 'rgba(255, 255, 255, 0.10)'
      : 'rgba(155, 217, 139, 0.12)';
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 12 * scale);
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = themeCols.green;
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.font = `800 ${10.5 * scale}px ${fontFamily}`;
    ctx.fillStyle = themeCols.green;
    ctx.fillText('NET E-SCORE', pillX + pillW - 12 * scale, pillY + 7 * scale);

    ctx.font = `900 ${28 * scale}px ${fontFamily}`;
    ctx.fillStyle = themeCols.green;
    ctx.fillText(netScore.toFixed(1), pillX + pillW - 12 * scale, pillY + 20 * scale);

    ctx.font = `700 ${11.5 * scale}px ${fontFamily}`;
    ctx.fillStyle = themeCols.pink;
    ctx.fillText(`Deductions: -${totalDeduct.toFixed(1)}`, pillX + pillW - 12 * scale, pillY + 50 * scale);

    const divY = headerTop + headerH - 6 * scale;
    ctx.beginPath();
    ctx.moveTo(innerX, divY);
    ctx.lineTo(innerX + innerW, divY);
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = themeCols.border;
    ctx.stroke();

    const gridTop = divY + 12 * scale;
    const colGap = 14 * scale;
    const colW = (innerW - (cols - 1) * colGap) / cols;

    rows.forEach((item, idx) => {
      const colIdx = Math.floor(idx / rowsPerCol);
      const rowIdx = idx % rowsPerCol;
      const rx = innerX + colIdx * (colW + colGap);
      const ry = gridTop + rowIdx * (rowH + rowGap);

      ctx.fillStyle = item.isLanding
        ? (currentColorScheme === 'mono' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(220, 81, 131, 0.12)')
        : 'rgba(10, 10, 16, 0.78)';
      drawRoundedRect(ctx, rx, ry, colW, rowH, 8 * scale);
      ctx.fill();

      ctx.lineWidth = 1.2 * scale;
      ctx.strokeStyle = item.isLanding ? themeCols.pink : 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      const textY = ry + (rowH - 14 * scale) / 2;

      ctx.textAlign = 'left';
      ctx.font = `800 ${13.5 * scale}px ${fontFamily}`;
      ctx.fillStyle = item.isLanding ? themeCols.pink : '#ffffff';
      ctx.fillText(item.label, rx + 11 * scale, textY);

      let leftOffset = rx + 11 * scale + ctx.measureText(item.label).width + 8 * scale;

      if (item.dd) {
        ctx.font = `800 ${11.5 * scale}px ${monoFamily}`;
        const ddW = ctx.measureText(item.dd).width + 10 * scale;
        const ddH = 18 * scale;
        const ddY = ry + (rowH - ddH) / 2;

        ctx.fillStyle = currentColorScheme === 'mono'
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(68, 149, 229, 0.18)';
        drawRoundedRect(ctx, leftOffset, ddY, ddW, ddH, 4 * scale);
        ctx.fill();

        ctx.fillStyle = themeCols.blue;
        ctx.fillText(item.dd, leftOffset + 5 * scale, ddY + 3 * scale);
        leftOffset += ddW + 8 * scale;
      }

      const valStr = `-${item.valNum.toFixed(1)}`;
      const valColor = getDeductionHexColor(item.valNum);
      const rightEdge = rx + colW - 11 * scale;

      ctx.textAlign = 'right';
      ctx.font = `900 ${14.5 * scale}px ${fontFamily}`;
      ctx.fillStyle = valColor;
      ctx.fillText(valStr, rightEdge, textY - 0.5 * scale);

      const valW = ctx.measureText(valStr).width;

      if (item.faults) {
        const maxFaultW = Math.max(20 * scale, (rightEdge - valW - 10 * scale) - leftOffset);
        ctx.font = `600 ${11.5 * scale}px ${fontFamily}`;
        ctx.fillStyle = themeCols.textSub;
        ctx.fillText(item.faults, rightEdge - valW - 10 * scale, textY + 1 * scale, maxFaultW);
      }
    });

    ctx.globalAlpha = 1.0;
    drawBurnedWatermark(ctx, w, h, routineData.watermarkText);

    ctx.restore();
  }

  function drawBurnedOverlays(ctx, w, h, currentTime, isEnded, routineData) {
    const themeCols = getThemeCanvasColors();
    const scale = Math.max(0.5, h / 720);
    const pad = 20 * scale;
    const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    const monoFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

    ctx.save();
    ctx.textBaseline = 'top';

    const activeEvent = getActiveOverlayEvent(currentTime, routineData);

    if (activeEvent) {
      const badgeColor = getDeductionHexColor(activeEvent.val);
      const faultsStr = (activeEvent.faults && activeEvent.faults.length > 0)
        ? activeEvent.faults.join(' • ')
        : '';

      ctx.font = `800 ${13 * scale}px ${fontFamily}`;
      const faultsTextW = faultsStr ? ctx.measureText(faultsStr).width : 0;

      const badgeW = Math.max(148 * scale, faultsTextW + 32 * scale);
      const badgeH = faultsStr ? (98 * scale) : (78 * scale);
      const badgeX = w - pad - badgeW;
      const badgeY = pad;

      ctx.save();
      ctx.globalAlpha = activeEvent.alpha;
      const pivotX = w - pad;
      const pivotY = pad;
      ctx.translate(pivotX, pivotY);
      ctx.scale(activeEvent.scale, activeEvent.scale);
      ctx.translate(-pivotX, -pivotY);

      ctx.fillStyle = 'rgba(10, 10, 15, 0.88)';
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 14 * scale);
      ctx.fill();

      ctx.lineWidth = 2.5 * scale;
      ctx.strokeStyle = badgeColor;
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.font = `800 ${13 * scale}px ${fontFamily}`;
      ctx.fillStyle = themeCols.blue;
      ctx.fillText(activeEvent.label, badgeX + badgeW - 14 * scale, badgeY + 11 * scale);

      ctx.font = `900 ${36 * scale}px ${fontFamily}`;
      ctx.fillStyle = badgeColor;
      ctx.fillText(`-${activeEvent.val.toFixed(1)}`, badgeX + badgeW - 14 * scale, badgeY + 29 * scale);

      if (faultsStr) {
        ctx.font = `800 ${13 * scale}px ${fontFamily}`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(faultsStr, badgeX + badgeW - 14 * scale, badgeY + 72 * scale);
      }

      if (activeEvent.dd) {
        ctx.font = `800 ${14 * scale}px ${monoFamily}`;
        const textW = ctx.measureText(activeEvent.dd).width;
        const ddW = Math.max(76 * scale, textW + 24 * scale);
        const ddH = 26 * scale;
        const ddX = w - pad - ddW;
        const ddY = badgeY + badgeH + 6 * scale;

        ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
        drawRoundedRect(ctx, ddX, ddY, ddW, ddH, 8 * scale);
        ctx.fill();

        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = themeCols.blue;
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(activeEvent.dd, ddX + ddW - 12 * scale, ddY + 6 * scale);
      }

      ctx.restore();
    }

    if (shouldShowRunningList(currentTime, isEnded, routineData)) {
      const listTop = pad + 152 * scale;
      const itemW = 235 * scale;
      const itemH = 31 * scale;
      const itemGap = 6 * scale;
      const listX = w - pad - itemW;

      const visibleItems = [];
      for (let i = 0; i < routineData.skillsPerformed; i++) {
        const ddStr = (routineData.skillDDs[i] || '').trim();
        const fArr = routineData.skillFaults?.[i] || [];
        visibleItems.push({
          label: ddStr ? `Skill ${i + 1} (${ddStr})` : `Skill ${i + 1}`,
          faultsText: fArr.join(' • '),
          val: `-${routineData.skillDeductions[i].toFixed(1)}`,
          isLanding: false
        });
      }

      if (routineData.skillsPerformed === getMaxSkills(routineData.discipline)) {
        const lFaults = routineData.landingFaults || [];
        visibleItems.push({
          label: 'Landing',
          faultsText: lFaults.join(' • '),
          val: `-${routineData.landingDeduction.toFixed(1)}`,
          isLanding: true
        });
      }

      const reservedBottom = isEnded ? (145 * scale) : (24 * scale);
      const maxAvailableH = Math.max(itemH, h - listTop - reservedBottom);
      const maxVisibleCount = Math.max(1, Math.floor((maxAvailableH + itemGap) / (itemH + itemGap)));
      const itemsToDraw = visibleItems.slice(-maxVisibleCount);

      itemsToDraw.forEach((item, idx) => {
        const y = listTop + idx * (itemH + itemGap);

        ctx.fillStyle = 'rgba(20, 20, 31, 0.84)';
        drawRoundedRect(ctx, listX, y, itemW, itemH, 8 * scale);
        ctx.fill();

        ctx.lineWidth = 1.5 * scale;
        ctx.strokeStyle = themeCols.border;
        ctx.stroke();

        ctx.font = `700 ${13 * scale}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = item.isLanding ? themeCols.pink : themeCols.textSub;
        ctx.fillText(item.label, listX + 11 * scale, y + 8 * scale);

        ctx.textAlign = 'right';
        const rightEdgeX = listX + itemW - 11 * scale;

        ctx.font = `800 ${13 * scale}px ${fontFamily}`;
        ctx.fillStyle = themeCols.pink;
        ctx.fillText(item.val, rightEdgeX, y + 8 * scale);

        if (item.faultsText) {
          ctx.font = `700 ${11 * scale}px ${fontFamily}`;
          ctx.fillStyle = '#ffffff';
          const valW = ctx.measureText(item.val).width;
          ctx.fillText(item.faultsText, rightEdgeX - valW - 10 * scale, y + 9 * scale);
        }
      });
    }

    if (isEnded) {
      const { totalDeduct, netScore } = computeRoutineScores(
        routineData.discipline,
        routineData.skillsPerformed,
        routineData.skillDeductions,
        routineData.landingDeduction
      );

      const cardW = 235 * scale;
      const cardH = 104 * scale;
      const cardX = w - pad - cardW;
      const cardY = h - pad - cardH;

      ctx.fillStyle = 'rgba(14, 14, 22, 0.94)';
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 14 * scale);
      ctx.fill();

      ctx.lineWidth = 2.5 * scale;
      ctx.strokeStyle = themeCols.green;
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.font = `800 ${13 * scale}px ${fontFamily}`;
      ctx.fillStyle = themeCols.green;
      ctx.fillText('ROUTINE SCORE', cardX + cardW - 16 * scale, cardY + 13 * scale);

      ctx.font = `900 ${40 * scale}px ${fontFamily}`;
      ctx.fillStyle = themeCols.green;
      ctx.fillText(netScore.toFixed(1), cardX + cardW - 16 * scale, cardY + 32 * scale);

      ctx.font = `700 ${13 * scale}px ${fontFamily}`;
      ctx.fillStyle = themeCols.pink;
      ctx.fillText(`Total Deductions: -${totalDeduct.toFixed(1)}`, cardX + cardW - 16 * scale, cardY + 78 * scale);
    }

    ctx.restore();
  }

  /* ==========================================================================
     CORE RENDER ENGINE: WEBCODECS H.264 + MP4-MUXER (STANDARD .MP4 WITH DURATION)
     ========================================================================== */
  async function renderRoutineToBlob(routineData, mode = 'standard', batchContext = null) {
    const isTraining = (mode === 'training');
    const useSlate = isIntroSlateActive(routineData);

    const pctLabel   = document.getElementById('exportPctLabel');
    const fillBar    = document.getElementById('exportProgressFill');
    const statusText = document.getElementById('exportStatusText');

    const batchTag = batchContext
      ? `[Routine ${batchContext.index + 1} of ${batchContext.total}] `
      : '';

    const updateProgressUI = (localPct, msg) => {
      const clampedLocal = Math.min(100, Math.max(0, Math.round(localPct)));
      if (batchContext) {
        const overallPct = Math.min(100, Math.round(((batchContext.index + clampedLocal / 100) / batchContext.total) * 100));
        pctLabel.textContent = `${overallPct}%`;
        fillBar.style.width = `${overallPct}%`;
      } else {
        pctLabel.textContent = `${clampedLocal}%`;
        fillBar.style.width = `${clampedLocal}%`;
      }
      if (msg) statusText.textContent = `${batchTag}${msg}`;
    };

    updateProgressUI(0, 'Initializing H.264 MP4 encoder... Keep this tab active.');

    const renderVideo = document.createElement('video');
    renderVideo.src = routineData.videoObjectUrl;
    renderVideo.muted = true;
    renderVideo.volume = 0;
    renderVideo.playsInline = true;
    renderVideo.preload = 'auto';
    renderVideo.crossOrigin = 'anonymous';
    activeExportVideo = renderVideo;

    await new Promise((resolve, reject) => {
      renderVideo.onloadedmetadata = () => resolve();
      renderVideo.onerror = () => reject(new Error(`Failed to load video metadata for "${routineData.outputBaseName}".`));
    });

    if (isExportCancelled || !activeExportVideo) return null;

    const rawW = renderVideo.videoWidth || 1280;
    const rawH = renderVideo.videoHeight || 720;
    const { w, h } = getSafeEncoderDimensions(rawW, rawH, 1920);

    const encoderConfig = await getSupportedH264Config(w, h);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    const ctx = offscreenCanvas.getContext('2d', { alpha: false });

    const suffixFallback = isTraining
      ? `Training_${routineData.discipline}`
      : `Judging_${routineData.discipline}`;
    const cleanBase = sanitizeFileBaseName(routineData.outputBaseName, suffixFallback);
    const finalFileName = `${cleanBase}.mp4`;

    let encoderError = null;
    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: w,
        height: h
      },
      fastStart: 'in-memory'
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (err) => {
        console.error('VideoEncoder error:', err);
        encoderError = err;
      }
    });
    videoEncoder.configure(encoderConfig);
    activeExportEncoder = videoEncoder;

    const FPS = 30;
    const FRAME_DURATION_US = Math.round(1_000_000 / FPS);
    let frameIndex = 0;

    const encodeCurrentCanvasFrame = async () => {
      if (isExportCancelled || encoderError) return;
      while (videoEncoder.encodeQueueSize > 8 && !isExportCancelled && !encoderError) {
        await new Promise(r => setTimeout(r, 5));
      }
      if (isExportCancelled || encoderError || videoEncoder.state !== 'configured') return;

      const timestampUs = frameIndex * FRAME_DURATION_US;
      const frame = new VideoFrame(offscreenCanvas, {
        timestamp: timestampUs,
        duration: FRAME_DURATION_US
      });
      const isKeyFrame = (frameIndex % (FPS * 2) === 0);
      videoEncoder.encode(frame, { keyFrame: isKeyFrame });
      frame.close();
      frameIndex++;
    };

    const seekVideoTo = (targetTime) => {
      return new Promise((resolve) => {
        if (isExportCancelled || !activeExportVideo) return resolve();
        if (Math.abs(renderVideo.currentTime - targetTime) < 0.001 && renderVideo.readyState >= 2) {
          return resolve();
        }
        const onSeeked = () => {
          renderVideo.removeEventListener('seeked', onSeeked);
          resolve();
        };
        renderVideo.addEventListener('seeked', onSeeked, { once: true });
        renderVideo.currentTime = targetTime;
      });
    };

    const renderIntroSlatePass = async (durationSec, progressOffset = 0, progressSpan = 8) => {
      const totalFrames = Math.max(1, Math.round(durationSec * FPS));
      const fadeOutFrames = Math.min(Math.round(0.45 * FPS), Math.round(totalFrames * 0.25));

      for (let f = 0; f < totalFrames; f++) {
        if (isExportCancelled || encoderError || !activeExportVideo) return;

        const remainingFrames = totalFrames - f;
        let fadeAlpha = 0;
        if (remainingFrames < fadeOutFrames) {
          fadeAlpha = 1 - Math.max(0, remainingFrames / fadeOutFrames);
        }

        drawIntroSlateFrame(ctx, w, h, routineData, fadeAlpha);
        await encodeCurrentCanvasFrame();

        if (f % 3 === 0 || f === totalFrames - 1) {
          const ratio = (f + 1) / totalFrames;
          updateProgressUI(
            progressOffset + ratio * progressSpan,
            `Encoding Intro Title Card (${durationSec}s)... Keep this tab active.`
          );
          await new Promise(r => setTimeout(r, 0));
        }
      }
    };

    const renderEndSlatePass = async (durationSec, progressOffset = 90, progressSpan = 10) => {
      const fullDur = renderVideo.duration || 1;
      const { endTime } = getTrimmedWindow(fullDur);
      await seekVideoTo(endTime);
      if (isExportCancelled || encoderError || !activeExportVideo) return;

      const lastFrameCanvas = document.createElement('canvas');
      lastFrameCanvas.width = w;
      lastFrameCanvas.height = h;
      lastFrameCanvas.getContext('2d').drawImage(renderVideo, 0, 0, w, h);

      const totalFrames = Math.max(1, Math.round(durationSec * FPS));
      const fadeInFrames = Math.min(Math.round(0.35 * FPS), Math.round(totalFrames * 0.2));

      for (let f = 0; f < totalFrames; f++) {
        if (isExportCancelled || encoderError || !activeExportVideo) return;

        let cardAlpha = 1.0;
        if (f < fadeInFrames) {
          cardAlpha = (f + 1) / fadeInFrames;
        }

        drawEndSlateFrame(ctx, w, h, routineData, lastFrameCanvas, cardAlpha);
        await encodeCurrentCanvasFrame();

        if (f % 3 === 0 || f === totalFrames - 1) {
          const ratio = (f + 1) / totalFrames;
          updateProgressUI(
            progressOffset + ratio * progressSpan,
            `Encoding Closing Routine Breakdown Card (${durationSec}s)... Keep this tab active.`
          );
          await new Promise(r => setTimeout(r, 0));
        }
      }
    };

    const TRIM_CONFIG = {
      leadInSeconds: 3.0,
      tailSeconds: 2.0,
      fadeInSeconds: 0.5
    };

    const getTrimmedWindow = (videoDur) => {
      const validTimestamps = [];
      for (let i = 0; i < routineData.skillsPerformed; i++) {
        if (routineData.skillTimestamps[i] > 0) {
          validTimestamps.push(routineData.skillTimestamps[i]);
        }
      }
      if (routineData.skillsPerformed === getMaxSkills(routineData.discipline) && routineData.landingTimestamp > 0) {
        validTimestamps.push(routineData.landingTimestamp);
      }

      if (validTimestamps.length === 0) {
        return { startTime: 0, endTime: videoDur, clipDuration: videoDur };
      }

      validTimestamps.sort((a, b) => a - b);
      const firstTs = validTimestamps[0];
      const lastTs = validTimestamps[validTimestamps.length - 1];

      const startTime = Math.max(0, firstTs - TRIM_CONFIG.leadInSeconds);
      const endTime = Math.min(videoDur, lastTs + TRIM_CONFIG.tailSeconds);
      const clipDuration = Math.max(0.1, endTime - startTime);

      return { startTime, endTime, clipDuration };
    };

    const renderVideoPass = async ({ drawOverlay, fadeInSec = TRIM_CONFIG.fadeInSeconds, progressOffset = 0, progressSpan = 100, labelPrefix = '' }) => {
      const fullDur = renderVideo.duration || 1;
      const { startTime, endTime, clipDuration } = getTrimmedWindow(fullDur);
      const totalFrames = Math.max(1, Math.ceil(clipDuration * FPS));

      for (let f = 0; f < totalFrames; f++) {
        if (isExportCancelled || encoderError || !activeExportVideo) return;

        const elapsedInClip = f / FPS;
        const curTime = Math.min(endTime, startTime + elapsedInClip);
        await seekVideoTo(curTime);
        if (isExportCancelled || encoderError || !activeExportVideo) return;

        const isEnded = (curTime >= endTime - (1 / FPS)) || (routineData.landingTimestamp > 0 && curTime >= (routineData.landingTimestamp + 1.8));

        ctx.drawImage(renderVideo, 0, 0, w, h);

        if (drawOverlay) {
          drawBurnedOverlays(ctx, w, h, curTime, isEnded, routineData);
        }

        drawBurnedWatermark(ctx, w, h, routineData.watermarkText);

        if (fadeInSec > 0 && elapsedInClip < fadeInSec) {
          const progress = elapsedInClip / fadeInSec;
          const alpha = Math.pow(1 - progress, 1.5);
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
          ctx.fillRect(0, 0, w, h);
        }

        await encodeCurrentCanvasFrame();

        if (f % 3 === 0 || f === totalFrames - 1) {
          const passRatio = (f + 1) / totalFrames;
          updateProgressUI(
            progressOffset + passRatio * progressSpan,
            `${labelPrefix} (${w}×${h}, MP4)... Keep this tab active.`
          );
          await new Promise(r => setTimeout(r, 0));
        }
      }
    };

    const renderBlackTransitionPass = async (fadeOutSec = 0.5, holdBlackSec = 1.0, progressOffset = 50, progressSpan = 4) => {
      const lastFrameCanvas = document.createElement('canvas');
      lastFrameCanvas.width = w;
      lastFrameCanvas.height = h;
      lastFrameCanvas.getContext('2d').drawImage(offscreenCanvas, 0, 0);

      const fadeFrames = Math.max(1, Math.round(fadeOutSec * FPS));
      const holdFrames = Math.max(1, Math.round(holdBlackSec * FPS));
      const totalFrames = fadeFrames + holdFrames;

      for (let f = 0; f < totalFrames; f++) {
        if (isExportCancelled || encoderError || !activeExportVideo) return;

        if (f < fadeFrames) {
          const alpha = Math.min(1, (f + 1) / fadeFrames);
          ctx.drawImage(lastFrameCanvas, 0, 0);
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, w, h);
        }

        await encodeCurrentCanvasFrame();

        if (f % 3 === 0 || f === totalFrames - 1) {
          const ratio = (f + 1) / totalFrames;
          updateProgressUI(
            progressOffset + ratio * progressSpan,
            'Transition: Fading to black (1s pause)... Keep this tab active.'
          );
          await new Promise(r => setTimeout(r, 0));
        }
      }
    };

    const useEndSlate = isEndSlateActive(routineData);

    if (!isTraining) {
      let offset = 0;
      let span = 100;
      if (useSlate) {
        await renderIntroSlatePass(routineData.slateDurationSec || 3, 0, 8);
        offset = 8;
        span -= 8;
      }
      if (useEndSlate) {
        span -= 10;
      }

      await renderVideoPass({
        drawOverlay: true,
        fadeInSec: TRIM_CONFIG.fadeInSeconds,
        progressOffset: offset,
        progressSpan: span,
        labelPrefix: `Encoding ${finalFileName}`
      });

      if (useEndSlate) {
        await renderEndSlatePass(routineData.endSlateDurationSec || 4, offset + span, 10);
      }
    } else {
      let pass1Offset = 0;
      let pass1Span = 48;
      if (useSlate) {
        await renderIntroSlatePass(routineData.slateDurationSec || 3, 0, 6);
        pass1Offset = 6;
        pass1Span = 44;
      }

      const pass2Span = useEndSlate ? 38 : 46;

      await renderVideoPass({
        drawOverlay: false,
        fadeInSec: TRIM_CONFIG.fadeInSeconds,
        progressOffset: pass1Offset,
        progressSpan: pass1Span,
        labelPrefix: `Pass 1/2: Clean Routine (${finalFileName})`
      });

      await renderBlackTransitionPass(0.5, 1.0, 50, 4);

      await renderVideoPass({
        drawOverlay: true,
        fadeInSec: 0.5,
        progressOffset: 54,
        progressSpan: pass2Span,
        labelPrefix: `Pass 2/2: Overlay Replay (${finalFileName})`
      });

      if (useEndSlate) {
        await renderEndSlatePass(routineData.endSlateDurationSec || 4, 54 + pass2Span, 8);
      }
    }

    if (encoderError) {
      try { if (videoEncoder.state !== 'closed') videoEncoder.close(); } catch (e) {}
      activeExportVideo = null;
      activeExportEncoder = null;
      throw encoderError;
    }

    if (!isExportCancelled) {
      updateProgressUI(100, 'Finalizing standard MP4 container...');
      await videoEncoder.flush();
      if (videoEncoder.state !== 'closed') videoEncoder.close();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: 'video/mp4' });

      activeExportVideo = null;
      activeExportEncoder = null;
      return { blob, fileName: finalFileName, mime: 'video/mp4' };
    }

    try { if (videoEncoder.state !== 'closed') videoEncoder.close(); } catch (e) {}
    activeExportVideo = null;
    activeExportEncoder = null;
    return null;
  }

  function buildSkillSliceFileName(routineData, skillIdx) {
    const rawVidName = sanitizeFileBaseName(
      routineData.rawVideoBaseName || routineData.outputBaseName,
      `Routine_${routineData.discipline}`
    );
    const skillPart = `Skill_${skillIdx + 1}`;
    const rawDD = String(routineData.skillDDs?.[skillIdx] || '').trim();
    const ddPart = rawDD ? `_DD_${sanitizeFileBaseName(rawDD, '')}` : '';
    const deductNum = Number(routineData.skillDeductions?.[skillIdx] || 0);
    const deductPart = `_Deduct_${deductNum.toFixed(1)}`;
    return `${rawVidName}_${skillPart}${ddPart}${deductPart}.mp4`;
  }

  async function renderIndividualSkillClips(routineData, progressMeta = null) {
    const performedCount = routineData.skillsPerformed || 0;
    if (performedCount <= 0) return [];

    const skillEntries = [];
    for (let i = 0; i < performedCount; i++) {
      const ts = Number(routineData.skillTimestamps?.[i] || 0);
      if (ts > 0) {
        skillEntries.push({ index: i, timestamp: ts });
      }
    }
    if (skillEntries.length === 0) return [];

    const pctLabel   = document.getElementById('exportPctLabel');
    const fillBar    = document.getElementById('exportProgressFill');
    const statusText = document.getElementById('exportStatusText');

    const renderVideo = document.createElement('video');
    renderVideo.src = routineData.videoObjectUrl;
    renderVideo.muted = true;
    renderVideo.volume = 0;
    renderVideo.playsInline = true;
    renderVideo.preload = 'auto';
    renderVideo.crossOrigin = 'anonymous';
    activeExportVideo = renderVideo;

    await new Promise((resolve, reject) => {
      renderVideo.onloadedmetadata = () => resolve();
      renderVideo.onerror = () => reject(new Error(`Failed to load video metadata for skill slicing.`));
    });

    if (isExportCancelled || !activeExportVideo) return [];

    const fullDur = renderVideo.duration || 1;
    const rawW = renderVideo.videoWidth || 1280;
    const rawH = renderVideo.videoHeight || 720;
    const { w, h } = getSafeEncoderDimensions(rawW, rawH, 1920);
    const encoderConfig = await getSupportedH264Config(w, h);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = w;
    offscreenCanvas.height = h;
    const ctx = offscreenCanvas.getContext('2d', { alpha: false });

    const FPS = 30;
    const FRAME_DURATION_US = Math.round(1_000_000 / FPS);

    const seekVideoTo = (targetTime) => {
      return new Promise((resolve) => {
        if (isExportCancelled || !activeExportVideo) return resolve();
        if (Math.abs(renderVideo.currentTime - targetTime) < 0.001 && renderVideo.readyState >= 2) {
          return resolve();
        }
        const onSeeked = () => {
          renderVideo.removeEventListener('seeked', onSeeked);
          resolve();
        };
        renderVideo.addEventListener('seeked', onSeeked, { once: true });
        renderVideo.currentTime = targetTime;
      });
    };

    const exportedClips = [];

    for (let sIdx = 0; sIdx < skillEntries.length; sIdx++) {
      if (isExportCancelled || !activeExportVideo) break;

      const entry = skillEntries[sIdx];
      const skillNumIdx = entry.index;

      let sliceStart;
      if (sIdx > 0) {
        sliceStart = Math.max(0, skillEntries[sIdx - 1].timestamp);
      } else {
        sliceStart = Math.max(0, entry.timestamp - 2.0);
      }
      const sliceEnd = Math.min(fullDur, entry.timestamp + 0.5);
      const sliceDur = Math.max(0.15, sliceEnd - sliceStart);
      const totalFrames = Math.max(1, Math.ceil(sliceDur * FPS));

      const sliceFileName = buildSkillSliceFileName(routineData, skillNumIdx);

      const singleSkillData = {
        ...routineData,
        skillsPerformed: skillNumIdx + 1,
        skillTimestamps: routineData.skillTimestamps.map((t, idx) => (idx === skillNumIdx ? t : 0)),
        landingTimestamp: 0
      };

      let encoderError = null;
      const muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: w, height: h },
        fastStart: 'in-memory'
      });

      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (err) => { encoderError = err; }
      });
      videoEncoder.configure(encoderConfig);
      activeExportEncoder = videoEncoder;

      for (let f = 0; f < totalFrames; f++) {
        if (isExportCancelled || encoderError || !activeExportVideo) break;

        const curTime = Math.min(sliceEnd, sliceStart + (f / FPS));
        await seekVideoTo(curTime);
        if (isExportCancelled || encoderError || !activeExportVideo) break;

        ctx.drawImage(renderVideo, 0, 0, w, h);
        drawBurnedOverlays(ctx, w, h, curTime, false, singleSkillData);
        drawBurnedWatermark(ctx, w, h, routineData.watermarkText);

        while (videoEncoder.encodeQueueSize > 8 && !isExportCancelled && !encoderError) {
          await new Promise(r => setTimeout(r, 5));
        }
        if (isExportCancelled || encoderError || videoEncoder.state !== 'configured') break;

        const frame = new VideoFrame(offscreenCanvas, {
          timestamp: f * FRAME_DURATION_US,
          duration: FRAME_DURATION_US
        });
        videoEncoder.encode(frame, { keyFrame: f % (FPS * 2) === 0 });
        frame.close();

        if (f % 4 === 0 || f === totalFrames - 1) {
          const clipRatio = (sIdx + (f + 1) / totalFrames) / skillEntries.length;
          const pct = Math.min(100, Math.round(clipRatio * 100));
          const prefixTag = progressMeta?.prefix ? `${progressMeta.prefix} ` : '';
          pctLabel.textContent = `${pct}%`;
          fillBar.style.width = `${pct}%`;
          statusText.textContent = `${prefixTag}Slicing Skill ${skillNumIdx + 1}/${performedCount} (${sliceFileName})...`;
          await new Promise(r => setTimeout(r, 0));
        }
      }

      if (!isExportCancelled && !encoderError) {
        await videoEncoder.flush();
        if (videoEncoder.state !== 'closed') videoEncoder.close();
        muxer.finalize();
        const { buffer } = muxer.target;
        exportedClips.push({
          blob: new Blob([buffer], { type: 'video/mp4' }),
          fileName: sliceFileName
        });
      } else {
        try { if (videoEncoder.state !== 'closed') videoEncoder.close(); } catch (e) {}
      }
      activeExportEncoder = null;
    }

    activeExportVideo = null;
    return exportedClips;
  }

  async function exportSingleRoutine(routineData, mode = 'standard', deliveryAction = 'download') {
    const isTraining = (mode === 'training');
    const modal      = document.getElementById('exportModal');
    const titleEl    = document.getElementById('exportModalTitle');
    const pctLabel   = document.getElementById('exportPctLabel');
    const fillBar    = document.getElementById('exportProgressFill');
    const statusText = document.getElementById('exportStatusText');

    isExportCancelled = false;
    titleEl.textContent = isTraining ? 'Creating Training Video (MP4)' : 'Rendering Burned MP4 Video';
    pctLabel.textContent = '0%';
    fillBar.style.width = '0%';
    statusText.textContent = 'Initializing H.264 MP4 encoder... Keep this tab active.';
    modal.classList.remove('hidden');

    try {
      const result = await renderRoutineToBlob(routineData, mode, null);
      if (!result || isExportCancelled) {
        modal.classList.add('hidden');
        return;
      }

      const jsonExport = buildRoutineFlatJsonPayload(routineData, mode, result.fileName);
      const csvExport = buildRoutineFlatCsvPayload(routineData, mode, result.fileName);

      if (deliveryAction === 'share') {
        const videoFile = new File([result.blob], result.fileName, { type: 'video/mp4' });
        triggerBlobDownload(jsonExport.blob, jsonExport.fileName);
        setTimeout(() => triggerBlobDownload(csvExport.blob, csvExport.fileName), 200);
        modal.classList.add('hidden');
        openShareReadyModal(videoFile);
      } else {
        triggerBlobDownload(result.blob, result.fileName);
        setTimeout(() => triggerBlobDownload(jsonExport.blob, jsonExport.fileName), 250);
        setTimeout(() => triggerBlobDownload(csvExport.blob, csvExport.fileName), 500);

        if (brandingState.sliceSkillsEnabled) {
          titleEl.textContent = 'Slicing Individual Skill Clips (MP4)';
          const skillClips = await renderIndividualSkillClips(routineData, null);
          for (let c = 0; c < skillClips.length; c++) {
            if (isExportCancelled) break;
            await new Promise(r => setTimeout(r, 250));
            triggerBlobDownload(skillClips[c].blob, skillClips[c].fileName);
          }
        }

        modal.classList.add('hidden');
        triggerFeedback('complete');
      }
    } catch (err) {
      modal.classList.add('hidden');
      if (!isExportCancelled) {
        console.error('Burned MP4 video export error:', err);
        alert('Unable to render MP4 video: ' + err.message);
      }
    }
  }

  async function startBatchExport(mode = 'standard') {
    if (batchQueue.length === 0) {
      alert("Your batch queue is empty. Add one or more routines first.");
      return;
    }

    if (typeof VideoEncoder === 'undefined' || typeof Mp4Muxer === 'undefined') {
      alert("Your browser does not support WebCodecs MP4 encoding. Please use Chrome, Edge, or Safari 16.4+.");
      return;
    }

    const isTraining = (mode === 'training');
    const modal      = document.getElementById('exportModal');
    const titleEl    = document.getElementById('exportModalTitle');
    const pctLabel   = document.getElementById('exportPctLabel');
    const fillBar    = document.getElementById('exportProgressFill');
    const statusText = document.getElementById('exportStatusText');

    isExportCancelled = false;
    const totalCount = batchQueue.length;
    titleEl.textContent = isTraining
      ? `Bulk Exporting ${totalCount} Training MP4${totalCount > 1 ? 's' : ''}`
      : `Bulk Exporting ${totalCount} Burned MP4${totalCount > 1 ? 's' : ''}`;
    pctLabel.textContent = '0%';
    fillBar.style.width = '0%';
    statusText.textContent = `Starting batch export of ${totalCount} routine(s)... Keep this tab active.`;
    modal.classList.remove('hidden');

    let exportedCount = 0;

    try {
      for (let i = 0; i < totalCount; i++) {
        if (isExportCancelled) break;
        const item = batchQueue[i];

        const result = await renderRoutineToBlob(item, mode, { index: i, total: totalCount });
        if (isExportCancelled || !result) break;

        triggerBlobDownload(result.blob, result.fileName);
        await new Promise(r => setTimeout(r, 250));
        const jsonExport = buildRoutineFlatJsonPayload(item, mode, result.fileName);
        triggerBlobDownload(jsonExport.blob, jsonExport.fileName);
        await new Promise(r => setTimeout(r, 250));
        const csvExport = buildRoutineFlatCsvPayload(item, mode, result.fileName);
        triggerBlobDownload(csvExport.blob, csvExport.fileName);

        if (brandingState.sliceSkillsEnabled) {
          titleEl.textContent = `Slicing Skill Clips (${i + 1}/${totalCount})`;
          const skillClips = await renderIndividualSkillClips(item, {
            prefix: `[Routine ${i + 1}/${totalCount}]`
          });
          for (let c = 0; c < skillClips.length; c++) {
            if (isExportCancelled) break;
            await new Promise(r => setTimeout(r, 250));
            triggerBlobDownload(skillClips[c].blob, skillClips[c].fileName);
          }
          titleEl.textContent = isTraining
            ? `Bulk Exporting ${totalCount} Training MP4${totalCount > 1 ? 's' : ''}`
            : `Bulk Exporting ${totalCount} Burned MP4${totalCount > 1 ? 's' : ''}`;
        }

        exportedCount++;

        if (i < totalCount - 1 && !isExportCancelled) {
          await new Promise(r => setTimeout(r, 450));
        }
      }

      modal.classList.add('hidden');
      if (!isExportCancelled && exportedCount > 0) {
        triggerFeedback('complete');
      }
    } catch (err) {
      modal.classList.add('hidden');
      if (!isExportCancelled) {
        console.error('Batch MP4 export error:', err);
        alert(`Batch export stopped after ${exportedCount} video(s): ` + err.message);
      }
    }
  }

  function cancelVideoExport() {
    isExportCancelled = true;
    if (activeExportEncoder) {
      try { if (activeExportEncoder.state !== 'closed') activeExportEncoder.close(); } catch (e) {}
      activeExportEncoder = null;
    }
    if (activeExportVideo) {
      try { activeExportVideo.pause(); } catch (e) {}
      activeExportVideo = null;
    }
    document.getElementById('exportModal').classList.add('hidden');
  }

  /* ==========================================================================
     PHASE 3: SYNCHRONIZED VIDEO PLAYBACK & OVERLAY STAGE (WITH INTRO & END SLATE)
     ========================================================================== */
  let overlayAnimFrameId = null;
  let lastAnimatedSkillKey = null;
  let introSlateTimerId = null;
  let isIntroSlatePlaying = false;

  function confirmAndEnterOverlayPlayback() {
    phase = 'overlay';
    reviewScreen.classList.add('hidden');
    judgingStage.classList.add('hidden');
    playbackOverlayStage.classList.remove('hidden');
    btnFinishRoutine.classList.add('hidden');
    skillCounter.classList.add('hidden');

    phaseBadge.textContent = 'Overlay Replay';
    phaseBadge.className = 'phase-badge badge-overlay';

    lastAnimatedSkillKey = null;
    renderRunningListItems();

    const maxSkills = getMaxSkills();
    const isLandingActive = (skillsPerformed === maxSkills);
    const { totalDeduct, netScore } = computeRoutineScores(
      currentDiscipline,
      skillsPerformed,
      skillDeductions,
      landingDeduction
    );

    document.getElementById('summaryCardNet').textContent = netScore.toFixed(1);
    document.getElementById('summaryCardDeduct').textContent = `Total Deductions: -${totalDeduct.toFixed(1)}`;
    document.getElementById('overlaySummaryCard').classList.remove('visible');
    document.getElementById('overlayEndNavBox').classList.remove('visible');
    document.getElementById('overlayEndSlate').classList.remove('visible');
    document.getElementById('overlayRightListPanel').classList.remove('visible');

    const wmEl = document.getElementById('overlayBottomLeftWatermark');
    const wmText = (brandingState.watermarkText || '').trim();
    if (wmEl) {
      if (wmText) {
        wmEl.textContent = wmText;
        wmEl.classList.remove('hidden');
      } else {
        wmEl.textContent = '';
        wmEl.classList.add('hidden');
      }
    }

    populateLiveEndSlateCard(totalDeduct, netScore, isLandingActive);

    playbackVideo.currentTime = 0;
    renderScrubberSkillDots();

    startPlaybackWithOptionalIntroSlate();

    startOverlaySyncLoop();
    triggerFeedback('complete');
  }

  function populateLiveEndSlateCard(totalDeduct, netScore, isLandingActive) {
    const discFull = getDisciplineFullName(currentDiscipline);
    const customTitle = (brandingState.slateTitle || '').trim();
    document.getElementById('endSlateKicker').textContent = `${discFull} • ROUTINE SUMMARY`;
    document.getElementById('endSlateTitle').textContent = customTitle || 'Routine Execution Breakdown';
    document.getElementById('endSlateSubMeta').textContent = `${skillsPerformed} Skill${skillsPerformed === 1 ? '' : 's'}${isLandingActive ? ' + Landing' : ' (Incomplete Routine)'}`;
    document.getElementById('endSlateNetScore').textContent = netScore.toFixed(1);
    document.getElementById('endSlateTotalDeduct').textContent = `Deductions: -${totalDeduct.toFixed(1)}`;

    const gridEl = document.getElementById('endSlateGrid');
    gridEl.innerHTML = '';

    for (let i = 0; i < skillsPerformed; i++) {
      const ddStr = (skillDDs[i] || '').trim();
      const faultsArr = Array.isArray(skillFaults[i]) ? skillFaults[i] : [];
      const val = skillDeductions[i] || 0;
      const valCol = getDeductionBadgeColor(val);

      const row = document.createElement('div');
      row.className = 'end-slate-row';
      row.innerHTML = `
        <div class="end-slate-row-left">
          <span class="end-slate-sk-name">Skill ${i + 1}</span>
          ${ddStr ? `<span class="end-slate-dd-tag">${escapeHtml(ddStr)}</span>` : ''}
        </div>
        <div class="end-slate-row-right">
          ${faultsArr.length > 0 ? `<span class="end-slate-faults">${escapeHtml(faultsArr.join(' • '))}</span>` : ''}
          <span class="end-slate-val" style="color:${valCol};">-${val.toFixed(1)}</span>
        </div>
      `;
      gridEl.appendChild(row);
    }

    if (isLandingActive) {
      const lFaults = Array.isArray(landingFaults) ? landingFaults : [];
      const lCol = getDeductionBadgeColor(landingDeduction);
      const lRow = document.createElement('div');
      lRow.className = 'end-slate-row landing-highlight';
      lRow.innerHTML = `
        <div class="end-slate-row-left">
          <span class="end-slate-sk-name" style="color:var(--fig-pink);">Landing</span>
        </div>
        <div class="end-slate-row-right">
          ${lFaults.length > 0 ? `<span class="end-slate-faults">${escapeHtml(lFaults.join(' • '))}</span>` : ''}
          <span class="end-slate-val" style="color:${lCol};">-${landingDeduction.toFixed(1)}</span>
        </div>
      `;
      gridEl.appendChild(lRow);
    }
  }

  function clearIntroSlatePlayback() {
    if (introSlateTimerId) {
      clearTimeout(introSlateTimerId);
      introSlateTimerId = null;
    }
    isIntroSlatePlaying = false;
    const slateEl = document.getElementById('overlayIntroSlate');
    if (slateEl) slateEl.classList.remove('visible');
  }

  function startPlaybackWithOptionalIntroSlate() {
    clearIntroSlatePlayback();
    const slateEl = document.getElementById('overlayIntroSlate');

    if (isIntroSlateActive()) {
      isIntroSlatePlaying = true;
      document.getElementById('overlaySlateDisc').textContent = `${getDisciplineFullName(currentDiscipline)} • JUDGE EDUCATION`;
      document.getElementById('overlaySlateTitle').textContent = (brandingState.slateTitle || '').trim();
      const subEl = document.getElementById('overlaySlateSubtitle');
      const subText = (brandingState.slateSubtitle || '').trim();
      subEl.textContent = subText;
      subEl.style.display = subText ? 'block' : 'none';

      slateEl.classList.add('visible');
      playbackVideo.pause();
      document.getElementById('pbPlayIcon').textContent = '⏸️';

      const durationMs = (brandingState.slateDurationSec || 3) * 1000;
      introSlateTimerId = setTimeout(() => {
        introSlateTimerId = null;
        isIntroSlatePlaying = false;
        slateEl.classList.remove('visible');
        playbackVideo.play().catch(() => {});
        document.getElementById('pbPlayIcon').textContent = '⏸️';
      }, durationMs);
    } else {
      playbackVideo.play().catch(() => {});
      document.getElementById('pbPlayIcon').textContent = '⏸️';
    }
  }

  function restartOverlayPlayback() {
    lastAnimatedSkillKey = null;
    document.getElementById('overlaySummaryCard').classList.remove('visible');
    document.getElementById('overlayEndNavBox').classList.remove('visible');
    document.getElementById('overlayEndSlate').classList.remove('visible');
    document.getElementById('overlayRightListPanel').classList.remove('visible');
    playbackVideo.currentTime = 0;
    startPlaybackWithOptionalIntroSlate();
  }

  function renderScrubberSkillDots() {
    const dotsLayer = document.getElementById('scrubberDotsLayer');
    if (!dotsLayer) return;
    dotsLayer.innerHTML = '';

    const dur = playbackVideo.duration;
    if (!dur || isNaN(dur) || dur <= 0) return;

    for (let i = 0; i < skillsPerformed; i++) {
      const ts = skillTimestamps[i];
      if (ts > 0 && ts <= dur) {
        const pct = Math.min(100, Math.max(0, (ts / dur) * 100));
        const dot = document.createElement('div');
        dot.className = 'scrubber-skill-dot';
        dot.style.left = `${pct}%`;
        dotsLayer.appendChild(dot);
      }
    }

    const maxSkills = getMaxSkills();
    if (skillsPerformed === maxSkills && landingTimestamp > 0 && landingTimestamp <= dur) {
      const pct = Math.min(100, Math.max(0, (landingTimestamp / dur) * 100));
      const dot = document.createElement('div');
      dot.className = 'scrubber-skill-dot';
      dot.style.left = `${pct}%`;
      dot.style.backgroundColor = 'var(--fig-pink)';
      dotsLayer.appendChild(dot);
    }
  }

  playbackVideo.addEventListener('loadedmetadata', () => {
    if (phase === 'overlay') {
      renderScrubberSkillDots();
    }
  });

  function renderRunningListItems() {
    const listPanel = document.getElementById('overlayRightListPanel');
    listPanel.innerHTML = '';

    for (let i = 0; i < skillsPerformed; i++) {
      const ddStr = (skillDDs[i] || '').trim();
      const labelText = ddStr ? `Skill ${i + 1} (${ddStr})` : `Skill ${i + 1}`;
      const faultsArr = skillFaults[i] || [];
      const faultsText = faultsArr.join(' • ');

      const item = document.createElement('div');
      item.className = 'running-list-item';
      item.innerHTML = `
        <span class="item-skill-lbl">${escapeHtml(labelText)}</span>
        <span class="item-right-group">
          ${faultsText ? `<span class="item-faults-lbl">${escapeHtml(faultsText)}</span>` : ''}
          <span class="item-deduct-val">-${skillDeductions[i].toFixed(1)}</span>
        </span>
      `;
      item.onclick = () => {
        clearIntroSlatePlayback();
        playbackVideo.currentTime = Math.max(0, skillTimestamps[i] - 0.5);
      };
      listPanel.appendChild(item);
    }

    const maxSkills = getMaxSkills();
    if (skillsPerformed === maxSkills) {
      const lFaultsText = (landingFaults || []).join(' • ');
      const lItem = document.createElement('div');
      lItem.className = 'running-list-item';
      lItem.style.borderColor = 'var(--fig-pink)';
      lItem.innerHTML = `
        <span class="item-skill-lbl" style="color:var(--fig-pink);">Landing</span>
        <span class="item-right-group">
          ${lFaultsText ? `<span class="item-faults-lbl">${escapeHtml(lFaultsText)}</span>` : ''}
          <span class="item-deduct-val">-${landingDeduction.toFixed(1)}</span>
        </span>
      `;
      lItem.onclick = () => {
        clearIntroSlatePlayback();
        playbackVideo.currentTime = Math.max(0, landingTimestamp - 0.5);
      };
      listPanel.appendChild(lItem);
    }
  }

  function startOverlaySyncLoop() {
    if (overlayAnimFrameId) cancelAnimationFrame(overlayAnimFrameId);

    const scrubber    = document.getElementById('pbScrubber');
    const timeDisp    = document.getElementById('pbTimeDisplay');
    const stackEl     = document.getElementById('overlayTopRightStack');
    const badge       = document.getElementById('overlayTopRightBadge');
    const badgeSkill  = document.getElementById('overlayBadgeSkill');
    const badgeVal    = document.getElementById('overlayBadgeVal');
    const badgeFaults = document.getElementById('overlayBadgeFaults');
    const badgeDD     = document.getElementById('overlayBadgeDD');
    const listPanel   = document.getElementById('overlayRightListPanel');
    const summaryCard = document.getElementById('overlaySummaryCard');
    const endNavBox   = document.getElementById('overlayEndNavBox');
    const endSlateEl  = document.getElementById('overlayEndSlate');

    const updateFrame = () => {
      if (phase !== 'overlay') return;

      const cur = playbackVideo.currentTime || 0;
      const dur = playbackVideo.duration || 1;
      const isEnded = playbackVideo.ended || (dur > 0 && cur >= dur - 0.15);

      scrubber.value = (cur / dur) * 100;
      timeDisp.textContent = `${formatTime(cur).split('.')[0]} / ${formatTime(dur).split('.')[0]}`;

      const activeEvent = isIntroSlatePlaying ? null : getActiveOverlayEvent(cur);

      if (activeEvent) {
        if (lastAnimatedSkillKey !== activeEvent.key) {
          lastAnimatedSkillKey = activeEvent.key;
          stackEl.classList.remove('skill-pop-anim');
          void stackEl.offsetWidth;
          stackEl.classList.add('skill-pop-anim');
        }

        const badgeColor = getDeductionBadgeColor(activeEvent.val);
        badgeSkill.textContent = activeEvent.label;
        badgeVal.textContent = `-${activeEvent.val.toFixed(1)}`;
        badgeVal.style.color = badgeColor;
        badge.style.borderColor = badgeColor;
        badge.classList.add('visible');

        if (activeEvent.faults && activeEvent.faults.length > 0) {
          badgeFaults.textContent = activeEvent.faults.join(' • ');
          badgeFaults.classList.remove('hidden');
        } else {
          badgeFaults.textContent = '';
          badgeFaults.classList.add('hidden');
        }

        if (activeEvent.dd) {
          badgeDD.textContent = activeEvent.dd;
          badgeDD.classList.add('visible');
        } else {
          badgeDD.textContent = '';
          badgeDD.classList.remove('visible');
        }
      } else {
        lastAnimatedSkillKey = null;
        badge.classList.remove('visible');
        badgeFaults.classList.add('hidden');
        badgeDD.classList.remove('visible');
        stackEl.classList.remove('skill-pop-anim');
      }

      const showEndSlateNow = !isIntroSlatePlaying && isEnded && isEndSlateActive();
      if (showEndSlateNow) {
        endSlateEl.classList.add('visible');
        listPanel.classList.remove('visible');
        summaryCard.classList.remove('visible');
      } else {
        endSlateEl.classList.remove('visible');
        if (!isIntroSlatePlaying && shouldShowRunningList(cur, isEnded)) {
          listPanel.classList.add('visible');
        } else {
          listPanel.classList.remove('visible');
        }

        if (!isIntroSlatePlaying && isEnded) {
          summaryCard.classList.add('visible');
        } else {
          summaryCard.classList.remove('visible');
        }
      }

      if (!isIntroSlatePlaying && isEnded) {
        endNavBox.classList.add('visible');
      } else {
        endNavBox.classList.remove('visible');
      }

      overlayAnimFrameId = requestAnimationFrame(updateFrame);
    };

    overlayAnimFrameId = requestAnimationFrame(updateFrame);
  }

  function togglePlayPausePlayback() {
    if (isIntroSlatePlaying) {
      clearIntroSlatePlayback();
      playbackVideo.play().catch(() => {});
      document.getElementById('pbPlayIcon').textContent = '⏸️';
      return;
    }

    if (playbackVideo.paused) {
      if (playbackVideo.ended) {
        restartOverlayPlayback();
        return;
      }
      playbackVideo.play();
      document.getElementById('pbPlayIcon').textContent = '⏸️';
    } else {
      playbackVideo.pause();
      document.getElementById('pbPlayIcon').textContent = '▶';
    }
  }

  function scrubPlaybackVideo(val) {
    clearIntroSlatePlayback();
    const dur = playbackVideo.duration || 1;
    playbackVideo.currentTime = (val / 100) * dur;
  }

  function exitOverlayToReview() {
    clearIntroSlatePlayback();
    if (overlayAnimFrameId) cancelAnimationFrame(overlayAnimFrameId);
    playbackVideo.pause();
    enterReviewPhase();
  }

  /* ==========================================================================
     GLOBAL RESET & FULLSCREEN
     ========================================================================== */
  function resetToSetup() {
    clearPendingRecognizerState();
    clearIntroSlatePlayback();
    if (overlayAnimFrameId) cancelAnimationFrame(overlayAnimFrameId);
    judgingVideo.pause();
    playbackVideo.pause();

    phase = 'setup';
    setupScreen.classList.remove('hidden');
    judgingStage.classList.add('hidden');
    reviewScreen.classList.add('hidden');
    playbackOverlayStage.classList.add('hidden');
    btnFinishRoutine.classList.add('hidden');
    skillCounter.classList.add('hidden');

    phaseBadge.textContent = 'Setup Video';
    phaseBadge.className = 'phase-badge badge-setup';
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  /* ==========================================================================
     SECTION 7: BATCH CSV SYNC & SPACEBAR WAVE ANCHOR ENGINE
     ========================================================================== */
  const batchSyncState = {
    routines: [],
    videoFiles: [],
    selectedIndex: -1,
    activeVideoUrl: null,
    wave: null,
    scanToken: 0,
    scanCache: new Map(),
    dragTarget: null,
    speeds: [1.0, 1.5, 2.0, 0.5],
    speedIndex: 1
  };

  function isObjectUrlInBatchSync(url) {
    return Boolean(url) && (
      batchSyncState.activeVideoUrl === url ||
      batchSyncState.routines.some(r => r.videoObjectUrl === url)
    );
  }

  const bsVideo        = document.getElementById('bsVideoPlayer');
  const bsWaveCanvas   = document.getElementById('bsWaveCanvas');
  const bsWaveCtx      = bsWaveCanvas ? bsWaveCanvas.getContext('2d') : null;
  const bsProcCanvas   = document.getElementById('bsProcCanvas');
  const bsProcCtx      = bsProcCanvas ? bsProcCanvas.getContext('2d', { willReadFrequently: true }) : null;
  const bsRoutineList  = document.getElementById('bsRoutineList');
  const bsSkillsStrip  = document.getElementById('bsSkillsStrip');
  const bsAnchorBanner = document.getElementById('bsAnchorBanner');
  const bsAnchorPrompt = document.getElementById('bsAnchorPrompt');
  const bsBtnMarkSkill1 = document.getElementById('bsBtnMarkSkill1');
  const bsBtnSpeed      = document.getElementById('bsBtnSpeed');
  const bsBtnQueueRoutine = document.getElementById('bsBtnQueueRoutine');

	function resizeHiDPICanvas(canvas) {
    if (!canvas) return { width: 900, height: 135, dpr: 1 };
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const displayW = Math.max(1, Math.round(rect.width || 900));
    const displayH = Math.max(1, Math.round(rect.height || 135));
    const targetW = Math.round(displayW * dpr);
    const targetH = Math.round(displayH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return { width: displayW, height: displayH, dpr };
  }

  function bsNormalizeKey(name) {
    return String(name || '').toLowerCase().replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/g, '');
  }

  function bsSplitList(val) {
    if (!val) return [];
    return String(val).split(/[;|,]/).map(s => s.trim()).filter(Boolean);
  }

  function bsParseOneRowCsv(text) {
    const rows = parseCsvRows(text);
    if (rows.length < 2) return [];
    const rawHeaders = rows[0];
    const normHeaders = rawHeaders.map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

    const findCol = (...candidates) => {
      for (const cand of candidates) {
        const idx = normHeaders.indexOf(cand);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colVid = findCol('videofilename', 'video', 'filename', 'file', 'sourcevideoname');
    const colOut = findCol('outputfilename', 'output', 'exportname');
    const colDisc = findCol('discipline', 'disc');
    const colTitle = findCol('title', 'slatetitle', 'routine');
    const colSub = findCol('subtitle', 'slatesubtitle', 'instructions');
    const colLandDed = findCol('landingdeduction', 'landingded', 'landing');
    const colLandFault = findCol('landingfaults', 'landingfault');

    const skillDedCols = [];
    const skillDdCols = [];
    const skillFaultCols = [];
    for (let s = 1; s <= 10; s++) {
      skillDedCols[s] = findCol(`s${s}deduction`, `s${s}ded`, `skill${s}deduction`, `skill${s}`);
      skillDdCols[s] = findCol(`s${s}dd`, `skill${s}dd`);
      skillFaultCols[s] = findCol(`s${s}faults`, `s${s}fault`, `skill${s}faults`);
    }

    const routines = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const videoFileName = colVid !== -1 ? (row[colVid] || '').trim() : '';
      if (!videoFileName) continue;

      const discRaw = colDisc !== -1 ? (row[colDisc] || '').trim().toUpperCase() : 'TRP';
      const discipline = ['TRP', 'DMT', 'TUM'].includes(discRaw) ? discRaw : 'TRP';
      const maxSk = getMaxSkills(discipline);

      const skills = [];
      for (let s = 1; s <= maxSk; s++) {
        const dedRaw = skillDedCols[s] !== -1 ? row[skillDedCols[s]] : '';
        const ddRaw = skillDdCols[s] !== -1 ? row[skillDdCols[s]] : '';
        const fltRaw = skillFaultCols[s] !== -1 ? row[skillFaultCols[s]] : '';

        if (s > 1 && String(dedRaw || '').trim() === '' && String(ddRaw || '').trim() === '' && String(fltRaw || '').trim() === '') {
          continue;
        }
        const dedNum = parseFloat(dedRaw);
        skills.push({
          skillNumber: s,
          deduction: isNaN(dedNum) ? 0 : Math.abs(dedNum),
          dd: String(ddRaw || '').trim(),
          faults: bsSplitList(fltRaw),
          timestampSec: null
        });
      }

      const landNum = colLandDed !== -1 ? parseFloat(row[colLandDed]) : NaN;
      const landingDeduction = isNaN(landNum) ? 0 : Math.abs(landNum);
      const landingFaultsArr = colLandFault !== -1 ? bsSplitList(row[colLandFault]) : [];
      const rawBase = videoFileName.replace(/\.[^/.]+$/, '');
      const outName = colOut !== -1 && (row[colOut] || '').trim()
        ? (row[colOut] || '').trim().replace(/\.mp4$/i, '')
        : `${rawBase}_${discipline}`;

      routines.push({
        id: `bs_${r}_${Date.now()}`,
        videoFileName,
        rawVideoBaseName: rawBase,
        outputBaseName: outName,
        discipline,
        title: colTitle !== -1 ? (row[colTitle] || '').trim() : '',
        subtitle: colSub !== -1 ? (row[colSub] || '').trim() : '',
        skills,
        landingDeduction,
        landingFaults: landingFaultsArr,
        landingTimestamp: null,
        videoFile: null,
        videoObjectUrl: null,
        status: 'unmatched'
      });
    }
    return routines;
  }

  function downloadBatchSampleCsv() {
    const sample = [
      'VideoFileName,Discipline,Title,Subtitle,S1_DD,S1_Deduction,S1_Faults,S2_DD,S2_Deduction,S2_Faults,S3_DD,S3_Deduction,S3_Faults,S4_DD,S4_Deduction,S4_Faults,S5_DD,S5_Deduction,S5_Faults,S6_DD,S6_Deduction,S6_Faults,S7_DD,S7_Deduction,S7_Faults,S8_DD,S8_Deduction,S8_Faults,S9_DD,S9_Deduction,S9_Faults,S10_DD,S10_Deduction,S10_Faults,Landing_Deduction,Landing_Faults',
      'Routine_01.mp4,TRP,TRP National Level 5 - Pass 1,Execution Judging Exercise,40/,0.1,Legs,41o,0.2,Shape;Opening,40<,0.0,,42/,0.2,Twist,40o,0.1,Keeping,41<,0.3,Legs;Arms,800/,0.2,Opening,40/,0.1,,801o,0.2,Shape,822/,0.3,Twist;Legs,0.2,Step',
      'Routine_02.mp4,TRP,TRP National Level 5 - Pass 2,Execution Judging Exercise,41/,0.0,,40<,0.1,Shape,42o,0.2,Legs,40/,0.1,,800<,0.2,Opening,41o,0.1,Arms,40/,0.0,,801/,0.2,Twist,42<,0.3,Shape;Legs,831/,0.2,Opening,0.1,Arm'
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv' });
    triggerBlobDownload(blob, 'Batch_Routines_Master_Template.csv');
  }

  function bsMatchVideos() {
    let matchedCount = 0;
    for (const r of batchSyncState.routines) {
      const targetKey = bsNormalizeKey(r.videoFileName);
      const exact = batchSyncState.videoFiles.find(f => f.name.toLowerCase() === r.videoFileName.toLowerCase());
      const fuzzy = exact || batchSyncState.videoFiles.find(f => {
        const fk = bsNormalizeKey(f.name);
        return fk === targetKey || fk.includes(targetKey) || targetKey.includes(fk);
      });
      r.videoFile = fuzzy || null;
      if (r.videoFile) {
        matchedCount++;
        if (r.status === 'unmatched') r.status = 'ready';
      } else {
        r.status = 'unmatched';
      }
    }
    const matchCountEl = document.getElementById('bsMatchCount');
    if (matchCountEl) matchCountEl.textContent = `${matchedCount} / ${batchSyncState.routines.length}`;
    bsRenderRoutineList();
    if (batchSyncState.selectedIndex === -1 && batchSyncState.routines.length > 0) {
      const firstReady = batchSyncState.routines.findIndex(r => r.videoFile);
      bsSelectRoutine(firstReady !== -1 ? firstReady : 0);
    }
  }

  function bsRenderRoutineList() {
    if (!bsRoutineList) return;
    if (!batchSyncState.routines.length) {
      bsRoutineList.innerHTML = `<div style="font-size:0.78rem; color:var(--text-sub); padding:6px;">Load a Master CSV and matching video files to begin.</div>`;
      return;
    }
    bsRoutineList.innerHTML = '';
    batchSyncState.routines.forEach((r, idx) => {
      const div = document.createElement('div');
      div.className = 'bs-routine-item' + (idx === batchSyncState.selectedIndex ? ' selected' : '');
      const statusMap = {
        unmatched: ['No Video', 'bs-st-unmatched'],
        ready: ['Ready', 'bs-st-ready'],
        scanned: ['Wave Ready', 'bs-st-scanned'],
        queued: ['Queued ✓', 'bs-st-queued']
      };
      const [stText, stClass] = statusMap[r.status] || statusMap.ready;
      const skillDeds = r.skills.map(s => s.deduction);
      const { netScore } = computeRoutineScores(r.discipline, r.skills.length, skillDeds, r.landingDeduction);
      div.innerHTML = `
        <div style="min-width:0;">
          <div style="font-weight:700; font-size:0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.title || r.videoFileName)}</div>
          <div class="meta">${escapeHtml(r.discipline)} • ${r.skills.length} skills • E: ${netScore.toFixed(1)}</div>
        </div>
        <span class="bs-status-pill ${stClass}">${stText}</span>
      `;
      div.onclick = () => bsSelectRoutine(idx);
      bsRoutineList.appendChild(div);
    });
  }

  async function bsSelectRoutine(idx) {
    batchSyncState.selectedIndex = idx;
    batchSyncState.wave = null;
    batchSyncState.dragTarget = null;
    bsRenderRoutineList();

    const r = batchSyncState.routines[idx];
    if (!r) return;

    const hudTitleBox = document.getElementById('bsHudTitleBox');
    const hudScoreBox = document.getElementById('bsHudScoreBox');
    const hudTitle = document.getElementById('bsHudTitle');
    const hudSub = document.getElementById('bsHudSubtitle');
    const hudScore = document.getElementById('bsHudScore');

    if (hudTitleBox) hudTitleBox.style.display = 'block';
    if (hudScoreBox) hudScoreBox.style.display = 'block';
    if (hudTitle) hudTitle.textContent = r.title || r.videoFileName;
    if (hudSub) hudSub.textContent = `${r.discipline} • ${r.skills.length} Skills${r.subtitle ? ' • ' + r.subtitle : ''}`;

    const { netScore } = computeRoutineScores(
      r.discipline,
      r.skills.length,
      r.skills.map(s => s.deduction),
      r.landingDeduction
    );
    if (hudScore) hudScore.textContent = netScore.toFixed(1);

    bsRenderSkillsStrip();

    if (!r.videoFile) {
      if (bsBtnMarkSkill1) bsBtnMarkSkill1.disabled = true;
      if (bsBtnSpeed) bsBtnSpeed.disabled = true;
      if (bsBtnQueueRoutine) bsBtnQueueRoutine.disabled = true;
      document.getElementById('bsWaveInfo').textContent = `Missing video file: ${r.videoFileName}`;
      bsDrawWave();
      return;
    }

    if (!r.videoObjectUrl) {
      r.videoObjectUrl = URL.createObjectURL(r.videoFile);
    }
    batchSyncState.activeVideoUrl = r.videoObjectUrl;
    bsVideo.src = r.videoObjectUrl;
    bsVideo.playbackRate = batchSyncState.speeds[batchSyncState.speedIndex];

    if (bsBtnMarkSkill1) bsBtnMarkSkill1.disabled = false;
    if (bsBtnSpeed) bsBtnSpeed.disabled = false;
    if (bsBtnQueueRoutine) bsBtnQueueRoutine.disabled = false;
    bsUpdateAnchorBanner();

    await new Promise(res => {
      if (bsVideo.readyState >= 1) return res();
      bsVideo.onloadedmetadata = () => res();
    });

    bsVideo.play().catch(() => {});

    const cacheKey = `${r.videoFile.name}_${r.videoFile.size}`;
    if (batchSyncState.scanCache.has(cacheKey)) {
      batchSyncState.wave = batchSyncState.scanCache.get(cacheKey);
      if (r.status === 'ready') r.status = 'scanned';
      bsRenderRoutineList();
      document.getElementById('bsWaveInfo').textContent = `${batchSyncState.wave.troughs.length} landing troughs detected (cached)`;
      bsDrawWave();
    } else {
      await bsBuildCentroidWaveProgressive(r.videoFile, cacheKey);
    }
  }

  async function bsBuildCentroidWaveProgressive(file, cacheKey) {
    const token = ++batchSyncState.scanToken;
    const progBar = document.getElementById('bsScanProgress');
    const progFill = document.getElementById('bsScanProgressFill');
    const waveInfo = document.getElementById('bsWaveInfo');

    progBar.classList.add('active');
    progFill.style.width = '0%';
    waveInfo.textContent = 'Scanning motion wave in background... Press SPACEBAR on Skill 1 anytime';

    const scanVid = document.createElement('video');
    scanVid.muted = true;
    scanVid.playsInline = true;
    scanVid.preload = 'auto';
    const scanUrl = URL.createObjectURL(file);
    scanVid.src = scanUrl;

    await new Promise(res => { scanVid.onloadedmetadata = () => res(); });
    const duration = scanVid.duration || 1;
    const sampleRate = 15;
    const dt = 1 / sampleRate;
    const totalSteps = Math.max(1, Math.floor(duration * sampleRate));

    const w = bsProcCanvas.width;
    const h = bsProcCanvas.height;
    let prevGray = null;
    const rawSamples = [];
    const waveObj = { duration, samples: [], troughs: [], isPartial: true };
    batchSyncState.wave = waveObj;

    const finalizeWave = (samplesArr) => {
      const smoothed = samplesArr.map((s, idx, arr) => {
        let sum = 0, cnt = 0;
        for (let k = -2; k <= 2; k++) {
          if (arr[idx + k]) { sum += arr[idx + k].y; cnt++; }
        }
        return { t: s.t, y: sum / (cnt || 1) };
      });
      const troughs = [];
      for (let i = 3; i < smoothed.length - 3; i++) {
        const cur = smoothed[i].y;
        if (
          cur <= smoothed[i - 1].y &&
          cur < smoothed[i + 1].y &&
          cur <= smoothed[i - 2].y &&
          cur <= smoothed[i + 2].y &&
          cur < 0.72
        ) {
          const prevTrough = troughs[troughs.length - 1];
          if (!prevTrough || (smoothed[i].t - prevTrough.t) >= 0.75) {
            troughs.push({ t: smoothed[i].t, y: cur });
          } else if (cur < prevTrough.y) {
            troughs[troughs.length - 1] = { t: smoothed[i].t, y: cur };
          }
        }
      }
      return { smoothed, troughs };
    };

    for (let i = 0; i < totalSteps; i++) {
      if (token !== batchSyncState.scanToken) {
        URL.revokeObjectURL(scanUrl);
        return;
      }
      const t = Math.min(duration - 0.01, i * dt);
      scanVid.currentTime = t;
      await new Promise(res => {
        const onSeek = () => { scanVid.removeEventListener('seeked', onSeek); res(); };
        scanVid.addEventListener('seeked', onSeek);
        setTimeout(res, 120);
      });

      bsProcCtx.drawImage(scanVid, 0, 0, w, h);
      const img = bsProcCtx.getImageData(0, 0, w, h).data;
      const gray = new Float32Array(w * h);
      for (let p = 0, px = 0; p < img.length; p += 4, px++) {
        gray[px] = 0.299 * img[p] + 0.587 * img[p + 1] + 0.114 * img[p + 2];
      }

      let centroidY = 0.5;
      if (prevGray) {
        let weightSum = 0, yWeightSum = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const diff = Math.abs(gray[idx] - prevGray[idx]);
            if (diff > 18) {
              weightSum += diff;
              yWeightSum += diff * (1 - y / h);
            }
          }
        }
        if (weightSum > 250) {
          centroidY = yWeightSum / weightSum;
        } else if (rawSamples.length > 0) {
          centroidY = rawSamples[rawSamples.length - 1].y;
        }
      }
      prevGray = gray;
      rawSamples.push({ t, y: centroidY });

      if (i % 12 === 0) {
        const { smoothed, troughs } = finalizeWave(rawSamples);
        waveObj.samples = smoothed;
        waveObj.troughs = troughs;
        progFill.style.width = `${Math.round((i / totalSteps) * 100)}%`;
        bsDrawWave();
      }
    }

    URL.revokeObjectURL(scanUrl);
    progBar.classList.remove('active');

    const { smoothed, troughs } = finalizeWave(rawSamples);
    const waveData = { duration, samples: smoothed, troughs, isPartial: false };
    batchSyncState.scanCache.set(cacheKey, waveData);
    batchSyncState.wave = waveData;

    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    if (r) {
      if (r.skills[0]?.timestampSec != null) {
        bsApplySingleSkill1Anchor(r.skills[0].timestampSec);
      }
      if (r.status === 'ready') r.status = 'scanned';
      bsRenderRoutineList();
    }
    waveInfo.textContent = `${troughs.length} landing troughs detected`;
    bsDrawWave();
  }

  function bsFindNearestTrough(targetT, maxSearchWindowSec = 1.4) {
    const wave = batchSyncState.wave;
    if (!wave || !wave.troughs || !wave.troughs.length) return null;
    let best = null;
    let bestDiff = Infinity;
    for (const tr of wave.troughs) {
      const diff = Math.abs(tr.t - targetT);
      if (diff <= maxSearchWindowSec && diff < bestDiff) {
        bestDiff = diff;
        best = tr;
      }
    }
    return best;
  }

  function bsApplySingleSkill1Anchor(rawT) {
    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    if (!r) return;

    const duration = bsVideo.duration || (batchSyncState.wave ? batchSyncState.wave.duration : 60);
    const wave = batchSyncState.wave;
    const n = r.skills.length;

    let skill1Time = rawT;
    let snappedIdx = -1;

    if (wave && wave.troughs && wave.troughs.length > 0) {
      const nearestTrough = bsFindNearestTrough(rawT, 1.4);
      if (nearestTrough) {
        skill1Time = nearestTrough.t;
        snappedIdx = wave.troughs.indexOf(nearestTrough);
      }
    }

    r.skills[0].timestampSec = Math.max(0.1, Math.min(duration - 0.5, skill1Time));

    let prevTime = r.skills[0].timestampSec;
    for (let i = 1; i < n; i++) {
      let nextTime = null;
      if (snappedIdx !== -1 && wave && wave.troughs && (snappedIdx + i) < wave.troughs.length) {
        const candidateT = wave.troughs[snappedIdx + i].t;
        if (candidateT > prevTime + 0.45 && candidateT < duration - 0.3) {
          nextTime = candidateT;
        }
      }
      if (nextTime === null) {
        nextTime = Math.min(duration - 0.3, prevTime + 1.55);
      }
      r.skills[i].timestampSec = nextTime;
      prevTime = nextTime;
    }

    r.landingTimestamp = Math.min(duration - 0.1, prevTime + 3.0);

    bsUpdateAnchorBanner();
    bsRenderSkillsStrip();
    bsDrawWave();
  }

  function bsMarkSkill1Now() {
    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    if (!r || !r.videoFile) return;
    bsApplySingleSkill1Anchor(bsVideo.currentTime || 0.2);
    triggerFeedback('tap');
  }

  function bsUpdateAnchorBanner() {
    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    if (!r || !bsAnchorBanner || !bsAnchorPrompt) return;
    if (r.skills[0]?.timestampSec == null) {
      bsAnchorBanner.className = 'bs-anchor-banner pending';
      bsAnchorPrompt.innerHTML = `Press <strong>SPACEBAR</strong> on Skill 1 anytime — S1 snaps uniformly to its closest purple dot, S2–S10 snap to subsequent dots, Landing = +3.0s.`;
    } else {
      bsAnchorBanner.className = 'bs-anchor-banner done';
      bsAnchorPrompt.innerHTML = `✓ Skill 1 anchored at <strong>${r.skills[0].timestampSec.toFixed(2)}s</strong> • Landing at <strong>${(r.landingTimestamp || 0).toFixed(2)}s</strong> (+3.0s) — Press SPACEBAR again to re-snap or drag markers below.`;
    }
  }

  function bsRenderSkillsStrip() {
    if (!bsSkillsStrip) return;
    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    if (!r) { bsSkillsStrip.innerHTML = ''; return; }
    bsSkillsStrip.innerHTML = '';
    r.skills.forEach((s) => {
      const chip = document.createElement('div');
      const colCls = s.deduction <= 0.1 ? 'bs-c-green' : (s.deduction <= 0.3 ? 'bs-c-orange' : 'bs-c-red');
      chip.className = `bs-skill-chip ${colCls}`;
      chip.innerHTML = `
        <div class="sc-top"><span>S${s.skillNumber} ${escapeHtml(s.dd || '')}</span><span>${s.timestampSec != null ? s.timestampSec.toFixed(1) + 's' : '--'}</span></div>
        <div class="sc-ded">-${s.deduction.toFixed(1)}</div>
        <div class="sc-fault">${escapeHtml(s.faults.join(', ') || 'Clean')}</div>
      `;
      chip.onclick = () => { if (s.timestampSec != null) bsVideo.currentTime = Math.max(0, s.timestampSec - 0.8); };
      bsSkillsStrip.appendChild(chip);
    });

    if (r.skills.length === getMaxSkills(r.discipline)) {
      const lChip = document.createElement('div');
      const colCls = r.landingDeduction <= 0.1 ? 'bs-c-green' : (r.landingDeduction <= 0.3 ? 'bs-c-orange' : 'bs-c-red');
      lChip.className = `bs-skill-chip ${colCls}`;
      lChip.innerHTML = `
        <div class="sc-top"><span>LAND</span><span>${r.landingTimestamp != null ? r.landingTimestamp.toFixed(1) + 's' : '--'}</span></div>
        <div class="sc-ded">-${r.landingDeduction.toFixed(1)}</div>
        <div class="sc-fault">${escapeHtml(r.landingFaults.join(', ') || 'Stuck')}</div>
      `;
      lChip.onclick = () => { if (r.landingTimestamp != null) bsVideo.currentTime = Math.max(0, r.landingTimestamp - 0.8); };
      bsSkillsStrip.appendChild(lChip);
    }
  }

  function bsDrawWave() {
    if (!bsWaveCtx || !bsWaveCanvas) return;
    //const W = bsWaveCanvas.width;
    //const H = bsWaveCanvas.height;
	const { width: W, height: H } = resizeHiDPICanvas(bsWaveCanvas);
    const c = getThemeCanvasColors();

    bsWaveCtx.clearRect(0, 0, W, H);
    bsWaveCtx.fillStyle = '#050509';
    bsWaveCtx.fillRect(0, 0, W, H);

    const wave = batchSyncState.wave;
    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    const duration = (bsVideo && bsVideo.duration) || (wave && wave.duration) || 1;

    bsWaveCtx.strokeStyle = 'rgba(255,255,255,0.06)';
    bsWaveCtx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) {
      const gy = (H / 4) * g;
      bsWaveCtx.beginPath(); bsWaveCtx.moveTo(0, gy); bsWaveCtx.lineTo(W, gy); bsWaveCtx.stroke();
    }

    if (wave && wave.samples && wave.samples.length > 1) {
      bsWaveCtx.beginPath();
      wave.samples.forEach((s, idx) => {
        const x = (s.t / duration) * W;
        const y = H - (Math.max(0.05, Math.min(0.95, s.y)) * (H - 22) + 11);
        if (idx === 0) bsWaveCtx.moveTo(x, y);
        else bsWaveCtx.lineTo(x, y);
      });
      bsWaveCtx.strokeStyle = c.blue;
      bsWaveCtx.lineWidth = 2;
      bsWaveCtx.stroke();

      wave.troughs.forEach(tr => {
        const x = (tr.t / duration) * W;
        const y = H - (Math.max(0.05, Math.min(0.95, tr.y)) * (H - 22) + 11);
        bsWaveCtx.fillStyle = c.purple;
        bsWaveCtx.beginPath();
        bsWaveCtx.arc(x, y, 4.5, 0, Math.PI * 2);
        bsWaveCtx.fill();
      });
    }

    if (r) {
      r.skills.forEach((s, i) => {
        if (s.timestampSec == null) return;
        const x = (s.timestampSec / duration) * W;
        bsWaveCtx.strokeStyle = i === 0 ? c.orange : c.green;
        bsWaveCtx.lineWidth = i === 0 ? 2.5 : 1.75;
        bsWaveCtx.beginPath(); bsWaveCtx.moveTo(x, 0); bsWaveCtx.lineTo(x, H); bsWaveCtx.stroke();

        bsWaveCtx.fillStyle = i === 0 ? c.orange : c.green;
        bsWaveCtx.fillRect(x - 12, 2, 24, 15);
        bsWaveCtx.fillStyle = '#0a0a0f';
        bsWaveCtx.font = 'bold 10px sans-serif';
        bsWaveCtx.textAlign = 'center';
        bsWaveCtx.fillText(`S${s.skillNumber}`, x, 13);
      });

      if (r.landingTimestamp != null) {
        const lx = (r.landingTimestamp / duration) * W;
        bsWaveCtx.strokeStyle = c.pink;
        bsWaveCtx.lineWidth = 2.5;
        bsWaveCtx.beginPath(); bsWaveCtx.moveTo(lx, 0); bsWaveCtx.lineTo(lx, H); bsWaveCtx.stroke();

        bsWaveCtx.fillStyle = c.pink;
        bsWaveCtx.fillRect(lx - 18, H - 18, 36, 16);
        bsWaveCtx.fillStyle = '#fff';
        bsWaveCtx.font = 'bold 10px sans-serif';
        bsWaveCtx.textAlign = 'center';
        bsWaveCtx.fillText('LAND', lx, H - 6);
      }
    }

    if (bsVideo && bsVideo.duration) {
      const px = (bsVideo.currentTime / bsVideo.duration) * W;
      bsWaveCtx.strokeStyle = '#ffffff';
      bsWaveCtx.lineWidth = 1.5;
      bsWaveCtx.beginPath(); bsWaveCtx.moveTo(px, 0); bsWaveCtx.lineTo(px, H); bsWaveCtx.stroke();
    }
  }

  if (bsWaveCanvas) {
    bsWaveCanvas.addEventListener('pointerdown', (e) => {
      const r = batchSyncState.routines[batchSyncState.selectedIndex];
      const duration = (bsVideo && bsVideo.duration) || 1;
      if (!r || !duration) return;
      const rect = bsWaveCanvas.getBoundingClientRect();
      const clickT = ((e.clientX - rect.left) / rect.width) * duration;

      let closest = null, minDiff = 0.45;
      r.skills.forEach((s, idx) => {
        if (s.timestampSec != null && Math.abs(s.timestampSec - clickT) < minDiff) {
          minDiff = Math.abs(s.timestampSec - clickT);
          closest = { type: 'skill', index: idx };
        }
      });
      if (r.landingTimestamp != null && Math.abs(r.landingTimestamp - clickT) < minDiff) {
        closest = { type: 'landing' };
      }

      if (closest) {
        batchSyncState.dragTarget = closest;
        try { bsWaveCanvas.setPointerCapture(e.pointerId); } catch (err) {}
      } else {
        bsVideo.currentTime = Math.max(0, Math.min(duration, clickT));
        bsDrawWave();
      }
    });

    bsWaveCanvas.addEventListener('pointermove', (e) => {
      if (!batchSyncState.dragTarget) return;
      const r = batchSyncState.routines[batchSyncState.selectedIndex];
      const duration = (bsVideo && bsVideo.duration) || 1;
      const rect = bsWaveCanvas.getBoundingClientRect();
      let newT = Math.max(0.1, Math.min(duration - 0.1, ((e.clientX - rect.left) / rect.width) * duration));
      const snapped = bsFindNearestTrough(newT, 0.3);
      if (snapped) newT = snapped.t;

      if (batchSyncState.dragTarget.type === 'skill') {
        r.skills[batchSyncState.dragTarget.index].timestampSec = newT;
      } else {
        r.landingTimestamp = newT;
      }
      bsVideo.currentTime = newT;
      bsRenderSkillsStrip();
      bsDrawWave();
    });

    bsWaveCanvas.addEventListener('pointerup', () => {
      batchSyncState.dragTarget = null;
    });
  }

  function bsUpdateLiveHud() {
    const r = batchSyncState.routines[batchSyncState.selectedIndex];
    const popup = document.getElementById('bsSkillPopup');
    if (!popup) return;
    if (!r || phase !== 'setup') {
      popup.classList.remove('visible');
      return;
    }

    const maxSk = getMaxSkills(r.discipline);
    const snapshot = {
      discipline: r.discipline,
      skillsPerformed: r.skills.length,
      skillDeductions: r.skills.map(s => s.deduction),
      skillTimestamps: r.skills.map(s => s.timestampSec || 0),
      skillDDs: r.skills.map(s => s.dd || ''),
      skillFaults: r.skills.map(s => s.faults || []),
      landingDeduction: r.landingDeduction,
      landingTimestamp: r.skills.length === maxSk ? (r.landingTimestamp || 0) : 0,
      landingFaults: r.landingFaults || []
    };

    const ev = getActiveOverlayEvent(bsVideo.currentTime || 0, snapshot);
    if (ev) {
      const colHex = getDeductionHexColor(ev.val);
      document.getElementById('bsSpHead').textContent = ev.dd ? `${ev.label} • ${ev.dd}` : ev.label;
      const dedEl = document.getElementById('bsSpDed');
      dedEl.textContent = `-${ev.val.toFixed(1)}`;
      dedEl.style.color = colHex;
      document.getElementById('bsSpFaults').textContent = (ev.faults || []).join(' • ');
      popup.style.borderColor = colHex;
      popup.classList.add('visible');
    } else {
      popup.classList.remove('visible');
    }
  }

  function bsSyncLoop() {
    if (phase === 'setup' && batchSyncState.selectedIndex !== -1) {
      bsDrawWave();
      bsUpdateLiveHud();
    }
    requestAnimationFrame(bsSyncLoop);
  }
  requestAnimationFrame(bsSyncLoop);

  if (bsBtnMarkSkill1) bsBtnMarkSkill1.onclick = bsMarkSkill1Now;

  if (bsBtnSpeed) {
    bsBtnSpeed.onclick = () => {
      batchSyncState.speedIndex = (batchSyncState.speedIndex + 1) % batchSyncState.speeds.length;
      const spd = batchSyncState.speeds[batchSyncState.speedIndex];
      bsVideo.playbackRate = spd;
      bsBtnSpeed.textContent = `Speed: ${spd}x`;
    };
  }

  if (bsBtnQueueRoutine) {
    bsBtnQueueRoutine.onclick = () => {
      const r = batchSyncState.routines[batchSyncState.selectedIndex];
      if (!r || !r.videoFile) return;

      if (r.skills[0]?.timestampSec == null) {
        bsMarkSkill1Now();
      }

      const maxSk = getMaxSkills(r.discipline);
      const performed = Math.min(maxSk, r.skills.length);
      const skillDeductArr = r.skills.slice(0, performed).map(s => s.deduction);
      const skillTsArr = r.skills.slice(0, performed).map(s => s.timestampSec || 0);
      const skillDdArr = r.skills.slice(0, performed).map(s => s.dd || '');
      const skillFaultsArr = r.skills.slice(0, performed).map(s => [...(s.faults || [])]);
      const landTs = (performed === maxSk) ? (r.landingTimestamp || 0) : 0;

      const { totalDeduct, netScore } = computeRoutineScores(
        r.discipline,
        performed,
        skillDeductArr,
        r.landingDeduction
      );

      const useCsvTitle = Boolean((r.title || '').trim() || (r.subtitle || '').trim());

      batchQueue.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        videoObjectUrl: r.videoObjectUrl,
        rawVideoBaseName: r.rawVideoBaseName,
        outputBaseName: r.outputBaseName,
        discipline: r.discipline,
        skillsPerformed: performed,
        skillDeductions: skillDeductArr,
        skillTimestamps: skillTsArr,
        skillDDs: skillDdArr,
        skillFaults: skillFaultsArr,
        landingDeduction: r.landingDeduction,
        landingTimestamp: landTs,
        landingFaults: [...(r.landingFaults || [])],
        totalDeduct,
        netScore,
        slateEnabled: useCsvTitle ? true : brandingState.slateEnabled,
        slateTitle: r.title || brandingState.slateTitle,
        slateSubtitle: r.subtitle || brandingState.slateSubtitle,
        slateDurationSec: brandingState.slateDurationSec,
        endSlateEnabled: brandingState.endSlateEnabled,
        endSlateDurationSec: brandingState.endSlateDurationSec,
        watermarkText: brandingState.watermarkText
      });

      r.status = 'queued';
      renderBatchQueueCard();
      bsRenderRoutineList();
      triggerFeedback('complete');

      const nextIdx = batchSyncState.routines.findIndex((item, i) => i > batchSyncState.selectedIndex && item.videoFile && item.status !== 'queued');
      if (nextIdx !== -1) {
        bsSelectRoutine(nextIdx);
      } else {
        bsVideo.pause();
      }
    };
  }

  // Capture-phase Spacebar listener: triggers Skill 1 anchor in Section 7 without pausing the video
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && phase === 'setup' && batchSyncState.selectedIndex !== -1) {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;
      const r = batchSyncState.routines[batchSyncState.selectedIndex];
      if (!r || !r.videoFile) return;

      e.preventDefault();
      e.stopPropagation();
      bsMarkSkill1Now();
    }
  }, true);

  function bsWireDropzone(dropEl, inputEl, onFiles) {
    if (!dropEl || !inputEl) return;
    dropEl.addEventListener('dragover', (e) => { e.preventDefault(); dropEl.classList.add('dragover'); });
    dropEl.addEventListener('dragleave', () => dropEl.classList.remove('dragover'));
    dropEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropEl.classList.remove('dragover');
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    });
    inputEl.addEventListener('change', (e) => {
      if (e.target.files.length) onFiles(e.target.files);
      e.target.value = '';
    });
  }

  bsWireDropzone(document.getElementById('bsCsvDrop'), document.getElementById('bsCsvInput'), async (files) => {
    const file = files[0];
    const text = await file.text();
    batchSyncState.routines = bsParseOneRowCsv(text);
    batchSyncState.selectedIndex = -1;
    document.getElementById('bsCsvStatus').textContent = `Loaded: ${file.name} (${batchSyncState.routines.length} routines)`;
    bsMatchVideos();
  });

  bsWireDropzone(document.getElementById('bsVidDrop'), document.getElementById('bsVidInput'), (files) => {
    for (const f of files) {
      const existingIdx = batchSyncState.videoFiles.findIndex(v => v.name === f.name);
      if (existingIdx !== -1) batchSyncState.videoFiles[existingIdx] = f;
      else batchSyncState.videoFiles.push(f);
    }
    document.getElementById('bsVidStatus').textContent = `${batchSyncState.videoFiles.length} video file(s) loaded`;
    bsMatchVideos();
  });
