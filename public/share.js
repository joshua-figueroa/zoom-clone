var screen = new Screen("screen-unique-id");

screen.onaddstream = function (e) {
    document.getElementById("video-grid").append(e.video);
};

screen.check();

const handleShare = () => {
    var video_constraints = {
        mandatory: { chromeMediaSource: "screen" },
        optional: [],
    };

    navigator.webkitGetUserMedia(
        {
            audio: false,
            video: video_constraints,
        },
        function () {
            screen.share();
        },
        function (err) {
            console.error(err);
        }
    );
};
