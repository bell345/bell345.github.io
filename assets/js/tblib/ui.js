if (!window.jQuery) {
    throw new Error("[tblib/ui.js] jQuery has not been loaded");
} else if (!window.TBI) {
    throw new Error("[tblib/ui.js] base.js has not been loaded");
} else if (!TBI.Util) {
    throw new Error("[tblib/ui.js] util.js has not been loaded");
}

TBI.UI = {};

TBI.log = function (message, timeout) {
    console.log(message);
    TBI.UI.Notification("Info", message, timeout || 30000);
};
TBI.warn = function (message, timeout) {
    console.warn(message);
    TBI.UI.Notification("Warning", message, timeout || 40000);
};
TBI.error = function (message, timeout) {
    if (message instanceof Error) {
        var msgLi = TBI.UI.Notification("Error", message.message, timeout || 50000);
        var stackDiv = document.createElement("div");
            stackDiv.textContent = message.stack;
            stackDiv.style.display = "none";
            stackDiv.style.transition = "0s all";
        var stackButton = document.createElement("button");
            stackButton.onclick = function () {
                $(stackDiv).slideToggle();
            };
            stackButton.textContent = "Show/Hide Stack";
        msgLi.appendChild(stackButton);
        msgLi.appendChild(stackDiv);
    } else TBI.UI.Notification("Error", message, timeout || 50000);
};

TBI.UI.updateUI = function (force) {
    var items = $("h2.item[id], h2.section[id]");
    if (items.length > 0 && $("#sidebar").length > 0) {
        if ($("#sidebar #sections").length == 0) {
            var header = document.createElement("h3");
            header.className = "span";
                var link = document.createElement("a");
                link.href = "javascript:void(0)";
                link.className = "up-down";
                link.setAttribute("for", "#sections");
                link.innerText = "Sections";
            header.appendChild(link);

            var list = document.createElement("ul");
            list.className = "side para";
            list.id = "sections";

            var sidebar = gebi("sidebar");
            sidebar.insertBefore(list, sidebar.firstChild);
            sidebar.insertBefore(header, sidebar.firstChild);
        } else $("#sidebar #sections").empty();

        for (var i=0;i<items.length;i++) {
            var sectionsList = $("#sidebar #sections")[0];
            var item = document.createElement("li");
                var link = document.createElement("a");
                link.href = location.origin + location.pathname + "#" + items[i].id;
                link.innerText = items[i].innerText;
            item.appendChild(link);
            sectionsList.appendChild(item);
        }
    }

    for (var i=0;i<$(".img-mid:not(.done)").length;i++) {
        var currimg = $(".img-mid:not(.done)")[i];
        currimg.id = generateUUID();
        currimg.getElementsByClassName("img-toggle")[0].setAttribute("for", "#" + currimg.id + " img");
        currimg.className += " done";
    }

    $("button.toggle:not(.done)").click(function (event) {
        if (event.button != 0) return true;
        $(this).toggleClass("on");
        $(this).trigger("change");
    });
    $("button.toggle:not(.done)").toggleClass("done", true);

    $(".up-down:not(.done)").click(function (event) {
        if (event.button != 0) return false;
        var toSwitch = $($(this).attr("data-for") || $(this).attr("for"));
        if (toSwitch.length > 0) toSwitch.slideToggle();
        $(this).toggleClass("on");
        $(this).trigger("change");
        return false;
    });
    $(".up-down:not(.done)").toggleClass("done", true);

    var popups = $("*[data-popup-title]:not(.popup-done), *[data-popup-body]:not(.popup-done)");
    for (var i=0;i<popups.length;i++) {
        TBI.UI.HoverPopup.bindElement(popups[i],
            popups[i].attributes["data-popup-title"].value,
            popups[i].attributes["data-popup-body"].value);
    }
    popups.toggleClass("popup-done", true);

    if (force) $("table.sortable.done").toggleClass("done", false);

    for (var i=0;i<$("table.sortable:not(.done)").length;i++) {
        var curr = $("table.sortable:not(.done)")[i];

        // recording original table order
        var rows = curr.querySelectorAll("tbody tr");
        for (var j=0;j<rows.length;j++)
            rows[j].dataset.tableOrder = j;

        var sortHeaders = curr.querySelectorAll("thead th.sort");
        $(sortHeaders).toggleClass("none", true);
        $(sortHeaders).off("click");
        $(sortHeaders).click(function (table) {
            return function () {
                var upDownList = table.querySelectorAll("thead th");
                var index = -1;
                // find current column index
                for (var i=0;i<upDownList.length;i++) {
                    if (upDownList[i] == this) index = i;
                    else upDownList[i].className = upDownList[i].className.replace(/( )*(up|down)/, "$1none");
                }

                var conditions = ["none", "up", "down"];
                if (index != -1) {
                    for (var i=0;i<conditions.length;i++) {
                        var condition = conditions[i];
                        if (this.className.search(condition) != -1) {
                            var futureCondition = conditions[(i + 1) % conditions.length];

                            $(this).toggleClass(condition, false);
                            $(this).toggleClass(futureCondition, true);

                            switch (futureCondition) {
                                case "up": TBI.UI.sortTable(table, index, false); break;
                                case "down": TBI.UI.sortTable(table, index, true); break;
                                default: TBI.UI.sortTable(table, -1, false);
                            }
                            break;
                        }
                    }
                } else TBI.UI.sortTable(table, -1, false);
            }
        }(curr));
    }
    $("table.sortable:not(.done)").toggleClass("done", true);

    var elementsInNeed = $(".has-help + .help:not(.done)");
    for (var i=0;i<elementsInNeed.length;i++)
        TBI.UI.HoverPopup.bindElement(elementsInNeed[i].previousElementSibling, "", elementsInNeed[i].innerHTML);

    $(".has-help + .help:not(.done)").toggleClass("done", true);

    var selects = $("select.styled:not(.done)");
    for (var i=0;i<selects.length;i++) {
        var select = selects[i];

        var selection = isNull(select.value) ? "\u2014" :
            $(select).find("option[value='"+select.value+"']").html();

        var div, ul, container;
        if ($(select).parent().hasClass("styled-select")) {
            container = $(select).parent();
            div = container.find("div")[0];
            ul = container.find("ul")[0];
            $(ul).empty();
        } else {
            container = $(select).wrap("<div class='styled-select'></div>").parent();
            div = document.createElement("div");
            container[0].appendChild(div);
            ul = document.createElement("ul");
            container[0].appendChild(ul);

            $(div).click(function (ul) {
                return function (event) {
                    event.stopPropagation();
                    $(ul).toggleClass("active");
                };
            }(ul));
            $(document).click(function (ul) {
                return function () { $(ul).removeClass("active"); };
            }(ul));

            $(select).on("change", function (div) {
                return function () {
                    var $li = $(this).parent().find("li[rel='"+$(this).val()+"']");
                    $(div).html($li.html());
                };
            }(div));
        }

        $(div).html(selection);

        TBI.UI.updateSelect(select);
    }
};



TBI.UI.fillSelect = function (select, obj, callback) {
    var $this = $(select);
    var selection = $this.val();
    $this.removeClass("done");
    $this.empty();
    $this.append("<option value='-'>&mdash;</option>");
    for (var prop in obj) if (obj.hasOwnProperty(prop)) {
        var option = document.createElement("option");
        option.innerHTML = obj[prop];
        option.value = prop;
        option = callback(option, prop, obj[prop]) || option;
        select.appendChild(option);
    }
    $this.val(selection);
    $this.trigger("change");
    TBI.UI.updateSelect(select);
};

TBI.UI.updateSelect = function (select) {
    var container, div, ul;
    if ($(select).parent().hasClass("styled-select")) {
        container = $(select).parent();
        div = container.find("div")[0];
        ul = container.find("ul")[0];
        $(ul).empty();
    } else return TBI.UI.updateUI(true);

    $(select).removeClass("done");
    $(select).find("option").toArray().forEach(function (e) {
        var li = document.createElement("li");
        li.innerHTML = e.innerHTML;
        li.className = e.className;
        li.setAttribute("rel", e.getAttribute("value"));
        $(li).click(function (div, select, ul) {
            return function (event) {
                event.stopPropagation();
                $(div).html($(this).html());
                $(select).val($(this).attr("rel"));
                $(select).trigger("change");
                $(ul).removeClass("active");
            };
        }(div, select, ul));
        ul.appendChild(li);
    });
    $(select).addClass("done");
};

TBI.UI.HoverPopup = function (x, y, title, body) {
    this.position = new Vector2D(x, y);
    var popDiv = document.createElement("div");
    popDiv.className = "popup";
    popDiv.style.left = this.position.x + 20 + "px";
    popDiv.style.top = this.position.y + 20 + "px";
        var popHead = document.createElement("h3");
        popHead.innerHTML = title;
    popDiv.appendChild(popHead);
        var popBody = document.createElement("div");
        popBody.className = "popup-body";
        popBody.innerHTML = body;
    popDiv.appendChild(popBody);

    $(".popup").remove();
    document.body.appendChild(popDiv);
    this.element = popDiv;

    var xpad = parseInt(this.element.getStyle("padding-left")) + parseInt(this.element.getStyle("padding-right")),
        ypad = parseInt(this.element.getStyle("padding-top")) + parseInt(this.element.getStyle("padding-bottom"));
    var width = parseInt(this.element.getStyle("width")) + xpad;
    var left = parseInt(this.element.style.left);

    while (left + width >= window.innerWidth) {
        this.element.style.left = (left - 1) + "px";
        left = parseInt(this.element.style.left);
        width = parseInt(this.element.getStyle("width")) + xpad;
    }
    
    var top = parseInt(this.element.style.top);
    var height = parseInt(this.element.getStyle("height")) + ypad;

    if (top + height >= window.innerHeight)
        this.element.style.top = (top - height - 40) + "px";


    Object.defineProperty(this, "title", {
        get: function () { return this.element.getn("h3")[0].innerHTML; },
        set: function (title) { this.element.getn("h3")[0].innerHTML = title; }
    });
    Object.defineProperty(this, "body", {
        get: function () { return this.element.gecn("popup-body")[0].innerHTML; },
        set: function (body) { this.element.gecn("popup-body")[0].innerHTML = body; }
    });
};
TBI.UI.HoverPopup.bindElement = function (element, title, body) {
    $(element).mousemove(function (title, body) {
        return function (event) {
            var popup = new TBI.UI.HoverPopup(event.pageX, event.pageY, title, body);
        }
    }(title, body));
    $(element).mouseleave(function () {
        $(".popup").remove();
    });
};
TBI.UI.HoverPopup.bindElements = function (elementArray, title, body) {
    for (var i=0;i<elementArray.length;i++)
        TBI.UI.HoverPopup.bindElement(elementArray[i], title, body);
};
// A predefined popup element that can be added to by using the same header.
TBI.UI.Notification = function (group, text, timeout) {
    var groupID = "note-group-" + group.toLowerCase(),
        noteHolder = gebi("note-holder");

    if (noteHolder == null) {
        noteHolder = document.createElement("div");
        noteHolder.id = "note-holder";
        var noteHolderInner = document.createElement("div");
            noteHolderInner.id = "note-holder-inner";
        noteHolder.appendChild(noteHolderInner);
        document.body.appendChild(noteHolder);
    } else var noteHolderInner = gebi("note-holder-inner");

    var noteGroup = gebi(groupID);

    if (noteGroup == null) {
        noteGroup = document.createElement("div");
        noteGroup.className = "note";
        noteGroup.id = groupID;
        var noteHeader = document.createElement("h3");
            noteHeader.textContent = group;
        noteGroup.appendChild(noteHeader);
        var noteList = document.createElement("ul");
        noteGroup.appendChild(noteList);
        var noteDismiss = document.createElement("button");
            noteDismiss.textContent = "Dismiss";
            noteDismiss.onclick = function () { noteGroup.remove(); };
        noteGroup.appendChild(noteDismiss);
        noteHolderInner.appendChild(noteGroup);
    } else var noteList = noteGroup.getn("ul")[0];

    var currNote = document.createElement("li");
        currNote.innerHTML = text;

    var prevNotes = $(noteList).find("li").toArray();
    if (prevNotes.length > 0) {
        var lastNote = prevNotes[prevNotes.length - 1];
        if (lastNote.innerHTML == text) {
            if (isNull(lastNote.dataset.instances)) lastNote.dataset.instances = 1;
            lastNote.dataset.instances++;
            currNote = lastNote;
        } else noteList.appendChild(currNote);
    } else noteList.appendChild(currNote);

    if (timeout > 0) var timer = new TBI.Timer(function (timer) {
        $(noteGroup).remove();
    }, timeout, false, groupID);
    else if (TBI.TimerDB[groupID]) TBI.TimerDB[groupID].clear();

    return currNote;
};
// Changes the specified toggleable element either according to the boolean value passed to it, or simply toggles it.
TBI.UI.toggleButton = function (element, bool, cosmetic) {
    if (!isNull(element[0]) && element[0] instanceof HTMLElement) element = element[0];
    if (!element instanceof HTMLElement) return null;

    else if (!isNull(element.checked))
        return element.checked = isNull(bool) ? !element.checked : bool;

    var isToggled = TBI.UI.isToggled(element);
    if (!isToggled && bool !== false) $(element).toggleClass("on", true);
    else if (isToggled && bool !== true) $(element).toggleClass("on", false);

    if (!cosmetic && (!isNull(bool) && bool !== isToggled || isNull(bool))) $(element).click();

    return TBI.UI.isToggled(element);
};
// Returns whether or not a specified toggleable element is toggled or not.
TBI.UI.isToggled = function (element) { return isNull(element.checked) ? $(element).hasClass("on") : element.checked; }
TBI.UI.getRadioInput = function (name) {
    var inputs = document.querySelectorAll("input[type='radio'][name='"+name+"']");
    for (var i=0;i<inputs.length;i++)
        if (inputs[i].checked) return inputs[i].value;
    return null;
};
// Sorts a specific table element according to the column and direction specified.
TBI.UI.sortTable = function (table, colIndex, direction, type, customFunc) {
    var body = table.querySelector("tbody");
    var rows_nl = body.querySelectorAll("tr");
    var header = table.querySelectorAll("thead th")[colIndex];

    var rows = []; // reassignment from NodeList to Array
    for (var i=0;i<rows_nl.length;i++)
        rows[i] = rows_nl[i];

    if (isNull(type)) { // intelligent sort method guessing
        type = "numeric";

        if (colIndex == -1) type = "original";
        else if ($(header).hasClass("numeric")) type = "numeric";
        else if ($(header).hasClass("date")) type = "date";
        else if ($(header).hasClass("custom-numeric")) type = "custom-numeric";
        else if ($(header).hasClass("custom-text")) type = "custom-text";
        else for (var i=0;i<rows.length;i++) { // if type arg is missing, and ALL elements are good as numbers, type is numeric; otherwise text-based
            if (isNaN(parseFloat(rows[i].querySelectorAll("td")[colIndex].innerText))) {
                type = "text"; break;
            }
        }
    }

    rows = rows.sort(function (a, b) {
        var aCell = a.querySelectorAll("td")[colIndex];
        var bCell = b.querySelectorAll("td")[colIndex];
        var cond = true;

        switch (type) {
            case "custom":
                cond = customFunc(a, b, rows); break;
            case "text":
                cond = aCell.textContent.toLowerCase() < bCell.textContent.toLowerCase(); break;
            case "custom-text":
                cond = aCell.getAttribute("data-table-sort-value") < bCell.getAttribute("data-table-sort-value"); break;
            case "numeric":
                cond = parseFloat(aCell.textContent) < parseFloat(bCell.textContent); break;
            case "custom-numeric":
                cond = parseFloat(aCell.getAttribute("data-table-sort-value")) < parseFloat(bCell.getAttribute("data-table-sort-value")); break;
            case "date":
                cond = new Date(aCell.textContent).getTime() < new Date(bCell.textContent).getTime(); break;
            case "original":
            default:
                cond = parseInt(a.dataset.tableOrder) < parseInt(b.dataset.tableOrder); break;
        }

        if (direction) return cond ? 1 : -1;
        else return cond ? -1 : 1;
    });

    $(body).empty(); // get rid of all rows
    rows.forEach(function (e) { body.appendChild(e); }); // and put them back in correct order
};
// Generates a desktop notification outside of the regular environment.
TBI.UI.Note = function (img, title, desc, link) {
    if (isNull(window.Notification)) return null;
    var note = {title:title,body:desc,icon:img,lang:"en"};
    if (!isNull(link))
        note.onclick = function () {
            window.open(link);
            note.close();
        };
    new Notification(title, note);
};

// Designates outgoing links.
TBI.UI.updateLinks = function () {
    for (var i = 0; i < $("a[href]").length; i++) {
        if ($("a[href]:nth("+i+")").attr("href").search(/((http|https|mailto|news):|\/\/)/) == 0) {
            $("a[href]:nth("+i+")").attr("target", "_blank");
            if ($("a[href]:nth("+i+")")[0].className.search(" external") == -1)
                $("a[href]:nth("+i+")")[0].className += " external";
        }
    }
    $("#top a").click(function () {
        var url = new URL(this.href),
            hash = url.hash;
        if (path.isEqual(url.pathname.split('/')) && !isNull(hash) && !isNull($(hash))) {
            $(document).scrollTop(parseInt($(hash).offset().top - 64));
            return false;
        }
    });
};

TBI.UI.Dialog = function (header, body, buttons) {
    this.header = header;
    this.body = body;
    this.buttons = buttons || "ok";
    var diaDiv = document.createElement("div");
    diaDiv.className = "dialog";
    diaDiv.className += " dbuttons-"+this.buttons;
        var diaHeader = document.createElement("div");
        diaHeader.className = "dialog-header";
        var diaHeaderLoc = null,
            diaHeaderTransform = null;
        diaHeader.onmousedown = function (event) {
            diaHeaderLoc = new Vector2D(event.clientX, event.clientY);
            diaHeaderTransform = this.parentElement.style.transform;
            if (diaHeaderTransform == "") diaHeaderTransform = "translateX(0px) translateY(0px)";
        };
        diaDiv.onmousemove = function (event) {
            if (diaHeaderLoc != null) {
                var loc = new Vector2D(event.clientX, event.clientY).subtract(diaHeaderLoc);
                var xMatch = diaHeaderTransform.match(/translateX\((.*?)px\)/);
                var yMatch = diaHeaderTransform.match(/translateY\((.*?)px\)/);
                var currX = isNull(xMatch) ? 0 : parseInt(xMatch[1]);
                var currY = isNull(yMatch) ? 0 : parseInt(yMatch[1]);
                var curr = new Vector2D(currX, currY).add(loc);

                var zero = Vector2D.zero;
                var lim = new Vector2D(window.innerWidth, window.innerHeight);
                var s = getComputedStyle(this);
                var dim = new Vector2D(parseInt(s.width), parseInt(s.height));

                var begin = new Vector2D(lim.x/2 - dim.x/2, lim.y/2 - dim.y/2).add(curr);
                var beginDiff = begin.clamp(zero, lim).subtract(begin);
                var end = begin.add(dim);
                var endDiff = end.clamp(zero, lim).subtract(end);
                curr = curr.add(beginDiff).add(endDiff);

                this.style.transform = diaHeaderTransform
                    .replace(/translateX\(.*?\)/, "translateX("+curr.x+"px)")
                    .replace(/translateY\(.*?\)/, "translateY("+curr.y+"px)");
            }
        };
        diaHeader.onmouseup = function () {
            diaHeaderLoc = null;
            diaHeaderTransform = null;
        };
        diaDiv.onmouseup = diaHeader.onmouseup;
        diaDiv.onmouseleave = diaHeader.onmouseup;
            var diaHeaderText = document.createElement("h2");
            diaHeaderText.innerHTML = this.header;
        diaHeader.appendChild(diaHeaderText);
            var diaHeaderButtons = document.createElement("div");
            diaHeaderButtons.className = "dialog-header-buttons";
                var diaHeaderClose = document.createElement("button");
                diaHeaderClose.className = "dialog-header-close";
                diaHeaderClose.innerHTML = "\u2716";
                diaHeaderClose.onclick = function (dialog) {
                    return function (event) {
                        dialog.close(event);
                    };
                }(this);
            diaHeaderButtons.appendChild(diaHeaderClose);
        diaHeader.appendChild(diaHeaderButtons);
    diaDiv.appendChild(diaHeader);
        var diaBody = document.createElement("div");
        diaBody.className = "dialog-body";
        diaBody.innerHTML = body;
    diaDiv.appendChild(diaBody);
        var diaControl = document.createElement("div");
        diaControl.className = "dialog-control";
        var diaControlButtons = ["OK", "Cancel", "Apply", "Abort", "Retry", "Fail"];
        for (var i=0;i<diaControlButtons.length;i++) {
            var button = document.createElement("button");
            button.className = "dialog-"+diaControlButtons[i].toLowerCase();
            button.innerHTML = diaControlButtons[i];
            diaControl.appendChild(button);
        }
        var clickEvent = function (dialog) {
            return function (event) {
                dialog.close(event);
            };
        }(this);
        var okButton = diaControl.gecn("dialog-ok")[0];
        okButton.onclick = clickEvent;
        var cancelButton = diaControl.gecn("dialog-cancel")[0];
        cancelButton.onclick = clickEvent;
        var applyButton = diaControl.gecn("dialog-apply")[0];
        applyButton.onclick = function (dialog) {
            return function (event) {
                if (this.onapply) this.onapply(event);
            };
        }(this);
        var abortButton = diaControl.gecn("dialog-abort")[0];
        abortButton.onclick = clickEvent;
        var retryButton = diaControl.gecn("dialog-retry")[0];
        retryButton.onclick = clickEvent;
        var failButton = diaControl.gecn("dialog-fail")[0];
        failButton.onclick = clickEvent;
    diaDiv.appendChild(diaControl);
    this.element = diaDiv;
    var otherDialog = gecn("dialog");
    $(otherDialog).remove();

    var shadow = gecn("shadow")[0];
    if (shadow == undefined) {
        shadow = document.createElement("div");
        document.body.appendChild(shadow);
    }
    shadow.className = "shadow show";
    shadow.appendChild(diaDiv);
    this.shadow = shadow;

    this.close = function (event) {
        if (!isNull(event)) {
            var cn = event.target.className.replace("dialog-", "");
            var result = TBI.UI.DialogResult.cancel;
            for (var prop in TBI.UI.DialogResult) if (TBI.UI.DialogResult.hasOwnProperty(prop))
                if (TBI.UI.DialogResult[prop] == cn) result = TBI.UI.DialogResult[prop];
            if (this.onclose) this.onclose(result, event);
        } else if (this.onclose) this.onclose(TBI.UI.DialogResult.cancel);
        $(this.element).remove();
        this.shadow.className = this.shadow.className.replace(/ ?show/, "");
    };

    this.getElement = function (cls) {
        return this.element.gecn(cls)[0];
    };
};
TBI.UI.DialogButtons = new Enum("ok", "ok-cancel", "ok-cancel-apply", "abort-retry-fail");
TBI.UI.DialogResult = new Enum("ok", "cancel", "apply", "abort", "retry", "fail");