const express = require('express');
const {res} = require("express");
const app = express();
const body_parser = require('body-parser');
app.use(body_parser.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb+srv://insoochoi:dlstn626@cluster0.mwpimzx.mongodb.net/?retryWrites=true&w=majority';
let db;

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

MongoClient.connect(url, function (err, client) {
    if (err) console.error(err);

    db = client.db('todoapp');

    app.listen(8080, function () {
        console.log('listenling on 8080 !!!');
    });

});


app.get('/', function (req, res) {
    // res.sendFile(__dirname + "/views/index.ejs");
    res.render('index.ejs');

});
app.get('/write', function (req, res) {
    // res.sendFile(__dirname + "/views/write.ejs");
    res.render('write.ejs');
})



app.get('/list', function (req, res) {
    db.collection('post').find().toArray((err, rst) => {
        console.log(rst);
        res.render('list.ejs', {posts: rst});
    });

});



app.get('/detail/:id', function (req, res) {
    const id = parseInt(req.params.id);
    db.collection('post').findOne({_id: id}, function (err, rst) {
        console.log(rst);
        res.render('detail.ejs', {data: rst});
    });
});
app.get('/edit/:id', (req, res) => {
    let id = parseInt(req.params.id);
    console.log("id:" + id);
    db.collection('post').findOne({_id: id}, function (err, rst) {
        console.log('rst->', rst);
        res.render('edit.ejs', {post: rst});
    });
});
app.patch('/edit/:id', (req, res) => {

    const id = parseInt(req.params.id);
    const title = req.body.title;
    const date = req.body.date;
    console.log('title', title);
    console.log('date', date);
    db.collection('post').updateOne(
        {_id: id},
        {$set: {title: title, date: date}},
         (err,rst)=>{
             res.send("/list");
    });
});

const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy;
const session=require('express-session');

app.use(session({secret:'????????????',resave:true, saveUninitialized:false}));
app.use(passport.initialize());
app.use(passport.session());

app.post('/register',(req, res)=>{
    const id = req.body.id;
    const pwd= req.body.password;
    db.collection('login').insertOne({_id: id, password: pwd},
        (err, rst)=>
            res.redirect('/'))
});

app.post('/add', (req, res) => {
    res.send('?????? ??????');

    db.collection('counter').findOne({name: 'total_length'},
        (err, rst) => {
            const total_posts = rst.total_posts;
            console.log('??? ????????? -> ', total_posts);

            const title = req.body.title;
            const date = req.body.date;

            const newPost={_id: total_posts + 1, 'title': title, 'date': date, writer: req.user._id};
            db.collection('post').insertOne(newPost,function (err, result) {
                console.log('????????????');
                db.collection('counter').updateOne({name: 'total_length'},
                    {$inc: {total_posts: 1}},
                    function (err2, result2) {
                        if (err) console.error(err);
                    });
            });

        });
});

app.get('/login',(req,res)=>{
    res.render('login.ejs');
});

app.post('/login',
    passport.authenticate('local',
        {failureRedirect : '/fail'})
    ,(req, res)=>{res.redirect('/')}
    );

app.get('/my_page', areYouLogging,(req,res)=>{
    console.log(req.user);
    res.render('my_page.ejs',{user: req.user});
});

const multer=require('multer')

const storage = multer.diskStorage({
    destination : (req, file, cb) =>{
        cb(null, './public/image');
    },
    filename    : (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const upload  = multer({storage : storage});

app.get('/upload',(req, res)=>{
    res.render('upload.ejs');
});

app.post('/upload'
    , upload.array('profile', 10)
    , (req, res)=>{
res.send("upload completed");
});

app.get('/image/:image_name', (req, res)=>{
    const image_name = req.params.image_name;
    res.sendFile(__dirname + '/public/image/' + image_name);
})

app.get('/search', (req, res)=>{
    let value = req.query.value;
    console.log('->->',value);
    const search_condition=[
        {
            $search: {
                index: 'titleSearch',
                text:
                    {
                        query: value,
                        path: "title"
                    }
            }
        },
        {$sort : {_id: -1} },
        {$limit: 1}


    ]

    console.log(search_condition);

    db.collection('post').aggregate(search_condition)
        .toArray((err, rst) => {
            res.render('search.ejs',{posts:rst});
    });
});


function areYouLogging(req,res,next){
    if(req.user)
    next();
    else
        res.send('you are not logging now...');
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'password',
    session: true,
    passReqToCallback: false},
    (id, password, done)=>{
        console.log(id, password);
        db.collection('login').findOne({id:id},(err,rst)=>{
           if(err) return done(err);
           if(!rst) return done(null, false, {message : 'not register id.'});
           if(rst.password == password) return done(null, rst);
           else return done(null, false, {message: 'wrong password.'});
        });
    }));

passport.serializeUser((user, done)=>{
    done(null,user.id)
});

passport.deserializeUser((id, done)=>{
    db.collection('login').findOne({id: id},(err, rst)=>{
        done(null, rst);
    });
});

app.delete('/delete', (req, res) => {
    req.body._id = parseInt(req.body._id);
    let id = {id : req.body._id, writer: req.user._id };
    db.collection('post').deleteOne(id, (err, rst) => {
        console.log('????????????');
        if(err) console.log(err);
        res.status(200).send({message: '??????????????????.'});
    });
});


app.use('/shop',require('./routes/shop.js'));
app.use('/board/sub',require('./routes/board.js'));

const { ObjectId }= require('mongodb');

app.post('/chatroom', areYouLogging, (req, res)=>{
    console.log('objectId',ObjectId);
    let ????????????id = ObjectId(req.body.????????????id);
    var ???????????? ={
        title:'???????????????',
        member:[????????????id, req.user._id],
        date: new Date()
    }

   db.collection('chatroom').insertOne(????????????).then((res)=>{

   })
})