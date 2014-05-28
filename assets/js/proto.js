// START GRID CODE // 1-673 = 673 lines // LAST UPDATED: 2014-05-25 22:07 +08:00
/**
*   GRID JAVASCRIPT PROTOTYPE
*/
var Grid = {};
Grid.count = 0;
Grid.colcount = 0;
Grid.hasSet = false;
Grid.width = $(".grid").css("width");
Grid.height = this.width;
Grid.cell = 0;
Grid.heightQuant = 0;
Grid.clicked = false;
Grid.middleRow = [];
Grid.rows = [];
Grid.columns = [];
Grid.layerCount = 0;
Grid.layers = [];
Grid.keepAlive = false;

Grid.Draw = {};
Grid.Draw.canDraw = false;
Grid.Draw.colour = "yellow";
Grid.Draw.interval = 0;
Grid.Draw.tool = "brush";
Grid.Draw.diameter = 3;
Grid.Draw.prevDiam = 3;
Grid.Draw.prevColours = [];

Grid.Animation = {};
Grid.Animation.Routine = {};
Grid.Modify = {};
Grid.Border = {};
Grid.Mouse = {};
Grid.Layer = {};
Grid.Clear = {};
Grid.Clear.Border = {};
Grid.Status = {};
// Creates a new grid of square div elements with different ids.
// Function assumes grid is a square, as well as all grid cells
Grid.set = function (height) {
    if (!this.hasSet && height >= 1) {
        var padding = 0;
        this.cell = height;
        var grid = $(".grid");
        this.heightQuant = Math.floor(parseInt(grid.css("width")) / height);
        var heightFinal = Math.floor(this.heightQuant + (padding * this.heightQuant - 1));
        var k = -1;
        for (i = 0; i <= heightFinal; i++) {
            var newText = "";
            for (j = 0; j <= heightFinal; j++) {
                newText += "<div id='gridcell"+this.count+"' class='gridcell' style='width:" + height + "px;height:" + height + "px;'></div>";
                this.count++;
            }
            grid.append("<div class='gridcol' id='gridcol" + this.colcount + "'style='width:" + height + "px;'>" + newText + "</div>");
            this.colcount++;
        }
        this.hasSet = true;
        this.Status.print("> Created a " + this.heightQuant + " x " + this.heightQuant + " grid with " + this.count + " cells.");
        this.setProperties();
        return this.count;
    }
};
// Colours cells alternately through cell indexes.
Grid.altColours = function (colour1, colour2) {
    if (this.hasSet) {
        for (i = 0; i < this.count; i++) {
            if (isEven(i)) {
                $("#gridcell" + i).css("backgroundColor", colour1);
            }
            else {
                $("#gridcell" + i).css("backgroundColor", colour2);
            }
        }
    }
};
// Sets width, height, rows and columns all at once.
// Called when grid is created.
Grid.setProperties = function () {
    if (!isEven(Grid.heightQuant)) {
        Grid.center = Math.floor(Grid.count / 2);
    }
    for (i = 0; i < Grid.colcount; i++) {
        if (Grid.colcount / 2 % 1 != 0) {
            Grid.middleRow.push(Grid.rows[Grid.colcount/2]);
        }
        else {
            Grid.middleRow.push(Math.floor((Grid.colcount / 2) + (Grid.colcount * i)).toString());
            Grid.middleRow.push(Math.floor((Grid.colcount / 2) + (Grid.colcount * i) - 1).toString());
        }
    }
    for (x = 0; x < Grid.colcount; x++) {
        var tempRow = [];
        for (j = 0; j < Grid.colcount; j++) {
            tempRow.push(j * Grid.colcount + x);
        }
        Grid.rows.push(tempRow);
    }
    for (x = 0; x < Grid.colcount; x++) {
        var tempCol = [];
        for (j = 0; j < Grid.colcount; j++) {
            tempCol.push(x * Grid.colcount + j);
        }
        Grid.columns.push(tempCol);
    }
    this.width = parseInt($(".grid").css("width"));
    this.height = parseInt(this.width);
    $("#cellx").text(Grid.cell);
    $("#celly").text(Grid.cell);
    $("#gridx").text(Grid.width);
    $("#gridy").text(Grid.height);
    $("#clxcount").text(Grid.colcount);
    $("#clycount").text(Grid.colcount);
    $("#clcount").text(Grid.count);
    $("#cellstats").css("display", "inline-block");
};
// Returns coordinates.
Grid.coords = function (column, row) {
    if (Grid.columns[column] == undefined) {
        return null;
    }
    return Grid.columns[column][row];
}   
// Modifies entire middle row(s).
Grid.Modify.middleRow = function (colour1) {
    for (i = 0; i < Grid.middleRow.length; i++) {
        $("#gridcell" + Grid.middleRow[i]).css("backgroundColor", colour1);
    }
    Grid.Status.print("> Coloured the middle row the colour " + colour1);
}
// Changes the colour of a single cell.
Grid.Modify.single = function (cell, colour1) {
    var cell = $("#gridcell" + cell);
    cell.css("backgroundColor", colour1);
}
// Changes the colour of a column.
Grid.Modify.column = function (column, colour1) {
    for (i = 0; i < Grid.columns[column].length; i++) {
        Grid.Modify.single(Grid.columns[column][i],colour1);
    }
}
// Changes the colour of a row.
Grid.Modify.row = function (row, colour1) {
    for (i = 0; i < Grid.rows[row].length; i++) {
        Grid.Modify.single(Grid.rows[row][i],colour1);
    }
}
// Changes a part of a column.
Grid.Modify.colseg = function (column, start, end, colour1) {
    for (i = Grid.columns[column][start]; i <= Grid.columns[column][end]; i++) {
        Grid.Modify.single(i, colour1);
    }
}
// Changes a part of a row.
Grid.Modify.rowseg = function (row, start, end, colour1) {
    for (i = Grid.rows[row][start]; i <= Grid.rows[row][end]; i += Grid.colcount) {
        Grid.Modify.single(i, colour1);
    }
}
// Creates a rectangle at specific coordinates.
Grid.Modify.rect = function (startX, startY, endX, endY, colour1) {
    var width = endX - startX;
    var height = endY - startY;
    var start = Grid.coords(startX, startY);
    var end = Grid.coords(endX, endY);
    for (i = 0; i <= width; i++) {
        for (j = 0; j <= height; j++) {
            Grid.Modify.single(Grid.coords(startX + i, startY + j),colour1);
        }
    }
}
// Changes the colour of all cells.
Grid.Modify.all = function (colour1) {
    for (i = 0; i < Grid.count; i++) {
        Grid.Modify.single(i, colour1);
    }
}
// Creates an alternating colour scale around the top and left sides.
Grid.Modify.scale = function (colour1, colour2) {
    for (i = 0; i < Grid.colcount; i++) {
        if (isEven(i)) {
            Grid.Modify.single(Grid.rows[0][i], colour1);
        }
        else {
            Grid.Modify.single(Grid.rows[0][i], colour2);
        }
    }
    for (i = 0; i < Grid.colcount; i++) {
        if (isEven(i)) {
            Grid.Modify.single(Grid.columns[0][i], colour1);
        }
        else {
            Grid.Modify.single(Grid.columns[0][i], colour2);
        }
    }
    Grid.Status.print("> Created a scale with the colours " + colour1 + " and " + colour2 + ".");
}
// Changes the border value for a single cell
Grid.Border.single = function (cell, border, colour) {
    var cellloc = $("#gridcell" + cell);
    cellloc.css("width", Grid.cell - border * 2);
    cellloc.css("height", Grid.cell - border * 2);
    cellloc.css("border", border + "px solid " + colour);
}
// Changes all border values
Grid.Border.all = function (border, colour) {
    for (i = 0; i < Grid.count; i++) {
        Grid.Border.single(i, border, colour);
    }
}
// Returns the position of the cursor (unused).
Grid.Mouse.getPos = function () {
    $(".grid").click(function (event) {
        var topOffset = $(".grid").offset().top;
        var leftOffset = $(".grid").offset().left;
        var coords = [event.pageX, event.pageY];
        var adjust = [coords[0] - leftOffset, coords[1] - topOffset];
        var relative = [Math.floor(adjust[0] / Grid.cell), Math.floor(adjust[1] / Grid.cell)];
        if (Grid.columns[relative[0]]) { var index = Grid.columns[relative[0]][relative[1]]; }
        return index;
    });
}

// Animation routine: Top left to Bottom Right.
Grid.Animation.Routine.tL_to_bR = function (timeOut, colour) {
    var i = 0;
    var interval = setInterval(function () {
        if (i < Grid.colcount) {
            Grid.Modify.rect(0, 0, i, i, colour);
            Grid.Clear.rect(0, 0, i - 1, i - 1);
            i++;
        }
        else {
            Grid.Clear.cells();
            clearInterval(interval);
        }
    }, timeOut);
};
// Animates a single column going down.
Grid.Animation.column = function (column, timeOut, colour) {
    var i = 0;
    var interval = setInterval(function () {
        if (i < Grid.colcount) {
            Grid.Modify.single(Grid.columns[column][i], colour);
            Grid.Clear.single(Grid.columns[column][i - 1]);
            i++;
        }
        else {
            Grid.Clear.single(Grid.columns[column][i - 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a single row going right.
Grid.Animation.row = function (row, timeOut, colour) {
    var i = 0;
    var interval = setInterval(function () {
        if (i < Grid.colcount) {
            Grid.Modify.single(Grid.rows[row][i], colour);
            Grid.Clear.single(Grid.rows[row][i - 1]);
            i++;
        }
        else {
            Grid.Clear.single(Grid.rows[row][i - 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a single row going left.
Grid.Animation.rowReverse = function (row, timeOut, colour) {
    var i = Grid.colcount - 1;
    var interval = setInterval(function () {
        if (i >= 0) {
            Grid.Modify.single(Grid.rows[row][i], colour);
            Grid.Clear.single(Grid.rows[row][i + 1]);
            i--;
        }
        else {
            Grid.Clear.single(Grid.rows[row][i + 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a single column going up.
Grid.Animation.columnReverse = function (column, timeOut, colour) {
    var i = Grid.colcount - 1;
    var interval = setInterval(function () {
        if (i >= 0) {
            Grid.Modify.single(Grid.columns[column][i], colour);
            Grid.Clear.single(Grid.columns[column][i + 1]);
            i--;
        }
        else {
            Grid.Clear.single(Grid.columns[column][i + 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a part of a row going right.
Grid.Animation.rowSeg = function (row, start, end, timeOut, colour) {
    var i = start;
    var interval = setInterval(function () {
        if (i < end + 1) {
            Grid.Modify.single(Grid.rows[row][i], colour);
            Grid.Clear.single(Grid.rows[row][i - 1]);
            i++;
        }
        else {
            Grid.Clear.single(Grid.rows[row][i - 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a part of a column going down.
Grid.Animation.colSeg = function (column, start, end, timeOut, colour) {
    var i = start;
    var interval = setInterval(function () {
        if (i < end + 1) {
            Grid.Modify.single(Grid.columns[column][i], colour);
            Grid.Clear.single(Grid.columns[column][i - 1]);
            i++;
        }
        else {
            Grid.Clear.single(Grid.columns[column][i - 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a part of a row going left.
Grid.Animation.rowSegReverse = function (row, start, end, timeOut, colour) {
    var i = start;
    var interval = setInterval(function () {
        if (i >= end) {
            Grid.Modify.single(Grid.rows[row][i], colour);
            Grid.Clear.single(Grid.rows[row][i + 1]);
            i--;
        }
        else {
            Grid.Clear.single(Grid.rows[row][i + 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Animates a part of a column going up.
Grid.Animation.colSegReverse = function (column, start, end, timeOut, colour) {
    var i = start;
    var interval = setInterval(function () {
        if (i >= end) {
            Grid.Modify.single(Grid.columns[column][i]);
            Grid.Clear.single(Grid.columns[column][i + 1]);
            i--;
        }
        else {
            Grid.Clear.single(Grid.columns[column][i + 1]);
            clearInterval(interval);
        }
    }, timeOut);
}
// Creates a new layer at the index.
Grid.Layer.new = function (num) {
    var tempLayer = [];
    for (i = 0; i < Grid.count; i++) {
        var tempCell = [];
        if ($("#gridcell" + i).css("backgroundColor") != "rgba(0, 0, 0, 0)")
            tempCell.push($("#gridcell" + i).css("backgroundColor"));
        else
            tempCell.push(null);
        if ($("#gridcell" + i).css("border") != ("0px none rgb(0, 0, 0)" || "0px solid rgb(0, 0, 0)"))
            tempCell.push($("#gridcell" + i).css("border"));
        else
            tempCell.push(null);
        tempLayer.push(tempCell);
    }
    if (Grid.layers[num] == undefined || Grid.layers[num] == null)
        Grid.layerCount++;
    Grid.layers.splice(num, 0, tempLayer);
}
// Displays the specified layer over current layer
Grid.Layer.read = function (num) {
    for (i = 0; i < Grid.count; i++) {
        if (Grid.layers[num][i][0] != null) {
            $("#gridcell" + i).css("backgroundColor", Grid.layers[num][i][0]);
        }
        if (Grid.layers[num][i][1] != null) {
            $("#gridcell" + i).css("border", Grid.layers[num][i][1]);
        }
    }
}
// Returns the string value of a layer.
Grid.Layer.export = function (num) {
    return Grid.layers[num].toString();
}
// Creates a new layer at a specified index based on a string value.
Grid.Layer.import = function (num, array) {
    var tempLayer = [];
    for (i = 0; i < array.length; i++) {
        var tempCell = [];
        if (array[i][0] != null)
            tempCell.push(array[i][0]);
        else
            tempCell.push(null);
        if (array[i][1] != null)
            tempCell.push(array[i][1]);
        else
            tempCell.push(null);
        tempLayer.push(tempCell);
    }
    Grid.layers.splice(num, 0, tempLayer);
}
// Displays all layers on top of each other in ascending numerical order.
Grid.Layer.keepAlive = function (timeOut) {
    if (timeOut == undefined)
        timeOut = 100;
    var i = 0;
    if (!Grid.keepAlive) {
        Grid.keepAlive = true;
    }
    else {
        Grid.keepAlive = false;
    }
    if (Grid.keepAlive) {    
        var interval = setInterval(function () {
        while (Grid.layers[i] == undefined && i < Grid.layers.length) {
            i++;
        }
        if (i < Grid.layers.length) {
            Grid.Layer.read(i);
            i++;
        }
    }, timeOut);}
}
// Modifies a single point based on mouse position.
// Called automatically on mousedown event.
Grid.Draw.pencil = function (pageX, pageY) {
    if (pageX == undefined) {
        Grid.Mouse.getPos();
    }
    else {
        var topOffset = $(".grid").offset().top;
        var leftOffset = $(".grid").offset().left;
        var coords = [pageX, pageY];
        var adjust = [coords[0] - leftOffset, coords[1] - topOffset];
        var relative = [Math.floor(adjust[0] / Grid.cell), Math.floor(adjust[1] / Grid.cell)];
        if (Grid.columns[relative[0]]) { var index = Grid.columns[relative[0]][relative[1]]; }
        Grid.Modify.single(index, Grid.Draw.colour);
    }
}
// Modifies a square based on a specified diameter and mouse position.
// Called when specified on mousedown event.
Grid.Draw.brush = function (pageX, pageY, diameter) {
    var topOffset = $(".grid").offset().top;
    var leftOffset = $(".grid").offset().left;
    var coords = [pageX, pageY];
    var adjust = [coords[0] - leftOffset, coords[1] - topOffset];
    if (adjust[0] - radius < 0 || adjust[0] + radius > Grid.colcount || adjust[1] - radius < 0 || adjust[1] + radius > Grid.colcount) {
        return 0;
    }
    else {
        var relative = [Math.floor(adjust[0]/ Grid.cell), Math.floor(adjust[1] / Grid.cell)];
        if (Grid.columns[relative[0]]) { var index = Grid.columns[relative[0]][relative[1]]; }
        var radius = Math.floor(diameter / 2);
        if (!isEven(diameter)) {
            Grid.Modify.rect(relative[0] - radius, relative[1] - radius, relative[0] + (radius), relative[1] + (radius), Grid.Draw.colour);
        }
        else {
            Grid.Modify.rect(relative[0]-(radius-1), relative[1]-(radius-1), relative[0]+(radius), relative[1] + (radius), Grid.Draw.colour);
        }
    }
}
Grid.Draw.inspect = function (x, y) {
    var topOffset = $(".grid").offset().top;
    var leftOffset = $(".grid").offset().left;
    var adjust = [x - leftOffset, y - topOffset];
    var relative = [Math.floor(adjust[0]/ Grid.cell), Math.floor(adjust[1] / Grid.cell)];
    var index = Grid.coords(relative[0], relative[1]);
    if (index != undefined || index != null) {
        var colour = $("#gridcell"+index).css("backgroundColor");
        new TBI.Popup(x+20,y+20,"Index: "+index,"Colour: "+colour)
    }
}
Grid.Draw.updatePrevColours = function () {
    var divs = [$("#gdrc0"),$("#gdrc1"),$("#gdrc2"),$("#gdrc3")];
    var pColours = Grid.Draw.prevColours;
    var len = pColours.length;
    setTimeout(function () {
        if (len < 1) { return 0; }
        if (len == 5) { Grid.Draw.prevColours.shift(1); len = 4; pColours = Grid.Draw.prevColours; }
        if (len >= 1) { divs[3].css("background", pColours[len - 1]); divs[3].attr("title", pColours[len - 1]) }
        if (len >= 2) { divs[2].css("background", pColours[len - 2]); divs[2].attr("title", pColours[len - 2]) }
        if (len >= 3) { divs[1].css("background", pColours[len - 3]); divs[1].attr("title", pColours[len - 3]) }
        if (len >= 4) { divs[0].css("background", pColours[len - 4]); divs[0].attr("title", pColours[len - 4]) }
    }, 100);
    $(".gdrawrc").off();
    $(".gdrawrc").click(function () {
        if (Grid.Draw.prevColours.indexOf(Grid.Draw.colour) == -1 &&(Grid.Draw.colour != "transparent"||Grid.Draw.colour != "rgba(0,0,0,0)"))
            Grid.Draw.prevColours.push(Grid.Draw.colour);
        Grid.Draw.colour = $(this).attr("title");
        $("#gdrawcolour").val(Grid.Draw.colour);
        Grid.Draw.updatePrevColours();
    });
}
// Erases all cells.
Grid.Clear.stage = function () {
    $(".grid").empty();
    Grid.count = 0;
    Grid.colcount = 0;
    if (Grid.hasSet)
        Grid.Status.print("> Cleared the grid.");
    Grid.hasSet = false;
    Grid.columns = [];
    Grid.rows = [];
    $("#cellstats").css("display", "none");
}
// Clears all cell colours.
Grid.Clear.cells = function () {
    for (i = 0; i < Grid.count; i++) {
        Grid.Modify.single(i, "");
    }
}
// Clears the status window.
// Now unused.
Grid.Clear.status = function () {
    $("#dbuggrid").val("");
}
// Clears a single cell.
Grid.Clear.single = function (cell) {
    Grid.Modify.single(cell, "");
}
// Clears an entire column.
Grid.Clear.column = function (column) {
    for (i = 0; i < Grid.columns[column].length; i++) {
        Grid.Clear.single(Grid.columns[column][i]);
    }
}
// Clears an entire row.
Grid.Clear.row = function (row) {
    for (i = 0; i < Grid.rows[row].length; i++) {
        Grid.Clear.single(Grid.rows[row][i]);
    }
}
// Clears a rectangular area of cells, similar to Grid.Modify.rect().
Grid.Clear.rect = function (startX, startY, endX, endY) {
    if (startX < 0 || startY < 0 || endX < 0 || endY < 0)
        return 0;
    var width = endX - startX;
    var height = endY - startY;
    var start = Grid.coords(startX, startY);
    var end = Grid.coords(endX, endY);
    for (i = 0; i <= width; i++) {
        for (j = 0; j <= height; j++) {
            Grid.Clear.single(Grid.coords(startX + i, startY + j));
        }
    }
}
// Clears a stored grid layer.
Grid.Clear.layer = function (num) {
    for (i = 0; i < Grid.layers[num].length; i++) {
        for (j = 0; j < Grid.layers[num][i].length; j++) {
            Grid.layers[num][i][j] = null;
        }
    }
}
// Clears all stored layers.
Grid.Clear.layers = function () {
    for (i = 0; i < Grid.layers.length; i++) {
        Grid.Clear.layer(i);
    }
}
// Clears the border value of a single cell.
Grid.Clear.Border.single = function (cell) {
    var cellloc = $("#gridcell" + cell);
    cellloc.css("width", Grid.cell);
    cellloc.css("height", Grid.cell);
    cellloc.css("border", "0px solid #fff");
}
// Resets border values.
Grid.Clear.Border.all = function () {
    Grid.Border.all(0, "black");
}
// Debug status window print function.
// Now unused.
Grid.Status.print = function (message) {
    var box = $("#dbuggrid");
    box.val(box.val() + message + "\n");
}
$(function () {
    $("#gridset").click(function () {
        var num = Grid.width/$("#gridsetnum").val();
        if (num == undefined || num.toString() == "") {
            num = 50;
        }
        if (num < 10) {
            if (confirm("Are you sure? If the grid is particularly large, any operations carried out may be dangerous.")) {
                if (Grid.hasSet) Grid.Clear.stage();
                Grid.set(num);
            }
            else return 0;
        }
        else {
            if (Grid.hasSet) Grid.Clear.stage();
            Grid.set(num);
        }
    });
    TBI.timerSet("gsn", 50, function () {
        $("#gsnxt").html($("#gridsetnum").val());
        $("#gcurrcolour").css("background", Grid.Draw.colour);
    });
    Grid.width = parseInt($(".grid").css("width"));
    Grid.height = parseInt(Grid.width);
    $("#gridx").text(Grid.width);
    $("#gridy").text(Grid.height);
    $("#gridaltcolourset").click(function () {
        var colour1 = $("#gdaltcl1").val().toString();
        var colour2 = $("#gdaltcl2").val().toString();
        if (colour1 == "") {
            if (colour2 == "") {
                return 0;
            }
            else {
                colour2 = colour1;
            }
        }
        else if (colour2 == "") {
            colour2 = colour1;
        }
        Grid.altColours(colour1, colour2);
    });
    $(".grid").mousedown(function (event) {
        Grid.Draw.canDraw = true;
    });
    $(".grid").mouseup(function () {
        Grid.Draw.canDraw = false;
        clearInterval(Grid.Draw.interval);
    });
    $(".grid").mousemove(function (event) {
        if (Grid.Draw.canDraw && Grid.hasSet) {
            Grid.Draw.brush(event.pageX, event.pageY, Grid.Draw.diameter);
        }
        else if (Grid.hasSet && Grid.Draw.tool == "inspect") {
            Grid.Draw.inspect(event.pageX, event.pageY);
        }
    });
    $("#gclearcells").click(function () { Grid.Clear.cells() });
    $("#gcleargrid").click(function () { Grid.Clear.stage() });
    $("#gdrawpencil").click(function () { 
        Grid.Draw.prevDiam = Grid.Draw.diameter; 
        Grid.Draw.diameter = 1; 
        $("#gdrawdiam").val("1");
        Grid.Draw.tool = "";
    });
    $("#gdrawbrush").click(function () { 
        Grid.Draw.diameter = Grid.Draw.prevDiam; 
        $("#gdrawdiam").val(Grid.Draw.prevDiam); 
        Grid.Draw.tool = "";
    });
    $("#gdrawerase").click(function () { Grid.Draw.colour = "transparent"; Grid.Draw.tool = ""; });
    $("#gdrawinspc").click(function () { Grid.Draw.tool = "inspect" });
    $("#gdrawdiam").mouseleave(function () {
        if (!isNaN($("#gdrawdiam").val())&&$("#gdrawdiam").val()!="") {
            Grid.Draw.diameter = $("#gdrawdiam").val()
        }
    });
    $("#gcurrcolour").keydown(function (event) {
        if (event.which == 13) {
            var pColours = Grid.Draw.prevColours;
            if (pColours.indexOf(Grid.Draw.colour)==-1) 
                Grid.Draw.prevColours.push(Grid.Draw.colour);
            Grid.Draw.updatePrevColours();
            Grid.Draw.colour = $("#gdrawcolour").val();
        }
    });
});
// END GRID CODE // 1-673 = 673 lines
// START CALENDAR CODE // 674-927 = 254 lines
/**
*   CALENDAR
*/
Calendar = {};
Calendar.weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
Calendar.months = [null, "January","Feburary","March","April","May","June","July","August",
    "September","October","November","December"];
Calendar.monthLengths = [null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
Calendar.reset = function () {
    Calendar.futureMonths = [];
    Calendar.days = [];
    Calendar.rows = [];
    Calendar.columns = [];
    Calendar.items = [];
    Calendar.weeks = 0;
    Calendar.year = 0;
    Calendar.month = 0; 
    Calendar.day = 0; 
    Calendar.date = 0; 
    Calendar.monthLength = 0;
    Calendar.firstDay = 0;
    Calendar.lastDay = 0;
    Calendar.leapYear = false;
    Calendar.calcSet = false;
}
Calendar.calcDate = function (year, month) {
    Calendar.reset();
    var rightNow = new Date();
    if (rightNow.getDate() > Calendar.monthLengths[month])
        rightNow.setDate(1);
    rightNow.setFullYear(year);
    rightNow.setMonth(month-1);
    Calendar.year = rightNow.getFullYear();
    Calendar.month = (rightNow.getMonth())+1;
    Calendar.day = rightNow.getDay();
    Calendar.date = rightNow.getDate();
    Calendar.monthLength = Calendar.monthLengths[Calendar.month];
    if (this.year%4==0) {
        if (this.month==2)
            Calendar.monthLength = 29;
        Calendar.monthLengths[2] = 29;
        Calendar.leapYear = true;
    } else
        Calendar.monthLengths[2] = 28;
    var firstDay = new Date()
    firstDay.setMonth(month-1);
    firstDay.setDate(1);
    Calendar.firstDay = firstDay.getDay();
    var lastDay = new Date()
    lastDay.setMonth(month-1);
    lastDay.setDate(Calendar.monthLength);
    Calendar.lastDay = lastDay.getDay();
}
Calendar.generate = function (year, month) {
    month = isNull(month) ? new Date().getMonth()+1 : month;
    year = isNull(year) ? new Date().getFullYear() : year;
    if (Calendar.calcSet) {
        $("#calinner").empty();
        Calendar.reset();
    }
    Calendar.calcDate(year, month);
    Calendar.width = parseInt($("#calinner").css("width"));
    $(".calendar").css("height",((Calendar.width*0.8)+"px"));
    Calendar.height = parseInt($("#calinner").css("height"));
    Calendar.cellWidth = Calendar.width / 7;
    Calendar.weeks = Math.ceil((Calendar.firstDay+Calendar.monthLength)/7);
    Calendar.cellHeight = parseInt(Calendar.height/Calendar.weeks);
    var count = 0;
    for (i = 0; i < 7; i++) {
        modifyHtml("calinner", "<div id='calcol" + i + "' class='calcol'>");
        var tempCol = [];
        for (j=0;j<Calendar.weeks;j++) {
            tempCol.push(i+j*7);
        }
        Calendar.columns.push(tempCol);
    }
    for (i=0;i<Calendar.weeks;i++) {
        var tempRow = [];
        for (j=0;j<7;j++) {
            modifyHtml("calcol"+j, "<div id='calcell"+count+"' class='calcell'>");
            count++;
            tempRow.push(j+i*7);
        }
        Calendar.rows.push(tempRow);
    }
    $(".calcol").css("width", parseInt(Calendar.cellWidth));
    $(".calcell").css("height", Calendar.cellHeight-(parseInt($(".calcell").css("borderLeftWidth"))*2));
    $("#calcell"+Calendar.rows[0][Calendar.firstDay]).css("background","green");
    $("#calcell"+Calendar.rows[Calendar.weeks-1][Calendar.lastDay]).css("background","red");
    for (i=0;i<7*Calendar.weeks;i++) {
        modifyHtml("calcell"+i,"<div class='calday' id='calday"+i+"'></div>");
    }
    var refYear = Calendar.year;
    var refMonth = Calendar.month;
    if (Calendar.month==1) {
        count = Calendar.monthLengths[12]-Calendar.firstDay;
        refYear--;
        refMonth = 12;
    }
    else if (Calendar.month==3&&Calendar.leapYear) {
        count = 29-Calendar.firstDay;
        refMonth--;
    }
    else {
        count = Calendar.monthLengths[Calendar.month-1]-Calendar.firstDay;
        refMonth--;
    }
    var tempItemRow = [];
    for (i=0;i<Calendar.firstDay;i++) {
        $("#calday"+(i)).html((count+1).toString());
        var tempItem = { "year" : refYear, "month" : refMonth, "date" : count+1 };
        tempItemRow.push(tempItem);
        count++;
    }
    refYear = Calendar.year;
    refMonth = Calendar.month;
    count = 1;
    for (i=Calendar.firstDay;i<7;i++) {
        $("#calday"+i).html(count);
        var tempItem = { "year" : refYear, "month" : refMonth, "date" : count };
        tempItemRow.push(tempItem);
        count++;
    }
    Calendar.items.push(tempItemRow);
    for (i=1;i<Calendar.weeks-1;i++) {
        tempItemRow = [];
        for (j=0;j<7;j++) {
            $("#calday"+(j+i*7)).html(count.toString());
            var tempItem = { "year" : refYear, "month" : refMonth, "date" : count };
            tempItemRow.push(tempItem);
            count++;
        }
        Calendar.items.push(tempItemRow);
    }
    tempItemRow = [];
    for (i=0;i<=Calendar.lastDay;i++) {
        $("#calday"+(i+(Calendar.weeks-1)*7)).html(count.toString());
        var tempItem = { "year" : refYear, "month" : refMonth, "date" : count };
        tempItemRow.push(tempItem);
        count++;
    }
    count = 1;
    if (Calendar.month==12) {
        refYear++;
        refMonth = 1;
    }
    else refMonth++;
    for (i=Calendar.lastDay+1;i<7;i++) {
        $("#calday"+(i+(Calendar.weeks-1)*7)).html(count.toString());
        var tempItem = { "year" : refYear, "month" : refMonth, "date" : count };
        tempItemRow.push(tempItem);
        count++;
    }
    Calendar.items.push(tempItemRow);
    Calendar.calcSet = true;
    $($("#calstatus p")[0]).text(Calendar.months[Calendar.month]+" "+Calendar.year);
    $(".calweekday").css("width",parseInt(Calendar.cellWidth));
    $(".calcell").click(function (event) {
        var isSelected = (this.className.search("calselect")!=-1);
        if ($(".calselect").length == 0 && !isSelected)
            this.className += " calselect";
        else if ($(".calselect").length > 0 && event.ctrlKey && !isSelected)
            this.className += " calselect";
        else if ($(".calselect").length > 0 && event.shiftKey && !isSelected) {
            var firstId = $(".calselect")[$(".calselect").length-1].id.match(/[0-9]+/)[0];
            var thisId = this.id.match(/[0-9]+/)[0];
            if (parseInt(firstId) > parseInt(thisId)) {
                var tempId = firstId;
                firstId = thisId;
                thisId = tempId;
            }
            firstId = parseInt(firstId);
            thisId = parseInt(thisId);
            var ix;
            for (ix=firstId;ix<thisId+1;ix++) {
                if (gebi("calcell"+ix).className.search(" calselect")==-1) {
                    gebi("calcell"+ix).className += " calselect";
                }
            }
        }
        else if ($(".calselect").length > 0 && !event.ctrlKey && !isSelected) {
            Calendar.clearSelected();
            this.className += " calselect";
        } else if ($(".calselect").length > 0 && !event.ctrlKey && isSelected) {
            Calendar.clearSelected();
        }
        else if ($(".calselect").length > 0 && event.ctrlKey && isSelected)
            this.className = this.className.replace(" calselect", "");
    });
}
var tt;
Calendar.search = function (year, month, date) {
    for (i=0;i<Calendar.items.length;i++)
        for (j=0;j<Calendar.items[i].length;j++)
            if (Calendar.items[i][j]["year"]==year&&
            Calendar.items[i][j]["month"]==month&&
            Calendar.items[i][j]["date"]==date)
                return Calendar.rows[i][j];
}
Calendar.idSearch = function (id) {
    var targetDay = id % 7;
    var targetWeek = id / 5;
}
Calendar.findToday = function () {
    var todayId = Calendar.search(now.getFullYear(),now.getMonth()+1,now.getDate());
    if (isNull(todayId)) {
        Calendar.generate(now.getFullYear(), now.getMonth()+1);
        todayId = Calendar.search(Calendar.year,Calendar.month,Calendar.date);
    }
    var classname = $('#calcell'+todayId).attr("class");
    var selected = $(".calselect");
    if (selected.length > 0) {
        Calendar.clearSelected();
    }
    if (classname.search(" calselect")==-1) {
        $('#calcell'+todayId).attr("class", classname += " calselect");
    }
}
Calendar.clearSelected = function () {
    var selected = $(".calselect");
    for (ix=0;ix<selected.length;ix++)
        selected[ix].className = selected[ix].className.replace(" calselect", "");
}
$(function () {
    $("#calcontmonth").click(function () {
        Calendar.generate();
    });
    $(document).on("pageload", function () {
        Calendar.generate();
    });
    $("#calcchangeup").click(function () {
        if (Calendar.month == 1) {
            var newMonth = 12;
            var newYear = Calendar.year-1;
        } else {
            var newMonth = Calendar.month-1;
            var newYear = Calendar.year;
        }
        Calendar.generate(newYear, newMonth);
    });
    $("#calcchangedown").click(function () {
        if (Calendar.month == 12) {
            var newMonth = 1;
            var newYear = Calendar.year+1;
        } else {
            var newMonth = Calendar.month+1;
            var newYear = Calendar.year;
        }
        Calendar.generate(newYear, newMonth);
    });
    $("#calconttoday").click(function () { Calendar.findToday(); });
});
// END CALENDAR CODE // 674-927 = 253 lines
// START TXTENG CODE // 928-1185 = 258 lines
/**
*   TXTENG: JAVASCRIPT TERMINAL EMULATOR
*/
txteng = {};
txteng.inProgram = false;
txteng.cmdlist = [
    "echo",
    "run",
    "help",
    "cl",
    "motd"
];
txteng.cmd = [];
txteng.motd = [
    " -=|   Welcome to tXtEng v0.2.1   |=- ",
    " -=|    CC-BY Thomas Bell 2013    |=- "
];
txteng.helpInfo = [
    "echo: The echo command displays the message specified in the console." + "\n" +
    "SYNTAX: echo \"[message]\"",
    "run: Runs a tXtEng program." + "\n" +
    "SYNTAX: run [program] {arguments}",
    "help: Echoes out either the list of valid commands or displays useful information about" +
    "a specific one." + "\n" +
    "SYNTAX: help {program}",
    "cl: Clears the console." + "\n" +
    "SYNTAX: cl"
];

txteng.Program = {};

txteng.echo = function (message) {
    if (message) {
        var input = $("#txtengarea");
        input.val(input.val() + "> " + message + "\n");
    }
}
txteng.motdEcho = function () {
    for (i = 0; i < this.motd.length; i++) {
        txteng.echo(this.motd[i]);
    }
}
txteng.input = function (clear) {
    if (clear) {
        var input = $("#txtengin").val().toString();
        $("#txtengin").val("");
        return input;
    }
    else {
        return $("#txtengin").val().toString();
    }
}
txteng.execute = function (command, arg1, arg2, arg3, arg4, arg5) {
    switch (command) {
        case 0:
            txteng.echo(arg1);
            break;
        case 1:
            txteng.run(arg1);
            break;
        case 2:
            txteng.help(arg1);
            break;
        case 3:
            txteng.clear();
            txteng.input(true);
            break;
        case 4:
            txteng.echo("This command causes an unknown browser hang.");
            break;
        default:
            txteng.input(true);
    }
}
txteng.command = function () {
    var tempword = [];
    var tempcmd = "";
    this.cmd = [];
    var str = false;
    for (i = 0; i <= txteng.input(false).length; i++) {
        var input = txteng.input(false);
        if (i != txteng.input(false).length) {
            if (input[i] == " " && !str) {
                tempcmd = tempword.join("");
                this.cmd.push(tempcmd);
                tempword = [];
                tempcmd = "";
            }
            else if (input[i] == '"') {
                str = !str;
            }
            else {
                tempword.push(input[i]);
            }
        }
        else {
            tempcmd = tempword.join("");
            this.cmd.push(tempcmd);
            tempword = [];
            tempcmd = "";
        }
    }
    if (!txteng.inProgram) {
        var match = false;
        for (i = 0; i < txteng.cmdlist.length;i++) {
            if (this.cmd[0].toLowerCase() == txteng.cmdlist[i]) {
                txteng.execute(i, this.cmd[1], this.cmd[2], this.cmd[3], this.cmd[4], this.cmd[5]);
                txteng.input(true);
                match = true;
            }
        }
        if (!match) {
            txteng.echo("The command \"" + this.cmd[0] + "\" was not recognised by tXtEng. Try again.");
        }
    }
    else {
        return this.cmd;
    }
}
txteng.run = function (program) {
    switch (program) {
        case "flip":
            txteng.Program.flip();
            txteng.inProgram = true;
            break;
        case "battleship":
            txteng.Program.battleship();
            txteng.inProgram = true;
            break;
        default:
            txteng.echo("The program \"" + program + "\" does not exist.");
    }
}
txteng.clear = function () {
    $("#txtengarea").val("");
}
txteng.help = function (command) {
    if (command == undefined || command == "" || command == " ") {
        txteng.echo("COMMANDS: ");
        for (i = 0; i < txteng.cmdlist.length; i++) {
            txteng.echo(txteng.cmdlist[i]);
        }
    }
    else if (txteng.cmdlist.indexOf(command) != -1) {
        txteng.echo(txteng.helpInfo[txteng.cmdlist.indexOf(command)]);
    }
    else {
        txteng.echo("The command \"" + command + "\" was not recognised by tXtEng. Try again.");
    }
}
txteng.Program.reset = function () {
    $("#txtengin").off("keydown");
    $("#txtengin").keydown(function (event) {
        if (event.which == 13) {
            txteng.command();
        }
    });
    txteng.inProgram = false;
}
txteng.Program.flip = function (repeat) {
    if (repeat == undefined) {
        repeat = false;
    }
    txteng.clear();
    if (!repeat) {
        txteng.echo("Welcome to FLIP!");
        txteng.echo("Press ENTER to continue");
    }
    else {
        var e = $.Event("keydown");
        e.which = 13;
    }
    $("#txtengin").off("keydown");
    $("#txtengin").keydown(function (event) {
        if (event.which == 13) {
            if (intRand(1, "max")) {
                txteng.echo("It landed heads!");
            }
            else {
                txteng.echo("It landed tails!");
            }
            txteng.echo("Would you like to play again [Y/N]?");
            $(document).trigger("flipp1");
        }
    });
    if (repeat) {
        $("#txtengin").trigger(e);
    }
    $(document).on("flipp1", function () {
        $("#txtengin").off("keydown");
        $("#txtengin").keydown(function (event) {
            if (event.which == 13) {
                if (txteng.input(true).toLowerCase() != "y") {
                    txteng.Program.reset();
                    txteng.clear();
                }
                else {
                    txteng.Program.flip(true);
                }
            }
        });
    })
}
txteng.Program.battleship = function () {
    txteng.clear();
    txteng.echo("Let's play a game of Battleship!");
    txteng.echo("Press ENTER to continue");
    var board = [
        ["0", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0"],
        ["0", "0", "0", "0", "0"]
    ]
    var boardEcho = function () {
        for (i = 0; i < board.length; i++) {
            var temprow = "";
            for (j = 0; j < board[i].length; j++) {
                temprow += board[i][j];
                temprow += " ";
            }
            txteng.echo(temprow);
        }
    }
    $("#txtengin").off("keydown");
    $("#txtengin").keydown(function (event) {
        if (event.which == 13) {
            txteng.clear();
            boardEcho();
            txteng.echo("Place your ship!");
            txteng.echo("Type in two coordinates seperated by a space: ");
            $(document).trigger("battleship1");
        }
    });
    $(document).on("battleship1", function () {
        $("#txtengin").off("keydown");
        $("#txtengin").keydown(function (event) {
            if (event.which == 13) {
                txteng.clear();
                var cmd = txteng.command();
                if (!(isNaN(cmd[0]) || isNaN(cmd[1])) && (cmd[0] < 5 && cmd[1] < 5)) {
                    board[cmd[0]][cmd[1]] = "S";
                    boardEcho();
                }
            }
        });
    })
}
TBI.timerSet("motd", 1000, function () { $("#txtengarea").val(""); txteng.motdEcho(); TBI.timerClear("motd"); });
$(function () {
    $("#txtengin").keydown(function (event) {
        if (event.which == 13) {
            txteng.command();
        }
    });
});
// END TXTENG CODE // 928-1185 = 258 lines
// START COUNTDOWN CODE // 1186-1416 = 231 lines
/**
*   CDOWN: COUNTDOWN WIDGET/APPLICATION
*/
var Cdown = {};
Cdown.rightNow = new Date();
Cdown.difference = new Date();
Cdown.diff = new Date();
Cdown.expand = true;
Cdown.dbugTime = [];
Cdown.prevSec;
Cdown.active = false;
Cdown.name = "";

Cdown.main = function (enddate, dest) {
    this.rightNow = new Date();
    var bStr = unixToString(enddate);
    var nStr = unixToString(this.rightNow);
    var cStr = unixToString(this.rightNow);
    offset = [null, 2100, 12, Calendar.monthLengths[parseInt(nStr[2])], 24, 60, 60];
    var it;
    for (it = 6; it > 0; it--) {
        if (parseInt(parseInt(bStr[it]) - nStr[it]) < 0) {
            bStr[it - 1]--;
            cStr[it] = offset[it] - Math.abs(parseInt(bStr[it]) - nStr[it]);
        }
        else {
            cStr[it] = parseInt(bStr[it]) - nStr[it];
        }
    }
    for (it = 4; it < 7; it++) {
        if (cStr[it] < 10) {
            cStr[it] = "0" + cStr[it];
        }
    }
    var plurals = [];
    var active = 6;
    var searchActive = true;
    for (it = 1; it < 7; it++) {
        if (cStr[it] == 1) {
            plurals[it] = "";
        }
        else {
            plurals[it] = "s";
        }
        if (cStr[it] > 0 && searchActive) {
            searchActive = false;
            active = it;
        }
    }
    var finalCountdown = "";
    if (this.expand) {
        if (active <= 1) finalCountdown += cStr[1] + " year" + plurals[1] + " ";
        if (active <= 2) finalCountdown += cStr[2] + " month" + plurals[2] + " ";
        if (active <= 3) finalCountdown += cStr[3] + " day" + plurals[3] + " ";
        if (active <= 4) finalCountdown += cStr[4] + " hour" + plurals[4] + " ";
        if (active <= 5) finalCountdown += cStr[5] + " minute" + plurals[5] + " ";
        if (active <= 6) finalCountdown += cStr[6] + " second" + plurals[6] + " ";
    }
    else {
        if (active <= 3) finalCountdown += Math.floor(cStr[3] + cStr[2] * 30 + cStr[1] * 365) + " day(s) ";
        if (active <= 4) finalCountdown += cStr[4] + ":";
        if (active <= 5) finalCountdown += cStr[5] + ".";
        if (active <= 6) finalCountdown += cStr[6];
    }
    if (bStr[0] >= nStr[0]) {
        $("#" + dest).html(finalCountdown);
        this.active = true;
    }
    else {
        $("#" + dest).html("Countdown over!!!");
        this.active = false;
        eraseCookie("cDown");
        Cdown.check(false);
    }
    this.dbugTime[0] = cStr;
    this.dbugTime[1] = bStr;
    this.dbugTime[2] = nStr;
    this.prevSec = cStr[6];
}
TBI.timerSet("nw", 100, function () { Cdown.rightNow = new Date() });
Cdown.verifyInput = function () {
    var inYear = $("#cdsetyear"),
        inMonth = $("#cdsetmonth"),
        inDay = $("#cdsetday"),
        inHour = $("#cdsethour"),
        inMinute = $("#cdsetminute"),
        inSecond = $("#cdsetsecond"),
        inArr = [inYear, inMonth, inDay, inHour, inMinute, inSecond];
        inArrValues = [inYear.val(), inMonth.val(), inDay.val(), inMinute.val(), inSecond.val()];
    Cdown.name = $("#cdsetname").val();
    var inCurrent = [];
    var inNow = unixToString(this.rightNow);
    var out = new Date();
    if (inYear.val() <= inNow[1]) { inCurrent[1] = true }
    if (inMonth.val() == inNow[2] && inCurrent[1]) { inCurrent[2] = true }
    if (inDay.val() == inNow[3] && inCurrent[2]) { inCurrent[3] = true }
    if (inHour.val() == inNow[4] && inCurrent[3]) { inCurrent[4] = true }
    if (inMinute.val() == inNow[5] && inCurrent[4]) { inCurrent[5] = true }
    for (i=0;i<inArr.length;i++)
        if (isNaN(inArr[i].val()) && !isNull(inArr[i].val()))
            inArr[i].val("00");
    if (isNull(inArrValues)) {
        alert("The values are invalid.");
        return false;
    }
    else if (inNow[1] > inYear.val() || inYear.val() > 2100) { alert("Year is invalid.") }
    else if (inCurrent[1] && inMonth.val() < inNow[2]) { alert("Month set in past.") }
    else if (inCurrent[2] && inDay.val() < inNow[3]) { alert("Day set in past.") }
    else if (inCurrent[3] && inHour.val() < inNow[4]) { alert("Hour set in past.") }
    else if (inCurrent[4] && inMinute.val() < inNow[5]) { alert("Minute set in past.") }
    else if (inCurrent[5] && inSecond.val() < inNow[6]) { alert("Second set in past.") }
    else if (inMonth.val() > 12 || inMonth.val() < 1) { alert("Month is invalid.") }
    else if (inDay.val() > Calendar.monthLengths[inNow[3]] || inDay.val() < 1) { alert("Day is invalid.") }
    else if (inHour.val() > 23 || inHour.val() < 0) { alert("Hour is invalid.") }
    else if (inMinute.val() > 59 || inMinute.val() < 0) { alert("Minute is invalid.") }
    else if (inSecond.val() > 59 || inSecond.val() < 0) { alert("Second is invalid.") }
    else {
        out.setSeconds(inSecond.val());
        out.setMinutes(inMinute.val());
        out.setHours(inHour.val());
        out.setDate(inDay.val());
        out.setMonth(parseInt(inMonth.val())-1);
        out.setFullYear(inYear.val());
        return out.getTime();
    }
    return false;
}
Cdown.check = function (bool) {
    var out = new Date();
    if (bool) {
        var input = this.verifyInput();
        if (input) {
            createCookie("cDown", input+","+Cdown.name, 365);
            out.setTime(input);
            Cdown.set(out);
        }
        else
            Cdown.reset();
    }
    if (readCookie("cDown")) {
        var cookie = readCookie("cDown").split(",");
        out.setTime(cookie[0]);
        Cdown.name = cookie[1];
        Cdown.set(out);
    }
    else
        Cdown.reset();
}
Cdown.reset = function () {
    $("#cdown-full").attr("class", "cdown cdset proto");
        $("#cdset").css("display", "inline");
        $("#cd-fn-set").css("display", "inline-block");
        $("#cdown-count").css("display", "none");
        $("#cdown-full h3")[0].innerHTML = "Countdown";
        TBI.timerClear("cDown");
}
Cdown.set = function (out) {
    $("#cdown-full").attr("class", "cdown proto");
    $("#cdset").css("display", "none");
    $("#cd-fn-set").css("display", "none");
    $("#cdown-count").css("display", "inline-block");
    TBI.timerSet("cDown", 50, function () { Cdown.main(out, "cdown-count") });
    if (!isNull(Cdown.name) && !isNull(gebi("cdown-full")))
        $("#cdown-full h3")[0].innerHTML = "Countdown - " + Cdown.name;
}
Cdown.checkfn = function () {
    var fnYear = $("#cdfn-year"),
        fnMonth = $("#cdfn-month"),
        fnDay = $("#cdfn-day"),
        fnHour = $("#cdfn-hour"),
        fnMinute = $("#cdfn-minute"),
        fnSecond = $("#cdfn-second"),
        fnArr = [fnYear, fnMonth, fnDay, fnHour, fnMinute, fnSecond];
        fnArrValues = [fnYear.val(), fnMonth.val(), fnDay.val(), fnHour.val(), fnMinute.val(), fnSecond.val()];
    for (i=0;i<fnArr.length;i++)
        if (isNaN(fnArr[i].val()) && !isNull(fnArr[i].val()))
            fnArr[i].val("0");
    if (isNull(fnArrValues)) {
        alert("The values are invalid.");
        return null;
    }
    else {
        var mLength = Calendar.monthLengths[parseInt(unixToString(Cdown.rightNow)[2])];
        var out = 0;
        out += fnSecond.val()*1000;
        out += fnMinute.val()*1000*60;
        out += fnHour.val()*1000*60*60;
        out += fnDay.val()*1000*60*60*24;
        out += fnMonth.val()*1000*60*60*24*mLength;
        out += fnYear.val()*1000*60*60*24*mLength*12;
        out += Cdown.rightNow.getTime();
        Cdown.name = $("#cdsetname").val();
        eraseCookie("cDown")
        createCookie("cDown", out+","+Cdown.name, 365);
    }
}
$(function () {
    var cdInputs = $("#cdown-full input");
    TBI.timerSet("cdInputs",100,function () {
        for (i=1;i<cdInputs.length;i++) {
            if (isNaN($(cdInputs[i]).val())) {
                cdInputs[i].className = "inactive";
            }
            else {
                cdInputs[i].className = "";;
                $(cdInputs[i]).off();
            }
        }
        $(".inactive").click(function () {
            $(this).val("");
        });
        $("#cdsetname").click(function () {
            $("#cdsetname").off();
            $("#cdsetname").attr("class","");
            gebi("cdsetname").attributes[3] = undefined;
        });
        $(".cdset").keydown(function (event) {
            if (event.which == 13)
                Cdown.check(true);
        });
        $(".cd-fn-set").keydown(function (event) {
            if (event.which == 13) {
                Cdown.checkfn();
                Cdown.check(false);
            }
        });
    });
    Cdown.check(false);
});
// END COUNTDOWN CODE // 1186-1416 = 231 lines
// START CALC CODE // 1417-1785 = 369 lines
/**
*   JAVASCRIPT ADVANCED CALCULATOR
*/
Calc = {};
Calc.nanRegex = /[^0-9\.-]/;
Calc.funcRegex = /[\+\-\*\/(pow)]/;
Calc.functions = ["+","-","*","/","sqrt","sin","cos","tan","pow","x^2","x^3","10^x","rint"];
Calc.numbers = [];
Calc.statusLog = [];
Calc.string = "_";
Calc.workingNum = "";
Calc.currentFunc = 0;
Calc.inputMode = 0;
Calc.mode = 0;
Calc.answerShown = false;
Calc.funcShown = false;
Calc.shift = false;
Calc.answer;
Calc.prevNum;

Calc.setUp = function () {
    TBI.timerSet("calcwindow",1000,function () {
        if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)")
            $($("#calcwindow span")[0]).css("color", "#3AACFF");
        else
            $($("#calcwindow span")[0]).css("color", "transparent");
    });
    TBI.timerSet("calcstring",4,function () {
        if (Calc.inputMode)
            $($("#calcwindow input")[0]).val(Calc.string);
        else
            $($("#calcwindow span")[0]).html(Calc.string);
        if (Calc.statusLog.length > 20)
            Calc.statusLog.shift();
    });
    TBI.timerSet("calcstatuswindow",1000,function () {
        if ($($("#calcstatus span")[0]).css("color")=="rgba(0, 0, 0, 0)")
            $($("#calcstatus span")[0]).css("color", "#3AACFF");
        else
            $($("#calcstatus span")[0]).css("color", "transparent");
    });
    $("#calcplus").click(function () { Calc.runFunction("+") });
    $("#calcminus").click(function () { Calc.runFunction("-") });
    $("#calctimes").click(function () { Calc.runFunction("*") });
    $("#calcdivide").click(function () { Calc.runFunction("/") });
    $("#calcsqrt").click(function () { Calc.runFunction("sqrt") });
    $("#calccos").click(function () { Calc.runFunction("cos") });
    $("#calctan").click(function () { Calc.runFunction("tan") });
    $("#calcsin").click(function () { Calc.runFunction("sin") });
    $("#calcpower").click(function () { Calc.runFunction("pow") });
    $("#calcpower2").click(function () { Calc.runFunction("x^2") });
    $("#calcpower3").click(function () { Calc.runFunction("x^3") });
    $("#calc10power").click(function () { Calc.runFunction("10^x") });
    $("#calcrandint").click(function () { Calc.runFunction("rint") });
    for (i=0;i<$(".calcnum").length;i++) {
        $($(".calcnum")[i]).click(function () { Calc.addDigit($(this).text()) });
    }
    $("#calcdot").click(function () { 
        if (Calc.workingNum.indexOf(".")==-1)
            Calc.addDigit(".");
     });
    $("#calcconstpi").click(function () { 
        Calc.string = "";
        Calc.workingNum = "";
        Calc.addDigit(Math.PI.toString());
    });
    $("#calcconste").click(function () { 
        Calc.string = "";
        Calc.workingNum = "";
        Calc.addDigit(Math.E.toString());
    });
    $("#calcrand").click(function () {
        Calc.string = "";
        Calc.workingNum = "";
        Calc.addDigit(Math.random());
    });
    $("#calcequals").click(function () {
        if (!isNull(Calc.workingNum) && !isNaN(Calc.workingNum))
            Calc.numbers.push(parseFloat(Calc.workingNum));
        Calc.equate(isNull(Calc.workingNum));
    });
    $("#calcinput").click(function () {
        if (Calc.inputMode == 1) {
            $($("#calcwindow span")[0]).show();
            $($("#calcwindow input")[0]).hide();
            Calc.inputMode = 0;
            this.innerText = "Keyboard Input";
            if (Calc.string == "") {
                Calc.string = "_";
                TBI.timerSet("calcwindow",1000,function () {
                    if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)")
                        $($("#calcwindow span")[0]).css("color", "#3AACFF");
                    else
                        $($("#calcwindow span")[0]).css("color", "transparent");
                });
            }
        } else {
            TBI.timerClear("calcwindow");
            $($("#calcwindow span")[0]).hide();
            $($("#calcwindow input")[0]).show();
            Calc.inputMode = 1;
            if (Calc.string == "_") Calc.string = "";
            this.innerText = "Button Input";
        }
    });
    $("#calcbackspace").click(function () {
        if (!isNull(Calc.string)) {
            Calc.string = shorten(Calc.string.toString(), Calc.string.toString().length-1);
            Calc.workingNum = Calc.string;
        }
    });
    $("#calcdelete").click(function () {
        if (!isNull(Calc.string)) {
            var stringArr = Calc.string.toString().split("");
            stringArr.shift();
            Calc.string = stringArr.join("");
            Calc.workingNum = Calc.string;
        }
    });
    $($("#calcwindow input")[0]).keydown(function (event) {
        Calc.handleKeyDown(event);
    });
    $("#calcclear").click(function () {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.answerShown = false;
    });
    $("#calcallclear").click(function () {
        Calc.workingNum = "";
        Calc.numbers = [];
        if (!Calc.inputMode && isNull(Timers.calcwindow)) { 
            Calc.string = "_";
            TBI.timerSet("calcwindow",1000,function () {
                if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)") {
                    $($("#calcwindow span")[0]).css("color", "#3AACFF");
                } else {
                    $($("#calcwindow span")[0]).css("color", "transparent");
                }
            });
        }
        Calc.prevNum = null;
        Calc.answerShown = false;
    });
    $("#calcsign").click(function () {
        if (Calc.answerShown) {
            Calc.workingNum = "";
            Calc.string = "";
            Calc.numbers = [];
            Calc.prevNum = "";
            Calc.answerShown = false;
        }
        if (!isNull(Calc.string)&&!isNaN(Calc.string)) {
            var newStringArr = [];
            var oldString = Calc.string.toString().split("");
            if (oldString[0] != "-") {
                newStringArr.push("-");
                for (i=0;i<oldString.length;i++) {
                    newStringArr.push(oldString[i]);
                }
            } else {
                for (i=1;i<oldString.length;i++) {
                    newStringArr.push(oldString[i]);
                }
            }
            Calc.string = newStringArr.join("");
            Calc.workingNum = Calc.string;
            Calc.prevNum = "";
            
        }
    });
    $("#calcmode").click(function () {
        Calc.mode = !Calc.mode;
        if (Calc.mode)
            $(".calcadvonly").show();
        else
            $(".calcadvonly").hide();
    });
    $("#calcshift").click(function () { Calc.shift = !Calc.shift });
}
Calc.equate = function (bool) {
    if (bool == undefined) bool = false;
    if (Calc.numbers.length > 1 || (Calc.numbers.length == 1 && bool)) {
        if (bool && !isNull(Calc.prevNum))
            var secondNum = Calc.prevNum;
        else
            var secondNum = Calc.numbers[1];
        switch (Calc.currentFunc) {
            case (Calc.functions.indexOf("+")):
                Calc.answer = Calc.numbers[0]+secondNum;
                break;
            case (Calc.functions.indexOf("-")):
                Calc.answer = Calc.numbers[0]-secondNum;
                break;
            case (Calc.functions.indexOf("*")):
                Calc.answer = Calc.numbers[0]*secondNum;
                break;
            case (Calc.functions.indexOf("/")):
                Calc.answer = Calc.numbers[0]/secondNum;
                break;
            case (Calc.functions.indexOf("pow")):
                Calc.answer = Math.pow(Calc.numbers[0], secondNum);
                break;
            default:
                Calc.answer = Calc.numbers[0];
        }
        if (Calc.answer.toString().length>16) {
            Calc.answer = parseFloat(shorten((Calc.answer+0.00000000000001).toString(),16));
        }
        var firstNum = Calc.numbers[0];
        Calc.string = Calc.answer;
        Calc.workingNum = "";
        Calc.prevNum = secondNum;
        Calc.numbers = [Calc.answer];
        Calc.answerShown = true;
        Calc.statusPrint(firstNum+" "+Calc.functions[Calc.currentFunc]+" "+secondNum+" = "+Calc.answer);
    } else if (Calc.functions[Calc.currentFunc].search(Calc.funcRegex)==-1) {
        if (isNull(Calc.prevNum))
            var prevNum = Calc.numbers[0];
        else
            var prevNum = Calc.prevNum;
        switch (Calc.currentFunc) {
            case (Calc.functions.indexOf("sqrt")):
                Calc.answer = Math.sqrt(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("sin")):
                Calc.answer = Math.sin(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("tan")):
                Calc.answer = Math.tan(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("cos")):
                Calc.answer = Math.cos(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("x^2")):
                Calc.answer = Math.pow(Calc.numbers[0], 2);
                break;
            case (Calc.functions.indexOf("x^3")):
                Calc.answer = Math.pow(Calc.numbers[0], 3);
                break;
            case (Calc.functions.indexOf("10^x")):
                Calc.answer = Math.pow(10, Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("rint")):
                Calc.answer = randomInt(prevNum);
                break;
            default:
                Calc.answer = Calc.numbers[0];
        }
        if (Calc.answer.toString().length>14) {
            Calc.answer = parseFloat(shorten((Calc.answer+0.000000000001).toString(),13));
        }
        var firstNum = Calc.numbers[0];
        Calc.string = Calc.answer;
        Calc.workingNum = "";
        Calc.numbers = [Calc.answer];
        Calc.answerShown = true;
        Calc.statusPrint(Calc.functions[Calc.currentFunc]+"("+firstNum+") = "+Calc.answer);
        if (isNull(Calc.prevNum))
            Calc.prevNum = Calc.numbers[0]
        else
            Calc.prevNum = prevNum;
    }
}
Calc.runFunction = function (funcStr) {
    if (Calc.string.toString().search(Calc.nanRegex)==-1) {
        Calc.currentFunc = Calc.functions.indexOf(funcStr);
        if (!isNull(Calc.workingNum)) {
            Calc.numbers.push(parseFloat(Calc.workingNum));
            if (funcStr.search(Calc.funcRegex)!=-1)
                Calc.statusPrint(Calc.workingNum+" "+funcStr);
            else
                Calc.statusPrint(funcStr+"("+Calc.workingNum+")");
        }
        Calc.string = funcStr;
        Calc.workingNum = "";
        Calc.answerShown = false;
        if (!(Calc.inputMode&&Calc.answerShown))
            Calc.equate();
        else {
            Calc.string = "";
            Calc.workingNum = "";
        }
        Calc.funcShown = true;
    }
};
Calc.handleKeyDown = function (event) {
    var character = convertKeyDown(event);
    if (!isNull(Calc.string)&&Calc.string.toString().search(Calc.nanRegex)!=-1)
        Calc.string = "";
    if (event.which==8 && !isNull(Calc.string)) {
        Calc.string = shorten(Calc.string, Calc.string.length-1);
        Calc.workingNum = Calc.string;
    } else if (event.which==46 && !isNull(Calc.string)) {
        var stringArr = Calc.string.toString().split("");
        stringArr.shift();
        Calc.string = stringArr.join("");
        Calc.workingNum = Calc.string;
    }
    if (!isNaN(character)&&!isNull(character)) {
            if (Calc.answerShown) {
                Calc.workingNum = "";
                Calc.string = "";
                Calc.numbers = [];
                Calc.prevNum = "";
                Calc.answerShown = false;
            }
            Calc.string+=character;
            if (isNull(Calc.workingNum))
                Calc.workingNum = Calc.string;
            else
                Calc.workingNum+=character;
    } else if (Calc.functions.indexOf(character)!=-1) {
        Calc.runFunction(character);
    } else if (character == ".") {
        Calc.workingNum += ".";
        Calc.string += ".";
    } else if (event.which == 13) {
        if (!isNull(Calc.workingNum) && !isNaN(Calc.workingNum)) {
            Calc.numbers.push(parseFloat(Calc.workingNum));
        }
        Calc.equate(isNull(Calc.workingNum));
    }
}
Calc.addDigit = function (digit) {
    var calcWindow = $($("#calcwindow span")[0]);
    if (calcWindow.text().search(Calc.nanRegex)!=-1) {
        TBI.timerClear("calcwindow");
        $($("#calcwindow span")[0]).css("color", "#3AACFF");
        Calc.string = "";
    }
    if (Calc.answerShown) {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.prevNum = "";
        Calc.answerShown = false;
    } else if (Calc.funcShown) {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.funcShown = false;
        Calc.prevNum = "";
    }
    Calc.string+=digit;
    if (isNull(Calc.workingNum))
        Calc.workingNum = Calc.string;
    else
        Calc.workingNum+=digit;
}
Calc.statusPrint = function (message) {
    TBI.timerClear("calcstatuswindow");
    $($("#calcstatus span")[0]).html(message);
    $($("#calcstatus span")[0]).css("color","#3AACFF");
    TBI.timerClear("statusReset");
    TBI.timerSet("statusReset",10000,function () {
        $($("#calcstatus span")[0]).html("_");
        TBI.timerClear("statusReset");
        TBI.timerSet("calcstatuswindow",1000,function () {
            if ($($("#calcstatus span")[0]).css("color")=="rgba(0, 0, 0, 0)")
                $($("#calcstatus span")[0]).css("color", "#3AACFF");
            else
                $($("#calcstatus span")[0]).css("color", "transparent");
        });
    });
    Calc.statusLog.push(message);
}
$(function () {
    Calc.setUp();
});
// END CALC CODE // 1417-1785 = 369 lines
// START TTBL CODE // 1786-2058 = 273 lines
/**
*   TTBL: TIMETABLE PARSER
*/
var TTBL = {};
TTBL.ttables = {};
TTBL.curr = "default";
TTBL.dayKeys = ["sun","mon","tue","wed","thu","fri","sat"];
TTBL.days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
TTBL.input = { "default" : { "variables" : { "days" : []}, "defs" : {}, "info" : {}, "table" : {}}};
TTBL.setup = function () {
    var valid = true;
    try {
        $.parseJSON(localStorage.TTBL2);
    } catch (e) {
        valid = !valid;
    }
    if (valid) {
        TTBL.ttables = $.parseJSON(localStorage.TTBL2);
        TTBL.periods = [];
        TTBL.breaks = [];
        TTBL.blocks = [];
        TTBL.cr = TTBL.ttables[TTBL.curr];
        TTBL.tb = TTBL.cr.table;
        TTBL.vr = TTBL.cr.variables;
        TTBL.df = TTBL.cr.defs;
        TTBL.info = TTBL.cr.info;
        TTBL.df.days = [];
        TTBL.df.dayKeys = [];
        for (var it = 0; it < TTBL.vr.days.length; it++) {
            TTBL.df.days.push(TTBL.days[TTBL.vr.days[it]]);
            TTBL.df.dayKeys.push(TTBL.dayKeys[TTBL.vr.days[it]]);
        }
        TTBL.vr.maxlength = 0;
        for (it = 0; it < TTBL.vr.length.length; it++)
            if (TTBL.vr.length[it] > parseInt(TTBL.vr.maxlength))
                TTBL.vr.maxlength = parseInt(TTBL.vr.length[it]);
        TTBL.fillIn();
        TTBL.generate();
        TTBL.set();
    }
}
TTBL.generate = function () {
    $(".ttb-body").empty();
    $(".ttb-body").append("<div class='ttable-head'></div>");
    $(".ttable-head").append("<span></span>");
    for (var it = 0; it < TTBL.df.days.length; it++)
        $(".ttable-head").append("<span>"+TTBL.df.days[it]+"</span>");
    var firstWidth = $(".ttable-head span")[0].style.width;
    $(".ttable-head span").css("width",100/TTBL.df.days.length-(100/TTBL.df.days.length/20)+"%");
    $(".ttable-head span:first-child").css("width",firstWidth);
    for (it = 0; it < TTBL.vr.maxlength; it++) {
        if (TTBL.blocks[0][it].type == "period") {
            $(".ttb-body").append("<div class='ttable-row'></div>");
            $(".ttb-body > div:nth("+(it+1)+")").append("<div></div>");
            for (var jt = 0; jt < TTBL.df.days.length; jt++) {
                var divtext = "<div class='ttable-cell ttb-"+TTBL.df.dayKeys[jt]+"'></div>";
                $(".ttb-body > div:nth("+(it+1)+")").append(divtext);
                var cellh = "<div class='ttable-cellh'>header</div>";
                $(".ttb-body > div:nth("+(it+1)+") > .ttable-cell:nth("+jt+")").append(cellh);
                var celli = "";
                for (var kt = 1; kt < TTBL.vr.display.period.length; kt++) {
                    celli += "<div class='ttable-celli'>info</div>";
                }
                $(".ttb-body > div:nth("+(it+1)+") > .ttable-cell:nth("+jt+")").append(celli);
            }
        } else if (TTBL.blocks[0][it].type == "break")
            $(".ttb-body").append("<div class='ttable-break'></div>");
    }
    if (TTBL.vr.length.length > 0) {
        for (it = 0; it < TTBL.vr.length.length; it++) {
            $(".ttable-row:nth("+it+") > div:first-child").text(it+1);
        }
        var it = 0;
        var jt = 0;
        while (it < TTBL.vr.length[0]) { 
            if (TTBL.blocks[0][it].type != "break") {
                $(".ttable-row:nth("+jt+") > div:first-child").text(jt+1);
                jt++;
            } it++;
        }
    }
    $(".ttb-body .ttable-cell").css("width",100/TTBL.df.days.length-(100/TTBL.df.days.length/20)+"%");
}
TTBL.addTime = function (timeString, minCount) {
    minCount = parseInt(minCount);
    var time = timeString.split(".");
    time[0] = parseInt(time[0]);
    time[1] = parseInt(time[1]);
    while (time[1] + minCount >= 60) {
        if (time[0]+1 < 24)
            time[0]++;
        else
            time[0] = 0;
        minCount -= 60;
    }
    time[1] += minCount;
    if (time[0] < 10) { time[0] = "0"+time[0]; }
    if (time[1] < 10) { time[1] = "0"+time[1]; }
    return time[0].toString()+"."+time[1].toString();
}
TTBL.fillIn = function () {
    for (var it = 0; it < TTBL.tb.length; it++) {
        var thisDay = TTBL.tb[it];
        var periods = [];
        var blocks = [];
        for (var jt = 0; jt < thisDay.length; jt++) {
            if (isNull(thisDay[jt].start))
                if (!isNull(thisDay[jt-1].end))
                    thisDay[jt].start = thisDay[jt-1].end;
            if (isNull(thisDay[jt].end))
                if (!isNull(thisDay[jt].start))
                    thisDay[jt].end = TTBL.addTime(thisDay[jt].start, TTBL.vr.periodLength);
            if (!isNull(thisDay[jt].group)) {
                var info = TTBL.vr.display.group;
                var group = thisDay[jt].group;
                for (var kt = 0; kt < info.length; kt++) {
                    if (kt == 0) {
                        var ref = TTBL.df[info[0]][TTBL.df.group[group][0]];
                        if (isNull(thisDay[jt][info[0]]))
                            thisDay[jt][info[0]] = ref.name;
                        if (isNull(thisDay[jt].colour))
                            thisDay[jt].colour = ref.colour;
                        if (isNull(thisDay[jt].text))
                            thisDay[jt].text = ref.text;
                        else
                            thisDay[jt].text = "#000";
                    } else if (TTBL.vr.display.gpshort.indexOf(info[kt]) != -1 
                        && isNull(thisDay[jt][info[kt]]))
                        thisDay[jt][info[kt]] = TTBL.df[info[kt]][TTBL.df.group[group][kt]];
                    else if (isNull(thisDay[jt][info[kt]]))
                        thisDay[jt][info[kt]] = TTBL.df.group[group][kt];
                }
            }
            if (isNull(thisDay[jt].type) || thisDay[jt].type != "break") {
                if (isNull(thisDay[jt].type))
                    thisDay[jt].type = "period";
                periods.push(thisDay[jt]);
            } else if (thisDay[jt].type == "break" && TTBL.breaks.indexOf(thisDay[jt].name) == -1) {
                TTBL.breaks.push(thisDay[jt].name);
            }
            blocks.push(thisDay[jt]);
        }
        TTBL.periods.push(periods);
        TTBL.blocks.push(blocks);
    }
}
TTBL.set = function () {
    for (var it = 0; it < TTBL.periods.length; it++) {
        var cells = $(".ttb-"+TTBL.df.dayKeys[it]);
        for (var jt = 0; jt < cells.length; jt++) {
            var currPeriod = TTBL.periods[it][jt];
            cells[jt].style.backgroundColor = currPeriod.colour;
            var header = cells[jt].getElementsByClassName("ttable-cellh")[0];
            header.innerHTML = currPeriod[TTBL.vr.display.period[0]];
            header.style.color = currPeriod.text;
            var info = cells[jt].getElementsByClassName("ttable-celli");
            for (var kt = 0; kt < info.length; kt++) {
                if (TTBL.vr.display.period[kt+1] == "time") {
                    var time = currPeriod.start+"-"+currPeriod.end;
                    info[kt].innerHTML = time;
                } else if (!isNull(currPeriod[TTBL.vr.display.period[kt+1]]))
                    info[kt].innerHTML = currPeriod[TTBL.vr.display.period[kt+1]];
                else 
                    info[kt].innerHTML = "&nbsp;";
            }
            cells[jt].style.visibility = currPeriod.type == "blank" ? "hidden" : "visible";
        }
    }
    for (it = 0; it < TTBL.breaks.length; it++)
        $(".ttable-break")[it].innerHTML = TTBL.breaks[it];
    $(".ttb-info").empty();
    for (it = 0; it < TTBL.vr.display.info.length; it++) {
        var tempElement = "";
        tempElement += "<div class='ttbi-field'>";
        tempElement += "<div class='ttbi-fieldh'></div>";
        tempElement += "<div class='ttbi-fieldi'></div>";
        tempElement += "</div>"
        $(".ttb-info").append(tempElement);
        var header = TTBL.vr.display.info[it];
        var content = TTBL.info[TTBL.vr.display.info[it]];
        $(".ttbi-fieldh")[it].innerHTML = header;
        $(".ttbi-fieldi")[it].innerHTML = content;
    }
}
TTBL.find = function (day, hour, minute) {
    if (TTBL.vr.days.indexOf(day) == -1) return false;
    var td = TTBL.tb[TTBL.vr.days.indexOf(day)];
    for (var i = 0; i < td.length; i++) {
        var start = td[i].start.split(".");
        var end = td[i].end.split(".");
        if (hour >= start[0] &&
            hour <= end[0] &&
            (hour > start[0] || minute >= start[1]) &&
            (hour < end[0] || minute <= end[1]))
            return [TTBL.vr.days.indexOf(day), i];
    }
    return false;
}
TTBL.highlight = function (col, row) {
    var cell = $(".ttb-body>div:not(.ttable-head):nth("+row+")>div:not(:first-child):nth("+col+")")[0];
    if (isNull(cell)) cell = $(".ttb-body>div:not(.ttable-head):nth("+row+")")[0];
    if (isNull(cell)) return false;
    var highlighted = $(".ttb-highlight");
    for (var i = 0; i < highlighted.length; i++)
        highlighted[i].className = highlighted[i].className.replace(" ttb-highlight", "");
    if (cell.className.search(" ttb-highlight") == -1) {
        cell.className = cell.className += " ttb-highlight";
        return true;
    }
    return false;
}
$(function () { 
    TTBL.setup(); 
    $("#ttb-test").click(function () {
        if ((isNull(TTBL.data) && isNull(localStorage.TTBL2)) || 
        (!isNull(localStorage.TTBL2) && confirm("Do you want to overwrite your current timetable?"))) {
            var xhr = new TBI.AJAX("/assets/data/ttb1.json", function () {
                localStorage.TTBL2 = xhr.response;
                TTBL.data = localStorage.TTBL2;
                TTBL.setup();
            });
        } else if (!isNull(TTBL.data) && isNull(localStorage.TTBL2)) {
            localStorage.TTBL2 = TTBL.data;
            TTBL.setup();
        }
    });
    $("#ttb-clear").click(function () {
        localStorage.removeItem("TTBL2");
        $(".ttb-body").empty();
        $(".ttb-info").empty();
        $("#ttb-test").css("visibility","hidden");
        setTimeout(function () {
            $("#ttb-test").css("visibility","visible");
        }, 10000);
    });
    TBI.Popup.registry.add($("#ttb-clear")[0], "Clear timetable", 
    "The 'Test timetable' button will be unavailable for a few seconds");
    $(".ttbs-mode").buttonset();
    if (!isNull(localStorage.TTBL2)) {
        try {
            $(".ttb-set textarea").val(JSON.stringify($.parseJSON(localStorage.TTBL2), null, 4));
        } catch (e) {
            new TBI.error("Error: "+e.message);
            localStorage.removeItem("TTBL2");
        }
    }
    $("#ttbs-modee").click(function () {
        if ($(this).val() == "on") {
            $(".ttb-set textarea").attr("disabled", false);
        }
    });
    $("#ttbs-modev").click(function () {
        if ($(this).val() == "on") {
            $(".ttb-set textarea").attr("disabled", true);
            localStorage.TTBL4 = localStorage.TTBL2;
            try {
                localStorage.TTBL2 = JSON.stringify($.parseJSON($(".ttb-set textarea").val()));
                TTBL.setup();
            } catch (e) {
                TBI.error(e);
                localStorage.TTBL2 = localStorage.TTBL4;
                localStorage.removeItem("TTBL4");
            }
        }
    });
    $("#ttbs-hlnow").click(function () {
        var found = TTBL.find(now.getDay(), now.getHours(), now.getMinutes());
        TTBL.highlight(found[0], found[1]);
    });
    if (!isNull(localStorage.TTBL4)) $("#ttbs-hlnow").trigger("click");
});
// END TTBL CODE // 1786-2058 = 273 lines
// START CANVAS CODE // 2059-2225 = 167 lines
/**
*   CANVAS PAINT PROGRAM TEST
*/
$(function () {
    var ctx = new Canvas2D("cvs");
    ctx.fillRect(25,25,100,100);
    ctx.clearRect(45,45,60,60);
    ctx.strokeRect(50,50,50,50);
    Canvas2D.path(ctx, {type:"fill",style:"blue",path:[[90,120],[30,60],[30,120],[90,120]]});
    ctx.inspector = true;
    Canvas2D.inspector(ctx);
    Canvas2D.path(ctx, {type:"fill",style:"#0094ff",path:[[40,80],[60,120],[60,60],[40,40],[40,80]]});
    ctx.save();
    Canvas2D.path(ctx, {type:"fill",style:"red",path:[[80,60],[40,20],[180,120],[80,60]]});
    ctx.restore();
    var modes = {"line":"Line","fill":"Fill","poly":"Polygon","rect":"Rectangle","qcurve":"Quadratic curve","bcurve":"Bezier curve"};
    function changeMode(context, mode) {
        $("#cvs-mode").text(modes[mode]);
        context.mode = mode;
    }
    var hx = "0123456789abcdef";
    var h = [];
    for (var i=0;i<16;i++) { for (var j=0;j<16;j++) { h.push(hx[i]+hx[j]); } }
    var r = 16,
        w = 4,
        x = 64,
        y = 64,
        c = 4,
        d = h.length/r;
    ctx.globalCompositeOperation = "destination-over";
    for(var i=0;i<r;i++){for(var j=0;j<r;j++){for(var k=0;k<r;k++){
        ctx.beginPath();
        ctx.fillStyle="#"+h[i*d]+h[j*d]+h[k*d];
        ctx.rect(j*w+x+((k%c)*w*r),(i*w+y)+(Math.floor(k/c)*w*r),w,w);
        ctx.closePath();
        ctx.fill();
    }}}
    ctx.globalCompositeOperation = "source-over";
    var isFirst = true;
    var isControl = false;
    var stroke = true;
    var fill = true;
    var click = 0;
    ctx.beginPath();
    ctx.mode = "";
    ctx.lineWidth = 4;
    ctx.radius = 10;
    $("#cvs").click(function (event) {
        switch (ctx.mode) {
            case "line":
            if (click == 0) {
                ctx.moveTo(event.offsetX, event.offsetY);
                click++;
            } else {
                ctx.lineTo(event.offsetX, event.offsetY);
                if (stroke) ctx.stroke();
            } break;
            case "fill":
            if (click == 0) {
                ctx.moveTo(event.offsetX, event.offsetY);
                click++;
            } else {
                ctx.lineTo(event.offsetX, event.offsetY);
                if (stroke) ctx.stroke();
            } break;
            case "poly":
            if (click == 0) {
                ctx.moveTo(event.offsetX, event.offsetY);
                ctx.firstPos = [event.offsetX, event.offsetY];
                click++;
            } else {
                ctx.lineTo(event.offsetX, event.offsetY);
                if (stroke) ctx.stroke();
            } break;
            case "rect":
            if (click == 0) {
                ctx.moveTo(event.offsetX, event.offsetY);
                ctx.firstPos = [event.offsetX, event.offsetY];
                click++;
            } else {
                var fp = ctx.firstPos;
                ctx.rect(fp[0], fp[1], event.offsetX-fp[0], event.offsetY-fp[1]);
                if (stroke) ctx.stroke();
                if (fill) ctx.fill();
                click = Canvas2D.reset(ctx);
            } break;
            case "qcurve":
            if (click == 0) {
                ctx.moveTo(event.offsetX, event.offsetY);
                click++;
                Canvas2D.dot(event.pageX, event.pageY, "red");
            } else if (click == 1) {
                ctx.firstPos = [event.offsetX, event.offsetY];
                click++;
                Canvas2D.dot(event.pageX, event.pageY, "#09f");
            } else if (click > 1) {
                ctx.quadraticCurveTo(event.offsetX, event.offsetY, ctx.firstPos[0], ctx.firstPos[1]);
                if (stroke) ctx.stroke();
                click = Canvas2D.reset(ctx);
                Canvas2D.dot(event.pageX, event.pageY, "lime");
            } break;
            case "bcurve":
            if (click == 0) {
                ctx.moveTo(event.offsetX, event.offsetY);
                click++;
                Canvas2D.dot(event.pageX, event.pageY, "red");
            } else if (click == 1) {
                ctx.firstPos = [event.offsetX, event.offsetY];
                click++;
                Canvas2D.dot(event.pageX, event.pageY, "#09f");
            } else if (click == 2) {
                ctx.secondPos = [event.offsetX, event.offsetY];
                click++;
                Canvas2D.dot(event.pageX, event.pageY, "lime");
            } else if (click > 2) {
                ctx.bezierCurveTo(
                    event.offsetX, 
                    event.offsetY, 
                    ctx.secondPos[0], 
                    ctx.secondPos[1], 
                    ctx.firstPos[0], 
                    ctx.firstPos[1]
                );
                if (stroke) ctx.stroke();
                click = Canvas2D.reset(ctx);
                Canvas2D.dot(event.pageX, event.pageY, "yellow");
            } break;
        }
    });
    $("#cvs").mousemove(function (event) {
        if (ctx.mode == "brush" && event.which == 1) {
            ctx.arc(event.offsetX, event.offsetY, ctx.radius, dtr(0), dtr(360), false);
            if (fill) ctx.fill();
            click = Canvas2D.reset(ctx);
        }
    });
    $("#cvs-end").click(function () {
        if (ctx.mode == "poly" && !isNull(ctx.firstPos)) {
            ctx.lineTo(ctx.firstPos[0], ctx.firstPos[1]);
            if (stroke) ctx.stroke();
        }
        if (ctx.mode == "poly" || ctx.mode == "fill")
            if (fill) ctx.fill();
        click = Canvas2D.reset(ctx);
    });
    $("#cvs-style-0").keyup(function () { ctx.strokeStyle = $(this).val(); });
    $("#cvs-style-1").keyup(function () { ctx.fillStyle = $(this).val(); });
    $("#cvs-width").spinner();
    $("#cvs-width").keyup(function () { if (!isNaN($(this).val())) ctx.lineWidth = $(this).val() });
    $("#cvs-width").mouseup(function () { if (!isNaN($(this).val())) ctx.lineWidth = $(this).val() });
    $("#cvs-bwid").spinner();
    $("#cvs-bwid").keyup(function () { if (!isNaN($(this).val())) ctx.radius = $(this).val() });
    $("#cvs-bwid").mouseup(function () { if (!isNaN($(this).val())) ctx.radius = $(this).val() });
    $("#cvs-line").click(function () { changeMode(ctx, "line"); click = Canvas2D.reset(ctx); });
    $("#cvs-poly").click(function () { changeMode(ctx, "poly"); click = Canvas2D.reset(ctx); });
    $("#cvs-quad").click(function () { changeMode(ctx, "qcurve"); click = Canvas2D.reset(ctx); });
    $("#cvs-bezier").click(function () { changeMode(ctx, "bcurve"); click = Canvas2D.reset(ctx); });
    $("#cvs-brush").click(function () { changeMode(ctx, "brush"); click = Canvas2D.reset(ctx); });
    $("#cvs-stroke").click(function () { stroke = !stroke; });
    $("#cvs-fill").click(function () { fill = !fill; });
    $("#cvs-guide").click(function () {
        Canvas2D.dotEnabled = !Canvas2D.dotEnabled;
        $(".cvs-dot").css("visibility", (Canvas2D.dotEnabled ? "visible" : "hidden"));
    });
});
// END CANVAS CODE // 2059-2225 = 167 lines
// START GL CODE // 2226-2365 = 140 lines
/**
*   WEBGL TEST
*/
var GLTest = {};
GLTest.sqVtcBuffer = null;
GLTest.sqVtcColBuffer = null;
GLTest.vtxPosAttribute = null;
GLTest.vtxColAttribute = null;
GLTest.program = null;
GLTest.perspMatrix = null;
GLTest.mvMatrix = null;
GLTest.sqRotation = 0.0;
GLTest.mvMtxStack = [];
GLTest.lastSqUpTime = null;
GLTest.init = function () {
    var gl = new Canvas3D(gebi("gl-test"));
    if (!isNull(gl) && !isNull(gl.clearColor)) {
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    } else return false;
    GLTest.shaderInit(gl);
    GLTest.bufferInit(gl);
    GLTest.drawScene(gl);
}
GLTest.shaderInit = function (gl) {
    var fragShader = GLTest.shaderGet(gl, "shader-fs");
    var vtxShader = GLTest.shaderGet(gl, "shader-vs");
    GLTest.program = gl.createProgram();
    gl.attachShader(GLTest.program, vtxShader);
    gl.attachShader(GLTest.program, fragShader);
    gl.linkProgram(GLTest.program);
    if (!gl.getProgramParameter(GLTest.program, gl.LINK_STATUS))
        TBI.error("Init shader error.");
    gl.useProgram(GLTest.program);
    GLTest.vtxPosAttribute = gl.getAttribLocation(GLTest.program, "aVertexPosition");
    gl.enableVertexAttribArray(GLTest.vtxPosAttribute);
    GLTest.vtxColAttribute = gl.getAttribLocation(GLTest.program, "aVertexColour");
    gl.enableVertexAttribArray(GLTest.vtxColAttribute);
}
GLTest.shaderGet = function (gl, id) {
    var script = gebi(id);
    if (isNull(script)) return null;
    var src = "";
    var child = script.firstChild;
    while (child) {
        if (child.nodeType == child.TEXT_NODE)
            src += child.textContent;
        child = child.nextSibling;
    }
    if (script.type == "x-shader/x-fragment")
        var shader = gl.createShader(gl.FRAGMENT_SHADER);
    else if (script.type == "x-shader/x-vertex")
        var shader = gl.createShader(gl.VERTEX_SHADER);
    else return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        TBI.error("Shader error: "+gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
GLTest.bufferInit = function (gl) {
    GLTest.sqVtcBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, GLTest.sqVtcBuffer);
    var vtc = [
        1.0, 1.0, 0.0,
        -1.0,1.0, 0.0,
        1.0, -1.0,0.0,
        -1.0,-1.0,0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vtc), gl.STATIC_DRAW);
    var colours = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    GLTest.sqVtcColBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, GLTest.sqVtcColBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
}
GLTest.drawScene = function (gl) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    GLTest.perspMatrix = makePerspective(45, 600.0/600.0, 0.1, 100.0);
    GLTest.mvMatrix = Matrix.I(4);
    GLTest.mvMatrix = GLTest.mvMatrix.x(Matrix.Translation($V([-0.0, 0.0, -4.0]))).ensure4x4();
    GLTest.mvPushMtx();
    GLTest.mvRotate(dtr(40.0), [1,0,1]);
    GLTest.mvPopMtx();
    gl.bindBuffer(gl.ARRAY_BUFFER, GLTest.sqVtcBuffer);
    gl.vertexAttribPointer(GLTest.vtxPosAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, GLTest.sqVtcColBuffer);
    gl.vertexAttribPointer(GLTest.vtxColAttribute, 4, gl.FLOAT, false, 0, 0);
    GLTest.setMatrixUniforms(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    var currTime = new Date().getTime();
    if (!isNull(GLTest.lastSqUpTime)) {
        var delta = currTime - GLTest.lastSqUpTime;
        GLTest.sqRotation += (30*delta)/1000.0;
    }
    GLTest.lastSqUpTime = currTime;
    var sqOffset = [0.0, 0.0, 0.0];
    var increment = [0.2, -0.4, 0.3];
    sqOffset[0] += increment[0] * ((30 * delta) / 1000.0);
    sqOffset[1] += increment[1] * ((30 * delta) / 1000.0);
    sqOffset[2] += increment[2] * ((30 * delta) / 1000.0);
    if (Math.abs(sqOffset[1]) > 2.5) {
        increment[0] = -increment[0];
        increment[1] = -increment[1];
        increment[2] = -increment[2];
    }
}
GLTest.setMatrixUniforms = function (gl) {
    var p = gl.getUniformLocation(GLTest.program, "uPMatrix");
    gl.uniformMatrix4fv(p, false, new Float32Array(GLTest.perspMatrix.flatten()));
    var mv = gl.getUniformLocation(GLTest.program, "uMVMatrix");
    gl.uniformMatrix4fv(mv, false, new Float32Array(GLTest.mvMatrix.flatten()));
}
GLTest.mvPushMtx = function (m) {
    if (m) {
        GLTest.mvMtxStack.push(m.dup());
        GLTest.mvMatrix = m.dup();
    } else GLTest.mvMtxStack.push(GLTest.mvMatrix.dup());
}
GLTest.mvPopMtx = function () {
    if (!GLTest.mvMtxStack.length) TBI.error("Empty matrix stack.");
    GLTest.mvMatrix = GLTest.mvMtxStack.pop();
    return GLTest.mvMatrix;
}
GLTest.mvRotate = function (angle, v) {
    var radians = dtr(angle);
    var m = Matrix.Rotation(radians, $V([v[0], v[1], v[2]])).ensure4x4();
    GLTest.mvMatrix = GLTest.mvMatrix.x(m);
}
$(function () { GLTest.init() });
// END GL CODE // 2226-2365 = 140 lines
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
// START PSIM CODE // 2511-2891 = 381 lines
/**
*   PLANETARIUM SIMULATION
*/
var PSim = {};
PSim.init = function () {
    PSim.AU = 149600000;
    PSim.PF = 100000;
    PSim.LF = 20000;
    PSim.starbank = [];
    PSim.objectbank = {};
    PSim.labels = [];
    PSim.speed = 1;
    $("#psim-speed").val(1);
    PSim.scale = 1;
    $("#psim-scale").val(1);
    PSim.zoom = 1;
    $("#psim-zoom").val(1);
    PSim.pan = [0,0];
    PSim.storedSec = Math.floor(new Date().getTime()/1000);
    PSim.ms = 10;
    PSim.fps = 1000/PSim.ms;
    PSim.frames = 0;
    PSim.planetLines = false;
    PSim.planetOrbits = true;
    PSim.debug = false;
    PSim.planetLabels = true;
    PSim.clicked = 0;
    PSim.overlay = null;
    PSim.selected = null;
    PSim.objectvars = {};
    PSim.objects = [];
    TBI.timerClear("PSim");
    var xhr = new TBI.AJAX("/assets/data/psim.json", function () {
        try { PSim.objectvars = $.parseJSON(xhr.response).objects; PSim.objects = $.parseJSON(xhr.response).list } 
        catch (e) { e.message = "Planetarium load error: "+ e.message; TBI.error(e) }
        TBI.timerSet("PSim", PSim.ms, function () {
            try { PSim.simulate() }
            catch (e) { e.message = "Planetarium error: " + e.message; TBI.error(e) }
        });
    });
}
/**
    STATS FOR A NEW PLANET:
    distance : semi-major axis in AU,
    speed : average orbital speed in km/s,
    size : mean radius in km
    - Assuming perfectly circular orbit
*/
PSim.simulate = function () {
    PSim.ctx.clearRect(-300,-300,600,600);
    PSim.spawnStars(600);
    for (var i = 0; i < PSim.objects.length; i++)
        if (PSim.objects[i].type != "satellite") PSim.object(PSim.objects[i].name);
        else PSim.satellite(PSim.objects[i].parent, PSim.objects[i].name);
    PSim.sun(696342);
    if (!isNull(PSim.overlay)) PSim.cursor();
    PSim.frameControl();
    if (PSim.debug) PSim.statistics();
    return null;
}
PSim.sun = function (radius) {
    PSim.ctx.save();
    PSim.ctx.beginPath();
    PSim.ctx.arc(PSim.pan[0] * (PSim.zoom * PSim.PF), PSim.pan[1] * (PSim.zoom * PSim.PF), radius/PSim.LF * PSim.zoom, 0, dtr(360), false);
    PSim.ctx.shadowBlur = 24;
    PSim.ctx.shadowColor = "#fff";
    PSim.ctx.fillStyle = "#ff0";
    PSim.ctx.fill();
    PSim.ctx.fillStyle = "#ff0";
    PSim.ctx.arc(PSim.pan[0] * (PSim.zoom * PSim.PF), PSim.pan[1] * (PSim.zoom * PSim.PF), 2, 0, dtr(360), false);
    PSim.ctx.fill();
    PSim.ctx.closePath();
    PSim.ctx.restore();
}
PSim.spawnStars = function (num) {
    var isStarbank = PSim.starbank.length > 0;
    num = isStarbank ? PSim.starbank.length : num;
    for (var i=0;i<num;i++) {
        if (isStarbank) {
            var x = PSim.starbank[i][0];
            var y = PSim.starbank[i][1];
        } else {
            var x = advRandomInt(-600, 600);
            var y = advRandomInt(-600, 600);
        }
        PSim.ctx.save();
        PSim.ctx.beginPath();
        PSim.ctx.scale(Math.pow(PSim.zoom,0.05),Math.pow(PSim.zoom,0.05));
        PSim.ctx.arc(x+0.5+0, y+0.5+0, 0.5, 0, dtr(360), false);
        PSim.ctx.fillStyle = "#fff";
        PSim.ctx.fill();
        PSim.ctx.closePath();
        PSim.ctx.restore();
        if (!isStarbank) PSim.starbank.push([x, y]);
    }
}
PSim.planet = function (name) {
    var planet = PSim.objectvars[name];
    if (isNull(planet) || planet.type != "planet") return false;
    var rotation = isNull(PSim.objectbank[name]) ? PSim.objectvars[name].rotation : PSim.objectbank[name][0];
    rotation = isNull(rotation) ? randomInt(360) : rotation % 360;
    rotation += (360 / (planet.distance * PSim.AU * 2 * Math.PI / planet.speed)) / PSim.fps * PSim.speed;
    var distance = planet.distance * PSim.AU / PSim.LF * PSim.zoom;
    var size = planet.size / PSim.LF * PSim.scale * PSim.zoom;
    var panX = PSim.pan[0] * PSim.zoom * PSim.PF;
    var panY = PSim.pan[1] * PSim.zoom * PSim.PF;
    PSim.ctx.save();
    PSim.ctx.translate(panX, panY);
    PSim.ctx.beginPath();
    PSim.ctx.fillStyle = planet.colour;
    PSim.ctx.rotate(dtr(rotation));
    PSim.ctx.arc(distance, 0, size, 0, dtr(360), false);
    PSim.ctx.fill();
    PSim.ctx.closePath();
    if (PSim.selected == name) {
        PSim.ctx.save();
        PSim.ctx.rotate(-dtr(rotation));
        var a = circlePoint(rotation, distance);
        var x = a[0], y = a[1];
        Canvas2D.path(PSim.ctx, {type:"stroke",style:"#09f",path:[[x,y],[x+10,y],[x,y],[x-10,y],[x,y],[x,y+10],[x,y],[x,y-10]]});
        PSim.ctx.restore();
    }
    if (!isNull(planet.rings) && navigator.userAgent.search("MSIE")==-1) {
        PSim.ctx.save();
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = planet.rings.colour;
        PSim.ctx.lineWidth = (planet.rings.max_distance*PSim.AU/PSim.LF)*PSim.zoom-(planet.rings.min_distance*PSim.AU/PSim.LF)*PSim.zoom;
        var ringDistance = Math.mean([planet.rings.min_distance, planet.rings.max_distance]);
        PSim.ctx.arc(distance, 0, (ringDistance * PSim.AU / PSim.LF) * PSim.zoom, 0, dtr(360), false);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
        PSim.ctx.restore();
    }
    if (PSim.planetLabels && distance > 1) {
        PSim.ctx.save();
        PSim.ctx.rotate(-dtr(rotation));
        PSim.ctx.font = "12px Raleway";
        var loc = circlePoint(rotation, distance);
        PSim.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        PSim.ctx.fillRect(loc[0]-2, loc[1]-8, 70, 20);
        PSim.labels[PSim.labelFind(name)] = {
            "name":name,
            "location":[loc[0]-2+panX, loc[1]-8+panY],
            "dimensions":[70,20]
        };
        PSim.ctx.fillStyle = "white";
        if (PSim.selected == name) PSim.ctx.fillStyle = "#09f";
        PSim.ctx.fillText(name, loc[0]+8, loc[1]+6);
        PSim.ctx.restore();
    }
    if (PSim.planetLines) {
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = planet.colour;
        PSim.ctx.moveTo(0,0);
        PSim.ctx.lineTo(1000, 0);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    if (PSim.planetOrbits) {
        PSim.ctx.moveTo(0,0);
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = planet.colour;
        PSim.ctx.arc(0, 0, distance, 0, dtr(360), false);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    PSim.ctx.restore();
    PSim.objectbank[name] = [
        rotation, 
        distance, 
        size
    ];
    return true;
}
PSim.satellite = function (parent, name) {
    var planet = PSim.objectvars[parent];
    var satellite = planet.satellites[name];
    var parentRotation = PSim.objectbank[parent][0];
    var parentDistance = planet.distance * PSim.AU / PSim.LF * PSim.zoom;
    var rotation = isNull(PSim.objectbank[name]) ? PSim.objectvars[parent].satellites[name].rotation : PSim.objectbank[name][0];
    rotation = isNull(rotation) ? randomInt(360) : rotation % 360;
    rotation += (360 / (satellite.distance * PSim.AU * 2 * Math.PI / satellite.speed)) / PSim.fps * PSim.speed;
    var distance = satellite.distance * PSim.AU / PSim.LF * PSim.zoom;
    var size = satellite.size / PSim.LF * PSim.scale * PSim.zoom;
    var panX = PSim.pan[0] * PSim.zoom * PSim.PF;
    var panY = PSim.pan[1] * PSim.zoom * PSim.PF;
    PSim.ctx.save();
    PSim.ctx.translate(panX, panY);
    PSim.ctx.beginPath();
    var position = circlePoint(parentRotation, parentDistance);
    PSim.ctx.fillStyle = satellite.colour;
    PSim.ctx.translate(position[0], position[1]);
    PSim.ctx.rotate(dtr(rotation));
    PSim.ctx.arc(distance, 0, size, 0, dtr(360), false);
    PSim.ctx.fill();
    PSim.ctx.closePath();
    if (PSim.planetLabels && distance > 1) {
        PSim.ctx.save();
        PSim.ctx.rotate(-dtr(rotation));
        PSim.ctx.font = "8px Raleway";
        PSim.ctx.fillStyle = "white";
        var loc = circlePoint(rotation, distance);
        PSim.ctx.fillText(name, loc[0]+6, loc[1]+4);
        PSim.ctx.restore();
    }
    if (PSim.planetLines) {
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = satellite.colour;
        PSim.ctx.moveTo(0,0);
        PSim.ctx.lineTo(1000,0);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    if (PSim.planetOrbits) {
        PSim.ctx.moveTo(0,0);
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = satellite.colour;
        PSim.ctx.arc(0, 0, distance, 0, dtr(360), false);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    PSim.ctx.restore();
    PSim.objectbank[name] = [rotation];
    return true;
}
PSim.field = function (name) {
    var field = PSim.objectvars[name];
    if (isNull(field) || field.type != "field") return false;
    var rotation = isNull(PSim.objectbank[name]) ? PSim.objectvars[name].rotation : PSim.objectbank[name][1];
    rotation = isNull(rotation) ? 0 : rotation;
    rotation += field.speed * PSim.speed;
    PSim.ctx.save();
    PSim.ctx.fillStyle = field.colour;
    PSim.ctx.rotate(dtr(rotation));
    var isObjbank = !isNull(PSim.objectbank[name]); // [distance, size, rotation]
    var single;
    var fieldArr = [];
    for (var i=0;i<field.density;i++) {
        if (isObjbank) single = PSim.objectbank[name][0][i];
        else single = [
            advRandomInt(field.distance*7480, field.distance*7480 + field.distance_range*7480),
            advRandomInt(field.size, field.size + field.size_range),
            randomInt(360)];
        PSim.ctx.save();
        PSim.ctx.beginPath();
        PSim.ctx.rotate(dtr(single[2]));
        PSim.ctx.arc(single[0] * PSim.zoom, 0, single[1] * PSim.scale * PSim.zoom, 0, dtr(360), false);
        PSim.ctx.fill();
        PSim.ctx.closePath();
        PSim.ctx.restore();
        fieldArr.push(single);
    }
    PSim.ctx.restore();
    PSim.objectbank[name] = [fieldArr, rotation];
    return true;
}
PSim.object = function (name) {
    if (isNull(PSim.objectvars[name])) return false;
    if (PSim.objectvars[name].type == "planet") return PSim.planet(name);
    else if (PSim.objectvars[name].type == "field") return PSim.field(name);
    else return false;
}
PSim.frameControl = function () {
    PSim.frames++;
    if (PSim.storedSec != Math.floor(new Date().getTime()/1000)) {
        PSim.storedSec = Math.floor(new Date().getTime()/1000);
        PSim.fps = PSim.frames;
        PSim.frames = 0;
    }
}
PSim.statistics = function () {
    PSim.ctx.beginPath();
    var uX=-300,uY=-300,lX=-100,lY=-150;
    Canvas2D.path(PSim.ctx, {type:"fill",style:"rgba(240,240,240,0.6)",path:[[uX,uY],[uX,lY],[lX,lY],[lX,uY],[uX,uY]]});
    PSim.ctx.fill();
    PSim.ctx.closePath();
    PSim.ctx.font = "bold 16px Raleway";
    PSim.ctx.fillStyle = "black";
    PSim.ctx.fillText("Statistics", -285, -275);
    PSim.ctx.font = "normal 12px Open Sans";
    var y = -275;
    PSim.ctx.fillText("Zoom: "+PSim.zoom+"x", -280, y += 16);
    PSim.ctx.fillText("Scale: "+PSim.scale+"x", -280, y += 16);
    PSim.ctx.fillText("Speed: "+PSim.speed+"x", -280, y += 16);
    var panx = PSim.pan[0].toFixed(8);
    panx=panx==PSim.pan[0]?PSim.pan[0]:panx;
    var pany = PSim.pan[1].toFixed(8);
    pany=pany==PSim.pan[1]?PSim.pan[1]:pany;
    var pant = (panx==PSim.pan[0]&&pany==PSim.pan[1])?"Pan: ":"Pan ≈ ";
    PSim.ctx.fillText(pant+panx+", "+pany, -280, y += 16);
    PSim.ctx.fillText("FPS: "+PSim.fps, -280, y += 16);
    PSim.ctx.fillText("Selection: "+PSim.selected, -280, y += 16);
}
PSim.cursor = function () {
    var x = PSim.overlay.pageX - $("#psim-canvas").offset().left - 300.5;
    var y = PSim.overlay.pageY - $("#psim-canvas").offset().top - 300.5;
    Canvas2D.path(PSim.ctx, {type:"stroke",style:"white",path:[[x,y],[x+10,y],[x,y],[x-10,y],[x,y],[x,y+10],[x,y],[x,y-10]]});
    if (PSim.clicked == 1) {
        var zoom = PSim.zoom;
        PSim.zoom = zoom>1?1:zoom;
        if (zoom>1) { $("#psim-zoom").val(1) }
        PSim.clicked = 2;
        PSim.pan = [0, 0];
        PSim.selected = null;
        for (var i = 0; i < PSim.labels.length; i++) {
            var label = PSim.labels[i];
            if ((x > label.location[0] && x < label.location[0] + label.dimensions[0] &&
                y > label.location[1] && y < label.location[1] + label.dimensions[1]) &&
                label.name != PSim.selected) {
                PSim.focus(label.name);
                PSim.speed = 1;
                $("#psim-speed").val(1);
                PSim.selected = label.name;
                PSim.zoom = zoom;
                return true;
            }
        }
        return false;
    }
    return null;
}
PSim.labelFind = function (name) {
    for (var i = 0; i < PSim.labels.length; i++) if (PSim.labels[i].name == name) return i;
    return PSim.labels.length;
}
PSim.focus = function (name) {
    var object = PSim.objectbank[name];
    var location = circlePoint(object[0] % 360, object[1]);
    PSim.pan = [-location[0]/(PSim.zoom * PSim.PF), -location[1]/(PSim.zoom * PSim.PF)];
}
$(function () {
    PSim.ctx = new Canvas2D("psim-canvas");
    PSim.ctx.translate(300, 300);
    PSim.init();
    var zoomed = false,
        scaled = false,
        speeded = false,
        panned = false;
    // Zoom
    $("#psim-zoom").mousedown(function () { zoomed = true });
    $("#psim-zoom").mouseup(function () { zoomed = false });
    $("#psim-zoom").mousemove(function () { if (zoomed) PSim.zoom = +Math.pow($("#psim-zoom").val(), 8).toFixed(6) });
    $("#psim-zoom").val(PSim.zoom = 1);
    TBI.Popup.registry.add(gebi("psim-zoom-help"), "Zoom", "Zooms in and out relative to the simulation's center point.<br /><em>\
    The sun stops zooming out when it appears to be around 4 pixels wide.</em>");
    // Scale
    $("#psim-scale").mousedown(function () { scaled = true });
    $("#psim-scale").mouseup(function () { scaled = false });
    $("#psim-scale").mousemove(function () { if (scaled) PSim.scale = +Math.pow($("#psim-scale").val(), 4).toFixed(6) });
    $("#psim-scale-reset").click(function () { $("#psim-scale").val(PSim.scale = 1) });
    $("#psim-scale-reset").trigger("click");
    TBI.Popup.registry.add(gebi("psim-scale-help"), "Scale", "Scales the planet sizes to make them more easily visible.<br /><em>Does not \
    increase the size of the Sun.</em>");
    TBI.Popup.registry.add(gebi("psim-scale-reset"), "Scale Reset", "Resets the planet sizes to realistic values.");
    // Speed
    $("#psim-speed").mousedown(function () { speeded = true });
    $("#psim-speed").mouseup(function () { speeded = false });
    $("#psim-speed").mousemove(function () { 
        if (speeded && !isNegative($("#psim-speed").val())) PSim.speed = +Math.pow($("#psim-speed").val(), 6).toFixed(6)
        else if (speeded) PSim.speed = -Math.pow($("#psim-speed").val(), 6).toFixed(6)
    });
    $("#psim-speed-reset").click(function () { $("#psim-speed").val(PSim.speed = 1) });
    $("#psim-speed-pause").click(function () { $("#psim-speed").val(PSim.speed = 0) });
    $("#psim-speed-reset").trigger("click");
    TBI.Popup.registry.add(gebi("psim-speed-help"), "Speed", "Speeds up or pauses the simulation.");
    TBI.Popup.registry.add(gebi("psim-speed-reset"), "Speed Reset", "Resets the simulation speed to realistic values.");
    TBI.Popup.registry.add(gebi("psim-speed-pause"), "Speed Pause", "Stops the simulation completely.");
    // Checkboxes / Boolean values
    $("#psim-plines").click(function () { PSim.planetLines = TBI.isButtonToggled(this); });
    $("#psim-porbits").click(function () { PSim.planetOrbits = TBI.isButtonToggled(this); });
    $("#psim-debug").click(function () { PSim.debug = TBI.isButtonToggled(this); });
    $("#psim-plabels").click(function () { PSim.planetLabels = TBI.isButtonToggled(this); });
    // Canvas
    $("#psim-canvas").mousemove(function (event) { PSim.overlay = event });
    $("#psim-canvas").mouseleave(function (event) { PSim.overlay = null; PSim.clicked = 0 });
    $("#psim-canvas").mousedown(function () { PSim.clicked = 1 });
    $("#psim-canvas").mouseup(function () { PSim.clicked = 0 });
    $("#psim-reset").click(function () { if (confirm("Are you sure? The current position will be reset.")) PSim.init() });
});
// END PSIM CODE // 2511-2891 = 381 lines
// START QDR CODE // 2892-3141 = 249 lines
var QDR = {};
    QDR.totalTime = 0;
// Quadrominoes are based upon a 4x4 grid system. 
// The rotate() function allows for rotation of these pieces within the 4x4 grid.
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
    QDR.board = []; // The blocks that have already been placed.
    for (var i=0;i<QDR.limits[0];i++) {                       //
        var tempArr = [];                                     // Filling board[] with empty
        for (var j=0;j<QDR.limits[1];j++) tempArr.push(null); // values, representing clear space.
        QDR.board.push(tempArr);                              //
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
    var checked = new Array(QDR.board.length);
    var total = 0;
    for (var i=0;i<QDR.board.length;i++) {
        checked[i] = true;
        for (var j=0;j<QDR.board[i].length;j++) if (isNull(QDR.board[i][j])) checked[i] = false
        if (checked[i]) { QDR.removeRow(i); QDR.score += 1 }
    }
    return true;
}
QDR.removeRow = function (row) {
    QDR.board[row] = [QDR.limits[1]];
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
        if (t>0) {
            c++;
            a.push(t)
        }
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
            if (!isNull(QDR.board[i][j])) QDR.drawBlock(QDR.board[i][j], j, i);
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
    else return !isNull(QDR.board[y][x])
}
QDR.checkPiece = function (piece, x, y) {
    for (var i=0;i<4;i++)
        for (var j=0;j<4;j++)
            if (piece[i][j] && (x+i >= QDR.limits[1] || y+j >= QDR.limits[0] || x+i < 0 || y+j < 0 || QDR.checkBlock(x+i, y+j))) return true
    return false
}
$(function () {
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
// START FRACTAL CODE // 3142-3398 = 256 lines
var Complex = function (real, imaginary) { this.real = real; this.imaginary = imaginary; }
Complex.prototype.add = function (cNum) { return new Complex(this.real + cNum.real, this.imaginary + cNum.imaginary); }
Complex.prototype.multiply = function (c0) {
    return new Complex(this.real*c0.real - this.imaginary*c0.imaginary, 
            this.real*c0.imaginary + this.imaginary*c0.real);
}
var CmpCvs = {};
CmpCvs.setup = function () {
    CmpCvs.HEIGHT = 300;
    CmpCvs.WIDTH = 300;
    CmpCvs.BOUNDARY = 600;
    CmpCvs.hue = 60;
    CmpCvs.roughness = 2;
    CmpCvs.mode = 1;
    CmpCvs.UPSCALE = 2;
    CmpCvs.$ = new Canvas2D("cmp-canvas");
    CmpCvs.$.translate(300, 300);
    CmpCvs.$_ = new Canvas2D("cmp-mouse");
    CmpCvs.$_.translate(300, 300);
    $("#cmp-factor").spinner({step:0.5,min:1,page:2});
    $("#cmp-maxiter").spinner({step:10,min:30,page:20});
    TBI.buttonToggle($("#cmp-tracking")[0], true);
    $(".cmp-jonly").hide();
}
CmpCvs.reset = function () {
    CmpCvs.asisIncrement = 1;
    CmpCvs.maxIter = 30;
    CmpCvs.factor = 110;
    CmpCvs.pan = [-0.75, 0];
    CmpCvs.spinners = true;
    TBI.buttonToggle($("#cmp-spinners")[0], CmpCvs.spinners);
    CmpCvs.tracking = true;
    TBI.buttonToggle($("#cmp-tracking")[0], CmpCvs.tracking);
    CmpCvs.jfunc = new Complex(0.3, 0.25);
    $("#cmp-asisinc").val(CmpCvs.asisIncrement);
    $("#cmp-maxiter").val(CmpCvs.maxIter);
    $("#cmp-factor").val(CmpCvs.factor.toString().length-1);
    $("#cmp-panx").val(CmpCvs.pan[0]);
    $("#cmp-pany").val(CmpCvs.pan[1]);
    $("#cmp-jreal").val(CmpCvs.jfunc.real);
    $("#cmp-jimaginary").val(CmpCvs.jfunc.imaginary);
    $("#cmp-panx").spinner({step:Math.pow(10,-(parseInt($("#cmp-factor").val())-1)),min:-2,max:2});
    $("#cmp-pany").spinner({step:Math.pow(10,-(parseInt($("#cmp-factor").val())-1)),min:-2,max:2});
}
CmpCvs.init = function () {
    CmpCvs.location = [0,0];
    CmpCvs.$.clearRect(-600, -600, 1200, 1200);
    if (Math.pow(10,-parseInt($("#cmp-factor").val())) <= 1e-6 && $("#cmp-pany").data("ui-spinner")) {
        $("#cmp-panx").spinner("destroy");
        $("#cmp-pany").spinner("destroy");
    } else if ($("#cmp-pany").data("ui-spinner") && CmpCvs.spinners) {
        $("#cmp-panx").spinner("option","step",Math.pow(10,-parseInt($("#cmp-factor").val())));
        $("#cmp-pany").spinner("option","step",Math.pow(10,-parseInt($("#cmp-factor").val())));
    } else if (CmpCvs.spinners) {
        $("#cmp-panx").spinner({step:Math.pow(10,-parseInt($("#cmp-factor").val())),min:-2,max:2});
        $("#cmp-pany").spinner({step:Math.pow(10,-parseInt($("#cmp-factor").val())),min:-2,max:2});
    }
    CmpCvs.analyse();
    TBI.timerClear("cmpPlane");
    TBI.timerSet("cmpPlane", 50, CmpCvs.loop);
    return new Date().getTime();
}
CmpCvs.loop = function () {
    CmpCvs.$_.clearRect(-600, -600, 1200, 1200);
    if (!CmpCvs.tracking) return false;
    CmpCvs.drawAxis();
    var f = CmpCvs.factor;
    if (CmpCvs.mode == 1) {
        var func = function (cmpvalue, comp) { return cmpvalue.multiply(cmpvalue).add(comp); }
        var cmp = new Complex(CmpCvs.location[0]/f, CmpCvs.location[1]/f);
        var fate = new Complex(0,0);
        CmpCvs.plot(fate, func(fate, cmp));
        for (var i=0;i<CmpCvs.maxIter;i++) {
            fate = func(fate, cmp);
            CmpCvs.plot(fate, func(fate, cmp));
        }
    } else {
        var cmp = new Complex(CmpCvs.location[0]/f, CmpCvs.location[1]/f);
        CmpCvs.plot(cmp, CmpCvs.func(cmp));
        for (var i=0;i<CmpCvs.maxIter;i++) {
            cmp = CmpCvs.func(cmp);
            CmpCvs.plot(cmp, CmpCvs.func(cmp));
        }
    }
    CmpCvs.drawCentre();
}
CmpCvs.drawAxis = function () {
    CmpCvs.$_.save();
    CmpCvs.$_.lineWidth = 2;
    var p = CmpCvs.pan, u = CmpCvs.UPSCALE;
    Canvas2D.path(CmpCvs.$_, {type:"stroke",style:"#333",path:[[-300,-p[1]*u],[300,-p[1]*u]]});
    Canvas2D.path(CmpCvs.$_, {type:"stroke",style:"#333",path:[[-p[0]*u,-300],[-p[0]*u,300]]});
    CmpCvs.$_.restore();
}
CmpCvs.drawCentre = function () {
    CmpCvs.$_.beginPath();
    CmpCvs.$_.fillStyle = "#333";
    CmpCvs.$_.arc(0,0,3,0,dtr(360),false);
    CmpCvs.$_.fill();
    CmpCvs.$_.closePath();
    CmpCvs.$_.beginPath();
    CmpCvs.$_.fillStyle = "#eee";
    CmpCvs.$_.arc(0,0,1,0,dtr(360), false);
    CmpCvs.$_.fill();
    CmpCvs.$_.closePath();
    CmpCvs.$.beginPath();
    CmpCvs.$.fillStyle = "#333";
    CmpCvs.$.arc(0,0,3,0,dtr(360),false);
    CmpCvs.$.fill();
    CmpCvs.$.closePath();
    CmpCvs.$.beginPath();
    CmpCvs.$.fillStyle = "#eee";
    CmpCvs.$.arc(0,0,1,0,dtr(360), false);
    CmpCvs.$.fill();
    CmpCvs.$.closePath();
}
CmpCvs.plot = function (cmp, cmp2) {
    CmpCvs.$_.lineWidth = 1;
    var f = CmpCvs.factor, p = CmpCvs.pan, u = CmpCvs.UPSCALE;
    var colour = "hsl("+((new Date().getTime()/8)%360)+",100%,50%)";
    Canvas2D.path(CmpCvs.$_,{type:"stroke",style:"#eee",path:[[(cmp.real*f-p[0])*u,(cmp.imaginary*f-p[1])*u],[(cmp2.real*f-p[0])*u,(cmp2.imaginary*f-p[1])*u]]});
}
CmpCvs.func = function (cmp) { 
    return cmp.multiply(cmp).add(CmpCvs.jfunc);
}
CmpCvs.conditions = function (cmp) {
    switch (CmpCvs.mode) {
        case 0: return CmpCvs.julia(cmp);
        case 1: return CmpCvs.mandelbrot(cmp);
    }
}
CmpCvs.isBounded = function (cmp) {
    if (isNaN(cmp.real)||isNaN(cmp.imaginary)) var result = false;
    else var result = !(Math.abs(cmp.real)>CmpCvs.BOUNDARY||Math.abs(cmp.imaginary)>CmpCvs.BOUNDARY);
    return result;
}
CmpCvs.mandelbrot = function (cmp) {
    var func = function (cmpvalue, comp) { return cmpvalue.multiply(cmpvalue).add(comp); };
    var fate = new Complex(0,0);
    for (var i=0;i<CmpCvs.maxIter;i++) {
        fate = func(fate, cmp);
        if (!CmpCvs.isBounded(fate)) return i;
    }
    return null;
}
CmpCvs.julia = function (cmp) {
    for (var i=0;i<CmpCvs.maxIter;i++) {
        cmp = CmpCvs.func(cmp);
        if (!CmpCvs.isBounded(cmp)) return i;
    }
    return null;
}
CmpCvs.analyse = function () {
    var f = CmpCvs.factor,
        h = CmpCvs.HEIGHT,
        w = CmpCvs.WIDTH,
        p = CmpCvs.pan,
        r = CmpCvs.hue,
        y = CmpCvs.roughness,
        a = CmpCvs.asisIncrement,
        u = CmpCvs.UPSCALE;
    p[0]*=f;
    p[1]*=f;
    for (var i=-h/2+p[0];i<h/2+p[0];i+=a) {
        for (var j=-w/2+p[1];j<w/2+p[1];j+=a) {
            var result = CmpCvs.conditions(new Complex(i/f,j/f));
            if (!isNull(result)) CmpCvs.$.fillStyle = "hsl("+-parseInt(((result+r)%360)*y)+",100%,50%)";
            else CmpCvs.$.fillStyle = "#000";
            CmpCvs.$.beginPath();
            CmpCvs.$.arc(i*u-p[0]*u,j*u-p[1]*u,a<1?1:a,0,dtr(360),false);
            CmpCvs.$.fill();
            CmpCvs.$.closePath();
        }
    }
    CmpCvs.drawCentre();
}
CmpCvs.validate = function () {
    var asisinc = $("#cmp-asisinc").val(),
        maxiter = $("#cmp-maxiter").val(),
        factor = $("#cmp-factor").val(),
        panx = $("#cmp-panx").val(),
        pany = $("#cmp-pany").val(),
        real = $("#cmp-jreal").val(),
        imaginary = $("#cmp-jimaginary").val(),
        code = 0,
        prefix = "Complex Plane validation error: ";
    if (isNull(asisinc) || isNull(maxiter) || isNull(factor) || isNull(panx) || isNull(pany) || (CmpCvs.mode == 0 && isNull(real) || isNull(imaginary))) code = 1;
    else if (isNaN(asisinc) || isNaN(maxiter) || isNaN(factor) || isNaN(panx) || isNaN(pany) || (CmpCvs.mode == 0 && isNaN(real) || isNaN(imaginary))) code = 2;
    else if (asisinc <= 0 || maxiter <= 0 || factor <= 0) code = 3;
    else if (asisinc < 0.3 || maxiter > 300 || factor > 15) code = 4;
    else if (asisinc > 10) code = 5;
    else if (parseInt(maxiter) != maxiter) code = 6;
    switch (code) {
        case 0: return true; break;
        case 1: TBI.error(prefix+"Null values are not allowed."); break;
        case 2: TBI.error(prefix+"Values have to be numbers."); break;
        case 3: TBI.error(prefix+"The increment, max iteration and factor have to be positive."); break;
        case 4: TBI.error(prefix+"The work required is too large."); break;
        case 5: TBI.error(prefix+"The analysis increment is too large for proper resolution."); break;
        case 6: TBI.error(prefix+"The maximum iteration has to be a positive integer."); break;
        default: TBI.error(prefix+"Unhandled exception."); break;
    }
    CmpCvs.reset();
    return false;
}
CmpCvs.generate = function (asis, maxiter, factor, panx, pany, real, imaginary) {
    CmpCvs.asisIncrement = asis;
    CmpCvs.maxIter = maxiter;
    CmpCvs.factor = factor;
    CmpCvs.pan[0] = panx;
    CmpCvs.pan[1] = pany;
    CmpCvs.jfunc.real = real;
    CmpCvs.jfunc.imaginary = imaginary;
    var beginTime = new Date().getTime();
    $("#cmp-generate").html("Generating...");
    TBI.timerSet("cmp-generation", 10, function () {
        try {
            var endTime = CmpCvs.init();
            var finalTime = endTime-beginTime;
            if (CmpCvs.mode == 1) $("#cmp-generate").html("Generate Mandelbrot Set");
            else $("#cmp-generate").html("Generate Julia Set");
            TBI.log("Completed in "+finalTime+"ms.");
        } catch (e) { TBI.error(e); }
        finally { TBI.timerClear("cmp-generation"); }
    });
}
$(function () {
    CmpCvs.setup();
    CmpCvs.reset();
    $("#cmp-mouse").mousemove(function (event) {
        var f = CmpCvs.factor, u = CmpCvs.UPSCALE;
        CmpCvs.location = [(event.offsetX-300+(CmpCvs.pan[0]*u))/u, (event.offsetY-300+(CmpCvs.pan[1]*u))/u];
    });
    $("#cmp-mouse").click(function () {
        var f = CmpCvs.factor;
        TBI.buttonToggle($("#cmp-spinners")[0],false);
        CmpCvs.spinners = false;
        $("#cmp-panx").val(CmpCvs.location[0]/f);
        $("#cmp-pany").val(CmpCvs.location[1]/f);
        if (!CmpCvs.validate()) return false;
        else CmpCvs.generate(parseFloat($("#cmp-asisinc").val()),
                parseInt($("#cmp-maxiter").val()),
                Math.pow(10,parseFloat($("#cmp-factor").val())),
                parseFloat($("#cmp-panx").val()),
                parseFloat($("#cmp-pany").val()),
                parseFloat($("#cmp-jreal").val()),
                parseFloat($("#cmp-jimaginary").val()));
    });
    $("#cmp-lquality").click(function () { $("#cmp-asisinc").val("1"); });
    $("#cmp-mquality").click(function () { $("#cmp-asisinc").val("0.6"); });
    $("#cmp-hquality").click(function () { $("#cmp-asisinc").val("0.3"); });
    $("#cmp-ldetail").click(function () { $("#cmp-maxiter").val("20"); });
    $("#cmp-mdetail").click(function () { $("#cmp-maxiter").val("50"); });
    $("#cmp-hdetail").click(function () { $("#cmp-maxiter").val("80"); });
    $("#cmp-tracking").click(function () { CmpCvs.tracking = TBI.isButtonToggled(this); });
    $("#cmp-spinners").click(function () {
        CmpCvs.spinners = TBI.isButtonToggled(this);
        if (!isNull($("#cmp-maxiter").data("ui-spinner")) && !CmpCvs.spinners) $("#cmp-maxiter").spinner("destroy");
        else if (CmpCvs.spinners) $("#cmp-maxiter").spinner({step:10,min:30,page:20});
        if (!isNull($("#cmp-factor").data("ui-spinner")) && !CmpCvs.spinners) $("#cmp-factor").spinner("destroy");
        else if (CmpCvs.spinners) $("#cmp-factor").spinner({step:0.5,min:1,page:2});
        if (!isNull($("#cmp-panx").data("ui-spinner")) && !CmpCvs.spinners) $("#cmp-panx").spinner("destroy");
        else if (CmpCvs.spinners && Math.pow(10,-parseInt($("#cmp-factor").val())) > 1e-6) 
            $("#cmp-panx").spinner({step:Math.pow(10,-parseInt($("#cmp-factor").val())),min:-2,max:2});
        if (!isNull($("#cmp-pany").data("ui-spinner")) && !CmpCvs.spinners) $("#cmp-pany").spinner("destroy");
        else if (CmpCvs.spinners && Math.pow(10, -parseInt($("#cmp-factor").val())) > 1e-6)
            $("#cmp-pany").spinner({step:Math.pow(10,-parseInt($("#cmp-factor").val())),min:-2,max:2});
    });
    $("#cmp-mode").click(function () {
        CmpCvs.mode = CmpCvs.mode==0?1:0; 
        if (CmpCvs.mode == 0) {
            $(".cmp-jonly").show();
            $("#cmp-generate").html("Generate Julia Set");
            CmpCvs.reset();
            $("#cmp-panx").val(CmpCvs.pan[0] = 0);
        }
        else {
            $(".cmp-jonly").hide();
            $("#cmp-generate").html("Generate Mandelbrot Set");
            CmpCvs.reset();
        }
    });
    $("#cmp-generate").click(function () {
        if (!CmpCvs.validate()) return false;
        else CmpCvs.generate(parseFloat($("#cmp-asisinc").val()),
                parseInt($("#cmp-maxiter").val()),
                Math.pow(10,parseFloat($("#cmp-factor").val())),
                parseFloat($("#cmp-panx").val()),
                parseFloat($("#cmp-pany").val()),
                parseFloat($("#cmp-jreal").val()),
                parseFloat($("#cmp-jimaginary").val()));
    });
    $("#cmp-reset").click(function () {
        CmpCvs.reset();
    });
});
// END FRACTAL CODE //