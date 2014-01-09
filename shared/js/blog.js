var now = new Date();
var unqid = now.getTime();
var page = 1;
if (location.search.match("page=") != null) {
	if (location.search[7] != undefined) {
		page = parseInt(location.search[6] + location.search[7]);
	}
	else {
		page = parseInt(location.search[6]);
	}
}
function getPostIndex() {
    var xhr = XHR();
    xhr.open("GET", "/blog/posts.xml?" + unqid, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (checkState(xhr)) {
            findIndex(xhr);
            blogList(index, page);
        }
    }
}
var index;
var maxpage;
function findIndex(file) {
    var xml = $.parseXML(file.response);
    index = xml.getElementsByTagName("post");
	maxpage = Math.ceil(index.length/5);
}
var postInfo = [];
var maxpost;
function blogList(indx, pge) {
	maxpost = indx.length;
	if (5*pge > maxpost) {
		var mxvar = maxpost;
	}
	else {
		var mxvar = 5*pge;
	}
	var indxLength = index[0].children.length;
    for (i = (-5+(pge*5)); i < mxvar; i++) {
        var temppost = [];
        for (j = 1; j < 4; j++) {
            temppost.push(indx[i].children[j].textContent);
        }
        var temptags = [];
        for (k = 0; k < indx[i].children[4].children.length; k++) {
            temptags.push(indx[i].children[4].children[k].textContent);
        }
        temppost.push(temptags);
		for (j = 5; j < indxLength; j++) {
			temppost.push(indx[i].children[j].textContent);
		}
        postInfo.push(temppost);
    }
    iterator4++;
    $(document).trigger("blogset");
}
function setBlogNav() {
	if (page == 1) {
		var back = "?page=1";
		$(".blognavp").css("display", "none");
	}
	else {
	    var back = "?page=" + (page - 1);
	}
	if (page >= maxpage) {
		var next = "?page=" + page;
		$(".blognavn").css("display", "none");
	}
	else {
		var next = "?page=" + (page+1);
	}
	$(".blognavp").attr("href", back);
	$(".blognavn").attr("href", next);
}
var posts = [];
var postsDone = [];
function getPosts() {
    var iterator3 = 0;
	for (i=0;i<posts.length;i++) {
		postsDone[i] = false;
	}
    var postinter = setInterval(function () {
        if (iterator3 < postInfo.length) {
			if (!postsDone[iterator3]) {
				var xhr = XHR();
				xhr.open("GET", postInfo[iterator3][0], true);
				xhr.send();
				xhr.onreadystatechange = function () {
					if (checkState(xhr)) {
						posts[iterator3] = (xhr.response);
						iterator3++;
					}
					if (checkState(xhr) && iterator3 == postInfo.length) {
						iterator4++;
						$(document).trigger("blogset");
						clearInterval(postinter);
					}
				}
				postsDone[iterator3] = true;
			}
        }
    }, 150);
}
function setPosts() {
    if ($("#posts").length) {
        for (i = 0; i < posts.length; i++) {
            var temppost = "";
            temppost += "<h2 id='anchor" + (i + 2) + "'>" + postInfo[i][1] + "</h2>";
            temppost += "<p class='timestamp'>";
            temppost += "<a href='" + postInfo[i][0] + "'>";
            temppost += postInfo[i][2];
            temppost += "</a><span class='author'>" + postInfo[i][4] + "</span></p>";
            temppost += "<p class='tags'>";
            temppost += "<b>Tags</b>: ";
            for (j = 0; j < postInfo[i][3].length; j++) {
                temppost += "<span class='tag'>" + postInfo[i][3][j] + " " + "</span>";
            }
            temppost += "</p>";
            temppost += posts[i];
            modifyHtml("posts", "<div id='post" + i + "'>" + temppost + "</div>");
        }
        iterator4++;
        setBlogNav();
    }
    else if ($("#featpost").length) {
        var temppost = "";
        temppost += "<h2>" + postInfo[0][1] + "</h2>";
        temppost += "<p class='timestamp'>";
        temppost += "<a href='" + postInfo[0][0] + "'>";
        temppost += postInfo[0][2];
        temppost += "</a><span class='author'>" + postInfo[0][4] + "</span></p>";
        temppost += "<p class='tags'>";
        temppost += "<b>Tags</b>: ";
        for (j = 0; j < postInfo[0][3].length; j++) {
            temppost += "<span class='tag'>" + postInfo[0][3][j] + " " + "</span>";
        }
        temppost += "</p>";
        temppost += posts[0];
        modifyHtml("featpost", temppost);
        iterator4++;
        setBlogNav();
    }
    $(document).trigger("blogset");
}
var iterator4 = 0;
$(document).on("blogset", function () {
    if (iterator4 == 0) getPostIndex()
    else if (iterator4 == 1) getPosts()
    else if (iterator4 == 2) setPosts()
    else if (iterator4 == 3 && $("#lsidebar").length) { setAnchors(); updateAnchors(); }
});
$(document).trigger("blogset");
// START POST CODE //
var schoolEnd = new Date();
	schoolEnd.setUTCFullYear(2013);
	schoolEnd.setUTCMonth(11);
	schoolEnd.setUTCDate(19);
	schoolEnd.setUTCHours(6);
	schoolEnd.setUTCMinutes(59);
	schoolEnd.setUTCSeconds(0);
var rightNow = new Date();
var difference = new Date();
var diff = new Date();
var expand = true;
var dbugTime = [];
var prevSec;
function countDown(enddate, dest) {
	rightNow = new Date();
	var bStr = unixToString(enddate);
	var nStr = unixToString(rightNow);
	var cStr = unixToString(rightNow);
	cStr[1] = bStr[1]-nStr[1];
	for (i=2;i<7;i++) {
		if (parseInt(parseInt(bStr[i])-nStr[i])<0) {
		    cStr[i-1]--;
			switch (i) {
				case 2:
					cStr[i]=12-Math.abs(parseInt(bStr[i])-nStr[i]);
					break;
			    case 3:
			        cStr[i]=30-Math.abs(parseInt(bStr[i])-nStr[i]);
			        break;
				case 4:
					cStr[i]=24-Math.abs(parseInt(bStr[i])-nStr[i]);
					break;
				case 5:
					cStr[i]=60-Math.abs(parseInt(bStr[i])-nStr[i]);
					break;
				case 6:
					cStr[i]=60-Math.abs(parseInt(bStr[i])-nStr[i]);
					break;
			}
		}
		else {
			cStr[i]=parseInt(bStr[i])-nStr[i];
		}
	}
	for (i = 4; i < 7; i++) {
	    if (cStr[i] < 10) {
	        cStr[i] = "0" + cStr[i];
	    }
	}
	var plurals = [];
	var active = 6;
	var searchActive = true;
	for (i=1;i<7;i++) {
		if (cStr[i] == 1) {
			plurals[i] = "";
		}
		else {
			plurals[i] = "s";
		}
		if (cStr[i] > 0 && searchActive) {
		    searchActive = false;
		    active = i;
		}
	}
	var finalCountdown = "";
	if (expand) {
	    if (active <= 1) finalCountdown += cStr[1] + " year" + plurals[1] + " ";
	    if (active <= 2) finalCountdown += cStr[2] + " month" + plurals[2] + " ";
	    if (active <= 3) finalCountdown += cStr[3] + " day" + plurals[3] + " ";
	    if (active <= 4) finalCountdown += cStr[4] + " hour" + plurals[4] + " ";
	    if (active <= 5) finalCountdown += cStr[5] + " minute" + plurals[5] + " ";
	    if (active <= 6) finalCountdown += cStr[6] + " second" + plurals[6] + " ";
	}
	else {
	    if (active <= 3) finalCountdown += Math.floor(cStr[3]+cStr[2]/30+cStr[1]/365)+" day(s) ";
	    if (active <= 4) finalCountdown += cStr[4]+":";
	    if (active <= 5) finalCountdown += cStr[5]+":";
	    if (active <= 6) finalCountdown += cStr[6];
	}
	if (bStr[0] >= nStr[0]) {
	    $("#" + dest).html(finalCountdown);
	}
	else {
	    $("#" + dest).html("Countdown over!!!");
	}
	dbugTime[0] = cStr;
	dbugTime[1] = bStr;
	dbugTime[2] = nStr;
	prevSec = cStr[6];
}
timerSet("rightNow",10,function () {countDown(schoolEnd,"sc-count-dp");});
// END POST CODE //
