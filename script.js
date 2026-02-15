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

  try {
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test", "local-floor"]
    });

    startAR(session);

  } catch (error) {
    alert("Failed to start AR session.");
    console.error(error);
  }
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

  // More stable reference space
  renderer.xr.setReferenceSpaceType("local-floor");

  renderer.xr.setSession(session);
  document.body.appendChild(renderer.domElement);

  // Add lighting for stability
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  localSpace = await session.requestReferenceSpace("local-floor");
  viewerSpace = await session.requestReferenceSpace("viewer");

  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });

  // Floor detection reticle
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
  forward.y = 0; // keep arrows on floor plane
  forward.normalize();

  for (let i = 0; i < 10; i++) {

    const geometry = new THREE.ConeGeometry(0.1, 0.3, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.5,
      metalness: 0.1
    });

    const arrow = new THREE.Mesh(geometry, material);

    // Lay arrow flat
    arrow.rotation.x = Math.PI / 2;

    // Calculate forward position
    const newPosition = basePosition.clone().add(
      forward.clone().multiplyScalar(i * 0.6)
    );

    arrow.position.copy(newPosition);

    scene.add(arrow);
  }
}
