let panorama = pannellum.viewer('panorama', {
    "type": "equirectangular",
    "panorama": "data/imageTest1.jpg",
    "autoLoad": true,
    "hotSpots": [
        {
            "pitch": 14.1,
            "yaw": 1.5,
            "type": "scene",
            "text": "Click!",
            "clickHandlerFunc": function() {
                pressed();
            },
        },
    ]
});

let n=1;
function pressed() {
    n++;
    if (n==5) {
        n=1;
    }
    console.log("Button pressed!");
    panorama.destroy();
    panorama = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": "data/imageTest"+n+".jpg",
        "autoLoad": true,
        "hotSpots": [
            {
                "pitch": 5*n,
                "yaw": 5*n,
                "type": "scene",
                "text": "Click!",
                "clickHandlerFunc": function() {
                    pressed();
                },
            },
        ]
    });
}
