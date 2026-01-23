let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;
let cubeSpawned = false;
let cubePosition = null;

const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');

startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    startAR();
});

function startAR() {
    // Request fullscreen
    if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
    }

    // Access camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            initAR();
            tick();
        })
        .catch(err => {
            alert("Camera access denied: " + err);
        });
}

// Initialize Three.js scene
function initAR() {
    scene = new THREE.Scene();

    camera3D = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    document.body.appendChild(renderer.domElement);

    // Cube
    let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    scene.add(cube);

    window.addEventListener('resize', onWindowResize);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}

function onWindowResize() {
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// QR detection loop
function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && !cubeSpawned) {
            cubeSpawned = true;

            let centerX = code.location ? (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2 : canvas.width/2;
            let centerY = code.location ? (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2 : canvas.height/2;

            let xNorm = (centerX / canvas.width - 0.5) * 0.5;
            let yNorm = -(centerY / canvas.height - 0.5) * 0.5;

            cubePosition = new THREE.Vector3(xNorm, yNorm, -0.5);
            cube.position.copy(cubePosition);
            cube.visible = true;
        }

        // Keep cube at stored position
        if (cubeSpawned && cubePosition) {
            cube.position.copy(cubePosition);
            cube.visible = true;
        }
    }

    requestAnimationFrame(tick);
}
