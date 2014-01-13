var Grid = {};
Grid.count = 0;
Grid.colcount = 0;
Grid.hasSet = false;
Grid.width = $(".grid").css("width");
Grid.height = this.width;
Grid.cell = 0;
Grid.heightQuant = 0;
Grid.clicked = false;
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
                newText += "<div id='gridcell" + this.count + "' class='gridcell' style='width:" + height + "px;height:" + height + "px;'></div>";
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
            if (i % 2 == 0) {
                $("#gridcell" + i).css("backgroundColor", colour1);
            }
            else {
                $("#gridcell" + i).css("backgroundColor", colour2);
            }
        }
    }
};
Grid.middleRow = [];
Grid.rows = [];
Grid.columns = [];
// Sets width, height, rows and columns all at once.
// Called when grid is created.
Grid.setProperties = function () {
    if (Grid.heightQuant % 2 != 0) {
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
Grid.Animation = {};
Grid.Modify = {};
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
        if (i % 2 == 0) {
            Grid.Modify.single(Grid.rows[0][i], colour1);
        }
        else {
            Grid.Modify.single(Grid.rows[0][i], colour2);
        }
    }
    for (i = 0; i < Grid.colcount; i++) {
        if (i % 2 == 0) {
            Grid.Modify.single(Grid.columns[0][i], colour1);
        }
        else {
            Grid.Modify.single(Grid.columns[0][i], colour2);
        }
    }
    Grid.Status.print("> Created a scale with the colours " + colour1 + " and " + colour2 + ".");
}
Grid.Border = {};
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
Grid.Mouse = {};
// Returns the position of the cursor (unused).
Grid.Mouse.getPos = function () {
    $("#grid").click(function (event) {
        var topOffset = $("#grid").offset().top;
        var leftOffset = $("#grid").offset().left;
        var coords = [event.pageX, event.pageY];
        var adjust = [coords[0] - leftOffset, coords[1] - topOffset];
        var relative = [Math.floor(adjust[0] / Grid.cell), Math.floor(adjust[1] / Grid.cell)];
        if (Grid.columns[relative[0]]) { var index = Grid.columns[relative[0]][relative[1]]; }
        return index;
    });
}
Grid.Animation.Routine = {};
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
Grid.Layer = {};
Grid.layerCount = 0;
Grid.layers = [];
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
Grid.keepAlive = false;
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
Grid.Draw = {};
Grid.Draw.canDraw = false;
Grid.Draw.colour = "yellow";
Grid.Draw.interval = 0;
Grid.Draw.tool = "brush";
Grid.Draw.diameter = 3;
Grid.Draw.prevDiam = 3;
Grid.Draw.prevColours = [];
// Modifies a single point based on mouse position.
// Called automatically on mousedown event.
Grid.Draw.pencil = function (pageX, pageY) {
    if (pageX == undefined) {
        Grid.Mouse.getPos();
    }
    else {
        var topOffset = $("#grid").offset().top;
        var leftOffset = $("#grid").offset().left;
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
    var topOffset = $("#grid").offset().top;
    var leftOffset = $("#grid").offset().left;
    var coords = [pageX, pageY];
    var adjust = [coords[0] - leftOffset, coords[1] - topOffset];
    if (adjust[0] - radius < 0 || adjust[0] + radius > Grid.colcount || adjust[1] - radius < 0 || adjust[1] + radius > Grid.colcount) {
        return 0;
    }
    else {
        var relative = [Math.floor(adjust[0]/ Grid.cell), Math.floor(adjust[1] / Grid.cell)];
        if (Grid.columns[relative[0]]) { var index = Grid.columns[relative[0]][relative[1]]; }
        var radius = Math.floor(diameter / 2);
        if (diameter % 2 != 0) {
            Grid.Modify.rect(relative[0] - radius, relative[1] - radius, relative[0] + (radius), relative[1] + (radius), Grid.Draw.colour);
        }
        else {
            Grid.Modify.rect(relative[0] - (radius - 1), relative[1] - (radius - 1), relative[0] + (radius), relative[1] + (radius), Grid.Draw.colour);
        }
    }
}
Grid.Draw.inspect = function (x, y) {
	var topOffset = $("#grid").offset().top;
	var leftOffset = $("#grid").offset().left;
	var adjust = [x - leftOffset, y - topOffset];
	var relative = [Math.floor(adjust[0]/ Grid.cell), Math.floor(adjust[1] / Grid.cell)];
	var index = Grid.coords(relative[0], relative[1]);
	if (index != undefined || index != null) {
		var colour = $("#gridcell"+index).css("backgroundColor");
		new Popup(x+20,y+20,"Index: "+index,"Colour: "+colour)
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
	    if (Grid.Draw.prevColours.indexOf(Grid.Draw.colour) == -1 && (Grid.Draw.colour != "transparent" || Grid.Draw.colour != "rgba(0,0,0,0)"))
	        Grid.Draw.prevColours.push(Grid.Draw.colour);
	    Grid.Draw.colour = $(this).attr("title");
	    $("#gdrawcolour").val(Grid.Draw.colour);
	    Grid.Draw.updatePrevColours();
	});
}
Grid.Clear = {};
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
Grid.Clear.Border = {};
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
Grid.Status = {};
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
	timerSet("gsn", 50, function () {
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
	$("#grid").mousedown(function (event) {
	    Grid.Draw.canDraw = true;
	});
	$("#grid").mouseup(function () {
	    Grid.Draw.canDraw = false;
	    clearInterval(Grid.Draw.interval);
	});
	$("#grid").mousemove(function (event) {
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
	$("#txtengin").keydown(function (event) {
	    if (event.which == 13) {
	        txteng.command();
	    }
	});
	$("#calinner").css("height", (
        (parseInt($("#calendar").css("height"))
        - parseInt($("#calhead").css("height")))
        - parseInt($("#calinner").css("padding")) * 2)
        - parseInt($("#calinner").css("border")) * 2);
	Cdown.check(false);
});
// END GRID CODE //
// START CALENDAR CODE //
Calendar = {};
Calendar.monthLengths = [null, 31, 28, 31, 30, 31, 30, 31, 30, 31, 31, 30, 31];
Calendar.futureMonths = [];
Calendar.leapYear = false;
Calendar.year; Calendar.month; Calendar.day; Calendar.date; Calendar.monthlength;
Calendar.calcDate = function () {
    var now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth()+1;
    this.day = now.getDay();
    this.date = now.getDate();
    if (this.year % 4 == 0) {
        if (this.month = 2)
            this.monthlength = 29;
        this.leapYear = true;
    }
    else {
        this.monthlength = this.monthLengths[this.month];
    }
    var monthstart = new Date();
    var msMonth = monthstart.getMonth();
    monthstart.setDate(1);
    for (i = msMonth; i <= 12; i++) {
        var tempMonth = [];
        for (j = 1; j <= this.monthLengths[i]; j++) {
            var tempDay = new Date();
            tempDay.setDate(j);
            tempDay.setMonth(i);
            var tempday = tempDay.getDay();
            tempMonth.push(tempday);
        }
        this.futureMonths.push(tempMonth);
    }
}
Calendar.days = [];
Calendar.generate = function () {
    Calendar.calcDate();
    Calendar.width = parseInt($("#calinner").css("width"));
    Calendar.height = parseInt($("#calinner").css("height"));
    Calendar.cellWidth = parseInt(Calendar.width / 7);
	Calendar.weeks = Math.ceil(Calendar.monthlength/7);
    Calendar.cellHeight = parseInt(Calendar.height/Calendar.weeks);
    var count = 0;
    for (i = 0; i < 7; i++) {
        modifyHtml("calinner", "<div id='calcol" + i + "' class='calcol'>");
        for (j = 0 ; j < Calendar.weeks ; j++) {
            modifyHtml("calcol" + i, "<div id='calcell" + count + "' class='calcell'>");
            count++;
        }
    }
    $(".calcol").css("width", Calendar.cellWidth);
    $(".calcol").css("height", Calendar.height-4);
    $(".calcell").css("width", Calendar.cellWidth);
    $(".calcell").css("height", Calendar.cellHeight-4);
    $(".calcell").css("border", "2px solid black");
    for (i = 0; i < 7; i++) {
        var tempWeek = [];
        for (j = Calendar.weeks * i; j < Calendar.weeks * (i + 1) ; j++) {
			
        }
    }
}
// END CALENDAR CODE //
// START TXTENG CODE //
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
    " -=|            Welcome to tXtEng v0.2.1            |=- ",
    " -=|             CC-BY Thomas Bell 2013             |=- "
];
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
    for (i = 0; i < 6; i++) {
        console.log(this.cmd[i]);
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
]
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
txteng.Program = {};
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
timerSet("motd", 1000, function () { txteng.motdEcho(); timerClear("motd"); });
// END TXTENG CODE //
// START COUNTDOWN CODE //
var Cdown = {};
Cdown.rightNow = new Date();
Cdown.difference = new Date();
Cdown.diff = new Date();
Cdown.expand = true;
Cdown.dbugTime = [];
Cdown.prevSec;
Cdown.active = false;
Cdown.main = function (enddate, dest) {
    this.rightNow = new Date();
    var bStr = unixToString(enddate);
    var nStr = unixToString(this.rightNow);
    var cStr = unixToString(this.rightNow);
    offset = [null, 2100, 12, Calendar.monthLengths[parseInt(bStr[2])], 24, 60, 60];
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
timerSet("nw", 100, function () { Cdown.rightNow = new Date() });
Cdown.name = "";
Cdown.verifyInput = function () {
    var inYear = $("#cdsetyear").val(),
        inMonth = $("#cdsetmonth").val(),
        inDay = $("#cdsetday").val(),
        inHour = $("#cdsethour").val(),
        inMinute = $("#cdsetminute").val(),
        inSecond = $("#cdsetsecond").val();
    this.name = $("#cdsetname").val();
    var inCurrent = [];
    var inNow = unixToString(this.rightNow);
    var out = new Date();
    if (inYear <= inNow[1]) { inCurrent[1] = true }
    if (inMonth == inNow[2] && inCurrent[1]) { inCurrent[2] = true }
    if (inDay == inNow[3] && inCurrent[2]) { inCurrent[3] = true }
    if (inHour == inNow[4] && inCurrent[3]) { inCurrent[4] = true }
    if (inMinute == inNow[5] && inCurrent[4]) { inCurrent[5] = true }
    if (inYear == "" || inMonth == "" || inDay == "" || inHour == "" || inMinute == "" || inSecond == ""
        || isNaN(inYear) || isNaN(inMonth) || isNaN(inDay) || isNaN(inHour) || isNaN(inMinute) || isNaN(inSecond)) {
        alert("All fields must be filled.");
    }
    else if (inNow[1] > inYear || inYear > 2100) { alert("Year is invalid.") }
    else if (inCurrent[1] && inMonth < inNow[2]) { alert("Month set in past.") }
    else if (inCurrent[2] && inDay < inNow[3]) { alert("Day set in past.") }
    else if (inCurrent[3] && inHour < inNow[4]) { alert("Hour set in past.") }
    else if (inCurrent[4] && inMinute < inNow[5]) { alert("Minute set in past.") }
    else if (inCurrent[5] && inSecond < inNow[6]) { alert("Second set in past.") }
    else if (inMonth > 12 || inMonth < 1) { alert("Month is invalid.") }
    else if (inDay > Calendar.monthLengths[inNow[3]] || inDay < 1) { alert("Day is invalid.") }
    else if (inHour > 23 || inHour < 0) { alert("Hour is invalid.") }
    else if (inMinute > 59 || inMinute < 0) { alert("Minute is invalid.") }
    else if (inSecond > 59 || inSecond < 0) { alert("Second is invalid.") }
    else {
        out.setFullYear(inYear);
        out.setMonth(inMonth - 1);
        out.setDate(inDay);
        out.setHours(inHour);
        out.setMinutes(inMinute);
        out.setSeconds(inSecond);
        console.log("Input valid.");
        return out.getTime();
    }
    return false;
}
Cdown.check = function (bool) {
    var out = new Date();
    if (bool) {
        var input = this.verifyInput();
        if (input) {
            createCookie("cDown", input+","+this.name, 365);
            out.setTime(input);
            $("#cdown-full").attr("class", "cdown proto");
            $("#cdset").css("display", "none");
			$("#cd-fn-set").css("display", "none");
            $("#cdown-count").css("display", "inline-block");
            timerSet("cDown", 50, function () { Cdown.main(out, "cdown-count") });
            if (this.name != "") {
                $("#cdown-full h3")[0].innerHTML = "Countdown - " + this.name;
            }
        }
        else {
            $("#cdown-full").attr("class", "cdown cdset proto");
            $("#cdset").css("display", "inline");
			$("#cd-fn-set").css("display", "inline-block");
            $("#cdown-count").css("display", "none");
            $("#cdown-full h3")[0].innerHTML = "Countdown";
            timerClear("cDown");
        }
    }
    if (readCookie("cDown")) {
		var cookie = readCookie("cDown").split(",");
        out.setTime(cookie[0]);
		this.name = cookie[1];
        $("#cdown-full").attr("class", "cdown proto");
        $("#cdset").css("display", "none");
		$("#cd-fn-set").css("display", "none");
        $("#cdown-count").css("display", "block");
        timerSet("cDown", 50, function () { Cdown.main(out, "cdown-count") });
        if (this.name != "") {
            $("#cdown-full h3")[0].innerHTML = "Countdown - " + this.name;
        }
    }
    else {
        $("#cdown-full").attr("class", "cdown cdset proto");
        $("#cdset").css("display", "inline");
		$("#cd-fn-set").css("display", "inline-block");
        $("#cdown-count").css("display", "none");
        $("#cdown-full h3")[0].innerHTML = "Countdown";
        timerClear("cDown");
    }
    console.log("checkCdown called.");
}
Cdown.checkfn = function () {
	var fnYear = $("#cdfn-year").val(),
		fnMonth = $("#cdfn-month").val(),
		fnDay = $("#cdfn-day").val(),
		fnHour = $("#cdfn-hour").val(),
		fnMinute = $("#cdfn-minute").val(),
		fnSecond = $("#cdfn-second").val();
	if (isNaN(fnYear)||isNaN(fnMonth)||isNaN(fnDay)||isNaN(fnHour)||isNaN(fnMinute)||isNaN(fnSecond)||
fnYear==""||fnMonth==""||fnDay==""||fnHour==""||fnMinute==""||fnSecond=="") {
		alert("The values are invalid.");
	}
	else {
		var mLength = Calendar.monthLengths[unixToString(Cdown.rightNow)[2]];
		var out = 0;
		out += fnSecond*1000;
		out += fnMinute*1000*60;
		out += fnHour*1000*60*60;
		out += fnDay*1000*60*60*24;
		out += fnMonth*1000*60*60*24*mLength;
		out += fnYear*1000*60*60*24*mLength*12;
		out += Cdown.rightNow.getTime();
		this.name = $("#cdsetname").val();
		eraseCookie("cDown")
		createCookie("cDown", out+","+this.name, 365);
	}
}
$(function () {
	var cdInputs = $("#cdown-full input");
	timerSet("cdInputs",100,function () {
		for (i=1;i<cdInputs.length;i++) {
			if (isNaN(cdInputs[i].value)) {
				cdInputs[i].className = "inactive";
			}
			else {
				cdInputs[i].className = "";
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
	});
});
// END COUNTDOWN CODE //
