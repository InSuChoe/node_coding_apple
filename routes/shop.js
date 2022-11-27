var router=require('express').Router();
router.use('/shirts',areYouLogging);

router.get('/shirts', function(req, res){
    res.send('here is shirt page ');
});
router.get('/pants', function(req, res){
    res.send('here is pants page ');
});
function areYouLogging(req,res,next){
    if(req.user)
        next();
    else
        res.send('you are not logging now...');
}

module.exports=router;

