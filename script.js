import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let camera, scene, renderer;
let pathGroup;
let subtitle = document.getElementById("subtitle");

document.getElementById("startAR").addEventListener("click", async () => {

  const source = document.getElementById("source").value;
  const destination = document.getElementById("destination").value;

  if (source === destination) {
    alert("Source and Destination cannot be same.");
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

  createStablePath(source, destination);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function createStablePath(source, destination) {

  pathGroup = new THREE.Group();

  // FIXED WORLD POSITION (NOT CAMERA ATTACHED)
  pathGroup.position.set(0, 0, -2);

  scene.add(pathGroup);

  const routes = {
    "SR-CAN": [
      { type:"straight", text:"Walk straight 5 meters", dist:5 },
      { type:"right", text:"Turn right", dist:3 },
      { type:"straight", text:"Walk straight 4 meters to Canteen", dist:4 }
    ],
    "AK-JC": [
      { type:"straight", text:"Walk straight 4 meters", dist:4 },
      { type:"left", text:"Turn left", dist:4 },
      { type:"straight", text:"You reached JC Block", dist:3 }
    ]
  };

  const key = source + "-" + destination;
  const route = routes[key] || [
    { type:"straight", text:"Walk straight", dist:5 }
  ];

  let direction = new THREE.Vector3(0,0,-1);
  let currentPos = new THREE.Vector3(0,0,0);

  route.forEach((step, index) => {

    subtitle.innerText = route[0].text;

    if (step.type === "left") {
      direction.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
    }

    if (step.type === "right") {
      direction.applyAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2);
    }

    for (let i = 0; i < step.dist; i++) {

      const geo = new THREE.ConeGeometry(0.2, 0.5, 20);
      const mat = new THREE.MeshStandardMaterial({ color:0x00ff00 });
      const arrow = new THREE.Mesh(geo, mat);

      arrow.rotation.x = Math.PI/2;

      arrow.position.copy(currentPos);
      arrow.position.add(direction.clone().multiplyScalar(i+1));

      pathGroup.add(arrow);
    }

    currentPos.add(direction.clone().multiplyScalar(step.dist));
  });

  // BIG FINAL ARROW
  const finalGeo = new THREE.ConeGeometry(0.4, 1, 20);
  const finalMat = new THREE.MeshStandardMaterial({ color:0xff0000 });
  const finalArrow = new THREE.Mesh(finalGeo, finalMat);

  finalArrow.rotation.x = Math.PI/2;
  finalArrow.position.copy(currentPos);

  pathGroup.add(finalArrow);
}
