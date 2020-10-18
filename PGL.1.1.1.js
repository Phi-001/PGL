/**
Include 
<script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js" integrity="sha512-zhHQR0/H5SEBL3Wn6yYSaTTZej12z0hVZKOv3TwCUXT1z5qeqGcXJLLrbERYRScEDDpYIJhPC1fk31gqR783iQ==" crossorigin="anonymous" defer>
on html
**/
var PGL;
(function() {
	var canvas, gl;
	// sets up canvas and WebGL
	var init = function() {
		if (canvas) {
			throw new Error("There can only be one active PGL canvas.");
		}
		canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		const glArgs = {preserveDrawingBuffer : true, failIfMajorPerformanceCaveat : false};
		gl = canvas.getContext("webgl", glArgs) || canvas.getContext("experimental-webgl", glArgs);
		if (!gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
			return;
		}
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	};
	// initialize shader from it's code and type
	var initShader = function(sourceCode, shaderType) {
		const shader = gl.createShader(shaderType);
		gl.shaderSource(shader, sourceCode);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	};
	// initialize program from vertex/fragment shader source code
	var initProgram = function(vertSource, fragSource) {
		const program = gl.createProgram();
		const vertShader = initShader(vertSource, gl.VERTEX_SHADER);
		const fragShader = initShader(fragSource, gl.FRAGMENT_SHADER);
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
			return null;
		}
		return program;
	};
	// initialize element buffer from array
	var initElementBuffer = function(array) {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(array), gl.STATIC_DRAW);
		return buffer;
	};
	// initialize array buffer from array
	var initArrayBuffer = function(array) {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
		return buffer;
	};
	// binds attributes
	var bindAttribs = function(programInfo, buffers) {
		// set indicies
		gl.bindbuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
		// set every attributes
		for (var i in buffers) {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i].buffer);
			gl.vertexAtribPointer(programInfo.attribLocations[i], buffers[i].numComponents, buffers[i].type, false, 0, 0);
			gl.enableVertexAttribArray(programInfo.attribLocations[i]);
		}
	};
	// sets uniform
	var setUniform = function(programInfo) {
		
	};
	// draws Object in the scene
	var drawObject = function(programInfo, cameraInfo, objectInfo, buffers) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// bind attributes
		bindAttribs(programInfo, buffers);
		// uses program
		gl.useProgram(programInfo.program);
		// constats for uniforms
		for (var i in programInfo.uniforms) {
			
		}
	};
	
})();
