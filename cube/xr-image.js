// xr-image.js
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

let loadedImages = {};
let hitTestSource = null;
let hitTestSourceRequested = false;
let overlayContent = document.getElementById("overlay-content");
let selectInput = document.getElementById("model-select");
let imageName = selectInput.value;
let selectedImage = null;

selectInput.addEventListener("change", (e) => {
  imageName = e.target.value;
});

const imageLoader = new THREE.TextureLoader();

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

let controller = renderer.xr.getController(0);
controller.addEventListener("select", onSelect);
scene.add(controller);

function onSelect() {
  if (reticle.visible) {
    if (loadedImages[imageName]) {
      const existingImage = scene.getObjectByName(imageName);
      if (!existingImage) {
        const image = createImagePlane(loadedImages[imageName]);
        image.name = imageName;
        scene.add(image);
        selectedImage = image;
        overlayContent.innerText = `Image Coordinates: x=${image.position.x.toFixed(
          2
        )}, y=${image.position.y.toFixed(2)}, z=${image.position.z.toFixed(2)}`;
      }
    }
  }
}

let touchStartPosition = { x: 0, y: 0, pinch: 0 };
let previousTouch = null;

function handleTouchMove(event) {
  const currentTouch = event.touches[0];

  if (previousTouch) {
    const deltaX = currentTouch.clientX - previousTouch.clientX;
    const deltaY = currentTouch.clientY - previousTouch.clientY;

    const rotationFactor = 0.01;
    selectedImage.rotation.y += deltaX * rotationFactor;
    selectedImage.rotation.x += deltaY * rotationFactor;
  }

  previousTouch = {
    clientX: currentTouch.clientX,
    clientY: currentTouch.clientY,
  };
}

function handleTouchEnd() {
  previousTouch = null;
}

window.addEventListener("touchmove", handleTouchMove);
window.addEventListener("touchend", handleTouchEnd);

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

    handleTouchMove(frame);
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

function createImagePlane(texture) {
  const imageMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const imagePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    imageMaterial
  );
  imagePlane.position.setFromMatrixPosition(reticle.matrix);
  imagePlane.scale.set(0.5, 0.5, 0.5);
  return imagePlane;
}

// Function to start AR session
function startAR() {
  const session = renderer.xr.getSession();
  if (session) {
    session.requestReferenceSpace("viewer").then((referenceSpace) => {
      session
        .requestHitTestSource({ space: referenceSpace })
        .then((source) => (hitTestSource = source));
    });

    session.addEventListener("end", () => {
      hitTestSourceRequested = false;
      hitTestSource = null;
    });
  }
}
