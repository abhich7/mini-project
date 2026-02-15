import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let selectedSource, selectedDestination;
let localSpace, viewerSpace, hitTestSource;

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

document.getElementById("startAR").addEventListener("click", async () => {

  selectedSource = document.getElementById("source").value;
  selectedDestination = document.getElementById("destination").value;

  if (selectedSource === selectedDestination) {
    alert("Source and destination cannot be same.");
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

  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {

  if (frame && hitTestSource) {

    const hits = frame.getHitTestResults(hitTestSource);

    if (hits.length > 0) {

      const pose = hits[0].getPose(localSpace);

      placeNavigation(pose.transform.matrix);
      hitTestSource = null; // run only once
    }
  }

  renderer.render(scene, camera);
}

function placeNavigation(matrixArray) {

  const matrix = new THREE.Matrix4();
  matrix.fromArray(matrixArray);

  const basePosition = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  matrix.decompose(basePosition, quaternion, scale);

  const source = campusMap[selectedSource];
  const dest = campusMap[selectedDestination];

  const dx = dest.x - source.x;
  const dz = dest.z - source.z;

  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  const lineLength = 4;

  // -------- LINE --------
  const lineGeometry = new THREE.BoxGeometry(0.1, 0.02, lineLength);
  const lineMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

  const line = new THREE.Mesh(lineGeometry, lineMaterial);
  line.position.copy(basePosition.clone().add(forward.clone().multiplyScalar(lineLength / 2)));
  line.rotation.y = Math.atan2(forward.x, forward.z);

  scene.add(line);

  // -------- ARROW HEAD --------
  const arrowGeometry = new THREE.ConeGeometry(0.25, 0.5, 32);
  const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
  arrow.position.copy(basePosition.clone().add(forward.clone().multiplyScalar(lineLength + 0.3)));
  arrow.rotation.x = Math.PI;
  arrow.rotation.y = Math.atan2(forward.x, forward.z);

  scene.add(arrow);

  // -------- TEXT --------
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = "white";
  context.font = "bold 60px Arial";
  context.fillText("Walk Straight", 50, 150);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.scale.set(2, 1, 1);
  sprite.position.copy(basePosition.clone().add(forward.clone().multiplyScalar(2)));
  sprite.position.y += 1.5;

  scene.add(sprite);
}