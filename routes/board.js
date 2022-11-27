var router=require('express').Router();


router.get('/sports', function(req, res){
    res.send('here is sports page ');
});
router.get('/game', function(req, res){
    res.send('here is game page ');
});

module.exports=router;