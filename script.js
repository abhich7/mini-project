import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let hitTestSource = null;
let localSpace = null;
let viewerSpace = null;
let reticle;
let selectedSource, selectedDestination;

// Simulated campus map (2D layout)
const campusMap = {
  SR: { x: 0, z: 0 },
  AK: { x: 5, z: 0 },
  JC: { x: 10, z: 3 },
  MT: { x: 15, z: 3 },
  CV: { x: 20, z: 5 },
  VS: { x: 25, z: 8 },
  MG: { x: 30, z: 10 },
  KC: { x: 35, z: 12 },
  CAN: { x: 40, z: 15 }
};

const button = document.getElementById("startAR");

button.addEventListener("click", async () => {

  selectedSource = document.getElementById("source").value;
  selectedDestination = document.getElementById("destination").value;

  if (selectedSource === selectedDestination) {
    alert("Source and destination cannot be same.");
    return;
  }

  if (!navigator.xr) {
    alert("WebXR not supported.");
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
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  localSpace = await session.requestReferenceSpace("local-floor");
  viewerSpace = await session.requestReferenceSpace("viewer");

  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });

  const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
  ringGeometry.rotateX(-Math.PI / 2);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  reticle = new THREE.Mesh(ringGeometry, ringMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  scene.add(reticle);

  session.addEventListener("select", () => {
    if (reticle.visible) {
      generateNavigationPath(reticle.matrix);
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

function generateNavigationPath(matrix) {

  const basePosition = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  matrix.decompose(basePosition, quaternion, scale);

  const sourceCoord = campusMap[selectedSource];
  const destCoord = campusMap[selectedDestination];

  const dx = destCoord.x - sourceCoord.x;
  const dz = destCoord.z - sourceCoord.z;

  const pathLength = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.floor(pathLength);

  const direction = new THREE.Vector3(dx, 0, dz).normalize();

  for (let i = 0; i < steps; i++) {

    const geometry = new THREE.ConeGeometry(0.1, 0.3, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.5,
      metalness: 0.1
    });

    const arrow = new THREE.Mesh(geometry, material);
    arrow.rotation.x = Math.PI / 2;

    const newPosition = basePosition.clone().add(
      direction.clone().multiplyScalar(i * 0.8)
    );

    arrow.position.copy(newPosition);
    scene.add(arrow);
  }
}
