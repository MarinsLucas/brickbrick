import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        initCamera, 
        initDefaultSpotlight,
        createGroundPlaneXZ,
        SecondaryBox, 
        onWindowResize} from "../libs/util/util.js";

let scene, renderer, light,  keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
light = initDefaultSpotlight(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light    

keyboard = new KeyboardState();


// Create objects
createTeapot( 0, 0,  0.0, Math.random() * 0xffffff);




// Main camera
const camera = initializeCamera(); //talvez alterar esses valores?
scene.background = new THREE.Color(0xff0000 );
window.addEventListener( 'resize', function(){onWindowResizeOrthographic(camera, renderer)}, false );
scene.add(camera);


function initializeCamera()
{
   let camera = new THREE.OrthographicCamera(-1, 1, 2, -2, 0.001, 10000);
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

function createTeapot(x, y, z, color )
{
   var geometry = new TeapotGeometry(0.5);
   var material = new THREE.MeshPhongMaterial({color, shininess:"200"});
      material.side = THREE.DoubleSide;
   var obj = new THREE.Mesh(geometry, material);
      obj.castShadow = true;
      obj.position.set(x, y, z);
   scene.add(obj);
}

function render()
{
   requestAnimationFrame(render);
   keyboardUpdate();
   renderer.render(scene, camera) // Render scene
}