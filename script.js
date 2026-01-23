const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const scene = document.getElementById('ar-scene');
const cube = document.getElementById('cube');

startBtn.addEventListener('click', () => {
    // Hide start screen
    startScreen.style.display = 'none';
    // Show AR scene
    scene.style.display = 'block';
    // Show cube when marker detected
    cube.setAttribute('visible', 'true');
});

