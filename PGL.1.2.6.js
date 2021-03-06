// jshint esversion: 6
var PGL;
(function() {
	var canvas, gl, exts;
	var textureUnit = 0;
	// sets up canvas and WebGL
	canvas = document.createElement("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	document.body.appendChild(canvas);
	const glArgs = {
		preserveDrawingBuffer : true, 
		failIfMajorPerformanceCaveat : false
	};
	gl = canvas.getContext("webgl", glArgs) || canvas.getContext("experimental-webgl", glArgs);
	if (!gl) {
		alert("Unable to initialize WebGL. Try: https://get.webgl.org");
	}
	exts = {
		instance: gl.getExtension('ANGLE_instanced_arrays') || gl.getExtension('MOZ_ANGLE_instanced_arrays') || gl.getExtension('WEBKIT_ANGLE_instanced_arrays'),
		vao: gl.getExtension('OES_vertex_array_object') || gl.getExtension('MOZ_OES_vertex_array_object') || gl.getExtension('WEBKIT_OES_vertex_array_object'),
	};
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.FRONT);
	gl.frontFace(gl.CW);
	// initialize shader from it's code and type
	var initShader = function(sourceCode, shaderType) {
		const shader = gl.createShader(shaderType);
		gl.shaderSource(shader, sourceCode);
		gl.compileShader(shader);
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
			console.error('Link failed: ' + gl.getProgramInfoLog(program));
			console.error('vertex shader info-log: ' + gl.getShaderInfoLog(vertShader));
			console.error('fragment shader info-log: ' + gl.getShaderInfoLog(fragShader));
			return null;
		}
		gl.deleteShader(vertShader);
		gl.deleteShader(fragShader);
		return program;
	};
	// gets bind point for sampler type
	function getBindPointForSamplerType(type) {
		if (type === gl.SAMPLER_2D) {
			return gl.TEXTURE_2D;        
		}
		if (type === gl.SAMPLER_CUBE) {
			return gl.TEXTURE_CUBE_MAP;  
		}
	}
	// sets uniform
	var getUniformSetter = function(program, uniformInfo) {
		const location = gl.getUniformLocation(program, uniformInfo.name);
		const type = uniformInfo.type;
		// Check if this uniform is an array
		const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
		if (type === gl.FLOAT && isArray) {
			return function(v) {
				gl.uniform1fv(location, v);
			};
		}
		if (type === gl.FLOAT) {
			return function(v) {
				gl.uniform1f(location, v);
			};
		}
		if (type === gl.FLOAT_VEC2) {
			return function(v) {
				gl.uniform2fv(location, v);
			};
		}
		if (type === gl.FLOAT_VEC3) {
			return function(v) {
				gl.uniform3fv(location, v);
			};
		}
		if (type === gl.FLOAT_VEC4) {
			return function(v) {
				gl.uniform4fv(location, v);
			};
		}
		if (type === gl.INT && isArray) {
			return function(v) {
				gl.uniform1iv(location, v);
			};
		}
		if (type === gl.INT) {
			return function(v) {
				gl.uniform1i(location, v);
			};
		}
		if (type === gl.INT_VEC2) {
			return function(v) {
				gl.uniform2iv(location, v);
			};
		}
		if (type === gl.INT_VEC3) {
			return function(v) {
				gl.uniform3iv(location, v);
			};
		}
		if (type === gl.INT_VEC4) {
			return function(v) {
				gl.uniform4iv(location, v);
			};
		}
		if (type === gl.BOOL) {
			return function(v) {
				gl.uniform1i(location, v);
			};
		}
		if (type === gl.BOOL_VEC2) {
			return function(v) {
				gl.uniform2iv(location, v);
			};
		}
		if (type === gl.BOOL_VEC3) {
			return function(v) {
				gl.uniform3iv(location, v);
			};
		}
		if (type === gl.BOOL_VEC4) {
			return function(v) {
				gl.uniform4iv(location, v);
			};
		}
		if (type === gl.FLOAT_MAT2) {
			return function(v) {
				gl.uniformMatrix2fv(location, false, v);
			};
		}
		if (type === gl.FLOAT_MAT3) {
			return function(v) {
				gl.uniformMatrix3fv(location, false, v);
			};
		}
		if (type === gl.FLOAT_MAT4) {
			return function(v) {
				gl.uniformMatrix4fv(location, false, v);
			};
		}
		if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
			const units = [];
			for (var i = 0; i < uniformInfo.size; i++) {
				units.push(textureUnit++);
			}
			return function(bindPoint, units) {
				return function(textures) {
					gl.uniform1iv(location, units);
					for (var i = 0; i < textures.length; i++) {
						gl.activeTexture(gl.TEXTURE0 + units[i]);
						gl.bindTexture(bindPoint, textures[i]);
					}
				};
			}(getBindPointForSamplerType(type), units);
		}
		if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
			return function(bindPoint, unit) {
				return function(texture) {
					gl.uniform1i(location, unit);
					gl.activeTexture(gl.TEXTURE0 + unit);
					gl.bindTexture(bindPoint, texture);
				};
			}(getBindPointForSamplerType(type), textureUnit++);
		}
	};
	// uniforms setter
	var getUniformsSetter = function(programInfo) {
		textureUnit = 0;
		const program = programInfo.program;
		const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		var uniformsSetter = [];
		for (var i = 0; i < numUniforms; i++) {
			const uniformInfo = gl.getActiveUniform(program, i);
			if (!uniformInfo) {
				break;
			}
			var name = uniformInfo.name;
			if (name.substr(-3) === '[0]') {
				name = name.substr(0, name.length - 3);
			}
			const setter = getUniformSetter(program, uniformInfo);
			uniformsSetter[name] = setter;
		}
		programInfo.uniformsSetter = uniformsSetter;
	};
	// sets uniform to its corresponding value
	var setUniforms = function(programInfo) {
		if (!programInfo.uniformsSetter) {
			getUniformsSetter(programInfo);
		}
		for (var i in programInfo.uniformsSetter) {
			if (programInfo.uniformsSetter.hasOwnProperty(i)) {
				programInfo.uniformsSetter[i](programInfo.uniforms[i]);
			}
		}
	};
	// renderes scene from program information
	var initBuffers = function(programInfo) {
		const program = initProgram(programInfo.vertexShader, programInfo.fragmentShader);
		programInfo.program = program;
		const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		// indices
		{
			const buffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(programInfo.indices), gl.STATIC_DRAW);
		}
		// other attributes
		for (var i = 0; i < numAttribs; i++) {
			const attribInfo = gl.getActiveAttrib(program, i);
			if (!attribInfo) {
				break;
			}
			var name = attribInfo.name;
			if (name.substr(-3) === '[0]') {
				name = name.substr(0, name.length - 3);
			}
			const buffer = gl.createBuffer();
			const location = gl.getAttribLocation(program, name);
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(programInfo.attributes[name].buffer), gl.STATIC_DRAW);
			gl.vertexAttribPointer(location, programInfo.attributes[name].numComponents, programInfo.attributes[name].type, false, 0, 0);
			gl.enableVertexAttribArray(location);
		}
	};
	// initialize vertex array object
	var initVAO = function(programInfo) {
		const vao = exts.vao.createVertexArrayOES();
		exts.vao.bindVertexArrayOES(vao);
		initBuffers(programInfo);
		programInfo.vao = vao;
		exts.vao.bindVertexArrayOES(null);
	};
	// initializes for rendering
	var init = function() {
		gl.clearColor(0.0, 0.0, 0.0, 0.99);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	};
	// draws Object in the scene
	var render = function(programInfo, attributes) {
		if (!programInfo.initialized) {
			initVAO(programInfo);
			programInfo.initialized = true;
		}
		// bind attributes
		exts.vao.bindVertexArrayOES(programInfo.vao);
		if (attributes) {
			const program = programInfo.program;
			for (var i in attributes) {
				if (attributes.hasOwnProperty(i)) {
					const buffer = gl.createBuffer();
					const location = gl.getAttribLocation(program, name);
					gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes[i].buffer), gl.STATIC_DRAW);
					gl.vertexAttribPointer(location, attributes[i].numComponents, attributes[i].type, false, 0, 0);
					gl.enableVertexAttribArray(location);
				}
			}
		}
		// uses program
		gl.useProgram(programInfo.program);
		// sets uniforms
		setUniforms(programInfo);
		// draw them
		gl.drawElements(gl.TRIANGLES, programInfo.indices.length, gl.UNSIGNED_SHORT, 0);
		exts.vao.bindVertexArrayOES(null);
	};
	// check if value is power of 2
	function isPowerOf2(value) {
		return (value & (value - 1)) == 0;
	}
	// loads texture from url
	var loadTexture = function(url) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
		const image = new Image();
		image.onload = function() {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			if (isPowerOf2(image.width) && isPowerOf2(image.height) && image.width === image.height) {
				gl.generateMipmap(gl.TEXTURE_2D);
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			}
		};
		image.src = url;
		return texture;
	};
	// loads texture from data
	var loadTextureData = function(data, info) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, info.width, info.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data ? new Uint8Array(data) : null);
		if (isPowerOf2(info.width) && isPowerOf2(info.height) && info.width === info.height) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
		return texture;
	};
	var setupFramebuffer = function(img, imgInfo) {
		var fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, img, 0);
		var depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, imgInfo.width, imgInfo.height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return fb;
	};
	var useFramebuffer = function(fb, imgInfo) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.viewport(0, 0, imgInfo.width, imgInfo.height);
	}
	var screenVert = [
		-1, -1,
		-1,  1,
		 1,  1,
		 1, -1,
	];
	var screenInd = [
		2, 1, 0,
		3, 2, 0,
	];
	PGL = {
		loadTexture: loadTexture,
		loadTextureData: loadTextureData,
		render: render,
		initShader: initShader,
		initProgram: initProgram,
		initBuffers: initBuffers,
		init: init,
		gl: gl,
		canvas: canvas,
		setupFramebuffer: setupFramebuffer,
		useFramebuffer: useFramebuffer,
		screenVert: screenVert,
		screenInd: screenInd,
		canvasfb: null,
	};
})();
	
