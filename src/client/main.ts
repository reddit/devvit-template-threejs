import * as THREE from 'three';
import { navigateTo } from '@devvit/client';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';

const titleElement = document.getElementById('title') as HTMLHeadingElement;
const counterValueElement = document.getElementById('counter-value') as HTMLSpanElement;
// Buttons have been removed; interactions now happen on the planet mesh.

const docsLink = document.getElementById('docs-link');
const playtestLink = document.getElementById('playtest-link');
const discordLink = document.getElementById('discord-link');

docsLink?.addEventListener('click', () => navigateTo('https://developers.reddit.com/docs'));
playtestLink?.addEventListener('click', () => navigateTo('https://www.reddit.com/r/Devvit'));
discordLink?.addEventListener('click', () => navigateTo('https://discord.com/invite/R7yu2wh9Qz'));

let currentPostId: string | null = null;

async function fetchInitialCount(): Promise<void> {
  try {
    const response = await fetch('/api/init');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as InitResponse;
    if (data.type === 'init') {
      counterValueElement.textContent = data.count.toString();
      currentPostId = data.postId;
      titleElement.textContent = `Hey ${data.username} 👋`;
    } else {
      counterValueElement.textContent = 'Error';
    }
  } catch (err) {
    console.error('Error fetching initial count:', err);
    counterValueElement.textContent = 'Error';
  }
}

async function updateCounter(action: 'increment' | 'decrement'): Promise<void> {
  if (!currentPostId) return;
  try {
    const response = await fetch(`/api/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as IncrementResponse | DecrementResponse;
    counterValueElement.textContent = data.count.toString();
  } catch (err) {
    console.error(`Error ${action}ing count:`, err);
  }
}

// Button event listeners removed – handled via planet click.

const canvas = document.getElementById('bg') as HTMLCanvasElement;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio ?? 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

camera.lookAt(0, 0, 0);

renderer.render(scene, camera);

// Resize handler
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = '';

const earthTexture = textureLoader.load('/earth_atmos_2048.jpg');
const earthNormalMap = textureLoader.load('/earth_normal_2048.jpg');
const earthSpecularMap = textureLoader.load('/earth_specular_2048.jpg');

earthTexture.encoding = THREE.sRGBEncoding;
earthNormalMap.encoding = THREE.LinearEncoding;
earthSpecularMap.encoding = THREE.LinearEncoding;

const earthGeo = new THREE.SphereGeometry(10, 64, 64);
const earthMat = new THREE.MeshPhongMaterial({
  map: earthTexture,
  normalMap: earthNormalMap,
  specularMap: earthSpecularMap,
  shininess: 5,
});
const earthSphere = new THREE.Mesh(earthGeo, earthMat);

const planetGroup = new THREE.Group();
planetGroup.add(earthSphere);
scene.add(planetGroup);

function addStar(): void {
  const starGeo = new THREE.SphereGeometry(0.25, 24, 24);
  const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(starGeo, starMat);

  const x = THREE.MathUtils.randFloatSpread(200);
  const y = THREE.MathUtils.randFloatSpread(200);
  const z = THREE.MathUtils.randFloatSpread(200);
  star.position.set(x, y, z);
  scene.add(star);
}
Array.from({ length: 200 }).forEach(addStar);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let scaleVelocity = 0;

function handleClick(event: PointerEvent): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(earthSphere);
  if (intersects.length > 0) {
    // Start gentle bounce
    scaleVelocity = 0.05;
    void updateCounter('increment');
  }
}

window.addEventListener('pointerdown', handleClick);

function animate(): void {
  requestAnimationFrame(animate);

  planetGroup.rotation.y += 0.0025;
  planetGroup.rotation.x += 0.001;

  if (scaleVelocity !== 0) {
    const newScale = planetGroup.scale.x + scaleVelocity;
    planetGroup.scale.set(newScale, newScale, newScale);

    if (newScale >= 1.2) scaleVelocity = -0.04;
    if (newScale <= 1) {
      planetGroup.scale.set(1, 1, 1);
      scaleVelocity = 0;
    }
  }

  renderer.render(scene, camera);
}

void fetchInitialCount();
animate();
