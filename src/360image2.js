document.addEventListener("DOMContentLoaded", function() {
    pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": "data/imageTest.jpg",
        "autoLoad": true,
    });
});

let n=0;
function pressed() {
    n++;
    console.log("Button pressed!");
    pannellum.viewer('panorama').addScene(jsonData[n]);
}

let jsonData = [
    {
        "type": "equirectangular",
        "panorama": "data/imageTest.jpg",
        "autoLoad": true,
        "hotSpots": [
            {
                "pitch": 0,
                "yaw": 0,
                "type": "info",
                "text": "First Image Info",
            }
        ]
    },
    {
        "type": "equirectangular",
        "panorama": "data/imageTest2.jpg",
        "autoLoad": true,
        "hotSpots": [
            {
                "pitch": 10,
                "yaw": 20,
                "type": "info",
                "text": "Second Image Info",
            }
        ]
    },
    {
        "type": "equirectangular",
        "panorama": "data/imageTest3.jpg",
        "autoLoad": true,
        "hotSpots": [
            {
                "pitch": -10,
                "yaw": -20,
                "type": "info",
                "text": "Third Image Info",
            }
        ]
    },
    {
        "type": "equirectangular",
        "panorama": "data/imageTest4.jpg",
        "autoLoad": true,
        "hotSpots": [
            {
                "pitch": 15,
                "yaw": 30,
                "type": "info",
                "text": "Fourth Image Info",
            }
        ]
    }
];