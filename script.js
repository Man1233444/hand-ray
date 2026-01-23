let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;
let lastDetectionTime = 0;
const disappearDelay = 1500;
const smoothing = 0.1;

// Initialize Three.js
function initAR() {
    scene = new THREE.Scene();

    camera3D = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
    scene.add(camera3D);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    document.body.appendChild(renderer.domElement);

    // Cube as child of camera
    let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    camera3D.add(cube);

    animate();
}

// Animate Three.js
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);

    // Hide cube if QR lost for a while
    if (cube.visible && Date.now() - lastDetectionTime > disappearDelay) {
        cube.visible = false;
        cube.position.set(0, 0, 0);
    }
}

// Camera access
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        video.play();
        initAR();
        tick();
    })
    .catch(err => alert("Camera access denied: " + err));

// QR detection loop
function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            lastDetectionTime = Date.now();
            cube.visible = true;

            // Map QR center to camera-local coordinates
            let centerX = code.location ? (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2 : canvas.width / 2;
            let centerY = code.location ? (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2 : canvas.height / 2;

            // Normalize -1 to 1
            let xNorm = (centerX / canvas.width - 0.5) * 2;
            let yNorm = -(centerY / canvas.height - 0.5) * 2;

            // Smoothly move cube in front of camera
            let targetPos = new THREE.Vector3(xNorm * 0.3, yNorm * 0.3, -0.5); // scale to make cube visible
            cube.position.lerp(targetPos, smoothing);
        }
    }

    requestAnimationFrame(tick);
}
