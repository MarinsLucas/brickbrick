import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        initCamera, 
        setDefaultMaterial,
        initDefaultSpotlight,
        createGroundPlaneXZ,
        SecondaryBox, 
        onWindowResize} from "../libs/util/util.js";
import { DoubleSide } from '../build/three.module.js';

function Brick(resistance){
   this.resistance = resistance;
   switch(resistance)
   {
      case 1:
         this.color = 'green'; 
         break; 
      case 2:
         this.color = 'yellow'; 
         break; 
      case 3:
         this.color = 'red';
         break; 
      case 4:
         this.color = 'white';
         break; 
   }
}


let scene, renderer, light,  keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light    
keyboard = new KeyboardState();
//create borders:
createBorders();

// Main camera
const camera = initializeCamera();
scene.background = new THREE.Color(0x00008B);
window.addEventListener( 'resize', function(){onWindowResizeOrthographic(camera, renderer)}, false );
scene.add(camera);

let brickHolder = new THREE.Object3D();
brickHolder.position.set(-1,2.2,0);
scene.add(brickHolder);

let brickMatrix;

let dh = 0.33;
for(let i =0; i<7; i++)
{
   for(let j=0; j<6; j++)
   {
      if(j == 0){
         
      }
      brickMatrix[i][j] = createBrick(i*dh, -j*(dh/2), brickProperties, brickHolder);
   }
}


function initializeCamera()
{
   let camera = new THREE.OrthographicCamera(-1, 1, 2, -2, 0.01, 10); //alterar valores?
   let w = window.innerHeight/2;
   let h = window.innerHeight;
   let aspect = 0.5;
   let f = 5;
   if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
   }  
   if (camera instanceof THREE.OrthographicCamera) {  
      camera.left = -f * aspect / 2;   
      camera.right = f * aspect / 2;
      camera.top = f / 2;
      camera.bottom = -f / 2;   
   }
   camera.updateProjectionMatrix();
   renderer.setSize(w, h);
   return camera;
}

export function onWindowResizeOrthographic(camera, renderer, frustumSize = 5) {
   let w = window.innerHeight/2;
   let h = window.innerHeight;
   let aspect = 0.5;
   let f = frustumSize;
   if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
   }
   if (camera instanceof THREE.OrthographicCamera) {  
      camera.left = -f * aspect / 2;   
      camera.right = f * aspect / 2;
      camera.top = f / 2;
      camera.bottom = -f / 2;   
   }
   camera.updateProjectionMatrix();
   renderer.setSize(w, h);
}

render();

function keyboardUpdate() {

   keyboard.update();
   
   // DICA: Insira aqui seu código para mover a câmera
   
}

function createBrick(x, y, color, brickHolder){
   var geometry = new THREE.BoxGeometry(0.3, 0.1, 1);
   var material = setDefaultMaterial(color);
   material.side = THREE.DoubleSide;
   var obj = new THREE.Mesh(geometry, material);
   obj.position.set(x, y, 0);
   brickHolder.add(obj);
   return obj;
}

function render()
{
   requestAnimationFrame(render);
   keyboardUpdate();
   renderer.render(scene, camera) // Render scene
}

function createBorders()
{
   let upBorder = new THREE.BoxGeometry(3 ,0.1, 0.1);
let borderMaterial = setDefaultMaterial();
borderMaterial.side = THREE.DoubleSide
let upb = new THREE.Mesh(upBorder, borderMaterial);
upb.position.set(0.0, 2.5, 0.0);
scene.add(upb);

let leftBorder = new THREE.BoxGeometry(0.1, 10, 0.1);
let lb = new THREE.Mesh(leftBorder, borderMaterial);
lb.position.set(-1.25, 0.0, 0.0)
scene.add(lb);

let rightBorder = new THREE.BoxGeometry(0.1, 10, 0.1);
let rb = new THREE.Mesh(rightBorder, borderMaterial);
rb.position.set(1.25, 0.0, 0.0);
scene.add(rb);

let downBorder = new THREE.BoxGeometry(3 ,0.1, 0.1);
let db = new THREE.Mesh(downBorder, borderMaterial);
db.position.set(0.0, -2.55, 0.0);
scene.add(db); 
}