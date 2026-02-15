import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let hitTestSource = null;
let localSpace = null;
let viewerSpace = null;
let reticle;

const button = document.getElementById("startAR");

button.addEventListener("click", async () => {

  if (!navigator.xr) {
    alert("WebXR not supported. Use Chrome on Android.");
    return;
  }

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test", "local-floor"]
  });

  startAR(session);
});

async function startAR(session) {

  document.getElementById("ui").style.display = "none";

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  localSpace = await session.requestReferenceSpace("local-floor");
  viewerSpace = await session.requestReferenceSpace("viewer");

  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });

  // Reticle (shows detected floor)
  const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
  ringGeometry.rotateX(-Math.PI / 2);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  reticle = new THREE.Mesh(ringGeometry, ringMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);

  session.addEventListener("select", () => {
    if (reticle.visible) {
      placeArrows(reticle.matrix);
    }
  });

  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {

  if (frame) {

    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {

      const hit = hitTestResults[0];
      const pose = hit.getPose(localSpace);

      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);

    } else {
      reticle.visible = false;
    }
  }

  renderer.render(scene, camera);
}

function placeArrows(matrix) {

  const basePosition = new THREE.Vector3();
  const baseQuaternion = new THREE.Quaternion();
  const baseScale = new THREE.Vector3();

  matrix.decompose(basePosition, baseQuaternion, baseScale);

  // Get camera forward direction
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.normalize();

  for (let i = 0; i < 10; i++) {

    const geometry = new THREE.ConeGeometry(0.1, 0.3, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const arrow = new THREE.Mesh(geometry, material);

    // Rotate arrow to lie flat
    arrow.rotation.x = Math.PI / 2;

    // Move arrow forward from base position
    const newPosition = basePosition.clone().add(
      forward.clone().multiplyScalar(i * 0.6)
    );

    arrow.position.copy(newPosition);

    scene.add(arrow);
  }
}
