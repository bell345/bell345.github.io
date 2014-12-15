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
        with (Math) switch (a) {
            case "hyp": switch (b) {
                case "adj": switch (c) {
                    case "opp": r = sqrt(x*x-y*y); break;
                    case "a": r = rtd(acos(y/x)); break;
                } break;
                case "opp": switch (c) {
                    case "adj": r = sqrt(x*x-y*y); break;
                    case "a": r = rtd(asin(y/x)); break;
                } break;
                case "a": switch (c) {
                    case "adj": r = x*cos(dtr(y)); break;
                    case "opp": r = x*sin(dtr(y)); break;
                } break;
            } break;
            case "adj": switch (b) {
                case "hyp": switch (c) {
                    case "opp": r = sqrt(y*y-x*x); break;
                    case "a": r = rtd(acos(x/y)); break;
                } break;
                case "opp": switch (c) {
                    case "hyp": r = sqrt(x*x+y*y); break;
                    case "a": r = rtd(atan(y/x)); break;
                } break;
                case "a": switch (c) {
                    case "hyp": r = x/cos(dtr(y)); break;
                    case "opp": r = x*tan(dtr(y)); break;
                } break;
            } break;
            case "opp": switch (b) {
                case "hyp": switch (c) {
                    case "adj": r = sqrt(y*y-x*x); break;
                    case "a": r = rtd(asin(x/y)); break;
                } break;
                case "adj": switch (c) {
                    case "hyp": r = sqrt(y*y+x*x); break;
                    case "a": r = rtd(atan(x/y)); break;
                } break;
                case "a": switch (c) {
                    case "hyp": r = x/sin(dtr(y)); break;
                    case "adj": r = x/tan(dtr(y)); break;
                } break;
            } break;
            case "a": switch (b) {
                case "hyp": switch (c) {
                    case "adj": r = y*cos(dtr(x)); break;
                    case "opp": r = y*sin(dtr(x)); break;
                } break;
                case "adj": switch (c) {
                    case "hyp": r = y/cos(dtr(x)); break;
                    case "opp": r = y*tan(dtr(x)); break;
                } break;
                case "opp": switch (c) {
                    case "hyp": r = y/sin(dtr(x)); break;
                    case "adj": r = y/tan(dtr(x)); break;
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
                if (complete || timer > 10000) {
                    GLTest.init();
                    TBI.timerClear("gl-init");
                    $("#gl + .item-info .gl-overlay-container").hide();
                }
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
                    if (GLTest.textures[tex].image.complete == false) complete = false;
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
            GLTest.properties.global.spin += 0.1;
        });
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
var Test3 = {
    activeKeys: {},
    yawRate: 0,
    pitchRate: 0,
    speed: 0,
    strafe: 0,
    forward: 0,
    yaw: 0,
    pitch: 0,
    ground: null,
    elapsedTime: -1,
    lastSecond: -1,
    sunAngle: 0,
    fps: 0,
    paused: false,
    debug: false,
    settings: {
        terrain: {
            definition: 2,
            modifier: 0.6,
            seeds: [0,10,12,4]
        },
        speeds: {
            forward: 0.005,
            backward: 0.005,
            left: 0.005,
            right: 0.005
        }
    },
    changeOverlay: function (message) {
        $("#three-gl + .item-info .cvs-overlay-cont").show();
        $("#three-gl + .item-info .cvs-overlay").html(message);
    },
    removeOverlay: function () {
        $("#three-gl + .item-info .cvs-overlay-cont").hide();
    },
    init: function (id) {
        Test3.initStage(id);
        Test3.initObjects();
        Test3.initLighting();

        Test3.camera.position.set(0, 5, 5);

        Test3.removeOverlay();

        Test3.loop();
    },
    initStage: function (id) {
        Test3.canvas = gebi(id);
        Test3.width = Test3.canvas.width;
        Test3.height = Test3.canvas.height;

        Test3.camera = new THREE.PerspectiveCamera(75, Test3.width/Test3.height, 0.1, 10000);
        Test3.camera.rotation.order = 'YXZ';
        Test3.scene = new THREE.Scene();

        Test3.renderer = new THREE.WebGLRenderer({canvas:Test3.canvas,precision:"mediump"});
        Test3.renderer.shadowMapEnabled = true;
        // Test3.renderer.shadowMapType = THREE.PCFSoftShadowMap;
        Test3.renderer.setSize(Test3.width, Test3.height);
        Test3.renderer.setClearColor(0xd2d2d2, 0.1);

        Test3.$ = Canvas2D("tgl-2dcanvas");
    },
    initObjects: function () {
        var geometry = new THREE.OctahedronGeometry(1),
            material = new THREE.MeshPhongMaterial({ambient:0x555555,color:0x2299aa,specular:0xaaaaaa,shininess:20,shading:THREE.FlatShading});
        Test3.oct = new THREE.Mesh(geometry, material);
        Test3.oct.castShadow = true;
        Test3.scene.add(Test3.oct);

        var terrSet = Test3.settings.terrain,
            def = terrSet.definition;
        geometry = new THREE.PlaneGeometry(120, 120, Math.pow(2,def), Math.pow(2,def));/*
        var terrain = randomDisplacement(terrSet.seeds, def, terrSet.modifier);
        terrain.flatten().forEach(function (z, i) { geometry.vertices[i].setZ(z) });*/

        material = new THREE.MeshPhongMaterial({
            ambient: 0x333333,
            color: 0x555555,
            specular: 0xaaaaaa,
            shininess: 10,
            shading:THREE.SmoothShading,
            side:THREE.DoubleSide
        });
        Test3.ground = new THREE.Mesh(geometry, material);
        Test3.ground.receiveShadow = true;
        Test3.ground.rotation.set(dtr(90), 0, 0);
        Test3.ground.position.set(0, -2, 0);
        Test3.scene.add(Test3.ground);

        geometry = new THREE.SphereGeometry(0.5, 8, 8);
        Test3.sphere = new THREE.Mesh(geometry, material);
        Test3.sphere.position.z = 5;
        Test3.sphere.castShadow = true;
        Test3.scene.add(Test3.sphere);/*

        geometry = new THREE.SphereGeometry(2000, 128, 128);
        material = new THREE.MeshBasicMaterial({color:0x00dddd,side:THREE.BackSide});
        Test3.skybox = new THREE.Mesh(geometry, material);
        Test3.scene.add(Test3.skybox);

        Test3.player = new THREE.Object3D();

        geometry = new THREE.SphereGeometry(0.5, 16, 16);
        material = new THREE.MeshPhongMaterial({ambient:0x777777,color:0xdddddd,specular:0xffffff,shininess:5,shading:THREE.FlatShading});
        var head = new THREE.Mesh(geometry, material);
        head.position.set(0, 2.15, 0);
        head.castShadow = true;
        Test3.player.add(head);

        geometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        var body = new THREE.Mesh(geometry, material);
        body.castShadow = true;
        body.position.set(0, 1.0, 0);
        Test3.player.add(body);

        geometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        var arm = new THREE.Mesh(geometry, material);
        arm.castShadow = true;
        arm.position.set(-0.6, 1.1, 0);
        Test3.player.add(arm);
        var arm2 = arm.clone();
        arm2.position.set(0.6, 1.1, 0);
        Test3.player.add(arm2);

        geometry = new THREE.BoxGeometry(0.3, 1.1, 0.3);
        var leg = new THREE.Mesh(geometry, material);
        leg.castShadow = true;
        leg.position.set(-0.2, 0, 0);
        Test3.player.add(leg);
        var leg2 = leg.clone();
        leg2.position.set(0.2, 0, 0);
        Test3.player.add(leg2);

        Test3.player.position.set(0, 0, -4);

        Test3.scene.add(Test3.player);*/
        var geometry = new THREE.SphereGeometry(1.5, 16, 16),
            material = new THREE.MeshPhongMaterial({ambient:0x777777,color:0xdd3333,specular:0xffffff,shininess:20,shading:THREE.FlatShading});
        Test3.physTestObj = new THREE.Mesh(geometry, material);
        Test3.physTestObj.position.set(4.0, 0, 0);
        Test3.scene.add(Test3.physTestObj);
    },
    initLighting: function () {
        Test3.scene.add(new THREE.AmbientLight(0x999999));

        /*var light = new THREE.SpotLight(0x00aaff);
        light.castShadow = true;
        light.shadowCameraVisible = true;
        light.position.set(0,0,3);
        Test3.scene.add(light);
        var geometry = new THREE.SphereGeometry(0.1, 32, 32);
        var obj = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:0x00aaff}));
        obj.position.set(0,0,3);
        Test3.scene.add(obj);*/

        light = new THREE.SpotLight(0xaaaaaa, 1.0);
        light.castShadow = true;
        light.shadowMapWidth = light.shadowMapHeight = 2048;
        light.shadowCameraFar = 15;
        light.shadowCameraNear = 1;
        light.shadowCameraFov = 80;
        light.position.set(0, 4, 0);
        Test3.scene.add(light);
        /*
        Test3.sun = new THREE.Object3D();

        Test3.sun = new THREE.SpotLight(0xffffff, 1.0);
        Test3.sun.castShadow = true;
        Test3.sun.target.position.set(0,0,0);
        Test3.sun.shadowMapWidth = Test3.sun.shadowMapHeight = 2048;
        Test3.sun.shadowCameraLeft = -0.5;
        Test3.sun.shadowCameraBottom = -0.5;
        Test3.sun.shadowCameraRight = 0.5;
        Test3.sun.shadowCameraTop = 0.5;
        Test3.sun.shadowCameraFar = 400;
        Test3.sun.shadowCameraNear = 40;

        Test3.scene.add(Test3.sun);*/
    },
    loop: function () {
        requestAnimationFrame(Test3.loop);
        Test3.frames++;
        if (document.body.className.search(" in-focus") == -1) {
            Test3.changeOverlay("Lost focus. Please refocus the window to resume.");
            Test3.elapsedTime = -1;
        } else if (Test3.paused == true) {
            Test3.changeOverlay("Paused.");
            Test3.elapsedTime = -1;
        } else {
            Test3.removeOverlay();
            if (Math.floor(new Date().getTime()/1000) > Test3.lastSecond) {
                Test3.lastSecond = Math.floor(new Date().getTime()/1000);
                Test3.fps = Test3.frames;
                Test3.frames = 0;
            }
            Test3.animate();
            Test3.handleKeys();
            Test3.debugInfo();
            Test3.renderer.render(Test3.scene, Test3.camera);
        }
    },
    moveRelative: function (obj, angle, speed, plane) {
        obj.position[plane[0]] -= Math.sin(angle) * speed;
        obj.position[plane[1]] -= Math.cos(angle) * speed;
    },
    sunState: function () {
        if (Test3.sunAngle >= dtr(180)) return "night";
        else if (Test3.sunAngle <= dtr(20) || Test3.sunAngle >= dtr(160)) return "twilight";
        else return "day";
    },
    animate: function () {
        var now = new Date().getTime();
        if (Test3.elapsedTime != -1) {
            var delta = now - Test3.elapsedTime;
            Test3.oct.rotation.x += dtr(0.03 * delta);
            Test3.oct.rotation.y += dtr(0.08 * delta);
            Test3.oct.rotation.z += dtr(0.1 * delta);

            Test3.camera.rotation.x = dtr(Test3.pitch);
            Test3.camera.rotation.y = dtr(Test3.yaw);
            Test3.pitch += Test3.pitchRate * delta;
            /*
            var playPos = Test3.player.position,
                playDist = Test3.camera.position.distanceTo(playPos);
            if (playDist > 12) Test3.moveRelative(Test3.camera, Test3.camera.rotation.y, 0.001*delta*playDist, "xz");

            Test3.camera.lookAt(Test3.player.position);
            Test3.player.rotation.y = dtr(Test3.yaw);

            Test3.sunAngle = ((Test3.sunAngle + dtr(0.003) * delta) % dtr(360)).fixFloat(14);

            Test3.sun.position.y = Math.sin(Test3.sunAngle) * 90;
            Test3.sun.position.z = Math.cos(Test3.sunAngle) * 90;

            if (Test3.sunState() == "night") {
                Test3.sun.intensity = 0;
            }
            else if (Test3.sunState() == "twilight") {
                var intensity = 0;
                if (Test3.sunAngle >= dtr(160)) intensity = (dtr(180) - Test3.sunAngle) / dtr(20);
                else if (Test3.sunAngle <= dtr(20)) intensity = (dtr(180) * Test3.sunAngle) / (Math.PI*Math.PI / 9);
                Test3.sun.intensity = intensity;
            } else Test3.sun.intensity = 1;

            Test3.skybox.material.color = new THREE.Color(0x050577).lerp(new THREE.Color(0x00dddd), Test3.sun.intensity);*/

            /*$("#tgl-sangle").html(rtd(Test3.sunAngle));*/
            /*$("#tgl-sintense").val(Test3.sun.intensity);*/

            //Test3.sun.position.normalize();
            /*
            if (Test3.forward != 0)
                Test3.moveRelative(
                    Test3.player,
                    dtr(Test3.yaw),
                    Test3.forward * delta * (Test3.activeKeys[Keys.SHIFT]?25:1), "xz");
            if (Test3.strafe != 0)
                Test3.moveRelative(
                    Test3.player,
                    dtr(Test3.yaw + 90),
                    Test3.strafe * delta * (Test3.activeKeys[Keys.SHIFT]?25:1), "xz");
            */
            /*Test3.moveRelative(
                Test3.camera,
                dtr(Test3.yaw),
                Test3.forward * delta * (Test3.activeKeys[Keys.SHIFT]?3:1),
                "xz"
            );
            Test3.moveRelative(
                Test3.camera,
                dtr(Test3.yaw + 90),
                Test3.strafe * delta * (Test3.activeKeys[Keys.SHIFT]?3:1),
                "xz"
            );*/
            if (Test3.activeKeys[Keys.UP]) Test3.camera.position.y += 0.1 * delta;
            else if (Test3.activeKeys[Keys.DOWN]) Test3.camera.position.y -= 0.1 * delta;
        }
        Test3.elapsedTime = now;
    },
    debugInfo: function () {
        Test3.$.clearRect(0,0,Test3.width,Test3.height);
        if (Test3.debug) {
            Test3.$.fillStyle = "rgba(0,0,0,0.3)";
            Test3.$.beginPath();
            Test3.$.fillRect(0,600-150,300,150);
            Test3.$.closePath();
            var x = 8, y = 588, yinc = 26;
            Test3.$.fillStyle = "#eee";
            Test3.$.font = "18px Raleway";
            Test3.$.fillText("FPS: "+Test3.fps, x, y);
            var time = zeroPrefix(Math.floor(rtd(Test3.sunAngle)/15+8)%24)+":"+zeroPrefix(Math.floor(rtd(Test3.sunAngle)%15/15*60));
            Test3.$.fillText("Time: "+time, x, y-=yinc);
        }
    },
    handleKeys: function () {
        if (Test3.activeKeys[Keys.PAGE_UP]) Test3.pitchRate = 0.2;
        else if (Test3.activeKeys[Keys.PAGE_DOWN]) Test3.pitchRate = -0.2;
        else Test3.pitchRate = 0;

        var speeds = Test3.settings.speeds;

        if (Test3.activeKeys[Keys.A]) Test3.strafe = speeds.left;
        else if (Test3.activeKeys[Keys.D]) Test3.strafe = -speeds.right;
        else Test3.strafe = 0;

        if (Test3.activeKeys[Keys.W]) Test3.forward = speeds.forward;
        else if (Test3.activeKeys[Keys.S]) Test3.forward = -speeds.backward;
        else Test3.forward = 0;
    },
    toggleHandlers: {},
    bind: function (prop, el) {
        Test3.toggleHandlers[el.id] = prop;
        $(el).click(function () { Test3[Test3.toggleHandlers[this.id]] = TBI.isToggled(this); });
        Test3[prop] = TBI.isToggled(el);
    }
};
$(document).on("pageload", function () {
    Test3.init("tgl-canvas");
    var tglActive = false;
    $("#tgl-canvas").mouseenter(function () { tglActive = true; });
    $("#tgl-canvas").mouseleave(function () { tglActive = false; Test3.activeKeys = {} });
    $(document).keydown(function (event) { if (tglActive) { Test3.activeKeys[event.which] = true; event.preventDefault(); } });
    $(document).keyup(function (event) { if (tglActive) Test3.activeKeys[event.which] = false });
    $("#tgl-canvas").click(function (event) {
        if (PointerLock.check(this)) PointerLock.release(this);
        else PointerLock.set(this);
    });
    $("#tgl-canvas").mousemove(function (event) {
        if (PointerLock.check(this)) {
            Test3.pitch = Math.bound(Test3.pitch - event.originalEvent.movementY * (1/2), -70, 70);
            Test3.yaw = (Test3.yaw - event.originalEvent.movementX * (1/2)) % 360;
        }
    });
    $("#tgl-canvas").on("contextmenu", function (event) { event.preventDefault(); });
    $("#tgl-canvas").on("mousewheel", function (event) {
        if (event.wheelDelta > 0) Test3.camera.position.z -= 0.1;
        else Test3.camera.position.z += 0.1;
        event.preventDefault();
    });
    Test3.bind("debug", gebi("tgl-debug"));
    Test3.bind("paused", gebi("tgl-pause"));
    $(window).focus(Test3.loop);
});
function Vector2D(x, y) { this.x = x; this.y = y; }
Vector2D.prototype = {
    constructor: Vector2D,
    // Create a copy of the vector that won't change the original.
    copy: function () { return new Vector2D(this.x, this.y); },
    // add, subtract and multiply are self-explanatory.
    add: function (a) { if (a instanceof Vector2D) return this.addVector(a); else return this.addScalar(a); },
    // note: "scalar" here just means "number", as in "not vector".
    addScalar: function (n) { this.x += n; this.y += n; return this; },
    addVector: function (vec) { this.x += vec.x; this.y += vec.y; return this; },
    subtract: function (a) { if (a instanceof Vector2D) return this.subtractVector(a); else return this.subtractScalar(a); },
    subtractScalar: function (n) { this.x -= n; this.y -= n; return this;},
    subtractVector: function (vec) { this.x -= vec.x; this.y -= vec.y; return this; },
    // Returns the magnitude of the vector.
    magnitude: function () { return Math.pythagoras(this.x, this.y); },
    // Returns the square of the magnitude of the vector (less computationally intensive).
    magnitudeSquared: function () { return this.dot(this); },
    // Changes the vector into a unit vector.
    normalise: function () { var mag = this.magnitude(); this.x /= mag; this.y /= mag; return this; },
    // Rotates the vector into the first quadrant (++).
    absolute: function () { this.x = Math.abs(this.x); this.y = Math.abs(this.y); return this; },
    multiply: function (a) { if (a instanceof Vector2D) return this.multiplyVector(a); else return this.multiplyScalar(a); },
    multiplyScalar: function (n) { this.x *= n; this.y *= n; return this; },
    multiplyVector: function (vec) { this.x *= vec.x; this.y *= vec.y; return this; },
    negate: function () { return this.multiply(-1); },
    // Returns the dot product of two vectors.
    dot: function (vec) { return this.x*vec.x + this.y*vec.y; },
    // Returns the wedge product of two vectors.
    wedge: function (vec) { return this.x*vec.y - this.y*vec.x; },
    // Clamps the vector's x and y values to a minimum and maximum vector.
    clamp: function (min, max) { this.x = Math.bound(min.x, max.x); this.y = Math.bound(min.y, max.y); return this; },
    toMatrix: function () { return new Matrix([this.x, this.y]); },
    // Returns the angle formed by the vector with the positive X axis.
    angle: function () { return Math.atan2(this.y/this.x); },
    // Projects the vector onto another.
    project: function (vec) { return vec.multiplyScalar(this.dot(vec)/vec.dot(vec)); },
    // Gets the normal of a vector.
    normal: function (dir) { if (dir) return new Vector2D(-this.y, this.x); else return new Vector2D(this.y, -this.x); }
};/*
function P2DObject(id, geometry, material, position, rotation, scale) {
    if (!isNull(id)) this.id = id;
    else this.id = new Date().getTime()*Math.random();
    this.geometry = geometry;
    this.material = material;
    this.position = position || new Vector2D(0, 0, 0);
    this.rotation = rotation || 0;
    this.scale = scale || 1;
}
P2DObject.prototype.testCollision = function (o2) {
    var o1 = this,
        b1 = this.geometry,
        b2 = o2.geometry;
    switch (b1.constructor) {
        case P2DBoxGeometry: switch (b2.constructor) {
            case P2DBoxGeometry:

            break;
        } break;
    }
    return null;
}
function P2DSolidMaterial(colour) {
    this.colour = colour;
}
function P2DOutlineMaterial(colour, width) {
    this.colour = colour;
    this.width = width || 1;
}
function P2DPolygonGeometry(plot) {
    for (var i=0;i<plot.length;i++)
        if (plot instanceof Array) plot[i] = new Vector2D(plot[i][0], plot[i][1]);
    this.plot = plot;
}
function P2DCircleGeometry(radius) {
    this.radius = radius;
}
P2DCircleGeometry.prototype.isColliding = function (o2) {
    var o1 = this,
        g1 = this.geometry,
        g2 = o2.geometry;
    switch (g2.constructor) {
        case P2DCircleGeometry:
            return o1.position.subtract(o2.position).magnitude() -
                (g1.radius + g2.radius) < 0;
        break;
        case P2DAxisAlignedBoundingBox:
            var d = o1.position
                .subtract(
                    o1.position
                    .subtract(o2.position)
                    .clamp(
                        g2.halfExtents
                        .multiply(-1),
                        g2.halfExtents
                    )
                ).magnitude() - g1.radius;
            return d < 0;
        break;
        default: return false;
    }
}
function P2DBoxGeometry(width, height) {
    this.width = width;
    this.height = height;
    this.halfExtents = new Vector2D(width/2, height/2);
}*/
function P2DObject(id, position, rotation) {
    if (!isNull(id)) this.id = id;
    else this.id = btoa(parseInt(Math.random()*new Date().getTime())).substring(0, 16);
    this.position = position || new Vector2D(0, 0);
    this.rotation = rotation || 0;
    this.vertices = [];
}
P2DObject.prototype.setPosition = function (vec) { this.position = vec; return this; }
P2DObject.prototype.setRotation = function (angle) { this.rotation = angle; return this; }
P2DObject.prototype.scale = function (num) {
    for (var i=0;i<this.vertices.length;i++)
        this.vertices[i] = this.vertices[i].subtractVector(this.position).multiplyScalar(num).addVector(this.position);
    return this;
}
function circlePointV2D(angle, radius, centre) {
    if (isNull(centre)) centre = new Vector2D(0, 0);
    return centre.copy().add(new Vector2D(radius*Math.cos(angle), radius*Math.sin(angle)));
}
function P2DBoxObject(id, position, rotation, width, height) {
    P2DObject.call(this, id, position, rotation);
    this.width = width;
    this.height = height;
    this.halfExtents = new Vector2D(width/2, height/2);
    this.setVertices();
}
P2DBoxObject.prototype = P2DObject.prototype;
P2DBoxObject.prototype.constructor = P2DBoxObject;
P2DBoxObject.prototype.setVertices = function () {
    var extent = Math.pythagoras(this.width, this.height),
        angle = Math.atan2(this.height, this.width);
    this.vertices = [
        circlePointV2D(this.rotation-angle, -extent, this.position), // top-left
        circlePointV2D(this.rotation+angle, -extent, this.position), // bottom-left
        circlePointV2D(this.rotation-angle, extent, this.position), // bottom-right
        circlePointV2D(this.rotation+angle, extent, this.position) // top-right
    ];
}
P2DBoxObject.prototype.setPosition = function (position) {
    this.position = position;
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.setRotation = function (angle) {
    this.rotation = angle;
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.setDimensions = function (width, height) {
    this.width = width;
    this.height = height;
    this.halfExtents = new Vector2D(width/2, height/2);
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.scale = function (num) {
    this.height *= num;
    this.width *= num;
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.getMinkowskiSum = function (obj2) {
    for (var i=0,v=[];i<this.vertices.length;i++) v[i] = this.vertices[i].copy().add(obj2.vertices[i]);
    return v;
}
P2DBoxObject.prototype.getCollisionVector = function (obj2) {
    var obj1 = this;
    switch (obj2.constructor) {
        case P2DBoxObject:

        break;
        default: return null;
    }
}
function Matrix(arr) {
    Array.call(this);
    for (var i=0;i<arr.length;i++) this.push(arr[i]);
    this.rows = arr.length;
    this.columns = arr[0].length;
}
Matrix.fromMatrixCollection = function (matarr) {
    for (var i=0,a=[];i<matarr.length;i++) a.push(matarr[i].toArray());
    return new Matrix(a);
}
Matrix.prototype = new Array();
Matrix.prototype.constructor = Matrix;
Matrix.prototype.toArray = function () { for (var i=0,a=[];i<this.length;i++) a.push(this[i]); return a; }
Matrix.prototype.getRow = function (row) { return this[row]; }
Matrix.prototype.getColumn = function (column) { for (var i=0,a=[];i<this.length;i++) a.push(this[i][column]); return a; }
Matrix.prototype.getElement = function (n) { return this[Math.floor(n/this.columns)][n%this.columns]; }
Matrix.prototype.multiply = function (mat) {
    if (this.columns != mat.rows) return undefined;
    for (var i=0,a=[];i<this.rows;i++) {
        for (var j=0,b=[];j<mat.columns;j++) {
            for (var k=0,t=0;k<this.getRow(i).length;k++)
                t += this.getRow(i)[k] * mat.getColumn(j)[k];
            b.push(t);
        }
        a.push(b);
    }
    return new Matrix(a);
}
Matrix.prototype.transpose = function () {
    for (var i=0,a=[];i<this.rows;i++) for (var j=0;j<this.columns;j++) a.push(this[j][i]);
    return a;
}
var Phys2D = {
    canvas: null,
    frames: 0,
    state: {
        paused: false,
        lastSecond: -1
    },
    settings: {

    },
    objects: [],
    overlay: {
        showMessage: function (message) {
            $("#phys-2d + .item-info .cvs-overlay-cont").show();
            $("#phys-2d + .item-info .cvs-overlay").html(message);
        },
        hide: function () {
            $("#phys-2d + .item-info .cvs-overlay-cont").hide();
        }
    },
    init: function () {
        if (!isNull(Phys2D.canvas)) {
            Phys2D.initStage();
            Phys2D.initObjects();
            Phys2D.loop();
        } else TBI.log("Phys2D initialisation failed.");
    },
    initStage: function () {
        Phys2D.$ = Phys2D.canvas.getContext("2d");
        Phys2D.width = Phys2D.canvas.width;
        Phys2D.height = Phys2D.canvas.height;
        Phys2D.overlay.hide();
        Phys2D.$.translate(0, Phys2D.height);
    },
    initObjects: function () {/*
        Phys2D.objects.push(new P2DObject(
            "circle-test",
            new P2DCircleGeometry(20),
            new P2DSolidMaterial("#00f"),
            new Vector2D(0, 0)
        ));
        Phys2D.objects.push(new P2DObject(
            "plot-test",                    // id
            new P2DPolygonGeometry([        // geometry
                [5,5],
                [5,-5],
                [-5,-5],
                [-5,5],
                [5,5]
            ]),
            new P2DOutlineMaterial("#f00"), // material
            new Vector2D(100, 200),         // position (optional)
            dtr(20),                             // angle (optional)
            10                              // scale (optional)
        ));*/
        Phys2D.objects.push(new P2DBoxObject(
            "box-test",
            new Vector2D(100, 180),
            dtr(20),
            90, 30
        ));
        Phys2D.objects.push(new P2DBoxObject(
            "box-test2",
            new Vector2D(200, 200),
            dtr(0),
            40, 120
        ));
    },
    getObjectById: function (id) {
        for (var i=0;i<Phys2D.objects.length;i++)
            if (Phys2D.objects[i].id == id)
        return Phys2D.objects[i];
    },
    loop: function () {
        requestAnimationFrame(Phys2D.loop);

        if (document.body.className.search(" in-focus") == -1) { // lost focus
            Phys2D.overlay.showMessage("Lost focus. Please re-focus the browser window to continue.");
        } else if (Phys2D.state.paused) { // paused
            Phys2D.overlay.showMessage("Paused.");
        } else { // active
            Phys2D.overlay.hide();
            // time and frame control
            if (new Date().getTime() > Phys2D.lastSecond + 1000) {
                Phys2D.lastSecond = new Date().getTime();
                Phys2D.fps = Phys2D.frames;
                Phys2D.frames = 0;
            } else Phys2D.frames++;
            Phys2D.draw();
            Phys2D.animate();
        }
    },
    draw: function () {
        Phys2D.$.clearRect(0, 0, Phys2D.width, -Phys2D.height);
        Phys2D.$.fillStyle = "#eee";
        Phys2D.$.fillRect(0, 0, Phys2D.width, -Phys2D.height);
        for (var i=0;i<Phys2D.objects.length;i++) {
            var curr = Phys2D.objects[i];

            Phys2D.$.beginPath();
            Phys2D.$.save();

            switch (curr.constructor) {
                case P2DBoxObject:
                    Phys2D.$.fillStyle = Phys2D.$.strokeStyle = "#777";
                    Phys2D.$.lineWidth = 2;

                    for (var j=0;j<curr.vertices.length;j++) {
                        var v = curr.vertices[j];
                        Phys2D.$.fillStyle = "#f00|#0f0|#00f|#ff0|#aaa".split("|")[j<0||j>3?4:j];
                        Phys2D.$.drawCircle(v.x, -v.y, 5, false);
                    }

                    Phys2D.$.fillStyle = Phys2D.$.strokeStyle = "#777";
                    Phys2D.$.beginPath();
                    Phys2D.$.moveTo(curr.vertices[0].x, -curr.vertices[0].y);
                    for (var j=1;j<curr.vertices.length;j++)
                        Phys2D.$.lineTo(curr.vertices[j].x, -curr.vertices[j].y);
                    Phys2D.$.lineTo(curr.vertices[0].x, -curr.vertices[0].y);
                    Phys2D.$.stroke();
                    Phys2D.$.closePath();

                    Phys2D.$.drawCircle(curr.position.x, -curr.position.y, 5, false);
                    Phys2D.$.drawCircle(curr.position.x, -curr.position.y, curr.width, true);
                    Phys2D.$.drawCircle(curr.position.x, -curr.position.y, curr.height, true);
                    Phys2D.$.drawCircle(curr.position.x, -curr.position.y, Math.pythagoras(curr.width, curr.height), true);
                break;
            }

            Phys2D.$.restore();
            Phys2D.$.closePath();
        }
    },
    animate: function () {

    }
};
$(document).on("pageload", function () {
    Phys2D.canvas = gebi("p2d-canvas");
    Phys2D.init();
});
