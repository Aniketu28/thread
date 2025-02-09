const dotenv = require("dotenv")
dotenv.config();
const express = require("express");
const app = express();
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser");
const dbConnection = require("./utils/dbConnection");
const userModel = require("./models/user.model");
const threadModel = require("./models/thread.model");
const isLogIn = require("./middlewares/isLogIn");
const pushNotifications = require("./services/notification.service");
const { profile } = require("console");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

dbConnection();


app.get("/", isLogIn, async (req, res) => {
    
    const id = jwt.verify(req.cookies.token, process.env.JWTSECRET);
    const user = await userModel.findOne({ _id: id });
    const usersFeed = await threadModel.find().populate('user');
    res.render("index", { user: user, usersFeed: usersFeed });

});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {

    const { username, email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (user) {
        // .json({message:"User Alredy Found"})
        return res.redirect("/login");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
        username,
        email,
        password: hashPassword
    });

    res.redirect("/login");

});

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.json({ message: "email and password is incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.json({ message: "email and password is incorrect" });
    }

    const token = await jwt.sign({ _id: user._id }, process.env.JWTSECRET);

    res.cookie("token", token);

    res.redirect("/");

});


app.post('/feed/:page', isLogIn, async (req, res) => {

    const { content } = req.body;
    const id = jwt.verify(req.cookies.token, process.env.JWTSECRET);
    const user = await userModel.findOne({ _id: id });
    const thread = await threadModel.create({
        user: user._id,
        content: content,
    });

    user.threads.push(thread._id);
    await user.save();

    if (req.params.page == "home") {
        res.redirect("/");
    } else if (req.params.page == "create") {
        res.redirect("/create");
    }

});

app.get("/like/:page/:threadId", isLogIn, async (req, res) => {

    const uid = jwt.verify(req.cookies.token, process.env.JWTSECRET);
    const user = await userModel.findOne({ _id: uid });
    const id = req.params.threadId;
    const thread = await threadModel.findById(id).populate("user");


    // console.log(thread);

    if (thread.likes.indexOf(user._id) === -1) {
        thread.likes.push(user._id);
        pushNotifications(thread.user._id, { message: `${user.username} is liked your post` })
        // console.log('remove :', thread.likes);
    } else {
        thread.likes.splice(thread.likes.indexOf(user._id), 1);
        // console.log('add likes:', thread.likes);
    }

    await thread.save();

    if (req.params.page == "index") {
        res.redirect("/");
    } else if (req.params.page == "create") {
        res.redirect("/create");
    } else if (req.params.page == "profile") {
        res.redirect("/profile");
    }

});

app.get("/reThread/:page/:threadId", isLogIn, async (req, res) => {

    const id = req.params.threadId;

    const thread = await threadModel.findById(id);

    // req.user.threads.forEach(({_id})=>{
    //    if(_id.equals(thread._id)){
    //       console.log("present");
    //    }
    // });

    // console.log("thread",thread._id);

    // console.log("result",req.user.threads.indexOf(thread._id) == -1); not work because we need to compare object id 

    if (!req.user.threads.find(id => id.equals(thread._id))) {

        if (thread.reThreads.indexOf(req.user._id) === -1) {

            const rethreadpost = await threadModel.create({
                user: req.user._id,
                content: thread.content,
            });

            req.user.threads.push(rethreadpost._id);

            await req.user.save();

            thread.reThreads.push(req.user._id);

            pushNotifications(thread.user._id, { message: `${req.user.username} is Rethreaded your post` })
        }

    }
    await thread.save();

    if (req.params.page == "index") {
        res.redirect("/");
    } else if (req.params.page == "create") {
        res.redirect("/create");
    } else if (req.params.page == "profile") {
        res.redirect("/profile");
    }

});

app.get("/search", isLogIn, async (req, res) => {

    let threads = await threadModel.find().populate('user');
    let count = 0;
    let likes = [];

    threads.forEach((thread) => {

        let user = {
            username: thread.user.username,
            name: thread.user.name,
            profile : thread.user.profile,
            like: thread.likes.length
        }

        likes.push(user);
    })

    likes = likes.sort((a, b) => b.like - a.like).slice(0, 10);

    let unique = [];

    let searchResult = likes.filter((user) => {
        if (!unique.includes(user.username)) {
            unique.push(user.username);
            return true;
        }
    });

    res.render("search", {searchResult: searchResult });

});

app.post("/search", isLogIn, async (req, res) => {

    let searchResult = [];

    let { query } = req.body;

    let user = await userModel.findOne({ username: query });

    if (!user) {
        return res.status(201).json({ message: "user not found" });
    }

    searchResult.push({
        username: user.username,
        name : user.name,
        profile : user.profile
    });

    res.render("search", {searchResult: searchResult });
});

app.get("/create", isLogIn, (req, res) => {
    res.render("create", { user: req.user });
});

app.get("/profile", isLogIn, (req, res) => {
    res.render("profile", { user: req.user });
});

app.get("/Notifications", isLogIn, async (req, res) => {
    const user = await userModel.findById(req.user._id);
    //    console.log(user);
    res.render("notifications", { user: user });
});

app.post("/editProfile", isLogIn, (req, res) => {
    res.render("editprofile", { user: req.user })
});

app.post("/Edit", isLogIn, async (req, res) => {


    const updatedUser = await userModel.findOneAndUpdate(
        {
            _id: req.user._id // Use unique identifier
        },
        {
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            profile: req.body.profileImg
        },
        { new: true } 
    );

    res.redirect("/profile");
});

app.get("/logout", isLogIn, (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

app.listen(3000, () => {
    console.log("server start");
});

