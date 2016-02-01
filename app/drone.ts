///<reference path="../node_modules/phaser/typescript/phaser.d.ts" />
export class Drone {
    public sprite:Phaser.Sprite;

    constructor(game:Phaser.Game, ismain : boolean) {
        this.sprite = game.add.sprite(8.5, 19, 'drone');
        this.sprite.animations.add('fly', [0, 1], 10, true);
        game.physics.p2.enable(this.sprite);
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
    private Slow(): void {
        this.sprite.body.data.velocity[0] *= 0.985;
        this.sprite.body.data.velocity[1] *= 0.985;
        this.sprite.body.data.angularVelocity *= 0.7;
    }

    private UpdateAngle(turnLeft:boolean, turnRight:boolean):void {
        if (turnLeft == turnRight)
            return;
        else
            turnLeft ? this.sprite.body.rotateLeft(60): this.sprite.body.rotateRight(60);
    }

    private UpdateSpeed(accelerate:boolean, decelerate:boolean):void {
        this.Slow();

        if (accelerate) {
            this.sprite.body.thrust(200);
        }
        if (decelerate) {
            this.sprite.body.reverse(200);
        }
    }

    public TicUpdate(keys:Phaser.CursorKeys):void {
        this.sprite.animations.play('fly');
        this.UpdateAngle(keys.left.isDown, keys.right.isDown);
        this.UpdateSpeed(keys.up.isDown, keys.down.isDown);
    }

    GetPosition(): number[]{
        return [this.sprite.body.velocity.x, this.sprite.body.velocity.y,this.sprite.body.x,this.sprite.body.y, this.sprite.body.rotation, this.sprite.body.angularVelocity, this.GetLevel(), this._lastUpdate++];
    }
    private _lastUpdate = -1;
    SetPosition(data : number[]){
        if(data[7] <= this._lastUpdate || data == null)
            return;
        this._lastUpdate = data[7];
        this.sprite.body.velocity.x = data[0];
        this.sprite.body.velocity.y = data[1];
        this.sprite.body.x = data[2];
        this.sprite.body.y = data[3];
        this.sprite.body.rotation = data[4];
        this.sprite.body.angularVelocity = data[5];
        this.SetLevel(data[6]);
    }

    SetLevel(lvl : number){
        (<any>this.sprite.body).droneLevel = lvl;
    }

    GetLevel():number{
        return (<any>this.sprite.body).droneLevel;
    }
}