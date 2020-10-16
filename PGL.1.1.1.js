var PGL;
var gl;
(function() {
	PGL.init = function(canvas) {
		var glArgs = {preserveDrawingBuffer : true, failIfMajorPerformanceCaveat : false};
		gl = canvas.getContext("webgl", glArgs) || canvas.getContext("experimental-webgl", glArgs);
		if (!PGL.gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
			return;
		}
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	};
});
