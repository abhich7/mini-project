import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let arrowMesh;
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
    alert("Source and Destination cannot be same");
    return;
  }

  if (!navigator.xr) {
    alert("Use Chrome on Android");
    return;
  }

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["local-floor"]
  });

  startAR(session, source, destination);
});

async function startAR(session, source, destination) {

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

  setupRoute(source, destination);

  renderer.setAnimationLoop(update);
}

function setupRoute(source, destination) {

  // Example imaginary routes
  navigationSteps = [
    { type:"straight", distance:2, text:"Walk straight 2 meters" },
    { type:"left", distance:1.5, text:"Turn left and walk 1.5 meters" },
    { type:"right", distance:2, text:"Turn right and walk 2 meters" },
    { type:"straight", distance:1, text:"Destination is ahead" }
  ];

  currentStepIndex = 0;

  createArrow();

  subtitle.innerText = navigationSteps[0].text;

  stepStartPosition.copy(camera.position);
}

function createArrow() {

  if (arrowMesh) scene.remove(arrowMesh);

  const shape = new THREE.Shape();
  shape.moveTo(0, 0.4);
  shape.lineTo(-0.2, 0);
  shape.lineTo(-0.08, 0);
  shape.lineTo(-0.08, -0.4);
  shape.lineTo(0.08, -0.4);
  shape.lineTo(0.08, 0);
  shape.lineTo(0.2, 0);
  shape.lineTo(0, 0.4);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({ color:0x00ff00 });

  arrowMesh = new THREE.Mesh(geometry, material);

  arrowMesh.position.set(0, -0.3, -1.5);
  arrowMesh.rotation.x = -Math.PI / 2;

  scene.add(arrowMesh);
}

function update() {

  if (currentStepIndex >= navigationSteps.length) {
    subtitle.innerText = "You have reached your destination";
    return;
  }

  const step = navigationSteps[currentStepIndex];

  const distanceMoved = camera.position.distanceTo(stepStartPosition);

  if (distanceMoved >= step.distance) {

    currentStepIndex++;

    if (currentStepIndex < navigationSteps.length) {

      subtitle.innerText = navigationSteps[currentStepIndex].text;

      rotateArrow(navigationSteps[currentStepIndex].type);

      stepStartPosition.copy(camera.position);
    }
  }

  renderer.render(scene, camera);
}

function rotateArrow(type) {

  if (type === "left") {
    arrowMesh.rotation.z += Math.PI / 2;
  }

  if (type === "right") {
    arrowMesh.rotation.z -= Math.PI / 2;
  }
}
