let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;
let cubeWorldPos = null;      // Anchored cube position
let lastDetectionTime = 0;
const disappearDelay = 1500;  // ms
const smoothing = 0.08;       // Smaller = smoother

// Optional: buffer last 5 QR positions for averaging
let lastPositions = [];

// Initialize Three.js
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

    let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    scene.add(cube);

    animate();
}

// Animate Three.js
function animate() {
    requestAnimationFrame(animate);

    if (cube.visible && cubeWorldPos) {
        // Smoothly move cube to anchored position
        cube.position.lerp(cubeWorldPos, smoothing);
        // Smooth rotation to face camera
        cube.lookAt(camera3D.position);
    }

    // Hide cube if QR code hasn’t been detected for a while
    if (cube.visible && Date.now() - lastDetectionTime > disappearDelay) {
        cube.visible = false;
        cubeWorldPos = null;
        lastPositions = [];
    }

    renderer.render(scene, camera3D);
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

            // Calculate QR center
            let centerX = code.location ? (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2 : canvas.width / 2;
            let centerY = code.location ? (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2 : canvas.height / 2;

            let xNorm = (centerX / canvas.width - 0.5) * 0.5;
            let yNorm = -(centerY / canvas.height - 0.5) * 0.5;

            // Convert to world coordinates
            let vector = new THREE.Vector3(xNorm, yNorm, -0.5);
            vector.unproject(camera3D);

            // Add to buffer for smoothing
            lastPositions.push(vector.clone());
            if (lastPositions.length > 5) lastPositions.shift();

            // Average positions
            let avg = new THREE.Vector3(0, 0, 0);
            lastPositions.forEach(v => avg.add(v));
            avg.divideScalar(lastPositions.length);

            // Set cube world position only if it’s the first detection
            if (!cubeWorldPos) {
                cubeWorldPos = avg.clone();
            } else {
                // Smoothly update world position for tiny movements
                cubeWorldPos.lerp(avg, 0.05);
            }

            cube.visible = true;
        }
    }

    requestAnimationFrame(tick);
}
