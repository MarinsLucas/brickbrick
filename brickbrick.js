import * as THREE from "three";
import { MathUtils } from "three";
import { PointerLockControls } from "../build/jsm/controls/PointerLockControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  SecondaryBox,
  initDefaultBasicLight,
  initRenderer,
  setDefaultMaterial,
} from "../libs/util/util.js";

let gameStatus = 0; //0 = jogo não começou; 1 = jogo rolando ; 2 = jogo pausado ; 3 = perdeu
let level = 1;
let rows = 0;

let scene, renderer, light, keyboard;
scene = new THREE.Scene(); // Create main scene
renderer = initRenderer(); // View function in util/utils
light = new THREE.DirectionalLight(0xffffff, 0.6);
light.castShadow = true; //?Não sei oq isso faz, fiquei com preguiça de ler
light.position.set( 2,5,10);
  
// Shadow settings
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 1;
light.shadow.camera.far = 20;
light.shadow.camera.left = -5;
light.shadow.camera.right = 5;
light.shadow.camera.top = 5;
light.shadow.camera.bottom = -5;
light.shadowDarkness = 0.5;
scene.add(light);

scene.add(light.target);
light.target.position.set(0,-5,0);

let light2 = new THREE.DirectionalLight(0xffffff, 0.4)
light2.castShadow = false;
light2.position.set(0,0,10);
scene.add(light2);
scene.add(light2.target);
light2.target.position.set(0,0,0);


keyboard = new KeyboardState();
var ballVelocity = new THREE.Vector3(
  0.03 * Math.cos(70),
  0.03 * Math.sin(70),
  0
);
let dh = 0.21; //delta de
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
scene.add(camera);


scene.add(new THREE.CameraHelper(camera)) 

//Criar plano de fundo (para as sombras baterem)
const geometry = new THREE.PlaneGeometry( 10, 10 );
const material2 = new THREE.MeshLambertMaterial( {color: "darkslateblue", side: THREE.DoubleSide} );
const plane = new THREE.Mesh( geometry, material2 );
plane.position.set(0,0,-0.05)
plane.receiveShadow = true; 
scene.add(plane);


const playerControls = new PointerLockControls(auxCamera, renderer.domElement);

let collidableMeshList = [];
let brickHolder = new THREE.Object3D();
brickHolder.position.set(-1.05, 2.2, 0);
scene.add(brickHolder);

createBorders();

var brickMatrix = initializeMatrix();
let pad = createPad();
let padCollision = createPadCollision();
let ball = createBall();

// Boolean flag to track whether the pointer is locked
let isPointerLocked = false;

scene.add(camera);

document.addEventListener("click", function (event) {
  // Check if it's a left mouse click (button 0)
  if (event.button === 0) {
    // Handle the left mouse click here
    console.log("Left mouse click detected!");
    if ((gameStatus == 3 || gameStatus == 0) && isPointerLocked) {
      gameStatus = 1;
    }
    // You can perform your desired actions here
  }
});
// Listen for spacebar key press
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (gameStatus != 3 && gameStatus != 4) {
      if (isPointerLocked) {
        gameStatus = 2;
      } else if (gameStatus != 0) {
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
  ball.position.set(0.12, -2, 0);
  pad.position.set(0, -2.1, 0);
  ballVelocity.x = 0.03 * Math.cos(70);
  ballVelocity.y = 0.03 * Math.sin(70);

  gameStatus = 3;
  resetBricks();
}

function resetBricks() {
  // Clear the current brick matrix
  for (let i = 0; i < brickMatrix.length; i++) {
    for (let j = 0; j < brickMatrix[i].length; j++) {
      const brick = brickMatrix[i][j];
      const obj = brick.obj;
      //obj.position.set(1000, 1000, 1000); // Move the brick out of the scene
      removeBrick(obj.name);
    }
  }
  brickMatrix = initializeMatrix();
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

function readMatrix(matrixString) {
  const rows = matrixString.trim().split("\n");
  const matrix = [];

  for (const row of rows) {
    const columns = row.split(",");

    for (const column of columns) {
      const brickValue = parseInt(column.trim());
      if (!isNaN(brickValue)) {
        matrix.push(brickValue);
      }
    }
  }

  return matrix;
}

function onMouseMoveLocked(event) {
  if (gameStatus != 1) return;
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
  var material = new THREE.MeshPhongMaterial({ color: 0xffffff });
  material.side = THREE.DoubleSide;
  material.specular = 0xffffff;
  material.shininess = 10;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(0.12, -2, 0);
  obj.castShadow = true; 
  scene.add(obj);
  return obj;
}

function createPad() {
  let geometry = new THREE.BoxGeometry(0.6, 0.1, 0.1);
  let material = new THREE.MeshLambertMaterial( {color: "rgb(255,255,255)", side: THREE.DoubleSide} );
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.position.set(0, -2.1, 0);
  obj.castShadow = true; 
  scene.add(obj);
  return obj;
}

function createPadCollision() {
  let padCollisionArray = [];
  for (let index = 0; index < 5; index++) {
    let geometry = new THREE.BoxGeometry(0.13, 0.1, 0.1);

    //esse material não aparece, é apenas para fins de depuração! xD
    var material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      transparent: true,
      opacity: 0,
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

function chooseLevel(level) {
  var matrixString = "";

  if (level == 1) {
    matrixString = `
  6,1,2,3,4,5,6,1,2,3,4
  5,6,1,2,3,4,5,6,1,2,3
  4,5,6,1,2,3,4,5,6,1,2
  3,4,5,6,1,2,3,4,5,6,1
  2,3,4,5,6,1,2,3,4,5,6
  1,2,3,4,5,6,1,2,3,4,5
  `;
  }

  return matrixString;
}

function initializeMatrix() {
  const matrixString = chooseLevel(level);

  rows = matrixString.trim().split("\n").length;
  let cols = matrixString.trim().split("\n")[0].split(",").length;

  console.log(cols);

  const brickMatrix = new Array(cols)
    .fill(null)
    .map(() => new Array(rows).fill(null));

  let resistances = readMatrix(matrixString);
  let resistance = 1;
  let a = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      resistance = resistances[a];
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
  //let camera = new THREE.OrthographicCamera(-1, 1, 2, -2, 0.01, 10); //alterar valores?
  let w = window.innerHeight / 2;
  let h = window.innerHeight;
  let camera = new THREE.PerspectiveCamera(60, w/h, 0.01, 10); //fov, aspect, near, far
  let aspect = 0.5;
  let f = 5;
  camera.position.set(0,0,4.3);
  camera.lookAt(new THREE.Vector3(0,0,0));
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect;
  }
  if (camera instanceof THREE.OrthographicCamera) {
    camera.left = (-f * aspect) / 2;
    camera.right = (f * aspect) / 2;
    camera.top = f / 2;
    camera.bottom = -f / 2;
  }
  //camera.updateProjectionMatrix(); //?Isso faz o que? 
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

function removeBrick(brickName) {
  const brickIndex = collidableMeshList.findIndex(
    (brick) => brick.name === brickName
  );

  if (brickIndex !== -1) {
    const removedBrick = collidableMeshList.splice(brickIndex, 1)[0];
    brickHolder.remove(removedBrick);
  }
}

function updateBrick(brick) {
  var obj = brick.obj;

  switch (brick.resistance) {
    case 0:
      //obj.position.set(1000, 1000, 1000);
      removeBrick(obj.name);
      if (brickHolder.children.length == 0) gameStatus = 4;
      break;
    case 1:
      brick.color = "red";
      break;
    case 2:
      brick.color = "blue";
      break;
    case 3:
      brick.color = "orange";
      break;
    case 4:
      brick.color = "pink";
      break;
    case 5:
      brick.color = "lightgreen";
      break;
    case 6:
      brick.color = "lightgrey";
      break;
  }

  if (brick.resistance != 0) {
    obj.material.color.setColorName(brick.color);
  }
}

function createBrick(x, y, resistance, brickHolder) {
  var obj, color;
  var geometry = new THREE.BoxGeometry(0.2, 0.1, 0.1);

  switch (resistance) {
    case 1:
      color = "red";
      break;
    case 2:
      color = "blue";
      break;
    case 3:
      color = "orange";
      break;
    case 4:
      color = "pink";
      break;
    case 5:
      color = "lightgreen";
      break;
    case 6:
      color = "lightgrey";
      break;
  }
  var material = new THREE.MeshLambertMaterial( {color: color, side: THREE.DoubleSide} );
  material.side = THREE.DoubleSide;
  var obj = new THREE.Mesh(geometry, material);
  obj.castShadow = true;
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
        ballVelocity.x *= -1;
        console.log("2");
        break;

      case 3:
        angle = MathUtils.degToRad(-70);
        console.log("3");
        break;

      case 4:
        angle = MathUtils.degToRad(-60);
        console.log("4");
        break;
    }

    newReflect(
      ballVelocity,
      new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0).normalize()
    );

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

    if (ballVelocity.y < 0) ballVelocity.y *= -1;
  }
  if (tbintersects.length > 0 && tbintersects[0].distance <= 0.05) {
    ballVelocity.y *= -1;
    console.log(tbintersects[0]["object"]);
    if (tbintersects[0]["object"].parent == brickHolder) {
      var id = tbintersects[0]["object"].name.parseInt;
      for (let i = 0; i < 7; i++) {
        for (let j = rows - 1; j >= 0; j--) {
          if (brickMatrix[i][j].obj == tbintersects[0]["object"]) {
            if (brickMatrix[i][j].resistance == 6)
              brickMatrix[i][j].resistance = 1;
            else brickMatrix[i][j].resistance = 0;
            updateBrick(brickMatrix[i][j]);
            return;
          }
        }
      }
    } else if (tbintersects[0]["object"].name == "down") {
      gameStatus = 3;
      ball.position.set(0.12, -2, 0);
      pad.position.set(0, -2.1, 0);
      ballVelocity.x = 0.03 * Math.cos(70);
      ballVelocity.y = 0.03 * Math.sin(70);
    }
  }

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
            if (brickMatrix[i][j].resistance == 6)
              brickMatrix[i][j].resistance = 1;
            else brickMatrix[i][j].resistance = 0;
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
        console.log("2");
        break;

      case 3:
        angle = MathUtils.degToRad(-70);
        console.log("3");
        break;

      case 4:
        angle = MathUtils.degToRad(-60);
        console.log("4");
        break;
    }

    newReflect(
      ballVelocity,
      new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0).normalize()
    );
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
    message.changeMessage("Press Space and then Left Click to start");
  }

  if (gameStatus == 1) {
    message.changeMessage("Press Space to pause");
  }

  if (gameStatus == 2) {
    message.changeMessage("Press Space to unpause");
  }

  if (gameStatus == 3) {
    message.changeMessage("Left click to continue!");
  }

  if (gameStatus == 4) {
    message.changeMessage("You've won!!! Press R to restart!");
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
  let upBorder = new THREE.BoxGeometry(3, 0.1, 0.2);
  let borderMaterial = new THREE.MeshLambertMaterial( {color: "darkslateblue", side: THREE.DoubleSide} );
  borderMaterial.side = THREE.DoubleSide;
  let upb = new THREE.Mesh(upBorder, borderMaterial);
  upb.castShadow = true;  upb.position.set(0.0, 2.5, 0.0);
  upb.name = "up";
  scene.add(upb);
  collidableMeshList.push(upb);

  let leftBorder = new THREE.BoxGeometry(0.1, 10, 0.2);
  let lb = new THREE.Mesh(leftBorder, borderMaterial);
  lb.castShadow = true;
  lb.position.set(-1.25, 0.0, 0.0);
  lb.name = "left";
  scene.add(lb);
  collidableMeshList.push(lb);

  let rightBorder = new THREE.BoxGeometry(0.1, 10, 0.2);
  let rb = new THREE.Mesh(rightBorder, borderMaterial);
  rb.castShadow 
  rb.position.set(1.25, 0.0, 0.0);
  rb.name = "right";
  scene.add(rb);
  collidableMeshList.push(rb);

  let downBorder = new THREE.BoxGeometry(3, 0.1, 0.2);
  let db = new THREE.Mesh(downBorder, borderMaterial);
  db.position.set(0.0, -2.55, 0.0);
  db.name = "down";
  scene.add(db);
  collidableMeshList.push(db);
}
