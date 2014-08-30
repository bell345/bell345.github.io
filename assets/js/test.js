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
var GLObjects = {};
GLObjects.Star = function (dist, speed) {
    this.angle = 0;
    this.dist = dist;
    this.speed = speed;
    this.randomiseColours();
}
GLObjects.Star.prototype.draw = function (tilt, spin, twinkle) {
    var gl = GLTest.$;
    GLTest.save();
    
    mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(this.angle), [0.0, 1.0, 0.0]);
    mat4.translate(GLTest.mvMatrix, GLTest.mvMatrix, [this.dist, 0.0, 0.0]);
    
    mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(-this.angle), [0,1,0]);
    mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(-GLTest.properties.global.tilt), [1,0,0]);
    
    if (twinkle) {
        gl.uniform3f(GLTest.shProg.colorUniform, this.tr, this.tg, this.tb);
        GLObjects.Star.draw();
    }
    mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(GLTest.properties.global.spin), [0,0,1]);
    gl.uniform3f(GLTest.shProg.colorUniform, this.r, this.g, this.b);
    GLObjects.Star.draw();
    
    GLTest.restore();
}
GLObjects.Star.prototype.animate = function (elapsed) {
    this.angle += this.speed * GLTest.FPMS * elapsed;
    this.dist -= 0.01 * GLTest.FPMS * elapsed;
    if (this.dist < 0.0) {
        this.dist += 5.0;
        this.randomiseColours();
    }
}
GLObjects.Star.prototype.randomiseColours = function () {
    this.r = Math.random();
    this.g = Math.random();
    this.b = Math.random();
    this.tr = Math.random();
    this.tg = Math.random();
    this.tb = Math.random();
}
GLObjects.Star.draw = function () {
    var gl = GLTest.$;
    GLTest.drawObject(
        GLTest.textures.star, gl.TRIANGLE_STRIP,
        { coords: GLTest.buffers.star.coords, position: GLTest.buffers.star.position },
        { coords: "textureCoordAttribute", position: "vertexPositionAttribute" }
    );
}
var GLTest = {
    FPMS: 60 / 1000,
    $: null,
    width: 0,
    height: 0,
    buffers: {
        star: {
            position: null,
            coords: null
        }
    },
    textures: {
        star: null
    },
    mvMatrix: mat4.create(),
    mvMatrixStack: [],
    pMatrix: mat4.create(),
    nMatrix: mat3.create(),
    shProg: null,
    objects: {
        stars: new Array(50)
    },
    properties: {
        global: {
            zoom: -15,
            tilt: 90,
            spin: 0
        },
    },
    elapsedTime: -1,
    activeKeys: {},
    initTasks: {},
    newInitTask: function (name, func) {
        GLTest.initTasks[name] = false;
        func();
    },
    completeInitTask: function (name) {
        GLTest.initTasks[name] = true;
    },
    preInit: function (id) {
        if (GLTest.get(id)) {
            GLTest.newInitTask("textures", GLTest.initTextures);
            var timer = 0;
            TBI.timerSet("gl-init", 10, function () {
                var complete = true;
                for (var task in GLTest.initTasks) {
                    if (GLTest.initTasks.hasOwnProperty(task))
                        if (GLTest.initTasks[task] == false) complete = false;
                }
                if (complete || timer > 10000) { GLTest.init(); TBI.timerClear("gl-init"); }
                else timer += 10;
            });
        }
    },
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
        var gl = GLTest.$;
        GLTest.initShaders();
        GLTest.initBuffers();
        GLTest.initWorld();
        
        gl.clearColor(0.0, 0.0, 0.55, 1.0);
        
        GLTest.loop();
    },
    // Handles the operations done for every frame of animation.
    loop: function () {
        if (window.requestAnimationFrame) requestAnimationFrame(GLTest.loop);
        GLTest.drawScene();
        GLTest.animate();
    },
    // Gets a shader for a specific WebGL rendering context with an id.
    getShader: function (id) {
        var gl = GLTest.$,
            shScript = gebi(id),
            shader;
        if (isNull(shScript)) return null;
        else if (shScript.type == "x-shader/x-fragment") shader = gl.createShader(gl.FRAGMENT_SHADER);
        else if (shScript.type == "x-shader/x-vertex") shader = gl.createShader(gl.VERTEX_SHADER);
        else return null;
        
        gl.shaderSource(shader, shScript.textContent);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { TBI.error(gl.getShaderInfoLog(shader)); return null; }
        return shader;
    },
    getAttribute: function (shprog, name) {
        var gl = GLTest.$;
        var attr = gl.getAttribLocation(shprog, name);
        gl.enableVertexAttribArray(attr);
        return attr;
    },
    // Initialises the shader program.
    initShaders: function () {
        var gl = GLTest.$;
        var frag = GLTest.getShader("gl-shfrag"); // Fragment shader
        var vert = GLTest.getShader("gl-shvert"); // Vertex shader
        GLTest.shProg = gl.createProgram(); // Create the program
        gl.attachShader(GLTest.shProg, vert); // Attach the shaders
        gl.attachShader(GLTest.shProg, frag);
        gl.linkProgram(GLTest.shProg); // Then link the program with the rendering context
        
        if (!gl.getProgramParameter(GLTest.shProg, gl.LINK_STATUS)) TBI.error("Could not initialise shaders.");
        else gl.useProgram(GLTest.shProg); // Use the shader program
        
        GLTest.shProg.vertexPositionAttribute = GLTest.getAttribute(GLTest.shProg, "aVertexPosition");
        GLTest.shProg.textureCoordAttribute = GLTest.getAttribute(GLTest.shProg, "aTextureCoord");
        
        GLTest.shProg.pMatrixUniform = gl.getUniformLocation(GLTest.shProg, "uPMatrix"); // Sets the uniform variables
        GLTest.shProg.mvMatrixUniform = gl.getUniformLocation(GLTest.shProg, "uMVMatrix");
        GLTest.shProg.samplerUniform = gl.getUniformLocation(GLTest.shProg, "uSampler");
        GLTest.shProg.colorUniform = gl.getUniformLocation(GLTest.shProg, "uColor");
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
    // Initialises the buffers.
    initBuffers: function () {
        GLTest.buffers.star.position = GLTest.newBuffer([
            [-1.0,-1.0, 0.0],
            [ 1.0,-1.0, 0.0],
            [-1.0, 1.0, 0.0],
            [ 1.0, 1.0, 0.0]
        ]);
        GLTest.buffers.star.coords = GLTest.newBuffer([
            [0.0, 0.0],
            [1.0, 0.0],
            [0.0, 1.0],
            [1.0, 1.0]
        ]);
    },
    initTextures: function (func) {
        GLTest.textures.star = GLTest.newTexture("/assets/res/star.gif");
        TBI.timerSet("gl-textures", 10, function () {
            var complete = true;
            for (var tex in GLTest.textures)
                if (GLTest.textures.hasOwnProperty(tex))
                    if (GLTest.textures(tex) == false) complete = false;
            if (complete) {
                GLTest.completeInitTask("textures");
                TBI.timerClear("gl-textures");
            }
        });
    },
    newTexture: function (url) {
        var gl = GLTest.$,
            tex = gl.createTexture();
        tex.image = new Image();
        tex.image.onload = function () { GLTest.loadTexture(tex); }
        tex.image.src = url;
        return tex;
    },
    loadTexture: function (tex) {
        var gl = GLTest.$;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
    },
    initWorld: function () {
        for (var i=0,l=GLTest.objects.stars.length;i<l;i++)
            GLTest.objects.stars[i] = new GLObjects.Star((i/l) * 5.0, i/l);
    },
    // Pushes the current model-view matrix to a temporary stack for use later after transform operations.
    save: function () {
        var copy = mat4.create();
        for (var i=0;i<GLTest.mvMatrix.length;i++)
            copy[i] = GLTest.mvMatrix[i];
        GLTest.mvMatrixStack.push(copy);
    },
    // Pops the latest model-view matrix from the stack into the current matrix to reuse initial matrix transforms.
    restore: function () {
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
        var gl = GLTest.$, obj;
        gl.viewport(0, 0, GLTest.width, GLTest.height); // Set the viewport
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the buffers
        
        mat4.perspective(GLTest.pMatrix, dtr(45), GLTest.width / GLTest.height, 0.1, 100.0); // Set the perspective
        
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.enable(gl.BLEND);
        
        var glob = GLTest.properties.global;
        
        mat4.identity(GLTest.mvMatrix); // Set the identity matrix
        mat4.translate(GLTest.mvMatrix, GLTest.mvMatrix, [0.0, 0.0, glob.zoom]);
        mat4.rotate(GLTest.mvMatrix, GLTest.mvMatrix, dtr(glob.tilt), [1.0, 0.0, 0.0]);
        
        GLTest.objects.stars.forEach(function (star) {
            star.draw(glob.tilt, glob.spin, TBI.isToggled(gebi("gl-twinkle")));
            GLTest.properties.global.spin
        });
        for (var i=0;i<GLTest.objects.stars.length;i++)  {
            GLTest.objects.stars[i].draw(glob.tilt, glob.spin, TBI.isToggled(gebi("gl-twinkle")));
            GLTest.properties.global.spin += 0.1;
        }
    },
    drawObject: function (texture, type, buffers, attributes) {
        var gl = GLTest.$;
        if (!isNull(texture) && GLTest.shProg.hasOwnProperty("samplerUniform")) { 
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(GLTest.shProg.samplerUniform, 0);
        }
        
        for (var buf in buffers)
            if (buffers.hasOwnProperty(buf))
                if (buf.search("_el") != -1) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[buf]);
                else if (attributes.hasOwnProperty(buf)) GLTest.bindBuffer(buffers[buf], GLTest.shProg[attributes[buf]]);
        
        GLTest.setMatrixUniforms();
        if (type == gl.TRIANGLE_STRIP && buffers.hasOwnProperty("position"))
            gl.drawArrays(type, 0, buffers.position.numItems);
        else if (type == gl.TRIANGLES && buffers.hasOwnProperty("index_el")) 
            gl.drawElements(type, buffers.index_el.numItems, gl.UNSIGNED_SHORT, 0);
        else throw("Object failed to draw!");
    },
    // Called every frame, this function changes values used in drawing the frame to create animation.
    animate: function () {
        if (GLTest.elapsedTime != -1) {
            var elapsed = new Date().getTime() - GLTest.elapsedTime;
            for (var i=0;i<GLTest.objects.stars.length;i++)
                GLTest.objects.stars[i].animate(elapsed);
            
            if (GLTest.activeKeys[Keys.PAGE_UP]) GLTest.properties.global.zoom -= 0.1;
            else if (GLTest.activeKeys[Keys.PAGE_DOWN]) GLTest.properties.global.zoom += 0.1;
            
            if (GLTest.activeKeys[Keys.UP]) GLTest.properties.global.tilt += 2;
            else if (GLTest.activeKeys[Keys.DOWN]) GLTest.properties.global.tilt -= 2;
        }
        GLTest.elapsedTime = new Date().getTime();
    }
};
$(document).on("pageload", function () {
    GLTest.preInit("gl-canvas");
    var canvasActive = false;
    $("#gl-canvas").mouseenter(function () { canvasActive = true; });
    $("#gl-canvas").mouseleave(function () { canvasActive = false; GLTest.activeKeys = {} });
    $(document).keydown(function (event) { 
        if (canvasActive) { 
            GLTest.activeKeys[event.which] = true; 
            event.preventDefault();
        } 
    });
    $(document).keyup(function (event) { if (canvasActive) GLTest.activeKeys[event.which] = false });
});