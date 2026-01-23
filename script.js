let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;
let cubeWorldPos = null; // Fixed world position for cube
let smoothing = 0.1; // 0.05-0.2, adjust for smoothness

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

    // Cube
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
        // Smoothly move cube to fixed world position
        cube.position.lerp(cubeWorldPos, smoothing);
        // Cube always faces camera
        cube.lookAt(camera3D.position);
    }

    renderer.render(scene, camera3D);
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

// QR detection loop
function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            if (!cube.visible) {
                // First detection: set cube visible and fix world position
                cube.visible = true;

                // Map QR center to normalized coordinates (-0.5 to 0.5)
                let centerX = code.location ? (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2 : canvas.width / 2;
                let centerY = code.location ? (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2 : canvas.height / 2;

                let xNorm = (centerX / canvas.width - 0.5) * 0.5;
                let yNorm = -(centerY / canvas.height - 0.5) * 0.5;

                // Convert to world coordinates in front of camera
                let vector = new THREE.Vector3(xNorm, yNorm, -0.5);
                vector.unproject(camera3D);
                cubeWorldPos = vector.clone(); // Fix cube in world space
            }
        } else {
            // Optional: keep cube visible for smoothing instead of disappearing immediately
        }
    }

    requestAnimationFrame(tick);
}
