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

// تعريف متغير لتخزين مسافة بداية الضغط للتكبير/التصغير
let pinchStartDistance = 0;

// تعريف متغير لتخزين الحالة الحالية للتكبير/التصغير
let isPinching = false;

controller.addEventListener("selectstart", onSelectStart);
controller.addEventListener("selectend", onSelectEnd);

function onSelectStart(event) {
  const session = renderer.xr.getSession();
  session.addEventListener("selectstart", onXRSelectStart);
}

function onSelectEnd(event) {
  pinchStartDistance = 0;
  isPinching = false;
}

function onXRSelectStart(event) {
  const inputSource = event.inputSource;
  const touches = inputSource.gamepad.touches;

  if (touches && touches.length === 2) {
    pinchStartDistance = getPinchDistance(touches[0], touches[1]);
    isPinching = true;
  }

  const session = renderer.xr.getSession();
  session.addEventListener("selectend", onXRSelectEnd);
}

function onXRSelectEnd(event) {
  isPinching = false;
  const session = renderer.xr.getSession();
  session.removeEventListener("selectstart", onXRSelectStart);
  session.removeEventListener("selectend", onXRSelectEnd);
}

// دالة لمعالجة حركة اللمس (للتكبير والتصغير)
function onTouchMove(event) {
  const touches = event.touches;

  if (touches.length === 2) {
    const pinchDistance = getPinchDistance(touches[0], touches[1]);

    if (isPinching) {
      const zoomFactor = pinchDistance / pinchStartDistance;

      if (selectedImage) {
        selectedImage.scale.multiplyScalar(zoomFactor);

        overlayContent.innerText = `Image Coordinates: x=${selectedImage.position.x.toFixed(
          2
        )}, y=${selectedImage.position.y.toFixed(
          2
        )}, z=${selectedImage.position.z.toFixed(
          2
        )}\nScale: ${selectedImage.scale.x.toFixed(2)}`;
      }

      pinchStartDistance = pinchDistance;
    }
  }
}

function onTouchEnd() {
  pinchStartDistance = 0;
  isPinching = false;
}

// تسجيل دالة onTouchMove كمعالج لحركة اللمس
window.addEventListener("touchmove", onTouchMove);
window.addEventListener("touchend", onTouchEnd);

// ... الجزء الباقي من الكود

renderer.setAnimationLoop(render);

function render(frame) {
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

        // إذا تم اختيار صورة، قم بإخفاء الـ "reticle"
        if (selectedImage) {
          reticle.visible = false;
        }
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

// Load images
imageLoader.load("/images/chair.png", (texture) => onLoad(texture, "chair"));
imageLoader.load("/images/bookcase.png", (texture) =>
  onLoad(texture, "bookcase")
);
imageLoader.load("/images/bookcase1.png", (texture) =>
  onLoad(texture, "bookcase1")
);
imageLoader.load("/images/desk.png", (texture) => onLoad(texture, "desk"));
imageLoader.load("/images/bed.png", (texture) => onLoad(texture, "bed"));
imageLoader.load("/images/chiarGame.png", (texture) =>
  onLoad(texture, "chiarGame")
);
imageLoader.load("/images/carpet.png", (texture) => onLoad(texture, "carpet"));
imageLoader.load("/images/carpet1.png", (texture) =>
  onLoad(texture, "carpet1")
);
// imageLoader.load("images/tree1.png", (texture) => onLoad(texture, "tree1"));
// imageLoader.load("images/desktop.png", (texture) => onLoad(texture, "desktop"));
// imageLoader.load("images/earth.png", (texture) => onLoad(texture, "earth"));
// imageLoader.load("images/bmw.png", (texture) => onLoad(texture, "bmw"));
// imageLoader.load("images/drone.png", (texture) => onLoad(texture, "drone"));
// imageLoader.load("images/kawasaki2.png", (texture) => onLoad(texture, "kawasaki2"));
// imageLoader.load("images/kawasakiNinja.png", (texture) => onLoad(texture, "kawasakiNinja"));
// imageLoader.load("images/mersedes.png", (texture) => onLoad(texture, "mersedes"));

function onLoad(texture, name) {
  loadedImages[name] = texture;
}
