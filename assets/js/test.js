var Scale = {};
Scale.setup = function () {
    Scale.$ = new Canvas2D("scale");
    Scale.width = gebi("scale").width;
    Scale.height = gebi("scale").height;
    Scale.start = 0;
    Scale.end = 200;
    Scale.padding = 16;
}
Scale.init = function (list) {
    if (isNull(list)) {
        var list = [];
        for (var i=0;i<25;i++) list.push(randomInt(randomInt(201)));
    }
    Scale.whiskerPlot(list,30,20);
}
Scale.drawScale = function (s, e, y, h) {
    var p = Scale.padding,
        w = Scale.width,
        f = (w-p-p)/(e-s),
        g = 1;
    Scale.start = s;
    Scale.end = e;
    while (f*g < 20) {
        g++;
        if (g % 5 == 4) g++;
        else if (g % 5 == 3) g+=2;
        else if (g % 10 == 7) g+=3;
        else if (g % 10 == 6) g+=4;
    }
    Canvas2D.set(Scale.$, "font", "bold 10px Raleway");
    Canvas2D.set(Scale.$, "stroke", "#444", 2);
    Canvas2D.path(Scale.$, {type:"stroke",style:"#555",path:[[0,p+y],[w,p+y]]});
    for (var i=p,j=s*g;i<w;i+=f*g,j+=g) {
        Canvas2D.path(Scale.$, {type:"stroke",style:"#555",path:[[i,p+y],[i,p+y-h]]});
        Scale.$.textAlign = "center";
        Scale.$.fillText(j,i,p+y+10);
    }
}
Scale.whiskerPlot = function (list, y, h) {
    Scale.$.clearRect(0,0,Scale.width,Scale.height);
    list = sort(list);
    Scale.drawScale(0, list[list.length-1]+(3*list[list.length-1].toString().length), 80, 5);
    var p = Scale.padding,
        w = Scale.width,
        s = Scale.start,
        e = Scale.end,
        f = (w-p-p)/(Scale.end-Scale.start),
        ul = p+y-h/2,
        ll = p+y+h/2,
        us = p+y-h/4,
        ls = p+y+h/4,
        values = [list[0],Math.quartiles(list).lower,Math.median(list),
                Math.quartiles(list).upper,list[list.length-1]];
        iqr = [[f*values[1]+p,ll],[f*values[3]+p,ll],[f*values[3]+p,ul],[f*values[1]+p,ul]];
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[0]+p,p+y],[f*values[4]+p,p+y]]});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[0]+p,ls],[f*values[0]+p,us]]});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[4]+p,ls],[f*values[4]+p,us]]});
    Canvas2D.path(Scale.$,{type:"fill",style:"#eee",path:iqr});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:iqr});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[2]+p,ll],[f*values[2]+p,ul]]});
}
$(document).on("pageload", function () {
    Scale.setup();
    var list = [1,3,5,7,2,9,3,5,7,5,4,3,1];
    Scale.init(list);
});
var TLine = {
    lim: {start:1800,end:1880},
    padding: 12
};
TLine.setup = function (id) {
    TLine.id = id;
    TLine.canvas = gebi(id);
    TLine.$ = new Canvas2D(id);
    TLine.width = TLine.canvas.width;
    TLine.height = TLine.canvas.height;
    TLine.$.clearRect(0,0,TLine.width,TLine.height);
}
TLine.init = function () {
    TLine.drawAxis();
}
TLine.drawAxis = function () {
    var w = TLine.width,
        h = TLine.height;
    TLine.$.save();
    TLine.$.strokeStyle = "#000";
    Canvas2D.path(TLine.$, {type:"stroke",style:"#000",path:[[0,h/2],[w,h/2]]});
    TLine.$.restore();
}
TLine.drawScale = function () {
    var w = TLine.width,
        h = TLine.height,
        p = TLine.padding,
        l = TLine.lim,
        wp = w-p-p,
        f = (wp/(l.end-l.start)).fixFloat();
}
$(document).on("pageload", function () {
    TLine.setup("tline-canvas");
    TLine.init();
});
var TrigC = {
    init: function (id) {
        TrigC.id = id;
        TrigC.canvas = gebi(id);
        TrigC.$ = new Canvas2D(id);
        TrigC.width = TrigC.canvas.width;
        TrigC.height = TrigC.canvas.height;
    },
    draw: function (angle) {
        var oa = 1/Math.tan(angle),
            w = TrigC.width,
            h = TrigC.height,
            hw = w/h,
            a = new Coords(0, h),
            b = new Coords(w, h),
            c = new Coords(w, 0);
        if (oa/hw < 1) {
            var max = w;
            b.x = c.x = ((oa/hw)*max);
        } else if (oa/hw > 1) {
            var max = h;
            c.y = h-((hw/oa)*max);
        }
        TrigC.$.clearRect(0,0,w,h);
        Canvas2D.path(TrigC.$, {type:"stroke",style:"#000",path:[a,b,c,a]}); // draw the right triangle
        var ab = new LineSegment(a,b),
            bc = new LineSegment(b,c),
            ras = (hw/oa)*60>15?15:(hw/oa)*60,
            rax = b.x-ras<ab.midpoint.x?ab.midpoint.x:b.x-ras,
            ray = b.y-ras<bc.midpoint.y?bc.midpoint.y:b.y-ras;
        if (b.x-ras<ab.midpoint.x) ray = h-rax;
        else if (b.y-ras<bc.midpoint.y) rax = ray-h;
        var ra1 = new Coords(rax,b.y),
            ra2 = new Coords(rax,ray),
            ra3 = new Coords(b.x,ray);
        Canvas2D.path(TrigC.$, {type:"stroke",style:"#000",path:[ra1,ra2,ra3,b,ra1]}); // draw the right angle
        // arc: (x, y, radius, startAngle, endAngle, anticlockwise)
        // draw the relative angle (the one the opposite and adjacent sides relate to)
        TrigC.$.beginPath();
        TrigC.$.arc(a.x, a.y, a.x+((1/angle)*3+20)>ra1.x?ra1.x-a.x:((1/angle)*3+20), 0, -angle, true);
        TrigC.$.stroke();
        TrigC.$.closePath();
    },
    calc: function (a, b, c, x, y) {
        var r = null;
        switch (a) {
            case "hyp": switch (b) {
                case "adj": switch (c) {
                    case "opp": r = Math.sqrt(x*x-y*y); break;
                    case "a": r = rtd(Math.acos(y/x)); break;
                } break;
                case "opp": switch (c) {
                    case "adj": r = Math.sqrt(x*x-y*y); break;
                    case "a": r = rtd(Math.asin(y/x)); break;
                } break;
                case "a": switch (c) {
                    case "adj": r = x*Math.cos(dtr(y)); break;
                    case "opp": r = x*Math.sin(dtr(y)); break;
                } break;
            } break;
            case "adj": switch (b) {
                case "hyp": switch (c) {
                    case "opp": r = Math.sqrt(y*y-x*x); break;
                    case "a": r = rtd(Math.acos(x/y)); break;
                } break;
                case "opp": switch (c) {
                    case "hyp": r = Math.sqrt(x*x+y*y); break;
                    case "a": r = rtd(Math.atan(y/x)); break;
                } break;
                case "a": switch (c) {
                    case "hyp": r = x/Math.cos(dtr(y)); break;
                    case "opp": r = x*Math.tan(dtr(y)); break;
                } break;
                default: r = null;
            } break;
            case "opp": switch (b) {
                case "hyp": switch (c) {
                    case "adj": r = Math.sqrt(y*y-x*x); break;
                    case "a": r = rtd(Math.asin(x/y)); break;
                } break;
                case "adj": switch (c) {
                    case "hyp": r = Math.sqrt(y*y+x*x); break;
                    case "a": r = rtd(Math.atan(x/y)); break;
                } break;
                case "a": switch (c) {
                    case "hyp": r = x/Math.sin(dtr(y)); break;
                    case "adj": r = x/Math.tan(dtr(y)); break;
                } break;
            } break;
            case "a": switch (b) {
                case "hyp": switch (c) {
                    case "adj": r = y*Math.cos(dtr(x)); break;
                    case "opp": r = y*Math.sin(dtr(x)); break;
                } break;
                case "adj": switch (c) {
                    case "hyp": r = y/Math.cos(dtr(x)); break;
                    case "opp": r = y*Math.tan(dtr(x)); break;
                } break;
                case "opp": switch (c) {
                    case "hyp": r = y/Math.sin(dtr(x)); break;
                    case "adj": r = y/Math.tan(dtr(x)); break;
                } break;
            } break;
        }
        return r.fixFloat();
    }
};
$(document).on("pageload", function () {
    TrigC.init("trig-canvas");
    $("#trig-submit").click(function () {
        var a = $("#trig-choice1").val(),
            b = $("#trig-choice2").val(),
            c = $("#trig-choice3").val(),
            x = $("#trig-input1").val(),
            y = $("#trig-input2").val();
        if (a != b && a != c && b != c && !isNull(x) && !isNull(y)) {
            $("#trig-out").val(TrigC.calc(a,b,c,x,y));
            var r = $("#trig-out").val();
            var angle = a=="a"?x:b=="a"?y:c=="a"?r:null;
            if (isNull(angle)) {
                var hyp = a=="hyp"?x:b=="hyp"?y:c=="hyp"?r:null,
                    opp = a=="opp"?x:b=="opp"?y:c=="opp"?r:null;
                if (isNull(hyp) || isNull(opp)) return null;
                else angle = TrigC.calc("hyp", "opp", "a", hyp, opp);
            }
            try { TrigC.draw(dtr(angle)) }
            catch (e) { }
        } else $("#trig-out").val("Invalid");
    });
});
var GLTest = {
    $: null,
    width: 0,
    height: 0,
    buffers: {
        pyramid: {
            position: null,
            color: null,
        },
        cube: {
            position: null,
            color: null,
            index: null,
        },
    },
    mvMatrix: mat4.create(),
    mvMatrixStack: [],
    pMatrix: mat4.create(),
    shProg: null,
    rPyramid: 0,
    rCube: 0,
    elapsedTime: -1,
    // Gets the WebGL rendering context from an id.
    get: function (id) {
        GLTest.canvas = gebi(id);
        try {
            GLTest.$ = GLTest.canvas.getContext("webgl") || GLTest.canvas.getContext("experimental-webgl");
            GLTest.width = GLTest.canvas.width;
            GLTest.height = GLTest.canvas.height;
        } catch (e) { 
            TBI.error("WebGL initialisation failed. You either do not have a compatible graphics card or have an outdated browser.");
            return false; 
        } finally {
            if (isNull(GLTest.$)) {
                TBI.error("WebGL initialisation failed.");
                return false;
            } else return true;
        }
    },
    // Initialises the WebGL rendering context then draws the scene.
    init: function (id) {
        if (GLTest.get(id)) {
            var gl = GLTest.$;
            GLTest.initShaders();
            GLTest.initBuffers();
            
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            
            GLTest.loop();
        }
    },
    // Handles the operations done for every frame of animation.
    loop: function () {
        if (window.requestAnimationFrame) requestAnimationFrame(GLTest.loop);
        GLTest.drawScene();
        GLTest.animate();
    },
    // Gets a shader for a specific WebGL rendering context with an id.
    getShader: function (ctx, id) {
        var gl = ctx,
            shScript = gebi(id),
            shader;
        if (!shScript) return null;
        else if (shScript.type == "x-shader/x-fragment") shader = gl.createShader(gl.FRAGMENT_SHADER);
        else if (shScript.type == "x-shader/x-vertex") shader = gl.createShader(gl.VERTEX_SHADER);
        else return null;
        
        gl.shaderSource(shader, shScript.textContent);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { TBI.error(gl.getShaderInfoLog(shader)); return null; }
        return shader;
    },
    // Initialises the shader program.
    initShaders: function () {
        var gl = GLTest.$;
        var frag = GLTest.getShader(GLTest.$, "shader-fs"); // Fragment shader
        var vert = GLTest.getShader(GLTest.$, "shader-vs"); // Vertex shader
        GLTest.shProg = gl.createProgram(); // Create the program
        gl.attachShader(GLTest.shProg, vert); // Attach the shaders
        gl.attachShader(GLTest.shProg, frag);
        gl.linkProgram(GLTest.shProg); // Then link the program with the rendering context
        
        if (!gl.getProgramParameter(GLTest.shProg, gl.LINK_STATUS)) TBI.error("Could not initialise shaders.");
        gl.useProgram(GLTest.shProg); // Use the shader program
        
        // Get the position attribute and store it
        GLTest.shProg.vertexPositionAttribute = gl.getAttribLocation(GLTest.shProg, "aVertexPosition");
        gl.enableVertexAttribArray(GLTest.shProg.vertexPositionAttribute); // and enable the attribute
        
        // Get the colour attribute and store it
        GLTest.shProg.vertexColorAttribute = gl.getAttribLocation(GLTest.shProg, "aVertexColor");
        gl.enableVertexAttribArray(GLTest.shProg.vertexColorAttribute); // and enable the attribute
        
        GLTest.shProg.pMatrixUniform = gl.getUniformLocation(GLTest.shProg, "uPMatrix"); // Sets the uniform variables
        GLTest.shProg.mvMatrixUniform = gl.getUniformLocation(GLTest.shProg, "uMVMatrix");
    },
    // Helper function for defining an array buffer given a set of data.
    newBuffer: function (data) {
        var gl = GLTest.$;
        var newData = [];
        for (var i=0;i<data.length;i++) newData = newData.concat(data[i]);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newData), gl.STATIC_DRAW);
        buf.itemSize = data[0].length;
        buf.numItems = data.length;
        return buf;
    },
    // Helper function for defining an element array buffer given a set of data.
    newElementBuffer: function (data) {
        var gl = GLTest.$,
            buf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
        buf.itemSize = 1;
        buf.numItems = data.length;
        return buf;
    },
    // Initialises the vertex buffers.
    initBuffers: function () {
        GLTest.buffers.pyramid.position = GLTest.newBuffer( // Pyramid vertices
            // Front face
            [[ 0.0, 1.0, 0.0]
            ,[-1.0,-1.0, 1.0]
            ,[ 1.0,-1.0, 1.0]
            // Right face
            ,[ 0.0, 1.0, 0.0]
            ,[ 1.0,-1.0, 1.0]
            ,[ 1.0,-1.0,-1.0]
            // Back face
            ,[ 0.0, 1.0, 0.0]
            ,[ 1.0,-1.0,-1.0]
            ,[-1.0,-1.0,-1.0]
            // Left face
            ,[ 0.0, 1.0, 0.0]
            ,[-1.0,-1.0,-1.0]
            ,[-1.0,-1.0, 1.0]]
        );
        GLTest.buffers.pyramid.color = GLTest.newBuffer( // Pyramid colours
            // Front face
            [[1.0, 0.0, 0.0, 1.0]
            ,[0.0, 1.0, 0.0, 1.0]
            ,[0.0, 0.0, 1.0, 1.0]
            // Right face
            ,[1.0, 0.0, 0.0, 1.0]
            ,[0.0, 0.0, 1.0, 1.0]
            ,[0.0, 1.0, 0.0, 1.0]
            // Back face
            ,[1.0, 0.0, 0.0, 1.0]
            ,[0.0, 1.0, 0.0, 1.0]
            ,[0.0, 0.0, 1.0, 1.0]
            // Left face
            ,[1.0, 0.0, 0.0, 1.0]
            ,[0.0, 0.0, 1.0, 1.0]
            ,[0.0, 1.0, 0.0, 1.0]]
        );
        GLTest.buffers.cube.position = GLTest.newBuffer( // Cube vertices
            // Front face
            [[-1.0,-1.0, 1.0]
            ,[ 1.0,-1.0, 1.0]
            ,[ 1.0, 1.0, 1.0]
            ,[-1.0, 1.0, 1.0]
            // Back face
            ,[-1.0,-1.0,-1.0]
            ,[-1.0, 1.0,-1.0]
            ,[ 1.0, 1.0,-1.0]
            ,[ 1.0,-1.0,-1.0]
            // Top face
            ,[-1.0, 1.0,-1.0]
            ,[-1.0, 1.0, 1.0]
            ,[ 1.0, 1.0, 1.0]
            ,[ 1.0, 1.0,-1.0]
            // Bottom face
            ,[-1.0,-1.0,-1.0]
            ,[ 1.0,-1.0,-1.0]
            ,[ 1.0,-1.0, 1.0]
            ,[-1.0,-1.0, 1.0]
            // Right face
            ,[ 1.0,-1.0,-1.0]
            ,[ 1.0, 1.0,-1.0]
            ,[ 1.0, 1.0, 1.0]
            ,[ 1.0,-1.0, 1.0]
            // Left face
            ,[-1.0,-1.0,-1.0]
            ,[-1.0,-1.0, 1.0]
            ,[-1.0, 1.0, 1.0]
            ,[-1.0, 1.0,-1.0]]
        );
        var colourDefs = [
            [1.0, 0.0, 0.0, 1.0], // Front face
            [1.0, 1.0, 0.0, 1.0], // Back face
            [0.0, 1.0, 0.0, 1.0], // Top face
            [0.0, 1.0, 1.0, 1.0], // Bottom face
            [0.0, 0.0, 1.0, 1.0], // Right face
            [1.0, 0.0, 1.0, 1.0]  // Left face
        ], unpacked = [];
        for (var i in colourDefs) for (var j=0;j<4;j++) unpacked.push(colourDefs[i]);
        GLTest.buffers.cube.color = GLTest.newBuffer(unpacked); // Cube colours
        GLTest.buffers.cube.index = GLTest.newElementBuffer([ // Cube element buffer (for sharing vertices)
             0,  1,  2,    0,  2,  3, // Front face
             4,  5,  6,    4,  6,  7, // Back face
             8,  9, 10,    8, 10, 11, // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ]);
    },
    // Pushes the current model-view matrix to a temporary stack for use later after transform operations.
    mvPushMatrix: function () {
        var copy = mat4.create();
        for (var i=0;i<GLTest.mvMatrix.length;i++)
            copy[i] = GLTest.mvMatrix[i];
        GLTest.mvMatrixStack.push(copy);
    },
    // Pops the latest model-view matrix from the stack into the current matrix to reuse initial matrix transforms.
    mvPopMatrix: function () {
        if (GLTest.mvMatrixStack.length == 0) throw "The matrix stack does not have any matrices inside of it!";
        GLTest.mvMatrix = GLTest.mvMatrixStack.pop();
    },
    // Helper function that binds an attribute to a specific buffer.
    bindBuffer: function (buf, attr) {
        var gl = GLTest.$;
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(attr, buf.itemSize, gl.FLOAT, false, 0, 0);
    },
    // Sets the shader program's matrix uniforms.
    setMatrixUniforms: function () {
        var gl = GLTest.$;
        gl.uniformMatrix4fv(GLTest.shProg.pMatrixUniform, false, GLTest.pMatrix);
        gl.uniformMatrix4fv(GLTest.shProg.mvMatrixUniform, false, GLTest.mvMatrix);
    },
    // Draws the scene to the canvas.
    drawScene: function () {
        // SCENE SETUP //
        var gl = GLTest.$;
        gl.viewport(0, 0, GLTest.width, GLTest.height); // Set the viewport
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the buffers
        
        mat4.perspective(GLTest.pMatrix, dtr(45), GLTest.width / GLTest.height, 0.1, 100.0); // Set the perspective
        mat4.identity(GLTest.mvMatrix); // Set the identity matrix
        
        // DRAW PYRAMID //
        
        GLTest.mvPushMatrix(); // Save the current state for later
        
        mat4.translate(GLTest.mvMatrix, GLTest.mvMatrix, [-1.5, 0.0, -9.0]); // Go to triangle position
        mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(GLTest.rPyramid%360), [0,1,0]); // Rotate the triangle accordingly
        
        GLTest.bindBuffer(GLTest.buffers.pyramid.position, GLTest.shProg.vertexPositionAttribute); // Bind the buffers
        GLTest.bindBuffer(GLTest.buffers.pyramid.color, GLTest.shProg.vertexColorAttribute);
        
        GLTest.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, GLTest.buffers.pyramid.position.numItems); // Draw the triangle to the scene
        
        GLTest.mvPopMatrix(); // Get that state back
        
        // DRAW CUBE // 
        
        GLTest.mvPushMatrix(); // Save the current state for later
        
        mat4.translate(GLTest.mvMatrix, GLTest.mvMatrix, [1.5, 0.0, -9.0]); // Go to square position
        mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(GLTest.rCube%360), [1,1,1]); // Rotate the square accordingly
        
        GLTest.bindBuffer(GLTest.buffers.cube.position, GLTest.shProg.vertexPositionAttribute); // Bind the buffers
        GLTest.bindBuffer(GLTest.buffers.cube.color, GLTest.shProg.vertexColorAttribute);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, GLTest.buffers.cube.index);
        
        GLTest.setMatrixUniforms();
        // Draw the square to the scene, according to the index buffer
        gl.drawElements(gl.TRIANGLES, GLTest.buffers.cube.index.numItems, gl.UNSIGNED_SHORT, 0); 
        
        GLTest.mvPopMatrix(); // Get that state back
    },
    // Called every frame, this function changes values used in drawing the frame to create animation.
    animate: function () {
        if (GLTest.elapsedTime != -1) {
            var elapsed = new Date().getTime() - GLTest.elapsedTime;
            GLTest.rPyramid += (90 * elapsed) / 1000.0;
            GLTest.rCube -= (75 * elapsed) / 1000.0;
        }
        GLTest.elapsedTime = new Date().getTime();
    }
};
$(document).on("pageload", function () {
    GLTest.init("gl-canvas");
});