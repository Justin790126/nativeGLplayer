/**
 * nativeGLplayer constructor
 *
 * Pass in the video element as 'el'
 */
var nativeGLplayer = (function(sourceURL, width, height, domElement) {
  var constructor = function(sourceURL, width, height, domElement) {
    this.el = null;
    this.width = width || 900;
    this.height = height || 504;
    this.hooks = [];
    this.domElement = domElement || null;
    this.sourceURL = sourceURL || '';

    this.createContainer();
    this.createCanvas();

    this.playerControl = new PlayerControl(this);

    this.createVideoTag();

  };

  constructor.prototype.playerControl = null;

  constructor.prototype.createContainer = function() {
    var oldContainer = document.getElementById(this.containerID);
    if (oldContainer) {
      try {
        this.domElement.removeChild(oldContainer);
      } catch (e) {
        /* handle error */
      }
    }
    this.container = document.createElement('div');
    this.container.className = this.containerID;
    this.container.style.width = this.width + 'px';
    this.container.style.height = this.height + 'px';
    this.domElement.appendChild(this.container);
  };

  constructor.prototype.createVideoTag = function() {
    if (!this.el) {
      this.el = document.createElement('video');
      this.el.id = 'video';
      this.el.style.display = 'none';
      this.el.crossOrigin = 'anonymous';
      this.el.preload = 'auto';
      this.el.autoplay = 'true';
      this.attachVideoEvents();

      var source = document.createElement('source');
      source.src = this.sourceURL;
      source.type = 'video/mp4';

      this.el.appendChild(source);
      this.container.appendChild(this.el);
    }
  };

  constructor.prototype.attachVideoEvents = function() {
    this.el.oncanplaythrough = this.initRenderer.bind(this);
    this.el.onloadedmetadata = this.handleMetaData.bind(this);
    this.el.ontimeupdate = this.handleTimeUpdate.bind(this);
    this.el.onseeked = this.handleFrameSeeked.bind(this);
    this.el.onvolumechange = this.handleVolumeChanged.bind(this);
    this.el.onprogress = this.handlePreloadTime.bind(this);
  };

  constructor.prototype.handleMetaData = function(e) {
    var duration = this.el.duration;
    this.playerControl.setTimeLabel(0, duration);
    this.playerControl.setTimeSliderRange(0, Math.floor(duration));
    this.playerControl.setVolume(this.el.volume);
  };

  constructor.prototype.handlePreloadTime = function(e) {
    var bufferEnd = 0;
    try {
      bufferEnd = this.el.buffered.end(0);
    } catch (err) {
      /* handle error */
    }
    var duration = this.el.duration;
    if (duration > 0) {
      var progressRatio = 100 * (bufferEnd / duration);
      this.playerControl.setPreloadBar(progressRatio);
    }
  };

  constructor.prototype.handleTimeUpdate = function(e) {
    var second = this.el.currentTime;
    this.playerControl.setTimeLabel(second, null);
    this.playerControl.setTimeStamp(second);
  };

  constructor.prototype.handleFrameSeeked = function(e) {
    var currentTime = this.el.currentTime;
    this.playerControl.setTimeLabel(currentTime);
  };

  constructor.prototype.handleVolumeChanged = function(e) {
    this.playerControl.setVolume(this.el.volume);
  };

  constructor.prototype.containerID = 'player-container';
  constructor.prototype.domElement = null;
  constructor.prototype.canvas = null;
  constructor.prototype.canvasID = 'glcanvas';

  constructor.prototype.createCanvas = function() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.id = this.canvasID;
    this.canvas.height = this.height;
    this.canvas.style.backgroundColor = 'black';

    this.container.appendChild(this.canvas);
  };

  constructor.prototype.initRenderer = function() {
    this.glRenderer = new glRenderer(this.el, this.canvas);
    if (!this.glRenderer.gl) {
      console.error("Unable to initialize WebGL context.");
    } else {
      this.run();
    }
  };

  //
  //  Instance of WebGL render
  //
  constructor.prototype.glRenderer = null;

  constructor.prototype.run = function() {
    this.render();
  };

  constructor.prototype.render = function() {
    var _this = this,
      previousTime = 0;

    (function drawFrame(now) {
      var delta = now - previousTime;
      previousTime = now;

      for (var i = 0; i < _this.hooks.length; i += 1) {
        _this.hooks[i].update(_this, delta);
      }

      _this.glRenderer.render(_this.rotation);
      _this.reqAnimFrameID = requestAnimationFrame(drawFrame);
    }(0));
  };

  constructor.prototype.addPlugin = function(Plugin) {
    var plugin = new Plugin(this);
    this.hooks.push(plugin);
  };


  /**
   * Initializes and manages WebGL components of the player.
   */
  var glRenderer = (function(el, canvas) {

    var constructor = function(el, canvas) {
      this.el = el;
      this.canvas = canvas;

      this.initGL();
      this.setupGL();
      this.initTexture();
      this.initBuffers();
      this.initShaders();
      this.initShaderProgram();
    };

    constructor.prototype.gl = null;

    constructor.prototype.initGL = function() {
      var canvas = this.canvas;
      try {
        this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      } catch (e) {
        console.log('get context failed');
      }
    };

    constructor.prototype.setupGL = function() {
      this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
      this.gl.clearDepth(1.0);
      this.gl.disable(this.gl.DEPTH_TEST);
    };

    constructor.prototype.vertexData = [-640.0, -640.0,
      640.0, -640.0,
      640.0, 640.0, -640.0, 640.0
    ];
    constructor.prototype.textureData = [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ];
    constructor.prototype.indexData = [
      0, 1, 2, 0, 2, 3
    ];

    constructor.prototype.initBuffers = function() {
      var gl = this.gl;
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);

      this.textureBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureData), gl.STATIC_DRAW);

      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
    };

    constructor.prototype.initTexture = function() {
      var gl = this.gl;
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    constructor.prototype.updateTexture = function() {
      var gl = this.gl;

      if (this.el && this.el.readyState >= 4) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB,
          gl.UNSIGNED_BYTE, this.el);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
    };

    constructor.prototype.initShaders = function() {
      var gl = this.gl;

      this.fragment = gl.createShader(gl.FRAGMENT_SHADER);
      this.vertex = gl.createShader(gl.VERTEX_SHADER);

      gl.shaderSource(this.vertex, VID_VERTEX_SHADER);
      gl.shaderSource(this.fragment, VID_FRAGMENT_SHADER);

      gl.compileShader(this.vertex);
      gl.compileShader(this.fragment);
    };

    constructor.prototype.initShaderProgram = function() {
      var gl = this.gl;
      this.shaderProgram = gl.createProgram();
      gl.attachShader(this.shaderProgram, this.vertex);
      gl.attachShader(this.shaderProgram, this.fragment);
      gl.linkProgram(this.shaderProgram);

      if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(this.shaderProgram));
      }

      gl.useProgram(this.shaderProgram);
      this.collectAttributes();
      this.collectUniforms();

    };

    constructor.prototype.collectAttributes = function() {
      var gl = this.gl;

      this.attributes = {};
      this.attributes.aVertexPosition = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(this.attributes.aVertexPosition);

      this.attributes.aTextureCoord = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
      gl.enableVertexAttribArray(this.attributes.aTextureCoord);
    };

    constructor.prototype.collectUniforms = function() {
      var gl = this.gl;
      this.uniforms = {};

      this.uniforms.uSampler = gl.getUniformLocation(this.shaderProgram, "uSampler");
      gl.enableVertexAttribArray(this.uniforms.uSampler);

      this.uniforms.uPMatrix = gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
      gl.enableVertexAttribArray(this.uniforms.uPMatrix);

      this.uniforms.uMVMatrix = gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
      gl.enableVertexAttribArray(this.uniforms.uMVMatrix);

      this.uniforms.homo2Cart = gl.getUniformLocation(this.shaderProgram, 'homo2Cart');
      gl.enableVertexAttribArray(this.uniforms.homo2Cart);

      this.uniforms.uLMatrix = gl.getUniformLocation(this.shaderProgram, 'uLMatrix');
      gl.enableVertexAttribArray(this.uniforms.uLMatrix);

    };

    constructor.prototype.render = function(rotation) {
      var gl = this.gl;
      if (this.el.readyState < 4) return;

      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);

      this.updateTexture();
      this.setupMatrix();
      this.setMatrixUniforms();

      this.setVertexData();
      this.setTextureData();
      this.setIndexData();

      this.drawPTZdata();
    };

    constructor.prototype.setVertexData = function() {
      var gl = this.gl;
      gl.deleteBuffer(this.vertexBuffer);
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.attributes.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);
    };

    constructor.prototype.setTextureData = function() {
      var gl = this.gl;
      gl.deleteBuffer(this.textureBuffer);
      this.textureBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
      gl.vertexAttribPointer(this.attributes.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureData), gl.STATIC_DRAW);
    };

    constructor.prototype.setIndexData = function() {
      var gl = this.gl;
      gl.deleteBuffer(this.indexBuffer);
      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
    };

    constructor.prototype.perspectiveMatrix = [];
    constructor.prototype.mvMatrix = [];
    constructor.prototype.homo2Cart = [];
    constructor.prototype.lookMatrix = [];

    constructor.prototype.viewDistanceUnit = 2.4;
    constructor.prototype.xOffset = 0.0;
    constructor.prototype.yOffset = 0.0;

    constructor.prototype.setupMatrix = function() {
      var gl = this.gl;

      this.perspectiveMatrix = makePerspective(45, 1.0, 0.1, 1000.0);
      this.viewDistanceUnit = GetCorrectedZunit(45);
      this.loadIdentity();
      this.mvMatrix = makeTranslation([0.0, 0.0, 0.0]);

      var widthRatio = 1920 / this.canvas.width;
      var heightRatio = 1920 / this.canvas.height;

      var testw = 1920.0;
      var testh = 1920.0 * (this.canvas.height / this.canvas.width);
      this.vertexData = this.undewarpVertex();
      this.homo2Cart = new Float32Array(GetCartesianMatrix(
        Math.abs(this.vertexData[0]),
        Math.abs(this.vertexData[1]),
        1
      ));

      this.lookMatrix = new Float32Array(makeLookAtMatrix(
        0.0, 0.0, 1.0,
        this.xOffset, this.yOffset, 0.0,
        0.0, 1.0, 0.0));
    };

    constructor.prototype.loadIdentity = function() {
      this.mvMatrix = Matrix.I(4);
    };

    constructor.prototype.undewarpVertex = function() {
      var vidW = this.el.videoWidth || 1920;
      var vidH = this.el.videoHeight || 1920;

      var ratioH = (this.canvas.height / this.canvas.width);

      var vtxW = vidW;
      var vtxH = vidH * ratioH;

      return [-vtxW, -vtxH,
        vtxW, -vtxH,
        vtxW, vtxH, -vtxW, vtxH
      ];
    };

    constructor.prototype.setMatrixUniforms = function() {
      var gl = this.gl;
      gl.uniformMatrix4fv(this.uniforms.homo2Cart, false, this.homo2Cart);
      gl.uniformMatrix4fv(this.uniforms.uMVMatrix, false, this.mvMatrix);
      gl.uniformMatrix4fv(this.uniforms.uPMatrix, false, this.perspectiveMatrix);
      gl.uniformMatrix4fv(this.uniforms.uLMatrix, false, this.lookMatrix);
    };

    constructor.prototype.drawPTZdata = function() {
      var gl = this.gl;
      // Specify the texture to map onto the faces.
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.uniforms.uSampler, 0);

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.drawElements(gl.TRIANGLES, this.indexData.length, gl.UNSIGNED_SHORT, 0);
    };

    return constructor;
  })();

  return constructor;
})();

var PlayerControl = (function(nativeGLplayer) {
  var constructor = function(nativeGLplayer) {
    this.nativeGLplayer = nativeGLplayer || {};
    this.videoTagDOM = this.nativeGLplayer.el;
    if (!this.nativeGLplayer) {
      return;
    }
    this.parentDOM = nativeGLplayer.container;

    this.createControlBar();
    this.attachEvents();
  };

  constructor.prototype.videoTagDOM = null;

  constructor.prototype.nativeGLplayer = null;
  constructor.prototype.parentDOM = null;

  constructor.prototype.controller = null;
  constructor.prototype.controlID = 'player-control';

  constructor.prototype.playButton = null;
  constructor.prototype.playButtonID = 'play-button';
  constructor.prototype.pauseButtonID = 'pause-button';

  constructor.prototype.timeLabel = null;
  constructor.prototype.timeLabelID = 'current-time';

  constructor.prototype.volumeContainer = null;
  constructor.prototype.volumeContainerID = 'volume-container';

  constructor.prototype.volumeBar = null;
  constructor.prototype.volumeBarID = 'volume-bar';

  constructor.prototype.volumeButton = null;
  constructor.prototype.volumeButtonContainer = null;
  constructor.prototype.volumeButtonContainerID = 'volume-button-container';

  constructor.prototype.buttonPosY = 0;
  constructor.prototype.uiUnitCount = 2;

  constructor.prototype.createControlBar = function() {
    var controllerHeight = 40;
    var step = 5;
    var count = ((controllerHeight - 30) / 10 + 1);
    var offsetY = step * count;

    this.uiUnitCount = count;
    this.buttonPosY = offsetY;

    var controllerDOM = document.createElement('div');
    controllerDOM.className = this.controlID;
    controllerDOM.style.width = '100%';
    controllerDOM.style.height = controllerHeight + 'px';
    controllerDOM.style.position = 'relative';
    controllerDOM.style.bottom = controllerDOM.style.height;

    this.createTimeSlider();

    var playButton = document.createElement('div');
    playButton.className = this.playButtonID;
    playButton.style.top = this.buttonPosY + 'px';
    this.playButton = playButton;

    var timeLabel = document.createElement('div');
    timeLabel.className = this.timeLabelID;
    timeLabel.style.top = 2 * (this.uiUnitCount + 1) + 'px';
    this.timeLabel = timeLabel;
    this.setTimeLabel(0);

    this.createVolumeSlider();
    this.createVolumeButton();

    controllerDOM.appendChild(this.progressContainer);
    controllerDOM.appendChild(this.playButton);
    controllerDOM.appendChild(this.timeLabel);
    controllerDOM.appendChild(this.volumeContainer);
    controllerDOM.appendChild(this.volumeButtonContainer);

    this.controller = controllerDOM;
    this.parentDOM.appendChild(this.controller);

  };

  constructor.prototype.createVolumeButton = function() {
    var volumeButtonContainer = document.createElement('div');
    volumeButtonContainer.className = this.volumeButtonContainerID;
    this.volumeButtonContainer = volumeButtonContainer;

    var volumeButton = document.createElement('div');
    volumeButton.className = 'icono-volumeHigh';
    this.volumeButton = volumeButton;

    this.volumeButtonContainer.appendChild(this.volumeButton);

  };

  constructor.prototype.timeDuration = 0;
  constructor.prototype.setTimeLabel = function(second, duration) {
    this.timeDuration = duration || this.timeDuration;
    var currentSecond = (second > this.timeDuration ?
      this.timeDuration : second);
    this.timeLabel.innerHTML = currentSecond.toString().toHHMMSS() + ' / ' +
      this.timeDuration.toString().toHHMMSS();
  };

  constructor.prototype.setTimeSliderRange = function(min, max) {
    this.timeThumb.min = Math.floor(min);
    this.timeThumb.max = Math.floor(max);
    this.timeThumb.step = 1;
  };

  constructor.prototype.setTimeStamp = function(second) {
    var step = 100 / (this.timeThumb.max - this.timeThumb.min);
    var currentSecond = Math.floor(second);
    var ratio = step * currentSecond;
    ratio = (ratio > 100 ? 100 : ratio);

    this.timeThumb.value = currentSecond;
    this.progressBar.style.width = ratio + '%';
  };

  constructor.prototype.setVolume = function(volume) {
    this.volumeThumb.value = volume;
    this.volumeBar.style.width = 100 * volume + '%';
  };

  constructor.prototype.setPreloadBar = function(value) {
    this.preloadBar.style.width = value + '%';
  };

  constructor.prototype.progressContainer = null;
  constructor.prototype.progressContaierID = 'progress-container';

  constructor.prototype.preloadBar = null;
  constructor.prototype.preloadBarID = 'preload-bar';

  constructor.prototype.progressBar = null;
  constructor.prototype.progressBarID = 'progress-bar';

  constructor.prototype.timeThumb = null;
  constructor.prototype.timeThumbID = 'time-thumb';

  constructor.prototype.createTimeSlider = function() {
    this.progressBarHeight = 5;

    var progressContainer = document.createElement('div');
    progressContainer.className = this.progressContaierID;
    progressContainer.style.height = this.progressBarHeight + 'px';
    this.progressContainer = progressContainer;

    var progressBar = document.createElement('div');
    progressBar.className = this.progressBarID;
    this.progressBar = progressBar;

    var preloadBar = document.createElement('div');
    preloadBar.className = this.preloadBarID;
    this.preloadBar = preloadBar;

    var thumb = document.createElement('input');
    thumb.value = 0;
    thumb.type = 'range';
    thumb.className = this.timeThumbID;
    this.timeThumb = thumb;

    this.progressContainer.appendChild(this.preloadBar);
    this.progressContainer.appendChild(this.progressBar);
    this.progressContainer.appendChild(this.timeThumb);

  };

  constructor.prototype.volumeThumb = null;
  constructor.prototype.volumeThumbID = 'volume-thumb';

  constructor.prototype.createVolumeSlider = function() {
    var volumeBarContainer = document.createElement('div');
    volumeBarContainer.className = this.volumeContainerID;
    volumeBarContainer.style.top = 5 * (this.uiUnitCount + 1) + 'px';
    this.volumeContainer = volumeBarContainer;

    var volumeBar = document.createElement('div');
    volumeBar.className = this.volumeBarID;
    this.volumeBar = volumeBar;

    var thumb = document.createElement('input');
    thumb.type = 'range';
    thumb.className = this.volumeThumbID;
    thumb.min = 0;
    thumb.max = 1;
    thumb.value = 1;
    thumb.step = 0.1;
    this.volumeThumb = thumb;

    this.volumeContainer.appendChild(this.volumeBar);
    this.volumeContainer.appendChild(this.volumeThumb);
  };

  constructor.prototype.attachEvents = function() {
    this.playButton.onclick = this.handlePlayButtonClick.bind(this);
    this.timeThumb.oninput = this.handleTimeSliderSeek.bind(this);
    this.volumeThumb.oninput = this.handleVolumeSliderSeek.bind(this);
    this.volumeButtonContainer.onclick = this.handleVolumeButtonClick.bind(this);
  };

  constructor.prototype.handlePlayButtonClick = function() {
    this.videoTagDOM = this.nativeGLplayer.el;
    var player = this.videoTagDOM;
    var paused = this.nativeGLplayer.el.paused;
    if (paused) {
      this.playButton.className = this.playButtonID;
      player.play();
    } else {
      this.playButton.className = this.pauseButtonID;
      player.pause();
    }
  };

  constructor.prototype.handleTimeSliderSeek = function(e) {
    this.videoTagDOM = this.nativeGLplayer.el;
    var player = this.videoTagDOM;
    player.currentTime = this.timeThumb.value;
  };

  constructor.prototype.handleVolumeSliderSeek = function(e) {
    this.videoTagDOM = this.nativeGLplayer.el;
    var player = this.videoTagDOM;
    var currentVolume = this.volumeThumb.value;

    this.volumeButton.className = this.decideVolumeUI(currentVolume);
    player.volume = currentVolume;
  };

  constructor.prototype.decideVolumeUI = function(volume) {
    var volumeStep = 10 / 3.0;
    var defaultUI = this.volumeButton.className;
    var currentVolume = 10 * volume;

    if (currentVolume > 0 && currentVolume < volumeStep) {
      return 'icono-volumeLow';
    } else if (currentVolume >= volumeStep && currentVolume < 2 * volumeStep) {
      return 'icono-volumeMedium';
    } else if (currentVolume >= 2 * volumeStep && currentVolume <= 3 * volumeStep) {
      return 'icono-volumeHigh';
    } else if (currentVolume === 0) {
      return 'icono-volumeMute';
    } else {
      return defaultUI;
    }
  };

  constructor.prototype.lastVolume = 0;
  constructor.prototype.silent = false;

  constructor.prototype.handleVolumeButtonClick = function() {
    this.videoTagDOM = this.nativeGLplayer.el;
    var player = this.videoTagDOM;

    if (!this.silent) {
      this.lastVolume = player.volume;
      this.setVolume(0);
      this.volumeButton.className = 'icono-volumeMute';
      this.silent = true;
    } else {
      this.setVolume(this.lastVolume);
      this.volumeButton.className = this.decideVolumeUI(this.lastVolume);
      this.silent = false;
    }
  };

  return constructor;

})();

window.nativeGLplayer = nativeGLplayer;
