let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;
let cubeSpawned = false;   // Track if cube is spawned
let cubePosition = null;   // Store the cube’s fixed position

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
    cube.visible = false;  // start hidden
    scene.add(cube);

    animate();
}

// Animate Three.js
function animate() {
    requestAnimationFrame(animate);
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

        // If QR detected and cube hasn't spawned yet
        if (code && !cubeSpawned) {
            cubeSpawned = true;

            // Compute cube position in normalized camera coordinates
            let centerX = code.location ? (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2 : canvas.width/2;
            let centerY = code.location ? (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2 : canvas.height/2;

            let xNorm = (centerX / canvas.width - 0.5) * 0.5; 
            let yNorm = -(centerY / canvas.height - 0.5) * 0.5;

            cubePosition = new THREE.Vector3(xNorm, yNorm, -0.5); // store fixed position
            cube.position.copy(cubePosition);
            cube.visible = true;
        }

        // If cube already spawned, keep it at the stored position
        if (cubeSpawned && cubePosition) {
            cube.position.copy(cubePosition);
            cube.visible = true;
        }
    }

    requestAnimationFrame(tick);
}
