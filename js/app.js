var canvas = document.getElementById("canvas");

var gl = canvas.getContext("webgl");

gl.clearColor(0.2, 0.3, 0.4, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

var vShaderCode = document.getElementById("vShader").text;
var vShader = gl.createShader(gl.VERTEX_SHADER);

gl.shaderSource(vShader, vShaderCode);
gl.compileShader(vShader);
if (!gl.getShaderParameter(vShader,gl.COMPILE_STATUS)) {
    alert("vShader compile not success");
}

var fShaderCode = document.getElementById("fShader").text;
var fShader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(fShader, fShaderCode);
gl.compileShader(fShader);
if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
    alert("fShader compile not success");
}

var program = gl.createProgram();
gl.attachShader(program, vShader);
gl.attachShader(program, fShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("program link not success");
}

var vertices = [ 0.0, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0 ];
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.drawArrays(gl.TRIANGLES, 0, 3);