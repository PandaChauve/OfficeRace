///<reference path="phaser/phaser.d.ts" />
var Drone = (function () {
    function Drone(game, ismain) {
        this._id = -1;
        this._lastUpdate = -1;
        this.sprite = game.add.sprite(8.5, 19, 'drone');
        this.sprite.animations.add('fly', [0, 1], 10, true);
        game.physics.p2.enable(this.sprite);
        this.sprite.body.mainDrone = ismain;
        this.SetLevel(-1);
    }
    Drone.prototype.SetId = function (id) {
        this._id = id;
    };
    Drone.prototype.GetId = function () {
        return this._id;
    };
    Drone.prototype.Slow = function () {
        this.sprite.body.data.velocity[0] *= 0.985;
        this.sprite.body.data.velocity[1] *= 0.985;
    };
    Drone.prototype.UpdateAngle = function (turnLeft, turnRight) {
        if (turnLeft == turnRight)
            this.sprite.body.setZeroRotation();
        else
            turnLeft ? this.sprite.body.rotateLeft(100) : this.sprite.body.rotateRight(100);
    };
    Drone.prototype.UpdateSpeed = function (accelerate, decelerate) {
        this.Slow();
        if (accelerate) {
            this.sprite.body.thrust(200);
        }
        if (decelerate) {
            this.sprite.body.reverse(200);
        }
    };
    Drone.prototype.TicUpdate = function (keys) {
        this.sprite.animations.play('fly');
        this.UpdateAngle(keys.left.isDown, keys.right.isDown);
        this.UpdateSpeed(keys.up.isDown, keys.down.isDown);
    };
    Drone.prototype.GetPosition = function () {
        return [this.sprite.body.velocity.x, this.sprite.body.velocity.y, this.sprite.body.x, this.sprite.body.y, this.sprite.body.angle, this.GetLevel()];
    };
    Drone.prototype.SetPosition = function (data, ref) {
        if (ref <= this._lastUpdate)
            return;
        this._lastUpdate = ref;
        this.sprite.body.velocity.x = data[0];
        this.sprite.body.velocity.y = data[1];
        this.sprite.body.x = data[2];
        this.sprite.body.y = data[3];
        this.sprite.body.angle = data[4];
        this.SetLevel(data[5]);
    };
    Drone.prototype.SetLevel = function (lvl) {
        this.sprite.body.droneLevel = lvl;
    };
    Drone.prototype.GetLevel = function () {
        return this.sprite.body.droneLevel;
    };
    return Drone;
})();
///<reference path="jquery.d.ts" />
;
var DroneApi = (function () {
    function DroneApi() {
        this._id = -1;
        this._host = "http://192.168.1.3:1338/droneApi/";
    }
    DroneApi.prototype.Register = function (cb) {
        var that = this;
        $.get(this._host + "games/0/register", function (data) {
            that._id = data;
            cb(data);
        });
    };
    DroneApi.prototype.SendPos = function (droneState, gameState, cb) {
        if (this._id == -1)
            return;
        var data = JSON.stringify({ id: this._id, gameData: gameState, droneData: droneState });
        $.ajax({
            url: this._host + "games/0/update/" + this._id,
            type: 'POST',
            contentType: 'application/json',
            data: data,
            success: cb
        });
    };
    return DroneApi;
})();
var Slice = (function () {
    function Slice(game) {
        this.Static = game.add.group();
        this.Dynamic = game.add.group();
        this.Collide = false;
    }
    Slice.prototype.SetAlpha = function (alpha) {
        this.Static.alpha = alpha;
        this.Dynamic.alpha = alpha;
    };
    return Slice;
})();
var Map = (function () {
    function Map(_game) {
        this._game = _game;
        this._currentLvl = -1;
        this._slices = new Array();
        this._targets = 0;
        this.CreateSlice('bottom', 'office');
        this.CreateSlice('middle', 'office');
        this.CreateSlice('top', 'office');
        this.updateLevel();
        this._slices[0].Static.getTop().resizeWorld();
    }
    Map.prototype.CreateSlice = function (sliceName, tileset) {
        this._currentLvl++;
        this._slices.push(new Slice(this._game));
        var map = this._game.add.tilemap(sliceName);
        map.addTilesetImage(tileset);
        var layer = map.createLayer(sliceName);
        this._slices[this._currentLvl].Static.add(layer);
        map.setCollisionBetween(1, 1000, true, sliceName);
        var elems = this._game.physics.p2.convertTilemap(map, layer);
        for (var idx = 0; idx < elems.length; ++idx)
            elems[idx].droneLevel = this._currentLvl;
    };
    Map.prototype.GoUp = function (drone) {
        if (this._currentLvl + 1 < this._slices.length && !this._slices[this._currentLvl + 1].Collide) {
            this.goUpOrDown(drone, true);
        }
    };
    Map.prototype.GoDown = function (drone) {
        if (this._currentLvl - 1 >= 0 && !this._slices[this._currentLvl - 1].Collide) {
            this.goUpOrDown(drone, false);
        }
    };
    Map.prototype.goUpOrDown = function (drone, up) {
        this._slices[this._currentLvl].Dynamic.remove(drone.sprite);
        this._currentLvl += up ? 1 : -1;
        drone.SetLevel(this._currentLvl);
        this.updateLevel();
        this._slices[this._currentLvl].Dynamic.add(drone.sprite);
    };
    Map.prototype.updateLevel = function () {
        for (var idx = 0; idx < this._slices.length; ++idx) {
            if (idx == this._currentLvl) {
                this._slices[idx].SetAlpha(1);
            }
            else if (Math.abs(idx - this._currentLvl) == 1) {
                this._slices[idx].SetAlpha(0.4);
            }
            else {
                this._slices[idx].SetAlpha(0);
            }
        }
    };
    Map.prototype.SetCollide = function (droneLevel) {
        this._slices[droneLevel].Collide = true;
    };
    Map.prototype.ResetCollide = function () {
        for (var idx = 0; idx < this._slices.length; ++idx)
            this._slices[idx].Collide = false;
    };
    Map.prototype.SetElement = function (drone) {
        if (drone.GetLevel() < 0)
            drone.SetLevel(this._currentLvl);
        for (var idx = 0; idx < this._slices.length; ++idx) {
            if (idx == drone.GetLevel())
                this._slices[idx].Dynamic.add(drone.sprite);
            else
                this._slices[idx].Dynamic.remove(drone.sprite);
        }
    };
    Map.prototype.AddTarget = function (x, y, lvl) {
        var obj = this._game.add.sprite(8.5, 19, 'diamond');
        this._game.physics.p2.enable(obj);
        obj.body.x = x;
        obj.body.y = y;
        obj.body.isTarget = true;
        obj.body.droneLevel = lvl;
        this._slices[lvl].Dynamic.add(obj);
        this._targets++;
    };
    Map.prototype.Destroy = function (obj) {
        this._targets--;
        obj.sprite.kill();
        obj.destroy(); //FIXME remove from group
    };
    Map.prototype.IsMapComplete = function () {
        return this._targets == 0;
    };
    Map.prototype.RemainingTargetCount = function () {
        return this._targets;
    };
    return Map;
})();
///<reference path="phaser/phaser.d.ts" />
var Target = (function () {
    function Target(game) {
        this.sprite = game.add.sprite(8.5, 19, 'diamond');
        game.physics.p2.enable(this.sprite);
        this.sprite.body.x = 300;
        this.sprite.body.isTarget = true;
        this.SetLevel(1);
    }
    Target.prototype.SetLevel = function (lvl) {
        this.sprite.body.droneLevel = lvl;
    };
    Target.prototype.GetLevel = function () {
        return this.sprite.body.droneLevel;
    };
    return Target;
})();
///<reference path="phaser/phaser.d.ts" />
///<reference path="drone.ts" />
///<reference path="drone_api.ts" />
///<reference path="map.ts" />
///<reference path="target.ts" />
var SimpleGameDebug = (function () {
    function SimpleGameDebug() {
        this._api = new DroneApi();
        var that = this;
        this._game = new Phaser.Game(1920 * 0.8, 1080 * 0.8, Phaser.AUTO, 'content', {
            preload: function () {
                return that.preload();
            }, create: function () {
                return that.create();
            }, update: function () {
                return that.update();
            }, render: function () {
                return that.render();
            }
        });
    }
    SimpleGameDebug.prototype.preload = function () {
        this._game.load.spritesheet('drone', 'ressources/drone.png', 17, 19);
        this._game.load.spritesheet('diamond', 'ressources/diamond.png', 17, 19);
        this._game.load.tilemap('bottom', 'ressources/sans-titre.json', null, Phaser.Tilemap.TILED_JSON);
        this._game.load.tilemap('middle', 'ressources/sans-titre.json', null, Phaser.Tilemap.TILED_JSON);
        this._game.load.tilemap('top', 'ressources/sans-titre.json', null, Phaser.Tilemap.TILED_JSON);
        this._game.load.image('office', 'ressources/test.bmp');
    };
    SimpleGameDebug.prototype.create = function () {
        this._game.physics.startSystem(Phaser.Physics.P2JS);
        var that = this;
        this._drones = [];
        this._player = new Drone(this._game, true);
        this._map = new Map(this._game);
        this._map.AddTarget(100, 100, 0);
        this._map.AddTarget(200, 200, 1);
        this._map.AddTarget(150, 150, 2);
        this._api.Register(function (id) {
            that._player.SetId(id);
        });
        this._game.stage.backgroundColor = "#FFDFDF";
        this._game.camera.follow(this._player.sprite);
        this._keys = this._game.input.keyboard.createCursorKeys();
        this._game.physics.p2.setPostBroadphaseCallback(this.collide, this);
        this._game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onUp.add(this.changeLayer, this);
        this._game.input.keyboard.addKey(Phaser.Keyboard.CONTROL).onUp.add(this.changeLayer, this);
        this._game.physics.p2.setBoundsToWorld(true, true, true, true, false);
        this._map.SetElement(this._player);
    };
    SimpleGameDebug.prototype.collide = function (left, right) {
        if (left.mainDrone && right.mainDrone === undefined) {
            this._map.SetCollide(right.droneLevel);
        }
        else if (left.mainDrone === undefined && right.mainDrone) {
            this._map.SetCollide(left.droneLevel);
        }
        if (left.droneLevel == right.droneLevel) {
            if (left.mainDrone && right.isTarget) {
                this._map.Destroy(right);
                return false;
            }
            else if (left.isTarget && right.mainDrone) {
                this._map.Destroy(left);
                return false;
            }
        }
        return left.droneLevel == right.droneLevel; //collide if same level
    };
    SimpleGameDebug.prototype.update = function () {
        this._player.TicUpdate(this._keys);
        var that = this;
        this._api.SendPos(this._player.GetPosition(), this._map.RemainingTargetCount(), function (data) {
            for (var idx in data) {
                if (data[idx].id != that._player.GetId()) {
                    if (data[idx].gameData == 0) {
                        alert("looserrrrrrr");
                        that._game.paused = true;
                    }
                    that.UpdateDrone(data[idx]);
                }
            }
        });
        if (this._map.IsMapComplete()) {
            alert("I think you are our winner ...");
            that._game.paused = true;
        }
    };
    SimpleGameDebug.prototype.FindDrone = function (id) {
        for (var idx in this._drones) {
            var drone = this._drones[idx];
            if (drone.GetId() == id)
                return drone;
        }
        return null;
    };
    SimpleGameDebug.prototype.UpdateDrone = function (data) {
        var drone = this.FindDrone(data.id);
        if (drone == null) {
            drone = new Drone(this._game, false);
            drone.SetId(data.id);
            this._drones.push(drone);
        }
        drone.SetPosition(data.droneData, data.counter);
        this._map.SetElement(drone);
    };
    SimpleGameDebug.prototype.render = function () {
    };
    SimpleGameDebug.prototype.changeLayer = function (key) {
        if (key.keyCode == Phaser.Keyboard.SPACEBAR) {
            this._map.GoUp(this._player);
        }
        else if (key.keyCode == Phaser.Keyboard.CONTROL) {
            this._map.GoDown(this._player);
        }
        this._map.ResetCollide();
    };
    return SimpleGameDebug;
})();
window.onload = function () {
    var game = new SimpleGameDebug();
};
//# sourceMappingURL=compiled.js.map