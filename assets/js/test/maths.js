$(function () {
var ns = "assets/js/tblib/";
Require([ns+"base.js",ns+"util.js",ns+"loader.js",ns+"net.js",ns+"math.js"], function () {
    loader.start();
    $(document).on("pageload", function () {

    });
});
});
