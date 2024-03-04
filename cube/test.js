import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

let loadedModels = {};
let hitTestSource = null;
let hitTestSourceRequested = false;
let overlayContent = document.getElementById("overlay-content");
let selectInput = document.getElementById("model-select");
let modelName = selectInput.value;

selectInput.addEventListener("change", (e) => {
  modelName = e.target.value;
});

let gltfLoader = new GLTFLoader();
let dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load("/models/chair.gltf", onLoad);
gltfLoader.load("/models/bookcase.gltf", onLoad);
gltfLoader.load("/models/bookcase1.gltf", onLoad);
gltfLoader.load("/models/bed.gltf", onLoad);
gltfLoader.load("/models/desk.gltf", onLoad);
gltfLoader.load("/models/carpet.gltf", onLoad);
gltfLoader.load("/models/carpet1.gltf", onLoad);
gltfLoader.load("/models/chiarGame.gltf", onLoad);
gltfLoader.load("/models/tree1.gltf", onLoad);
gltfLoader.load("/models/desktop.gltf", onLoad);
gltfLoader.load("/models/earth.gltf", onLoad);
gltfLoader.load("/models/bmw.gltf", onLoad);
gltfLoader.load("/models/drone.gltf", onLoad);
gltfLoader.load("/models/kawasaki2.gltf", onLoad);
gltfLoader.load("/models/kawasakiNinja.gltf", onLoad);
gltfLoader.load("/models/mersedes.gltf", onLoad);

function onLoad(gltf) {
  loadedModels[gltf.scene.name] = gltf.scene;
}

/* `const scene = new THREE.Scene();` is creating a new instance of a Three.js scene. This scene is
where you can add objects, lights, cameras, and other elements that you want to render using
Three.js. It serves as the container for all the 3D elements that you want to display in your
virtual or augmented reality environment. */
const scene = new THREE.Scene();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const light = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(light);

let reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0xffffff * Math.random() })
);
reticle.visible = false;
reticle.matrixAutoUpdate = false;
scene.add(reticle);

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 2, 5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: overlayContent },
  })
);

let controller = renderer.xr.getController(0);
controller.addEventListener("select", onSelect);
scene.add(controller);

function onSelect() {
  if (reticle.visible) {
    let model = loadedModels[modelName].clone();
    model.position.setFromMatrixPosition(reticle.matrix);
    model.scale.set(0.5, 0.5, 0.5);
    scene.add(model);
  }
}

renderer.setAnimationLoop(render);

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace("viewer").then((referenceSpace) => {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then((source) => (hitTestSource = source));
      });

      hitTestSourceRequested = true;

      session.addEventListener("end", () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});