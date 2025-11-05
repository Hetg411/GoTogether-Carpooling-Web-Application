// Models/RideRequest.js
const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User_Info" }, // who requested
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User_Info" },   // ride provider
    status: { 
        type: String, 
        enum: ["pending", "accepted", "rejected"], 
        default: "pending" 
    }
}, { timestamps: true });

module.exports = mongoose.model("RideRequest", rideRequestSchema);
