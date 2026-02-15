import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(30, 30, 30);
camera.lookAt(0, 0, 0);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTS
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(20, 40, 20);
scene.add(directionalLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// -------- GROUND --------
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// -------- BUILDING FUNCTION --------
function createBuilding(name, x, z, color) {

  const geometry = new THREE.BoxGeometry(6, 8, 6);
  const material = new THREE.MeshStandardMaterial({ color: color });

  const building = new THREE.Mesh(geometry, material);
  building.position.set(x, 4, z);
  scene.add(building);

  createLabel(name, x, 10, z);
}

// -------- LABEL FUNCTION --------
function createLabel(text, x, y, z) {

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = "white";
  context.font = "bold 60px Arial";
  context.fillText(text, 80, 150);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.scale.set(10, 5, 1);
  sprite.position.set(x, y, z);

  scene.add(sprite);
}

// -------- CREATE CAMPUS --------
createBuilding("SR Block", 0, 0, 0xff0000);
createBuilding("AK Block", 15, 0, 0x0000ff);
createBuilding("JC Block", 15, 15, 0xffff00);
createBuilding("MT Block", 30, 15, 0xff00ff);
createBuilding("Canteen", 40, 30, 0x00ffff);

// -------- ANIMATION LOOP --------
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
