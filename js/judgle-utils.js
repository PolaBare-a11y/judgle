/* JUDGLE UTILS - small helpers shared by the tools: HTML escaping, audio/haptic feedback, swipe classifier. */
(function (root) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---- Audio + haptic feedback ---- */
  var audioCtx = null;
  function beep(freq, start, dur) {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(start); osc.stop(start + dur);
  }
  function haptic(type) {
    if (!('vibrate' in navigator)) return;
    try { navigator.vibrate(type === 'landing' ? [45, 50, 45] : type === 'complete' ? [35, 45, 70] : type === 'transition' ? 15 : 25); } catch (e) {}
  }
  /* type: tap | transition | landing | complete.  opts.step/opts.steps raise the 'tap' pitch per skill. */
  function trigger(type, opts) {
    haptic(type);
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var now = audioCtx.currentTime;
      if (type === 'landing') { beep(880, now, 0.04); beep(1100, now + 0.07, 0.06); }
      else if (type === 'complete') { beep(660, now, 0.04); beep(880, now + 0.06, 0.08); }
      else if (type === 'transition') { beep(520, now, 0.04); }
      else if (opts && typeof opts.step === 'number' && opts.steps > 0) {
        var step = Math.min(Math.max(opts.step, 0), opts.steps - 1);
        beep(440 + step * (400 / Math.max(1, opts.steps - 1)), now, 0.035);
      } else { beep(520, now, 0.035); }
    } catch (e) {}
  }

  /* ---- Swipe classifier: points [{x,y}] -> tap | circle | up | down | left | right ---- */
  function classifySwipe(points) {
    if (!points || !points.length) return null;
    var s = points[0], e = points[points.length - 1], path = 0;
    var minX = s.x, maxX = s.x, minY = s.y, maxY = s.y;
    for (var i = 1; i < points.length; i++) {
      var dx = points[i].x - points[i - 1].x, dy = points[i].y - points[i - 1].y;
      path += Math.sqrt(dx * dx + dy * dy);
      minX = Math.min(minX, points[i].x); maxX = Math.max(maxX, points[i].x);
      minY = Math.min(minY, points[i].y); maxY = Math.max(maxY, points[i].y);
    }
    var nx = e.x - s.x, ny = e.y - s.y, net = Math.sqrt(nx * nx + ny * ny);
    if (path < 30) return 'tap';
    if (path > 90 && net < 70 && (maxX - minX) > 30 && (maxY - minY) > 30) return 'circle';
    if (Math.abs(ny) >= Math.abs(nx)) return ny < 0 ? 'up' : 'down';
    return nx > 0 ? 'right' : 'left';
  }

  root.JudgleUtils = { escapeHtml: escapeHtml };
  root.JudgleFeedback = { trigger: trigger };
  root.JudgleGestures = { classifySwipe: classifySwipe };
})(window);
