import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let pathGroup;
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

  createNavigationPath();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function createNavigationPath() {

  pathGroup = new THREE.Group();

  // Start 1 meter in front of camera
  const basePosition = new THREE.Vector3(0, 0, -1);
  basePosition.applyQuaternion(camera.quaternion);
  basePosition.add(camera.position);

  pathGroup.position.copy(basePosition);

  // Different predefined paths
  const paths = {
    "SR-CAN": [
      { type: "straight", distance: 5 },
      { type: "right", distance: 3 },
      { type: "straight", distance: 4 }
    ],
    "AK-JC": [
      { type: "straight", distance: 4 },
      { type: "left", distance: 4 },
      { type: "straight", distance: 3 }
    ],
    "JC-MT": [
      { type: "straight", distance: 6 },
      { type: "right", distance: 5 }
    ]
  };

  const key = selectedSource + "-" + selectedDestination;
  const selectedPath = paths[key] || [
    { type: "straight", distance: 5 }
  ];

  let currentPosition = new THREE.Vector3(0, 0, 0);
  let direction = new THREE.Vector3(0, 0, -1);

  selectedPath.forEach(step => {

    if (step.type === "left") {
      direction.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI / 2);
    }

    if (step.type === "right") {
      direction.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI / 2);
    }

    const arrowCount = Math.floor(step.distance);

    for (let i = 0; i < arrowCount; i++) {

      const geometry = new THREE.ConeGeometry(0.15, 0.4, 16);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00
      });

      const arrow = new THREE.Mesh(geometry, material);
      arrow.rotation.x = Math.PI / 2;

      arrow.position.copy(currentPosition);
      arrow.position.add(direction.clone().multiplyScalar(i + 1));

      pathGroup.add(arrow);
    }

    currentPosition.add(direction.clone().multiplyScalar(step.distance));
  });

  scene.add(pathGroup);
}