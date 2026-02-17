import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let arrowMesh = null;
let subtitle = document.getElementById("subtitle");

let navigationSteps = [];
let currentStepIndex = 0;
let stepStartPosition = new THREE.Vector3();

document.getElementById("startAR").addEventListener("click", async () => {

  const source = document.getElementById("source").value;
  const destination = document.getElementById("destination").value;

  if (!source || !destination) {
    alert("Please select source and destination");
    return;
  }

  if (source === destination) {
    alert("Source and destination cannot be same");
    return;
  }

  if (!navigator.xr) {
    alert("Use Chrome on Android");
    return;
  }

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["local-floor"]
  });

  startAR(session);
});

async function startAR(session) {

  document.getElementById("ui").style.display = "none";
  subtitle.style.display = "block";

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  setupRoute();

  renderer.setAnimationLoop(update);
}

function setupRoute() {

  navigationSteps = [
    { type:"straight", distance:2, text:"Walk straight 2 meters" },
    { type:"left", distance:1.5, text:"Turn left and walk 1.5 meters" },
    { type:"right", distance:2, text:"Turn right and walk 2 meters" },
    { type:"straight", distance:1, text:"Destination ahead" }
  ];

  currentStepIndex = 0;

  showStep(0);
}

function showStep(index) {

  if (arrowMesh) {
    scene.remove(arrowMesh);
    arrowMesh.geometry.dispose();
    arrowMesh.material.dispose();
    arrowMesh = null;
  }

  const step = navigationSteps[index];

  subtitle.innerText = step.text;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.lineTo(-0.25, 0);
  shape.lineTo(-0.1, 0);
  shape.lineTo(-0.1, -0.5);
  shape.lineTo(0.1, -0.5);
  shape.lineTo(0.1, 0);
  shape.lineTo(0.25, 0);
  shape.lineTo(0, 0.5);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({ color:0x00ff00 });

  arrowMesh = new THREE.Mesh(geometry, material);

  // Place 1.5m in front of user in world
  const forward = new THREE.Vector3(0,0,-1);
  forward.applyQuaternion(camera.quaternion);
  forward.normalize();

  const position = camera.position.clone().add(forward.multiplyScalar(1.5));

  arrowMesh.position.copy(position);
  arrowMesh.lookAt(camera.position);
  arrowMesh.rotateX(-Math.PI/2);

  if (step.type === "left") {
    arrowMesh.rotateZ(Math.PI/2);
  }

  if (step.type === "right") {
    arrowMesh.rotateZ(-Math.PI/2);
  }

  scene.add(arrowMesh);

  stepStartPosition.copy(camera.position);
}

function update() {

  if (currentStepIndex >= navigationSteps.length) {
    subtitle.innerText = "You reached your destination";
    return;
  }

  const step = navigationSteps[currentStepIndex];

  const distanceMoved = camera.position.distanceTo(stepStartPosition);

  if (distanceMoved >= step.distance) {

    currentStepIndex++;

    if (currentStepIndex < navigationSteps.length) {
      showStep(currentStepIndex);
    } else {
      subtitle.innerText = "You reached your destination";
      if (arrowMesh) scene.remove(arrowMesh);
    }
  }

  renderer.render(scene, camera);
}