Object.getPrototypeOf(document.createElement('canvas').getContext('2d')).getImageAlphas =
  function(x, y, width, height) {
    var imgData = this.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    var alphas = [];
    for (var i = 3; i < imgData.length; i += 4) {
      alphas.push(imgData[i]);
    }
    return alphas;
  }

Object.getPrototypeOf(document.createElement('canvas').getContext('2d')).drawCanvasObject =
  function(object) {
   object.draw(this);
  }

Object.getPrototypeOf(document.createElement('canvas').getContext('2d')).clear =
  function() {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

function Line(width, height) {
  this.startx = _.random(width);
  this.starty = _.random(height);
  this.endx = _.random(width);
  this.endy = _.random(height);
}

Line.prototype.draw = function(context) {
  context.beginPath();
  context.moveTo(this.startx, this.starty);
  context.lineTo(this.endx, this.endy);
  context.stroke();
};

function QuadraticCurve(width, height) {
  this.startx = _.random(width);
  this.starty = _.random(height);
  this.cpx = _.random(width);
  this.cpy = _.random(height);
  this.endx = _.random(width);
  this.endy = _.random(height);
}

QuadraticCurve.prototype.draw = function(context) {
  context.beginPath();
  context.moveTo(this.startx, this.starty);
  context.quadraticCurveTo(this.cpx, this.cpy, this.endx, this.endy);
  context.stroke();
}

function BezierCurve(width, height) {
  this.startx = _.random(width);
  this.starty = _.random(height);
  this.cp1x = _.random(width);
  this.cp1y = _.random(height);
  this.cp2x = _.random(width);
  this.cp2y = _.random(height);
  this.endx = _.random(width);
  this.endy = _.random(height);
}

BezierCurve.prototype.draw = function(context) {
  context.beginPath();
  context.moveTo(this.startx, this.starty);
  context.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.endx, this.endy);
  context.stroke();
}


function randomCanvasObject(width, height) {
  switch (_.random(2)) {
  case 0:
    return new Line(width, height);
  case 1:
    return new QuadraticCurve(width, height);
  case 2:
    return new BezierCurve(width, height);
  }
}

function CanvasObjectArray(width, height) {
  this.width = width;
  this.height = height;
  this.objects = [];
}
CanvasObjectArray.prototype.evolve = function() {
  // First randomly throw away some objects
  this.objects = _.filter(this.objects, function() { return _.random(4) > 0 });
  // Now randomly add some objects
  while (_.random(2) < 1) {
    this.objects.push(randomCanvasObject(this.width, this.height));
  }
}
CanvasObjectArray.prototype.clone = function() {
  var newArray = new CanvasObjectArray(this.width, this.height);
  // Create a new array with the same contents
  newArray.objects = this.objects.slice(0);
  return newArray;
}
CanvasObjectArray.prototype.draw = function(context) {
  context.clearRect(0, 0, context.width, context.height);
  _.map(this.objects, function(o) { o.draw(context) });
}

function ObjectCanvas (width, height) {
  this.canvas = document.createElement('canvas');
  this.canvas.width = width;
  this.canvas.height = height;
  this.canvas.className = "childCanvas";

  this.context = this.canvas.getContext('2d');
  this.context.lineWidth = 12;

  this.objects = new CanvasObjectArray(width, height);
}
ObjectCanvas.prototype.draw = function () {
  this.context.clear();
  this.objects.draw(this.context);
}
ObjectCanvas.prototype.highlight = function (color) {
  var oldStyle = this.context.strokeStyle;
  var oldWidth = this.context.lineWidth;

  this.context.clear();
  this.context.strokeStyle = color;
  this.context.lineWidth = 4;

  this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);

  this.context.strokeStyle = oldStyle;
  this.context.lineWidth = oldWidth;
  this.objects.draw(this.context);
}

function computeContextDifference(c1, c2) {
  if (c1.width != c2.width || c1.height != c2.height) {
    throw("Cannot compute difference of different sized canvases");
  }

  var alphas1 = c1.getImageAlphas();
  var alphas2 = c2.getImageAlphas();

  var diffs = _.map(_.zip(alphas1, alphas2),
                   function(pair) { return Math.abs(pair[0] - pair[1]) });

  var sum = _.reduce(diffs, function(s, cur) { return s + cur; });

  return (sum / 255.0 * 100) / alphas1.length;
}

function argMin (arr, fun) {
  var vals = _.map(arr, fun);
  var minVal = vals[0];
  var minIndex = 0;
  for (var i = 0; i < arr.length; i++){
    if(vals[i] < minVal){
      minIndex = i;
      minVal = vals[i];
    }
  }
  return arr[minIndex];
}

function minIndex (arr, fun) {
  var vals = _.map(arr, fun);
  var minVal = vals[0];
  var minIndex = 0;
  for (var i = 0; i < arr.length; i++) {
    if (vals[i] < minVal) {
      minIndex = i;
      minVal = vals[i];
    }
  }
  return minIndex;
}

window.onload = function() {
  var canvasWidth = 100, canvasHeight = 100;

  var targetChar = "A";
  targetC = document.getElementById('targetCanvas').getContext('2d');
  targetC.canvas.width = canvasWidth;
  targetC.canvas.height = canvasHeight;
  targetC.font = "bold 100px sans-serif";
  targetC.textBaseline = "top";
  targetC.fillText(targetChar, 0, 0);

  bestC = new ObjectCanvas(canvasWidth, canvasHeight);
  bestC.canvas = document.getElementById('bestCanvas');
  bestC.canvas.width = canvasWidth;
  bestC.canvas.height = canvasHeight;
  bestC.context = bestC.canvas.getContext('2d');
  bestC.context.lineWidth = 12;
  bestC.draw();
  var bestDifference = computeContextDifference(bestC.context, targetC);

  var childCount = 5;
  children = _(childCount).times(function () { return new ObjectCanvas(canvasWidth, canvasHeight) });
  _.each(children, function (c) { document.getElementById("childContainer").appendChild(c.canvas) } );

  function reset () {
    targetChar = document.getElementById('targetCharTextField').value;
    targetC.clear();
    targetC.fillText(targetChar, 0, 0);

    bestC.objects = new CanvasObjectArray(canvasWidth, canvasHeight);
    bestC.draw();
    _.each(children, function (c) { c.context.clear() });

    bestDifference = computeContextDifference(bestC.context, targetC);
  }
  document.getElementById('resetButton').onclick = reset;
  document.getElementById('targetButton').onclick = reset;

  var updateLoopIntervalId;
  var playing = true;

  function playPause () {
    if (playing) { // Pause
      playing = false;
      clearInterval(updateLoopIntervalId);
      document.getElementById('playPauseButton').innerHTML = '<i class="icon-play"></i>';
    }
    else { // Play
      playing = true;
      updateLoopIntervalId = window.setInterval(updateLoop, 100);
      document.getElementById('playPauseButton').innerHTML = '<i class="icon-pause"></i>';
    }
  }
  document.getElementById('playPauseButton').onclick = playPause;

  function updateLoop () {
    // Draw the current best (ie. the parent)
    bestC.draw();

    // Create clones of the parent, and evolve them
    _.each(children, function (c) { c.objects = bestC.objects.clone() });
    _.each(children, function (c) { c.objects.evolve() });
    _.each(children, function (c) { c.draw() });

    // Find the best of the new batch and consider replacing the parent
    var bestIndex = minIndex(children, function (c) { return computeContextDifference(targetC, c.context) });
    var bestChild = children[bestIndex];
    var bestChildDifference = computeContextDifference(bestChild.context, targetC);
    if (bestChildDifference < bestDifference) {
      bestChild.highlight("rgba(70, 136, 71, 0.5)");
      bestC.objects = bestChild.objects;
      bestC.highlight("rgba(70, 136, 71, 0.5)");
      bestDifference = bestChildDifference;
    }
    else {
      bestChild.highlight("rgba(192, 152, 83, 0.5)");
    }
  }

  document.getElementById("stepButton").onclick = updateLoop;

  var loopInterval = 100;

  document.getElementById("fasterButton").onclick = function () {
    loopInterval /= 2;
    clearInterval(updateLoopIntervalId);
    updateLoopIntervalId = window.setInterval(updateLoop, loopInterval);
  }

  document.getElementById("slowerButton").onclick = function () {
    loopInterval *= 2;
    clearInterval(updateLoopIntervalId);
    updateLoopIntervalId = window.setInterval(updateLoop, loopInterval);
  }

  updateLoopIntervalId = window.setInterval(updateLoop, loopInterval);

};
