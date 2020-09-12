const socket = io("/");
const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "5000"
});

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement('video');
myVideo.muted = true;

var myVideoStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", call => {
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream)
        });
    });

    socket.on("user-connected", (userID) => {
        connectNewUser(userID, stream);
    });
});

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
};

peer.on("open", id => {
    console.log("Peer ID:", id);
    socket.emit("join-room", ROOM_ID, id);
});

const connectNewUser = (userID, stream) => {
    console.log("New user:", userID);

    const call = peer.call(userID, stream);
    const video = document.createElement("video");

    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
};