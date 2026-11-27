/* JUDGLE RECOGNIZER - $P point-cloud handwriting recogniser plus shared trained-pattern storage.
   One recogniser instance (JudgleRecognizer.shared) is used by every tool, so a digit trained
   in one tool is available in all. Requires judgle-storage.js. */
(function (root) {
  'use strict';
  class Point {
      constructor(x, y, strokeId = 1) {
        this.x = x;
        this.y = y;
        this.strokeId = strokeId;
      }
    }

    class PDollarPointSet {
      constructor(name, points) {
        this.Name = name;
        this.Points = pResample(points, 32);
        this.Points = pScale(this.Points);
        this.Points = pTranslateToOrigin(this.Points);
      }
    }

    class PDollarRecognizer {
      constructor() {
        this.PointSets = [];
        this.initTemplates();
      }

      Recognize(points) {
        if (!points || points.length === 0) return { Name: "0", Score: 0 };
        let candidate = pResample(points, 32);
        candidate = pScale(candidate);
        candidate = pTranslateToOrigin(candidate);

        let bestDistance = Infinity;
        let bestTemplate = null;

        for (let i = 0; i < this.PointSets.length; i++) {
          let dist = pGreedyMatch(candidate, this.PointSets[i].Points);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestTemplate = this.PointSets[i];
          }
        }

        let score = bestTemplate ? Math.max(0, (2.0 - bestDistance) / 2.0) : 0;
        return {
          Name: bestTemplate ? bestTemplate.Name : "0",
          Score: score
        };
      }

      initTemplates() {
        this.PointSets = [];
        const makePolyline = (keyPoints, strokeId = 1) => {
          let pts = [];
          for (let i = 0; i < keyPoints.length - 1; i++) {
            let p1 = keyPoints[i];
            let p2 = keyPoints[i + 1];
            let steps = 10;
            for (let s = 0; s < steps; s++) {
              let t = s / steps;
              pts.push(new Point(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y), strokeId));
            }
          }
          let last = keyPoints[keyPoints.length - 1];
          pts.push(new Point(last.x, last.y, strokeId));
          return pts;
        };

        const makeCircle = (cx, cy, r, strokeId = 1, counterClockwise = false) => {
          let pts = [];
          let steps = 32;
          for (let i = 0; i <= steps; i++) {
            let angle = (i / steps) * 2 * Math.PI * (counterClockwise ? -1 : 1) - Math.PI / 2;
            pts.push(new Point(cx + r * Math.cos(angle), cy + r * Math.sin(angle), strokeId));
          }
          return pts;
        };

        this.PointSets.push(new PDollarPointSet("0", makeCircle(0.5, 0.5, 0.4, 1, false)));
        this.PointSets.push(new PDollarPointSet("0", makeCircle(0.5, 0.5, 0.4, 1, true)));

        this.PointSets.push(new PDollarPointSet("1", makePolyline([{x:0.5, y:0.1}, {x:0.5, y:0.9}], 1)));
        this.PointSets.push(new PDollarPointSet("1", makePolyline([{x:0.35, y:0.25}, {x:0.5, y:0.1}, {x:0.5, y:0.9}], 1)));

        this.PointSets.push(new PDollarPointSet("2", makePolyline([{x:0.2, y:0.25}, {x:0.5, y:0.1}, {x:0.8, y:0.25}, {x:0.5, y:0.5}, {x:0.2, y:0.85}, {x:0.8, y:0.85}], 1)));

        this.PointSets.push(new PDollarPointSet("3", makePolyline([{x:0.25, y:0.15}, {x:0.75, y:0.15}, {x:0.45, y:0.45}, {x:0.8, y:0.65}, {x:0.25, y:0.85}], 1)));

        this.PointSets.push(new PDollarPointSet("4", makePolyline([{x:0.7, y:0.85}, {x:0.7, y:0.15}, {x:0.2, y:0.6}, {x:0.85, y:0.6}], 1)));
        this.PointSets.push(new PDollarPointSet("4", makePolyline([{x:0.7, y:0.15}, {x:0.2, y:0.6}, {x:0.85, y:0.6}], 1).concat(makePolyline([{x:0.7, y:0.4}, {x:0.7, y:0.9}], 2))));

        this.PointSets.push(new PDollarPointSet("5", makePolyline([{x:0.8, y:0.15}, {x:0.3, y:0.15}, {x:0.3, y:0.45}, {x:0.75, y:0.55}, {x:0.6, y:0.85}, {x:0.25, y:0.85}], 1)));

        let stroke1_10 = makePolyline([{x:0.25, y:0.15}, {x:0.25, y:0.85}], 1);
        let stroke2_10 = makeCircle(0.7, 0.5, 0.35, 2, false);
        let stroke2_10_ccw = makeCircle(0.7, 0.5, 0.35, 2, true);

        this.PointSets.push(new PDollarPointSet("10", stroke1_10.concat(stroke2_10)));
        this.PointSets.push(new PDollarPointSet("10", stroke1_10.concat(stroke2_10_ccw)));
      }
    }

    function pDistance(p1, p2) {
      let dx = p1.x - p2.x;
      let dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function pPathLength(points) {
      let d = 0;
      for (let i = 1; i < points.length; i++) {
        if (points[i].strokeId === points[i - 1].strokeId) {
          d += pDistance(points[i - 1], points[i]);
        }
      }
      return d;
    }

    function pResample(points, n) {
      const I = pPathLength(points) / (n - 1);
      if (I === 0 || !isFinite(I)) {
        let pts = [];
        for (let i = 0; i < n; i++) pts.push(new Point(points[0].x, points[0].y, points[0].strokeId));
        return pts;
      }
      let D = 0.0;
      let newPoints = [new Point(points[0].x, points[0].y, points[0].strokeId)];
      let ptsCopy = [...points];

      for (let i = 1; i < ptsCopy.length; i++) {
        if (ptsCopy[i].strokeId === ptsCopy[i - 1].strokeId) {
          let d = pDistance(ptsCopy[i - 1], ptsCopy[i]);
          if (D + d >= I) {
            let qx = ptsCopy[i - 1].x + ((I - D) / d) * (ptsCopy[i].x - ptsCopy[i - 1].x);
            let qy = ptsCopy[i - 1].y + ((I - D) / d) * (ptsCopy[i].y - ptsCopy[i - 1].y);
            let q = new Point(qx, qy, ptsCopy[i].strokeId);
            newPoints.push(q);
            ptsCopy.splice(i, 0, q);
            D = 0.0;
          } else {
            D += d;
          }
        }
      }
      while (newPoints.length < n) {
        newPoints.push(new Point(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].strokeId));
      }
      return newPoints.slice(0, n);
    }

    function pScale(points) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let p of points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      let size = Math.max(maxX - minX, maxY - minY);
      if (size === 0) size = 1;
      let newPoints = [];
      for (let p of points) {
        let qx = (p.x - minX) / size;
        let qy = (p.y - minY) / size;
        newPoints.push(new Point(qx, qy, p.strokeId));
      }
      return newPoints;
    }

    function pTranslateToOrigin(points) {
      let c = pCentroid(points);
      let newPoints = [];
      for (let p of points) {
        newPoints.push(new Point(p.x - c.x, p.y - c.y, p.strokeId));
      }
      return newPoints;
    }

    function pCentroid(points) {
      let x = 0, y = 0;
      for (let p of points) {
        x += p.x;
        y += p.y;
      }
      return { x: x / points.length, y: y / points.length };
    }

    function pGreedyMatch(points1, points2) {
      let n = points1.length;
      let e = 0.5;
      let step = Math.floor(Math.pow(n, 1 - e));
      let minDistance = Infinity;
      for (let i = 0; i < n; i += step) {
        let d1 = pCloudDistance(points1, points2, i);
        let d2 = pCloudDistance(points2, points1, i);
        minDistance = Math.min(minDistance, d1, d2);
      }
      return minDistance;
    }

    function pCloudDistance(pts1, pts2, start) {
      let n = pts1.length;
      let matched = new Array(n).fill(false);
      let sum = 0;
      let i = start;
      do {
        let index = -1;
        let minD = Infinity;
        for (let j = 0; j < n; j++) {
          if (!matched[j]) {
            let d = pDistance(pts1[i], pts2[j]);
            if (d < minD) {
              minD = d;
              index = j;
            }
          }
        }
        matched[index] = true;
        let weight = 1 - ((i - start + n) % n) / n;
        sum += weight * minD;
        i = (i + 1) % n;
      } while (i !== start);
      return sum;
    }

  
  var shared = new PDollarRecognizer();
  var trained = {};

  function loadSaved() {
    JudgleStorage.migratePatterns();
    var list = JudgleStorage.getJSON(JudgleStorage.KEYS.patterns, []);
    if (!Array.isArray(list)) return;
    list.forEach(function (item) {
      if (item && item.name && Array.isArray(item.points) && item.points.length >= 3) {
        shared.PointSets.push(new PDollarPointSet(String(item.name), item.points.map(function (p) { return new Point(p.x, p.y, p.strokeId || 1); })));
        trained[item.name] = true;
      }
    });
  }
  function saveTemplate(digit, points) {
    shared.PointSets.push(new PDollarPointSet(digit, points));
    var list = JudgleStorage.getJSON(JudgleStorage.KEYS.patterns, []);
    if (!Array.isArray(list)) list = [];
    list.push({ name: digit, points: points.map(function (p) { return { x: p.x, y: p.y, strokeId: p.strokeId }; }) });
    JudgleStorage.setJSON(JudgleStorage.KEYS.patterns, list);
    trained[digit] = true;
  }
  function resetSaved() {
    JudgleStorage.setJSON(JudgleStorage.KEYS.patterns, []);
    Object.keys(trained).forEach(function (k) { delete trained[k]; });
    shared.initTemplates();
  }

  root.JudgleRecognizer = { Point: Point, PDollarPointSet: PDollarPointSet, PDollarRecognizer: PDollarRecognizer,
    shared: shared, trained: trained, loadSaved: loadSaved, saveTemplate: saveTemplate, resetSaved: resetSaved };
})(window);
