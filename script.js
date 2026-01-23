let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;

// Initialize Three.js
function initAR() {
    scene = new THREE.Scene();

    camera3D = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent background
    document.body.appendChild(renderer.domElement);

    // Cube setup
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    scene.add(cube);

    camera3D.position.z = 0;

    animate();
}

// Animate Three.js
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}

// Start camera
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

// Scan QR codes
function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            cube.visible = true;

            // If location exists, calculate center
            let centerX = code.location ? (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2 : canvas.width / 2;
            let centerY = code.location ? (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2 : canvas.height / 2;

            // Normalize coordinates (-0.5 to 0.5)
            const xNorm = (centerX / canvas.width - 0.5);
            const yNorm = -(centerY / canvas.height - 0.5);

            // Place cube in front of camera
            cube.position.set(xNorm * 0.5, yNorm * 0.5, -0.5);
        } else {
            cube.visible = false;
        }
    }

    requestAnimationFrame(tick);
}
