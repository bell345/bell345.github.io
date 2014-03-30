var Prototypes;
function fetchProtoIndex() {
    var xhr = new AJAX("/shared/data/work.json", function () {
        Prototypes = $.parseJSON(xhr.response).prototypes;
        setupPrototypes();
    });
}
function setupPrototypes() {
    for (i=0;i<Prototypes.length;i++) {
        var titleText = "";
        if (!isNull(Prototypes[i].link))
            titleText += "<a href='"+Prototypes[i].link+"'>";
        titleText += Prototypes[i].name;
        if (!isNull(Prototypes[i].link))
            titleText += "</a>";
        $($("h2.proto, h3.proto")[i]).html(titleText);
        $($("h2.proto, h3.proto")[i]).attr("id",Prototypes[i].id);
        $($(".version")[i]).html(Prototypes[i].version);
    }
}
$(function () {
    fetchProtoIndex();
    if (!isNull(location.hash) && !isNull($(location.hash))) {
        timerSet("scroll",10,function () {
            if (!isNull($(location.hash).offset())) {
                $(document).scrollTop(parseInt($(location.hash).offset().top - 52));
                timerClear("scroll");
            }
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
    else
        refMonth++;
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
    $(document).on("includesDone", function () {
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
        timerClear("cDown");
}
Cdown.set = function (out) {
    $("#cdown-full").attr("class", "cdown proto");
    $("#cdset").css("display", "none");
	$("#cd-fn-set").css("display", "none");
    $("#cdown-count").css("display", "inline-block");
    timerSet("cDown", 50, function () { Cdown.main(out, "cdown-count") });
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
    timerSet("calcstring",4,function () {
        if (Calc.inputMode)
            $($("#calcwindow input")[0]).val(Calc.string);
        else
            $($("#calcwindow span")[0]).html(Calc.string);
        if (Calc.statusLog.length > 20)
            Calc.statusLog.shift();
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
        timerClear("calcwindow");
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
    timerClear("calcstatuswindow");
    $($("#calcstatus span")[0]).html(message);
    $($("#calcstatus span")[0]).css("color","#3AACFF");
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
// START TTBL CODE //
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
    while (time[1] + minCount >= 59) {
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
            var xhr = new AJAX("/shared/data/ttb1.json", function () {
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
    Popup.registry.add($("#ttb-clear")[0], "Clear timetable", 
    "The 'Test timetable' button will be unavailable for a few seconds");
    $(".ttbs-mode").buttonset();
    if (!isNull(localStorage.TTBL2)) {
        try {
            $(".ttb-set textarea").val(JSON.stringify($.parseJSON(localStorage.TTBL2), null, 4));
        } catch (e) {
            new error("Error: "+e.message);
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
                error(e);
                localStorage.TTBL2 = localStorage.TTBL4;
                localStorage.removeItem("TTBL4");
            }
        }
    });
    $("#ttbs-hlnow").click(function () {
        var found = TTBL.find(now.getDay(), now.getHours(), now.getMinutes());
        TTBL.highlight(found[0], found[1]);
    });
    $("#ttbs-hlnow").trigger("click");
});
// END TTBL CODE //
// START CANVAS CODE //
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
    var modes = { "line" : "Line", "fill" : "Fill", "poly" : "Polygon", "rect" : "Rectangle", "qcurve" : "Quadratic curve", "bcurve" : "Bezier curve" };
    function changeMode(context, mode) {
        $("#cvs-mode").text(modes[mode]);
        context.mode = mode;
    }
/*  ctx.beginPath();
    ctx.strokeStyle = "#f77";
    ctx.arc(120,140,80,0,(Math.PI/180)*300,false);
    ctx.bezierCurveTo(70,120,80,130,230,240);
    ctx.stroke();
    ctx.fillStyle = "#51e";
    ctx.beginPath();
    ctx.moveTo(85,40);
    ctx.bezierCurveTo(75,38,70,25,50,25);
    ctx.bezierCurveTo(20,25,20,62.5,20,62.5);
    ctx.bezierCurveTo(20,80,40,102,75,120);
    ctx.bezierCurveTo(110,200,130,80,130,62.5);
    ctx.bezierCurveTo(130,62.5,130,25,100,25);
    ctx.bezierCurveTo(85,25,75,37,75,40);
    ctx.closePath();
    ctx.fill(); */
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
    ctx.globalCompositeOperation = "source-over";/*
    ctx.fillStyle = "rgba(200,235,255,0.5)";
    ctx.beginPath();
    ctx.rect(100,90,300,40);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = "black";
    ctx.font = "32px Open Sans";
    ctx.fillText("Hello to Canvas!",120,120); */
    var isFirst = true;
    var isControl = false;
    var stroke = true;
    var fill = true;
    var click = 0;
    ctx.beginPath();
    ctx.mode = "";
    ctx.setLineWidth(4);
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
    $("#cvs-width").keyup(function () { if (!isNaN($(this).val())) ctx.setLineWidth($(this).val()) });
    $("#cvs-width").mouseup(function () { if (!isNaN($(this).val())) ctx.setLineWidth($(this).val()) });
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
// END CANVAS CODE //
// sylvester.js, glUtils.js -- taken from MDN -- //
// START SYLVESTER AND GLUTILS //
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('9 17={3i:\'0.1.3\',16:1e-6};l v(){}v.23={e:l(i){8(i<1||i>7.4.q)?w:7.4[i-1]},2R:l(){8 7.4.q},1u:l(){8 F.1x(7.2u(7))},24:l(a){9 n=7.4.q;9 V=a.4||a;o(n!=V.q){8 1L}J{o(F.13(7.4[n-1]-V[n-1])>17.16){8 1L}}H(--n);8 2x},1q:l(){8 v.u(7.4)},1b:l(a){9 b=[];7.28(l(x,i){b.19(a(x,i))});8 v.u(b)},28:l(a){9 n=7.4.q,k=n,i;J{i=k-n;a(7.4[i],i+1)}H(--n)},2q:l(){9 r=7.1u();o(r===0){8 7.1q()}8 7.1b(l(x){8 x/r})},1C:l(a){9 V=a.4||a;9 n=7.4.q,k=n,i;o(n!=V.q){8 w}9 b=0,1D=0,1F=0;7.28(l(x,i){b+=x*V[i-1];1D+=x*x;1F+=V[i-1]*V[i-1]});1D=F.1x(1D);1F=F.1x(1F);o(1D*1F===0){8 w}9 c=b/(1D*1F);o(c<-1){c=-1}o(c>1){c=1}8 F.37(c)},1m:l(a){9 b=7.1C(a);8(b===w)?w:(b<=17.16)},34:l(a){9 b=7.1C(a);8(b===w)?w:(F.13(b-F.1A)<=17.16)},2k:l(a){9 b=7.2u(a);8(b===w)?w:(F.13(b)<=17.16)},2j:l(a){9 V=a.4||a;o(7.4.q!=V.q){8 w}8 7.1b(l(x,i){8 x+V[i-1]})},2C:l(a){9 V=a.4||a;o(7.4.q!=V.q){8 w}8 7.1b(l(x,i){8 x-V[i-1]})},22:l(k){8 7.1b(l(x){8 x*k})},x:l(k){8 7.22(k)},2u:l(a){9 V=a.4||a;9 i,2g=0,n=7.4.q;o(n!=V.q){8 w}J{2g+=7.4[n-1]*V[n-1]}H(--n);8 2g},2f:l(a){9 B=a.4||a;o(7.4.q!=3||B.q!=3){8 w}9 A=7.4;8 v.u([(A[1]*B[2])-(A[2]*B[1]),(A[2]*B[0])-(A[0]*B[2]),(A[0]*B[1])-(A[1]*B[0])])},2A:l(){9 m=0,n=7.4.q,k=n,i;J{i=k-n;o(F.13(7.4[i])>F.13(m)){m=7.4[i]}}H(--n);8 m},2Z:l(x){9 a=w,n=7.4.q,k=n,i;J{i=k-n;o(a===w&&7.4[i]==x){a=i+1}}H(--n);8 a},3g:l(){8 S.2X(7.4)},2d:l(){8 7.1b(l(x){8 F.2d(x)})},2V:l(x){8 7.1b(l(y){8(F.13(y-x)<=17.16)?x:y})},1o:l(a){o(a.K){8 a.1o(7)}9 V=a.4||a;o(V.q!=7.4.q){8 w}9 b=0,2b;7.28(l(x,i){2b=x-V[i-1];b+=2b*2b});8 F.1x(b)},3a:l(a){8 a.1h(7)},2T:l(a){8 a.1h(7)},1V:l(t,a){9 V,R,x,y,z;2S(7.4.q){27 2:V=a.4||a;o(V.q!=2){8 w}R=S.1R(t).4;x=7.4[0]-V[0];y=7.4[1]-V[1];8 v.u([V[0]+R[0][0]*x+R[0][1]*y,V[1]+R[1][0]*x+R[1][1]*y]);1I;27 3:o(!a.U){8 w}9 C=a.1r(7).4;R=S.1R(t,a.U).4;x=7.4[0]-C[0];y=7.4[1]-C[1];z=7.4[2]-C[2];8 v.u([C[0]+R[0][0]*x+R[0][1]*y+R[0][2]*z,C[1]+R[1][0]*x+R[1][1]*y+R[1][2]*z,C[2]+R[2][0]*x+R[2][1]*y+R[2][2]*z]);1I;2P:8 w}},1t:l(a){o(a.K){9 P=7.4.2O();9 C=a.1r(P).4;8 v.u([C[0]+(C[0]-P[0]),C[1]+(C[1]-P[1]),C[2]+(C[2]-(P[2]||0))])}1d{9 Q=a.4||a;o(7.4.q!=Q.q){8 w}8 7.1b(l(x,i){8 Q[i-1]+(Q[i-1]-x)})}},1N:l(){9 V=7.1q();2S(V.4.q){27 3:1I;27 2:V.4.19(0);1I;2P:8 w}8 V},2n:l(){8\'[\'+7.4.2K(\', \')+\']\'},26:l(a){7.4=(a.4||a).2O();8 7}};v.u=l(a){9 V=25 v();8 V.26(a)};v.i=v.u([1,0,0]);v.j=v.u([0,1,0]);v.k=v.u([0,0,1]);v.2J=l(n){9 a=[];J{a.19(F.2F())}H(--n);8 v.u(a)};v.1j=l(n){9 a=[];J{a.19(0)}H(--n);8 v.u(a)};l S(){}S.23={e:l(i,j){o(i<1||i>7.4.q||j<1||j>7.4[0].q){8 w}8 7.4[i-1][j-1]},33:l(i){o(i>7.4.q){8 w}8 v.u(7.4[i-1])},2E:l(j){o(j>7.4[0].q){8 w}9 a=[],n=7.4.q,k=n,i;J{i=k-n;a.19(7.4[i][j-1])}H(--n);8 v.u(a)},2R:l(){8{2D:7.4.q,1p:7.4[0].q}},2D:l(){8 7.4.q},1p:l(){8 7.4[0].q},24:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(7.4.q!=M.q||7.4[0].q!=M[0].q){8 1L}9 b=7.4.q,15=b,i,G,10=7.4[0].q,j;J{i=15-b;G=10;J{j=10-G;o(F.13(7.4[i][j]-M[i][j])>17.16){8 1L}}H(--G)}H(--b);8 2x},1q:l(){8 S.u(7.4)},1b:l(a){9 b=[],12=7.4.q,15=12,i,G,10=7.4[0].q,j;J{i=15-12;G=10;b[i]=[];J{j=10-G;b[i][j]=a(7.4[i][j],i+1,j+1)}H(--G)}H(--12);8 S.u(b)},2i:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}8(7.4.q==M.q&&7.4[0].q==M[0].q)},2j:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(!7.2i(M)){8 w}8 7.1b(l(x,i,j){8 x+M[i-1][j-1]})},2C:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(!7.2i(M)){8 w}8 7.1b(l(x,i,j){8 x-M[i-1][j-1]})},2B:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}8(7.4[0].q==M.q)},22:l(a){o(!a.4){8 7.1b(l(x){8 x*a})}9 b=a.1u?2x:1L;9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}o(!7.2B(M)){8 w}9 d=7.4.q,15=d,i,G,10=M[0].q,j;9 e=7.4[0].q,4=[],21,20,c;J{i=15-d;4[i]=[];G=10;J{j=10-G;21=0;20=e;J{c=e-20;21+=7.4[i][c]*M[c][j]}H(--20);4[i][j]=21}H(--G)}H(--d);9 M=S.u(4);8 b?M.2E(1):M},x:l(a){8 7.22(a)},32:l(a,b,c,d){9 e=[],12=c,i,G,j;9 f=7.4.q,1p=7.4[0].q;J{i=c-12;e[i]=[];G=d;J{j=d-G;e[i][j]=7.4[(a+i-1)%f][(b+j-1)%1p]}H(--G)}H(--12);8 S.u(e)},31:l(){9 a=7.4.q,1p=7.4[0].q;9 b=[],12=1p,i,G,j;J{i=1p-12;b[i]=[];G=a;J{j=a-G;b[i][j]=7.4[j][i]}H(--G)}H(--12);8 S.u(b)},1y:l(){8(7.4.q==7.4[0].q)},2A:l(){9 m=0,12=7.4.q,15=12,i,G,10=7.4[0].q,j;J{i=15-12;G=10;J{j=10-G;o(F.13(7.4[i][j])>F.13(m)){m=7.4[i][j]}}H(--G)}H(--12);8 m},2Z:l(x){9 a=w,12=7.4.q,15=12,i,G,10=7.4[0].q,j;J{i=15-12;G=10;J{j=10-G;o(7.4[i][j]==x){8{i:i+1,j:j+1}}}H(--G)}H(--12);8 w},30:l(){o(!7.1y){8 w}9 a=[],n=7.4.q,k=n,i;J{i=k-n;a.19(7.4[i][i])}H(--n);8 v.u(a)},1K:l(){9 M=7.1q(),1c;9 n=7.4.q,k=n,i,1s,1n=7.4[0].q,p;J{i=k-n;o(M.4[i][i]==0){2e(j=i+1;j<k;j++){o(M.4[j][i]!=0){1c=[];1s=1n;J{p=1n-1s;1c.19(M.4[i][p]+M.4[j][p])}H(--1s);M.4[i]=1c;1I}}}o(M.4[i][i]!=0){2e(j=i+1;j<k;j++){9 a=M.4[j][i]/M.4[i][i];1c=[];1s=1n;J{p=1n-1s;1c.19(p<=i?0:M.4[j][p]-M.4[i][p]*a)}H(--1s);M.4[j]=1c}}}H(--n);8 M},3h:l(){8 7.1K()},2z:l(){o(!7.1y()){8 w}9 M=7.1K();9 a=M.4[0][0],n=M.4.q-1,k=n,i;J{i=k-n+1;a=a*M.4[i][i]}H(--n);8 a},3f:l(){8 7.2z()},2y:l(){8(7.1y()&&7.2z()===0)},2Y:l(){o(!7.1y()){8 w}9 a=7.4[0][0],n=7.4.q-1,k=n,i;J{i=k-n+1;a+=7.4[i][i]}H(--n);8 a},3e:l(){8 7.2Y()},1Y:l(){9 M=7.1K(),1Y=0;9 a=7.4.q,15=a,i,G,10=7.4[0].q,j;J{i=15-a;G=10;J{j=10-G;o(F.13(M.4[i][j])>17.16){1Y++;1I}}H(--G)}H(--a);8 1Y},3d:l(){8 7.1Y()},2W:l(a){9 M=a.4||a;o(1g(M[0][0])==\'1f\'){M=S.u(M).4}9 T=7.1q(),1p=T.4[0].q;9 b=T.4.q,15=b,i,G,10=M[0].q,j;o(b!=M.q){8 w}J{i=15-b;G=10;J{j=10-G;T.4[i][1p+j]=M[i][j]}H(--G)}H(--b);8 T},2w:l(){o(!7.1y()||7.2y()){8 w}9 a=7.4.q,15=a,i,j;9 M=7.2W(S.I(a)).1K();9 b,1n=M.4[0].q,p,1c,2v;9 c=[],2c;J{i=a-1;1c=[];b=1n;c[i]=[];2v=M.4[i][i];J{p=1n-b;2c=M.4[i][p]/2v;1c.19(2c);o(p>=15){c[i].19(2c)}}H(--b);M.4[i]=1c;2e(j=0;j<i;j++){1c=[];b=1n;J{p=1n-b;1c.19(M.4[j][p]-M.4[i][p]*M.4[j][i])}H(--b);M.4[j]=1c}}H(--a);8 S.u(c)},3c:l(){8 7.2w()},2d:l(){8 7.1b(l(x){8 F.2d(x)})},2V:l(x){8 7.1b(l(p){8(F.13(p-x)<=17.16)?x:p})},2n:l(){9 a=[];9 n=7.4.q,k=n,i;J{i=k-n;a.19(v.u(7.4[i]).2n())}H(--n);8 a.2K(\'\\n\')},26:l(a){9 i,4=a.4||a;o(1g(4[0][0])!=\'1f\'){9 b=4.q,15=b,G,10,j;7.4=[];J{i=15-b;G=4[i].q;10=G;7.4[i]=[];J{j=10-G;7.4[i][j]=4[i][j]}H(--G)}H(--b);8 7}9 n=4.q,k=n;7.4=[];J{i=k-n;7.4.19([4[i]])}H(--n);8 7}};S.u=l(a){9 M=25 S();8 M.26(a)};S.I=l(n){9 a=[],k=n,i,G,j;J{i=k-n;a[i]=[];G=k;J{j=k-G;a[i][j]=(i==j)?1:0}H(--G)}H(--n);8 S.u(a)};S.2X=l(a){9 n=a.q,k=n,i;9 M=S.I(n);J{i=k-n;M.4[i][i]=a[i]}H(--n);8 M};S.1R=l(b,a){o(!a){8 S.u([[F.1H(b),-F.1G(b)],[F.1G(b),F.1H(b)]])}9 d=a.1q();o(d.4.q!=3){8 w}9 e=d.1u();9 x=d.4[0]/e,y=d.4[1]/e,z=d.4[2]/e;9 s=F.1G(b),c=F.1H(b),t=1-c;8 S.u([[t*x*x+c,t*x*y-s*z,t*x*z+s*y],[t*x*y+s*z,t*y*y+c,t*y*z-s*x],[t*x*z-s*y,t*y*z+s*x,t*z*z+c]])};S.3b=l(t){9 c=F.1H(t),s=F.1G(t);8 S.u([[1,0,0],[0,c,-s],[0,s,c]])};S.39=l(t){9 c=F.1H(t),s=F.1G(t);8 S.u([[c,0,s],[0,1,0],[-s,0,c]])};S.38=l(t){9 c=F.1H(t),s=F.1G(t);8 S.u([[c,-s,0],[s,c,0],[0,0,1]])};S.2J=l(n,m){8 S.1j(n,m).1b(l(){8 F.2F()})};S.1j=l(n,m){9 a=[],12=n,i,G,j;J{i=n-12;a[i]=[];G=m;J{j=m-G;a[i][j]=0}H(--G)}H(--12);8 S.u(a)};l 14(){}14.23={24:l(a){8(7.1m(a)&&7.1h(a.K))},1q:l(){8 14.u(7.K,7.U)},2U:l(a){9 V=a.4||a;8 14.u([7.K.4[0]+V[0],7.K.4[1]+V[1],7.K.4[2]+(V[2]||0)],7.U)},1m:l(a){o(a.W){8 a.1m(7)}9 b=7.U.1C(a.U);8(F.13(b)<=17.16||F.13(b-F.1A)<=17.16)},1o:l(a){o(a.W){8 a.1o(7)}o(a.U){o(7.1m(a)){8 7.1o(a.K)}9 N=7.U.2f(a.U).2q().4;9 A=7.K.4,B=a.K.4;8 F.13((A[0]-B[0])*N[0]+(A[1]-B[1])*N[1]+(A[2]-B[2])*N[2])}1d{9 P=a.4||a;9 A=7.K.4,D=7.U.4;9 b=P[0]-A[0],2a=P[1]-A[1],29=(P[2]||0)-A[2];9 c=F.1x(b*b+2a*2a+29*29);o(c===0)8 0;9 d=(b*D[0]+2a*D[1]+29*D[2])/c;9 e=1-d*d;8 F.13(c*F.1x(e<0?0:e))}},1h:l(a){9 b=7.1o(a);8(b!==w&&b<=17.16)},2T:l(a){8 a.1h(7)},1v:l(a){o(a.W){8 a.1v(7)}8(!7.1m(a)&&7.1o(a)<=17.16)},1U:l(a){o(a.W){8 a.1U(7)}o(!7.1v(a)){8 w}9 P=7.K.4,X=7.U.4,Q=a.K.4,Y=a.U.4;9 b=X[0],1z=X[1],1B=X[2],1T=Y[0],1S=Y[1],1M=Y[2];9 c=P[0]-Q[0],2s=P[1]-Q[1],2r=P[2]-Q[2];9 d=-b*c-1z*2s-1B*2r;9 e=1T*c+1S*2s+1M*2r;9 f=b*b+1z*1z+1B*1B;9 g=1T*1T+1S*1S+1M*1M;9 h=b*1T+1z*1S+1B*1M;9 k=(d*g/f+h*e)/(g-h*h);8 v.u([P[0]+k*b,P[1]+k*1z,P[2]+k*1B])},1r:l(a){o(a.U){o(7.1v(a)){8 7.1U(a)}o(7.1m(a)){8 w}9 D=7.U.4,E=a.U.4;9 b=D[0],1l=D[1],1k=D[2],1P=E[0],1O=E[1],1Q=E[2];9 x=(1k*1P-b*1Q),y=(b*1O-1l*1P),z=(1l*1Q-1k*1O);9 N=v.u([x*1Q-y*1O,y*1P-z*1Q,z*1O-x*1P]);9 P=11.u(a.K,N);8 P.1U(7)}1d{9 P=a.4||a;o(7.1h(P)){8 v.u(P)}9 A=7.K.4,D=7.U.4;9 b=D[0],1l=D[1],1k=D[2],1w=A[0],18=A[1],1a=A[2];9 x=b*(P[1]-18)-1l*(P[0]-1w),y=1l*((P[2]||0)-1a)-1k*(P[1]-18),z=1k*(P[0]-1w)-b*((P[2]||0)-1a);9 V=v.u([1l*x-1k*z,1k*y-b*x,b*z-1l*y]);9 k=7.1o(P)/V.1u();8 v.u([P[0]+V.4[0]*k,P[1]+V.4[1]*k,(P[2]||0)+V.4[2]*k])}},1V:l(t,a){o(1g(a.U)==\'1f\'){a=14.u(a.1N(),v.k)}9 R=S.1R(t,a.U).4;9 C=a.1r(7.K).4;9 A=7.K.4,D=7.U.4;9 b=C[0],1E=C[1],1J=C[2],1w=A[0],18=A[1],1a=A[2];9 x=1w-b,y=18-1E,z=1a-1J;8 14.u([b+R[0][0]*x+R[0][1]*y+R[0][2]*z,1E+R[1][0]*x+R[1][1]*y+R[1][2]*z,1J+R[2][0]*x+R[2][1]*y+R[2][2]*z],[R[0][0]*D[0]+R[0][1]*D[1]+R[0][2]*D[2],R[1][0]*D[0]+R[1][1]*D[1]+R[1][2]*D[2],R[2][0]*D[0]+R[2][1]*D[1]+R[2][2]*D[2]])},1t:l(a){o(a.W){9 A=7.K.4,D=7.U.4;9 b=A[0],18=A[1],1a=A[2],2N=D[0],1l=D[1],1k=D[2];9 c=7.K.1t(a).4;9 d=b+2N,2h=18+1l,2o=1a+1k;9 Q=a.1r([d,2h,2o]).4;9 e=[Q[0]+(Q[0]-d)-c[0],Q[1]+(Q[1]-2h)-c[1],Q[2]+(Q[2]-2o)-c[2]];8 14.u(c,e)}1d o(a.U){8 7.1V(F.1A,a)}1d{9 P=a.4||a;8 14.u(7.K.1t([P[0],P[1],(P[2]||0)]),7.U)}},1Z:l(a,b){a=v.u(a);b=v.u(b);o(a.4.q==2){a.4.19(0)}o(b.4.q==2){b.4.19(0)}o(a.4.q>3||b.4.q>3){8 w}9 c=b.1u();o(c===0){8 w}7.K=a;7.U=v.u([b.4[0]/c,b.4[1]/c,b.4[2]/c]);8 7}};14.u=l(a,b){9 L=25 14();8 L.1Z(a,b)};14.X=14.u(v.1j(3),v.i);14.Y=14.u(v.1j(3),v.j);14.Z=14.u(v.1j(3),v.k);l 11(){}11.23={24:l(a){8(7.1h(a.K)&&7.1m(a))},1q:l(){8 11.u(7.K,7.W)},2U:l(a){9 V=a.4||a;8 11.u([7.K.4[0]+V[0],7.K.4[1]+V[1],7.K.4[2]+(V[2]||0)],7.W)},1m:l(a){9 b;o(a.W){b=7.W.1C(a.W);8(F.13(b)<=17.16||F.13(F.1A-b)<=17.16)}1d o(a.U){8 7.W.2k(a.U)}8 w},2k:l(a){9 b=7.W.1C(a.W);8(F.13(F.1A/2-b)<=17.16)},1o:l(a){o(7.1v(a)||7.1h(a)){8 0}o(a.K){9 A=7.K.4,B=a.K.4,N=7.W.4;8 F.13((A[0]-B[0])*N[0]+(A[1]-B[1])*N[1]+(A[2]-B[2])*N[2])}1d{9 P=a.4||a;9 A=7.K.4,N=7.W.4;8 F.13((A[0]-P[0])*N[0]+(A[1]-P[1])*N[1]+(A[2]-(P[2]||0))*N[2])}},1h:l(a){o(a.W){8 w}o(a.U){8(7.1h(a.K)&&7.1h(a.K.2j(a.U)))}1d{9 P=a.4||a;9 A=7.K.4,N=7.W.4;9 b=F.13(N[0]*(A[0]-P[0])+N[1]*(A[1]-P[1])+N[2]*(A[2]-(P[2]||0)));8(b<=17.16)}},1v:l(a){o(1g(a.U)==\'1f\'&&1g(a.W)==\'1f\'){8 w}8!7.1m(a)},1U:l(a){o(!7.1v(a)){8 w}o(a.U){9 A=a.K.4,D=a.U.4,P=7.K.4,N=7.W.4;9 b=(N[0]*(P[0]-A[0])+N[1]*(P[1]-A[1])+N[2]*(P[2]-A[2]))/(N[0]*D[0]+N[1]*D[1]+N[2]*D[2]);8 v.u([A[0]+D[0]*b,A[1]+D[1]*b,A[2]+D[2]*b])}1d o(a.W){9 c=7.W.2f(a.W).2q();9 N=7.W.4,A=7.K.4,O=a.W.4,B=a.K.4;9 d=S.1j(2,2),i=0;H(d.2y()){i++;d=S.u([[N[i%3],N[(i+1)%3]],[O[i%3],O[(i+1)%3]]])}9 e=d.2w().4;9 x=N[0]*A[0]+N[1]*A[1]+N[2]*A[2];9 y=O[0]*B[0]+O[1]*B[1]+O[2]*B[2];9 f=[e[0][0]*x+e[0][1]*y,e[1][0]*x+e[1][1]*y];9 g=[];2e(9 j=1;j<=3;j++){g.19((i==j)?0:f[(j+(5-i)%3)%3])}8 14.u(g,c)}},1r:l(a){9 P=a.4||a;9 A=7.K.4,N=7.W.4;9 b=(A[0]-P[0])*N[0]+(A[1]-P[1])*N[1]+(A[2]-(P[2]||0))*N[2];8 v.u([P[0]+N[0]*b,P[1]+N[1]*b,(P[2]||0)+N[2]*b])},1V:l(t,a){9 R=S.1R(t,a.U).4;9 C=a.1r(7.K).4;9 A=7.K.4,N=7.W.4;9 b=C[0],1E=C[1],1J=C[2],1w=A[0],18=A[1],1a=A[2];9 x=1w-b,y=18-1E,z=1a-1J;8 11.u([b+R[0][0]*x+R[0][1]*y+R[0][2]*z,1E+R[1][0]*x+R[1][1]*y+R[1][2]*z,1J+R[2][0]*x+R[2][1]*y+R[2][2]*z],[R[0][0]*N[0]+R[0][1]*N[1]+R[0][2]*N[2],R[1][0]*N[0]+R[1][1]*N[1]+R[1][2]*N[2],R[2][0]*N[0]+R[2][1]*N[1]+R[2][2]*N[2]])},1t:l(a){o(a.W){9 A=7.K.4,N=7.W.4;9 b=A[0],18=A[1],1a=A[2],2M=N[0],2L=N[1],2Q=N[2];9 c=7.K.1t(a).4;9 d=b+2M,2p=18+2L,2m=1a+2Q;9 Q=a.1r([d,2p,2m]).4;9 e=[Q[0]+(Q[0]-d)-c[0],Q[1]+(Q[1]-2p)-c[1],Q[2]+(Q[2]-2m)-c[2]];8 11.u(c,e)}1d o(a.U){8 7.1V(F.1A,a)}1d{9 P=a.4||a;8 11.u(7.K.1t([P[0],P[1],(P[2]||0)]),7.W)}},1Z:l(a,b,c){a=v.u(a);a=a.1N();o(a===w){8 w}b=v.u(b);b=b.1N();o(b===w){8 w}o(1g(c)==\'1f\'){c=w}1d{c=v.u(c);c=c.1N();o(c===w){8 w}}9 d=a.4[0],18=a.4[1],1a=a.4[2];9 e=b.4[0],1W=b.4[1],1X=b.4[2];9 f,1i;o(c!==w){9 g=c.4[0],2l=c.4[1],2t=c.4[2];f=v.u([(1W-18)*(2t-1a)-(1X-1a)*(2l-18),(1X-1a)*(g-d)-(e-d)*(2t-1a),(e-d)*(2l-18)-(1W-18)*(g-d)]);1i=f.1u();o(1i===0){8 w}f=v.u([f.4[0]/1i,f.4[1]/1i,f.4[2]/1i])}1d{1i=F.1x(e*e+1W*1W+1X*1X);o(1i===0){8 w}f=v.u([b.4[0]/1i,b.4[1]/1i,b.4[2]/1i])}7.K=a;7.W=f;8 7}};11.u=l(a,b,c){9 P=25 11();8 P.1Z(a,b,c)};11.2I=11.u(v.1j(3),v.k);11.2H=11.u(v.1j(3),v.i);11.2G=11.u(v.1j(3),v.j);11.36=11.2I;11.35=11.2H;11.3j=11.2G;9 $V=v.u;9 $M=S.u;9 $L=14.u;9 $P=11.u;',62,206,'||||elements|||this|return|var||||||||||||function|||if||length||||create|Vector|null|||||||||Math|nj|while||do|anchor||||||||Matrix||direction||normal||||kj|Plane|ni|abs|Line|ki|precision|Sylvester|A2|push|A3|map|els|else||undefined|typeof|contains|mod|Zero|D3|D2|isParallelTo|kp|distanceFrom|cols|dup|pointClosestTo|np|reflectionIn|modulus|intersects|A1|sqrt|isSquare|X2|PI|X3|angleFrom|mod1|C2|mod2|sin|cos|break|C3|toRightTriangular|false|Y3|to3D|E2|E1|E3|Rotation|Y2|Y1|intersectionWith|rotate|v12|v13|rank|setVectors|nc|sum|multiply|prototype|eql|new|setElements|case|each|PA3|PA2|part|new_element|round|for|cross|product|AD2|isSameSizeAs|add|isPerpendicularTo|v22|AN3|inspect|AD3|AN2|toUnitVector|PsubQ3|PsubQ2|v23|dot|divisor|inverse|true|isSingular|determinant|max|canMultiplyFromLeft|subtract|rows|col|random|ZX|YZ|XY|Random|join|N2|N1|D1|slice|default|N3|dimensions|switch|liesIn|translate|snapTo|augment|Diagonal|trace|indexOf|diagonal|transpose|minor|row|isAntiparallelTo|ZY|YX|acos|RotationZ|RotationY|liesOn|RotationX|inv|rk|tr|det|toDiagonalMatrix|toUpperTriangular|version|XZ'.split('|'),0,{}));
Matrix.Translation = function (v) {
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }
  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }
  throw "Invalid length for Translation";
}
Matrix.prototype.flatten = function () {
    var result = [];
    if (this.elements.length == 0)
        return [];
    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
}
Matrix.prototype.ensure4x4 = function () {
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;
    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;
    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++) {
            if (i == j)
                this.elements[i].push(1);
            else
                this.elements[i].push(0);
        }
    }
    for (var i = this.elements.length; i < 4; i++) {
        if (i == 0)
            this.elements.push([1, 0, 0, 0]);
        else if (i == 1)
            this.elements.push([0, 1, 0, 0]);
        else if (i == 2)
            this.elements.push([0, 0, 1, 0]);
        else if (i == 3)
            this.elements.push([0, 0, 0, 1]);
    }
    return this;
};

Matrix.prototype.make3x3 = function () {
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
        return null;
    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};
Vector.prototype.flatten = function () { return this.elements; };
function mht(m) {
    var s = "";
    if (m.length == 16) {
        for (var i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (var i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
}
function makeLookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);
    var mag;
    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();
    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);
    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
}
function makeOrtho(left, right, bottom, top, znear, zfar) {
    var tx = -(right+left)/(right-left);
    var ty = -(top+bottom)/(top-bottom);
    var tz = -(zfar+znear)/(zfar-znear);
    return $M([[2/(right-left), 0, 0, tx],
               [0, 2/(top-bottom), 0, ty],
               [0, 0, -2/(zfar-znear), tz],
               [0, 0, 0, 1]]);
}
function makePerspective(fovy, aspect, znear, zfar) {
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;
    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}
function makeFrustum(left, right, bottom, top, znear, zfar) {
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);
    return $M([[X, 0, A, 0], [0, Y, B, 0], [0, 0, C, D], [0, 0, -1, 0]]);
}
function makeOrtho(left, right, bottom, top, znear, zfar) {
    var tx = - (right + left) / (right - left);
    var ty = - (top + bottom) / (top - bottom);
    var tz = - (zfar + znear) / (zfar - znear);
    return $M([[2 / (right - left), 0, 0, tx], 
            [0, 2 / (top - bottom), 0, ty], 
            [0, 0, -2 / (zfar - znear), tz],
            [0, 0, 0, 1]]);
}
// END SYLVESTER AND GLUTILS //
// START GL CODE //
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
    if (!isNull(gl)) {
        gl.clearColor(0.8, 0.8, 0.8, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }
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
        error("Init shader error.");
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
        error("Shader error: "+gl.getShaderInfoLog(shader));
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
    if (!GLTest.mvMtxStack.length) error("Empty matrix stack.");
    GLTest.mvMatrix = GLTest.mvMtxStack.pop();
    return GLTest.mvMatrix;
}
GLTest.mvRotate = function (angle, v) {
    var radians = dtr(angle);
    var m = Matrix.Rotation(radians, $V([v[0], v[1], v[2]])).ensure4x4();
    GLTest.mvMatrix = GLTest.mvMatrix.x(m);
}
$(function () { GLTest.init() });
// END GL CODE //
// START TWF8 CODE //
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
    if (isNull(dx) || isNull(dy) || isNull(val)) return error("TWF8: Tile spawning failed: Insufficient values");
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
    else if (key != "left" || key != "right" || key != "up" || key != "down") return null;
    if (!TWF8.determine("left") && !TWF8.determine("right") && !TWF8.determine("up") && !TWF8.determine("down")) {
        log("TWF8: Game Over!");
    }
    if (TWF8.moved.length > 0) {
        timerSet("twf8spawn", 200, function () {
            do { var randLocation = [randomInt(4), randomInt(4)]; }
            while ($("#twf8-pos-"+randLocation[0]+randLocation[1]).length > 0)
            var num = Math.random() < 0.8 ? 2 : 4;
            TWF8.spawnTile(randLocation[0], randLocation[1], num);
            timerClear("twf8spawn");
        });
    }
    TWF8.moved = [];
});
$("#twf8-board").mouseenter(function () { TWF8.enabled = true; });
$("#twf8-board").mouseleave(function () { TWF8.enabled = false; });