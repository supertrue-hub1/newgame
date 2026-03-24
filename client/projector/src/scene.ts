import * as THREE from 'three';

const BLOCK_COLORS: Record<string, number> = {
  dirt: 0x8B5A2B,
  grass: 0x5D8C3E,
  stone: 0x9E9E9E,
  wood: 0x8B4513,
  gold: 0xFFD700,
  diamond: 0x4AEDD9,
  emerald: 0x50C878,
};

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let blocks: Map<string, THREE.Mesh> = new Map();
let particles: THREE.Points[] = [];

export function initScene(canvas: HTMLCanvasElement): { scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer } {
  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 7);
  camera.lookAt(0, 1.5, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  createEnvironment();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function createEnvironment(): void {
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3D5C2E,
    roughness: 1,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(10, 20, 0x555555, 0x333333);
  gridHelper.position.y = -0.49;
  scene.add(gridHelper);
}

export function addBlockToScene(id: string, type: string, x: number, y: number, z: number): void {
  if (blocks.has(id)) return;

  const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const color = BLOCK_COLORS[type] || 0x888888;
  const material = new THREE.MeshStandardMaterial({ 
    color,
    roughness: 0.8,
    metalness: type === 'gold' || type === 'diamond' ? 0.5 : 0.1,
  });
  
  const block = new THREE.Mesh(geometry, material);
  block.position.set(x, y, z);
  block.castShadow = true;
  block.receiveShadow = true;
  
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
  block.add(line);
  
  scene.add(block);
  blocks.set(id, block);
}

export function updateBlockPosition(id: string, y: number): void {
  const block = blocks.get(id);
  if (block) {
    block.position.y = y;
    block.rotation.y += 0.02;
  }
}

export function removeBlockFromScene(id: string, x: number, y: number, z: number): void {
  const block = blocks.get(id);
  if (block) {
    createExplosion(block.position.clone());
    scene.remove(block);
    block.geometry.dispose();
    (block.material as THREE.Material).dispose();
    blocks.delete(id);
  }
}

function createExplosion(position: THREE.Vector3): void {
  const particleCount = 20;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
    
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 0.8;
    colors[i * 3 + 2] = 0;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 1,
  });
  
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  particles.push(points);
  
  animateParticles(points);
}

function animateParticles(points: THREE.Points): void {
  const positions = points.geometry.attributes.position.array as Float32Array;
  let frame = 0;
  
  const animate = () => {
    frame++;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += 0.03;
    }
    
    points.geometry.attributes.position.needsUpdate = true;
    (points.material as THREE.PointsMaterial).opacity = 1 - frame / 60;
    
    if (frame < 60) {
      requestAnimationFrame(animate);
    } else {
      scene.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
      const index = particles.indexOf(points);
      if (index > -1) particles.splice(index, 1);
    }
  };
  
  animate();
}

export function render(): void {
  renderer.render(scene, camera);
}

export function getScene(): THREE.Scene {
  return scene;
}
