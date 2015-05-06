// Highlights all elements that comprise or contain the specified query.
function highlightByTerm(query) {
    query = query.toLowerCase();
    var elements = $(".element");
    if (query.length == 0) return resetHighlight();
    else $("#ptable").toggleClass("search", true);
    try {
        var success = false;
        for (var i=0;i<elements.length;i++) {
            var curr = elements[i];
            if (curr.gecn("symbol")[0].innerText.toLowerCase().search(query) != -1 ||
                curr.gecn("name")[0].innerText.toLowerCase().search(query) != -1) {
                $(curr).toggleClass("selected", true);
                success = true;
            } else $(curr).toggleClass("selected", false);
        }
        return success;
    } catch (e) { return null; }
}
// Highlights all elements with a class spec that comprises or contains the
// specified query.
function highlightByClass(query) {
    query = new RegExp("(^| )"+query+"( |$)");
    var elements = $(".element");
    if (query.length == 0) return resetHighlight();
    else $("#ptable").toggleClass("search", true);
    for (var i=0;i<elements.length;i++) {
        var curr = elements[i];
        if (curr.className.search(query) != -1)
            $(curr).toggleClass("selected", true);
        else $(curr).toggleClass("selected", false);
    }
}
function resetHighlight() {
    $("#ptable").toggleClass("search", false);
    $(".element.selected").toggleClass("selected", false);
    return true;
}
function fillInfoBox(elementDiv) {
    var box = $("#info-element")[0];
    box.innerHTML = elementDiv.innerHTML;
    box.className = elementDiv.className;
}
$(document).on("pageload", function () {
    $(".element.liquid .symbol").attr("title", "Liquid at room temperature");
    $(".element.gas .symbol").attr("title", "Gaseous at room temperature");
    $(".element.radioactive").attr("title", "Radioactive (no stable isotopes)");
    // each keystroke
    $(document).keyup(function () {
        var result = highlightByTerm($("#search").val());
        if (result != true)
            $("#search").toggleClass("error", true);
        else $("#search").toggleClass("error", false);
    });
    // small or large?
    $("#small-mode").click(function () {
        $("#ptable").toggleClass("small", TBI.isToggled(gebi("small-mode")));
    });
    $("#valencies").click(function () {
        $("#ptable").toggleClass("valencies", TBI.isToggled(gebi("valencies")));
    });
    // highlighting behaviour
    $(".element").click(function () {
        $(".element.highlighted").toggleClass("highlighted", false);
        $(this).toggleClass("highlighted", true);
        fillInfoBox(this);
        $("#info-box").slideDown();
        $("#info-show-container").slideUp();
    });
    // legend guide
    $("#legend li").mouseenter(function () {
        highlightByClass(this.className);
    });
    // legend guide: return to default behaviour
    $("#legend").mouseleave(function () {
        highlightByTerm($("#search").val());
    });
    $("#info-hider").click(function () {
        $("#info-box").slideUp();
        $("#info-show-container").slideDown();
        $(".element.highlighted").toggleClass("highlighted", false);
    });
});
