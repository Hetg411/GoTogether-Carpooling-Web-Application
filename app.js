const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const geolib = require("geolib");
const ejsmate = require("ejs-mate");
const axios = require("axios");
var methodOverride = require("method-override");
const user = require("./Models/User_Info.js");
const source = require("./Models/Source.js");
const destination = require("./Models/Destination.js");
const Mongo_URL = "mongodb://127.0.0.1:27017/GoTogether";
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

let port = 8080;

const http = require("http");
const { Server } = require("socket.io"); 

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

server.listen(port, () => {
  console.log("Server started on port", port);
});

const address = "Delhi,India";

async function main() {
  await mongoose.connect(Mongo_URL);
}

main()
  .then(() => {
    console.log("connect to database");
  })
  .catch((err) => {
    console.log(err);
  });

const session = require("express-session");

app.use(
  session({
    secret: "supersecret", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, 
    },
  })
);

app.set("view engine", "ejs");

app.engine("ejs", ejsmate);
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Fixed backend Socket.IO implementation
// Fixed backend Socket.IO implementation
// Single consistent object to store user-socket mapping
const RideRequest = require("./Models/RideRequest");
const { resolveSoa } = require("dns");


app.get("/livelocation/:currentUserId/:otherUserId/:requesterId", (req, res) => {
   const { currentUserId, otherUserId, requesterId } = req.params;
   console.log("===="+currentUserId);
   console.log("===="+otherUserId);
   console.log("===="+requesterId );
   source.updateOne({_id:currentUserId},{IsAvailable: false});
   source.updateOne({_id:otherUserId},{IsAvailable: false});
   res.render("livelocation", { currentUserId, otherUserId, requesterId });
});




// When a trip is selected (User1 requests User2)
app.get("/selectTrip", async (req, res) => {
  const { tripId, requesterId } = req.query;

  // Find target user (trip owner)
  const targetUser = await source.findById(tripId);
  if (!targetUser) return res.status(404).send("Target user not found");

  // Create ride request
  const rideReq = new RideRequest({
    fromUser: requesterId,
    toUser: targetUser._id,
    status: "pending"
  });
  await rideReq.save();

  // Notify target user via socket
  io.to(targetUser._id.toString()).emit("ride_request", {
    requestId: rideReq._id,
    from: requesterId,
  });

  // Render live location for requester also
  res.render("livelocation", {
    otherUserId: targetUser._id,
    currentUserId: requesterId
  });
});

// When target user ACCEPTS request
app.post("/acceptRequest", async (req, res) => {
  const { requestId } = req.body;

  const rideReq = await RideRequest.findById(requestId);
  if (!rideReq) return res.status(404).send("Request not found");

  rideReq.status = "accepted";
  await rideReq.save();

  const { fromUser, toUser } = rideReq;

  // Create a unique "room" for both users
  const roomId = `ride_${fromUser}_${toUser}`;

  // Notify both users to join room
  io.to(fromUser.toString()).emit("ride_accepted", { roomId, otherUserId: toUser });
  io.to(toUser.toString()).emit("ride_accepted", { roomId, otherUserId: fromUser });

  res.send({ success: true });
});


app.post("/respondRequest", async (req, res) => {
  const { requestId, response } = req.body; // response = 'accepted' | 'rejected'

  const rideReq = await RideRequest.findById(requestId);
  rideReq.status = response;
  await rideReq.save();

  // notify requester
  io.to(rideReq.fromUser.toString()).emit("ride_response", {
    requestId,
    status: response,
  });

  res.send(`Request ${response}`);
});
let users = {};
io.on("connection", (socket) => {
  // Handle location updates (your existing code)
  console.log("User connected:", socket.id);

  // User registers with username
  socket.on("registerUser", (username) => {
    users[username] = socket.id;
    console.log("Registered:", username, "=>", socket.id);
  });

  // Handle ride request
  socket.on("requestRide", ({ fromUser, toUser }) => {
    console.log(fromUser + " fromUser");
    console.log(toUser + " toUser");

    const targetSocket = users[toUser];
    console.log("Target socket:", targetSocket);

    if (targetSocket) {
      io.to(targetSocket).emit("notifyUser", { fromUser, toUser });
    }
  });

  // Handle ride response (accept/reject)
  socket.on("rideResponse", ({ fromUser, toUser, accepted }) => {
    const requesterSocket = users[fromUser];
    if (requesterSocket) {
      io.to(requesterSocket).emit("rideResponseResult", { toUser, accepted });
    }
  });

  socket.on("acceptRide", async (data) => {
  console.log("acceptRide received:", data);

  const requester = await source.findOne({ username: data.fromUser });
  const accepter  = await source.findOne({ username: data.toUser });

  if (!requester || !accepter) {
    console.log("Requester or Accepter not found");
    return;
  }
  console.log("in accept ride ")
  console.log("++"+accepter._id.toString());
  console.log("++"+requester._id.toString());
  console.log("++"+requester._id.toString());
  // Notify requester (User1) → redirect them to liveLocation
  io.to(users[data.fromUser]).emit("redirectToLiveLocation", { 
    targetUser: accepter._id.toString(),    // track accepter
    requesterId: requester._id.toString(),  // original requester
    currentUserId: requester._id.toString() // session user = requester
  });

  // Notify accepter (User2) → redirect them to liveLocation
  io.to(users[data.toUser]).emit("redirectToLiveLocation", { 
    targetUser: requester._id.toString(),   // track requester
    requesterId: requester._id.toString(),
    currentUserId: accepter._id.toString()  // session user = accepter
  });
});



  socket.on("rejectRide", (data) => {
    io.to(users[data.fromUser]).emit("rideRejected", {
      toUser: data.toUser,
    });
  });

  //   socket.on("disconnect", () => {
  //     for (let user in users) {
  //       if (users[user] === socket.id) {
  //         delete users[user];
  //         console.log(user, "disconnected");
  //       }
  //     }

  // });
 socket.on("joinRide", ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`${userId} joined room ${roomId}`);
  });

  // When a user sends their location
  socket.on("sendLocation", (data) => {
    console.log("Server received location:", data);
    // Send location to the other user in the same room
    socket.to(data.roomId).emit("receiveLocation", data);
  });

  


});
// Optional: Helper function to create ride session
function createRideSession(user1, user2) {
  // You can implement ride session logic here
  // For example, save to database, create room, etc.
  console.log(`🎯 Creating ride session between ${user1} and ${user2}`);

  // Example: Create a room for these two users
  const roomName = `ride_${user1}_${user2}`;
  const socket1 = users[user1];
  const socket2 = users[user2];

  if (socket1 && socket2) {
    io.sockets.sockets.get(socket1)?.join(roomName);
    io.sockets.sockets.get(socket2)?.join(roomName);

    // Notify both users about the ride session
    io.to(roomName).emit("rideSessionCreated", {
      roomName: roomName,
      participants: [user1, user2],
      message: "Ride session created! You can now start your journey.",
    });
  }
}

app.post("/set/sourcedetails", (req, res) => {
  let sc1 = new source({
    username: req.body.username,
    location: req.body.location,
    geometry: [req.body.latitude, req.body.longitude],
    usertype: req.body.usertype,
    IsAvailable: true,
  });

  sc1.save();
});
app.get("/sourcedetails", (req, res) => {
  res.render("src_form.ejs");
});

app.get("/selectTrip", async (req, res) => {
  const tripId = req.query.tripId;
  const selectedUser = await source.findById(tripId);

  res.render("liveLocation", {
    selectedUser,
  });
});

app.post("/set/destinationdetails", (req, res) => {
  let sc1 = new destination({
    username: req.body.username,
    location: req.body.location,
    geometry: [req.body.latitude, req.body.longitude],
    usertype: req.body.usertype,
    IsAvailable: true,
  });

  sc1.save();
});
app.get("/destinationdetails", (req, res) => {
  res.render("dst.ejs");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error logging out.");
    }
    res.redirect("/home");
  });
});

app.get("/src/location", (req, res) => {
  res.send("working");
});

app.post("/set/pathdetails", async (req, res) => {
  console.log(req.body);
  const API_KEY = "AIzaSyD9Oz1yoUXrCaDOUbxOaILSs1Qey_XrHlc";

  const address_src = req.body.location1;
  const address_dest = req.body.location2;
  console.log(address_src);
  console.log(address_dest);
  // Geocode source
  const geoRes1 = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    { params: { address: address_src, key: API_KEY } }
  );
  const location_srco = geoRes1.data.results[0].geometry.location;
  console.log(location_srco+"src");

  // Geocode destination
  const geoRes2 = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    { params: { address: address_dest, key: API_KEY } }
  );
  const location_desto = geoRes2.data.results[0].geometry.location;
  console.log("GeoRes1:", JSON.stringify(geoRes1.data, null, 2));
  console.log("GeoRes2:", JSON.stringify(geoRes2.data, null, 2));

  // Save current user path
  let sc = new source({
    username: req.session.username,
    location_src: req.body.location1,
    geometry_src: {
      type: "Point",
      coordinates: [location_srco.lng, location_srco.lat],
    },
    location_dest: req.body.location2,
    geometry_dest: {
      type: "Point",
      coordinates: [location_desto.lng, location_desto.lat],
    },
    usertype: req.body.usertype,
    IsAvailable: true,
  });
  console.log(location_desto+"desto")

  await sc.save(); // FIX ✅

  let nextusertype = req.body.usertype === "rider" ? "driver" : "rider";

  // Nearby search
  let findNearby = await source.find({
    $and: [
      {
        geometry_src: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [location_srco.lng, location_srco.lat],
            },
            $maxDistance: 1000,
          },
        },
      },
      { username: { $ne: req.session.username } }, // exclude self ✅
      { usertype: { $eq: nextusertype } },
      { IsAvailable: true },
    ],
  });

  
  findNearby = findNearby.filter((user) => {
    const [lng, lat] = user.geometry_dest.coordinates;
    const distance = geolib.getDistance(
      { latitude: lat, longitude: lng },
      { latitude: location_desto.lat, longitude: location_desto.lng }
    );
    return distance <= 1000;
  });

 
  let loggedInUser = req.session.username;
  console.log(req.session.username + "this is logged in user");
  res.render("awailableoption.ejs", { findNearby, loggedInUser });
});

app.get("/path/details", (req, res) => {
  res.render("pathdetails.ejs");
});

app.post("/checklogin", async (req, res) => {
  let data = req.body;
  let use = await user.findOne({ username: data.username });
  if (!use) {
    return res
      .status(404)
      .render("./accounts/login.ejs", { err: "User not found" });
  }
  if (data.username === use.username && data.password != use.password) {
    return res.status(401).render("./accounts/login.ejs", {
      err: "Incorrect Password Or Username",
    });
  }

  req.session.userId = use._id;
  req.session.username = use.username;
  console.log(use.username + "this is req.username");
  res.redirect("/home");
});

app.get("/login", (req, res) => {
  res.render("./accounts/login.ejs", { err: null });
});

app.get("/signup", (req, res) => {
  res.render("./accounts/signup.ejs");
});
app.post("/adduser", upload.single("QR"), async (req, res) => {
  const user1 = new user({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    QR: {
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
    },
  });

  await user1.save();
  req.session.userId = req.body._id;
  req.session.username = req.body.username;
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.render("./layout/boilerplate.ejs", { user: req.session.username });
  // const user1=new user({
  //     username:"Het Gajjar",
  //     email:"ghet0042@gmail.com",
  //     password:"Het3#8&!"
  // })
  // user1.save().then(console.log("saved"));
  // const source1=new source({
  //     usernme:"hetg",
  //     location:"56,maruti nagar",
  //     geometry:[236.2,2372,3]
  // })

  // source1.save().then(console.log("saved"));

  //  const destination1=new destination({
  //     usernme:"hetg",
  //     location:"56,maruti nagar",
  //     geometry:[236.2,2372,3]
  // })

  // destination1.save().then(console.log("saved"));
});
