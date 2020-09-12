require("dotenv").config();
const express = require("express");
const socketIO = require("socket.io");
const { Server } = require("http");
const { ExpressPeerServer } = require("peer");
const { v4: uuid } = require("uuid");
const helmet = require("helmet");

const app = express();
const server = Server(app);
const io = socketIO(server);
const port = process.env.PORT || 5000;
const peerServer = ExpressPeerServer(server, { debug: true });

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
    res.redirect(`/${uuid()}`);
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join-room", (roomID, userID) => {
        socket.join(roomID);
        socket.to(roomID).broadcast.emit("user-connected", userID);
        console.log(`User ${userID} has joined the room`);
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.id} has leave the room`);
    });
});

app.get("/:room", (req, res) => {
    const { room } = req.params;
    res.render("main", { roomID: room });
});

server.listen(port, () => console.log("App is listening on port", port));