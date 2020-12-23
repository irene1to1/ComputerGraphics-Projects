// CSE160 - assignment 1: Painting

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniformå¤‰æ•°
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

var gl;
var mouse;
var shapeSize;
var canvasColor = [0.0, 0.0, 0.0, 1.0];
var sizeGlobal  = 25/500;
var colorGlobal = [1.0, 1.0, 1.0, 1.0];
var shapeGlobal = 0;
var segGlobal   = 100;
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas, false);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }/*
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  if (a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return;
  }*/
  // Get the storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  // Specify the color for clearing <canvas>
  gl.clearColor(canvasColor[0], canvasColor[1], canvasColor[2], canvasColor[3]);
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var output = document.querySelector('.output');
  // Write the positions of vertices to a vertex shader
  // Register function (event handler) to be called on a mouse press-------------------------
  mouse = false;
  canvas.onmousedown = function(ev){ mouse = true; click(ev, gl, canvas, a_Position, u_FragColor)};
  canvas.onmouseup = function(){ mouse = false; }
  canvas.onmousemove = function(ev){ if(mouse == true)click(ev, gl, canvas, a_Position, u_FragColor)};

  // Clear Button ---------------------------------------------------------------------------
  var clearButton = document.getElementById("clear-button");
  clearButton.addEventListener('click', clear);

  // Color Slider ----------------------------------------------------------------------------
  var redColor = document.getElementById("red");
  var greenColor = document.getElementById("green");
  var blueColor = document.getElementById("blue");


  redColor.oninput = function(){
    colorGlobal[0] = parseFloat(redColor.value)/255;
    colorGlobal[1] = parseFloat(greenColor.value)/255;
    colorGlobal[2] = parseFloat(blueColor.value)/255;
  }
  greenColor.oninput = function(){
    colorGlobal[0] = parseFloat(redColor.value)/255;
    colorGlobal[1] = parseFloat(greenColor.value)/255;
    colorGlobal[2] = parseFloat(blueColor.value)/255;
  }
  blueColor.oninput = function(){
    colorGlobal[0] = parseFloat(redColor.value)/255;
    colorGlobal[1] = parseFloat(greenColor.value)/255;
    colorGlobal[2] = parseFloat(blueColor.value)/255;
  }

  var palette = document.getElementById("palette");
  palette.onchange = function(){
    var colorRGB = RGB(palette.value);

    colorGlobal[0] = parseFloat(colorRGB[0]/255);
    colorGlobal[1] = parseFloat(colorRGB[1]/255);
    colorGlobal[2] = parseFloat(colorRGB[2]/255);
  }

  // Shape Buttons ----------------------------------------------------------------------------
  var squareShape = document.getElementById("square");
  squareShape.addEventListener('click', square);
  
  var triangleShape = document.getElementById("triangle");
  triangleShape.addEventListener('click', triangle);
  
  var circleShape = document.getElementById("circle");
  circleShape.addEventListener('click', circle);
  
  // Size Slider -------------------------------------------------------------------------------
  shapeSize = document.getElementById('size');
  shapeSize.oninput =function(){
    output.textContent = shapeSize.value;
    sizeGlobal = shapeSize.value/500;
  }
  // Segment Slider ----------------------------------------------------------------------------
  var segment = document.getElementById("count");
  segment.oninput = function(){
    segGlobal = segment.value; 
  }
  // Canvas Color ------------------------------------------------------------------------------
  var background = document.getElementById("canvas_color");
  background.onchange = function(){
    var colorRGB = RGB(background.value);

    canvasColor[0] = parseFloat(colorRGB[0]/255);
    canvasColor[1] = parseFloat(colorRGB[1]/255);
    canvasColor[2] = parseFloat(colorRGB[2]/255);

    gl.clearColor(canvasColor[0], canvasColor[1], canvasColor[2], canvasColor[3]);
  }
}

var g_points  = []; // The array for the position of a mouse press
var g_size    = []; // The array for the size of point
var g_colors  = []; // The array to store the color of a point
var g_shape   = []; // The array to store the shape of a point
var g_segment = []; // The array to store the segment number of circle

function click(ev, gl, canvas, a_Position, u_FragColor) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect() ;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  // Store the coordinates to g_points array
  g_points.push([x, y]);
  // store colors into g_colors array
  g_colors.push([colorGlobal[0], colorGlobal[1], colorGlobal[2], colorGlobal[3]]);
  // store sizes into g_size array
  g_size.push(sizeGlobal);
  // store shapes into g_shape array 
  g_shape.push(shapeGlobal);
  // store segment counts into g_segment array
  g_segment.push(segGlobal);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_points.length;
  for(var i = 0; i < len; i += 1) {
    var xy = g_points[i];
    var rgba = g_colors[i];

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    var n = initVertexBuffers(gl, xy[0], xy[1], g_size[i], g_shape[i], g_segment[i]);
    if (n < 0) {
      console.log('Failed to set the positions of the vertices');
      return;
    }
    // Draw
    if(g_shape[i] == 0){
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }else if(g_shape[i] == 1){
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }else if(g_shape[i] == 2){
      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    } 
  }
}
function initVertexBuffers(gl, x, y, shapeSize, shapeNum, segNum) {
  //console.log("init");
  // Square ----------------------------------------------------------------
  if(shapeNum == 0){
    var vertices = new Float32Array([
      x-shapeSize, y+shapeSize,   
      x-shapeSize, y-shapeSize,   
      x+shapeSize, y+shapeSize,  
      x+shapeSize, y-shapeSize

      ]);
    //console.log("init0");
    var n = 4; // The number of vertices
  }
  // Triangle ----------------------------------------------------------------
  else if(shapeNum == 1){
    var vertices = new Float32Array([
      x, y+shapeSize,   
      x-shapeSize, y-shapeSize,   
      x+shapeSize, y-shapeSize,  

      ]);
    //console.log("init1");
    var n = 3;
  }
  // Circle ----------------------------------------------------------------
  else{
    var vertices = new Float32Array((segNum*2)+2);
    vertices[0] = x;
    vertices[1] = y;
    for(i = 2; i <= vertices.length; i+=2){
      vertices[i] = x + shapeSize*Math.cos(2*i*Math.PI/segNum);
      vertices[i+1] = y + shapeSize*Math.sin(2*i*Math.PI/segNum);
    
    }
    var n = segNum;
    //console.log("init2");
  }
  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
  return n;
}

function clear(){
  g_points = [];
  g_colors = [];
  g_size = [];
  g_shape = [];
  g_segment = [];
  gl.clear(gl.COLOR_BUFFER_BIT);
}
function square(){
  shapeGlobal = 0;
}
function triangle(){
  shapeGlobal = 1;
}
function circle(){
  shapeGlobal = 2;
}
function RGB(hex){
  var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  var rgb = [];
  rgb[0] = parseInt(m[1], 16);
  rgb[1] = parseInt(m[2], 16);
  rgb[2] = parseInt(m[3], 16);
  return rgb;
}








