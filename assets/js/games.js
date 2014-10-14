// START TWF8 CODE // 2366-2510 = 145 lines
/**
*   2048 GAME CLONE
*/
var TWF8 = {};
TWF8.moved = [];
TWF8.enabled = false;
TWF8.moveTile = function (sx, sy, dx, dy) {
    $("#twf8-pos-"+sx+sy).attr("id", "twf8-pos-"+dx+dy);
}
TWF8.checkTile = function (x, y) {
    try {if ($("#twf8-pos-"+x+y).length > 0) return parseInt($("#twf8-pos-"+x+y)
        .attr("class")
        .match(/val\-[0-9]+/)[0]
        .match(/[0-9]+/)[0]); 
    else return false;
    } catch (e) { return true; }
}
TWF8.moveTileLeft = function (sx, sy) {
    var val = parseInt($("#twf8-pos-"+sx+sy).attr('class').match(/val\-[0-9]+/)[0].match(/[0-9]+/)[0]);
    while (sy > 0 && (TWF8.checkTile(sx, sy-1) == val || !TWF8.checkTile(sx, sy-1))) {
        if (!TWF8.checkTile(sx, sy-1)) {
            TWF8.moveTile(sx,sy,sx,sy-1);
            sy--;
            TWF8.moved.push(sx,sy);
        } else if (TWF8.checkTile(sx, sy-1) == val) {
            $("#twf8-pos-"+sx+(sy-1)).remove();
            gebi("twf8-pos-"+sx+sy).className = gebi("twf8-pos-"+sx+sy).className.replace("twf8-val-"+val, "twf8-val-"+(val*2));
            TWF8.moveTile(sx, sy, sx, sy-1);
            TWF8.moved.push(sx,sy);
            return null;
        }
    }
}
TWF8.moveTileRight = function (sx, sy) {
    var val = parseInt($("#twf8-pos-"+sx+sy).attr('class').match(/val\-[0-9]+/)[0].match(/[0-9]+/)[0]);
    while (sy < 3 && (TWF8.checkTile(sx, sy+1) == val || !TWF8.checkTile(sx, sy+1))) {
        if (!TWF8.checkTile(sx, sy+1)) {
            TWF8.moveTile(sx, sy, sx, sy+1);
            sy++;
            TWF8.moved.push(sx,sy);
        } else if (TWF8.checkTile(sx, sy+1) == val) {
            $("#twf8-pos-"+sx+(sy+1)).remove();
            gebi("twf8-pos-"+sx+sy).className = gebi("twf8-pos-"+sx+sy).className.replace("twf8-val-"+val, "twf8-val-"+(val*2));
            TWF8.moveTile(sx, sy, sx, sy+1);
            TWF8.moved.push(sx,sy);
            return null;
        }
    }
}
TWF8.moveTileUp = function (sx, sy) {
    var val = parseInt($("#twf8-pos-"+sx+sy).attr('class').match(/val\-[0-9]+/)[0].match(/[0-9]+/)[0]);
    while (sx > 0 && (TWF8.checkTile(sx-1, sy) == val || !TWF8.checkTile(sx-1, sy))) {
        if (!TWF8.checkTile(sx-1, sy)) {
            TWF8.moveTile(sx, sy, sx-1, sy);
            sx--;
            TWF8.moved.push(sx,sy);
        } else if (TWF8.checkTile(sx-1, sy) == val) {
            $("#twf8-pos-"+(sx-1)+sy).remove();
            gebi("twf8-pos-"+sx+sy).className = gebi("twf8-pos-"+sx+sy).className.replace("twf8-val-"+val, "twf8-val-"+(val*2));
            TWF8.moveTile(sx, sy, sx-1, sy);
            TWF8.moved.push(sx,sy);
            return null;
        }
    }
}
TWF8.moveTileDown = function (sx, sy) {
    var val = parseInt($("#twf8-pos-"+sx+sy).attr('class').match(/val\-[0-9]+/)[0].match(/[0-9]+/)[0]);
    while (sx < 3 && (TWF8.checkTile(sx+1, sy) == val || !TWF8.checkTile(sx+1, sy))) {
        if (!TWF8.checkTile(sx+1, sy)) {
            TWF8.moveTile(sx, sy, sx+1, sy);
            sx++;
            TWF8.moved.push(sx,sy);
        } else if (TWF8.checkTile(sx+1, sy) == val) {
            $("#twf8-pos-"+(sx+1)+sy).remove();
            gebi("twf8-pos-"+sx+sy).className = gebi("twf8-pos-"+sx+sy).className.replace("twf8-val-"+val, "twf8-val-"+(val*2));
            TWF8.moveTile(sx, sy, sx+1, sy);
            TWF8.moved.push(sx,sy);
            return null;
        }
    }
}
TWF8.spawnTile = function (dx, dy, val) {
    if (isNull(dx) || isNull(dy) || isNull(val)) return TBI.error("TWF8: Tile spawning failed: Insufficient values");
    if ($("#twf8-pos-"+dx+dy).length < 1 && dx > -1 && dy > -1 && dx < 4 && dy < 4)
        $("#twf8-tiles").append("<div class='twf8-tile twf8-val-"+val+"' id='twf8-pos-"+dx+dy+"'></div>");
}
TWF8.moveAllLeft = function () {
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if ($("#twf8-pos-"+i+j).length > 0) TWF8.moveTileLeft(i, j);
}
TWF8.moveAllRight = function () {
    for (var i = 0; i < 4; i++) for (var j = 3; j >= 0; j--) if ($("#twf8-pos-"+i+j).length > 0) TWF8.moveTileRight(i, j);
}
TWF8.moveAllUp = function () {
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if ($("#twf8-pos-"+i+j).length > 0) TWF8.moveTileUp(i, j);
}
TWF8.moveAllDown = function () {
    for (var i = 3; i >= 0; i--) for (var j = 0; j < 4; j++) if ($("#twf8-pos-"+i+j).length > 0) TWF8.moveTileDown(i, j);
}
TWF8.determine = function (dir) {
    var check = function (i, j) {
        var ct = TWF8.checkTile;
        switch (dir) {
        case "left":return !ct(i, j-1) || (ct(i, j-1) == ct(i, j) && (ct(i, j)));
        case "right":return !ct(i, j+1) || (ct(i, j+1) == ct(i, j) && (ct(i, j)));
        case "up":return !ct(i-1, j) || (ct(i-1, j) == ct(i, j) && (ct(i, j)));
        case "down":return !ct(i+1, j) || (ct(i+1, j) == ct(i, j) && (ct(i, j)));
        default:return false;
    }}
    var results = [];
    var ix = dir=="up"?1:0;
    var iy = dir=="down"?3:4;
    var jx = dir=="left"?1:0;
    var jy = dir=="right"?3:4;
    for (var i = ix; i < iy; i++) for (var j = jx; j < jy; j++) if (check(i, j)) results.push([i, j]);
    return results.length > 0;
}
$(document).keyup(function (event) {
    if (!TWF8.enabled) return null;
    var key = convertKeyDown(event);
    var determined = TWF8.determine(key);
    if (key == "left" && determined) TWF8.moveAllLeft();
    else if (key == "right" && determined) TWF8.moveAllRight();
    else if (key == "up" && determined) TWF8.moveAllUp();
    else if (key == "down" && determined) TWF8.moveAllDown();
    else if (key != /(left|right|up|down)/) return null;
    if (!TWF8.determine("left") && !TWF8.determine("right") && !TWF8.determine("up") && !TWF8.determine("down")) {
        TBI.log("TWF8: Game Over!");
    }
    if (TWF8.moved.length > 0) {
        TBI.timerSet("twf8spawn", 200, function () {
            do { var randLocation = [randomInt(4), randomInt(4)]; }
            while ($("#twf8-pos-"+randLocation[0]+randLocation[1]).length > 0)
            var num = Math.random() < 0.8 ? 2 : 4;
            TWF8.spawnTile(randLocation[0], randLocation[1], num);
            TBI.timerClear("twf8spawn");
        });
    }
    TWF8.moved = [];
});
$(function () {
    $("#twf8-game").mouseenter(function () { TWF8.enabled = true; });
    $("#twf8-game").mouseleave(function () { TWF8.enabled = false; });
});
// END TWF8 CODE // 2366-2510 = 145 lines
// START QDR CODE // 2892-3141 = 249 lines
var QDR = {};
    QDR.totalTime = 0;
// Quadrominoes are based upon a 4x4 grid system. 
// The rotate() function allows for rotation of these pieces within the 4x4 grid.
// inb4 transposing ^
//  I    T    Z    S    L    RL  Box
// 1111 1110 0100 1000 1110 1110 1100
// 0000 0100 1100 1100 1000 0010 1100
// 0000 0000 1000 0100 0000 0000 0000
// 0000 0000 0000 0000 0000 0000 0000
QDR.PIECES = [
    [[true,true,true,true],[false,false,false,false],[false,false,false,false],[false,false,false,false]], // I piece
    [[true,true,true,false],[false,true,false,false],[false,false,false,false],[false,false,false,false]], // T piece
    [[false,true,false,false],[true,true,false,false],[true,false,false,false],[false,false,false,false]], // Z piece
    [[true,false,false,false],[true,true,false,false],[false,true,false,false],[false,false,false,false]], // S piece
    [[true,true,true,false],[true,false,false,false],[false,false,false,false],[false,false,false,false]], // L piece
    [[true,true,true,false],[false,false,true,false],[false,false,false,false],[false,false,false,false]], // Reverse L piece
    [[true,true,false,false],[true,true,false,false],[false,false,false,false],[false,false,false,false]]  // Box piece
];
QDR.init = function () {
    QDR.size = 24; // Size of the blocks (px).
    QDR.interval = 500; // Interval between ticks (ms).
    QDR.screen = 0; // Which screen is being displayed.
    QDR.time = new Date().getTime();
    QDR.$ = new Canvas2D("qdr-canvas");
    QDR.width = parseInt($("#qdr-canvas").css('width'));
    QDR.height = parseInt($("#qdr-canvas").css('height'));
    QDR.score = 0;
    QDR.added = 0;
    QDR.placed = -1;
    QDR.current = null;
    QDR.next = null;
    QDR.active = false;
    QDR.over = false; // Game Over or not?
    QDR.limits = [QDR.height/QDR.size, 12]; // limits = [height, width]
    QDR.board = {}; // The blocks that have already been placed.
    for (var i=0;i<QDR.limits[0];i++) {                       //
        var tempArr = {};                                     // Filling board[] with empty
        for (var j=0;j<QDR.limits[1];j++) tempArr[j] = -1;    // values, representing clear space.
        QDR.board[i] = tempArr;                               //
    }
    QDR.blockground = new Image(); // The block textures.
    QDR.blockground.src = "data:image/png;base64,\
iVBORw0KGgoAAAANSUhEUgAAAHAAAAAQCAIAAABBdmxGAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAWdEVYdFNvZnR3YXJlAHBhaW5\
0Lm5ldCA0LjA76PVpAAAAx0lEQVRYR+3YvQ3CUAxFYe9AiQQ9FQ1LpGeAdGxA6ZYhMoXn8FDk5fdFSO9e11j6JjjlEZNbiNg5xExi5BMiFvSyEOskpARVuZCWoHpiTUFVWXNQlZ60BN\
WeNQftlDUF1QdrD+pyhw5B/YpVQd2xOqjLAB2C+oDVQd+OVUH9iWVQJIMCGbQtgwIZFMmgbRm0LYMiGRTIoG0ZFMigyD8HJe1BSWtQ0haUtAclbUFJa1DSEjSkBI0ojUJ+Bl1baRQyB\
o0YGwV08gWxbsYGqFRypAAAAABJRU5ErkJggg==";
    TBI.timerClear("qdr");
    TBI.timerSet("qdr", 10, function () {
        try { QDR.loop(); }
        catch (e) { TBI.error(e) }
    });
}
QDR.loop = function () {
    QDR.$.clearRect(0,0,1000,1000);
    QDR.totalTime+=500;
    switch (QDR.screen) {
        case 0: QDR.title(); break;
        case 1: QDR.play(); break;
        case 2: QDR.end(); break;
    }
}
QDR.title = function () {
    QDR.$.beginPath();
    QDR.$.fillStyle = "#333";
    QDR.$.font = "38px Raleway";
    QDR.$.textAlign = "center";
    QDR.$.fillText("Quadrominoes", QDR.width/2, QDR.height/12);
    QDR.$.closePath();
}
QDR.checkRows = function () {
    var checked = new Array(QDR.limits[0]);
    var total = 0;
    for (var i=0;i<QDR.limits[0];i++) {
        checked[i] = true;
        for (var j=0;j<QDR.limits[1];j++) if (QDR.board[i][j] == -1) checked[i] = false
        if (checked[i]) { QDR.removeRow(i); QDR.score += 1 }
    }
    return true;
}
QDR.removeRow = function (row) {
    QDR.board[row] = new Array(QDR.limits[1]);
    for (var i=row;i>0;i--) QDR.board[i] = QDR.board[i-1];
    return true;
}
QDR.fall = function () {
    for (var i=QDR.current.y;i<QDR.limits[0];i++) if (!QDR.checkPiece(QDR.current.piece, QDR.current.x, QDR.current.y+1)) QDR.current.y+=1;
    return true;
}
QDR.move = function (direction) {
    if (direction.search(/[wasd]/) == -1 || isNull(QDR.current)) return false;
    var curr = QDR.current;
    var dim = QDR.findHW(curr.piece);
    if (direction == "a" && curr.x > 0 && !QDR.checkPiece(curr.piece, curr.x-1, curr.y)) QDR.current.x--;
    else if (direction == "d" && curr.x+1 < QDR.limits[1] && !QDR.checkPiece(curr.piece, curr.x+1, curr.y)) QDR.current.x++;
    else if (direction == "w" && !QDR.checkPiece(QDR.rotate(curr.piece, 1), curr.x, curr.y)) curr.piece = QDR.rotate(curr.piece, 1);
    else if (direction == "s") QDR.fall();
    TBI.timerClear("qdr-flash");
    gebi("qdr-controls").className = direction;
    TBI.timerSet("qdr-flash", 200, function () {
        gebi("qdr-controls").className = "";
        TBI.timerClear("qdr-flash");
    });
    return true;
}
QDR.background = function () {
    QDR.$.fillStyle = "rgba(0,0,0,0.04)";
    for (var i=0;i<QDR.limits[1];i++)
        if (Math.floor(i/3)%2==0) QDR.$.fillRect(i*QDR.size, 0, QDR.size, 1000);
    return true;
}
QDR.drawNext = function () {
    QDR.$.save();
    QDR.$.fillStyle = "rgba(0,0,0,0.2)";
    var x = QDR.width-110;
    var y = 250;
    QDR.$.fillRect(x, 0, 110, QDR.height);
    QDR.$.font = "36px Raleway";
    QDR.$.fillStyle = "#fff";
    QDR.$.fillText("Next", x+55, y);
    QDR.$.fillStyle = "rgba(255,255,255,0.3)";
    QDR.$.fillRect(x, y+=18, 110, 110);
    var px = x+8;
    var py = y+8;
    var piece = QDR.PIECES[QDR.next];
    var dim = QDR.findHW(piece);
    py += Math.abs(dim[0]-4)*12;
    px += Math.abs(dim[1]-4)*12;
    var s = 24;
    for (var i=0;i<4;i++)
        for (var j=0;j<4;j++)
            if (piece[i][j]) QDR.$.drawImage(QDR.blockground, 16*QDR.next, 0, 16, 16, px+j*s, py+i*s, s, s);
    QDR.$.fillStyle = "#fff";
    QDR.$.fillText("Score", x+55, y+=150);
    QDR.$.font = "48px bold Raleway";
    QDR.$.fillText(QDR.score, x+55, y+=50);
    QDR.$.restore();
    return true;
}
QDR.findHW = function (p) {
    for (var i=0,c=0,a=[];i<4;i++) {
        for (var j=0,t=0;j<4;j++) if (p[i][j]) t=j+1;
        if (t>0) { c++; a.push(t) }
    }
    return [c, a.sort()[a.length-1]]
}
QDR.rotate = function (piece, num) {
    var dim = QDR.findHW(piece);
    var nw = [];
    for (var i=0;i<4;i++) nw[i] = ([0,0,0,0]);
    for (var i=0;i<dim[0];i++)
        for (var j=0,k=dim[1]-1;j<dim[1];j++,k--)
            nw[j][i] = piece[i][k];
    if (!isNull(num) && num > 0) return QDR.rotate(nw, --num);
    else if (num == 0) return piece;
    else return nw;
}
QDR.drawBlock = function (index, x, y) {
    QDR.$.drawImage(QDR.blockground, 16*index, 0, 16, 16, x*QDR.size, y*QDR.size, QDR.size, QDR.size);
    return true;
}
QDR.drawPiece = function (piece, index, x, y) {
    for (var i=0;i<4;i++)
        for (var j=0;j<4;j++)
            if (piece[i][j]) QDR.drawBlock(index, i+x, j+y);
    return true;
}
QDR.boardAdd = function (piece, index, x, y) {
    debugger;
	var prevBoard = QDR.board;
    for (var i=0;i<4;i++)
        for (var j=0;j<4;j++)
            if (piece[i][j] && QDR.added++ < 4) QDR.board[j+y][i+x] = index;
	var tolerance = 0;
	for (var i=0;i<prevBoard.length;i++)
		for (var j=0;j<prevBoard[0].length;j++)
			if (prevBoard[i][j] != QDR.board[i][j] && tolerance++ >= 4) throw new Error("Tower blocks created");
    TBI.log("Placed one more piece: #"+ ++QDR.placed);
}
QDR.play = function () {
    QDR.background();
    var time = new Date().getTime();
    var step = Math.floor(time/QDR.interval) != Math.floor(QDR.time/QDR.interval);
    if (step) QDR.time = time;
    if (!QDR.active) step = false;
    if (!QDR.over) {
        if (isNull(QDR.next)) QDR.next = randomInt(QDR.PIECES.length);
        if (isNull(QDR.current)) {
            QDR.checkRows();
            var curr = QDR.next;
            QDR.next = randomInt(QDR.PIECES.length);
            var dim = QDR.findHW(QDR.PIECES[curr]);
            QDR.current = {piece:QDR.PIECES[curr],index:curr,x:Math.floor(QDR.limits[1]/2)-Math.ceil(dim[0]/2),y:0};
            var current = QDR.current;
            if (QDR.checkPiece(current.piece, current.x, current.y)) QDR.over = true;
            QDR.added = 0;
        }
        var current = QDR.current;
        if (!step || !QDR.checkPiece(current.piece, current.x, current.y+1))
            QDR.drawPiece(current.piece, current.index, current.x, current.y+=step?1:0);
        else if (step) {
            QDR.boardAdd(current.piece, current.index, current.x, current.y);
            QDR.current = null;
        }
        QDR.drawNext();
    }
    for (var i=0;i<QDR.limits[0];i++) 
        for (var j=0;j<QDR.limits[1];j++)
            if (QDR.board[i][j] != -1) QDR.drawBlock(QDR.board[i][j], j, i);
    if (QDR.over) {
        $("#qdr-overlay").show();
        $("#qdr-score").html(QDR.score);
    } else if (!QDR.active) {
        $("#qdr-pause").show();
    } else { 
        $("#qdr-pause").hide();
        $("#qdr-overlay").hide();
    }
}
QDR.end = function () {
    $("#qdr-pause").hide();
    $("#qdr-side").hide();
    $("#qdr-overlay").hide();
    $("#qdr-title").show();
    QDR.screen = 0;
    QDR.init();
}
QDR.checkBlock = function (x, y) { 
    if (x >= QDR.limits[1] || y >= QDR.limits[0] || x < 0 || y < 0) return true
    else return QDR.board[y][x] != -1;
}
QDR.checkPiece = function (piece, x, y) {
    for (var i=0;i<4;i++)
        for (var j=0;j<4;j++)
            if (piece[i][j] && (x+i >= QDR.limits[1] || y+j >= QDR.limits[0] || x+i < 0 || y+j < 0 || QDR.checkBlock(x+i, y+j))) return true
    return false
}
$(document).on("pageload", function () {
    QDR.init();
    $("#qdr-start").click(function (event) {
        $("#qdr-title").hide();
        $("#qdr-side").show();
        QDR.screen = 1;
    });
    $(document).keydown(function (event) {
        if (!QDR.active) return null;
        QDR.move(convertKeyDown(event));
    });
    $("#qdr-game").mouseenter(function () { QDR.active = true });
    $("#qdr-game").mousemove(function () { QDR.active = true });
    $("#qdr-game").mouseleave(function () { QDR.active = false });
    $("#qdr-retry").click(function () { QDR.screen = 2 });
});
// END QDR CODE // 2892-3141 = 249 lines
var PipeG = {
    pipeDefs: {
        PLUS_JUNCTION: 0,
        T_JUNCTION: 1,
        STRAIGHT: 2,
        BUTT: 3,
        CORNER: 4
    },
    tileWidth: 64,
    levels: [
        {
            grid:
                [[[4,2],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[4,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[2,1],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[ , ],[2,1]]
                ,[[4,3],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,0],[4,0]]],
            start: new Coords(0,0),
            end: new Coords(8,8)
        }
    ]
};
PipeG.setup = function (id) {
    PipeG.id = id;
    PipeG.canvas = gebi(id);
    PipeG.$ = new Canvas2D(id);
    PipeG.width = PipeG.canvas.width;
    PipeG.height = PipeG.canvas.height;
    PipeG.tiles = new Array.dimensional(
        [PipeG.width/PipeG.tileWidth, PipeG.height/PipeG.tileWidth].reverse(), 
        [null,null,false]);
    PipeG.pipeImage = new Image();
    PipeG.pipeImage.src = "/assets/res/sheet/pipes.png";
    PipeG.pipeOffImage = new Image();
    PipeG.pipeOffImage.src = "/assets/res/sheet/pipesoff.png";
}
PipeG.init = function () {
    PipeG.readLevel(PipeG.levels[0]);
    TBI.timerSet("pipeg", 50, function () {
        PipeG.loop();
    });
}
PipeG.readLevel = function (level) {
    for (var i=0;i<level.grid.length;i++) {
        for (var j=0;j<level.grid[i].length;j++) {
            var item = level.grid[i][j];
            PipeG.addPipe(item[0], item[1], i, j, false);
        }
    }
    if (PipeG.checkPipe(level.start.x, level.start.y)) {
        var item = PipeG.tiles[level.start.x][level.start.y];
        PipeG.addPipe(item[0], item[1], level.start.x, level.start.y, true);
    }
}
PipeG.drawPipe = function (pipe, rotation, x, y, on) {
    var tw = PipeG.tileWidth;
    PipeG.$.save();
    PipeG.$.drawImage(on?PipeG.pipeImage:PipeG.pipeOffImage, 64*pipe, 64*rotation, 64, 64, x, y, tw, tw);
    PipeG.$.restore();
}
PipeG.checkPipe = function (x, y) {
    return !isNull(PipeG.tiles[x][y][0]);
}
PipeG.addPipe = function (pipe, rotation, x, y, on) {
    PipeG.tiles[x][y] = [pipe,rotation,on];
}
PipeG.loop = function () {
    PipeG.$.clearRect(0,0,PipeG.width,PipeG.height);
    var tw = PipeG.tileWidth;
    for (var i=0;i<PipeG.tiles.length;i++) {
        for (var j=0;j<PipeG.tiles[i].length;j++) {
            var curr = PipeG.tiles[i][j];
            if (!isNull(curr[0])) PipeG.drawPipe(curr[0], curr[1], i*tw, j*tw, curr[2]);
        }
    }
}
$(document).on("pageload", function () {
    PipeG.setup("pipeg-canvas");
    PipeG.init();
});
var MPoly = {
    defaults: {
        width: 9,
        height: 9,
        file: "/assets/data/mpoly_default.json"
    },
    file: {},
    board: {
        top: [],
        bottom: [],
        left: [],
        right: [],
        width: 0,
        height: 0,
        corners: new Array(4)
    },
    state: {
        pixelWidth: 600,
        pixelHeight: 600,
        offset: new Coords(0, 0),
        rotation: 0
    },
    images: {},
    width: 0,
    height: 0,
    settings: {
        boardWidth: 0.14,
        headerWidth: 0.3,
        namePosition: 0.12,
        pricePosition: 0.9,
        scaleModifier: 1
    },
    getCanvas: function (id) {
        MPoly.canvas = gebi(id);
        MPoly.$ = new Canvas2D(id);
        MPoly.width = MPoly.canvas.width;
        MPoly.height = MPoly.canvas.height;
        MPoly.state.pixelWidth = MPoly.canvas.width*MPoly.settings.scaleModifier;
        MPoly.state.pixelHeight = MPoly.canvas.height*MPoly.settings.scaleModifier;
        return !isNull(MPoly.canvas);
    },
    getBoard: function (url, callback) {
        new TBI.AJAX(url, function (xhr) {
            MPoly.file = $.parseJSON(xhr.response);
            MPoly.rules = MPoly.file.rules;
            MPoly.resources = MPoly.file.resources;
            MPoly.board = MPoly.file.board;
            callback();
        });
    },
    getImages: function (imgList, callback) {
        var totalImages = 0, timer = 0;
        for (var collection in imgList) if (imgList.hasOwnProperty(collection)) {
            if (imgList[collection] instanceof Array) {
                var arr = imgList[collection],
                    imageArr = new Array(arr.length);
                for (var i=0;i<arr.length;i++,totalImages++) {
                    var imageElement = document.createElement("img");
                    imageElement.src = arr[i];
                    imageElement.onload = function () { totalImages--; };
                    imageArr[i] = imageElement;
                }
                MPoly.images[collection] = imageArr;
            } else if (typeof(imgList[collection]) == "string") {
                totalImages++;
                var imageElement = document.createElement("img");
                imageElement.src = imgList[collection];
                imageElement.onload = function () { totalImages--; };
                MPoly.images[collection] = imageElement;
            }
        }
        TBI.timerSet("mpoly-imageload", 10, function () {
            if (totalImages < 1 || timer > 10000) {
                TBI.timerClear("mpoly-imageload");
                callback();
            } else timer += 10;
        });
    },
    preInit: function (id, callback) {
        if (MPoly.getCanvas(id)) {
            MPoly.getBoard(MPoly.defaults.file, function () {
                MPoly.getImages({
                    "corners": MPoly.resources.corners
                }, callback);
            });
        }
    },
    init: function (id) {
        MPoly.preInit(id, MPoly.loop);
    },
    loop: function () {
        MPoly.drawBoard();
    },
    generate: function (board) {
        MPoly.board.top = board.board.top;
        MPoly.board.width = board.board.width;
        MPoly.board.height = board.board.height;
    },
    drawBoard: function () {
        var w = MPoly.state.pixelWidth,
            h = MPoly.state.pixelHeight,
            o = MPoly.state.offset,
            bw = h*MPoly.settings.boardWidth,
            c = new Coords(w/2, h/2), // center
            sw = MPoly.board.width, // side width
            sh = MPoly.board.height, // side height
            aw = w-bw-bw, // adjusted width
            ah = h-bw-bw, // adjusted height
            hw = bw*MPoly.settings.headerWidth,
            np = MPoly.settings.namePosition,
            pp = bw*MPoly.settings.pricePosition,
            ci = MPoly.images.corners,
            pn = function (text, x, y, rot, wid) { // place name
                var nameCont = document.createElement("div"),
                    name = document.createElement("div");
                nameCont.className = "mpoly-name-container";
                name.className = "mpoly-name";
                $(name).css("width", wid+"px");
                $(name).css("left", x+"px");
                $(name).css("top", y+"px");
                $(nameCont).css("transform", "rotate("+rot+"deg)");
                $(name).text(text);
                nameCont.appendChild(name);
                gebi("mpoly-board").appendChild(nameCont);
            },
            ds = function (rot, side) { // draw side
                // offset
                MPoly.$.translate(o.x, o.y);
                
                // rotate
                MPoly.$.translate(c.x, c.y);
                MPoly.$.rotate(dtr(rot));
                MPoly.$.translate(-c.x, -c.y);
                
                // tiles
                MPoly.$.fillStyle = "#333";
                MPoly.$.fillRect(bw, h-bw, aw, bw);
                for (var x=bw,y=h-bw,t=aw/sw,i=sw-1;i>=0;x+=t,i--) {
                    var tile = isNull(side) ? {} : side[i];
                    // background
                    MPoly.$.fillStyle = "#ccc";
                    MPoly.$.fillRect(x, y, t, bw);
                    
                    // header
                    if (!isNull(tile.colour)) MPoly.$.fillStyle = tile.colour;
                    MPoly.$.fillRect(x, y, t, hw);
                    
                    // name
                    var tw = (isNull(tile.colour) ? bw : bw-hw) * np;
                    pn(isNull(tile.name) ? "" : tile.name, x, y+(isNull(tile.colour)?0:hw)+tw, rot, t);
                    
                    // price
                    MPoly.$.fillStyle = "#000";
                    if (!isNull(tile.price)) MPoly.$.fillText(MPoly.resources.currency+tile.price, (x+x+t)/2, y+pp);
                }
                
                // reset rotate
                MPoly.$.translate(c.x, c.y);
                MPoly.$.rotate(dtr(-rot));
                MPoly.$.translate(-c.x, -c.y);
                
                // reset offset
                MPoly.$.translate(-o.x, -o.y);
            };
        
        // Reset and reference backing
        MPoly.$.clearRect(0, 0, MPoly.width, MPoly.height);
        MPoly.$.fillStyle = "#aaa";
        MPoly.$.fillRect(o.x, o.y, w, h);
        MPoly.$.textAlign = "center";
        MPoly.$.font = "12px Raleway";
        $("#mpoly-board").empty();
        
        // Side tiles
        ds(0, MPoly.board.bottom);
        ds(90, MPoly.board.left);
        ds(-90, MPoly.board.right);
        ds(180, MPoly.board.top);
        
        // Corners
        if (ci.length && ci.length == 4) {
            // drawImage(DOMImage, sx, sy, sw, sh, dx, dy, dw, dh)
            MPoly.$.drawImage(ci[0], 0, 0, 128, 128, o.x, o.y, bw, bw);
            MPoly.$.drawImage(ci[1], 0, 0, 128, 128, o.x+w-bw, o.y, bw, bw);
            MPoly.$.drawImage(ci[2], 0, 0, 128, 128, o.x, o.y+h-bw, bw, bw);
            MPoly.$.drawImage(ci[3], 0, 0, 128, 128, o.x+w-bw, o.y+h-bw, bw, bw);
        }
    }
};
MPoly.property = function (colour, name, price, type, rents) {
    this.colour = colour;
    this.name = name;
    this.price = price;
    this.type = type;
    this.rents = rents;
}
$(document).on("pageload", function () {
    MPoly.init("mpoly-canvas");
    $("#mpoly-rotation").on("input", function () {
        MPoly.state.rotation = $("#mpoly-rotation").val();
        MPoly.drawBoard();
    });
    $("#mpoly-scale").on("input", function () {
        MPoly.state.widthModifier = $("#mpoly-scale").val();
        MPoly.state.heightModifier = $("#mpoly-scale").val();
        MPoly.drawBoard();
    });
});