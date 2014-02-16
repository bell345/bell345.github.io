// BLOG2.JS v5.1
// Code used to load blog posts from an external JSON file.
var now = new Date();
var unqid = now.getTime();
var page = 1;
var maxpage;
var postInfo = [];
var maxpost;
var index;
var iterator4 = 0;
var posts = [];
var postsDone = [];
var blogview = false;
var singlePostInfo = [];
var singlePost = [];
var pageLength = 5;

$(function () {
	if (!isNull(query.page)) {
		if (query.page>0)
			page = parseInt(query.page);
		else
			location.assign("/blog/?page=1");
	}
});
if (location.pathname == "/blog/view/") {
	blogview = true;
}
function getPostIndex() {
    var xhr = new AJAX("/shared/data/blog.json", function () {
        index = $.parseJSON(xhr.response).postIndex;
        if (blogview) getSinglePostInfo(query.id);
        else blogList(page);
    });
}
function blogList(pge) {
    maxpage = Math.ceil(index.length/5);
    maxpost = index.length;
    if (pageLength*pge > maxpost)
        var max = maxpost;
    else
        var max = pageLength*pge;
    for (i = (-pageLength + (pge * pageLength)); i < max; i++) {
        postInfo.push(index[i]);
    }
    getPosts();
}
function getSinglePostInfo(id) {
    if (isNull(id)) {
		query.id = index.length-1;
		id = query.id;
	}
	var item = (index.length-1)-id;
    singlePostInfo = index[item];
    getSinglePost();
}
function setBlogNav() {
	if (blogview) {
		if (query.id == index.length-1) {
			var next = "?id="+(parseInt(query.id)-1);
			$(".blognavp").hide();
		} else if (query.id == 0) {
			$(".blognavn").hide();
			var back = "?id=1";
		} else {
			var next = "?id="+(parseInt(query.id)-1);
			var back = "?id="+(parseInt(query.id)+1);
		}
		$(".blogcont span.main").html("Post "+(parseInt(query.id)+1));
		$($(".blogcont a.main")[1]).attr("class","main active");
		$($(".blogcont a.main")[1]).attr("href","#");
		$($(".blogcont a.main")[3]).attr("class","main active");
		$($(".blogcont a.main")[3]).attr("href","#");
		var pge = parseInt(((index.length-1)-parseInt(query.id))/pageLength)+1;
		$($(".blogcont a.main")[0]).attr("href","/blog/?page="+pge);
		$($(".blogcont a.main")[2]).attr("href","/blog/?page="+pge);
	} else {
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
		$(".blogcont span.main").html("Page "+page);
		$($(".blogcont a.main")[0]).attr("class","main active");
		$($(".blogcont a.main")[0]).attr("href","#");
		$($(".blogcont a.main")[2]).attr("class","main active");
		$($(".blogcont a.main")[2]).attr("href","#");
        var urlId = index.length-(page-1)*pageLength-1;
		$($(".blogcont a.main")[1]).attr("href","/blog/view/?id="+urlId.toString());
		$($(".blogcont a.main")[3]).attr("href","/blog/view/?id="+urlId.toString());
	}
	$(".blognavp").attr("href", back);
	$(".blognavn").attr("href", next);
	updateHeight();
	updateLinks();
}
function getPosts() {
    var it3 = 0;
    for (i=0;i<postInfo.length;i++)
        postsDone[i] = false;
    timerSet("postInter", 150, function () {
        if (it3 < postInfo.length) {
            if (!postsDone[it3]) {
                var xhr = new AJAX(postInfo[it3].source, function () {
                    posts[it3] = xhr.response;
                    it3++;
                    if (it3 == postInfo.length) {
                        setPosts();
                        timerClear("postInter");
                    }
                });
                postsDone[it3] = true;
            }
        }
    });
}
function getSinglePost() {
    var xhr = new AJAX(singlePostInfo.source, function () {
        singlePost = xhr.response;
        setSinglePost();
    });
}
function setPosts() {
    if ($("#posts").length) {
        $("#posts").html("");
        for (i = 0; i < posts.length; i++) {
            var temppost = "";
            temppost += "<h2 id='anchor" + (i + 2) + "'>" + postInfo[i].title + "</h2>";
            temppost += "<p class='timestamp'>";
			var id = ((index.length-1)-(i+((page-1)*pageLength)));
            temppost += "<a href='/blog/view/?id=" + id.toString() + "' title='Permalink'>";
            temppost += postInfo[i].date;
            temppost += "</a><span class='author'>" + postInfo[i].author + "</span></p>";
            temppost += "<p class='tags'>";
            temppost += "<b>Tags</b>: ";
            for (j = 0; j < postInfo[i].tags.length; j++) {
                temppost += "<span class='tag'>" + postInfo[i].tags[j] + " " + "</span>";
            }
            temppost += "</p>";
            temppost += posts[i];
            modifyHtml("posts", "<article id='post" + i + "'>" + temppost + "</article>");
        }
        setBlogNav();
    } else if ($("#featpost").length) {
        var thisPost = postInfo[0];
        var temppost = "";
        temppost += "<h2>" + thisPost.title + "</h2>";
        temppost += "<p class='timestamp'>";
		var id = index.length-1;
        temppost += "<a href='/blog/view/?id=" + id.toString() + "' title='Permalink'>";
        temppost += thisPost.date;
        temppost += "</a><span class='author'>" + thisPost.author + "</span></p>";
        temppost += "<p class='tags'>";
        temppost += "<b>Tags</b>: ";
        for (j = 0; j < thisPost.tags.length; j++) {
            temppost += "<span class='tag'>" + thisPost.tags[j] + " " + "</span>";
        }
        temppost += "</p>";
        temppost += posts[0];
        $("#featpost").html("");
        modifyHtml("featpost", temppost);
        setBlogNav();
    }
}
function setSinglePost() {
    var thisPost = singlePostInfo;
    var temppost = "";
    temppost += "<h2>" + thisPost.title + "</h2>";
    temppost += "<p class='timestamp'>";
	id = index.length-1;
    temppost += "<a href='/blog/view/?id=" + id.toString() + "' title='Permalink'>";
    temppost += thisPost.date;
    temppost += "</a><span class='author'>" + thisPost.author + "</span></p>";
    temppost += "<p class='tags'>";
    temppost += "<b>Tags</b>: ";
    for (j = 0; j < thisPost.tags.length; j++) {
        temppost += "<span class='tag'>" + thisPost.tags[j] + " " + "</span>";
    }
    temppost += "</p>";
    temppost += singlePost;
    $("#singlepost").html("");
    modifyHtml("singlepost", temppost);
    setBlogNav();
}
$(function () {
    getPostIndex();
});