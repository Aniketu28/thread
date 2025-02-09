const mongoose = require("mongoose");

function dbConnection(){
    mongoose.connect(process.env.MONGODB_URL).then(()=>{
        console.log("db connection done");
    }).catch((error)=>{
        console.log(error);
    });
}

module.exports = dbConnection;