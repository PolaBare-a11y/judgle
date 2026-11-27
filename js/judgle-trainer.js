/* JUDGLE TRAINER - shared "train a digit" modal used by jed and rtinput.
   Pages only need #hint-<digit> elements (optional) and #btnResetPatterns (optional);
   the modal itself is created here. Requires judgle-recognizer.js, judgle-utils.js. */
(function (root) {
  'use strict';
  var R = root.JudgleRecognizer, currentDigit = null, points = [], strokeId = 0, down = false;
  var modal, canvas, ctx;

  function build() {
    if (document.getElementById('trainerModal')) return;
    var host = document.querySelector('.main-content') || document.body;
    var el = document.createElement('div');
    el.id = 'trainerModal'; el.className = 'modal-overlay hidden';
    el.innerHTML =
      '<div class="trainer-modal-card">' +
        '<div class="trainer-header"><div class="trainer-title" id="trainerTitle">Train Digit</div>' +
        '<div class="trainer-subtitle">Draw your custom stroke pattern below</div></div>' +
        '<div class="trainer-canvas-wrapper"><canvas id="trainerCanvas" class="trainer-canvas"></canvas></div>' +
        '<div class="trainer-btn-group">' +
          '<button type="button" class="trainer-btn btn-clear" onclick="clearTrainerCanvas()">Clear</button>' +
          '<button type="button" class="trainer-btn btn-cancel" onclick="closeTemplateTrainer()">Cancel</button>' +
          '<button type="button" class="trainer-btn btn-save" onclick="saveCustomTemplate()">Save Pattern</button>' +
        '</div></div>';
    host.appendChild(el);
    modal = el; canvas = el.querySelector('#trainerCanvas'); ctx = canvas.getContext('2d');
    wire();
  }
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function wire() {
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      down = true; strokeId++;
      var p = pos(e); points.push(new R.Point(p.x, p.y, strokeId));
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--fig-green').trim() || '#9bd98b';
      ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!down) return; e.preventDefault();
      var p = pos(e); points.push(new R.Point(p.x, p.y, strokeId)); ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    var end = function (e) { if (!down) return; down = false; try { canvas.releasePointerCapture(e.pointerId); } catch (x) {} };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    window.addEventListener('resize', function () { if (modal && !modal.classList.contains('hidden')) root.initTrainerCanvas(); });
  }

  root.openTemplateTrainer = function (digit) {
    build(); currentDigit = digit;
    document.getElementById('trainerTitle').textContent = 'Train Digit "' + digit + '"';
    modal.classList.remove('hidden');
    setTimeout(root.initTrainerCanvas, 50);
  };
  root.initTrainerCanvas = function () {
    if (!canvas || !modal || modal.classList.contains('hidden')) return;
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    root.clearTrainerCanvas();
  };
  root.clearTrainerCanvas = function () {
    points = []; strokeId = 0;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  root.closeTemplateTrainer = function () {
    root.clearTrainerCanvas();
    if (modal) modal.classList.add('hidden');
  };
  root.saveCustomTemplate = function () {
    if (!points || points.length < 3) { alert('Please draw a stroke pattern before saving.'); return; }
    R.saveTemplate(currentDigit, points);
    root.updateTrainedHints();
    root.JudgleFeedback.trigger('complete');
    root.closeTemplateTrainer();
  };
  root.updateTrainedHints = function () {
    var any = false;
    ['0', '1', '2', '3', '4', '5', '10'].forEach(function (d) {
      var el = document.getElementById('hint-' + d);
      if (!el) return;
      if (R.trained[d]) { any = true; el.innerHTML = '<span>Tap to train</span><span class="num-guide-tick">\u2713</span>'; }
      else el.innerHTML = '<span>Tap to train</span>';
    });
    var btn = document.getElementById('btnResetPatterns');
    if (btn) btn.classList.toggle('hidden', !any);
  };
  root.resetSavedTemplates = root.clearSavedCustomTemplates = function () {
    if (!confirm('Clear all saved custom handwriting patterns and revert to defaults?')) return;
    R.resetSaved();
    root.updateTrainedHints();
    root.JudgleFeedback.trigger('transition');
    if (typeof root.showUndoToast === 'function') root.showUndoToast('Custom patterns reset');
  };

  document.addEventListener('DOMContentLoaded', function () {
    build(); R.loadSaved(); root.updateTrainedHints();
  });
})(window);
