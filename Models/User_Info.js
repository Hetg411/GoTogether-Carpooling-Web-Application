const mongoose=require('mongoose');
const { type } = require('os');

const UserInfo=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        minlength:8
    },
    QR:{
        filename:String,
        url:String
    }
})

const user=new mongoose.model("user",UserInfo);
module.exports=user;
