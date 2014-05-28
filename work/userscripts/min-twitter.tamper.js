// ==UserScript==
// @name       Minimalistic Twitter
// @namespace  http://bell345.github.io/
// @version    0.9
// @description  A minimalistic script for a minimalistic style.
// @match      https://twitter.com/*
// @copyright  CC-BY-SA Thomas Bell 2014
// ==/UserScript==
onload = function () {
    var newStyle = "";
    newStyle += "<style>";
    newStyle += "* { \n\tborder-width:0 !important; \n\tborder-radius:0 !important; \n}";
    newStyle += "\n.active a { \n\tborder-bottom-width:4px !important; \n}";
    newStyle += "\n.tweet-timestamp { \n\tfloat:right; \n}";
    newStyle += "\n.module { \n\tmargin-bottom:0 !important; \n}";
    newStyle += "\n.content-main, .profile-card.profile-header { \n\twidth: 520px; \n}";
    newStyle += "\n.wrapper, .profile-header-inner-overlay { \n\tbackground:none !important; \n}";
    newStyle += "\n.nav>li { \n\tcolor:#eee !important; \n}";
    newStyle += "\n.global-nav-inner {\n\tbackground:#333; \n}";
    newStyle += "\ndiv.stream-item-header img.avatar {\n\twidth:48px !important; \n\theight:48px !important; \n\tmargin-left:48px !important; \n}";
    newStyle += "\n.with-icn {\n\tfont-size:initial; \n}";
    newStyle += "\ndiv.content-main div.expansion-container div.tweet.descendant {\n\tpadding-left:0 !important; \n}";
    newStyle += "\nul.js-nav-links li.active a { \n\tborder-color:#0094ff; \n}";
    newStyle += "\n.modal-close { \n\tright:0 !important; \n\tbottom:0 !important; \n\ttop:0 !important; \n\theight:38px !important; \n\twidth:40px !important; \n}";
    newStyle += "\n.button-text.following-text, .button-text.unfollow-text { \n\tpadding-top:4px !important; \n}";
    newStyle += "\n.Footer.module { \n\tmargin-top:16px; \n}";
    newStyle += "</style>";
    $("head").append(newStyle);
}