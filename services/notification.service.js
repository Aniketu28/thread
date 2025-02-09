const userModel = require("../models/user.model");

async function pushNotifications(id,message){
   
   const user = await userModel.findById(id);
   user.notifications.push(message.message);
   
   await user.save();
    
}

module.exports = pushNotifications;