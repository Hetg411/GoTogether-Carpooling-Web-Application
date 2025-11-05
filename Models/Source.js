const mongoose=require('mongoose')

let sh=new mongoose.Schema({
    username:{
        type:String,
        require:true
    },
    location_src:{
        type:String,
        require:true
    },
    geometry_src:{
        type:{type:String,enum:['Point'],require:true},
        coordinates:{type:[Number],require:true}
    },
    location_dest:{
        type:String,
        require:true
    },
    geometry_dest:{
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

sh.index({ geometry_src: "2dsphere" });
sh.index({ geometry_dest: "2dsphere" });
const source=new mongoose.model('source',sh);

module.exports=source;