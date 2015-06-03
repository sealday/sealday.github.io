// 通过获取画布，WebGL的上下文（context）是从画布中获取的
var canvas = document.getElementById("canvas");
// 从画布中获取WebGL的上下文
var gl = canvas.getContext("webgl");

if (gl == null)
    gl = canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true });

// 设定清除颜色（背景色）
gl.clearColor(0.2, 0.3, 0.4, 1.0);

// 获取顶点着色器的代码
var vShaderCode = document.getElementById("vShader").text;
// 创建顶点着色器对象
var vShader = gl.createShader(gl.VERTEX_SHADER);
// 将顶点着色器的代码绑定到顶点着色器对象上面
gl.shaderSource(vShader, vShaderCode);
// 编译顶点着色器
gl.compileShader(vShader);
// 判断是否发生编译错误
if (!gl.getShaderParameter(vShader,gl.COMPILE_STATUS)) {
    alert("vShader compile not success");
}

// 获取像素着色器的代码，按照Direct3D中的Pixel Vertex来称呼，如果要按字面意思是片段（片元）着色器
var fShaderCode = document.getElementById("fShader").text;
// 创建像素着色器的对象
var fShader = gl.createShader(gl.FRAGMENT_SHADER);
// 将像素着色器的代码绑定到片元着色器对象上面
gl.shaderSource(fShader, fShaderCode);
// 编译像素着色器
gl.compileShader(fShader);
// 判断是否发生编译错误
if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
    alert("fShader compile not success");
}

// 创建着色器程序对象
var program = gl.createProgram();
// 将顶点着色器附着到程序对象上
gl.attachShader(program, vShader);
// 将像素着色器附着到程序对象上
gl.attachShader(program, fShader);
// 对程序对象进行链接操作（即将程序对象中的所有着色器进行链接）
gl.linkProgram(program);
// 判断是否发生链接错误
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("program link not success");
}

// 定义我们的三角形的三个顶点
var vertices = [ 0.0, 0.5, 0.0, // 上
                -0.5, -0.5, 0.0,// 左
                0.5, -0.5, 0.0  // 右
               ];
// 创建缓冲区对象（用来存顶点的，也可以用来存顶点的索引，这里我们存顶点）
var buffer = gl.createBuffer();
// 绑定当前的缓冲区对象为刚刚我们创建的那一个（可以看出来，就是绑定的时候我们指定是顶点缓冲区还是顶点的索引缓冲区）
// 如果是绑定顶点索引的缓冲区是使用 gl.ELEMENT_ARRAY_BUFFER
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// 绑定缓冲区数据，提示WebGL数据不会经常变化（gl.STATIC_DRAW）
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// 启用位置0上面的元素（这里因为只有一个元素输入，所以我可以猜测是0号位置，实际上正确的方式应该是通过名字获取位置）
gl.enableVertexAttribArray(0);
// 告诉WebGL这上面的数据的形式，这里参数具体解释
// 第一个 位置
// 第二个 几个值代表一个对象（其实就是取决于是vec2还是vec3，这里用的是vec3，是顶点，如果我们用vec2一般就是材质坐标）
// 第三个 数据类型 这个数据类型得研究一样，虽然看起来Float很正常，但是实际上有点疑惑
// 第四个 是否需要归一化
// 第五个 多少个值一组
// 第六个 在一组内的偏移量
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

// 这里表示使用这个 程序对象
gl.useProgram(program);


// add model
var modelLoc = gl.getUniformLocation(program, "model");
var model = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
gl.uniformMatrix4fv(modelLoc, false,  model);


function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 这里，最终我们画了一个三角形，三个参数分别意思是，画什么，从哪个顶点开始，画几个顶点
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

setInterval(draw, 15);