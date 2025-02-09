const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

const isLogIn = async (req,res,next)=>{

    const token = req.cookies.token;

    if(token){
        let id =  await jwt.verify(token,process.env.JWTSECRET);
        let user = await userModel.findById(id).populate("threads");
        req.user = user;
        next()
    }else{
        res.redirect("/login");
    }

}

module.exports = isLogIn;

