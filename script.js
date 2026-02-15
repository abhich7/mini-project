import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let referenceSpace;

const button = document.getElementById("startAR");

button.addEventListener("click", async () => {

  const source = document.getElementById("source").value;
  const destination = document.getElementById("destination").value;

  if (source === destination) {
    alert("Source and destination cannot be the same.");
    return;
  }

  if (!navigator.xr) {
    alert("WebXR not supported. Use Chrome on Android.");
    return;
  }

  try {
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["local-floor"]
    });

    startAR(session);

  } catch (error) {
    alert("Failed to start AR session.");
    console.error(error);
  }
});

function startAR(session) {

  document.getElementById("ui").style.display = "none";

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  referenceSpace = renderer.xr.getReferenceSpace();

  createArrowPath();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function createArrowPath() {

  const arrowCount = 15;
  const spacing = 0.5;

  for (let i = 1; i <= arrowCount; i++) {

    const geometry = new THREE.ConeGeometry(0.1, 0.3, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const arrow = new THREE.Mesh(geometry, material);

    arrow.rotation.x = Math.PI / 2;

    // Position arrows properly in world space
    arrow.position.z = -i * spacing;
    arrow.position.y = 0;

    scene.add(arrow);
  }
}
