let video = document.getElementById('camera');
let canvas = document.getElementById('qr-canvas');
let ctx = canvas.getContext('2d');

let scene, camera3D, renderer, cube;

// Initialize Three.js
function initAR() {
    scene = new THREE.Scene();

    camera3D = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent
    document.body.appendChild(renderer.domElement);

    let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    let material = new THREE.MeshNormalMaterial();
    cube = new THREE.Mesh(geometry, material);
    cube.visible = false;
    scene.add(cube);

    camera3D.position.z = 0.5;

    animate();
}

// Animate Three.js scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera3D);
}

// Access camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
.then(stream => {
    video.srcObject = stream;
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

        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            cube.visible = true;

            // Map QR code center to normalized coordinates
            let centerX = (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2;
            let centerY = (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2;

            let xNorm = (centerX / canvas.width - 0.5) * 2; // -1 to 1
            let yNorm = -(centerY / canvas.height - 0.5) * 2; // -1 to 1

            // Place cube in front of camera using normalized coordinates
            cube.position.set(xNorm * 0.5, yNorm * 0.5, -0.5);
        } else {
            cube.visible = false;
        }
    }

    requestAnimationFrame(tick);
}
