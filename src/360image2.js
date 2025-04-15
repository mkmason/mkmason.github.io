let panorama = pannellum.viewer('panorama', {
    "type": "equirectangular",
    "panorama": "data/imageTest1.jpg",
    "autoLoad": true,
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
    });
}


let locationData = [{
    "latitude": 55.651459,
    "longitude": 12.134499,
    "image": "data/imageTest1.jpg"
}, {
    "latitude": 55.653372,
    "longitude": 12.140358,
    "image": "data/imageTest2.jpg"
}, {
    "latitude": 55.652658,
    "longitude": 12.139993,
    "image": "data/imageTest3.jpg"
}, {
    "latitude": 55.654111,
    "longitude": 12.138877,
    "image": "data/imageTest4.jpg"
}];

let mapBoundaries = {
    northEast: { lat: 55.655294, lng: 12.144353 },
    southWest: { lat: 55.651107, lng: 12.134139 },
};
// Initialize the map as an image
let mapImage = document.getElementById('mapImage');
mapImage.parentElement.style.position = 'relative'; // Ensure parent container has relative positioning
mapImage.style.width = '100%'; // Set width to 100%
mapImage.style.height = '100%'; // Set height to 100%

// Add buttons to the map based on locationData
locationData.forEach((location, index) => {
    let button = document.createElement('button');
    button.innerHTML = index + 1; // Button label
    button.style.position = 'absolute';
    button.style.width = '10px';
    button.style.height = '10px';
    button.style.backgroundColor = 'red';
    button.style.borderRadius = '50%';
    button.style.left = ((location.longitude - mapBoundaries.southWest.lng) / 
                         (mapBoundaries.northEast.lng - mapBoundaries.southWest.lng) * 100) + '%';
    button.style.top = ((mapBoundaries.northEast.lat - location.latitude) / 
                        (mapBoundaries.northEast.lat - mapBoundaries.southWest.lat) * 100) + '%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.zIndex = 10;

    button.addEventListener('click', () => {
        panorama.destroy();
        panorama = pannellum.viewer('panorama', {
            "type": "equirectangular",
            "panorama": location.image,
            "autoLoad": true,
        });
    });

    mapImage.parentElement.appendChild(button);
});