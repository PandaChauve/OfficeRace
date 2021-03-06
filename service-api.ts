///<reference path="jquery.d.ts" />

interface StateReport{
    id : number;
    gameData : any;
    droneData:any;
    counter : number;
};

class DroneApi{
    private _id = -1;
    private _host = "http://whenwillyoulose.com:1338/";
    Register(cb){
        var that = this;
        $.get( this._host+"games/0/register", function( data ) {
            that._id = data;
            cb(data);
        });
    }
    SendPos(droneState : any, gameState : any, cb : (report : StateReport[]) => void){
        if(this._id == -1)
            return;
        var data = JSON.stringify({id: this._id, gameData : gameState, droneData : droneState});
        $.ajax({
            url: this._host+"games/0/update/"+this._id,
            type: 'POST',
            contentType: 'application/json',
            data: data,
            success: cb
        });

    }
}