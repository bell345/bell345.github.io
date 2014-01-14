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
var index;
function getPostIndex() {
    var xhr = XHR();
    xhr.open("GET", "/blog/posts.xml?" + unqid, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (checkState(xhr)) {
            index = findIndex(xhr, "post");
            blogList(index, page);
        }
    }
}
var maxpage;
var postInfo = [];
var maxpost;
function blogList(indx, pge) {
    maxpage = Math.ceil(indx.length / 5);
	maxpost = indx.length;
	if (5*pge > maxpost) {
		var mxvar = maxpost;
	} else {
		var mxvar = 5*pge;
	}
    try {
        var indxLength = indx[0].children.length;
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
    } catch (e) {
        var indxLength = indx[0].childNodes.length;
        for (i = (-5 + (pge * 5)) ; i < mxvar; i++) {
            var temppost = [];
            for (j = 3; j < 9; j += 2) {
                temppost.push(indx[i].childNodes[j].textContent);
            }
            var temptags = [];
            for (k = 1; k < indx[i].childNodes[9].childNodes.length; k += 2) {
                temptags.push(indx[i].childNodes[9].childNodes[k].textContent);
            }
            temppost.push(temptags);
            for (j = 11; j < indxLength; j += 2) {
                temppost.push(indx[i].childNodes[j].textContent);
            }
            postInfo.push(temppost);
        }
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
	updateHeight();
	updateLinks();
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
        $("#posts").html("");
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
        $("#featpost").html("");
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
});
$(document).trigger("blogset");
// START POST CODE //
// END POST CODE //
