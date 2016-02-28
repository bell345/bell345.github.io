function PriorityQueue() {
    this._storage = [];
    var self = this;
    Object.defineProperty(this, "length", {
        get: function () { return self._storage.length; }
    });
}
PriorityQueue.prototype = {
    constructor: PriorityQueue,
    push: function (item, priority) {
        this._storage.push({ item: item, priority: priority });
        this._storage = this._storage.sort(function (a, b) { return a.priority < b.priority; });
    },
    pop: function () {
        return this._storage.pop();
    }
};

var indices = [],
    randStraightTotal = 0;
function DataMap2D(arr, width, height) {
    this.array = arr;
    this.width = width;
    this.height = height;
}
DataMap2D.prototype.setXY = function (x, y, value) {
    if (isNaN(value)) debugger;
    this.array[y + x * this.width] = value;
};
DataMap2D.prototype.getXY = function (x, y) {
    return this.array[y + x * this.width];
};

function generateDSTerrain(detail, roughness_arg, seeds, smoothing_factor, smoothing_passes) {
    var res = Math.pow(2, detail),
        geometry = new THREE.PlaneGeometry(1, 1, res, res),
        v = new DataMap2D(geometry.vertices, res + 1, res + 1);

    function squareStep(x, y, halfWidth, roughness) {
        var accum = 0,
            validPoints = 0;

        if (x - halfWidth >= 0   && ++validPoints) accum += v.getXY(x - halfWidth, y            ).z;
        if (x + halfWidth <= res && ++validPoints) accum += v.getXY(x + halfWidth, y            ).z;
        if (y - halfWidth >= 0   && ++validPoints) accum += v.getXY(x,             y - halfWidth).z;
        if (y + halfWidth <= res && ++validPoints) accum += v.getXY(x,             y + halfWidth).z;

        if (validPoints !== 0) {
            var value = accum / validPoints;
            value += (Math.random() - 0.5) * roughness;

            v.getXY(x, y).setZ(value);
        }
    }

    function diamondStep(x, y, width, roughness) {
        var halfWidth = width / 2;

        var accum = 0;
        accum += v.getXY(x,         y        ).z;
        accum += v.getXY(x,         y + width).z;
        accum += v.getXY(x + width, y        ).z;
        accum += v.getXY(x + width, y + width).z;

        var middle = accum / 4;
        middle += (Math.random() - 0.5) * roughness;

        v.getXY(x + halfWidth, y + halfWidth).setZ(middle);
    }

    v.getXY(0,     0).setZ(seeds[0]);
    v.getXY(res,   0).setZ(seeds[1]);
    v.getXY(0,   res).setZ(seeds[2]);
    v.getXY(res, res).setZ(seeds[3]);

    var roughness = roughness_arg;
    var width = res;
    do {
        var x, y, halfWidth = width/2;

        for (x = 0; x < res; x += width)
            for (y = 0; y < res; y += width)
                diamondStep(x, y, width, roughness);

        for (x = halfWidth; x < res; x += width)
            for (y = 0; y <= res; y += width)
                squareStep(x, y, halfWidth, roughness);

        for (x = 0; x <= res; x += width)
            for (y = halfWidth; y < res; y += width)
                squareStep(x, y, halfWidth, roughness);

        roughness /= 2;
        width = halfWidth;
    } while (width > 1);

    if (smoothing_factor !== undefined)
        geometry = smoothGeometry(geometry, res+1, res+1, smoothing_factor, smoothing_passes);

    geometry.verticesNeedUpdate = true;

    return geometry;
}

function smoothGeometry(geometry, width, height, factor, passes) {
    var v = new DataMap2D(geometry.vertices, width, height);

    var x, y;
    while (passes --> 0) {
        for (x = 0; x < width; x++) {
            for (y = 1; y < height; y++) v.getXY(x, y).setZ(
                v.getXY(x, y - 1).z * (1 - factor) +
                v.getXY(x, y).z * factor
            );

            for (y = 0; y < height-1; y++) v.getXY(x, y).setZ(
                v.getXY(x, y + 1).z * (1 - factor) +
                v.getXY(x, y).z * factor
            );
        }
        for (y = 0; y < height; y++) {
            for (x = 1; x < width; x++) v.getXY(x, y).setZ(
                v.getXY(x - 1, y).z * (1 - factor) +
                v.getXY(x, y).z * factor
            );

            for (x = 0; x < width-1; x++) v.getXY(x, y).setZ(
                v.getXY(x + 1, y).z * (1 - factor) +
                v.getXY(x, y).z * factor
            );
        }
    }

    return geometry;
}

function indicateOrder(detail) {
    var res = Math.pow(2, detail),
        geometry = new THREE.PlaneGeometry(1, 1, res, res);

    for (var i=0;i<geometry.vertices.length;i++)
        geometry.vertices[i].setZ(i / geometry.vertices.length);

    geometry.verticesNeedUpdate = true;

    return geometry;
}

var gen;
$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js",
    "assets/js/tblib/math.js"
], function () {

    LineSegment = NewLineSegment;

    function CityGenerator(rootElement, expandElement) {
        Wide3D.call(this, rootElement, expandElement);

        this.settings = {
            terrain: {
                detail: 9,
                diffuse: 0xffffff,
                scale: new THREE.Vector3(25, 25, 3),
                roughness: 0.3,
                smoothing: 0.0,
                smoothingPasses: 4
            },
            water: {
                diffuse: 0x0094ff,
                seaLevel: 0.0
            },
            cities: {
                maxElevation: 2,
                size: 0.8,
                maxNumber: 10,
                minNumber: 4,
                minSize: 0.3,
                timeout: 8000
            },
            density: {
                resolution: 512,
                maxHeight: 0.6
            },
            roads: {
                highwayBranchThreshold: 0.1,
                highwayBranchLength: 0.07,
                highwayBranchProbability: 0.2,
                branchLength: 0.005,
                branchTime: 5,
                branchProbability: 0.4,
                branchThreshold: 0.02,
                deviationAngle: dtr(75)
            }
        };
        this.state = {};

        this.generateTerrain = function () {
            var s = this.settings.terrain;

            var terrain = new THREE.Mesh(generateDSTerrain(s.detail, s.roughness, [ 0, 0.1, 0, 0 ], 1 - s.smoothing, s.smoothingPasses),
                new THREE.MeshPhongMaterial({ color: s.diffuse, shininess: 50, side: THREE.DoubleSide, shading: THREE.FlatShading }));
            terrain.scale.copy(s.scale);
            
            return terrain;
        };
        this.generateWater = function () {
            var s = this.settings.water,
                ts = this.settings.terrain;
            
            var water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
                new THREE.MeshPhongMaterial({ color: s.diffuse, shininess: 50, opacity: 0.7, transparent: true, side: THREE.DoubleSide, shading: THREE.FlatShading }));
            water.scale.copy(ts.scale);
            water.position.z = s.seaLevel;
            
            return water;
        };
        this.generateCities = function (terrain) {
            var s = this.settings.cities,
                ws = this.settings.water,
                ts = this.settings.terrain;
            
            var cities = [],
                noCities = Math.floor(Math.random()*(s.maxNumber - s.minNumber) + s.minNumber),
                res = Math.pow(2, ts.detail);
            
            for (var i=0;i<noCities;i++) {
                var v = new DataMap2D(terrain.geometry.vertices, res+1, res+1);

                var x, y, startTime = +(new Date);
                do {
                    x = Math.floor(Math.random()*res);
                    y = Math.floor(Math.random()*res);

                    if (startTime + s.timeout < +(new Date))
                        throw new Error("Timed out!");

                } while (Math.bound(v.getXY(x, y).z, ws.seaLevel, s.maxElevation) !== v.getXY(x, y).z);

                var maxRadius = (s.minSize + (Math.random() * (s.size - s.minSize))) * ts.scale.x;

                // temporary marker
                //var sphere = new THREE.Mesh(new THREE.SphereGeometry(maxRadius, 32, 32),
                //    new THREE.MeshBasicMaterial({ color: 0xcc7777, opacity: 0.4, transparent: true, shading: THREE.FlatShading }));
                //sphere.position.copy(v.getXY(x, y)).multiply(ts.scale);
                //this.terrainRoot.add(sphere);

                cities[i] = {
                    terrainPoint: v.getXY(x, y),
                    maxRadius: maxRadius
                };
            }

            return cities;
        };
        this.generateRoads = function (terrain, densityMap) {
            var rset = this.settings.roads;
            function populationDensity(xy) {
                var coords = new Vector2D(
                    (xy.x) * densityMap.image.width,
                    (xy.y) * densityMap.image.height
                );

                var data = densityMap.image.data,
                    i = Math.floor((coords.x * densityMap.image.width + coords.y) * 3);

                var value = (data[i] + data[i+1] + data[i+2]) / 765; // 3 * 255;
                indices.push(coords);

                return value || 0;
            }
            function randomDeviation(angle) {
                return (Math.random()*angle) - (angle/2);
            }
            function localConstraints(road) {
                var clamp = road.s.end.clamp(new Vector2D(0, 0), new Vector2D(1, 1));
                if (!clamp.equals(road.s.end)) {
                    road.s.end = clamp;
                    road.severed = true;
                    return road;
                }

                var roadlength = road.s.vec().magnitudeSquared();
                var nearby = segments.filter(function (r) {
                    return (
                        r.s.start.subtract(road.s.end).magnitudeSquared() < roadlength ||
                        r.s.end.subtract(road.s.end).magnitudeSquared()   < roadlength
                    ) && (!road.previous || !r.s.equals(road.previous.s)) && (!r.previous || !r.previous.s.equals(road.previous.s));
                });

                var crossed = nearby.map(function (r) {
                    return r.s.hasIntersection(road.s);
                }).filter(function (e) {
                    return !!e;
                }).sort(function (a, b) {
                    return road.s.end.subtract(a).magnitude() - road.s.end.subtract(b).magnitude();
                });

                if (crossed.length > 0) {
                    road.s.end = crossed[0];
                    road.severed = true;
                    return road;
                }

                var isects = [];
                nearby.forEach(function (r) {
                    if (r.s.end.subtract(road.s.end).magnitude() < roadlength && r.branches.length > 1)
                        isects.push([r, r.s.end]);
                    if (r.s.start.subtract(road.s.end).magnitude() < roadlength && r.previous && r.previous.branches > 1)
                        isects.push([r.previous, r.s.start]);
                });

                isects.sort(function (sec1, sec2) {
                    return sec1[1].subtract(road.end).magnitude() - sec2[1].subtract(road.end).magnitude();
                });

                if (isects.length > 0) {
                    road.s.end = isects[0][1];
                    road.severed = true;
                    return road;
                }

                var originalEnd = road.s.end;
                road.s.end = road.s.end.add(road.s.vec());

                crossed = nearby.map(function (r) {
                    return r.s.hasIntersection(road.s);
                }).filter(function (e) {
                    return !!e;
                }).sort(function (a, b) {
                    return road.s.end.subtract(a).magnitude() - road.s.end.subtract(b).magnitude();
                });

                if (crossed.length > 0) {
                    road.s.end = crossed[0];
                    road.severed = true;
                    return road;
                }

                road.s.end = originalEnd;
                return road;
            }
            function globalGoals(road) {
                var branches = [];
                function extendRoad(road, angle, highway) {
                    highway = isNull(highway) ? road.highway : highway;
                    var newr = new Road(
                        new LineSegment(
                            road.s.end,
                            road.s.end.add(Vector2D.fromPolar(
                                road.s.vec().angle() + angle || 0,
                                highway ? rset.highwayBranchLength : rset.branchLength
                            ))
                        ), highway
                    );
                    newr.previous = road;
                    return newr;
                }
                function addBranch(road, priority) {
                    road.density = populationDensity(road.s.end);
                    branches.push({
                        road: road,
                        priority: isNull(priority) ? (road.highway ? 0 : rset.branchTime) : priority
                    });
                }

                if (road.severed) return [];

                var straight = extendRoad(road);
                if (road.highway) {
                    var randStraight = extendRoad(road, randomDeviation(rset.deviationAngle));

                    var roadPop;
                    if (populationDensity(straight.s.end) > populationDensity(randStraight.s.end)) {
                        addBranch(straight);
                        roadPop = populationDensity(straight.s.end);
                    } else {
                        randStraightTotal++;
                        addBranch(randStraight);
                        roadPop = populationDensity(randStraight.s.end);
                    }

                    if (roadPop >= rset.highwayBranchThreshold) {
                        if (Math.random() < rset.highwayBranchProbability) {
                            var leftBranch = extendRoad(road, randomDeviation(rset.deviationAngle) - dtr(90));
                            addBranch(leftBranch);
                        }
                        if (Math.random() < rset.highwayBranchProbability) {
                            var rightBranch = extendRoad(road, randomDeviation(rset.deviationAngle) + dtr(90));
                            addBranch(rightBranch);
                        }
                    }
                } else if (populationDensity(straight.s.end) > rset.branchThreshold)
                    addBranch(straight, 0);

                console.log(populationDensity(straight.s.end));
                if (populationDensity(straight.s.end) > rset.branchThreshold) {
                    if (Math.random() < rset.branchProbability) {
                        var leftBranch = extendRoad(road, randomDeviation(rset.deviationAngle) - dtr(90), false);
                        addBranch(leftBranch);
                    }
                    if (Math.random() < rset.branchProbability) {
                        var rightBranch = extendRoad(road, randomDeviation(rset.deviationAngle) + dtr(90), false);
                        addBranch(rightBranch);
                    }
                }
                road.branches = road.branches.concat(branches);
                return branches;
            }
            function Road(segment, highway) {
                this.s = segment;
                this.highway = highway || false;
                this.severed = false;
                this.previous = null;
                this.branches = [];
            }

            var queue = new PriorityQueue(),
                segments = [];

            var tries = 0,
                startRoad;

            do {
                var startPos = new Vector2D(Math.random(), Math.random());
                startRoad = new Road(new LineSegment(
                    startPos,
                    startPos.add(Vector2D.fromPolar(
                        Math.random()*2*Math.PI,
                        0.01
                    ))
                ), true);
                tries++;
            } while (populationDensity(startRoad.s.end) == 0 && tries < 200);
            queue.push(startRoad, 0);

            while (queue.length > 0 && segments.length < 2000) {
                var item = queue.pop(),
                    road = item.item;

                road = localConstraints(road);
                if (!road) continue;

                segments.push(road);
                globalGoals(road).forEach(function (e) {
                    queue.push(e.road, item.priority + e.priority + 1);
                });
            }

            return segments;
        };
        this.generateDensityMap = function (terrain, cities) {
            var s = this.settings.density,
                ts = this.settings.terrain,
                ws = this.settings.water,
                res = Math.pow(2, ts.detail),
                v = new DataMap2D(terrain.geometry.vertices, res+1, res+1);

            var texture = THREE.ImageUtils.generateDataTexture(s.resolution, s.resolution, 0xffffff),
                img = texture.image;

            function getTerrainVertex(x, y) {
                var dx = Math.floor(x/img.width * (res+1)),
                    dy = Math.floor(y/img.height * (res+1));

                return v.getXY(dx, dy);
            }

            for (var x = 0; x < img.width; x++) {
                for (var y = 0; y < img.height; y++) {
                    var i = (y + x * img.width) * 3;
                    var vertex = getTerrainVertex(x, y),
                        diff = new THREE.Vector3();

                    diff.copy(vertex);

                    if (vertex.z >= ws.seaLevel) {
                        var cityFactor = 0;
                        for (var j=0;j<cities.length;j++) {
                            cityFactor = Math.max(cityFactor, 1 -
                                (diff.sub(cities[j].terrainPoint)
                                    .multiply(ts.scale)
                                    .length()
                                ) / cities[j].maxRadius);
                            diff.copy(vertex);
                        }
                        cityFactor = Math.max(0, cityFactor);

                        var elevationFactor = Math.max(0, 1 -
                            ((vertex.z + ws.seaLevel) / s.maxHeight));

                        img.data[i] = 255 * cityFactor * elevationFactor;
                        img.data[i + 1] = 255 * cityFactor * elevationFactor;
                        img.data[i + 2] = 255 * cityFactor * elevationFactor;
                    } else {
                        img.data[i] = 0;
                        img.data[i + 1] = 0;
                        img.data[i + 2] = 0;
                    }
                }
            }

            texture.flipY = true;
            texture.needsUpdate = true;

            return texture;
        };
        this.generateHeightMap = function (terrain) {
            var s = this.settings.density,
                ts = this.settings.terrain,
                res = Math.pow(2, ts.detail),
                v = new DataMap2D(terrain.geometry.vertices, res+1, res+1);

            var texture = THREE.ImageUtils.generateDataTexture(s.resolution, s.resolution, 0xffffff),
                img = texture.image;

            function getTerrainVertex(x, y) {
                var dx = Math.floor(x/img.width * (res+1)),
                    dy = Math.floor(y/img.height * (res+1));

                return v.getXY(dx, dy);
            }

            for (var x=0;x<img.width;x++) {
                for (var y=0;y<img.height;y++) {
                    var i = (y + x * img.width) * 3;
                    var vertex = getTerrainVertex(x, y);

                    img.data[i] = img.data[i+1] = img.data[i+2] = Math.max(255 * 4 * vertex.z);
                }
            }

            texture.flipY = true;
            texture.needsUpdate = true;

            return texture;
        };

        this.appendRoads = function (roads) {
            var self = this,
                densityMap = this.terrain.material.map,
                ds = this.settings.density,
                ts = this.settings.terrain,
                res = Math.pow(2, ts.detail),
                v = new DataMap2D(this.terrain.geometry.vertices, res+1, res+1);

            this.roads.forEach(function (r) {
                function getTerrainVertex(x, y) {
                    var dx = Math.min(res, Math.max(0, Math.floor(x * (res+1)))),
                        dy = Math.min(res, Math.max(0, Math.floor(y * (res+1))));

                    return v.getXY(dx, dy);
                }

                var scale = new Vector2D(ts.scale.x, ts.scale.y);
                var vec = r.s.vec().multiply(scale);
                var mid = r.s.midpoint();
                var end = r.s.end;
                var midadj = r.s.midpoint().subtract(new Vector2D(0.5, 0.5)).multiply(scale);
                var z = getTerrainVertex(mid.x, mid.y).z * ts.scale.z;
                var zdiff = Math.abs(z - getTerrainVertex(end.x, end.y).z * ts.scale.z);

                //var colour = (r.highway ? new THREE.Color(0, 0, 1) : new THREE.Color(1, 0, 0));
                var colour = new THREE.Color(0, 0, r.density);

                var geo = new THREE.PlaneGeometry(vec.magnitude(), 0.05);
                var mat = new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide });
                var mesh = new THREE.Mesh(geo, mat);
                mesh.translateX(midadj.x);
                mesh.translateY(midadj.y);
                mesh.translateZ(z);
                mesh.rotateZ(vec.angle());
                mesh.rotateX(Math.asin((2*zdiff)/vec.magnitude()));
                self.roadRoot.add(mesh);
            });
        };

        this.init = function () {
            this.scene.children = [];
            this.renderer.setClearColor(0xeeeeee);

            this.terrainRoot = new THREE.Object3D();
            this.terrainRoot.rotation.x = -Math.PI/2;
            this.scene.add(this.terrainRoot);

            this.roadRoot = new THREE.Object3D();
            this.roadRoot.rotation.z = -Math.PI/2;
            this.roadRoot.position.z += 0.01;
            this.terrainRoot.add(this.roadRoot);

            this.terrain = this.generateTerrain();
            this.terrainRoot.add(this.terrain);

            this.water = this.generateWater();
            this.terrainRoot.add(this.water);

            this.cities = this.generateCities(this.terrain);

            this.densityMap = this.generateDensityMap(this.terrain, this.cities);
            this.heightMap = this.generateHeightMap(this.terrain);
            this.terrain.material.map = this.densityMap;

            this.roads = this.generateRoads(this.terrain, this.densityMap);
            this.appendRoads(this.roads);

            this.light = new THREE.PointLight(0xffffff, 1, 100);
            this.light.position.set(5, 5, -5);
            this.scene.add(this.light);

            //this.box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x00ff00}));
            //this.scene.add(this.box);

            this.camera.position.y = 5;
            this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        };

        this.loop = function (delta) {
            this.animate(delta);
        };
        this.animate = function (delta) {
            var t = +(new Date);

            this.camera.position.x = Math.sin(t/1000)*2;
            this.camera.position.z = Math.cos(t/1000)*2;
            this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        };
    }
    CityGenerator.prototype = Object.create(Wide3D.prototype);
    CityGenerator.prototype.constructor = CityGenerator;

    loader.start();

    $(document).on("pageload", function () {
        gen = new CityGenerator($(".canvas-container")[0], $(".canvas-container")[0]);
        gen.init();
    });
});
});
