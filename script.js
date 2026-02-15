import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let hitTestSource = null;
let localSpace = null;
let viewerSpace = null;
let reticle;

let selectedSource, selectedDestination;

// Imaginary campus layout (grid style)
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
      placeNavigation(reticle.matrix);
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

function placeNavigation(matrix) {

  const basePosition = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  matrix.decompose(basePosition, quaternion, scale);

  const source = campusMap[selectedSource];
  const dest = campusMap[selectedDestination];

  const dx = dest.x - source.x;
  const dz = dest.z - source.z;

  // Camera forward
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

  // -------- STRAIGHT PART --------
  const straight = new THREE.Mesh(straightGeometry, straightMaterial);
  straight.position.copy(basePosition.clone().add(forward.clone().multiplyScalar(1.5)));
  straight.rotation.x = Math.PI / 2;
  scene.add(straight);

  // -------- TURN DECISION --------
  let turnDirection = null;

  if (Math.abs(dx) > Math.abs(dz)) {
    turnDirection = dx > 0 ? "RIGHT" : "LEFT";
  } else {
    turnDirection = dz > 0 ? "STRAIGHT" : "BACK";
  }

  if (turnDirection === "LEFT" || turnDirection === "RIGHT") {

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
