import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let arrowsPlaced = false;
let selectedSource, selectedDestination;

document.getElementById("startAR").addEventListener("click", async () => {

  selectedSource = document.getElementById("source").value;
  selectedDestination = document.getElementById("destination").value;

  if (selectedSource === selectedDestination) {
    alert("Source and Destination cannot be same.");
    return;
  }

  if (!navigator.xr) {
    alert("Use Chrome on Android.");
    return;
  }

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["local-floor"]
  });

  startAR(session);
});

async function startAR(session) {

  document.getElementById("ui").style.display = "none";

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  renderer.setAnimationLoop(render);
}

function render() {

  if (!arrowsPlaced) {
    placeArrows();
    arrowsPlaced = true;
  }

  renderer.render(scene, camera);
}

function placeArrows() {

  // Get forward direction of camera
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  // Starting point: 1 meter in front
  const startPosition = new THREE.Vector3(0, 0, -1);
  startPosition.applyQuaternion(camera.quaternion);
  startPosition.add(camera.position);

  for (let i = 0; i < 8; i++) {

    const geometry = new THREE.ConeGeometry(0.15, 0.4, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00
    });

    const arrow = new THREE.Mesh(geometry, material);

    // Make arrow lie flat
    arrow.rotation.x = Math.PI / 2;

    // Space arrows forward
    const offset = forward.clone().multiplyScalar(i * 0.7);

    arrow.position.copy(startPosition.clone().add(offset));

    scene.add(arrow);
  }
}
