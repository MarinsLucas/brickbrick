import * as THREE from "three";
import { MathUtils } from "three";
import { PointerLockControls } from "../build/jsm/controls/PointerLockControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  SecondaryBox,
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

let gameStatus = 0; //0 = jogo não começou; 1 = jogo rolando ; 2 = jogo pausado ; 3 = perdeu

let scene, renderer, light, keyboard;
scene = new THREE.Scene(); // Create main scene
renderer = initRenderer(); // View function in util/utils
light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light
keyboard = new KeyboardState();
var ballVelocity = new THREE.Vector3(0.0, 0.03, 0);
let dh = 0.33; //delta de

const clock = new THREE.Clock();
var tempoDecorrido = 0;
// Main camera
const camera = initializeCamera();
const auxCamera = initializeCamera();
scene.background = new THREE.Color(0x00008b);
window.addEventListener(
  "resize",
  function () {
    onWindowResizeOrthographic(camera, renderer);
  },
  false
);
//window.addEventListener("mousemove", onMouseMove);
scene.add(camera);

const playerControls = new PointerLockControls(auxCamera, renderer.domElement);

// Enable pointer lock when a user clicks on the canvas

let collidableMeshList = [];
let brickHolder = new THREE.Object3D();
brickHolder.position.set(-1, 2.2, 0);
scene.add(brickHolder);

//create borders:
createBorders();

var rows = 20;
var brickMatrix = initializeMatrix(rows);
let pad = createPad();
let padCollision = createPadCollision();
let ball = createBall();

// Boolean flag to track whether the pointer is locked
let isPointerLocked = false;

scene.add(camera);

// Listen for spacebar key press
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (gameStatus != 3) {
      if (isPointerLocked) {
        gameStatus = 2;
      } else {
        gameStatus = 1;
      }
    }
    togglePointerLock();
  }

  if (event.code == "KeyR") {
    if (gameStatus != 0) reset();
  }

  if (event.code == "Enter") {
    var element = document.querySelector("#webgl-output");
    element.requestFullscreen();
  }
});

// Handle the pointer lock change event to update isPointerLocked flag
playerControls.addEventListener("lock", () => {
  isPointerLocked = true;
});

playerControls.addEventListener("unlock", () => {
  isPointerLocked = false;
});
var message = new SecondaryBox("");

render();

/* ------------------ FUNCTIONS ------------------ */

function reset() {
  gameStatus = 1;
  ball.position.set(0, -2, 0);
  pad.position.set(0, -2.1, 0);
  resetBricks();
}

function resetBricks() {
  // Clear the current brick matrix
  for (let i = 0; i < brickMatrix.length; i++) {
    for (let j = 0; j < brickMatrix[i].length; j++) {
      const brick = brickMatrix[i][j];
      const obj = brick.obj;
      obj.position.set(1000, 1000, 1000); // Move the brick out of the scene
    }
  }

  // Recreate the brick matrix with initial resistance values and positions
  let resistance = 1;
  let id = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < rows; j++) {
      if (j == 0) {
        resistance = 2;
      } else {
        resistance = 3;
      }

      const brick = createBrick(i * dh, -j * (dh / 2), resistance, brickHolder);
      brick.obj.name = id;
      brick.id = id;
      id++;
      brickMatrix[i][j] = brick;
    }
  }
}

function Brick(obj, resistance) {
  this.obj = obj;
  this.resistance = resistance;
  this.color = "lightgreen";
  this.id = 0;
}

// Function to toggle pointer lock status
function togglePointerLock() {
  if (!isPointerLocked) {
    playerControls.lock();
    isPointerLocked = true;

    // Add the mousemove event listener for locked pointer
    document.addEventListener("mousemove", onMouseMoveLocked, false);
  } else {
    playerControls.unlock();
    isPointerLocked = false;

    // Remove the mousemove event listener when the pointer is unlocked
    document.removeEventListener("mousemove", onMouseMoveLocked, false);
  }
}

function onMouseMoveLocked(event) {
  // Calculate the horizontal movement based on mouse position
  const movementX =
    event.movementX || event.mozMovementX || event.webkitMovementX || 0;

  // Define the horizontal movement speed
  const horizontalSpeed = 0.01; // Adjust this value as needed

  // Calculate the new x-coordinate for the platform
  const newPlatformX = pad.position.x + movementX * horizontalSpeed;

  // Define the boundaries of the restricted area
  const minX = -0.9; // Minimum x-coordinate within the area
  const maxX = 0.9; // Maximum x-coordinate within the area

  // Clamp the new x-coordinate within the specified boundaries
  const clampedX = Math.min(Math.max(newPlatformX, minX), maxX);

  // Update the platform's position
  pad.position.setX(clampedX);
}

function createBall() {
  var geometry = new THREE.SphereGeometry(0.05, 64, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(0, -2, 0);
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
    let geometry = new THREE.BoxGeometry(0.13, 0.1, 0.1);
    var material = new THREE.MeshStandardMaterial({
      // make it be a random color for each index
      color: Math.random() * 0xffffff,
      transparent: true, // Enable transparency
      opacity: 1, // Set the opacity level (0: fully transparent, 1: fully opaque)
    });
    material.side = THREE.DoubleSide;
    var obj = new THREE.Mesh(geometry, material);
    obj.position.set(-0.24 + index * 0.12, 0, 0);
    obj.name = index;
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
  let a = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < row; j++) {
      if (j == 0) {
        resistance = 2;
      } else {
        resistance = 3;
      }

      brickMatrix[i][j] = createBrick(
        i * dh,
        -j * (dh / 2),
        resistance,
        brickHolder
      );

      brickMatrix[i][j].obj.name = a;
      brickMatrix[i][j].id = a;
      a++;
    }
  }

  return brickMatrix;
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

function updateBrick(brick) {
  var obj = brick.obj;

  switch (brick.resistance) {
    case 0:
      obj.position.set(1000, 1000, 1000);
    case 1:
      brick.color = "lightgreen";
      break;
    case 2:
      brick.color = "yellow";
      break;
    case 3:
      brick.color = "orange";
      break;
    case 4:
      brick.color = "red";
      break;
  }

  if (brick.resistance != 0) {
    obj.material.color.setColorName(brick.color);
  }
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
      color = "orange";
      break;
    case 4:
      color = "red";
      break;
  }

  var material = setDefaultMaterial(color);
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.name = "brick";
  obj.position.set(x, y, 0);
  brickHolder.add(obj);
  collidableMeshList.push(obj);
  const brick = new Brick(obj, resistance);
  return brick;
}

function updateBall(ballVelocity) {
  if (gameStatus != 1) return;

  //console.log(tempoDecorrido)
  tempoDecorrido = clock.getElapsedTime();
  ball.translateX(ballVelocity.x);
  ball.translateY(ballVelocity.y);

  const tbraycaster = new THREE.Raycaster();
  const tbdirection = new THREE.Vector3(0, ballVelocity.y, 0);

  tbraycaster.ray.origin.copy(ball.position);
  tbraycaster.ray.direction.copy(tbdirection);

  const tbintersects = tbraycaster.intersectObjects(collidableMeshList);
  const padintersects = tbraycaster.intersectObjects(padCollision);

  if (
    padintersects.length > 0 &&
    padintersects[0].distance <= 0.07 &&
    tempoDecorrido > 0.1
  ) {
    ballVelocity.y *= -1;
    tempoDecorrido = 0;
    clock.stop();
    clock.start();

    //console.log(padintersects[0]["object"].name.typeof);
    let angle;

    switch (padintersects[0]["object"].name) {
      case 0:
        angle = MathUtils.degToRad(60);
        break;

      case 1:
        console.log("1");
        angle = MathUtils.degToRad(70);

        break;
      case 2:
        angle = MathUtils.degToRad(90);
        //var theta = Math.PI - 2*(ang - MathUtils.degToRad(100));
        /* var theta = -2*ang + Math.PI - MathUtils.degToRad(90);
        ballVelocity.x = ballVelocity.x*(Math.cos(theta-ang)) */
        console.log("2");
        break;

      case 3:
        angle = MathUtils.degToRad(-70);
        //var theta = Math.PI - 2*(ang - MathUtils.degToRad(100));
        /*         var theta = -2*ang + Math.PI - MathUtils.degToRad(60);
        ballVelocity.x = ballVelocity.x*(Math.cos(theta-ang)) */
        console.log("3");
        break;

      case 4:
        angle = MathUtils.degToRad(-60);
        //var theta = Math.PI - 2*(ang - MathUtils.degToRad(100));
        /*         var theta = -2*ang + Math.PI - MathUtils.degToRad(30);
        ballVelocity.x = ballVelocity.x*(Math.cos(theta-ang)) */
        console.log("4");
        break;
    }

    newReflect(
      ballVelocity,
      new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0).normalize()
    );
    //ballVelocity.reflect(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).normalize());

    var ang = Math.atan(ballVelocity.y / ballVelocity.x);
    var min_angle = MathUtils.degToRad(30);
    if (Math.abs(ang) < min_angle) {
      ballVelocity.x =
        0.03 *
        Math.cos(min_angle) *
        (ballVelocity.x / Math.abs(ballVelocity.x));
      ballVelocity.y =
        0.03 *
        Math.sin(min_angle) *
        (ballVelocity.y / Math.abs(ballVelocity.y));
    }
  }
  if (tbintersects.length > 0 && tbintersects[0].distance <= 0.05) {
    ballVelocity.y *= -1;
    if (tbintersects[0]["object"].parent == brickHolder) {
      var id = tbintersects[0]["object"].name.parseInt;
      for (let i = 0; i < 7; i++) {
        for (let j = rows - 1; j >= 0; j--) {
          if (brickMatrix[i][j].obj == tbintersects[0]["object"]) {
            brickMatrix[i][j].resistance--;
            updateBrick(brickMatrix[i][j]);
            return;
          }
        }
      }
    } else if (tbintersects[0]["object"].name == "down") {
      gameStatus = 3;
    }
  }

  const lrraycaster = new THREE.Raycaster();
  const lrdirection = new THREE.Vector3(ballVelocity.x, 0, 0);

  tbraycaster.ray.origin.copy(ball.position);
  tbraycaster.ray.direction.copy(lrdirection);

  const rlintersects = tbraycaster.intersectObjects(collidableMeshList);
  const rlpadintersects = tbraycaster.intersectObjects(padCollision);

  if (rlintersects.length > 0 && rlintersects[0].distance <= 0.05) {
    ballVelocity.x *= -1;

    if (rlintersects[0]["object"].parent == brickHolder) {
      var id = rlintersects[0]["object"].name.parseInt;
      for (let i = 0; i < 7; i++) {
        for (let j = rows - 1; j >= 0; j--) {
          if (brickMatrix[i][j].obj == rlintersects[0]["object"]) {
            brickMatrix[i][j].resistance--;
            updateBrick(brickMatrix[i][j]);
            return;
          }
        }
      }
    }
  }

  if (
    rlpadintersects.length > 0 &&
    rlpadintersects[0].distance <= 0.05 &&
    tempoDecorrido > 1
  ) {
    ballVelocity.y *= -1;
    tempoDecorrido = 0;
    clock.stop();
    clock.start();
    //console.log(padintersects[0]["object"].name.typeof);
    let angle;

    switch (rlpadintersects[0]["object"].name) {
      case 0:
        angle = MathUtils.degToRad(60);
        break;

      case 1:
        console.log("1");
        angle = MathUtils.degToRad(70);

        break;
      case 2:
        angle = MathUtils.degToRad(90);
        //var theta = Math.PI - 2*(ang - MathUtils.degToRad(100));
        /* var theta = -2*ang + Math.PI - MathUtils.degToRad(90);
        ballVelocity.x = ballVelocity.x*(Math.cos(theta-ang)) */
        console.log("2");
        break;

      case 3:
        angle = MathUtils.degToRad(-70);
        //var theta = Math.PI - 2*(ang - MathUtils.degToRad(100));
        /*         var theta = -2*ang + Math.PI - MathUtils.degToRad(60);
        ballVelocity.x = ballVelocity.x*(Math.cos(theta-ang)) */
        console.log("3");
        break;

      case 4:
        angle = MathUtils.degToRad(-60);
        //var theta = Math.PI - 2*(ang - MathUtils.degToRad(100));
        /*         var theta = -2*ang + Math.PI - MathUtils.degToRad(30);
        ballVelocity.x = ballVelocity.x*(Math.cos(theta-ang)) */
        console.log("4");
        break;
    }

    newReflect(
      ballVelocity,
      new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0).normalize()
    );
    //ballVelocity.reflect(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).normalize());
  }
}

function newReflect(v, normal) {
  var v1 = new THREE.Vector3();

  return v.sub(v1.copy(normal).multiplyScalar(2 * v.dot(normal)));
}
function render() {
  updateBall(ballVelocity);
  updateBallAngle();

  if (gameStatus == 0) {
    message.changeMessage("Press Space to start");
  }

  if (gameStatus == 1) {
    message.changeMessage("Press Space to pause");
  }

  if (gameStatus == 2) {
    message.changeMessage("Press Space to unpause");
  }

  if (gameStatus == 3) {
    message.changeMessage("You lost! Press R to restart");
  }

  requestAnimationFrame(render);
  renderer.render(scene, camera); // Render scene
}

function updateBallAngle() {
  var ang = Math.atan(ballVelocity.y / ballVelocity.x);
  ang = MathUtils.radToDeg(ang);
  message.changeMessage("Ball angle: " + ang);
}

function createBorders() {
  let upBorder = new THREE.BoxGeometry(3, 0.1, 0.1);
  let borderMaterial = setDefaultMaterial();
  borderMaterial.side = THREE.DoubleSide;
  let upb = new THREE.Mesh(upBorder, borderMaterial);
  upb.position.set(0.0, 2.5, 0.0);
  upb.name = "up";
  scene.add(upb);
  collidableMeshList.push(upb);

  let leftBorder = new THREE.BoxGeometry(0.1, 10, 0.1);
  let lb = new THREE.Mesh(leftBorder, borderMaterial);
  lb.position.set(-1.25, 0.0, 0.0);
  lb.name = "left";
  scene.add(lb);
  collidableMeshList.push(lb);

  let rightBorder = new THREE.BoxGeometry(0.1, 10, 0.1);
  let rb = new THREE.Mesh(rightBorder, borderMaterial);
  rb.position.set(1.25, 0.0, 0.0);
  rb.name = "right";
  scene.add(rb);
  collidableMeshList.push(rb);

  let downBorder = new THREE.BoxGeometry(3, 0.1, 0.1);
  let db = new THREE.Mesh(downBorder, borderMaterial);
  db.position.set(0.0, -2.55, 0.0);
  db.name = "down";
  scene.add(db);
  collidableMeshList.push(db);
}
