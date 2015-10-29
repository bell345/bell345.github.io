/**
 * Created by Thomas on 2015-10-20.
 */
var crtpl3_persistPlugin = module.exports = new CrtPlanePlugin({
    name: "persistency",
    settings: {
        persistency: {
            name: "crtpl3-save",
            interval: -1,
            notify: true
        }
    },
    iface: {
        save: function () {
            var plane = this;
            var obj = {
                settings: this.settings,
                state: this.state,
                objects: {}
            };
            for (var id in plane.objects) if (plane.objects.hasOwnProperty(id)) {
                if (plane.objects[id].serialise) {
                    obj.objects[id] = {
                        serial: plane.objects[id].serialise(),
                        constructor: plane.objects[id].constructor.name
                    };
                }
            }
            return JSON.stringify(obj);
        },
        load: function (str) {
            var plane = this;
            var obj = JSON.parse(str);
            plane.updateSettings(obj.settings, "settings");
            plane.updateSettings(obj.state, "state");
            for (var id in obj.objects) if (obj.objects.hasOwnProperty(id)) {
                var curr = obj.objects[id];
                if (window[curr.constructor] &&
                    window[curr.constructor].deserialise) {
                    plane.objects[id] =
                        window[curr.constructor].deserialise(curr.serial);
                }
            }
            this.triggerNextUpdate = true;
            return this;
        }
    },
    creation: function (plane) {
        plane.addEventHandler("save", function (plane, autosave) {
            var set = plane.settings.persistency;
            try {
                localStorage.setItem(set.name, plane.save());
                if (set.notify)
                    TBI.log(autosave ? "Autosaved." : "Saved.");
            } catch (e) {
                TBI.error("Failed to save: "+e.message);
            }
        });
        var autosave = function (save) {
            if (save) plane.triggerEvent("save", true);
            var interval = plane.settings.persistency.interval;
            setTimeout(function () {
                autosave(interval >= 0);
            }, interval < 0 ? 1000 : interval);
        };
        autosave(false);

        $(window).bind("beforeunload", function () {
            plane.triggerEvent("save");
        });
    }
});
