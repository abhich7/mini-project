import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let selectedSource, selectedDestination;

// Imaginary campus grid layout
const campusMap = {
  SR: { x: 0, z: 0 },
  AK: { x: 5, z: 0 },
  JC: { x: 5, z: 5 },
  MT: { x: 10, z: 5 },
  CV: { x: 10, z: 10 },
  VS: { x: 15, z: 10 },
  MG: { x: 15, z: 15 },
  KC: { x: 20, z: 15 },
  CAN: { x: 20, z: 20 }
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
    alert("WebXR not supported. Use Chrome on Android.");
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

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Wait one frame so camera is initialized
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });

  // Small delay to ensure camera pose ready
  setTimeout(() => {
    placeNavigation();
  }, 500);
}

function placeNavigation() {

  const source = campusMap[selectedSource];
  const dest = campusMap[selectedDestination];

  const dx = dest.x - source.x;
  const dz = dest.z - source.z;

  // Base position: 1 meter in front of camera
  const basePosition = new THREE.Vector3(0, 0, -1);
  basePosition.applyQuaternion(camera.quaternion);
  basePosition.add(camera.position);

  // Camera forward direction
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  // Right direction
  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(camera.quaternion);
  right.y = 0;
  right.normalize();

  const straightMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const turnMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });

  const straightGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 16);

  // -------- FIRST STRAIGHT --------
  const straight = new THREE.Mesh(straightGeometry, straightMaterial);
  straight.position.copy(basePosition.clone().add(forward.clone().multiplyScalar(1.5)));
  straight.rotation.x = Math.PI / 2;
  scene.add(straight);

  // Decide turn direction
  let turnDirection = null;

  if (Math.abs(dx) > Math.abs(dz)) {
    turnDirection = dx > 0 ? "RIGHT" : "LEFT";
  }

  if (turnDirection) {

    const turnGeometry = new THREE.TorusGeometry(0.4, 0.05, 16, 100, Math.PI / 2);
    const turn = new THREE.Mesh(turnGeometry, turnMaterial);

    turn.position.copy(basePosition.clone().add(forward.clone().multiplyScalar(3)));
    turn.rotation.x = Math.PI / 2;

    if (turnDirection === "LEFT") {
      turn.rotation.z = Math.PI;
    }

    scene.add(turn);

    const secondDir = turnDirection === "RIGHT"
      ? right
      : right.clone().negate();

    const straight2 = new THREE.Mesh(straightGeometry, straightMaterial);

    straight2.position.copy(
      basePosition
        .clone()
        .add(forward.clone().multiplyScalar(3))
        .add(secondDir.clone().multiplyScalar(1.5))
    );

    straight2.rotation.x = Math.PI / 2;
    straight2.rotation.z = Math.PI / 2;

    scene.add(straight2);
  }
}
