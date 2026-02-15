import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// CAMERA
let camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

camera.position.set(40, 40, 40);
camera.lookAt(0, 0, 0);

// RENDERER
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTS
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 50, 50);
scene.add(dirLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// -------- GROUND --------
const groundGeometry = new THREE.PlaneGeometry(80, 80);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// -------- BUILDING FUNCTION --------
function createBuilding(name, x, z, color) {

  const geometry = new THREE.BoxGeometry(5, 10, 5);
  const material = new THREE.MeshStandardMaterial({ color: color });

  const building = new THREE.Mesh(geometry, material);
  building.position.set(x, 5, z);
  scene.add(building);

  createLabel(name, x, 12, z);
}

// -------- LABEL FUNCTION --------
function createLabel(text, x, y, z) {

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = "white";
  context.font = "bold 50px Arial";
  context.textAlign = "center";
  context.fillText(text, 256, 140);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);

  sprite.scale.set(12, 6, 1);
  sprite.position.set(x, y, z);

  scene.add(sprite);
}

// -------- CREATE CAMPUS LAYOUT (Closer + Compact) --------
createBuilding("SR Block", -15, -15, 0xff0000);
createBuilding("AK Block", 0, -15, 0x0000ff);
createBuilding("JC Block", 15, -15, 0xffff00);

createBuilding("MT Block", -15, 10, 0xff00ff);
createBuilding("Canteen", 15, 10, 0x00ffff);

// -------- SIMPLE AUTO ROTATE CAMERA --------
function animate() {
  requestAnimationFrame(animate);

  // Slowly rotate camera around campus
  camera.position.x = 40 * Math.cos(Date.now() * 0.0005);
  camera.position.z = 40 * Math.sin(Date.now() * 0.0005);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

animate();
