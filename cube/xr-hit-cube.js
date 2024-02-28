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
let selectedModel = null;

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
  console.log(`Loaded model: ${gltf.scene.name}`);
}

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
  ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff * Math.random(),
});

let controller = renderer.xr.getController(0);
controller.addEventListener("select", onSelect);
scene.add(controller);

function onSelect() {
  if (reticle.visible) {
    if (loadedModels[modelName]) {
      const existingModel = scene.getObjectByName(modelName);
      if (!existingModel) {
        const model = loadedModels[modelName].clone();
        model.position.setFromMatrixPosition(reticle.matrix);
        model.scale.set(0.5, 0.5, 0.5);
        model.name = modelName; // Set the model name for identification
        scene.add(model);
        selectedModel = model; // Set the selected model

        // Show model coordinates in UI
        overlayContent.innerText = `Model Coordinates: x=${model.position.x.toFixed(
          2
        )}, y=${model.position.y.toFixed(2)}, z=${model.position.z.toFixed(2)}`;
      }
    }
  }
}

// Event listener for touch controls
let touchStartPosition = { x: 0, y: 0, pinch: 0 };
// function handleTouchMove(event) {
//   const deltaX = event.touches[0].clientX - touchStartPosition.x;
//   const deltaY = event.touches[0].clientY - touchStartPosition.y;

//   if (selectedModel) {
//     // Rotate the model based on the touch movement
//     const rotationFactor = 0.005;
//     selectedModel.rotation.y += deltaX * rotationFactor;
//     selectedModel.rotation.x += deltaY * rotationFactor;

//     if (event.touches.length === 2) {
//       // Zoom the model based on the distance between two touches
//       const deltaPinch = Math.hypot(
//         event.touches[0].clientX - event.touches[1].clientX,
//         event.touches[0].clientY - event.touches[1].clientY
//       );

//       const zoomFactor = 0.01;
//       selectedModel.scale.multiplyScalar(
//         1 + (deltaPinch - touchStartPosition.pinch) * zoomFactor
//       );

//       // Update pinch distance for the next frame
//       touchStartPosition.pinch = deltaPinch;
//     }

//     overlayContent.innerText = `Model Coordinates: x=${selectedModel.position.x.toFixed(
//       2
//     )}, y=${selectedModel.position.y.toFixed(
//       2
//     )}, z=${selectedModel.position.z.toFixed(2)}`;
//   }

//   touchStartPosition = {
//     x: event.touches[0].clientX,
//     y: event.touches[0].clientY,
//     pinch: touchStartPosition.pinch || 0, // Initialize pinch distance
//   };
// }

// Event listener for touch controls

let cameraRotation = { x: 0, y: 0 };

function handleTouchMove(event) {
  const deltaX = event.touches[0].clientX - touchStartPosition.x;
  const deltaY = event.touches[0].clientY - touchStartPosition.y;

  // Rotate the camera based on the touch movement
  const rotationFactor = 0.005;
  cameraRotation.y += deltaX * rotationFactor;
  cameraRotation.x += deltaY * rotationFactor;

  if (event.touches.length === 2) {
    // Zoom the camera based on the distance between two touches
    const deltaPinch = Math.hypot(
      event.touches[0].clientX - event.touches[1].clientX,
      event.touches[0].clientY - event.touches[1].clientY
    );

    const zoomFactor = 0.01;
    camera.position.z += (deltaPinch - touchStartPosition.pinch) * zoomFactor;

    // Update pinch distance for the next frame
    touchStartPosition.pinch = deltaPinch;
  }

  // Apply camera rotation
  camera.rotation.set(cameraRotation.x, cameraRotation.y, 0);

  touchStartPosition = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
    pinch: touchStartPosition.pinch || 0, // Initialize pinch distance
  };
}





function handleTouchStart(event) {
  touchStartPosition = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  };
}

window.addEventListener("touchmove", handleTouchMove);
window.addEventListener("touchstart", handleTouchStart);

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
