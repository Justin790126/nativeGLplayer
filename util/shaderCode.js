var VID_VERTEX_SHADER = [
    'attribute vec2 aVertexPosition;',
    'attribute vec2 aTextureCoord;',
    'uniform mat4 uMVMatrix;',
    'uniform mat4 uLMatrix;',
    'uniform mat4 uPMatrix;',
    'uniform mat4 homo2Cart;',

    'varying highp vec2 vTextureCoord;',
    'void main(void) {',
    'gl_Position = uPMatrix * uLMatrix * uMVMatrix* homo2Cart * vec4(aVertexPosition * vec2(1,-1), 0.0 , 1.0);',
    'vTextureCoord = aTextureCoord;',
    '}'
].join('\n');

var VID_FRAGMENT_SHADER = [
    'varying highp vec2 vTextureCoord;',
    'uniform sampler2D uSampler;',

    'void main(void) {',
    'highp vec4 texelColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));',
    'gl_FragColor = vec4(texelColor.rgb, texelColor.a);',
    '}'
].join('\n');

