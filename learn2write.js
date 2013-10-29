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
CanvasObjectArray.prototype.permute = function() {
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
  for (var i = 0; i < arr.length; i++){
    if(vals[i] < minVal){
      minIndex = i;
      minVal = vals[i];
    }
  }
  return minIndex;
}

window.onload = function() {
  targetC = document.getElementById('targetCanvas').getContext('2d');
  targetC.canvas.width = 100;
  targetC.canvas.height = 100;
  targetC.font = "bold 100px sans-serif";
  targetC.textBaseline = "top";
  targetC.fillText("B", 0, 0);

  bestC = document.getElementById('bestCanvas').getContext('2d');
  bestC.canvas.width = 100;
  bestC.canvas.height = 100;
  bestC.lineWidth = 12;


  contexts = [];
  var childCount = 5
  for(var i = 0; i < childCount; i++){
    var newCanvas = document.createElement('canvas');
    newCanvas.width = 100;
    newCanvas.height = 100;
    document.body.appendChild(newCanvas);
    var newContext = newCanvas.getContext('2d');
    newContext.lineWidth = 12;
    contexts.push(newContext);
  }

  var parentObjectArray = new CanvasObjectArray(100, 100);
  var bestDifference = 100;

  updateLoop = function () {
    bestC.clear();
    parentObjectArray.draw(bestC);
    var childObjectArrays = _(childCount).times(function() {return parentObjectArray.clone()});
    _.invoke(childObjectArrays, 'permute')
    _.invoke(contexts, 'clear');
    _.map(_.zip(contexts, childObjectArrays), function (pair) { pair[1].draw(pair[0]) });
    var bestIndex = minIndex(contexts, _.partial(computeContextDifference, targetC));
    var bestChild = childObjectArrays[bestIndex];
    if (computeContextDifference(contexts[bestIndex], targetC) < bestDifference) {
      parentObjectArray = bestChild;
      bestDifference = computeContextDifference(contexts[bestIndex], targetC);
    }
    console.log('best = ', bestIndex, computeContextDifference(contexts[bestIndex], targetC));
  }

  window.setInterval(updateLoop, 100);

}
