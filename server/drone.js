var express = require('express');
var bodyParser = require('body-parser');
var app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
//app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    next();
});


var router = express.Router();
router.get('/', function (req, res) {
    res.json({success: false, message: 'Sorry this is the api'});
});

function CreateGame(id){
    return {
        id: id,
        players : [],
        Register : function(){
            var id = this.players.length;
            this.players.push({id: id, counter : 0});
            return id;
        },
        Unregister : function(id){
            delete this.players[id];
        }
    }
}

var games = {
    _list : [],
    CreateGame : function(){
        this._list.push(CreateGame(this._list.length));
        return this._list.length-1;
    },
    GetGames : function(){
        var ret = [];
        for(var idx in this._list){
            ret.push(this._list[idx].id);
        }
        return ret;
    },
    GetGame : function(id){
        if(id >= this._list.length)
            return null;
        return this._list[id];
    },
};
games.CreateGame();//always create game 0

router.route('/games/new/').get(function (req, res) {
    res.json(games.CreateGame());
});

router.route('/games/:id/').get(function (req, res) {
    res.json(games.GetGameDetails(req.params.id));
});

router.route('/games/:id/register').get(function (req, res) { //yes get, too lasy to do something else
    res.json(games.GetGame(req.params.id).Register());
});
router.route('/games/:id/unregister/:uid').get(function (req, res) {//yes get, too lasy to do something else
    res.json(games.GetGame(req.params.id).Unregister(req.params.uid));
});
router.route('/games/:id/update/:uid').post(function (req, res) {
    var data = req.body;
    var game = games.GetGame(req.params.id);
    if(game === null)
        res.json("Invalid game");
    else{
        var counter = game.players[req.params.uid].counter + 1;
        game.players[req.params.uid] = data;
        game.players[req.params.uid].counter = counter;
        res.json(game.players);
    }
});

router.route('/games').get(function (req, res) {
    res.json(games.GetGames());
});

app.use('/', router);
app.listen(1338);

console.log("started " + 1338);

