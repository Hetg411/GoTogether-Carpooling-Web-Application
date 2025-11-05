const mongoose=require('mongoose')

let sh=new mongoose.Schema({
    username:{
        type:String,
        require:true
    },
    location:{
        type:String,
        require:true
    },
    geometry:{
        type:{type:String,enum:['Point'],require:true},
        coordinates:{type:[Number],require:true}
    },
    usertype:{
        type:String,
        require:true
    },
    IsAvailable:{
        type:Boolean,
        require:true
    }
})

sh.index({ geometry: "2dsphere" });

const destination=new mongoose.model('destination',sh);

module.exports=destination;