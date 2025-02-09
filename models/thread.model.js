const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    date : {
        type : Date,
        default : Date.now
    },
    content : {
        type:String
    },
    likes : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "user"
        }
    ],
    reThreads :[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "user"
        }
    ]
});

const threadModel = mongoose.model("thread",threadSchema);

module.exports = threadModel;

