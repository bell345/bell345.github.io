/**
 * Created by Thomas on 2015-10-05.
 */
var crtpl3_animPlugin = module.exports = new CrtPlanePlugin({
    name: "animation",
    settings: {
        animation: {
            duration: 1200,
            durations: {

            },
            timingFunc: TimingFunctions.quintic.both
        }
    },
    iface: {
        animations: {},
        propertyLocked: function (property) {
            if (isNull(this.animations[property])) return false;
            else {
                var anim = this.animations[property];
                if (isNull(anim.tween)) return false;
                else if (anim.tween.completed) return false;

                return true;
            }
        },
        addAnimation: function (property, end, pDuration, pFunc, pOnCompleted) {
            var plane = this;
            var set = plane.settings.animation;
            var func = pFunc || set.timingFunc;
            var duration = pDuration || set.duration;
            var onCompleted = pOnCompleted || function () {};
            if (this.propertyLocked(property)) {
                var anim = this.animations[property];
                anim.tween.duration = anim.tween.elapsedTime + duration;
                anim.tween.end = end;
                if (!isNull(pFunc)) anim.tween.timingFunction = func;
            } else {
                var isVector = end instanceof Vector2D;
                var isColour = end instanceof Colour || typeof end == typeof "";
                var tween;
                if (isVector) tween = new Tween.Vector(this.getProperty(property).copy(), end, duration, func);
                else if (isColour)
                    tween = new Tween.Colour(new Colour(this.getProperty(property).toString()),
                        new Colour(end.toString()), duration, func);
                else tween = new Tween(this.getProperty(property), end, duration, func);

                this.animations[property] = {
                    tween: tween,
                    property: property,
                    onCompleted: onCompleted
                };
            }
        }
    },
    tick: function (plane) {
        var anims = plane.animations;
        var expired = [], curr;
        for (var prop in anims) if (anims.hasOwnProperty(prop)) {
            curr = anims[prop];
            if (curr.tween instanceof Tween) {
                plane.setProperty(prop, curr.tween.value);
                if (curr.tween.completed) {
                    if (curr.onCompleted instanceof Function)
                        curr.onCompleted(plane, curr);
                    expired.push(prop);
                }
            } else expired.push(prop);
        }
        expired.forEach(function (e) { delete anims[e]; });
    }
});
