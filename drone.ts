///<reference path="phaser/phaser.d.ts" />
class Drone {
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
    }

    private UpdateAngle(turnLeft:boolean, turnRight:boolean):void {
        if (turnLeft == turnRight)
            this.sprite.body.setZeroRotation();
        else
            turnLeft ? this.sprite.body.rotateLeft(100): this.sprite.body.rotateRight(100);

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
        return [this.sprite.body.velocity.x, this.sprite.body.velocity.y,this.sprite.body.x,this.sprite.body.y, this.sprite.body.angle, this.GetLevel()];
    }
    private _lastUpdate = -1;
    SetPosition(data : number[], ref : number){
        if(ref <= this._lastUpdate)
            return;
        this._lastUpdate = ref;
        this.sprite.body.velocity.x = data[0];
        this.sprite.body.velocity.y = data[1];
        this.sprite.body.x = data[2];
        this.sprite.body.y = data[3];
        this.sprite.body.angle = data[4];
        this.SetLevel(data[5]);
    }

    SetLevel(lvl : number){
        (<any>this.sprite.body).droneLevel = lvl;
    }

    GetLevel():number{
        return (<any>this.sprite.body).droneLevel;
    }
}