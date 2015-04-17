$(function () {
var tbl = "assets/js/tblib/";
Require([tbl+"base.js", tbl+"util.js", tbl+"loader.js", tbl+"net.js"], function () {


$(document).on("pageload", function () {
    $(".debug-dismiss").click(function () {
        $(".container").toggleClass("show-intro", false);
    })
});


});
});
