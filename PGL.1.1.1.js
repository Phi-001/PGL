var PGL;
(function() {
	var canvas, gl;
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
  
});

