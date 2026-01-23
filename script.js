let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera, renderer, cube;

// Initialize Three.js scene
function initAR() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent background
    document.body.appendChild(renderer.domElement);

    let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    scene.add(cube);

    camera.position.z = 0;
    animate();
}

// Animate Three.js scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Access camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
.then(stream => {
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.play();
    initAR();
    tick();
});

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            // Show cube when QR detected
            cube.visible = true;
            // Move cube in front of camera (simple example)
            cube.position.set(0, 0, -0.5);
        } else {
            cube.visible = false;
        }
    }
    requestAnimationFrame(tick);
}
