let zoomLevel = 1;
const zoomStep = 0.1;
const minZoom = 1;
const maxZoom = 5;
const camera = document.querySelector('#camera');
const sky = document.querySelector('#sky');
const box1 = document.querySelector('#box1').addEventListener('click', () => {
    sky.setAttribute('src', 'data/imageTest2.jpg');
});
const box2 = document.querySelector('#box2').addEventListener('click', () => {
    sky.setAttribute('src', 'data/imageTest3.jpg');
});
const box3 = document.querySelector('#box3').addEventListener('click', () => {
    sky.setAttribute('src', 'data/imageTest4.jpg');
});
const box4 = document.querySelector('#box4').addEventListener('click', () => {
    sky.setAttribute('src', 'data/imageTest.jpg');
});

window.addEventListener('wheel', (event) => {
    
    event.preventDefault();
    if (event.deltaY < 0) {
        zoomLevel = Math.min(maxZoom, zoomLevel + zoomStep);
        camera.setAttribute("zoom", zoomLevel);
    } else {
        zoomLevel = Math.max(minZoom, zoomLevel - zoomStep);
        camera.setAttribute("zoom", zoomLevel);
    }
}, { passive: false });