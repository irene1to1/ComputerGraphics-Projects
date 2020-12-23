// lighting.js 
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' + 
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Vertex;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  v_Vertex = u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' + 
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'uniform int light;\n' +
  'uniform int norm;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Vertex;\n' +
  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal);\n' +
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  '  vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  float tempS = pow(nDotL, 200.0);\n' +
  '  vec3 specular = (nDotL > 0.0 ? tempS: 0.0) * vec3(1.0, 1.0, 1.0) * 0.5;\n' +
  '  if(light == 0 && norm == 1){\n' +
  '     gl_FragColor = vec4((normal+1.0)/2.0, v_Color.a);\n' +
  '  }else if(light == 0 && norm == 0){\n' +
  '     gl_FragColor = v_Color;\n' +
  '  }else if(light == 1 && norm == 0){\n' +
  '     gl_FragColor = vec4(diffuse + ambient + specular, v_Color.a);\n' +
  '  }else if(light == 1 && norm == 1){\n' +
  '     gl_FragColor = vec4(diffuse + ambient + specular + (normal+1.0)/2.0, v_Color.a);\n' +
  '  }\n' +
  '}\n';
var shape = 0;
var n;
var m;
var t = [
  0, 0,
  0, 0,
  0, 0,
  0, 0,
  ];
var canvas;
var gl;
var degreeG = 0; 
var vpMatrix;
var stop = 0;
var currentAngle = 5;
var eyeX  = -10, eyeY  = 2, eyeZ  = 0;
var lookX = 0, lookY = 0, lookZ = -1;
var upX   = 0, upY   = 1, upZ   = 0;
var oldX, oldY;
var mouseDown;
var rotation = {
    x : 0,
    y : 0,
    updateX : function (dx) { rotation.x = (rotation.x + dx) % 360; },
    updateY : function (dy) { rotation.y = (rotation.y - dy) % 360; }
}
var radX, radY;
var projMatrix;
var viewMatrix;
var normalMatrix;
//                                           middle
var map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

]; 
var mapX;
var mapZ;

var a_Color;
var a_TexCoord;

var u_ProjMatrix;
var u_ViewMatrix;
var u_LightPosition;

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

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

  // Set the clear color and enable the depth test
  gl.clearColor(0.5, 0.8, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage location of projection and view
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) {
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  if (!u_LightColor || !u_LightPosition || !u_AmbientLight) { 
    console.log('Failed to get the storage location');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 0, Math.cos(currentAngle * Math.PI/180) * 100, Math.sin(currentAngle * Math.PI/180) * 100);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // Set the eye point and the viewing volume
  // vpMatrix = new Matrix4();   // View projection matrix
  projMatrix = new Matrix4();
  viewMatrix = new Matrix4();
  // Calculate the view projection matrix
  canvas.onmousedown = function(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    oldX = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    oldY = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    mouseDown = true;
  };
  canvas.onmouseup = function() {mouseDown = false;};
  canvas.onmousemove = function(ev) { if (mouseDown) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    rotation.updateX((x - oldX) * 100);
    rotation.updateY((y - oldY) * 100);

    oldX = x;
    oldY = y;

    radX = rotation.x * Math.PI/180;
    radY = -rotation.y * Math.PI/180;

    lookX = Math.cos(radX) * Math.cos(radY);
    lookY = Math.sin(radY);
    lookZ = Math.sin(radX) * Math.cos(radY);

    renderScene(gl, u_ProjMatrix, u_ViewMatrix);
  }};

  document.onkeydown = function(ev){ keydown(ev, gl, u_ProjMatrix, u_ViewMatrix); };

  var light = gl.getUniformLocation(gl.program, 'light');
  var original = 0;
  gl.uniform1i(light, original);
  var norm = gl.getUniformLocation(gl.program, 'norm');
  gl.uniform1i(norm, original);

  var normalOnButton = document.getElementById("on1");
  normalOnButton.addEventListener('click', normalOn);

  var normalOffButton = document.getElementById("off1");
  normalOffButton.addEventListener('click', normalOff);

  var lightOnButton = document.getElementById("on2");
  lightOnButton.addEventListener('click', lightOn);

  var lightOffButton = document.getElementById("off2");
  lightOffButton.addEventListener('click', lightOff);

  var timeOnButton = document.getElementById("on3");
  timeOnButton.addEventListener('click', on);

  var timeOffButton = document.getElementById("off3");
  timeOffButton.addEventListener('click', off);

  projMatrix.setPerspective(60, canvas.width/canvas.height, 1, 100);
  viewMatrix.setLookAt(eyeX, eyeY, eyeZ,  lookX + eyeX, lookY + eyeY, lookZ + eyeZ, upX, upY, upZ);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderScene(gl, u_ProjMatrix, u_ViewMatrix);
}

function renderScene(gl, u_ProjMatrix, u_ViewMatrix){

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var u_modelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

  projMatrix.setPerspective(60, canvas.width/canvas.height, 1, 100);
  viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookX + eyeX, lookY + eyeY, lookZ + eyeZ, upX, upY, upZ);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  // brick
  n = initCubeVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  shape = 1;
  var scale  = [1, 1, 1];
  var rotate = [0, 0, 0, 1];
  initColor([0.5,0.5,0.5], shape);
  mapX = -31;
  mapZ = 31;
  for(var i = 0; i < map.length; i++){
    mapX = -31;
    for(var j = 0; j < map[i].length; j++){
      if(map[i][j] == 1){
        var trans = [mapX, 0, mapZ];
        draw(gl, u_modelMatrix, trans, scale, rotate, shape);
      }
      mapX += 2;
    }
    mapZ -= 2;
  }

 // sky
  var trans  = [0, 6, 0];
  var scale  = [32, 60, 32];
  initColor([0.5, 0.7, 1.0], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  // ground 
  var trans  = [0, -2, 0];
  var scale  = [32, 1, 32];
  initColor([0.2, 0.5, 0.2], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // house
  var trans  = [15, 1.6, 0];
  var scale  = [3, 3, 3];
  var rotate = [0, 0, 1, 0];
  initColor([0.9, 0.9, 0.9], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // roof
  var trans  = [15, 4.6, 0];
  var scale  = [2.95, 2.1, 2.1];
  var rotate = [45, 1, 0, 0];
  initColor([0.6, 0.2, 0.2], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // door
  var trans  = [12.3, 0.5, 0];
  var scale  = [0.5, 1.5, 1];
  var rotate = [0, 1, 0, 0];
  initColor([0.7, 0.5, 0.3], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // window
  var trans  = [15, 2, 3];
  var scale  = [1, 1, 0.2];
  var rotate = [0, 1, 0, 0];
  initColor([0.5, 0.6, 0.9], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //window2
  var trans  = [15, 2, -3];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //body
  var trans  = [5, 1.4, -6];
  var scale  = [0.6, 0.6, 1.4];
  var rotate = [0, 1, 0, 0];
  initColor([0.5, 0.3, 0.2], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //neck
  var trans  = [5, 2, -4.8];
  var scale  = [0.3, 0.9, 0.3];
  var rotate = [30, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //head
  var trans  = [5, 2.8, -4.27];
  var scale  = [0.32, 0.29, 0.4];
  var rotate = [20, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //upper mouth
  var trans  = [5, 2.7, -3.78];
  var scale  = [0.27, 0.17, 0.4];
  var rotate = [20, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //lower mouth
  var trans  = [5, 2.43, -3.85];
  var scale  = [0.26, 0.072, 0.3];
  var rotate = [25, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // right ear
  var trans  = [5.2, 3.3, -4.43];
  var scale  = [0.08, 0.2, 0.04];
  var rotate = [10, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //left ear
  var trans  = [4.8, 3.3, -4.43];
  var scale  = [0.08, 0.2, 0.04];
  var rotate = [10, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //right front leg
  var trans  = [5.4, 0.65, -4.84];
  var scale  = [0.18, 0.5, 0.18];
  var rotate = [5, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [5.4, -0.5, -4.88];
  var scale  = [0.18, 0.8, 0.18];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //left front leg
  var trans  = [4.6, 0.65, -4.84];
  var scale  = [0.18, 0.5, 0.18];
  var rotate = [5, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.6, -0.5, -4.88];
  var scale  = [0.18, 0.8, 0.18];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // right back leg
  var trans  = [5.4, 0.7, -6.98];
  var scale  = [0.2, 0.3, 0.3];
  var rotate = [-30, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [5.4, 0.4, -6.89];
  var scale  = [0.2, 0.6, 0.21];
  var rotate = [25, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [5.4, -0.68, -7.15];
  var scale  = [0.2, 0.62, 0.18];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  // left back leg
  var trans  = [4.6, 0.7, -6.98];
  var scale  = [0.2, 0.3, 0.3];
  var rotate = [-30, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.6, 0.4, -6.89];
  var scale  = [0.2, 0.6, 0.21];
  var rotate = [25, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.6, -0.68, -7.15];
  var scale  = [0.2, 0.62, 0.18];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //tail
  var trans  = [5, 1.3, -7.45];
  var scale  = [0.2, 0.6, 0.21];
  var rotate = [25, 1, 0, 0];
  initColor([0.3, 0.2, 0.1], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //hair
  var trans  = [5, 2.3, -5];
  var scale  = [0.25, 1, 0.3];
  var rotate = [30, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);


  m = initSphereVertexBuffers(gl);
  if (m < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  shape = 0;
  //bushes
  var trans  = [17, 0, 4];
  var scale  = [0.7, 3, 0.7];
  var rotate = [0, 0, 0, 1];
  initColor([0.1, 0.3, 0.1], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //bushes2
  var trans  = [17, 0, 6];
  var scale  = [0.9, 3.3, 0.9];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-27, 0, 27];
  var scale  = [1.9, 4.3, 1.9];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-27, 0, 23];
  var scale  = [0.9, 3, 0.9];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //tree1
  var trans  = [18, 3, -7];
  var scale  = [2, 2, 2];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //tree2
  var trans  = [18, 3, 10];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-27, 3, -27];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-27, 3, 8];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4, 3, 27];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-5, 3, -27];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-17, 3, -10];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //stem
  var trans  = [18, 0, -7];
  var scale  = [0.5, 3, 0.5];
  initColor([0.3, 0.2, 0.1], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [18, 0, 10];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-27, 0, -27];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-27, 0, 8];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4, 0, 27];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-5, 0, -27];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [-17, 0, -10];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  //door knob
  var scale  = [0.1, 0.1, 0.1];
  var trans  = [11.8, 0.5, -0.7];
  initColor([0.8, 0.7, 0], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //left eye
  var scale  = [0.05, 0.05, 0.1];
  var trans  = [4.7, 2.85, -4.3];
  initColor([1, 1, 1], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //right eye
  var trans  = [5.3, 2.85, -4.3];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var scale  = [0.04, 0.04, 0.05];
  var trans  = [4.68, 2.85, -4.28];
  initColor([0, 0, 0], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [5.32, 2.85, -4.28];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [5.2, 2.6, -3.42];
  var scale  = [0.06, 0.06, 0.06];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.8, 2.6, -3.42];
  var scale  = [0.06, 0.06, 0.06];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //rabbit
  var trans  = [4, -0.6, 4];
  var scale  = [0.6, 0.5, 0.5];
  initColor([1, 1, 1], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [3.7, -0.2, 4];
  var scale  = [0.3, 0.35, 0.3];
  var rotate = [5, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [3.5, -0.25, 4.05];
  var scale  = [0.15, 0.15, 0.15];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [3.5, -0.25, 3.95];
  var scale  = [0.15, 0.15, 0.15];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
//ear
  var trans  = [3.7, 0, 3.9];
  var scale  = [0.1, 0.7, 0.1];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [3.7, 0, 4.1];
  var scale  = [0.1, 0.7, 0.1];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //feet
  var trans  = [3.7, -1, 4.2];
  var scale  = [0.2, 0.2, 0.1];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [3.7, -1, 3.8];
  var scale  = [0.2, 0.2, 0.1];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.2, -0.7, 3.55];
  var scale  = [0.3, 0.3, 0.1];
  var rotate = [-10, 0, 1, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.2, -0.7, 4.45];
  var scale  = [0.3, 0.3, 0.1];
  var rotate = [10, 0, 1, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.1, -1, 3.6];
  var scale  = [0.2, 0.2, 0.1];
  var rotate = [-10, 0, 1, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [4.1, -1, 4.4];
  var scale  = [0.2, 0.2, 0.1];
  var rotate = [10, 0, 1, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  //tail
  var trans  = [4.6, -0.5, 4];
  var scale  = [0.1, 0.1, 0.1];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

// nose
  var trans  = [3.43, -0.17, 4];
  var scale  = [0.05, 0.05, 0.05];
  var rotate = [0, 1, 0, 0];
  initColor([1, 0.8, 1], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
  //eye
  var trans  = [3.47, -0.11, 4.12];
  var scale  = [0.035, 0.035, 0.035];
  var rotate = [0, 1, 0, 0];
  initColor([0, 0, 0], shape);
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);

  var trans  = [3.47, -0.11, 3.88];
  var scale  = [0.035, 0.035, 0.035];
  var rotate = [0, 1, 0, 0];
  draw(gl, u_modelMatrix, trans, scale, rotate, shape);
}

function draw(gl, u_modelMatrix, trans, scale, rotate, shape){
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  var modelMatrix = new Matrix4();
  var normalMatrix = new Matrix4();

  modelMatrix.setTranslate(trans[0], trans[1], trans[2]);
  modelMatrix.rotate(rotate[0], rotate[1], rotate[2], rotate[3]);
  modelMatrix.scale(scale[0], scale[1], scale[2]);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  if(shape == 1){
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  }else if(shape == 0){
    gl.drawElements(gl.TRIANGLES, m, gl.UNSIGNED_SHORT, 0);
  }
}


function initCubeVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);

  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);
  
  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) return -1;
  if (!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_Normal')) return -1;

  //if (!initArrayBuffer(gl, textCoords, 2, gl.FLOAT, 'a_TexCoord', 0, 0))
  //  return -1;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


  return indices.length;
}
function initSphereVertexBuffers(gl) { // Create a sphere
  var SPHERE_DIV = 13;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, new Float32Array(positions), 3, gl.FLOAT, 'a_Position')) return -1;
  if (!initArrayBuffer(gl, new Float32Array(positions), 3, gl.FLOAT, 'a_Normal'))  return -1;
  
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function initTextures(gl, t) {

  var textCoords = new Float32Array([
   // Front
    t[4], t[5],
    t[6], t[7],
    t[0], t[1],
    t[2], t[3],
    // right
    t[6], t[7],
    t[0], t[1],
    t[2], t[3],
    t[4], t[5],
    // up
    t[0], t[1],
    t[2], t[3],
    t[4], t[5],
    t[6], t[7],
    // Bottom
    t[4], t[5],
    t[6], t[7],
    t[0], t[1],
    t[2], t[3],
    // Right
    t[0], t[1],
    t[2], t[3],
    t[4], t[5],
    t[6], t[7],
    // back
    t[0], t[1],
    t[2], t[3],
    t[4], t[5],
    t[6], t[7]
  ]);

  if (!initArrayBuffer(gl, textCoords, 2, gl.FLOAT, 'a_TexCoord'))
    return -1;

  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ loadTexture(gl, texture, u_Sampler, image); };
  // Tell the browser to load an image
  image.src = './src/mario2.png';

  gl.disableVertexAttribArray(a_Color);

  return true;
}

function initColor(c, shape){
  if(shape == 0){ // for sphere
    var color = [];
    for(var i = 0; i < 196; i++){
      color = color.concat(c);
    }
    var colors = new Float32Array(color);
    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
      return -1;
  }else if(shape == 1){
    var colors = new Float32Array([     // Colors
      c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], // v0-v1-v2-v3 front
      c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2],     // v0-v3-v4-v5 right
      c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2],     // v0-v5-v6-v1 up
      c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2],     // v1-v6-v7-v2 left
      c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2],     // v7-v4-v3-v2 down
      c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2], c[0], c[1], c[2]    // v4-v7-v6-v5 back
    ]);

    if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
      return -1;
  }

  gl.disableVertexAttribArray(a_TexCoord);
}
 
function loadTexture(gl, texture, u_Sampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target\
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, 0);
}
function crossProduct(){
  var vx = (lookY * upZ)-(lookZ * upY);
  var vy = (lookZ * upX)-(lookX * upZ);
  var vz = (lookX * upY)-(lookY * upX);
  var cp = [vx, vy, vz];

  return cp; 
}
function magnitude(v){
  var sqrt = Math.sqrt((v[0]*v[0])+(v[1]*v[1])+(v[2]*v[2]));
  return sqrt;
}

function normalize(v){
  var mag = magnitude(v);
  var n = [v[0]/mag, v[1]/mag, v[2]/mag];
  return n;
}

function keydown(ev, gl, u_ProjMatrix, u_ViewMatrix) {
  if(ev.keyCode == 87) {      // W: forward
    eyeX += 0.5 * lookX;
    eyeY += 0.5 * lookY;
    eyeZ += 0.5 * lookZ;
  }else if(ev.keyCode == 83){ // S: backward
    eyeX -= 0.5 * lookX;
    eyeY -= 0.5 * lookY;
    eyeZ -= 0.5 * lookZ;  
  }else if(ev.keyCode == 65){ // A: left
    var xyz = crossProduct();
    xyz = normalize(xyz);
    eyeX -= 0.5 * xyz[0];
    eyeY -= 0.5 * xyz[1];
    eyeZ -= 0.5 * xyz[2];
  }else if(ev.keyCode == 68){ // D: right
    var xyz = crossProduct();
    xyz = normalize(xyz);
    eyeX += 0.5 * xyz[0];
    eyeY += 0.5 * xyz[1];
    eyeZ += 0.5 * xyz[2];
  }else{
    return;
  }
  renderScene(gl, u_ProjMatrix, u_ViewMatrix);
}

function normalOn(){
  var norm = gl.getUniformLocation(gl.program, 'norm');
  var normal = 1;
  gl.uniform1i(norm, normal);

  renderScene(gl, u_ProjMatrix, u_ViewMatrix);
}

function normalOff(){
  var norm = gl.getUniformLocation(gl.program, 'norm');
  var normal = 0;
  gl.uniform1i(norm, normal);

  renderScene(gl, u_ProjMatrix, u_ViewMatrix);
}

function lightOn(){
  var light = gl.getUniformLocation(gl.program, 'light');
  var value = 1;
  gl.uniform1i(light, value);

  renderScene(gl, u_ProjMatrix, u_ViewMatrix);
}

function lightOff(){
  var light = gl.getUniformLocation(gl.program, 'light');
  var value = 0;
  gl.uniform1i(light, value);

  renderScene(gl, u_ProjMatrix, u_ViewMatrix);
}


var stop = 0;
var currentAngle = 100;

function on(){
  stop = 0;
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
      // Set the light direction (in the world coordinate)

    //gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
    gl.uniform3f(u_LightPosition, 0, Math.cos(currentAngle * Math.PI/180) * 100, Math.sin(currentAngle * Math.PI/180) * 100); 

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderScene(gl);
    //console.log(currentAngle);
    if(stop == 0){
      requestAnimationFrame(tick); // Request that the browser ?calls tick
    }
  };
  tick();
}

function off(){
  stop = 1;
}

function animate(angle){
  return (angle - 0.5);
}



