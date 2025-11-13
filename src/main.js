import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import './style.css';




//fields
let bloomTime = 0;

// Scene
const scene = new THREE.Scene();
// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Post-processing setup
const DistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: .37 },
    center: { value: new THREE.Vector2(0.5, 0.5) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform vec2 center;
    varying vec2 vUv;

    void main() {
      vec2 coord = vUv - center;
      float dist = length(coord);
      float bend = 1.0 / (1.0 + dist * 10.0 * strength);
      vec2 distorted = coord * bend + center;
      vec4 color = texture2D(tDiffuse, distorted);

      // Add slight glow near center
      float glow = smoothstep(0.4, 0.0, dist);
      color.rgb += glow * 0.3;
      gl_FragColor = color;
    }
  `
};

//apply post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const distortionPass = new ShaderPass(DistortionShader);
composer.addPass(distortionPass);

//bloom pass
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.3, // strength
  0.4, // radius
  0.85 // threshold
);
composer.addPass(bloomPass);

//Skybox Background
const loader = new THREE.CubeTextureLoader();
loader.setPath( 'skybox_stars/' );
const skybox = loader.load([
  'px.jpg',
  'nx.jpg',
  'py.jpg',
  'ny.jpg',
  'pz.jpg',
  'nz.jpg',
]);
scene.background = skybox;


//lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambient);





// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Light
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 0, 10);
scene.add(light);

// Placeholder (sphere = black hole)
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1, metalness: 1 });
const blackHole = new THREE.Mesh(geometry, material);
scene.add(blackHole);

// Accretion disk

const diskGeometry = new THREE.RingGeometry(1.3, 2.5, 128);
const diskMaterial = new THREE.MeshStandardMaterial({
  color: 0xffaa55,
  emissive: 0xff6600,
  emissiveIntensity: 4.0, // increase glow brightness
  metalness: 1,
  roughness: 0.2,
  side: THREE.DoubleSide,
});

const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
accretionDisk.rotation.x = Math.PI / 3; // flat, facing camera initially
scene.add(accretionDisk);



// Animate
function animate() {
  requestAnimationFrame(animate);
  blackHole.rotation.y += 0.002;
  controls.update();
  const blackHoleScreenPos = new THREE.Vector3();
  blackHoleScreenPos.copy(blackHole.position).project(camera);
  distortionPass.uniforms.center.value.set(
    (blackHoleScreenPos.x + 1) / 2,
    (1 + blackHoleScreenPos.y) / 2
  );
  composer.render();


  accretionDisk.rotation.z += 0.01;
  /*
  bloomTime += 0.02; // speed of pulsation
  bloomPass.strength = .7 + Math.sin(bloomTime) * 0.3; 
  */
}
animate();

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
});



