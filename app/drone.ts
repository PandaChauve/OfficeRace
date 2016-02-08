///<reference path="../node_modules/phaser/typescript/phaser.d.ts" />
import BodyOptions = p2.BodyOptions;
export class Drone {
    public sprite:Phaser.Sprite;

    constructor(game:Phaser.Game, ismain : boolean) {
        this.sprite = game.add.sprite(8.5, 19, 'drone');
        this.sprite.animations.add('fly', [0, 1], 10, true);
        game.physics.p2.enable(this.sprite);
        this.sprite.body.angularDamping = 0.7;
        this.sprite.body.damping = 0.6;
        (<any>this.sprite.body).mainDrone = ismain;
        this.SetLevel(-1);
    }
    private _id = -1;
    public SetId(id : number){
        this._id = id;
    }
    public GetId(){
        return this._id;
    }

    private lastKeys = [false, false, false, false];
    private UpdateAngle(turnLeft:boolean, turnRight:boolean):void {
        this.lastKeys[0] = turnLeft;
        this.lastKeys[1] = turnRight;
        if (turnLeft == turnRight)
            return;
        else
            turnLeft ? this.sprite.body.rotateLeft(60): this.sprite.body.rotateRight(60);
    }

    private UpdateSpeed(accelerate:boolean, decelerate:boolean):void {
        this.lastKeys[2] = accelerate;
        this.lastKeys[3] = decelerate;

        if (accelerate) {
            this.sprite.body.thrust(200);
        }
        if (decelerate) {
            this.sprite.body.reverse(200);
        }
        console.log(this.sprite.body.data.velocity[0] + ' - ' +this.sprite.body.data.velocity[1] + ' - ' + (<any>this.sprite.body).mainDrone);
    }

    public TicUpdate(keys:Phaser.CursorKeys):void {
        this.sprite.animations.play('fly');
        this.UpdateAngle(keys.left.isDown, keys.right.isDown);
        this.UpdateSpeed(keys.up.isDown, keys.down.isDown);
    }

    GetPosition(): any[]{
        var opt = <any>{};
        opt.position = this.sprite.body.data.position;
        opt.velocity = this.sprite.body.data.velocity;
        opt.angle = this.sprite.body.data.angle;
        opt.angularVelocity = this.sprite.body.data.angularVelocity;
        opt.keys = this.lastKeys;
        return [opt, this.GetLevel(), new Date().getTime()];
    }

    private _previousUpdate : any[];
    private _previousUpdateTime  = 0;
    private _position : any[];
    SetPosition(data : any[]) : void{
        this._position = data;
    }

    public TicUpdateShadow(){
        var currentTime = new Date().getTime();
        var data = this._position;
        if(data == null)
            return;
        if(data == this._previousUpdate)
        {
            this.UpdateAngle(this.lastKeys[0], this.lastKeys[1]);
            this.UpdateSpeed(this.lastKeys[2], this.lastKeys[3]);
            return;
        }

        if(this._previousUpdate && data[2] < this._previousUpdate[2])
        {
            console.log("too old");
            return;
        }

        var opt = <BodyOptions>data[0];
        var d = this.sprite.body.data;
        if(this._previousUpdateTime != 0){
            var ticDelta =  currentTime-this._previousUpdateTime;

            var dataDelta = data[2]-this._previousUpdate[2];
            var ratio = ticDelta/dataDelta;
            //console.log(ratio + ' - ' + ticDelta + ' - ' + dataDelta);
            opt.position[0] = this.PonderateValue(d.position[0], opt.position[0], ratio);
            opt.position[1] = this.PonderateValue(d.position[1], opt.position[1], ratio);
            opt.angle = this.PonderateValue(d.angle, opt.angle, ratio);
            //data[2] =  this.PonderateValue(this._previousUpdate[2], data[2], ratio);
        }
        if(d.position[0] - opt.position[0] > 1) {
            //console.log(d.position[0] - opt.position[0]);
        }
        d.position = opt.position;
        d.velocity = opt.velocity;
        d.angle = opt.angle;
        d.angularVelocity = opt.angularVelocity;

        this.lastKeys = data[0].keys;
        this.UpdateAngle(this.lastKeys[0], this.lastKeys[1]);
        this.UpdateSpeed(this.lastKeys[2], this.lastKeys[3]);
        this._previousUpdate = data;
        this._previousUpdateTime = currentTime;
        this.SetLevel(1);
        console.log("-------------------------sync----------------------------");
        console.log( d.velocity[0] + '/' +  d.velocity[1]);
    }

    private PonderateValue(old : number, current : number, ratio:number) : number{
       // console.log(ratio);
        return (current - old)*ratio + old;
    }

    SetLevel(lvl : number){
        (<any>this.sprite.body).droneLevel = lvl;
    }

    GetLevel():number{
        return (<any>this.sprite.body).droneLevel;
    }
}