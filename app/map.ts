import {Drone} from "./drone";

class Slice{
    public Static : Phaser.Group;
    public Dynamic : Phaser.Group;
    public Collide : boolean;
    constructor(game:Phaser.Game){
        this.Static = game.add.group();
        this.Dynamic = game.add.group();
        this.Collide = false;
    }
    SetAlpha(alpha : number){
        this.Static.alpha = alpha;
        this.Dynamic.alpha = alpha;
    }

}
export class Map
{
    private _currentLvl = -1;
    private _slices = new Array<Slice>();

    public constructor(private _game:Phaser.Game){
        this.CreateSlice('bottom', 'office');
        this.CreateSlice('middle', 'office');
        this.CreateSlice('top', 'office');
        this.updateLevel();
        this._slices[0].Static.getTop().resizeWorld();
    }
    public CreateSlice(sliceName : string, tileset : string){
        this._currentLvl++;
        this._slices.push(new Slice(this._game));

        let map = this._game.add.tilemap(sliceName);
        map.addTilesetImage(tileset);

        let layer = map.createLayer(sliceName);
        this._slices[this._currentLvl].Static.add(layer);

        map.setCollisionBetween(1, 1000, true, sliceName);

        let elems = this._game.physics.p2.convertTilemap(map, layer);
        for(let idx = 0; idx < elems.length; ++idx)
            (<any>elems[idx]).droneLevel = this._currentLvl;
    }

    public GoUp(drone :Drone):void {
        if(this._currentLvl +1 < this._slices.length && !this._slices[this._currentLvl+1].Collide){
            this.goUpOrDown(drone, true);
        }
    }

    public GoDown(drone :Drone):void{
        if(this._currentLvl -1 >= 0 && !this._slices[this._currentLvl-1].Collide){
            this.goUpOrDown(drone, false);
        }
    }

    private goUpOrDown(drone : Drone, up : boolean){
        this._slices[this._currentLvl].Dynamic.remove(drone.sprite);
        this._currentLvl += up ? 1 : -1;
        drone.SetLevel(this._currentLvl);
        this.updateLevel();
        this._slices[this._currentLvl].Dynamic.add(drone.sprite);
    }

    private updateLevel(){
        for(let idx = 0; idx < this._slices.length; ++idx){
            if(idx == this._currentLvl){
                this._slices[idx].SetAlpha(1);
            }
            else if(Math.abs(idx - this._currentLvl) == 1){
                this._slices[idx].SetAlpha(0.4);
            }
            else{
                this._slices[idx].SetAlpha(0);
            }
        }
    }

    public SetCollide(droneLevel:number):void {
        this._slices[droneLevel].Collide = true;
    }

    public ResetCollide() : void{
        for(let idx = 0; idx < this._slices.length; ++idx)
            this._slices[idx].Collide = false;
    }

    SetElement(drone:any):void {
        if(drone.GetLevel() < 0)
            drone.SetLevel(this._currentLvl);

        for(let idx = 0; idx < this._slices.length; ++idx){
            if(idx == drone.GetLevel())
                this._slices[idx].Dynamic.add(drone.sprite);
            else
                this._slices[idx].Dynamic.remove(drone.sprite);
        }

    }

    private _targets = 0;
    AddTarget(x:number, y:number, lvl:number):void {
        var obj = this._game.add.sprite(8.5, 19, 'diamond');
        this._game.physics.p2.enable(obj);
        obj.body.x = x;
        obj.body.y = y;
        obj.body.static = true;
        (<any>obj.body).isTarget = true;
        (<any>obj.body).droneLevel = lvl;
        this._slices[lvl].Dynamic.add(obj);
        this._targets++;
    }

    Destroy(obj : Phaser.Physics.P2.Body):void{
        this._targets--;
        obj.sprite.kill();
        obj.destroy(); //FIXME remove from group

    }

    IsMapComplete() : boolean{
        return this._targets == 0;
    }
    RemainingTargetCount() : number{
        return this._targets;
    }
}
