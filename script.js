import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;

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

  // Simple green cube
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);

  cube.position.set(0, 0, -1);
  scene.add(cube);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
