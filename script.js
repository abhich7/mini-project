import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let arrowMesh;
let subtitle = document.getElementById("subtitle");

let steps = [
  { type:"straight", text:"Walk straight 100 meters" },
  { type:"left", text:"Turn left and walk 50 meters" },
  { type:"right", text:"Turn right and walk 30 meters" },
  { type:"straight", text:"Destination is ahead" }
];

let currentStep = 0;

document.getElementById("startAR").addEventListener("click", async () => {

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
  renderer.xr.setSession(session);

  document.body.appendChild(renderer.domElement);

  showStep();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function showStep() {

  if (arrowMesh) scene.remove(arrowMesh);

  subtitle.innerText = steps[currentStep].text;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0.6);
  shape.lineTo(-0.3, 0);
  shape.lineTo(-0.15, 0);
  shape.lineTo(-0.15, -0.6);
  shape.lineTo(0.15, -0.6);
  shape.lineTo(0.15, 0);
  shape.lineTo(0.3, 0);
  shape.lineTo(0, 0.6);

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({ color:0x00ff00 });

  arrowMesh = new THREE.Mesh(geometry, material);

  arrowMesh.position.set(0, -0.2, -2);
  arrowMesh.rotation.x = -Math.PI/2;

  if (steps[currentStep].type === "left") {
    arrowMesh.rotation.z = Math.PI/2;
  }

  if (steps[currentStep].type === "right") {
    arrowMesh.rotation.z = -Math.PI/2;
  }

  scene.add(arrowMesh);

  // Auto change after 5 seconds
  setTimeout(() => {
    currentStep++;
    if (currentStep < steps.length) {
      showStep();
    } else {
      subtitle.innerText = "You reached your destination";
      scene.remove(arrowMesh);
    }
  }, 5000);
}
