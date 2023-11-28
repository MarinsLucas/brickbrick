import * as THREE from "three";
import { TextGeometry } from "../build/jsm/geometries/TextGeometry.js";
import { FontLoader } from "../build/jsm/loaders/FontLoader.js";
import {
  initCamera,
  initDefaultBasicLight,
  initRenderer,
  onWindowResize,
  setDefaultMaterial,
} from "../libs/util/util.js";

export function createStartScreen() {
  let scene, renderer, camera, material, light;

  scene = new THREE.Scene();
  renderer = initRenderer();
  camera = initCamera(new THREE.Vector3(0, 15, 30));
  material = setDefaultMaterial();
  light = initDefaultBasicLight(scene);

  window.addEventListener(
    "resize",
    function () {
      onWindowResize(camera, renderer);
    },
    false
  );

  let glow = 0.5;

  function createTextGeometry(character, position) {
    const loader = new FontLoader();
    loader.load(
      "../assets/fonts/helvetiker_bold.typeface.json",
      function (font) {
        const material = new THREE.MeshPhongMaterial({
          emissive: 0xffffff,
          emissiveIntensity: glow,
          color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        });

        const geometry = new TextGeometry(character, {
          font: font,
          size: 3,
          height: 0.1,
          curveSegments: 12,
        });

        const textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.copy(position);

        scene.add(textMesh);
        textMesh.castShadow = true;
        textMesh.receiveShadow = true;
      }
    );
  }

  function createTextFromString(text, position) {
    const characters = text.split("");
    characters.forEach((character, index) => {
      const offset = index * 1.75;
      createTextGeometry(
        character,
        new THREE.Vector3(position.x + offset, position.y, position.z)
      );
    });
  }

  createTextFromString("B R IC K", new THREE.Vector3(-7, 7, 0));
  createTextFromString("B R IC K", new THREE.Vector3(-7, 3, 0));

  function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  return {
    render: render,
    scene: scene,
    camera: camera
    // You can expose other functions or variables if needed
  };
}
