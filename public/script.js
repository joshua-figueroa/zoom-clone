const socket = io(location.hostname);
const myPeer = new Peer(undefined, {
    host: location.hostname,
    port: location.port || (location.protocol === "https:" ? 443 : 80),
    path: "/peerjs",
});

var peers = {};
var myID = "";
var myVideoStream;
var activeSreen = "";

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        addVideoStream(myVideo, stream);
        myVideoStream = stream;

        myPeer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");

            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
            });
        });

        socket.on("user-connected", (userID, username) => {
            connectNewUser(userID, stream);
            systemMessage(username, true);
        });

        socket.emit("participants");
    });

socket.on("user-disconnected", (userID, username) => {
    peers[userID]?.close();
    systemMessage(username);
});

myPeer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id, USERNAME);
    myID = id;
});

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
};

const connectNewUser = (userID, stream) => {
    const call = myPeer.call(userID, stream);
    const video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    });

    call.on("close", () => {
        video.remove();
    });

    peers[userID] = call;
};

const msg = document.getElementById("chat-message");
const btn = document.getElementById("send-btn");
const lists = document.getElementById("messages");

const sendMessage = (message) => {
    if (message) socket.emit("message", stripHTML(message));
    msg.value = "";
    msg.focus();
};

msg.addEventListener("keypress", (e) => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(msg.value);
    }
});

btn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage(msg.value);
});

socket.on("message", (message, userID, username) => {
    const container = document.querySelector(".main__chat__box");
    const list = document.createElement("li");
    list.className = userID === myID ? "message-right" : "message-left";
    list.innerHTML = `
        ${userID !== myID ? "<div class='message__avatar'>" + username[0].toUpperCase() + "</div>" : ""}

        <div class="message__content">
            ${userID !== myID ? "<span>" + username + "</span>" : ""}
            <div class="message__text"><span>${message}<span></div>
        </div>`;

    lists.append(list);
    container.scrollTop = container.scrollHeight;
});

socket.on("participants", (users) => {
    // const container = document.querySelector(".main__users__box");
    const lists = document.getElementById("users");
    lists.innerHTML = "";
    lists.textContent = "";

    users.forEach((user) => {
        const list = document.createElement("li");
        list.className = "user";
        list.innerHTML = `
            <div class="user__avatar">${user.name[0].toUpperCase()}</div>
            <span class="user__name">${user.name}${user.id == myID ? " (You)" : ""}</span>
            <div class="user__media">
                <i class="fas fa-microphone${user.audio === false ? "-slash" : ""}"></i>
                <i class="fas fa-video${user.video === false ? "-slash" : ""}"></i>
            </div>
        `;

        lists.append(list);
    });
});

const handleMicrophone = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    const node = document.querySelector(".mute-btn");

    if (enabled) {
        socket.emit("mute-mic");
        myVideoStream.getAudioTracks()[0].enabled = false;

        node.children[0].classList.remove("fa-microphone");
        node.children[0].classList.add("fa-microphone-slash");
        node.children[1].innerHTML = "Unmute";
    } else {
        socket.emit("unmute-mic");
        myVideoStream.getAudioTracks()[0].enabled = true;

        node.children[0].classList.remove("fa-microphone-slash");
        node.children[0].classList.add("fa-microphone");
        node.children[1].innerHTML = "Mute";
    }
};

const handleVideo = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    const node = document.querySelector(".video-btn");

    if (enabled) {
        socket.emit("stop-video");
        myVideoStream.getVideoTracks()[0].enabled = false;

        node.children[0].classList.remove("fa-video");
        node.children[0].classList.add("fa-video-slash");
        node.children[1].innerHTML = "Play Video";
    } else {
        socket.emit("play-video");
        myVideoStream.getVideoTracks()[0].enabled = true;

        node.children[0].classList.remove("fa-video-slash");
        node.children[0].classList.add("fa-video");
        node.children[1].innerHTML = "Stop Video";
    }
};

const isHidden = (screen) => screen.classList.contains("screen-hide");

const handleScreen = (screen) => {
    const left_container = document.querySelector(".main__left");
    const right_container = document.querySelector(".main__right");
    const chatScreen = document.getElementById("chat-screen");
    const usersScreen = document.getElementById("users-screen");

    if (screen.id === "chats") {
        handleActive("chat-btn");
        if (activeSreen === "") {
            chatScreen.classList.remove("screen-hide");
            activeSreen = "chats";
        } else if (activeSreen === "chats") {
            chatScreen.classList.add("screen-hide");
            activeSreen = "";
        } else {
            chatScreen.classList.remove("screen-hide");
            usersScreen.classList.add("screen-hide");
            activeSreen = "chats";
            handleActive("users-btn");
        }
    } else {
        handleActive("users-btn");
        if (activeSreen === "") {
            usersScreen.classList.remove("screen-hide");
            activeSreen = "users";
        } else if (activeSreen === "users") {
            usersScreen.classList.add("screen-hide");
            activeSreen = "";
        } else {
            usersScreen.classList.remove("screen-hide");
            chatScreen.classList.add("screen-hide");
            activeSreen = "users";
            handleActive("chat-btn");
        }
    }

    if (isHidden(right_container)) {
        right_container.classList.remove("screen-hide");
        left_container.classList.remove("screen-full");
    } else if (activeSreen === "") {
        right_container.classList.add("screen-hide");
        left_container.classList.add("screen-full");
    }
};

const handleActive = (buttonClass) => {
    const button = document.querySelector(`.${buttonClass}`);
    const active = button.classList.contains("active-btn");

    if (active) button.classList.remove("active-btn");
    else button.classList.add("active-btn");
};

const systemMessage = (username, join = false) => {
    const date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    const format = hours >= 12 ? "PM" : "AM";
    hours %= 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;

    const container = document.querySelector(".main__chat__box");
    const list = document.createElement("li");
    list.className = "system-message";
    list.innerHTML = `<span>${hours}:${minutes}${format}</span><span>${username} has ${
        join ? "joined" : "left"
    } the meeting</span>`;

    lists.append(list);
    container.scrollTop = container.scrollHeight;
};

const handleInvite = () => {
    alert(`Invite people to your room:\n\nRoom ID: ${ROOM_ID}\nCopy this link to join: ${window.location.href}`);
};
