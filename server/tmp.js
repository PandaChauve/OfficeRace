/**
 * Created by Panda_2 on 16-01-16.
 */

router.route('/game/:id/update').post(function (req, res) {

    var t = req.body.score;
    var arra = req.body.score.split("_");
    var sum = 0;
    for(var i = 0; i <arra[0].length; ++i){
        sum += +arra[0].charAt(i);
    }
    console.log("new score " + sum + " "+req.body.score + " "+ req.body.user + " " + req.body.map + " " + req.body.duration);

    if(sum == arra[1]){
        req.body.score = arra[0]/17; //this crypt is stupid but since the code is public... just want the kiddies to lose 5 min
    }
    else{
        res.json(CreateError("Invalid score "+t+" "+arra[0]+" "+sum+" "+arra[1]));
        return;
    }

    db.run("INSERT INTO scores VALUES($score, $user, $map, $duration)", {
        $score: req.body.score,
        $user: req.body.user,
        $map: req.body.map,
        $duration: req.body.duration
    }, function(err){
        "use strict";
        if(err){
            res.json(CreateError("can't add score", err));
        }
        else{
            db.run("DELETE FROM scores WHERE map = $map and user_id = $user and score < (SELECT score FROM scores WHERE map = $map and user_id = $user order by score DESC LIMIT 1 OFFSET 2 )", {
                $user: req.body.user,
                $map: req.body.map
            }, function(err){
                if(err){
                    res.json(CreateError("Can't clean db", err));
                }
                else{
                    res.json({success: true, message: 'New score, db cleaned'});
                }
            });
        }
    });
});

router.route('/games').get(function (req, res) {
    db.all("SELECT s.score, u.name, s.duration FROM scores as s, users as u WHERE s.user_id = u.rowid and s.map=$map ORDER BY score DESC limit 50", {$map: req.params.map},
        function (err, rows) {
            if(err){
                res.json(CreateError("can't read scores ...", err));
            }
            else{
                res.json(rows);
            }
        });
});

router.route('/users').post(function (req, res) {
    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 10; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    var salt = makeid();
    var shasum = crypto.createHash('sha512');
    shasum.update(salt + req.body.password);
    var hash = shasum.digest('hex');
    db.run("INSERT INTO users VALUES(NULL, $userName, $hash, $salt, NULL, NULL)", {
        $userName: req.body.userName,
        $hash: hash,
        $salt: salt
    }, function (err) {
        if (err === null) {
            res.json({
                success: true,
                message: "user created"
            });
        }
        else {
            res.json(CreateError("can't create user, already exists ?", err));

        }
    });
});

function GetUser(req, res) {
    db.get("SELECT * from users where user_id=$userId and hash=$hash", {
        $hash: req.params.hash,
        $userId: req.params.userid
    }, function (err, row) {
        if (err || !row) {
            res.json(CreateError("Invalid user", err));
        }
        else {
            res.json({
                id: row.user_id,
                name: row.name,
                email: row.email,
                hash: row.hash,
                data: row.data,
                success: true
            });
        }
    });
}