import * as THREE from "three";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  initDefaultSpotlight,
  initRenderer,
  setDefaultMaterial,
} from "../libs/util/util.js";

/* 
TODO: Fazer a plataforma parar quando encostar na parede
      Fazer a bola bater na plataforma
      Fazer a bola bater nas paredes
      Fazer a bola bater nos tijolos
*/


let gameStatus = 0; //0 = jogo não começou; 1 = jogo rolando ; 2 = jogo pausado

let scene, renderer, light, keyboard;
scene = new THREE.Scene(); // Create main scene
renderer = initRenderer(); // View function in util/utils
light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light
keyboard = new KeyboardState();

// Main camera
const camera = initializeCamera();
scene.background = new THREE.Color(0x00008b);
window.addEventListener(
  "resize",
  function () {
    onWindowResizeOrthographic(camera, renderer);
  },
  false
);
window.addEventListener("mousemove", onMouseMove);
scene.add(camera);

let collidableMeshList = [];
let brickHolder = new THREE.Object3D();
brickHolder.position.set(-1, 2.2, 0);
scene.add(brickHolder);

//create borders:
createBorders();

initializeMatrix(11);
let pad = createPad();
let padCollision = createPadCollision();
let ball = createBall();

let raycaster = new THREE.Raycaster();
raycaster.layers.enable(1);
camera.layers.enable(1);
ball.layers.enable(1);
//lista de objetos colidíveis.

let objects = [];
//Essa hitbox é o espaço onde o pad pode se movimentar!
let hitbox = createHitbox();
objects.push(hitbox);

render();

/* ------------------ FUNCTIONS ------------------ */

function Brick(obj, resistance, isColliding) {
  this.obj = obj;
  this.resistance = resistance;
  this.color = "lightgreen";
  this.isColliding = false;
}

function onMouseMove(event) {
  const canvasBounds = renderer.domElement.getBoundingClientRect();

  if (gameStatus == 0 || gameStatus == 1) {
    let pointer = new THREE.Vector2();
    pointer.x =
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    pointer.y =
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    // calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      let point = intersects[0].point;
      pad.position.set(point.x, -2.1, 0);
    }
  }
}

function createHitbox() {
  var geometry = new THREE.BoxGeometry(2, 10, 1);
  var material = new THREE.MeshStandardMaterial({
    color: 0x00ff00, // Green color for the box
    transparent: true, // Enable transparency
    opacity: 0, // Set the opacity level (0: fully transparent, 1: fully opaque)
  });
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(0, 0, 0);
  scene.add(obj);
  return obj;
}

function createBall() {
  var geometry = new THREE.SphereGeometry(0.05, 64, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(0, 0.1, 0);
  scene.add(obj);
  return obj;
}

function createPad() {
  let geometry = new THREE.BoxGeometry(0.6, 0.1, 0.1);
  let material = setDefaultMaterial("red");
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(0, -2.1, 0);
  scene.add(obj);
  return obj;
}

function createPadCollision() {
  let padCollisionArray = [];
  for (let index = 0; index < 5; index++) {
    let geometry = new THREE.BoxGeometry(0.12, 0.1, 0.1);
    var material = new THREE.MeshStandardMaterial({
      // make it be a random color for each index
      color: Math.random() * 0xffffff,
      transparent: true, // Enable transparency
      opacity: 1, // Set the opacity level (0: fully transparent, 1: fully opaque)
    });
    material.side = THREE.DoubleSide;
    var obj = new THREE.Mesh(geometry, material);
    obj.position.set(-0.24 + index * 0.12, 0, 0);
    pad.add(obj);
    padCollisionArray.push(obj);
  }
  return padCollisionArray;
}

function initializeMatrix(row) {
  // Initialize a 2D matrix with null values
  const brickMatrix = new Array(7)
    .fill(null)
    .map(() => new Array(row).fill(null));

  let resistance = 1;

  let dh = 0.33;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < row; j++) {
      if (j == 0) {
        resistance = 2;
      } else {
        resistance = 1;
      }

      brickMatrix[i][j] = createBrick(
        i * dh,
        -j * (dh / 2),
        resistance,
        brickHolder
      );
    }
  }
}

function initializeCamera() {
  let camera = new THREE.OrthographicCamera(-1, 1, 2, -2, 0.01, 10); //alterar valores?
  let w = window.innerHeight / 2;
  let h = window.innerHeight;
  let aspect = 0.5;
  let f = 5;
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
  }
  if (camera instanceof THREE.OrthographicCamera) {
    camera.left = (-f * aspect) / 2;
    camera.right = (f * aspect) / 2;
    camera.top = f / 2;
    camera.bottom = -f / 2;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  return camera;
}

function onWindowResizeOrthographic(camera, renderer, frustumSize = 5) {
  let w = window.innerHeight / 2;
  let h = window.innerHeight;
  let aspect = 0.5;
  let f = frustumSize;
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
  }
  if (camera instanceof THREE.OrthographicCamera) {
    camera.left = (-f * aspect) / 2;
    camera.right = (f * aspect) / 2;
    camera.top = f / 2;
    camera.bottom = -f / 2;
  }
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function createBrick(x, y, resistance, brickHolder) {
  var obj, color;
  var geometry = new THREE.BoxGeometry(0.3, 0.1, 1);

  switch (resistance) {
    case 1:
      color = "lightgreen";
      break;
    case 2:
      color = "yellow";
      break;
    case 3:
      color = "red";
      break;
    case 4:
      color = "white";
      break;
  }

  var material = setDefaultMaterial(color);
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(x, y, 0);
  brickHolder.add(obj);
  collidableMeshList.push(obj);
  const brick = new Brick(obj, resistance);
  return brick;
}

function updateBall() {
  ball.translateX(0.01);
  ball.translateY(0.01);

  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3(0.01, 0.01, 0);

  raycaster.ray.origin.copy(ball.position);
  raycaster.ray.direction.copy(direction);

  const intersects = raycaster.intersectObjects(collidableMeshList);

  if (intersects.length > 0 && intersects[0].distance <= 0.05) {
    const collidedBrick = intersects[0].object;
    console.log("Bateu");
  }
}

function render() {
  updateBall();
  requestAnimationFrame(render);
  renderer.render(scene, camera); // Render scene
}

function createBorders() {
  let upBorder = new THREE.BoxGeometry(3, 0.1, 0.1);
  let borderMaterial = setDefaultMaterial();
  borderMaterial.side = THREE.DoubleSide;
  let upb = new THREE.Mesh(upBorder, borderMaterial);
  upb.position.set(0.0, 2.5, 0.0);
  scene.add(upb);
  collidableMeshList.push(upb);

  let leftBorder = new THREE.BoxGeometry(0.1, 10, 0.1);
  let lb = new THREE.Mesh(leftBorder, borderMaterial);
  lb.position.set(-1.25, 0.0, 0.0);
  scene.add(lb);
  collidableMeshList.push(lb);

  let rightBorder = new THREE.BoxGeometry(0.1, 10, 0.1);
  let rb = new THREE.Mesh(rightBorder, borderMaterial);
  rb.position.set(1.25, 0.0, 0.0);
  scene.add(rb);
  collidableMeshList.push(rb);

  let downBorder = new THREE.BoxGeometry(3, 0.1, 0.1);
  let db = new THREE.Mesh(downBorder, borderMaterial);
  db.position.set(0.0, -2.55, 0.0);
  scene.add(db);
  collidableMeshList.push(db);
}
