var gen;
$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js"
], function () {

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

    function CityGenerator(rootElement, expandElement) {
        Wide3D.call(this, rootElement, expandElement);

        this.settings = {
            terrain: {
                detail: 8,
                diffuse: 0xffffff,
                scale: new THREE.Vector3(5, 5, 2),
                roughness: 0.3,
                smoothing: 0.1,
                smoothingPasses: 4
            },
            water: {
                diffuse: 0x0094ff,
                seaLevel: 0.0
            },
            cities: {
                maxElevation: 2,
                size: 0.5,
                maxNumber: 6,
                minNumber: 2,
                minSize: 0.1,
                timeout: 8000
            },
            density: {
                resolution: 256,
                maxHeight: 0.6
            }
        };
        this.state = {};

        this.renderer.setClearColor(0xeeeeee);

        this.terrainRoot = new THREE.Object3D();
        this.terrainRoot.rotation.x = -Math.PI/2;
        this.scene.add(this.terrainRoot);

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
                var sphere = new THREE.Mesh(new THREE.SphereGeometry(maxRadius, 32, 32),
                    new THREE.MeshBasicMaterial({ color: 0xcc7777, opacity: 0.4, transparent: true, shading: THREE.FlatShading }));
                sphere.position.copy(v.getXY(x, y)).multiply(ts.scale);
                this.terrainRoot.add(sphere);

                cities[i] = {
                    terrainPoint: v.getXY(x, y),
                    maxRadius: maxRadius
                };
            }

            return cities;
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

        this.init = function () {
            this.terrain = this.generateTerrain();
            this.terrainRoot.add(this.terrain);

            this.water = this.generateWater();
            this.terrainRoot.add(this.water);

            this.cities = this.generateCities(this.terrain);

            var densityMap = this.generateDensityMap(this.terrain, this.cities);
            this.terrain.material.map = densityMap;

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

            //this.camera.position.x = Math.sin(t/1000)*2;
            //this.camera.position.z = Math.cos(t/1000)*2;
            //this.camera.lookAt(new THREE.Vector3(0, 0, 0));
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
