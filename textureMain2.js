'use strict';

// Global variables that are set and used
// across the application
let gl;

// The programs
let sphereGlobeProgram;

// the textures
let worldTexture;
let myImageTexture;   // checkerboard image

// VAOs for the objects
var mySphere = null;
var myCube = null;

// what is currently showing
let nowShowing = 'Sphere';

// what texure are you using
// valid values = "globe", "myimage" or "proc"
let curTexture = "globe";

var anglesReset    = [30.0, 30.0, 0.0];
var cube_angles    = [30.0, 30.0, 0.0];
var sphere_angles  = [180.0, 180.0, 0.0];
var angles         = sphere_angles;
var angleInc       = 5.0;

function doLoad(theTexture, theImage) {
    gl.bindTexture(gl.TEXTURE_2D, theTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, theImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    draw();
}

//
// load up the textures you will use in the shader(s)
// The setup for the globe texture is done for you
// Any additional images that you include will need to
// set up as well.
//
function setUpTextures(){
    
    // --- Globe texture (provided image) ---
    worldTexture = gl.createTexture();
    
    const worldImage = new Image();
    worldImage.src = '1_earth_16k.jpg';

    worldImage.onload = () => {
        doLoad (worldTexture, worldImage);
    };

    // --- Your checkerboard image texture ---
    // Make sure you saved the chat image as "myTexture.png"
    // in the same folder as this file.
    myImageTexture = gl.createTexture();
    
    const myImage = new Image();
    myImage.src = 'myTexture.png';

    myImage.onload = () => {
        doLoad (myImageTexture, myImage);
    };
}

//
// Draws the current shape with the
// current texture
//
function drawCurrentShape () {
    
    // which shape are we drawing
    var object = mySphere;
    if (nowShowing == "Cube") object = myCube;
    
    // may need to set different parameters based on the texture
    // you are using...The current texture is found in the global variable
    // curTexture.   It will have the value of "globe", "myimage" or "proc"
    
    // which program are we using
    var program = sphereGlobeProgram;
    
    // set up your uniform variables for drawing
    gl.useProgram (program);

    // choose which texture to bind and which mode to send to the shader
    let textureToUse = null;
    let mode = 0;   // 0 = globe, 1 = checkerboard, 2 = procedural

    if (curTexture == "globe") {
        textureToUse = worldTexture;
        mode = 0;
    }
    else if (curTexture == "myimage") {
        textureToUse = myImageTexture;
        mode = 1;
    }
    else if (curTexture == "proc") {
        textureToUse = null;
        mode = 2;
    }

    // set up texture uniform & other uniforms that you might
    // have added to the shader
    gl.activeTexture (gl.TEXTURE0);

    if (textureToUse) {
        gl.bindTexture (gl.TEXTURE_2D, textureToUse);
    } else {
        gl.bindTexture (gl.TEXTURE_2D, null);
    }

    gl.uniform1i (program.uTheTexture, 0);
    gl.uniform1i (program.uTextureMode, mode);
    
    // set up rotation uniform
    gl.uniform3fv (program.uTheta, new Float32Array(angles));

    //Bind the VAO and draw
    gl.bindVertexArray(object.VAO);
    gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
    
}

// Create a program with the appropriate vertex and fragment shaders
function initProgram (vertexid, fragmentid) {
    
  // set up the per-vertex program
  const vertexShader   = getShader(vertexid);
  const fragmentShader = getShader(fragmentid);

  // Create a program
  let program = gl.createProgram();
  
  // Attach the shaders to this program
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Could not initialize shaders');
  }

  // Use this program instance
  gl.useProgram(program);
  // We attach the location of these shader values to the program instance
  // for easy access later in the code
  program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
  program.aUV             = gl.getAttribLocation(program, 'aUV');
    
  // uniforms - you will need to add references for any additional
  // uniforms that you add to your shaders
  program.uTheTexture   = gl.getUniformLocation (program, 'theTexture');
  program.uTheta        = gl.getUniformLocation (program, 'theta');
  program.uTextureMode  = gl.getUniformLocation (program, 'textureMode');
    
  return program;
}

///////////////////////////////////////////////////////////////////
//
//  No need to edit below this line.
//
////////////////////////////////////////////////////////////////////

// general call to make and bind a new object based on current
// settings..Basically a call to shape specfic calls in cgIshape.js
function createShapes() {
    
    // the sphere
    mySphere = new Sphere (20,20);
    mySphere.VAO = bindVAO (mySphere, sphereGlobeProgram);
    
    // the cube
    myCube = new Cube (20);
    myCube.VAO = bindVAO (myCube, sphereGlobeProgram);
}



  // Given an id, extract the content's of a shader script
  // from the DOM and return the compiled shader
  function getShader(id) {
    const script = document.getElementById(id);
    const shaderString = script.text.trim();

    // Assign shader depending on the type of shader
    let shader;
    if (script.type === 'x-shader/x-vertex') {
      shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else if (script.type === 'x-shader/x-fragment') {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else {
      return null;
    }

    // Compile the shader using the supplied shader code
    gl.shaderSource(shader, shaderString);
    gl.compileShader(shader);

    // Ensure the shader is valid
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Compiling shader " + id + " " + gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

//
// Creates a VAO for a given object and return it.
//
// shape is the object to be bound
// program is the program (vertex/fragment shaders) to use in this VAO
//
//
function bindVAO (shape, program) {
    
    //create and bind VAO
    let theVAO = gl.createVertexArray();
    gl.bindVertexArray(theVAO);
    
    // vertex locations
    let myVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.aVertexPosition);
    gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    // uvs
    let uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.uv), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.aUV);
    gl.vertexAttribPointer(program.aUV, 2, gl.FLOAT, false, 0, 0);
    
    // element indices
    let myIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

    // cleanup
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    return theVAO;
}



  
  // We call draw to render to our canvas
  function draw() {
    // Clear the scene
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
 
    // draw your shapes
    drawCurrentShape ();

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  // Entry point to our application
  function init() {
      
    // Retrieve the canvas
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
      console.error(`There is no canvas with id ${'webgl-canvas'} on this page.`);
      return null;
    }

    // deal with keypress
    window.addEventListener('keydown', gotKey ,false);

    // Retrieve a WebGL context
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.error(`There is no WebGL 2.0 context`);
        return null;
      }
      
    // Set the clear color to be black
    gl.clearColor(0, 0, 0, 1);
      
    // some GL initialization
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearColor(0.0,0.0,0.0,1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.clearDepth(1.0)
    gl.pixelStorei (gl.UNPACK_FLIP_Y_WEBGL, true);
      
    // Read, compile, and link your shaders
    sphereGlobeProgram = initProgram('sphereMap-V', 'sphereMap-F');
    
    // create and bind your current object
    createShapes();
    
    // set up your textures
    setUpTextures();
    
    // do a draw
    draw();
  }
