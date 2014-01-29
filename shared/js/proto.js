var Prototypes = [];
Prototypes[0] = ["grid", "Grid JavaScript Test", "1.5"];
Prototypes[1] = ["calendar", "Calendar", "0.6"];
Prototypes[2] = ["txteng", "tXtEng", "0.2.1"];
Prototypes[3] = ["cdown", "Countdown", "2.3.1"];
Prototypes[4] = ["calc", "Calculator", "0.8.1"];
Prototypes[5] = ["spaceshooter", "Space Shooter", "1.0", "spaceshooter"];
$(function () {
    for (i=0;i<Prototypes.length;i++) {
        var titleText = "";
        if (!isNull(Prototypes[i][3]))
            titleText += "<a href='"+Prototypes[i][3]+"'>";
        titleText += Prototypes[i][1];
        if (!isNull(Prototypes[i][3]))
            titleText += "</a>";
        $($("h2.proto, h3.proto")[i]).html(titleText);
        $($("h2.proto, h3.proto")[i]).attr("id",Prototypes[i][0]);
        $($(".version")[i]).html("Version "+Prototypes[i][2]);
    }
    if (!isNull(location.hash)&&!isNull($(location.hash))) {
        timerSet("scroll",0,function () {
            $(document).scrollTop(parseInt($(location.hash).offset().top - 52));
            timerClear("scroll");
        });
    }
});
// START GRID CODE //
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
        if (diameter % 2 != 0) {
            Grid.Modify.rect(relative[0] - radius, relative[1] - radius, relative[0] + (radius), relative[1] + (radius), Grid.Draw.colour);
        }
        else {
            Grid.Modify.rect(relative[0] - (radius - 1), relative[1] - (radius - 1), relative[0] + (radius), relative[1] + (radius), Grid.Draw.colour);
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
	$("#txtengin").keydown(function (event) {
	    if (event.which == 13) {
	        txteng.command();
	    }
	});
	Cdown.check(false);
});
// END GRID CODE //
// START CALENDAR CODE //
Calendar = {};
Calendar.weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
Calendar.months = [null, "January","Feburary","March","April","May","June","July","August",
    "September","October","November","December"];
Calendar.monthLengths = [null, 31, 28, 31, 30, 31, 30, 31, 30, 31, 31, 30, 31];
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
        Calendar.leapYear = true;
    }
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
    if (isNull(month)) {
        monthDate = new Date();
        month = monthDate.getMonth()+1;
    }
    if (isNull(year)) {
        yearDate = new Date();
        year = yearDate.getFullYear();
    }
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
        var tempItem = {};
        tempItem["year"] = refYear;
        tempItem["month"] = refMonth;
        tempItem["date"] = count+1;
        tempItemRow.push(tempItem);
        count++;
    }
    refYear = Calendar.year;
    refMonth = Calendar.month;
    count = 1;
    for (i=Calendar.firstDay;i<7;i++) {
        $("#calday"+i).html(count);
        var tempItem = {};
        tempItem["year"] = refYear;
        tempItem["month"] = refMonth;
        tempItem["date"] = count;
        tempItemRow.push(tempItem);
        count++;
    }
    Calendar.items.push(tempItemRow);
    for (i=1;i<Calendar.weeks-1;i++) {
        tempItemRow = [];
        for (j=0;j<7;j++) {
            $("#calday"+(j+i*7)).html(count.toString());
            var tempItem = {};
            tempItem["year"] = refYear;
            tempItem["month"] = refMonth;
            tempItem["date"] = count;
            tempItemRow.push(tempItem);
            count++;
        }
        Calendar.items.push(tempItemRow);
    }
    tempItemRow = [];
    for (i=0;i<=Calendar.lastDay;i++) {
        $("#calday"+(i+(Calendar.weeks-1)*7)).html(count.toString());
        var tempItem = {};
        tempItem["year"] = refYear;
        tempItem["month"] = refMonth;
        tempItem["date"] = count;
        tempItemRow.push(tempItem);
        count++;
    }
    count = 1;
    if (Calendar.month==12) {
        refYear++;
        refMonth = 1;
    }
    else
        refMonth++;
    for (i=Calendar.lastDay+1;i<7;i++) {
        $("#calday"+(i+(Calendar.weeks-1)*7)).html(count.toString());
        var tempItem = {};
        tempItem["year"] = refYear;
        tempItem["month"] = refMonth;
        tempItem["date"] = count;
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
            var selected = $(".calselect");
            for (ix=0;ix<selected.length;ix++)
                selected[ix].className = selected[ix].className.replace(" calselect", "");
            this.className += " calselect";
        } else if ($(".calselect").length > 0 && !event.ctrlKey && isSelected) {
            var selected = $(".calselect");
            for (ix=0;ix<selected.length;ix++)
                selected[ix].className = selected[ix].className.replace(" calselect", "");
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
	Calendar.generate(now.getFullYear(), now.getMonth()+1);
	$('#calcell'+Calendar.search(Calendar.year,Calendar.month,Calendar.date)).css('background','blue');
}
$(function () {
    $("#calcontmonth").click(function () {
        Calendar.generate();
    });
    Calendar.generate();
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
timerSet("motd", 1000, function () { $("#txtengarea").val(""); txteng.motdEcho(); timerClear("motd"); });
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
timerSet("nw", 100, function () { Cdown.rightNow = new Date() });
Cdown.verifyInput = function () {
    var inYear = $("#cdsetyear"),
        inMonth = $("#cdsetmonth"),
        inDay = $("#cdsetday"),
        inHour = $("#cdsethour"),
        inMinute = $("#cdsetminute"),
        inSecond = $("#cdsetsecond"),
        inArr = [inYear, inMonth, inDay, inHour, inMinute, inSecond];
        inArrValues = [inYear.val(), inMonth.val(), inDay.val(), inMinute.val(), inSecond.val()];
    if (Cdown.name != "Name")
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
            createCookie("cDown", input+","+this.name, 365);
            out.setTime(input);
            Cdown.set(out);
        }
        else
            Cdown.reset();
    }
    if (readCookie("cDown")) {
		var cookie = readCookie("cDown").split(",");
        out.setTime(cookie[0]);
		this.name = cookie[1];
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
        timerClear("cDown");
}
Cdown.set = function (out) {
    $("#cdown-full").attr("class", "cdown proto");
    $("#cdset").css("display", "none");
	$("#cd-fn-set").css("display", "none");
    $("#cdown-count").css("display", "inline-block");
    timerSet("cDown", 50, function () { Cdown.main(out, "cdown-count") });
    if (!isNull(this.name))
        $("#cdown-full h3")[0].innerHTML = "Countdown - " + this.name;
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
		this.name = $("#cdsetname").val();
		eraseCookie("cDown")
		createCookie("cDown", out+","+this.name, 365);
	}
}
$(function () {
	var cdInputs = $("#cdown-full input");
	timerSet("cdInputs",100,function () {
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
});
// END COUNTDOWN CODE //
// START CALC CODE //
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
    timerSet("calcwindow",1000,function () {
        if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)")
            $($("#calcwindow span")[0]).css("color", "#3AACFF");
        else
            $($("#calcwindow span")[0]).css("color", "transparent");
    });
    timerSet("calcstring",2,function () {
        if (Calc.inputMode)
            $($("#calcwindow input")[0]).val(Calc.string);
        else
            $($("#calcwindow span")[0]).html(Calc.string);
    });
    timerSet("calcstatuswindow",1000,function () {
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
                timerSet("calcwindow",1000,function () {
                    if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)")
                        $($("#calcwindow span")[0]).css("color", "#3AACFF");
                    else
                        $($("#calcwindow span")[0]).css("color", "transparent");
                });
            }
        } else {
            timerClear("calcwindow");
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
        if (!Calc.inputMode && isNull(calcwindow_timer)) { 
            Calc.string = "_";
            timerSet("calcwindow",1000,function () {
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
                Calc.answer = randomInt(Calc.numbers[0]);
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
        timerClear("calcwindow");
        $($("#calcwindow span")[0]).css("color", "#3AACFF");
        Calc.string = "";
    }
    if (Calc.answerShown) {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.numbers = [];
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
    timerClear("calcstatuswindow");
    $($("#calcstatus span")[0]).html(message);
    timerClear("statusReset");
    timerSet("statusReset",10000,function () {
        $($("#calcstatus span")[0]).html("_");
        timerClear("statusReset");
        timerSet("calcstatuswindow",1000,function () {
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
// END CALC CODE //