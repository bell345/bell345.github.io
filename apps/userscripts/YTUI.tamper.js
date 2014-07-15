// ==UserScript==
// @name       YTUI
// @namespace  http://bell345.github.io
// @version    0.2
// @description  Minimalistic YouTube UI
// @match      https://www.youtube.com/*
// @copyright  CC-BY-SA 2014 Thomas Bell
// ==/UserScript==
var newStyle = "";
newStyle += "<style>";
newStyle += "*:not(.html5-scrubber-button):not(.yt-uix-button-toggled) {\n";
newStyle += "	border-width:0px !important;\n";
newStyle += "	box-shadow:0px 0px 0px 0px transparent !important;\n";
newStyle += "}\n";
newStyle += "* {";
newStyle += "	border-radius:0px !important;\n";
newStyle += "}\n";
newStyle += ".ytp-play-progress {\n";
newStyle += "	background:#0094ff !important;\n";
newStyle += "}\n";
newStyle += ".html5-scrubber-button:hover {\n";
newStyle += "	background:#0094ff !important;\n";
newStyle += "}\n";
newStyle += ".seeking-mode .html5-scrubber-button {\n";
newStyle += "	background:#0094ff !important;\n";
newStyle += "}\n";
newStyle += "</style>";
document.head.innerHTML += newStyle