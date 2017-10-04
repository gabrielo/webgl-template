var centroidGl;
var pointFlowGl;
var map;
var gl;
var canvasLayer;
var mapMatrix = new Float32Array(16);
var pixelsToWebGLMatrix = new Float32Array(16);
var gui;
var timeSlider;
var centroidGeoJson;

var mapOptions = {
  zoom: 2,
  center: new google.maps.LatLng(0.0, 0.0),
  styles: mapStyles
};

var canvasLayerOptions = {
  resizeHandler: resize,
  animate: true,
  updateHandler: update
};

function resize() {
  var w = gl.canvas.width;
  var h = gl.canvas.height;
  gl.viewport(0, 0, w, h);
  pixelsToWebGLMatrix.set([2/w, 0,   0, 0,
    0,  -2/h, 0, 0,
    0,   0,   0, 0,
    -1,   1,   0, 1]);
}

function update() {
  var mapProjection = map.getProjection();
  mapMatrix.set(pixelsToWebGLMatrix);
  var scale = canvasLayer.getMapScale();
  scaleMatrix(mapMatrix, scale, scale);
  var translation = canvasLayer.getMapTranslation();
  translateMatrix(mapMatrix, translation.x, translation.y);  

  var currentTime = timeSlider.getCurrentTime();
  var currentYear = new Date(currentTime).getUTCFullYear();
  var start = new Date(currentYear + '-01-01');
  var end = new Date(currentYear + '-12-31');
  //console.log(start);
  //console.log(end);
  var t = 1.0 - (end.getTime() - currentTime) / (end.getTime() - start.getTime());
  pointFlowGl.draw(mapMatrix, {'t': t});
  timeSlider.animate();
}

function initTimeSlider(opts) {
  var startTime = new Date("1970-01-01").getTime();
  var endTime = new Date("2016-12-31").getTime();
  if (typeof(opts) != "undefined") {
    if (opts.startTime) {
      startTime = opts.startTime;
    }
    if (opts.endTime) {
      endTime = opts.endTime;
    }

  }
  var timeSlider = new TimeSlider({
    startTime: startTime,
    endTime: endTime,
    dwellAnimationTime: 2 * 1000,
    increment: 24*60*60*1000,
    formatCurrentTime: function(date) {
      return date.yyyymmdd();
    },
    animationRate: {
      fast: 10,
      medium: 20,
      slow: 40
    }
  });  
  return timeSlider;
}

function init() {
  var mapDiv = document.getElementById('map-div');
  var dataUrl = 'centroids.geojson';

  map = new google.maps.Map(mapDiv, mapOptions);
  canvasLayerOptions.map = map;
  canvasLayer = new CanvasLayer(canvasLayerOptions);

  timeSlider = initTimeSlider();

  gl = canvasLayer.canvas.getContext('experimental-webgl');
  gl.getExtension("OES_standard_derivatives");

  pointFlowGl = new PointFlowGl(gl);
  pointFlowGl.getGeoJson(dataUrl, function(data) {
    var points = [];
    for (var i = 0; i < data["features"].length; i++) {
      var startPoint = LatLongToPixelXY(data["features"][i]["geometry"]["coordinates"][1], data["features"][i]["geometry"]["coordinates"][0]);
      for (var j = 0; j < data["features"].length; j++) {
        if (j != i) {
          var endPoint = LatLongToPixelXY(data["features"][j]["geometry"]["coordinates"][1], data["features"][j]["geometry"]["coordinates"][0]);
          var midPoint = {'x': 0.5*(startPoint.x + endPoint.x), 'y': 0.5*(startPoint.y + endPoint.y) };
          points.push(startPoint.x, startPoint.y);
          points.push(endPoint.x, endPoint.y);
//          points.push(midPoint.x, midPoint.y);
          points.push(126.0, 0.0);
        }
      }
    }
    console.log(points);
    pointFlowGl.setBuffer(new Float32Array(points));
  });

  centroidGl = new CentroidGl(gl);
/*  centroidGl.getGeoJson(dataUrl, function(data) {
    centroidGeoJson = data;
    var points = []
    for (var i = 0; i < data["features"].length; i++) {
      var point = LatLongToPixelXY(data["features"][i]["geometry"]["coordinates"][1], data["features"][i]["geometry"]["coordinates"][0])
      points.push(point.x);
      points.push(point.y);
    }
    centroidGl.setBuffer(new Float32Array(points));
  });
*/
  //gui = new dat.GUI();
  //gui.add(gtdGl, 'show0Casualties');

 }

document.addEventListener('DOMContentLoaded', init, false);
