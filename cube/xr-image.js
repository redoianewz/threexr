import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

let loadedImages = {};
let hitTestSource = null;
let hitTestSourceRequested = false;
let overlayContent = document.getElementById("overlay-content");
let selectInput = document.getElementById("model-select");
let imageName = selectInput.value;
let selectedImage = null;

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});
         const stopArButton = document.createElement("button");
         stopArButton.textContent = "STOP AR";
         stopArButton.style.display = "none";
         document.body.appendChild(stopArButton);

         // Handle click event for the Stop AR Button
         stopArButton.addEventListener("click", () => {
           if (currentSession !== null) {
             currentSession.end();
           }
         });
function createImagePlane(texture) {
  const imageMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const imagePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    imageMaterial
  );
  imagePlane.rotation.x = -Math.PI / 2;
  imagePlane.position.setFromMatrixPosition(reticle.matrix);
  imagePlane.scale.set(0.5, 0.5, 0.5);
  return imagePlane;
}

selectInput.addEventListener("change", (e) => {
  imageName = e.target.value;
});

const imageLoader = new THREE.TextureLoader();

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

function onLoad(texture, name) {
  loadedImages[name] = texture;
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
        )},
         y=${image.position.y.toFixed(2)}, z=${image.position.z.toFixed(2)}`;    
          stopArButton.style.display = "block";    
      }
                stopArButton.style.display = "block";    

    }
              stopArButton.style.display = "block";    

  }
}

let pinchStartDistance = 0;
let isPinching = false;
let previousTouch = null;

function handleTouchMove(event) {
  const touches = event.touches;

  if (touches.length === 1) {
    const currentTouch = touches[0];

    if (previousTouch) {
      const deltaX = currentTouch.clientX - previousTouch.clientX;
      const deltaY = currentTouch.clientY - previousTouch.clientY;

      // التحكم في الدوران إذا كان هناك لمست واحدة
      const rotationFactor = 0.01;
      selectedImage.rotation.y += deltaX * rotationFactor;
      selectedImage.rotation.x += deltaY * rotationFactor;
    }

    previousTouch = {
      clientX: currentTouch.clientX,
      clientY: currentTouch.clientY,
    };
  } else if (touches.length === 2) {
    // التحكم في التكبير والتصغير إذا كان هناك لمستين
    const pinchDistance = Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );

    if (!isPinching) {
      pinchStartDistance = pinchDistance;
      isPinching = true;
    }

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
  } else {
    // إذا لم تكن هناك لمستين، قم بإعادة القيم إلى القيم الافتراضية
    previousTouch = null;
    isPinching = false;
    pinchStartDistance = 0;
  }
}

function handleTouchEnd() {
  pinchStartDistance = 0;
  isPinching = false;
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
