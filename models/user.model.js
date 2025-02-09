const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{
        type : String,
        require : true
    },

    email:{
        type : String,
        require : true
    },

    password:{
        type : String,
        require : true
    },

    name:{
        type:String,
    },

    profile:{
        type:String,
        default:"/img/profile.jpg"
    },

    threads:[
        {
         type : mongoose.Schema.Types.ObjectId,
         ref : "thread"
        }
    ],

    notifications :[
       {
          type : String
       }
    ]
})

const userModel = mongoose.model("user",userSchema);

module.exports = userModel;