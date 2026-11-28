  	
    (() => {
      // Automatically upgrade placeholder cards into live YouTube embeds once real IDs are supplied
      document.querySelectorAll(".video-embed-frame[data-youtube-id]").forEach((frame) => {
        const vid = (frame.dataset.youtubeId || "").trim();
        if (vid && !vid.startsWith("PLACEHOLDER")) {
          frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}" title="YouTube video resource" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
        }
      });

      // =========================================================================
      // BOUNCE TEMPO SETTINGS (Adjust these two values in milliseconds)
      // Controls both the HD force-graph spike interval and gymnast flight speed
      // =========================================================================
      const WARMUP_BOUNCE_MS = 950;   // Time between warm-up jumps in START
      const ROUTINE_BOUNCE_MS = 1250; // Time between routine skills in ROUTINE

      // Theme helper: Trampoline 2 uses purple lines everywhere
      function getSelectedTrampNum() {
        return document.getElementById("trampSelect").value === "Trampoline 2" ? 2 : 1;
      }

      function isTramp2Selected() {
        return getSelectedTrampNum() === 2;
      }

      function getTraceColor() {
        return isTramp2Selected() ? "#7e22ce" : "#2e7d32";
      }

      function getAccentColor() {
        return isTramp2Selected() ? "#7e22ce" : "#1e62d0";
      }

      function getBedGridColor(isActive) {
        if (!isActive) return "#bdbdbd";
        return isTramp2Selected() ? "#7e22ce" : "#d32f2f";
      }

      // --- Athletes ---
      const ATHLETES = [
        { last: "UNNO", first: "Hiroto", order: 1 },
        { last: "SCHMIDT", first: "Dylan", order: 2 },
        { last: "LITVINOVICH", first: "Ivan", order: 3 },
        { last: "PAGE", first: "Bryony", order: 4 },
        { last: "MORANTE", first: "Allan", order: 5 },
        { last: "SAKAI", first: "Ryosuke", order: 6 }
      ];
      let athleteIdx = 0;

      // ToF sequence for skills 1..10
      const ROUTINE_TOFS = [
        1.655, 1.670, 1.680, 1.670, 1.635,
        1.645, 1.630, 1.615, 1.605, 1.635
      ];

      // Skill animation styles cycled during the 10-skill routine
      const ROUTINE_SKILLS = [
        { name: "1: Back Somersault (P)", flips: 1, pose: "pike" },
        { name: "2: Barani (S)", flips: 1, pose: "straight" },
        { name: "3: Double Back (T)", flips: 2, pose: "tuck" },
        { name: "4: Straddle Jump", flips: 0, pose: "straddle" },
        { name: "5: Double Back (P)", flips: 2, pose: "pike" },
        { name: "6: Rudy (S)", flips: 1, pose: "straight" },
        { name: "7: Full-In Back (T)", flips: 2, pose: "tuck" },
        { name: "8: Pike Jump", flips: 0, pose: "pikeJump" },
        { name: "9: Double Layout", flips: 2, pose: "straight" },
        { name: "10: Triffus (T)", flips: 3, pose: "tuck" }
      ];

      /* HD zones and scale come from JudgleRules (scale in force from 1 Nov 2026): 0.0 / 0.1 / 0.3 / 0.5 */
      function calcHdDed(x, y) {
        return JudgleRules.hdDeduction(x, y, 214, 107);
      }

      /* Pick a landing inside the cell that carries the target deduction (clear of the zone lines) */
      function generateLandingInZone(targetDed, tof) {
        const sx = Math.random() < 0.5 ? -1 : 1;
        const sy = Math.random() < 0.5 ? -1 : 1;
        const r = (lo, hi) => lo + Math.random() * (hi - lo);
        let u, v;
        if (targetDed === 0.1)      { u = r(0.33, 0.45); v = r(0, 0.40); }          // inner side boxes
        else if (targetDed === 0.3) {                                               // top/bottom middle or side middles
          if (Math.random() < 0.5)  { u = r(0, 0.45);    v = r(0.58, 0.95); }
          else                      { u = r(0.58, 0.95); v = r(0, 0.40); }
        }
        else if (targetDed === 0.5) { u = r(0.58, 0.95); v = r(0.58, 0.95); }       // corners
        else                        { u = r(0, 0.22);    v = r(0, 0.40); }          // centre
        return { x: Math.round(sx * u * 214), y: Math.round(sy * v * 107), tof };
      }

      let routineZonePool = [];
      function resetRoutineZonePool() {
        const baseZones = [0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 0.3, 0.3, 0.5, 0.5];
        for (let i = baseZones.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [baseZones[i], baseZones[j]] = [baseZones[j], baseZones[i]];
        }
        routineZonePool = baseZones;
      }

      // =========================================================================
      // RECOVERY DUMMY TIMELINE GENERATOR (3 Routines + Start Jumps + Breaks)
      // =========================================================================
      let recoveryTimeline = [];     // Array of { t, x, y, tof, phase, amp, routineNum, athlete }
      let recoveryTotalDuration = 120;
      let recWinStartSec = 0;
      let recWinEndSec = 120;
      let recSkillStartSec = 0;      // Controlled by the slider above the bottom graph
      let recoveryOpen = false;
      let escPressCount = 0;
      let escResetTimer = null;

      function buildThreeRoutineRecoveryData(trampNum = 1) {
        const events = [];
        let cursorT = 2.0;

        const routinesSpec = trampNum === 2
          ? [
              {
                routineNum: 1,
                athlete: { last: "UNNO", first: "Hiroto", order: 1 },
                warmups: 5,
                zones: [0.0, 0.0, 0.1, 0.1, 0.3, 0.1, 0.0, 0.1, 0.5, 0.1],
                breakAfter: 12.0
              },
              {
                routineNum: 2,
                athlete: { last: "LITVINOVICH", first: "Ivan", order: 3 },
                warmups: 6,
                zones: [0.0, 0.1, 0.0, 0.1, 0.1, 0.0, 0.3, 0.1, 0.1, 0.0],
                breakAfter: 12.5
              },
              {
                routineNum: 3,
                athlete: { last: "MORANTE", first: "Allan", order: 5 },
                warmups: 5,
                zones: [0.1, 0.1, 0.0, 0.3, 0.1, 0.3, 0.1, 0.0, 0.1, 0.1],
                breakAfter: 3.0
              }
            ]
          : [
              {
                routineNum: 1,
                athlete: { last: "SCHMIDT", first: "Dylan", order: 2 },
                warmups: 5,
                zones: [0.0, 0.1, 0.0, 0.3, 0.1, 0.1, 0.0, 0.3, 0.1, 0.1],
                breakAfter: 11.5
              },
              {
                routineNum: 2,
                athlete: { last: "PAGE", first: "Bryony", order: 4 },
                warmups: 6,
                zones: [0.0, 0.0, 0.1, 0.1, 0.3, 0.0, 0.1, 0.3, 0.0, 0.1],
                breakAfter: 13.0
              },
              {
                routineNum: 3,
                athlete: { last: "SAKAI", first: "Ryosuke", order: 6 },
                warmups: 5,
                zones: [0.1, 0.0, 0.0, 0.3, 0.1, 0.5, 0.1, 0.0, 0.3, 0.1],
                breakAfter: 3.0
              }
            ];

        routinesSpec.forEach((spec) => {
          // 1. Start / Warm-up jumps ramping up in height
          for (let w = 0; w < spec.warmups; w++) {
            const tof = +(1.15 + w * 0.085).toFixed(3);
            const amp = +(0.20 + w * 0.075).toFixed(2);
            events.push({
              t: +cursorT.toFixed(2),
              ...generateLandingInZone(w % 2 === 0 ? 0.0 : 0.1, tof),
              phase: "warmup",
              amp,
              routineNum: spec.routineNum,
              athlete: spec.athlete
            });
            cursorT += 1.45;
          }

          // 2. 10 Routine Skills
          for (let s = 0; s < 10; s++) {
            const tof = ROUTINE_TOFS[s];
            events.push({
              t: +cursorT.toFixed(2),
              ...generateLandingInZone(spec.zones[s], tof),
              phase: "routine",
              amp: +(0.64 + (s % 3) * 0.03).toFixed(2),
              routineNum: spec.routineNum,
              athlete: spec.athlete
            });
            cursorT += 1.85;
          }

          // 3. 2 Out-bounce / kill jumps
          for (let e = 0; e < 2; e++) {
            const tof = +(1.05 - e * 0.26).toFixed(3);
            events.push({
              t: +cursorT.toFixed(2),
              ...generateLandingInZone(0.1, tof),
              phase: "extra",
              amp: +(0.36 - e * 0.14).toFixed(2),
              routineNum: spec.routineNum,
              athlete: spec.athlete
            });
            cursorT += 1.25;
          }

          // 4. Flatline break between routines
          cursorT += spec.breakAfter;
        });

        recoveryTimeline = events;
        recoveryTotalDuration = Math.ceil(cursorT);
        recWinStartSec = 0;
        recWinEndSec = recoveryTotalDuration;
        autoSnapSkillStartLine();
      }

      // Automatically position the skill-start line right before the first routine spike inside [recWinStartSec, recWinEndSec]
      function autoSnapSkillStartLine() {
        const inWindow = recoveryTimeline.filter(
          (ev) => ev.t >= recWinStartSec && ev.t <= recWinEndSec
        );
        if (!inWindow.length) {
          recSkillStartSec = recWinStartSec;
          return;
        }
        const firstRoutineEv = inWindow.find((ev) => ev.phase === "routine") || inWindow[0];
        recSkillStartSec = Math.max(recWinStartSec, +(firstRoutineEv.t - 0.6).toFixed(2));
      }

      // Compute which spikes fall inside [recWinStartSec, recWinEndSec] and which skills start at >= recSkillStartSec
      function getSelectedRecoverySlice() {
        const inWindow = recoveryTimeline.filter(
          (ev) => ev.t >= recWinStartSec && ev.t <= recWinEndSec
        );
        if (!inWindow.length) {
          return { allInWindow: [], warmupCount: 0, skills: [], athlete: ATHLETES[0] };
        }

        let skillStartIdx = inWindow.findIndex((ev) => ev.t >= recSkillStartSec);
        if (skillStartIdx === -1) {
          skillStartIdx = inWindow.length;
        }

        const skills = inWindow.slice(skillStartIdx, skillStartIdx + 10);
        const dominantAthlete = (skills[0] || inWindow[0]).athlete || ATHLETES[0];

        return {
          allInWindow: inWindow,
          warmupCount: skillStartIdx,
          skills,
          athlete: dominantAthlete
        };
      }

      // --- State Variables ---
      const STATE_NAMES = ["READY", "START", "ROUTINE", "REVIEW"];
      let currentState = "READY";
      let audioOn = true;

      let startTimestamp = 0;
      let startedAfterSec = 0.0;
      let timerInterval = null;
      let warmupInterval = null;
      let skillInterval = null;
      let animId = null;

      // Bounce synchronization timing for the animated gymnast
      let lastSpikeTime = 0;
      let currentCycleDuration = WARMUP_BOUNCE_MS;
      let prevLandingX = 0;
      let nextLandingX = 0;
      let currentBounceAmp = 0.35;
      let currentSkillAnim = { name: "Warm-up Bounce", flips: 0, pose: "straight" };

      // Unified timeline of all recorded bounces from jump #1 to the final bounce
      let recordedJumps = [];     // Array of { x, y, tof, phase: 'warmup'|'routine'|'extra', amp }
      let warmupSpikesCount = 0;  // Index where ROUTINE begins inside recordedJumps
      let capturedCount = 0;      // Skills counted in live table during ROUTINE (max 10)
      let totalRoutinePulses = 0; // Total jumps recorded after Spacebar pressed in START
      let deductionFrom = 10;     // Adjusted via ArrowUp / ArrowDown in REVIEW
      let routineShifted = 0;     // Adjusted via ArrowLeft / ArrowRight in REVIEW
      let showDetailsView = false;// Toggled via 'D' key or toolbar button

      function syncTrampolinePanels(skills) {
        const activeTramp = getSelectedTrampNum();
        const isT1 = activeTramp === 1;

        document.getElementById("liveTramp1Panel").className = `tramp-panel ${isT1 ? "active-tramp" : "inactive"}`;
        document.getElementById("liveTramp2Panel").className = `tramp-panel ${!isT1 ? "active-tramp purple-theme" : "inactive"}`;

        document.getElementById("revTramp1Panel").className = `tramp-panel ${isT1 ? "active-tramp" : "inactive"} rev-tramp-1`;
        document.getElementById("revTramp2Panel").className = `tramp-panel ${!isT1 ? "active-tramp purple-theme" : "inactive"} rev-tramp-2`;

        document.getElementById("gymTrampLabel").textContent = `TRAMPOLINE ${activeTramp}`;

        drawTrampolineBed(document.getElementById("tramp1Canvas"), isT1 ? skills : [], isT1);
        drawTrampolineBed(document.getElementById("tramp2Canvas"), !isT1 ? skills : [], !isT1);

        if (showDetailsView) {
          drawTrampolineBed(document.getElementById("revTramp1Canvas"), isT1 ? skills : [], isT1);
          drawTrampolineBed(document.getElementById("revTramp2Canvas"), !isT1 ? skills : [], !isT1);
        }
      }

      // Apply Trampoline 1 vs Trampoline 2 selection everywhere
      function setTrampolineSelection(trampNum, rebuildRecovery = false) {
        const selectEl = document.getElementById("trampSelect");
        const desiredVal = trampNum === 2 ? "Trampoline 2" : "Trampoline 1";
        if (selectEl.value !== desiredVal && !(trampNum === 1 && selectEl.value === "Automatic")) {
          selectEl.value = desiredVal;
        }

        const isT2 = isTramp2Selected();
        document.getElementById("readyWarning").classList.toggle("visible", selectEl.value !== "Automatic");
        document.getElementById("sbTramp").textContent = isT2 ? "Tramp 2 selected" : "Tramp 1 selected";
        document.getElementById("gymTrampLabel").textContent = `TRAMPOLINE ${getSelectedTrampNum()}`;

        // Sync Recovery modal buttons & theme classes
        const btn1 = document.getElementById("recBtnTramp1");
        const btn2 = document.getElementById("recBtnTramp2");
        btn1.className = `rec-tramp-btn ${!isT2 ? "active-t1" : ""}`;
        btn2.className = `rec-tramp-btn ${isT2 ? "active-t2" : ""}`;
        document.getElementById("recTopTitle").textContent = `Trampoline ${getSelectedTrampNum()} — Full Buffer`;
        document.getElementById("recTimeRangeLabel").style.color = getAccentColor();
        document.getElementById("recDetectedBadge").style.color = getAccentColor();

        document.getElementById("recSliderFill").classList.toggle("purple-mode", isT2);
        document.getElementById("recHandleLeft").classList.toggle("purple-mode", isT2);
        document.getElementById("recHandleRight").classList.toggle("purple-mode", isT2);

        if (recoveryOpen) {
          if (rebuildRecovery) {
            buildThreeRoutineRecoveryData(getSelectedTrampNum());
          }
          updateRecoveryUI();
        } else if (currentState === "START" || currentState === "ROUTINE") {
          const activeSlice = currentState === "ROUTINE"
            ? getWindowSlice(warmupSpikesCount, capturedCount)
            : [];
          syncTrampolinePanels(activeSlice);
        } else if (currentState === "REVIEW" && showDetailsView) {
          refreshReviewCalculations();
        }
      }

      // --- Web Audio Beep ---
      let actx = null;
      function beep(freq, dur = 0.06, vol = 0.06) {
        if (!audioOn) return;
        try {
          if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
          const o = actx.createOscillator();
          const g = actx.createGain();
          o.frequency.value = freq;
          g.gain.setValueAtTime(vol, actx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
          o.connect(g);
          g.connect(actx.destination);
          o.start();
          o.stop(actx.currentTime + dur);
        } catch (e) {}
      }

      // --- ESC × 3 Recovery Dialogue Logic ---
      function handleEscPress() {
        flashHardware("keyEsc");

        if (recoveryOpen) {
          closeRecoveryModal();
          return;
        }

        escPressCount++;
        beep(420 + escPressCount * 90, 0.05);
        document.getElementById("escHint").textContent = `ESC (${escPressCount}/3)`;
        document.getElementById("sbHint").textContent =
          `ESC pressed (${escPressCount}/3) — press ESC ${3 - escPressCount} more time(s) for Recovery`;

        if (escResetTimer) clearTimeout(escResetTimer);
        escResetTimer = setTimeout(() => {
          escPressCount = 0;
          document.getElementById("escHint").textContent = "×3 RECOVER";
          syncStateUI();
        }, 1800);

        if (escPressCount >= 3) {
          escPressCount = 0;
          if (escResetTimer) clearTimeout(escResetTimer);
          document.getElementById("escHint").textContent = "×3 RECOVER";
          openRecoveryModal();
        }
      }

      function openRecoveryModal() {
        stopTimers();
        recoveryOpen = true;
        buildThreeRoutineRecoveryData(getSelectedTrampNum());
        setTrampolineSelection(getSelectedTrampNum(), false);
        beep(760, 0.09);
        document.getElementById("recoveryModal").classList.add("open");
        requestAnimationFrame(() => updateRecoveryUI());
      }

      function closeRecoveryModal() {
        recoveryOpen = false;
        document.getElementById("recoveryModal").classList.remove("open");
        if (currentState === "START" || currentState === "ROUTINE") {
          resetToReady();
        } else {
          syncStateUI();
        }
      }

      function updateRecoveryUI() {
        recSkillStartSec = Math.max(recWinStartSec, Math.min(recWinEndSec, recSkillStartSec));

        const leftPct = (recWinStartSec / recoveryTotalDuration) * 100;
        const rightPct = (recWinEndSec / recoveryTotalDuration) * 100;

        const fill = document.getElementById("recSliderFill");
        const hLeft = document.getElementById("recHandleLeft");
        const hRight = document.getElementById("recHandleRight");

        fill.style.left = `${leftPct}%`;
        fill.style.width = `${Math.max(1, rightPct - leftPct)}%`;
        hLeft.style.left = `${leftPct}%`;
        hRight.style.left = `${rightPct}%`;

        const span = Math.max(0.5, recWinEndSec - recWinStartSec);
        const skillStartPct = Math.max(0, Math.min(100, ((recSkillStartSec - recWinStartSec) / span) * 100));
        document.getElementById("recSkillStartThumb").style.left = `${skillStartPct}%`;

        document.getElementById("recTimeRangeLabel").textContent =
          `${recWinStartSec.toFixed(1)}s – ${recWinEndSec.toFixed(1)}s`;

        const sel = getSelectedRecoverySlice();
        const skillCount = sel.skills.length;
        document.getElementById("recDetectedBadge").textContent =
          `${skillCount} skill${skillCount === 1 ? "" : "s"} selected`;

        drawRecoveryOverviewGraph();
        drawRecoveryZoomedGraph(sel);
      }

      function drawRecoveryOverviewGraph() {
        const canvas = document.getElementById("recOverviewCanvas");
        const info = prepCanvas(canvas);
        if (!info) return;
        const { ctx, w, h } = info;

        ctx.clearRect(0, 0, w, h);

        const padL = 32;
        const padR = 8;
        const padT = 14;
        const padB = 16;
        const gw = w - padL - padR;
        const gh = h - padT - padB;
        const zeroY = padT + gh * 0.9;
        const traceCol = getTraceColor();
        const accentCol = getAccentColor();

        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
          const gy = padT + (gh / 3) * i;
          ctx.beginPath();
          ctx.moveTo(padL, gy);
          ctx.lineTo(padL + gw, gy);
          ctx.stroke();
        }

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 9.5px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        [1, 2, 3].forEach((rNum) => {
          const rSpikes = recoveryTimeline.filter((e) => e.routineNum === rNum);
          if (rSpikes.length) {
            const midT = (rSpikes[0].t + rSpikes[rSpikes.length - 1].t) / 2;
            const mx = padL + (midT / recoveryTotalDuration) * gw;
            ctx.fillText(`Routine ${rNum}`, mx, 10);
          }
        });

        ctx.strokeStyle = traceCol;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(padL, zeroY);

        recoveryTimeline.forEach((ev) => {
          const sx = padL + (ev.t / recoveryTotalDuration) * gw;
          const peakY = zeroY - gh * ev.amp;
          ctx.lineTo(sx - 2, zeroY);
          ctx.lineTo(sx, peakY);
          ctx.lineTo(sx + 1.5, zeroY + 4);
          ctx.lineTo(sx + 3, zeroY);
        });
        ctx.lineTo(padL + gw, zeroY);
        ctx.stroke();

        const selX1 = padL + (recWinStartSec / recoveryTotalDuration) * gw;
        const selX2 = padL + (recWinEndSec / recoveryTotalDuration) * gw;

        ctx.fillStyle = "rgba(15, 23, 42, 0.24)";
        if (selX1 > padL) {
          ctx.fillRect(padL, padT, selX1 - padL, gh + 4);
        }
        if (selX2 < padL + gw) {
          ctx.fillRect(selX2, padT, padL + gw - selX2, gh + 4);
        }

        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(selX1, padT);
        ctx.lineTo(selX1, padT + gh + 4);
        ctx.moveTo(selX2, padT);
        ctx.lineTo(selX2, padT + gh + 4);
        ctx.stroke();

        ctx.fillStyle = "#555";
        ctx.font = "9px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        for (let t = 0; t <= recoveryTotalDuration; t += 20) {
          const tx = padL + (t / recoveryTotalDuration) * gw;
          ctx.fillText(`${t}s`, tx, h - 3);
        }
      }

      function drawRecoveryZoomedGraph(sel) {
        const canvas = document.getElementById("recZoomCanvas");
        const info = prepCanvas(canvas);
        if (!info) return;
        const { ctx, w, h } = info;

        ctx.clearRect(0, 0, w, h);

        const padL = 36;
        const padR = 12;
        const padT = 16;
        const padB = 18;
        const gw = w - padL - padR;
        const gh = h - padT - padB;
        const zeroY = padT + gh * 0.88;
        const span = Math.max(0.5, recWinEndSec - recWinStartSec);
        const traceCol = getTraceColor();
        const accentCol = getAccentColor();

        if (sel.skills.length > 0) {
          const firstSkillT = sel.skills[0].t;
          const lastSkillT = sel.skills[sel.skills.length - 1].t;
          const xStart = padL + Math.max(0, ((Math.min(recSkillStartSec, firstSkillT - 0.35) - recWinStartSec) / span) * gw);
          const xEnd = padL + Math.min(gw, ((lastSkillT + 0.55 - recWinStartSec) / span) * gw);
          if (xEnd > xStart) {
            ctx.fillStyle = "#fff59d";
            ctx.fillRect(xStart, padT, xEnd - xStart, gh);
          }
        }

        ctx.strokeStyle = "#dcdcdc";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#555";
        ctx.font = "9px Segoe UI, sans-serif";
        ctx.textAlign = "right";
        for (let i = 0; i <= 4; i++) {
          const gy = padT + (gh / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padL, gy);
          ctx.lineTo(padL + gw, gy);
          ctx.stroke();
          ctx.fillText(String(Math.round(18000 - i * 4500)), padL - 4, gy + 3);
        }

        ctx.strokeStyle = traceCol;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, zeroY);

        sel.allInWindow.forEach((ev) => {
          const sx = padL + ((ev.t - recWinStartSec) / span) * gw;
          const peakY = zeroY - gh * ev.amp;
          ctx.lineTo(sx - 4, zeroY);
          ctx.lineTo(sx, peakY);
          ctx.lineTo(sx + 3, zeroY + 6);
          ctx.lineTo(sx + 6, zeroY - 4);
          ctx.lineTo(sx + 9, zeroY);
        });
        ctx.lineTo(padL + gw, zeroY);
        ctx.stroke();

        const startLineX = padL + Math.max(0, Math.min(gw, ((recSkillStartSec - recWinStartSec) / span) * gw));
        ctx.save();
        ctx.strokeStyle = "#d32f2f";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(startLineX, padT - 4);
        ctx.lineTo(startLineX, padT + gh + 2);
        ctx.stroke();
        ctx.restore();

        ctx.font = "bold 9.5px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        sel.skills.forEach((ev, idx) => {
          const sx = padL + ((ev.t - recWinStartSec) / span) * gw;
          const peakY = zeroY - gh * ev.amp;
          ctx.fillStyle = accentCol;
          ctx.fillText(String(idx + 1), sx, Math.max(10, peakY - 4));
        });

        ctx.fillStyle = "#555";
        ctx.font = "9px Segoe UI, sans-serif";
        ctx.textAlign = "center";
        const tickCount = 5;
        for (let i = 0; i <= tickCount; i++) {
          const tVal = recWinStartSec + (span / tickCount) * i;
          const tx = padL + (gw / tickCount) * i;
          ctx.fillText(`${tVal.toFixed(1)}s`, tx, h - 4);
        }
      }

      // Interactive Top Range Slider + Bottom Skill-Start Line Slider Wiring
      function setupRecoverySliderInteractions() {
        const track = document.getElementById("recSliderTrack");
        const fill = document.getElementById("recSliderFill");
        const hLeft = document.getElementById("recHandleLeft");
        const hRight = document.getElementById("recHandleRight");
        const overviewWrap = document.getElementById("recOverviewWrap");

        const skillStartTrack = document.getElementById("recSkillStartTrack");
        const skillStartThumb = document.getElementById("recSkillStartThumb");
        const zoomWrap = document.getElementById("recZoomWrap");

        let dragMode = null;
        let dragStartX = 0;
        let initStartSec = 0;
        let initEndSec = 0;
        const MIN_SPAN = 3.0;

        function pxToGlobalSec(clientX, el) {
          const rect = el.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
          return ratio * recoveryTotalDuration;
        }

        function pxToZoomSec(clientX, el) {
          const rect = el.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
          return recWinStartSec + ratio * (recWinEndSec - recWinStartSec);
        }

        function onPointerDown(mode, e) {
          e.preventDefault();
          e.stopPropagation();
          dragMode = mode;
          dragStartX = e.clientX;
          initStartSec = recWinStartSec;
          initEndSec = recWinEndSec;

          if (mode === "sweep") {
            const clickedSec = pxToGlobalSec(e.clientX, overviewWrap);
            recWinStartSec = clickedSec;
            recWinEndSec = Math.min(recoveryTotalDuration, clickedSec + MIN_SPAN);
            initStartSec = clickedSec;
            autoSnapSkillStartLine();
            updateRecoveryUI();
          } else if (mode === "skillStart") {
            const targetEl = e.currentTarget === zoomWrap ? zoomWrap : skillStartTrack;
            recSkillStartSec = pxToZoomSec(e.clientX, targetEl);
            updateRecoveryUI();
          }
        }

        hLeft.addEventListener("pointerdown", (e) => onPointerDown("left", e));
        hRight.addEventListener("pointerdown", (e) => onPointerDown("right", e));
        fill.addEventListener("pointerdown", (e) => onPointerDown("window", e));
        overviewWrap.addEventListener("pointerdown", (e) => onPointerDown("sweep", e));

        skillStartTrack.addEventListener("pointerdown", (e) => onPointerDown("skillStart", e));
        skillStartThumb.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragMode = "skillStart";
        });
        zoomWrap.addEventListener("pointerdown", (e) => onPointerDown("skillStart", e));

        window.addEventListener("pointermove", (e) => {
          if (!dragMode || !recoveryOpen) return;

          if (dragMode === "left") {
            const sec = pxToGlobalSec(e.clientX, track);
            recWinStartSec = Math.max(0, Math.min(recWinEndSec - MIN_SPAN, sec));
            autoSnapSkillStartLine();
          } else if (dragMode === "right") {
            const sec = pxToGlobalSec(e.clientX, track);
            recWinEndSec = Math.min(recoveryTotalDuration, Math.max(recWinStartSec + MIN_SPAN, sec));
            autoSnapSkillStartLine();
          } else if (dragMode === "window") {
            const rect = track.getBoundingClientRect();
            const deltaSec = ((e.clientX - dragStartX) / rect.width) * recoveryTotalDuration;
            const span = initEndSec - initStartSec;
            let nextStart = initStartSec + deltaSec;
            nextStart = Math.max(0, Math.min(recoveryTotalDuration - span, nextStart));
            recWinStartSec = nextStart;
            recWinEndSec = nextStart + span;
            autoSnapSkillStartLine();
          } else if (dragMode === "sweep") {
            const curSec = pxToGlobalSec(e.clientX, overviewWrap);
            const lo = Math.min(initStartSec, curSec);
            const hi = Math.max(initStartSec + MIN_SPAN, curSec);
            recWinStartSec = Math.max(0, lo);
            recWinEndSec = Math.min(recoveryTotalDuration, hi);
            autoSnapSkillStartLine();
          } else if (dragMode === "skillStart") {
            recSkillStartSec = pxToZoomSec(e.clientX, skillStartTrack);
          }

          updateRecoveryUI();
        });

        window.addEventListener("pointerup", () => {
          dragMode = null;
        });
      }

      function confirmRecoverySelection() {
        const sel = getSelectedRecoverySlice();
        if (!sel.allInWindow.length) {
          closeRecoveryModal();
          return;
        }

        recoveryOpen = false;
        document.getElementById("recoveryModal").classList.remove("open");

        recordedJumps = sel.allInWindow.map((ev) => ({
          x: ev.x,
          y: ev.y,
          tof: ev.tof,
          phase: ev.phase,
          amp: ev.amp
        }));
        warmupSpikesCount = sel.warmupCount;
        capturedCount = Math.max(1, Math.min(10, sel.skills.length));
        startedAfterSec = +(sel.warmupCount * 1.45).toFixed(1);

        enterReviewState(sel.athlete);
        document.getElementById("sbHint").textContent =
          `Recovered ${capturedCount} skill(s) into REVIEW — adjust with arrows or press SPACE to confirm`;
      }

      // --- State Transitions (Spacebar / USB Button) ---
      function handleSpaceAction() {
        if (recoveryOpen) {
          confirmRecoverySelection();
          return;
        }

        flashHardware("keySpace");
        flashHardware("usbButton");
        flashHardware("usbButtonInline");

        if (currentState === "READY") {
          enterStartState();
        } else if (currentState === "START") {
          enterRoutineState();
        } else if (currentState === "ROUTINE") {
          enterReviewState();
        } else if (currentState === "REVIEW") {
          confirmReviewResult();
        }
      }

      function triggerGymnastLandingSpike(jump, durationMs, skillMeta) {
        lastSpikeTime = performance.now();
        currentCycleDuration = durationMs;
        prevLandingX = jump.x;
        nextLandingX = jump.x * 0.65;
        currentBounceAmp = jump.amp;
        currentSkillAnim = skillMeta;
        document.getElementById("gymSkillLabel").textContent = skillMeta.name;
      }

      function appendWarmupJump() {
        const idx = warmupSpikesCount;
        const zoneChoices = [0.0, 0.1, 0.3];
        const z = zoneChoices[Math.floor(Math.random() * zoneChoices.length)];
        const tof = +(1.18 + Math.min(0.46, idx * 0.06)).toFixed(3);
        const amp = Math.min(0.56, 0.18 + idx * 0.055);
        const jump = {
          ...generateLandingInZone(z, tof),
          phase: "warmup",
          amp
        };
        recordedJumps.push(jump);
        warmupSpikesCount++;

        triggerGymnastLandingSpike(jump, WARMUP_BOUNCE_MS, {
          name: `Warm-up #${warmupSpikesCount}`,
          flips: 0,
          pose: "straight"
        });
      }

      function enterStartState() {
        stopTimers();
        currentState = "START";
        resetRoutineZonePool();
        recordedJumps = [];
        warmupSpikesCount = 0;
        capturedCount = 0;
        totalRoutinePulses = 0;

        startTimestamp = performance.now();
        startedAfterSec = 0.0;
        document.getElementById("startTimerText").textContent = "0.0";
        beep(520, 0.07);

        appendWarmupJump();

        timerInterval = setInterval(() => {
          const dt = (performance.now() - startTimestamp) / 1000;
          startedAfterSec = +dt.toFixed(1);
          document.getElementById("startTimerText").textContent = startedAfterSec.toFixed(1);
        }, 100);

        warmupInterval = setInterval(() => {
          appendWarmupJump();
        }, WARMUP_BOUNCE_MS);

        syncStateUI();
        startCanvasLoop();
      }

      function enterRoutineState() {
        stopTimers();
        currentState = "ROUTINE";
        capturedCount = 0;
        totalRoutinePulses = 0;
        beep(740, 0.08);

        processRoutinePulse();

        skillInterval = setInterval(() => {
          processRoutinePulse();
        }, ROUTINE_BOUNCE_MS);

        syncStateUI();
        startCanvasLoop();
      }

      function processRoutinePulse() {
        const pulseIdx = totalRoutinePulses;
        totalRoutinePulses++;

        let jump;
        let skillMeta;

        if (pulseIdx < 10) {
          const zone = routineZonePool[pulseIdx] ?? 0.1;
          const tof = ROUTINE_TOFS[pulseIdx];
          jump = {
            ...generateLandingInZone(zone, tof),
            phase: "routine",
            amp: 0.62
          };
          skillMeta = ROUTINE_SKILLS[pulseIdx];
        } else {
          const extraIdx = pulseIdx - 10;
          const tof = +Math.max(0.65, 1.120 - extraIdx * 0.18).toFixed(3);
          const amp = Math.max(0.14, 0.46 - extraIdx * 0.09);
          jump = {
            ...generateLandingInZone(0.1, tof),
            phase: "extra",
            amp
          };
          skillMeta = { name: `Out-bounce #${extraIdx + 1}`, flips: 0, pose: "straight" };
        }

        recordedJumps.push(jump);
        triggerGymnastLandingSpike(jump, ROUTINE_BOUNCE_MS, skillMeta);

        if (capturedCount < 10) {
          capturedCount++;
          const activeSlice = getWindowSlice(warmupSpikesCount, capturedCount);
          const last = activeSlice[activeSlice.length - 1];
          const pitch = last && last.ded === 0 ? 640 : 460;
          beep(pitch, 0.05);
          renderSkillTable("liveTableBody", activeSlice, false);

          if (capturedCount === 10) {
            document.getElementById("sbHint").textContent =
              "10 skills counted — recording continues. Press SPACE to open REVIEW.";
          }
        }
      }

      function enterReviewState(overrideAthlete = null) {
        stopTimers();
        currentState = "REVIEW";
        deductionFrom = Math.max(1, Math.min(10, capturedCount || 1));
        routineShifted = 0;
        showDetailsView = false;
        beep(880, 0.1);

        const ath = overrideAthlete || ATHLETES[athleteIdx % ATHLETES.length];
        document.getElementById("athLast").textContent = ath.last;
        document.getElementById("athFirst").textContent = ath.first;
        document.getElementById("athOrder").textContent = String(ath.order);
        document.getElementById("revStartedAfter").textContent = `${startedAfterSec.toFixed(1)}s`;
        document.getElementById("gymSkillLabel").textContent = "Routine Complete";

        syncStateUI();
        refreshReviewCalculations();
        renderGymnastStage(performance.now());
      }

      function getShiftBounds(count) {
        const total = recordedJumps.length;
        const minShift = -warmupSpikesCount;
        const maxShift = Math.max(minShift, total - count - warmupSpikesCount);
        return { minShift, maxShift };
      }

      function getWindowSlice(startIdx, count) {
        const clampedStart = Math.max(0, Math.min(Math.max(0, recordedJumps.length - count), startIdx));
        const res = [];
        for (let i = 0; i < count; i++) {
          const item = recordedJumps[clampedStart + i];
          if (!item) break;
          const ded = calcHdDed(item.x, item.y);
          res.push({
            num: i + 1,
            x: item.x,
            y: item.y,
            tof: item.tof,
            ded,
            hd: +(1.0 - ded).toFixed(1)
          });
        }
        return res;
      }

      function confirmReviewResult() {
        const lastName = document.getElementById("athLast").textContent;
        const firstName = document.getElementById("athFirst").textContent;
        const effectiveCount = Math.min(deductionFrom, recordedJumps.length);
        const startIdx = warmupSpikesCount + routineShifted;
        const slice = getWindowSlice(startIdx, effectiveCount);
        const sumTof = slice.reduce((a, s) => a + s.tof, 0);
        const sumDed = slice.reduce((a, s) => a + s.ded, 0);
        const finalHd = Math.max(0, deductionFrom - sumDed);

        document.getElementById("prevHdLabel").textContent = `Previous Horizontal Displacement (${lastName})`;
        document.getElementById("prevHdVal").textContent = finalHd.toFixed(1);
        document.getElementById("prevTofVal").textContent = sumTof.toFixed(3);
        document.getElementById("prevResultBar").classList.add("visible");

        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const logList = document.getElementById("logList");
        const row = document.createElement("div");
        row.className = "log-item";
        row.innerHTML = `<span>📄</span><span>${stamp}_${lastName}_${firstName}.dat</span>`;
        logList.prepend(row);

        athleteIdx++;
        beep(980, 0.08);
        resetToReady();
      }

      function dismissReviewResult() {
        if (currentState !== "REVIEW") return;
        flashHardware("keyX");
        beep(300, 0.1);
        resetToReady();
      }

      function resetToReady() {
        stopTimers();
        currentState = "READY";
        capturedCount = 0;
        totalRoutinePulses = 0;
        showDetailsView = false;
        prevLandingX = 0;
        nextLandingX = 0;
        document.getElementById("gymSkillLabel").textContent = "Standing";
        syncStateUI();
        renderGymnastStage(performance.now());
      }

      function stopTimers() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        if (warmupInterval) { clearInterval(warmupInterval); warmupInterval = null; }
        if (skillInterval) { clearInterval(skillInterval); skillInterval = null; }
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      }

      function refreshReviewCalculations() {
        const maxSelectable = Math.min(10, recordedJumps.length);
        deductionFrom = Math.max(1, Math.min(maxSelectable, deductionFrom));

        const { minShift, maxShift } = getShiftBounds(deductionFrom);
        routineShifted = Math.max(minShift, Math.min(maxShift, routineShifted));

        const startIdx = warmupSpikesCount + routineShifted;
        const slice = getWindowSlice(startIdx, deductionFrom);

        const sumTof = slice.reduce((a, s) => a + s.tof, 0);
        const sumDed = slice.reduce((a, s) => a + s.ded, 0);
        const finalHd = Math.max(0, deductionFrom - sumDed);

        document.getElementById("revDeductionFrom").textContent = String(deductionFrom);
        document.getElementById("revRoutineShifted").textContent = String(routineShifted);
        document.getElementById("revHdBig").textContent = finalHd.toFixed(1);
        document.getElementById("revTofBig").textContent = sumTof.toFixed(3);

        document.getElementById("reviewOverviewLower").style.display = showDetailsView ? "none" : "grid";
        document.getElementById("reviewDetailsLower").classList.toggle("active", showDetailsView);
        document.getElementById("tbDetailsBtn").classList.toggle("active-toggle", showDetailsView);

        if (showDetailsView) {
          renderSkillTable("revDetailTableBody", slice, true);
          requestAnimationFrame(() => {
            syncTrampolinePanels(slice);
            drawForceGraph(
              document.getElementById("revDetailChartCanvas"),
              true,
              startIdx,
              deductionFrom
            );
          });
        }
      }

      function renderSkillTable(tbodyId, skills, isReviewTotal) {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = "";

        for (let i = 0; i < 10; i++) {
          const s = skills[i];
          const tr = document.createElement("tr");
          if (s) {
            tr.innerHTML = `
              <td><strong>${s.num}</strong></td>
              <td>${s.tof.toFixed(3)}</td>
              <td>${s.ded.toFixed(1)}</td>
              <td>${s.hd.toFixed(1)}</td>
              <td>${s.x}</td>
              <td>${s.y}</td>
            `;
          } else {
            tr.innerHTML = `<td><strong>${i + 1}</strong></td><td></td><td></td><td></td><td></td><td></td>`;
          }
          tbody.appendChild(tr);
        }

        const totTof = skills.reduce((a, s) => a + s.tof, 0);
        const totDed = skills.reduce((a, s) => a + s.ded, 0);
        const totHd = isReviewTotal
          ? Math.max(0, deductionFrom - totDed)
          : skills.reduce((a, s) => a + s.hd, 0);

        const totTr = document.createElement("tr");
        totTr.className = "tot-row";
        totTr.innerHTML = `
          <td>Tot</td>
          <td class="tot-blue">${totTof.toFixed(3)}</td>
          <td class="tot-blue">${totDed.toFixed(1)}</td>
          <td class="tot-blue">${totHd.toFixed(1)}</td>
          <td></td>
          <td></td>
        `;
        tbody.appendChild(totTr);
      }

      // --- UI Synchronization ---
      function syncStateUI() {
        STATE_NAMES.forEach((st) => {
          const pill = document.getElementById(`pill-${st}`);
          pill.className = "state-pill";
          if (st === currentState) {
            pill.classList.add(`active-${st.toLowerCase()}`);
          }
        });

        document.getElementById("gymPhaseBadge").textContent = currentState;

        document.getElementById("pane-READY").classList.toggle("active", currentState === "READY");
        document.getElementById("pane-LIVE").classList.toggle("active", currentState === "START" || currentState === "ROUTINE");
        document.getElementById("pane-REVIEW").classList.toggle("active", currentState === "REVIEW");

        document.getElementById("startTimerText").style.display = currentState === "START" ? "block" : "none";
        document.getElementById("liveRoutineTable").style.display = currentState === "ROUTINE" ? "table" : "none";

        const hints = {
          READY: "READY → START (press space)",
          START: "START → ROUTINE (first element)",
          ROUTINE: "ROUTINE → REVIEW (press space to finish)",
          REVIEW: "CONFIRM → READY (or X to dismiss)"
        };
        document.getElementById("spaceHint").textContent = hints[currentState];

        const statusHints = {
          READY: "Press SPACE to start (or ESC × 3 for Data Recovery)",
          START: "Athlete bouncing — press SPACE whenever ready for first skill",
          ROUTINE: "Recording live — press SPACE at end of routine to go to REVIEW",
          REVIEW: "Reviewing routine — press SPACE to confirm or X to dismiss"
        };
        document.getElementById("sbHint").textContent = statusHints[currentState];
      }

      function flashHardware(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("pressed");
        setTimeout(() => el.classList.remove("pressed"), 120);
      }

      // --- Safe Canvas Sizing (Zero Resize Loop on Mobile) ---
      function prepCanvas(canvas) {
        if (!canvas || !canvas.parentElement) return null;
        const w = Math.floor(canvas.parentElement.clientWidth);
        const h = Math.floor(canvas.parentElement.clientHeight);
        if (w <= 0 || h <= 0) return null;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.floor(w * dpr);
        const targetH = Math.floor(h * dpr);

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w, h };
      }

      function drawTrampolineBed(canvas, skills, isActive) {
        const info = prepCanvas(canvas);
        if (!info) return;
        const { ctx, w, h } = info;

        ctx.fillStyle = isActive ? "#ffffff" : "#f5f5f5";
        ctx.fillRect(0, 0, w, h);

        const lineCol = getBedGridColor(isActive);
        ctx.strokeStyle = lineCol;
        ctx.lineWidth = 1.2;

        const x1 = w * 0.25;
        const x2 = w * 0.75;
        const y1 = h * 0.25;
        const y2 = h * 0.75;

        ctx.beginPath();
        ctx.moveTo(x1, 0); ctx.lineTo(x1, h);
        ctx.moveTo(x2, 0); ctx.lineTo(x2, h);
        ctx.moveTo(0, y1); ctx.lineTo(w, y1);
        ctx.moveTo(0, y2); ctx.lineTo(w, y2);
        // inner side boxes (0.1) either side of the centre zone
        ctx.moveTo(w * 0.36, y1); ctx.lineTo(w * 0.36, y2);
        ctx.moveTo(w * 0.64, y1); ctx.lineTo(w * 0.64, y2);
        ctx.stroke();

        const cx = w / 2;
        const cy = h / 2;
        const crossLen = Math.min(18, Math.min(w, h) * 0.14);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - crossLen, cy); ctx.lineTo(cx + crossLen, cy);
        ctx.moveTo(cx, cy - crossLen); ctx.lineTo(cx, cy + crossLen);
        ctx.stroke();

        if (!isActive || !skills.length) return;

        const markerFill = isTramp2Selected() ? "#7e22ce" : "#43a047";
        const markerStroke = isTramp2Selected() ? "#4c1d95" : "#1b5e20";
        const compact = h < 130;
        const r = compact ? 6.5 : 8.5;

        skills.forEach((s) => {
          const px = cx + (s.x / 214) * (w / 2);
          const py = cy + (s.y / 107) * (h / 2);

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = markerFill;
          ctx.fill();
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = markerStroke;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${compact ? 8.5 : 10}px Segoe UI, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(s.num), px, py + 0.5);
        });
      }

      function drawForceGraph(canvas, showYellowBox, yellowStartIdx, yellowLength) {
        const info = prepCanvas(canvas);
        if (!info) return;
        const { ctx, w, h } = info;

        ctx.clearRect(0, 0, w, h);

        const compact = h < 115;
        const padL = compact ? 30 : 36;
        const padB = compact ? 10 : 18;
        const padT = compact ? 5 : 8;
        const padR = 8;
        const gw = w - padL - padR;
        const gh = h - padT - padB;
        const zeroY = padT + gh * 0.88;

        const totalSpikes = recordedJumps.length;
        const maxVisibleSpikes = Math.max(26, totalSpikes + 2);
        const spacing = gw / maxVisibleSpikes;

        if (showYellowBox && yellowLength > 0 && totalSpikes > 0) {
          const startSpikeIdx = Math.max(0, yellowStartIdx);
          const endSpikeIdx = Math.min(totalSpikes, yellowStartIdx + yellowLength);

          if (endSpikeIdx > startSpikeIdx) {
            const rx = padL + 6 + startSpikeIdx * spacing - spacing * 0.4;
            const rw = (endSpikeIdx - startSpikeIdx) * spacing;
            ctx.fillStyle = "#fff59d";
            ctx.fillRect(rx, padT, rw, gh);
          }
        }

        ctx.strokeStyle = "#dcdcdc";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#555";
        ctx.font = `${compact ? 8 : 9}px Segoe UI, sans-serif`;
        ctx.textAlign = "right";

        const steps = compact ? 3 : 6;
        for (let i = 0; i <= steps; i++) {
          const y = padT + (gh / steps) * i;
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(padL + gw, y);
          ctx.stroke();
          const val = Math.round(18000 - (18000 / steps) * i);
          ctx.fillText(String(val), padL - 4, y + 3);
        }

        ctx.strokeStyle = getTraceColor();
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(padL, zeroY);

        for (let i = 0; i < totalSpikes; i++) {
          const sx = padL + 8 + i * spacing;
          const amp = recordedJumps[i].amp ?? 0.58;
          const peakY = zeroY - gh * amp;
          ctx.lineTo(sx - 3, zeroY);
          ctx.lineTo(sx, peakY);
          ctx.lineTo(sx + 2.5, zeroY + 4);
          ctx.lineTo(sx + 5, zeroY - 4);
          ctx.lineTo(sx + 8, zeroY);
        }
        ctx.lineTo(padL + gw, zeroY);
        ctx.stroke();
      }

      // --- Synchronized Gymnast + Eurotramp Canvas Renderer (Scales to Compact Mobile Strip) ---
      function renderGymnastStage(now) {
        const canvas = document.getElementById("gymnastStageCanvas");
        const info = prepCanvas(canvas);
        if (!info) return;
        const { ctx, w, h } = info;

        ctx.clearRect(0, 0, w, h);

        const compact = h < 140;
        const figScale = compact ? 0.62 : 1.0;
        const floorY = h - (compact ? 10 : 18);
        const trampW = Math.min(w - (compact ? 36 : 24), compact ? 220 : 188);
        const trampLeft = (w - trampW) / 2;
        const trampRight = trampLeft + trampW;
        const bedLeft = trampLeft + 18;
        const bedRight = trampRight - 18;
        const bedRestY = floorY - (compact ? 26 : 52);

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, floorY);
        ctx.lineTo(w - 8, floorY);
        ctx.stroke();

        let bedDepression = 0;
        let gymnastY = bedRestY;
        let gymnastX = w / 2;
        let rotationRad = 0;
        let pose = "stand";
        let impactFlash = 0;

        const isActiveBounce = (currentState === "START" || currentState === "ROUTINE") && lastSpikeTime > 0 && !recoveryOpen;

        if (isActiveBounce) {
          const elapsed = now - lastSpikeTime;
          const phase = Math.min(1, Math.max(0, elapsed / currentCycleDuration));
          const contactEnd = 0.24;

          const normX = Math.max(-1, Math.min(1, prevLandingX / 214));
          const maxShiftPx = (bedRight - bedLeft) * 0.34;

          if (phase < contactEnd) {
            const c = phase / contactEnd;
            const bend = Math.sin(c * Math.PI);
            bedDepression = bend * (compact ? (8 + currentBounceAmp * 11) : (14 + currentBounceAmp * 20));
            gymnastY = bedRestY + bedDepression;
            gymnastX = w / 2 + normX * maxShiftPx;
            pose = "compress";
            impactFlash = Math.max(0, 1 - c * 1.6);
          } else {
            const f = (phase - contactEnd) / (1 - contactEnd);
            const parabola = 4 * f * (1 - f);
            const maxJumpHeight = compact
              ? Math.min(bedRestY - 22, 24 + currentBounceAmp * 52)
              : Math.min(bedRestY - 46, 55 + currentBounceAmp * 165);
            gymnastY = bedRestY - parabola * maxJumpHeight;

            const startX = w / 2 + normX * maxShiftPx;
            const endX = w / 2 + (nextLandingX / 214) * maxShiftPx;
            gymnastX = startX + (endX - startX) * f;

            if (f > 0.12 && f < 0.88) {
              pose = currentSkillAnim.pose;
              const rotProgress = (f - 0.12) / 0.76;
              rotationRad = -rotProgress * currentSkillAnim.flips * Math.PI * 2;
            } else {
              pose = "straight";
              rotationRad = 0;
            }
          }
        } else if (currentState === "REVIEW") {
          pose = "salute";
        }

        // Eurotramp Frame & Legs
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = compact ? 2.2 : 3;
        ctx.beginPath();
        ctx.moveTo(trampLeft + 6, floorY);
        ctx.lineTo(trampLeft + 14, bedRestY);
        ctx.moveTo(trampLeft + 24, floorY);
        ctx.lineTo(trampLeft + 14, bedRestY);

        ctx.moveTo(trampRight - 6, floorY);
        ctx.lineTo(trampRight - 14, bedRestY);
        ctx.moveTo(trampRight - 24, floorY);
        ctx.lineTo(trampRight - 14, bedRestY);
        ctx.stroke();

        // Eurotramp Frame Pads
        ctx.fillStyle = isTramp2Selected() ? "#7e22ce" : "#1e62d0";
        ctx.fillRect(trampLeft, bedRestY - 3, 20, 6);
        ctx.fillRect(trampRight - 20, bedRestY - 3, 20, 6);

        // Springs
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(trampLeft + 18, bedRestY);
        ctx.lineTo(bedLeft, bedRestY);
        ctx.moveTo(bedRight, bedRestY);
        ctx.lineTo(trampRight - 18, bedRestY);
        ctx.stroke();

        // Trampoline Bed
        ctx.strokeStyle = impactFlash > 0.1 ? (isTramp2Selected() ? "#c084fc" : "#38bdf8") : "#f8fafc";
        ctx.lineWidth = compact ? 2.4 : 3;
        ctx.beginPath();
        ctx.moveTo(bedLeft, bedRestY);
        ctx.quadraticCurveTo(gymnastX, bedRestY + bedDepression * 1.35, bedRight, bedRestY);
        ctx.stroke();

        // Center cross marker
        ctx.strokeStyle = isTramp2Selected() ? "#a855f7" : "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 6, bedRestY + bedDepression * 0.65);
        ctx.lineTo(w / 2 + 6, bedRestY + bedDepression * 0.65);
        ctx.stroke();

        if (impactFlash > 0.05) {
          ctx.strokeStyle = isTramp2Selected()
            ? `rgba(192, 132, 252, ${impactFlash * 0.85})`
            : `rgba(56, 189, 248, ${impactFlash * 0.85})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(gymnastX, gymnastY + 2, (16 + (1 - impactFlash) * 20) * figScale, 4 * figScale, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        drawGymnastFigure(ctx, gymnastX, gymnastY, rotationRad, pose, figScale);
      }

      function drawGymnastFigure(ctx, feetX, feetY, rotationRad, pose, figScale = 1.0) {
        ctx.save();
        const bodyH = (pose === "compress" ? 36 : 46) * figScale;
        const comY = feetY - bodyH * 0.52;
        ctx.translate(feetX, comY);
        ctx.scale(figScale, figScale);
        ctx.rotate(rotationRad);

        const skin = "#fde68a";
        const singlet = isTramp2Selected() ? "#c084fc" : "#38bdf8";
        const pants = "#f8fafc";

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (pose === "tuck") {
          ctx.strokeStyle = pants;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-2, 4);
          ctx.lineTo(10, -2);
          ctx.lineTo(4, 12);
          ctx.stroke();

          ctx.strokeStyle = singlet;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-4, -8);
          ctx.lineTo(-2, 5);
          ctx.stroke();

          ctx.strokeStyle = skin;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-3, -6);
          ctx.lineTo(8, 5);
          ctx.stroke();

          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(-5, -14, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (pose === "pike" || pose === "pikeJump") {
          ctx.strokeStyle = pants;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-2, 4);
          ctx.lineTo(16, -12);
          ctx.stroke();

          ctx.strokeStyle = singlet;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-8, -10);
          ctx.lineTo(-2, 4);
          ctx.stroke();

          ctx.strokeStyle = skin;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(13, -11);
          ctx.stroke();

          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(-10, -16, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (pose === "straddle") {
          ctx.strokeStyle = pants;
          ctx.lineWidth = 4.8;
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(-16, 14);
          ctx.moveTo(0, 3);
          ctx.lineTo(16, 14);
          ctx.stroke();

          ctx.strokeStyle = singlet;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(0, 4);
          ctx.stroke();

          ctx.strokeStyle = skin;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(-16, -15);
          ctx.moveTo(0, -9);
          ctx.lineTo(16, -15);
          ctx.stroke();

          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(0, -18, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (pose === "compress") {
          ctx.strokeStyle = pants;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(7, 10);
          ctx.lineTo(0, 18);
          ctx.stroke();

          ctx.strokeStyle = singlet;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(-2, -10);
          ctx.lineTo(0, 2);
          ctx.stroke();

          ctx.strokeStyle = skin;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(-1, -8);
          ctx.lineTo(10, 2);
          ctx.stroke();

          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(-2, -16, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = pants;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, 23);
          ctx.stroke();

          ctx.strokeStyle = singlet;
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(0, 4);
          ctx.stroke();

          ctx.strokeStyle = skin;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          if (pose === "salute") {
            ctx.moveTo(0, -9);
            ctx.lineTo(-13, -22);
            ctx.moveTo(0, -9);
            ctx.lineTo(13, -22);
          } else {
            ctx.moveTo(0, -9);
            ctx.lineTo(-5, -23);
            ctx.moveTo(0, -9);
            ctx.lineTo(5, -23);
          }
          ctx.stroke();

          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(0, -18, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      function startCanvasLoop() {
        function tick(now) {
          if ((currentState === "START" || currentState === "ROUTINE") && !recoveryOpen) {
            const activeSlice = currentState === "ROUTINE"
              ? getWindowSlice(warmupSpikesCount, capturedCount)
              : [];
            syncTrampolinePanels(activeSlice);
            drawForceGraph(
              document.getElementById("forceChartCanvas"),
              currentState === "ROUTINE",
              warmupSpikesCount,
              capturedCount
            );
            renderGymnastStage(now);
            animId = requestAnimationFrame(tick);
          }
        }
        animId = requestAnimationFrame(tick);
      }

      // --- Event Bindings ---
      function shiftRoutine(delta) {
        if (currentState !== "REVIEW") return;
        flashHardware(delta < 0 ? "keyLeft" : "keyRight");
        const { minShift, maxShift } = getShiftBounds(deductionFrom);
        routineShifted = Math.max(minShift, Math.min(maxShift, routineShifted + delta));
        beep(540, 0.04);
        refreshReviewCalculations();
      }

      function adjustDeductionFrom(delta) {
        if (currentState !== "REVIEW") return;
        flashHardware(delta > 0 ? "keyUp" : "keyDown");
        const maxSelectable = Math.min(10, recordedJumps.length);
        deductionFrom = Math.max(1, Math.min(maxSelectable, deductionFrom + delta));
        beep(delta > 0 ? 600 : 480, 0.04);
        refreshReviewCalculations();
      }

      window.addEventListener("keydown", (e) => {
        if (e.code === "Escape") {
          e.preventDefault();
          handleEscPress();
          return;
        }

        if (recoveryOpen) {
          if (e.code === "Enter" || e.code === "Space") {
            e.preventDefault();
            confirmRecoverySelection();
          }
          return;
        }

        if (e.code === "Space") {
          e.preventDefault();
          handleSpaceAction();
        } else if (e.code === "KeyX" && currentState === "REVIEW") {
          e.preventDefault();
          dismissReviewResult();
        } else if (e.code === "KeyD" && currentState === "REVIEW") {
          e.preventDefault();
          flashHardware("keyD");
          showDetailsView = !showDetailsView;
          refreshReviewCalculations();
        } else if (e.code === "ArrowUp" && currentState === "REVIEW") {
          e.preventDefault();
          adjustDeductionFrom(1);
        } else if (e.code === "ArrowDown" && currentState === "REVIEW") {
          e.preventDefault();
          adjustDeductionFrom(-1);
        } else if (e.code === "ArrowLeft" && currentState === "REVIEW") {
          e.preventDefault();
          shiftRoutine(-1);
        } else if (e.code === "ArrowRight" && currentState === "REVIEW") {
          e.preventDefault();
          shiftRoutine(1);
        }
      });

      setupRecoverySliderInteractions();

      document.getElementById("recBtnTramp1").addEventListener("click", () => {
        beep(620, 0.04);
        setTrampolineSelection(1, true);
      });
      document.getElementById("recBtnTramp2").addEventListener("click", () => {
        beep(680, 0.04);
        setTrampolineSelection(2, true);
      });

      document.getElementById("keyEsc").addEventListener("click", handleEscPress);
      document.getElementById("recOkBtn").addEventListener("click", confirmRecoverySelection);
      document.getElementById("recCancelBtn").addEventListener("click", closeRecoveryModal);
      document.getElementById("recCloseBtn").addEventListener("click", closeRecoveryModal);

      document.getElementById("keySpace").addEventListener("click", handleSpaceAction);
      document.getElementById("usbButton").addEventListener("click", handleSpaceAction);
      document.getElementById("usbButtonInline").addEventListener("click", handleSpaceAction);
      document.getElementById("btnConfirm").addEventListener("click", () => {
        if (currentState === "REVIEW") confirmReviewResult();
      });
      document.getElementById("btnDismiss").addEventListener("click", dismissReviewResult);
      document.getElementById("keyX").addEventListener("click", dismissReviewResult);

      document.getElementById("keyD").addEventListener("click", () => {
        if (currentState === "REVIEW") {
          flashHardware("keyD");
          showDetailsView = !showDetailsView;
          refreshReviewCalculations();
        }
      });
      document.getElementById("tbDetailsBtn").addEventListener("click", () => {
        if (currentState === "REVIEW") {
          showDetailsView = !showDetailsView;
          refreshReviewCalculations();
        }
      });
      document.getElementById("swapDetailsBtn").addEventListener("click", () => {
        if (currentState === "REVIEW") {
          showDetailsView = !showDetailsView;
          refreshReviewCalculations();
        }
      });

      document.getElementById("keyUp").addEventListener("click", () => adjustDeductionFrom(1));
      document.getElementById("keyDown").addEventListener("click", () => adjustDeductionFrom(-1));
      document.getElementById("keyLeft").addEventListener("click", () => shiftRoutine(-1));
      document.getElementById("keyRight").addEventListener("click", () => shiftRoutine(1));

      document.getElementById("trampSelect").addEventListener("change", (e) => {
        const val = e.target.value;
        const trampNum = val === "Trampoline 2" ? 2 : 1;
        setTrampolineSelection(trampNum, true);
        if (currentState === "READY" || currentState === "REVIEW") {
          renderGymnastStage(performance.now());
        }
      });

      document.getElementById("taraBtn").addEventListener("click", () => {
        beep(780, 0.08);
        const readyText = document.getElementById("readyMainText");
        readyText.textContent = "TARA CALIBRATED (0 N)";
        setTimeout(() => { readyText.textContent = "READY TO GO"; }, 900);
      });

      document.getElementById("soundToggleBtn").addEventListener("click", (e) => {
        audioOn = !audioOn;
        e.target.textContent = `Audio: ${audioOn ? "ON" : "OFF"}`;
      });

      // Initial render of standing gymnast
      requestAnimationFrame((t) => renderGymnastStage(t));
      window.addEventListener("resize", () => {
        if (recoveryOpen) {
          updateRecoveryUI();
        } else if (currentState === "READY" || currentState === "REVIEW") {
          renderGymnastStage(performance.now());
        }
      });
    })();
  
