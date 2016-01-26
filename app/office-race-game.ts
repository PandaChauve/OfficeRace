///<reference path="../phaser/phaser.d.ts" />
import {Drone} from "./drone";
import {Map} from "./map";
import {Component} from "angular2/core";
import {DroneApi} from "./service-api";
import {StateReport} from "./service-api";

@Component({
    selector: 'office-race',
    template: '<div id="phaser-content"></div>'
})
export class SimpleGame{
    private _game: Phaser.Game;
    private _drones: Drone[];
    private _player: Drone;
    private _keys: Phaser.CursorKeys;
    private _map : Map;
    private _api = new DroneApi();
    public constructor() {
        var that = this;
        this._game = new Phaser.Game(1920*0.8, 1080*0.8, Phaser.AUTO, 'phaser-content', {
            preload: function () {
                return that.preload();
            }, create: function () {
                return that.create();
            }, update: function () {
                return that.update();
            }, render : function(){
                return that.render();
            }
        });
    }

    public preload():void {
        this._game.load.spritesheet('drone', 'ressources/drone.png', 17, 19);
        this._game.load.spritesheet('diamond', 'ressources/diamond.png', 17, 19);
        this._game.load.tilemap('bottom', 'ressources/sans-titre.json', null, Phaser.Tilemap.TILED_JSON);
        this._game.load.tilemap('middle', 'ressources/sans-titre.json', null, Phaser.Tilemap.TILED_JSON);
        this._game.load.tilemap('top', 'ressources/sans-titre.json', null, Phaser.Tilemap.TILED_JSON);
        this._game.load.image('office', 'ressources/test.bmp');
    }

    public create():void {
        this._game.physics.startSystem(Phaser.Physics.P2JS);
        var that = this;
        this._drones = [];
        this._player = new Drone(this._game, true);
        this._map = new Map(this._game);
        this._map.AddTarget(100,100,0);
        this._map.AddTarget(200,200,1);
        this._map.AddTarget(150,150,2);
        this._api.Register(function(id : number){
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
    }

    private collide(left : any, right : any){
        if(left.mainDrone && right.mainDrone === undefined){ //FIXME you cna go up on target
            this._map.SetCollide(right.droneLevel);
        }
        else if(left.mainDrone === undefined && right.mainDrone){
            this._map.SetCollide(left.droneLevel);
        }

        if(left.droneLevel == right.droneLevel){
            if(left.mainDrone && right.isTarget){
                this._map.Destroy(right);
                return false;
            }
            else if(left.isTarget && right.mainDrone){
                this._map.Destroy(left);
                return false;
            }

        }
        return left.droneLevel == right.droneLevel; //collide if same level
    }

    private _updateCounter = 0;
    public update() :void {
        this._player.TicUpdate(this._keys);
        this._updateCounter = (this._updateCounter+1)%10;
        if(this._updateCounter == 0){
            var that = this;
            this._api.SendPos(this._player.GetPosition(), this._map.RemainingTargetCount(),function(data : StateReport[]) : void{
                for(let idx in data){
                    if(data[idx].id!= that._player.GetId()) {
                        if(data[idx].gameData == 0){
                            alert("looser");
                            that._game.paused = true;
                        }
                        that.UpdateDrone(data[idx]);
                    }
                }
            });

            if(this._map.IsMapComplete()){
                alert("I think you are our winner ...");
                that._game.paused = true;
            }
        }
    }

    public FindDrone(id : number ): Drone{
        for(let idx in this._drones){
            let drone = this._drones[idx];
            if(drone.GetId() == id)
                return drone;
        }
        return null;
    }

    public UpdateDrone(data : StateReport) : void{
        var drone = this.FindDrone(data.id);
        if(drone == null)
        {
            drone = new Drone(this._game, false);
            drone.SetId(data.id);
            this._drones.push(drone);
        }
        drone.SetPosition(data.droneData, data.counter);
        this._map.SetElement(drone);
    }

    public render() : void{

    }

    private changeLayer(key: Phaser.Key) : void{
        if(key.keyCode == Phaser.Keyboard.SPACEBAR){
            this._map.GoUp(this._player);
        }else if(key.keyCode == Phaser.Keyboard.CONTROL){
            this._map.GoDown(this._player);
        }
        this._map.ResetCollide();
    }
}

