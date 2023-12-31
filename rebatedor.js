import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
      } from "../libs/util/util.js";
import {CSG} from "../libs/other/CSGMesh.js";
import { Color, MathUtils, ObjectLoader, TextureLoader } from '../build/three.module.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js'

let scene, renderer, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
 // Init camera in this position
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.copy(new THREE.Vector3(0, 1, 3));
camera.lookAt(new THREE.Vector3(0,0,0))
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.


// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );


// create a cube

//FUNÇÃO CREATE PAD DO JOGO:
let material = new THREE.MeshLambertMaterial({
  color: "lightblue",
  side: THREE.DoubleSide,
});let cubeGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.1);

let cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 0.05, 0.0);
cube.matrixAutoUpdate = false; 
cube.updateMatrix();

let cylindergeo = new THREE.CylinderGeometry(0.999,0.999,0.1,50,1);
let cylinder = new THREE.Mesh(cylindergeo, material);
cylinder.position.set(0,-0.85,0); 
cylinder.matrixAutoUpdate = false; 
cylinder.rotateX((MathUtils.degToRad(90))); 
cylinder.updateMatrix(); 
let cubaogeo = new THREE.BoxGeometry(2,2,1);
let cubao = new THREE.Mesh(cubaogeo, material);
cubao.position.set(0,-0.9,0)
cubao.matrixAutoUpdate = false;
cubao.updateMatrix(); 

let cubeCSG = CSG.fromMesh(cube);
let cylinderCSG = CSG.fromMesh(cylinder);
let cubaoCSG = CSG.fromMesh(cubao);
let cylinder_cubao = cylinderCSG.subtract(cubaoCSG);
let rebatedor_ = cubeCSG.union(cylinder_cubao);
let rebatedor = CSG.toMesh(rebatedor_, new THREE.Matrix4());
rebatedor.material = new THREE.MeshLambertMaterial({
  color: "lightblue",
  side: THREE.DoubleSide,
});
scene.add(rebatedor);

const loader = new OBJLoader();
loader.load(
  "./assets/nave/Files/OBJ/AirShip.obj", 
  function(object){
    var txtloader = new THREE.TextureLoader();
    var texture = txtloader.load("./assets/nave/Files/DAE/Aircraft_Texture.png");
    var material = new THREE.MeshLambertMaterial({map:texture});
    object.traverse(function(child)
    {
      if(child instanceof THREE.Mesh)
      {
        child.material = material;
      }
    });
    scene.add(object);
  },
  function(xhr){
    console.log("Progresso");
  },
  function(error)
  {
    console.log(error);
  }
);
//FIM DA FUNÇÃO CREATE PAD DO JOGO
//Alguns detalhes que  não implementamos nesse código e implementamos no código do jogo:
//Cast shadow, o nome do objeto (já que nesse código não seria necessário), posição inicial do objeto no jogo.
//Não adicionamos isso nesse código, para não poluir demais o código e facilitar a visualização do processo CSG. 


// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

render();


function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}