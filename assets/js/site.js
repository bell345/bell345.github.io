$(function () {

// This function returns a TBI.Loader task function that loads and parses the site-wide content manifest,
// used in populating the sidebar as well as providing metadata for the cool things on the website.
function loadProjectManifest(url) {
    return function (resolve, reject, loader) {
        var request = new TBI.AJAX(url, function (xhr) {
            if (xhr.status != 200) return reject("Net error: "+xhr.status+" "+xhr.statusText);
            try {
                parseContentManifest($.parseJSON(xhr.response));
                resolve();
            } catch (e) {
                reject("File failed to parse: "+e.message);
            }
        });
    }
}
// A helper that appends a list item with optional external link to a provided unordered list (ul) element.
function createInnerNavItem(ul, name, href, external) {
    var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = href;
        a.innerHTML = name;
    if (external) {
        var externA = document.createElement("a");
        externA.href = external;
        externA.className = "external";
        li.appendChild(externA);
    }
    li.appendChild(a);
    ul.appendChild(li);
}
// Creates a button with an embedded link. More obvious than plain <a> elements. Also accepts an optional
// className parameter for modifying the button ("major", for example, makes the button featured).
function createButtonLink(href, html, className) {
    var button = document.createElement("button");
    button.className = className;
        var link = document.createElement("a");
        link.href = href;
        link.innerHTML = html;
    button.appendChild(link);
    return button;
}
// This function returns a TBI.Loader task function that retrieves and parses the description for a specified
// website project item.
function loadProjectDescription(figure, proj) {
    return function (resolve, reject, loader) {
        var request = new TBI.AJAX(proj.description, function (xhr) {
            if (xhr.status != 200) return reject("Net error: "+xhr.status+" "+xhr.statusText);
            try {
                var desc = document.createElement("div");
                    desc.className = "description";
                    desc.innerHTML = xhr.response;
                    if (proj.preview == "iframe" || proj.preview == undefined) {
                        var frame = document.createElement("iframe");
                            frame.className = "proj-preview";
                            var src = proj.preview_iframe;
                            if (src == undefined) src = proj.path;
                            frame.setAttribute("data-src", src);
                            //frame.src = proj.path;
                        desc.appendChild(frame);
                    } else if (proj.preview == "image") {
                        var img = document.createElement("img");
                            img.className = "proj-preview";
                            img.src = proj.preview_image;
                            img.alt = proj.title;
                        desc.appendChild(img);
                    } else if (proj.preview == "repo") {
                        var frame = document.createElement("iframe");
                            frame.className = "proj-preview";
                            frame.setAttribute("data-src", "assets/html/loadrepo.html?repo="+proj.preview_repo);
                        desc.appendChild(frame);
                    }
                    var buttonDiv = document.createElement("div");
                        buttonDiv.className = "action-buttons";
                        buttonDiv.appendChild(createButtonLink(proj.path, "Open "+proj.title, "open-path major"));
                        if (proj.source) {
                            var sourceName = "View Source on "+ new URL(proj.source).hostname;
                            buttonDiv.appendChild(createButtonLink(proj.source, sourceName, "source-link"));
                        }
                        if (proj.external) {
                            var externalName = "External Link ("+ new URL(proj.external).hostname +")";
                            buttonDiv.appendChild(createButtonLink(proj.external, externalName, "external-link"));
                        }
                    desc.appendChild(buttonDiv);
                figure.appendChild(desc);

                resolve();
            } catch (e) {
                reject("An error occured: "+e.message);
            }
        });
    }
}
// A helper function that appends a gallery item to a specified <ul> gallery element. The gallery item is specified by the
// project passed to it, and also async loads the description of the item.
function createThumbGalleryFigure(gallery, project) {
    var li = document.createElement("li");
    li.id = project.id;
    var figure = document.createElement("figure");
        var img = document.createElement("img");
        img.onError = function (e) {
            this.onError = this.onerror = undefined;
            this.className += " img-error";
        }
        img.onerror = img.onError;
        img.alt = project.title;
        img.src = project.thumbnail;
    figure.appendChild(img);
        var figcaption = document.createElement("figcaption");
        figcaption.innerHTML = project.title;
            var version = document.createElement("span");
            version.className = "version";
            version.innerHTML = project.version;
        figcaption.appendChild(version);
    figure.appendChild(figcaption);
    li.appendChild(figure);
    gallery.appendChild(li);

    loader.addTask(loadProjectDescription(figure, project), null, "projectDescription "+project.description);
}
// Iterates over a dictionary list of variables with their values and replaces all instances of
// "$<variable>" in the string with the value of the variable.
function replaceWithVariables(text, variables) {
    if (isNull(text)) return text;
    for (var prop in variables)
        text = text.replace(new RegExp("\\$"+prop, 'g'), variables[prop]);
    return text;
}
// A function that returns a TBI.Loader task function that loads a manifest for a "page" of website projects.
function loadProjectPage(page) {
    return function (resolve, reject, loader) {
        var request = new TBI.AJAX(page.declare, function (xhr) {
            if (xhr.status != 200) return reject("Net error: "+xhr.status+" "+xhr.statusText);
            try {
                parseContentManifest($.parseJSON(xhr.response));
                resolve();
            } catch (e) {
                reject("File failed to parse: "+e.message);
            }
        });
    };
}
// Quite a large function that parses a content manifest passed to it. The manifest is usually loaded through AJAX,
// and contains all the metadata required for parsing the website projects.
function parseContentManifest(manifest) {
    // version control
    if (manifest.version < 2) {
        console.error("Manifest was of an invalid version and was unable to be parsed.");
        return;
    }

    // If this manifest is being used to specify the "pages" which contain the projects...
    if (manifest.role == "page-declaration") {
        var pages = manifest.pages;
        // look through all the specified pages and...
        for (var i=0;i<pages.length;i++) {
            var page = pages[i];

            // resolve the sigil variables
            page.path = replaceWithVariables(page.path, {"id": page.id});
            page.declare = replaceWithVariables(page.declare, {"id": page.id, "path": page.path});

            // append a navigation item
            if ($("header nav .nav-"+page.id).length > 0)
                var navListItem = $("header nav .nav-"+page.id)[0];
            else var navListItem = document.createElement("li");
            navListItem.className = "nav-"+page.id;
                var navLink = document.createElement("a");
                navLink.href = page.path;
                navLink.innerHTML = page.title;
            navListItem.appendChild(navLink);

            // and load the page manifest
            loader.addTask(loadProjectPage(page), null, "projectPage "+page.path);
        }
    // Otherwise, if this manifest is being used to declare projects...
    } else if (manifest.role == "project-declaration") {
        var projects = manifest.projects;
        // find out if this manifest specifies the current webpage's content
        var isCurrentPage = false;
        manifest.path = manifest.path.replace(/\$id/, manifest.id);
        if (manifest.path.replace(/\/$/, "") == location.pathname.replace(/^\//, "").replace(/\/$/, "")) // pretty hacky
            isCurrentPage = true;

        // create an inner-nav list for later reference
        var navListItem = $("header nav .nav-"+manifest.id);
        var innerNav = navListItem.find("ul");
        if (innerNav.length == 0)
            innerNav = navListItem[0].appendChild(document.createElement("ul"));
        else innerNav = innerNav[0];
        innerNav.className = "inner-nav";

        // loop through all the specified projects...
        for (var i=0;i<projects.length;i++) {
            var proj = projects[i];

            // resolve the sigil variables
            proj.path = replaceWithVariables(proj.path, {"page_id": manifest.id, "page_path": manifest.path, "id": proj.id});
            var urlReplacer = {"page_id": manifest.id, "page_path": manifest.path, "id": proj.id, "path": proj.path, "version": proj.version};

            proj.description = replaceWithVariables(proj.description, urlReplacer);
            proj.thumbnail = replaceWithVariables(proj.thumbnail, urlReplacer);
            proj.external = replaceWithVariables(proj.external, urlReplacer);
            proj.source = replaceWithVariables(proj.source, urlReplacer);
            proj.preview_iframe = replaceWithVariables(proj.preview_iframe, urlReplacer);
            proj.preview_image = replaceWithVariables(proj.preview_image, urlReplacer);

            // create an inner nav item for the project
            createInnerNavItem(innerNav, proj.title, manifest.path+"#"+proj.id, proj.external);

            // do extra stuff if this is meant for the current page
            if (isCurrentPage) {
                // create a thumbnail gallery if not already present
                var thumbGallery = $("main .thumb-gallery.project-view")[0];
                if (isNull(thumbGallery)) {
                    thumbGallery = document.createElement("ul");
                    thumbGallery.className = "thumb-gallery project-view";
                    $("main")[0].appendChild(thumbGallery);
                }
                // and add the project as a gallery item
                createThumbGalleryFigure(thumbGallery, proj);
            }
        }
    }
}
// Quick and dirty fix for the <base> href attribute modifying hash links to point to the root directory
// instead of a specified portion of the page.
function fixHashLinks() {
    var links = $("a[href^='#']"); // all links that start with a "#" symbol (relative anchor links)
    links.attr("href", function (i, curr) { return location.pathname + curr; }); // put the current path in front of the URL to make it absolute
}

function handleAnchorLinkSectioning() {
    var anchors = $("h2[id], h3[id]");
    var sectionList = $(".sidebar li.sections");
    var innerNav = sectionList.find("ul");
    if (isNull(innerNav) || innerNav.length == 0) {
        innerNav = sectionList[0].appendChild(document.createElement("ul"));
        innerNav.className = "inner-nav";
        innerNav = $(innerNav);
    }
    innerNav.empty();

    for (var i=0;i<anchors.length;i++) {
        var curr = anchors[i];
        createInnerNavItem(innerNav[0], curr.innerText || curr.textContent, location.pathname + "#" + curr.id);
    }
}

function handleLayoutModification() {
    var left = $("header");
    var right = $(".sidebar");
    var main = $("main");

    main.css("left", left.css("width"));
    main.css("right", right.css("width"));
}

Require(["assets/js/tblib/base.js",     // Concurrently loading the dependencies for the website.
         "assets/js/tblib/util.js",
         "assets/js/tblib/loader.js",
         "assets/js/tblib/net.js",
         "assets/js/tblib/ui.js"], function () {

    // Defined in tblib/net.js
    loader.addTask(executeHTMLIncludes(TBI.Files.HTMLIncludesManifest), null, "HTMLIncludes"); // loads the common sections of the page
    loader.addTask(executeFontLoading(), 5000, "Fonts", ["HTMLIncludes"]); // loads the webfonts

    fixHashLinks();
    // Start loading and parsing the content manifest.
    loader.addTask(loadProjectManifest("assets/data/content.json"), null, "projectManifest", ["HTMLIncludes"]);

    loader.start();

    // When all the above has finished, bind event handlers and such...
    $(document).on("pageload", function () {
        TBI.UI.updateUI();
        fixHashLinks();
        handleAnchorLinkSectioning();
        // When clicking on a gallery item, return a large window with the contents of the description.
        $(".thumb-gallery figure > figcaption").click(function () {
            var desc = $(this).parent().find(".description");
            if (desc.length > 0) {
                var html = desc[0].innerHTML;
                var dialog = new TBI.UI.Dialog(this.innerHTML, html, TBI.UI.DialogButtons.OK);
                dialog.element.className += " project-show";
                var iframes = dialog.element.getn("iframe");
                for (var i=0;i<iframes.length;i++) {
                    iframes[i].src = iframes[i].getAttribute("data-src");
                }
            }
        });

        // location.hash == "#crtpl2" == clicking cartesian plane
        $(location.hash).find("figcaption").click();

        $("header").mouseenter(function () {
            $("body").toggleClass("in-shadow", true);
        });
        $("header").mouseleave(function () {
            $("body").toggleClass("in-shadow", false);
        });

        var layoutModTimer = setInterval(function () { handleLayoutModification(); }, 10);

        // interactive scrolling - marks the closest item to the scroll position
        var tempscroll = false,
            headers = $("h2[id], h3[id]");
        $(document).scroll(function () {
            var hash = "",
                currScroll = new Vector2D(window.scrollX, window.scrollY);
            if (tempscroll) return tempscroll = false;
            for (var i=0;i<headers.length;i++) if ($(headers[i]).offset().top <= currScroll.y) hash = "#"+headers[i].id;
            if (hash != location.hash) {
                location.hash = hash;
                tempscroll = true;
                scrollTo(currScroll.x, currScroll.y);
                $(".sections > ul > li > a.active").toggleClass("active", false);
                $(".sections > ul > li > a[href='"+location.pathname+hash+"']").toggleClass("active", true);
            }
        });
    });
});

});
