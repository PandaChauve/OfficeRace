///<reference path="phaser/phaser.d.ts" />
class Target {
    public sprite:Phaser.Sprite;

    constructor(game:Phaser.Game) {
        this.sprite = game.add.sprite(8.5, 19, 'diamond');
        game.physics.p2.enable(this.sprite);
        this.sprite.body.x = 300;
        (<any>this.sprite.body).isTarget = true;
        this.SetLevel(1);
    }

    SetLevel(lvl : number){
        (<any>this.sprite.body).droneLevel = lvl;
    }

    GetLevel():number{
        return (<any>this.sprite.body).droneLevel;
    }
}