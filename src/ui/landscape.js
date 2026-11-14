import { createSky } from './sky.js';
import { createDriveMotion } from '../engine/drive-motion.js';
import { sampleSurface } from '../input/surface.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/** A real, navigable Martian diorama. NASA's rover is loaded from a local GLB. */
export function createLandscape(canvas) {
  const noop = () => {};
  const empty = { setScene: noop, setReducedMotion: noop, setPaused: noop,
    setMode: noop, setDrive: noop, stopDrive: noop, setInvestigation: noop, setContact: noop, setContactInput: noop, nudgeContact: noop, sendContact: noop, cancelContactPulse: noop, focusRover: noop, inspect: noop,
    setWaypoint: noop, setObservationTarget: noop, travelToWaypoint: noop, reset: noop, destroy: noop };
  const status = (state, message) => canvas?.dispatchEvent(new CustomEvent('world-status', {
    detail: { state, message }, bubbles: true,
  }));
  if (!canvas || typeof window === 'undefined') return empty;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false,
      powerPreference: 'high-performance' });
  } catch {
    queueMicrotask(() => status('error', 'This browser could not start WebGL. Enable hardware acceleration or try a browser with WebGL 2.'));
    return empty;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.style.touchAction = 'none';
  canvas.style.pointerEvents = 'auto';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D Mars landscape. Drag to orbit, scroll or pinch to zoom. During play, use WASD or arrow keys to drive Opportunity.');

  let disposed = false;
  let paused = false;
  let reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
  let mode = 'title';
  let environment = 'sunset';
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let modelReady = false;
  let modelFailed = false;
  let canDrive = true;
  let eventTime = 0;
  let heading = -0.45;
  let drive = { forward: 0, turn: 0 };
  const motion = createDriveMotion();
  let wasMoving = false;
  let roverFrame = null;
  let investigation = false;
  let contactActive = false;
  let contactFraming = false;
  let contactInput = { x: 0, y: 0 };
  let contactYaw = 0, contactPitch = 0, contactTargetYaw = 0;
  const contactTargetPitch = .67;
  let contactSampleTime = 0;
  let contactOrigin = new THREE.Vector3();
  let contactDirection = new THREE.Vector3();
  let contactCamera = null;
  let contactPulse = null;
  let sampleTime = 0;
  let samplePosition = new THREE.Vector3();
  let sampleDirection = new THREE.Vector3();
  let distance = 0;
  let look = {x:0,y:0};
  let lastTrackPosition = new THREE.Vector3();
  let cameraTween = null;
  let waypoint = null;
  let observationTarget = null;
  let inspecting = false;
  let route = null;
  let planetState = null;
  const resources = new Set();
  const own = (resource) => { resources.add(resource); return resource; };
  const random = seededRandom(5111);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#b58061', 0.008);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.12, 500);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 3.3;
  controls.maxDistance = 28;
  controls.minPolarAngle = 0.32;
  controls.maxPolarAngle = Math.PI * 0.475;
  controls.rotateSpeed = 0.52;
  controls.zoomSpeed = 0.7;
  controls.addEventListener('start', () => { cameraTween = null; });
  controls.addEventListener('change', () => { if (paused || reduced) render(); });

  // Smooth deterministic terrain, not a height-map illustration or flat backdrop.
  function heightAt(x, z) {
    const r = Math.hypot(x, z);
    const outer = THREE.MathUtils.smoothstep(r, 16, 70);
    const dune = Math.sin(x * 0.055 + Math.sin(z * 0.03) * 2.3) * 2.3
      + Math.sin(z * 0.047 - x * 0.018) * 1.8;
    const detail = fbm(x * 0.11, z * 0.11) * 0.55
      + fbm(x * 0.65, z * 0.65) * 0.075;
    const ridge = Math.max(0, -z - 40) * 0.095 * (0.65 + noise(x * 0.04, z * 0.04));
    return detail + dune * (0.13 + outer * 0.85) + ridge;
  }

  // The displayed terrain is a triangle mesh with 1 m cells. Interpolate the
  // actual triangles, rather than sampling the unmeshed noise between vertices.
  function surfaceHeight(x, z) {
    const x0 = Math.floor(x), z0 = Math.floor(z);
    const tx = x - x0, tz = z - z0;
    const h00 = heightAt(x0, z0), h10 = heightAt(x0 + 1, z0);
    const h01 = heightAt(x0, z0 + 1), h11 = heightAt(x0 + 1, z0 + 1);
    return tx + tz <= 1
      ? h00 + tx * (h10 - h00) + tz * (h01 - h00)
      : h11 + (1 - tx) * (h01 - h11) + (1 - tz) * (h10 - h11);
  }

  const terrainGeometry = own(new THREE.PlaneGeometry(240, 240, 240, 240));
  terrainGeometry.rotateX(-Math.PI / 2);
  const position = terrainGeometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const soilA = new THREE.Color('#b09b82');
  const soilB = new THREE.Color('#e0cbb0');
  const soilColor = new THREE.Color();
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, heightAt(x, z));
    const variation = THREE.MathUtils.clamp(0.42 + fbm(x * 0.18, z * 0.18) * 0.45
      + Math.sin(z * 1.7 + x * 0.18) * 0.045, 0, 1);
    soilColor.copy(soilA).lerp(soilB, variation);
    colors.set([soilColor.r, soilColor.g, soilColor.b], i * 3);
  }
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeometry.computeVertexNormals();
  const surfaceTexture = own(makeSoilTexture(random));
  const terrainMaterial = own(new THREE.MeshStandardMaterial({ vertexColors: true,
    map: surfaceTexture, roughness: 1, metalness: 0, envMapIntensity: .18,
    bumpMap: surfaceTexture, bumpScale: 0.055 }));
  setDrySurface(terrainMaterial, .9);
  setTerrainVariation(terrainMaterial);
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Shared geometry and instancing keep the rock field cheap enough for phones.
  const rockGeometries = [0, 1, 2].map(variant => own(makeRockGeometry(variant)));
  const rockGeometry = rockGeometries[0];
  const rockMaterial = own(new THREE.MeshStandardMaterial({ color: '#d9c3aa', roughness: .98, metalness: 0, envMapIntensity: .35,
    map: surfaceTexture, bumpMap: surfaceTexture, bumpScale: 0.045 }));
  setDrySurface(rockMaterial, .85);
  const rockCount = 480;
  const rockField = rockGeometries.map(geometry => {
    const field = new THREE.InstancedMesh(geometry, rockMaterial, rockCount / 3);
    field.castShadow = field.receiveShadow = true;
    scene.add(field);
    return field;
  });
  const dummy = new THREE.Object3D();
  const collisions = [];
  for (let i = 0; i < rockCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 4.5 + Math.pow(random(), 0.8) * 94;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    let size = 0.12 + Math.pow(random(), 3) * 1.75;
    if (radius < 14) size = Math.min(size, .4);
    const flatness = 0.28 + random() * 0.34;
    dummy.position.set(x, heightAt(x, z) + size * flatness * 0.42, z);
    dummy.rotation.set(random() * 0.35, random() * Math.PI, random() * 0.22);
    dummy.scale.set(size * (1 + random()), size * flatness, size * (0.75 + random()));
    // Low rubble recedes from the two investigation approaches, exposing a
    // readable physical apron instead of burying the landmark in random stones.
    if (Math.hypot(x - 7, z + 7) < 2.4 || Math.hypot(x + 5, z + 10) < 2.4) {
      dummy.scale.multiplyScalar(.4);
    }
    dummy.updateMatrix();
    const field = rockField[i % rockField.length];
    const instance = Math.floor(i / rockField.length);
    field.setMatrixAt(instance, dummy.matrix);
    field.setColorAt(instance, new THREE.Color().setHSL(0.065 + random() * 0.035,
      0.09 + random() * 0.12, 0.64 + random() * 0.16));
    if (radius < 23 && size > 0.4) collisions.push({ x, z, radius: size * 1.05 });
  }
  const pebbleGeometry = own(new THREE.IcosahedronGeometry(1, 0));
  const pebbles = new THREE.InstancedMesh(pebbleGeometry, rockMaterial, 1100);
  pebbles.receiveShadow = true;
  for (let i = 0; i < pebbles.count; i += 1) {
    const x = (random() - 0.5) * 75, z = (random() - 0.5) * 75;
    const size = 0.025 + random() * 0.085;
    dummy.position.set(x, heightAt(x, z) + size * 0.25, z);
    dummy.rotation.set(random(), random() * 6.28, random());
    dummy.scale.set(size * 1.4, size * 0.45, size);
    if (Math.hypot(x - 7, z + 7) < 2.2 || Math.hypot(x + 5, z + 10) < 2.2) dummy.scale.multiplyScalar(.45);
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
  scene.add(pebbles);

  // Authored teaching dioramas, not surveyed reconstructions. Geometry and grain
  // scale favor recognition on phones; sourced interpretation lives in content.
  const observationSites = [];
  const outcropTexture = own(surfaceTexture.clone());
  outcropTexture.repeat.set(2.8, 2.8);
  outcropTexture.needsUpdate = true;
  const strataMaterials = ['#c0b5a1', '#b0a58f', '#c7bca8', '#b8ad97'].map(color =>
    own(new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, envMapIntensity: .35,
      map: outcropTexture, bumpMap: outcropTexture, bumpScale: .07 })));
  strataMaterials.forEach(material => {
    setDrySurface(material, .9);
    setSedimentSurface(material);
    material.userData.normalStrength = .14;
  });
  // Clockwise weathered silhouette: broad low shoulders, chipped rising crown.
  const outcropOutline = [[-1.5, .06], [-1.29, .88], [-.97, 1.23],
    [-.48, 1.34], [.22, 1.31], [.83, 1.18], [1.31, .79],
    [1.48, .13], [.92, -.09], [-.91, -.07]];
  const lastChance = new THREE.Group();
  lastChance.position.set(7, surfaceHeight(7, -8.9) - .08, -8.9);
  // Each packet has inclined laminae truncated against a different boundary.
  // Their alternating dips make the crossing pattern readable in actual relief.
  for (let packet = 0; packet < 3; packet += 1) {
    const bottom = packet * .43;
    const top = bottom + .43;
    const slope = packet === 1 ? -.19 : .17;
    for (let band = -3; band < 8; band += 1) {
      let polygon = [[-1.45, bottom + band * .115 - slope * 1.45],
        [1.45, bottom + band * .115 + slope * 1.45],
        [1.45, bottom + band * .115 + .101 + slope * 1.45],
        [-1.45, bottom + band * .115 + .101 - slope * 1.45]];
      // Clip tilted slabs to the packet above and below (visible truncation).
      for (const [boundary, direction] of [[bottom, 1], [top, -1]]) {
        const clipped = [];
        for (let i = 0; i < polygon.length; i += 1) {
          const from = polygon[i], to = polygon[(i + 1) % polygon.length];
          const inside = direction * (from[1] - boundary) >= 0;
          const nextInside = direction * (to[1] - boundary) >= 0;
          if (inside) clipped.push(from);
          if (inside !== nextInside) {
            const t = (boundary - from[1]) / (to[1] - from[1]);
            clipped.push([from[0] + t * (to[0] - from[0]), boundary]);
          }
        }
        polygon = clipped;
      }
      // Trim every lamina to one weathered boulder silhouette, rather than
      // allowing the packet boundaries to become rectangular outside edges.
      for (let edge = 0; edge < outcropOutline.length; edge += 1) {
        const a = outcropOutline[edge], b = outcropOutline[(edge + 1) % outcropOutline.length];
        const side = point => (b[0] - a[0]) * (point[1] - a[1])
          - (b[1] - a[1]) * (point[0] - a[0]);
        const clipped = [];
        for (let i = 0; i < polygon.length; i += 1) {
          const from = polygon[i], to = polygon[(i + 1) % polygon.length];
          const d0 = side(from), d1 = side(to);
          if (d0 <= 0) clipped.push(from);
          if ((d0 <= 0) !== (d1 <= 0)) {
            const t = d0 / (d0 - d1);
            clipped.push([from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1])]);
          }
        }
        polygon = clipped;
      }
      if (polygon.length < 3) continue;
      const shape = new THREE.Shape(polygon.map(([x, y]) => new THREE.Vector2(x, y)));
      const geometry = own(new THREE.ExtrudeGeometry(shape, { depth: .95,
        bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: .017, bevelThickness: .012 }));
      const vertices = geometry.attributes.position;
      for (let i = 0; i < vertices.count; i += 1) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        vertices.setXYZ(i, x + .016 * Math.sin(y * 19 + z * 7),
          y + .022 * Math.sin(x * 5.7) + .009 * Math.sin(x * 17 + z * 5),
          z + .035 * noise(x * 8 + 12, y * 9));
      }
      vertices.needsUpdate = true;
      geometry.computeVertexNormals();
      const layer = new THREE.Mesh(geometry, strataMaterials[(band + 12 + packet) % 4]);
      layer.position.z = -.45 + Math.sin(band * 2.4 + packet) * .008;
      layer.castShadow = layer.receiveShadow = true;
      lastChance.add(layer);
    }
  }
  const outcropBack = new THREE.Mesh(rockGeometries[1], strataMaterials[1]);
  outcropBack.position.set(-.08, .45, -.35);
  outcropBack.scale.set(1.35, .65, .57);
  outcropBack.castShadow = outcropBack.receiveShadow = true;
  lastChance.add(outcropBack);
  scene.add(lastChance);
  collisions.push({ x: 7, z: -8.9, radius: 1.5 });
  observationSites.push({ x: 7, z: -7,
    target: lastChance.position.clone().add(new THREE.Vector3(0, .67, .5)),
    normal: new THREE.Vector3(0, 0, 1), kind: 'layers',
    offset: new THREE.Vector3(.65, 1.25, 4.1), min: 2.3, max: 6.5 });

  const berryBowl = new THREE.Group();
  berryBowl.position.set(-5, surfaceHeight(-5, -11.8), -11.8);
  const bowlOutline = [[-1.43, -.3], [-1.15, -.77], [-.47, -.9],
    [.24, -.85], [1.1, -.65], [1.47, -.08], [1.24, .48],
    [.68, .85], [-.18, .88], [-.9, .63], [-1.48, .15]];
  const bowlShape = new THREE.Shape(bowlOutline.map(([x, z]) => new THREE.Vector2(x, z)));
  const bowlGeometry = own(new THREE.ExtrudeGeometry(bowlShape, { depth: .15,
    bevelEnabled: true, bevelSegments: 1, bevelSize: .045, bevelThickness: .035, steps: 1 }));
  bowlGeometry.rotateX(-Math.PI / 2);
  const bowlVertices = bowlGeometry.attributes.position;
  for (let i = 0; i < bowlVertices.count; i += 1) {
    const x = bowlVertices.getX(i), y = bowlVertices.getY(i), z = bowlVertices.getZ(i);
    bowlVertices.setY(i, y + .018 * Math.sin(x * 7 + z * 4));
  }
  bowlGeometry.computeVertexNormals();
  const slab = new THREE.Mesh(bowlGeometry, strataMaterials[2]);
  slab.receiveShadow = slab.castShadow = true;
  berryBowl.add(slab);
  const grainGeometry = own(new THREE.SphereGeometry(1, 12, 8));
  const grainMaterial = own(new THREE.MeshStandardMaterial({ color: '#4c5358',
    roughness: .79, metalness: .05, bumpMap: outcropTexture, bumpScale: .012 }));
  const grains = new THREE.InstancedMesh(grainGeometry, grainMaterial, 68);
  const grainRandom = seededRandom(7403);
  for (let i = 0; i < grains.count; i += 1) {
    const angle = grainRandom() * Math.PI * 2;
    const radius = Math.sqrt(grainRandom()) * 1.08;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius * .65;
    const size = .055 + grainRandom() * .035;
    dummy.position.set(x, .19 + size - radius * .025, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(size);
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
  }
  grains.castShadow = grains.receiveShadow = true;
  berryBowl.add(grains);
  scene.add(berryBowl);
  collisions.push({ x: -5, z: -11.8, radius: 1.3 });
  observationSites.push({ x: -5, z: -10,
    target: berryBowl.position.clone().add(new THREE.Vector3(0, .2, 0)),
    normal: new THREE.Vector3(0, 1, 0), kind: 'grains',
    offset: new THREE.Vector3(.35, 2.6, 2.8), min: 2.1, max: 5.8 });

  function loadSurfaceMaps(paths, materials, repeat, normalStrength) {
    const textureLoader = new THREE.TextureLoader();
    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    for (const [property, path] of Object.entries(paths)) {
      const texture = own(textureLoader.load(new URL(`../../public/${path}`, import.meta.url).href,
        loaded => {
          if (disposed) { loaded.dispose(); return; }
          for (const material of materials) {
            material[property] = loaded;
            if (property === 'normalMap') {
              material.normalScale.setScalar(material.userData.normalStrength ?? normalStrength);
              material.bumpMap = null;
            }
            material.needsUpdate = true;
          }
          render();
        }, undefined, () => {
          // Procedural surfaces remain valid if an optional material fails.
          if (!disposed) console.warn(`Surface map unavailable: ${path}`);
        }));
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.setScalar(repeat);
      texture.anisotropy = anisotropy;
      texture.colorSpace = property === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    }
  }

  loadSurfaceMaps({ map: 'textures/ground/albedo.jpg', normalMap: 'textures/ground/normal.jpg',
    roughnessMap: 'textures/ground/roughness.jpg' }, [terrainMaterial], 80, .45);
  loadSurfaceMaps({ map: 'textures/rock/albedo.jpg', normalMap: 'textures/rock/normal.jpg',
    roughnessMap: 'textures/rock/roughness.jpg' }, [rockMaterial, ...strataMaterials], 1.1, .7);

  const sun = new THREE.DirectionalLight('#ffd4a3', 3.2);
  sun.position.set(-28, 7, -58);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 110;
  // At this grazing sunset angle, centimeter-scale bias makes attached shadows
  // appear detached by a wheel radius. Keep bias near the wheel contact scale.
  sun.shadow.bias = -0.000015;
  sun.shadow.normalBias = 0.002;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const hemisphere = new THREE.HemisphereLight('#d7b9a3', '#39261e', 2.2);
  scene.add(hemisphere);
  const fill = new THREE.DirectionalLight('#c1c7cb', 0.8);
  fill.position.set(15, 10, 25);
  scene.add(fill);

  const { mesh: sky, uniforms: skyUniforms } = createSky(THREE, {
    own, sunDirection: sun.position.clone().normalize(),
  });
  const skyGeometry = sky.geometry;
  const skyMaterial = sky.material;
  scene.add(sky);
  // Environment reflections make real metallic hardware readable without fake glows.
  const environmentScene = new THREE.Scene();
  environmentScene.add(new THREE.Mesh(skyGeometry, skyMaterial));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = own(pmrem.fromScene(environmentScene, 0.02, 0.1, 500));
  scene.environment = environmentMap.texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();

  const dustCount = 900;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions.set([(random() - 0.5) * 80, random() * 17 + 0.4,
      (random() - 0.5) * 80], i * 3);
  }
  const dustGeometry = own(new THREE.BufferGeometry());
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = own(new THREE.PointsMaterial({ color: '#e1ba8d', size: 0.045,
    transparent: true, opacity: 0.23, depthWrite: false, sizeAttenuation: true }));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  const vehicle = new THREE.Group();
  vehicle.position.set(0, heightAt(0, 0) + 0.008, 0);
  vehicle.rotation.y = heading;
  scene.add(vehicle);
  const wheelContacts = [-.535, .535].flatMap(x => [-.55, -.02, .73].map(z => new THREE.Vector3(x, 0, z)));
  const contactPixels = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const radius = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
      const at = (y * 64 + x) * 4;
      contactPixels[at] = 35; contactPixels[at + 1] = 22; contactPixels[at + 2] = 15;
      contactPixels[at + 3] = Math.round(Math.max(0, 1 - radius) ** 2 * 120);
    }
  }
  const contactTexture = own(new THREE.DataTexture(contactPixels, 64, 64));
  contactTexture.needsUpdate = true;
  contactTexture.magFilter = THREE.LinearFilter;
  const contactGeometry = own(new THREE.PlaneGeometry(.32, .42));
  contactGeometry.rotateX(-Math.PI / 2);
  const contactMaterial = own(new THREE.MeshBasicMaterial({ map: contactTexture,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  const contacts = new THREE.InstancedMesh(contactGeometry, contactMaterial, wheelContacts.length);
  contacts.frustumCulled = false;
  contacts.visible = false;
  scene.add(contacts);
  lastTrackPosition.copy(vehicle.position);
  const trackGeometry = own(new THREE.PlaneGeometry(0.20, 0.065));
  trackGeometry.rotateX(-Math.PI / 2);
  const trackMaterial = own(new THREE.MeshBasicMaterial({ color: '#41291c',
    transparent: true, opacity: 0.28, depthWrite: false }));
  const tracks = new THREE.InstancedMesh(trackGeometry, trackMaterial, 1600);
  tracks.count = 0;
  tracks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tracks.frustumCulled = false;
  scene.add(tracks);
  let trackCursor = 0;

  const loader = new GLTFLoader();
  queueMicrotask(() => status('loading', 'Loading the Opportunity rover…'));
  loader.load(new URL('../../public/models/opportunity.glb', import.meta.url).href,
    (gltf) => {
      if (disposed) { disposeModel(gltf.scene); return; }
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const factor = 2.4 / Math.max(size.x, size.z, 0.001);
      model.scale.multiplyScalar(factor);
      model.updateMatrixWorld(true);
      bounds.setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= bounds.min.y;
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material.roughness !== undefined) material.roughness = Math.max(0.38, material.roughness);
          if (material.metalness !== undefined) material.metalness = Math.min(0.85, material.metalness);
        }
      });
      vehicle.add(model);
      modelReady = true;
      contacts.visible = true;
      groundRover();
      status('ready', 'Opportunity is ready. Drag to look around; use WASD or arrow keys to explore.');
      render();
    }, undefined,
    (error) => {
      if (disposed) return;
      modelFailed = true;
      status('error', 'The rover model could not load. Please reload to try again.');
      console.error('Opportunity model failed to load:', error);
    });

  const palettes = {
    dawn: { top: '#777374', horizon: '#e0b59a', lower: '#9b7058', fog: '#bb9276', density: .006,
      light: '#ffe2ba', intensity: 2.4, ambient: 1.7, exposure: .98, sun: 1 },
    day: { top: '#8d8072', horizon: '#e0bea0', lower: '#ac805d', fog: '#c4a184', density: .005,
      light: '#ffe9d0', intensity: 2.7, ambient: 1.9, exposure: .95, sun: 1 },
    sunset: { top: '#655b59', horizon: '#d5a071', lower: '#8f5d3e', fog: '#b58061', density: .008,
      light: '#ffd0a0', intensity: 2.5, ambient: 1.7, exposure: .98, sun: 1.2 },
    storm: { top: '#4d4136', horizon: '#a77b52', lower: '#6e4d33', fog: '#8c694b', density: .043,
      light: '#e9b67b', intensity: .85, ambient: 1.6, exposure: .85, sun: .12 },
    night: { top: '#101620', horizon: '#3e3d42', lower: '#342922', fog: '#282832', density: .018,
      light: '#9caac5', intensity: .35, ambient: .8, exposure: .95, sun: 0 },
    earth: { top: '#141c2b', horizon: '#6c6170', lower: '#3c302d', fog: '#373341', density: .012,
      light: '#b5c2d5', intensity: .65, ambient: 1.05, exposure: 1.05, sun: .15 },
  };

  const marker = new THREE.Group();
  const markerMaterial = own(new THREE.MeshBasicMaterial({ color: '#efd3a0',
    transparent: true, opacity: .7, depthWrite: false }));
  const markerRing = new THREE.Mesh(own(new THREE.RingGeometry(.66, .71, 48)), markerMaterial);
  markerRing.rotation.x = -Math.PI / 2;
  marker.add(markerRing);
  const markerStem = new THREE.Mesh(own(new THREE.CylinderGeometry(.008, .008, 1.25, 6)), markerMaterial);
  markerStem.position.y = .625;
  marker.add(markerStem);
  const markerTop = new THREE.Mesh(own(new THREE.OctahedronGeometry(.075)), markerMaterial);
  markerTop.position.y = 1.3;
  marker.add(markerTop);
  marker.visible = false;
  scene.add(marker);

  // An original link-orientation visualization, not a literal Earth position or
  // a simulated Deep Space Network antenna. It leaves the NASA model intact.
  const contactVisual = new THREE.Group();
  contactVisual.visible = false;
  scene.add(contactVisual);
  const beamGeometry = own(new THREE.BufferGeometry());
  beamGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const beamMaterial = own(new THREE.LineBasicMaterial({ color: '#f2d7a5',
    transparent: true, opacity: .78, depthWrite: false, toneMapped: false }));
  contactVisual.add(new THREE.Line(beamGeometry, beamMaterial));
  const aimMaterial = own(new THREE.MeshBasicMaterial({ color: '#ffe1a9',
    transparent: true, opacity: .9, depthWrite: false, toneMapped: false }));
  const beamTip = new THREE.Mesh(own(new THREE.SphereGeometry(.055, 10, 8)), aimMaterial);
  contactVisual.add(beamTip);
  const guide = new THREE.Group();
  const guideMaterial = own(new THREE.MeshBasicMaterial({ color: '#f7e7c9',
    transparent: true, opacity: .9, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  const guideOutline = own(new THREE.MeshBasicMaterial({color:'#17232a',transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  const outerGuide = new THREE.Mesh(own(new THREE.RingGeometry(.79,.83,64)),guideOutline);
  outerGuide.position.z=.006;guide.add(outerGuide);
  guide.add(new THREE.Mesh(own(new THREE.RingGeometry(.8, .82, 64)), guideMaterial));
  guide.add(new THREE.Mesh(own(new THREE.RingGeometry(.37, .39, 48)), guideMaterial));
  const guideCenter = new THREE.Mesh(own(new THREE.SphereGeometry(.035, 8, 6)), guideMaterial);
  guide.add(guideCenter);
  contactVisual.add(guide);
  const antennaCue = new THREE.Mesh(own(new THREE.RingGeometry(.09, .115, 32)), aimMaterial);
  contactVisual.add(antennaCue);

  const packetMaterial = own(new THREE.MeshBasicMaterial({ color: '#ffe1a9',
    transparent: true, opacity: .95, depthWrite: false, toneMapped: false }));
  const packet = new THREE.Mesh(beamTip.geometry, packetMaterial);
  packet.scale.setScalar(2.5);
  packet.visible = false;
  scene.add(packet);

  function cancelContactPulse() {
    contactPulse = null;
    packet.visible = false;
    if (!contactActive) contactVisual.visible = false;
    guide.visible = true;
    beamTip.visible = true;
    controls.enabled = !paused && !contactActive;
  }

  function sendContact(nextMode = 'reply') {
    if (disposed || paused || !contactFraming) return;
    cancelContactPulse();
    stopDrive();
    contactActive = false;
    contactInput = { x: 0, y: 0 };
    contactPulse = { mode: ['reply', 'partial', 'silence'].includes(nextMode) ? nextMode : 'reply',
      started: elapsed, start: contactOrigin.clone(), end: beamTip.position.clone() };
    controls.enabled = false;
    contactVisual.visible = true;
    guide.visible = false;
    beamTip.visible = false;
    beamMaterial.opacity = .2;
    packet.visible = true;
    packetMaterial.color.set('#ffe1a9');
    updateContactPulse();
    render();
  }

  function updateContactPulse() {
    if (!contactPulse) return;
    const time = elapsed - contactPulse.started;
    if (time >= 1.2) { cancelContactPulse(); return; }
    const returning = contactPulse.mode === 'reply' && time >= .65;
    let travel = returning ? 1 - THREE.MathUtils.clamp((time - .65) / .5, 0, 1)
      : THREE.MathUtils.clamp(time / .6, 0, 1);
    if (contactPulse.mode === 'partial') travel *= .78;
    packet.position.copy(contactPulse.start).lerp(contactPulse.end, reduced ? 0 : travel);
    packetMaterial.color.set(returning ? '#c7e1de' : '#ffe1a9');
    const fade = returning ? 1 - THREE.MathUtils.smoothstep(time, 1.08, 1.2)
      : contactPulse.mode === 'reply' ? 1 : 1 - THREE.MathUtils.smoothstep(time, .5, 1.05);
    packetMaterial.opacity = .95 * fade;
    beamMaterial.opacity = .14 * Math.max(.15, fade);
  }

  function contactFrame() {
    const horizontal = new THREE.Vector3(Math.sin(contactTargetYaw), 0, Math.cos(contactTargetYaw));
    const side = new THREE.Vector3(horizontal.z, 0, -horizontal.x);
    const halfFov = THREE.MathUtils.degToRad(camera.fov * .5);
    const range = Math.max(11.6, 4.8 / (2 * Math.tan(halfFov) * Math.max(.25, camera.aspect) * .82));
    const target = contactOrigin.clone().addScaledVector(contactDirection, 2.5);
    return { target, position: target.clone().addScaledVector(horizontal, -range)
      .addScaledVector(side, range * -.75).add(new THREE.Vector3(0, range * .17, 0)) };
  }

  function setContact(active, options = {}) {
    cancelContactPulse();
    if (!active) {
      contactActive = false;
      contactInput = { x: 0, y: 0 };
      contactVisual.visible = false;
      controls.enabled = !paused;
      render();
      return;
    }
    if (disposed) return;
    stopDrive();
    investigation = false;
    inspecting = false;
    roverFrame = null;
    look = { x: 0, y: 0 };
    contactActive = contactFraming = true;
    controls.enabled = false;
    controls.minDistance = 3.3;
    controls.maxDistance = 32;
    controls.minPolarAngle = .18;
    controls.maxPolarAngle = Math.PI * .475;
    vehicle.updateMatrixWorld(true);
    contactOrigin.copy(vehicle.localToWorld(new THREE.Vector3(-.43, 1.03, -.12)));
    contactTargetYaw = heading + .38;
    contactDirection.set(Math.sin(contactTargetYaw) * Math.cos(contactTargetPitch),
      Math.sin(contactTargetPitch), Math.cos(contactTargetYaw) * Math.cos(contactTargetPitch));
    contactYaw = contactTargetYaw - .4;
    contactPitch = contactTargetPitch - .15;
    contactInput = { x: 0, y: 0 };
    contactSampleTime = elapsed - .1;
    guide.position.copy(contactOrigin).addScaledVector(contactDirection, 7);
    guide.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), contactDirection);
    antennaCue.position.copy(contactOrigin);
    antennaCue.quaternion.copy(guide.quaternion);
    guideMaterial.color.set(options.mode === 'silence' ? '#cdd5db' : '#f7e7c9');
    contactVisual.visible = true;
    contactCamera = contactFrame();
    if (reduced) {
      camera.position.copy(contactCamera.position);
      controls.target.copy(contactCamera.target);
      cameraTween = null;
      controls.update();
    } else cameraTween = contactCamera;
    updateContact(0);
    render();
  }

  function setContactInput(value = {}) {
    const axis = number => Number.isFinite(Number(number)) ? THREE.MathUtils.clamp(Number(number), -1, 1) : 0;
    contactInput = contactActive ? { x: axis(value?.x), y: axis(value?.y) } : { x: 0, y: 0 };
  }

  function nudgeContact(value = {}) {
    if (!contactActive || paused || disposed) return;
    const angle = number => Number.isFinite(Number(number))
      ? THREE.MathUtils.clamp(Number(number), -.25, .25) : 0;
    // Pointer deltas are angular displacement, never a held velocity. Clear a
    // previous stick sample so a stationary finger cannot inherit stale motion.
    contactInput = { x: 0, y: 0 };
    contactYaw = THREE.MathUtils.clamp(contactYaw - angle(value?.x), contactTargetYaw - .7, contactTargetYaw + .7);
    contactPitch = THREE.MathUtils.clamp(contactPitch - angle(value?.y), .18, 1.15);
    contactSampleTime = elapsed - .1;
    updateContact(0);
    render();
  }

  function updateContact(delta) {
    if (!contactActive) return;
    contactYaw = THREE.MathUtils.clamp(contactYaw - contactInput.x * delta * .65,
      contactTargetYaw - .7, contactTargetYaw + .7);
    contactPitch = THREE.MathUtils.clamp(contactPitch - contactInput.y * delta * .5, .18, 1.15);
    const aim = new THREE.Vector3(Math.sin(contactYaw) * Math.cos(contactPitch),
      Math.sin(contactPitch), Math.cos(contactYaw) * Math.cos(contactPitch));
    const tip = contactOrigin.clone().addScaledVector(aim, 7);
    const positions = beamGeometry.attributes.position;
    positions.setXYZ(0, contactOrigin.x, contactOrigin.y, contactOrigin.z);
    positions.setXYZ(1, tip.x, tip.y, tip.z);
    positions.needsUpdate = true;
    beamGeometry.computeBoundingSphere();
    beamTip.position.copy(tip);
    const angle = Math.acos(THREE.MathUtils.clamp(aim.dot(contactDirection), -1, 1));
    const quality = 1 - THREE.MathUtils.smoothstep(angle, .1, .33);
    beamMaterial.opacity = .52 + quality * .33;
    if (!reduced) guideMaterial.opacity = .88 + Math.sin(elapsed * 1.7) * .035;
    if (elapsed - contactSampleTime >= .095) {
      contactSampleTime = elapsed;
      canvas.dispatchEvent(new CustomEvent('contact-sample', { bubbles: true, detail: { quality } }));
    }
  }

  function setObservationTarget(value) {
    if (!value || !observationTarget || value.x !== observationTarget.x || value.z !== observationTarget.z) investigation = false;
    observationTarget = value && Number.isFinite(value.x) && Number.isFinite(value.z)
      ? { x: value.x, z: value.z, label: value.label } : null;
    if (inspecting) {
      if (observationTarget) inspect();
      else focusRover();
    }
  }

  function setWaypoint(value) {
    route = null;
    if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.z)) {
      waypoint = null;
      marker.visible = false;
      render();
      return;
    }
    const radius = Math.hypot(value.x, value.z);
    const scale = radius > 17 ? 17 / radius : 1;
    waypoint = { x: value.x * scale, z: value.z * scale, label: value.label || 'Observation site', reached: false };
    marker.position.set(waypoint.x, heightAt(waypoint.x, waypoint.z) + .045, waypoint.z);
    marker.visible = mode === 'game';
    // Notify asynchronously so the caller can finish installing its state first.
    queueMicrotask(checkArrival);
    render();
  }

  function checkArrival() {
    if (!waypoint || waypoint.reached || disposed || mode !== 'game') return;
    const remaining = Math.hypot(vehicle.position.x - waypoint.x, vehicle.position.z - waypoint.z);
    if (remaining > 1.7) return;
    waypoint.reached = true;
    marker.visible = false;
    stopDrive();
    canvas.dispatchEvent(new CustomEvent('waypoint-reached', { bubbles: true,
      detail: { x: waypoint.x, z: waypoint.z, label: waypoint.label, distance } }));
  }

  function blockedAt(x, z, margin = .8) {
    return Math.hypot(x, z) > 19 || collisions.some((rock) =>
      Math.hypot(x - rock.x, z - rock.z) < rock.radius + margin);
  }

  function travelToWaypoint() {
    if (!waypoint || waypoint.reached || !modelReady || paused || mode !== 'game') return false;
    drive = { forward: 0, turn: 0 };
    const cell = .8;
    const start = { x: Math.round(vehicle.position.x / cell), z: Math.round(vehicle.position.z / cell) };
    const id = (x, z) => `${x},${z}`;
    const startId = id(start.x, start.z);
    const open = [{ ...start, cost: 0, score: 0 }];
    const best = new Map([[startId, 0]]);
    const previousNode = new Map();
    let found = null;
    let visits = 0;
    while (open.length && visits < 3500) {
      open.sort((a, b) => a.score - b.score);
      const current = open.shift();
      visits += 1;
      if (Math.hypot(current.x * cell - waypoint.x, current.z * cell - waypoint.z) < 1.25) {
        found = current;
        break;
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const x = current.x + dx, z = current.z + dz;
        if (blockedAt(x * cell, z * cell, 1.0)
          || blockedAt((current.x + dx * .5) * cell, (current.z + dz * .5) * cell, 1.0)) continue;
        const nextId = id(x, z);
        const cost = current.cost + Math.hypot(dx, dz);
        if (best.has(nextId) && best.get(nextId) <= cost) continue;
        best.set(nextId, cost);
        previousNode.set(nextId, id(current.x, current.z));
        open.push({ x, z, cost,
          score: cost + Math.hypot(x - waypoint.x / cell, z - waypoint.z / cell) });
      }
    }
    if (!found) {
      canvas.dispatchEvent(new CustomEvent('navigation-status', { bubbles: true,
        detail: { state: 'blocked', message: 'No clear route. Drive toward the marker to explore another approach.' } }));
      return false;
    }
    route = [];
    let cursor = id(found.x, found.z);
    while (cursor !== startId) {
      const [x, z] = cursor.split(',').map(Number);
      route.unshift({ x: x * cell, z: z * cell });
      cursor = previousNode.get(cursor);
      if (!cursor) break;
    }
    motion.reset();
    if (inspecting) returnFromInspection();
    else cameraTween = null;
    return true;
  }

  function setScene(next, state = {}) {
    environment = Object.hasOwn(palettes, next) ? next : 'dawn';
    canDrive = !(state.power === 0 || state.signal === 0);
    if (!canDrive) stopDrive();
    planetState = palettes[environment];
    if (reduced) applyPalette(1);
    render();
  }
  function applyPalette(blend) {
    if (!planetState) return;
    for (const key of ['top', 'horizon', 'lower']) {
      skyUniforms[key].value.lerp(new THREE.Color(planetState[key]), blend);
    }
    skyUniforms.sunStrength.value = THREE.MathUtils.lerp(skyUniforms.sunStrength.value, planetState.sun, blend);
    // Static PMREM retains a stable light direction; fade its energy with the sky.
    scene.environmentIntensity = THREE.MathUtils.lerp(scene.environmentIntensity,
      environment === 'night' ? .08 : environment === 'storm' ? .18 : environment === 'earth' ? .12 : .48, blend);
    scene.fog.color.lerp(new THREE.Color(planetState.fog), blend);
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, planetState.density, blend);
    sun.color.lerp(new THREE.Color(planetState.light), blend);
    sun.intensity = THREE.MathUtils.lerp(sun.intensity, planetState.intensity, blend);
    hemisphere.intensity = THREE.MathUtils.lerp(hemisphere.intensity, planetState.ambient, blend);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, planetState.exposure, blend);
    dustMaterial.opacity = THREE.MathUtils.lerp(dustMaterial.opacity, environment === 'storm' ? .47 : .14, blend);
    dustMaterial.size = environment === 'storm' ? .08 : .035;
  }

  function desiredFrame(inspect = false) {
    const narrow = camera.aspect < 0.85;
    if (inspect && observationTarget) {
      const site = observationSites.find(site => Math.hypot(site.x - observationTarget.x,
        site.z - observationTarget.z) < .5);
      const target = site ? site.target.clone() : new THREE.Vector3(observationTarget.x,
        surfaceHeight(observationTarget.x, observationTarget.z) + .45, observationTarget.z);
      const offset = site ? site.offset.clone() : new THREE.Vector3(2.4, 2.1, 3.2);
      // Fit the actual ~3.2 m subject across the horizontal field of view.
      // A fixed portrait multiplier fails on tall phones because OrbitControls
      // then clamps it back to the old desktop zoom limit.
      const halfFov = THREE.MathUtils.degToRad(camera.fov * .5);
      const horizontalFit = 3.25 / (2 * Math.tan(halfFov) * Math.max(camera.aspect, .2) * .82);
      const verticalFit = 1.65 / (2 * Math.tan(halfFov) * .52);
      const fitDistance = Math.max(offset.length(), horizontalFit + .8, verticalFit + .8);
      offset.setLength(fitDistance);
      controls.maxDistance = Math.max(site?.max || 7, fitDistance * 1.45);
      return { position: target.clone().add(offset), target };
    }
    const offset = inspect ? new THREE.Vector3(3.2, 1.65, 3.8)
      : mode === 'ending' ? new THREE.Vector3(6.5, 3.4, 9.3)
        : new THREE.Vector3(narrow ? 5.3 : 5.6, narrow ? 3.3 : 2.5, narrow ? 8.3 : 7.7);
    const target = vehicle.position.clone().add(new THREE.Vector3(mode==='title' && !narrow ? -1.7 : 0, 0.75, 0));
    if (inspect) target.copy(vehicle.position).add(new THREE.Vector3(0, 0.75, 0));
    return { position: vehicle.position.clone().add(offset), target };
  }
  function focusRover(immediate = false) {
    if (disposed) return;
    cancelContactPulse();
    if (contactActive) setContact(false);
    contactFraming = false;
    contactCamera = null;
    inspecting = false;
    roverFrame = null;
    controls.minDistance = 3.3;
    controls.maxDistance = 28;
    controls.minPolarAngle = .32;
    controls.maxPolarAngle = Math.PI * .475;
    const desired = desiredFrame(false);
    if (immediate || reduced) {
      camera.position.copy(desired.position);
      controls.target.copy(desired.target);
      cameraTween = null;
      controls.update();
      render();
    } else cameraTween = desired;
  }
  function inspect(immediate = false) {
    if (disposed) return;
    cancelContactPulse();
    if (contactActive) setContact(false);
    contactFraming = false;
    contactCamera = null;
    if (!inspecting) roverFrame = {
      position: camera.position.clone().sub(vehicle.position),
      target: controls.target.clone().sub(vehicle.position),
    };
    inspecting = true;
    const site = observationSites.find(site => observationTarget
      && Math.hypot(site.x - observationTarget.x, site.z - observationTarget.z) < .5);
    controls.minDistance = site?.min || 2.3;
    controls.maxDistance = site?.max || 7;
    controls.minPolarAngle = .32;
    controls.maxPolarAngle = Math.PI * .43;
    cameraTween = desiredFrame(true);
    if (reduced || immediate) {
      camera.position.copy(cameraTween.position);
      controls.target.copy(cameraTween.target);
      cameraTween = null;
      controls.update();
      render();
    }
  }

  function returnFromInspection() {
    if (!inspecting) return;
    const previousFrame = roverFrame;
    inspecting = false;
    roverFrame = null;
    controls.minDistance = 3.3;
    controls.maxDistance = 28;
    controls.minPolarAngle = .32;
    controls.maxPolarAngle = Math.PI * .475;
    const desired = previousFrame ? {
      position: vehicle.position.clone().add(previousFrame.position),
      target: vehicle.position.clone().add(previousFrame.target),
    } : desiredFrame(false);
    if (reduced) {
      camera.position.copy(desired.position);
      controls.target.copy(desired.target);
      cameraTween = null;
      controls.update();
    } else cameraTween = { ...desired, follow: true };
  }

  function setInvestigation(active) {
    const site = observationSites.find(site => observationTarget
      && Math.hypot(site.x - observationTarget.x, site.z - observationTarget.z) < .5);
    investigation = Boolean(active && site);
    sampleTime = elapsed;
    if (!investigation) return;
    stopDrive();
    if (!inspecting) inspect();
    const desired = desiredFrame(true);
    const fittedDistance = desired.position.distanceTo(desired.target);
    // Begin beside the exposed face (or low beside the grain-bearing surface).
    // Orbiting then reveals real geometry; there is no concealed image/reticle.
    const oblique = site.kind === 'layers' ? new THREE.Vector3(3.8, 1.1, 1.1)
      : new THREE.Vector3(.7, 1.1, 3.8);
    desired.position.copy(desired.target).add(oblique.setLength(fittedDistance));
    if (reduced) {
      camera.position.copy(desired.position);
      controls.target.copy(desired.target);
      cameraTween = null;
      controls.update();
      render();
    } else cameraTween = desired;
    samplePosition.copy(camera.position);
    camera.getWorldDirection(sampleDirection);
  }

  function sampleInspection() {
    if (!investigation || elapsed - sampleTime < .1) return;
    const site = observationSites.find(site => observationTarget
      && Math.hypot(site.x - observationTarget.x, site.z - observationTarget.z) < .5);
    if (!site) { investigation = false; return; }
    const interval = Math.max(.001, elapsed - sampleTime);
    sampleTime = elapsed;
    const view = camera.position.clone().sub(site.target);
    const actualDistance = view.length();
    const face = view.normalize().dot(site.normal);
    const facing = THREE.MathUtils.smoothstep(face, site.kind === 'layers' ? .48 : .38,
      site.kind === 'layers' ? .82 : .72);
    const desired = desiredFrame(true);
    const ratio = actualDistance / desired.position.distanceTo(desired.target);
    const proximity = THREE.MathUtils.smoothstep(ratio, .42, .68)
      * (1 - THREE.MathUtils.smoothstep(ratio, 1.25, 1.65));
    const direction = camera.getWorldDirection(new THREE.Vector3());
    const angularSpeed = direction.angleTo(sampleDirection) / interval;
    const relativeSpeed = camera.position.distanceTo(samplePosition) / Math.max(actualDistance, .1) / interval;
    const steady = !cameraTween && angularSpeed < .16 && relativeSpeed < .12;
    const quality = THREE.MathUtils.clamp(facing * proximity, 0, 1);
    const hint = ratio > 1.3 ? 'Move closer' : ratio < .65 ? 'Pull back a little'
      : facing < .75 ? (site.kind === 'layers' ? 'Turn toward the layered face' : 'Look down at the grains')
        : 'Hold this view';
    samplePosition.copy(camera.position);
    sampleDirection.copy(direction);
    canvas.dispatchEvent(new CustomEvent('inspection-sample', { bubbles: true,
      detail: { quality, steady, hint } }));
  }

  function stopDrive() {
    const notifyStop = wasMoving;
    drive = { forward: 0, turn: 0 };
    contactInput = { x: 0, y: 0 };
    route = null;
    motion.reset();
    wasMoving = false;
    if (notifyStop && !disposed) {
      const detail = { ...sampleSurface(surfaceHeight, { x: vehicle.position.x,
        z: vehicle.position.z, heading, speed: 0, blocked: false }),
        x: vehicle.position.x, z: vehicle.position.z, distance, blocked: false,
        remaining: waypoint ? Math.hypot(vehicle.position.x - waypoint.x, vehicle.position.z - waypoint.z) : 0 };
      canvas.dispatchEvent(new CustomEvent('world-drive', { bubbles: true, detail }));
      canvas.dispatchEvent(new CustomEvent('rover-move', { bubbles: true, detail }));
    }
  }

  function addTracks() {
    if (lastTrackPosition.distanceTo(vehicle.position) < .14) return;
    lastTrackPosition.copy(vehicle.position);
    for (const side of [-1, 1]) {
      const x = vehicle.position.x + Math.cos(heading) * .69 * side;
      const z = vehicle.position.z - Math.sin(heading) * .69 * side;
      dummy.position.set(x, heightAt(x, z) + .025, z);
      dummy.rotation.set(0, heading, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tracks.setMatrixAt(trackCursor % 1600, dummy.matrix);
      trackCursor += 1;
    }
    tracks.count = Math.min(trackCursor, 1600);
    tracks.instanceMatrix.needsUpdate = true;
  }

  function moveRover(delta) {
    if (mode !== 'game' || !modelReady || modelFailed || !canDrive || investigation || contactActive || contactPulse) return;
    let forward = THREE.MathUtils.clamp(drive.forward, -1, 1);
    let turn = THREE.MathUtils.clamp(drive.turn, -1, 1);
    if (forward || turn) route = null;
    const assisted = Boolean(route?.length);
    if (assisted) {
      let target = route[0];
      if (Math.hypot(target.x - vehicle.position.x, target.z - vehicle.position.z) < .38) {
        route.shift();
        target = route[0];
      }
      if (target) {
        const aim = Math.atan2(target.x - vehicle.position.x, target.z - vehicle.position.z);
        const difference = Math.atan2(Math.sin(aim - heading), Math.cos(aim - heading));
        turn = THREE.MathUtils.clamp(difference * 2.5, -1, 1);
        forward = Math.abs(difference) < .9 ? Math.max(.2, 1 - Math.abs(difference)) : 0;
      } else route = null;
    }
    const velocity = motion.step({ forward, turn, assisted }, delta);
    const moving = Boolean(velocity.speed || velocity.turnRate);
    if (!moving && !wasMoving) return;
    wasMoving = moving;
    if (inspecting && moving) returnFromInspection();
    if (cameraTween && !cameraTween.follow) cameraTween = null;
    heading += velocity.turnRate * delta;
    const step = velocity.speed * delta;
    const dx = Math.sin(heading) * step;
    const dz = Math.cos(heading) * step;
    const nx = vehicle.position.x + dx, nz = vehicle.position.z + dz;
    const blocked = blockedAt(nx, nz);
    if (!blocked) {
      const old = vehicle.position.clone();
      vehicle.position.x = nx;
      vehicle.position.z = nz;
      // Compute the actual grounded position before moving the camera. Mixing
      // analytic and triangle-interpolated heights here accumulates camera drift.
      groundRover();
      const shift = vehicle.position.clone().sub(old);
      camera.position.add(shift);
      controls.target.add(shift);
      if (cameraTween?.follow) {
        cameraTween.position.add(shift);
        cameraTween.target.add(shift);
      }
      distance += Math.abs(step);
      if (!reduced) addTracks();
    }
    if (blocked && step) motion.reset();
    groundRover();
    if (!moving || elapsed - eventTime > .08) {
      eventTime = elapsed;
      const texture=sampleSurface(surfaceHeight,{x:vehicle.position.x,z:vehicle.position.z,heading,speed:blocked ? 0 : Math.abs(velocity.speed),blocked});
      const detail = { ...texture, x: vehicle.position.x, z: vehicle.position.z, distance, blocked,
        remaining: waypoint ? Math.hypot(vehicle.position.x - waypoint.x, vehicle.position.z - waypoint.z) : 0 };
      canvas.dispatchEvent(new CustomEvent('world-drive', { bubbles: true, detail }));
      canvas.dispatchEvent(new CustomEvent('rover-move', { bubbles: true, detail }));
    }
    checkArrival();
  }

  function groundRover() {
    vehicle.rotation.set(0, heading, 0);
    // Subtle chassis tilt makes wheel contact follow the actual ground surface.
    const ahead = surfaceHeight(vehicle.position.x + Math.sin(heading) * .65,
      vehicle.position.z + Math.cos(heading) * .65);
    const behind = surfaceHeight(vehicle.position.x - Math.sin(heading) * .65,
      vehicle.position.z - Math.cos(heading) * .65);
    vehicle.rotateX(Math.atan2(behind - ahead, 1.3));
    const left = surfaceHeight(vehicle.position.x - Math.cos(heading) * .65,
      vehicle.position.z + Math.sin(heading) * .65);
    const right = surfaceHeight(vehicle.position.x + Math.cos(heading) * .65,
      vehicle.position.z - Math.sin(heading) * .65);
    vehicle.rotateZ(Math.atan2(right - left, 1.3));
    const supports = wheelContacts.map((contact) => contact.clone().applyQuaternion(vehicle.quaternion));
    vehicle.position.y = supports.reduce((sum, support) => sum
      + surfaceHeight(vehicle.position.x + support.x, vehicle.position.z + support.z) - support.y, 0)
      / supports.length - .006;
    supports.forEach((support, i) => {
      const x = vehicle.position.x + support.x, z = vehicle.position.z + support.z;
      dummy.position.set(x, surfaceHeight(x, z) + .008, z);
      dummy.rotation.set(0, heading, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      contacts.setMatrixAt(i, dummy.matrix);
    });
    contacts.instanceMatrix.needsUpdate = true;
  }

  function render() {
    if (disposed) return;
    // Orbiting and following the rover must never put the eye beneath a dune.
    const ground = surfaceHeight(camera.position.x, camera.position.z);
    const targetGround = surfaceHeight(controls.target.x, controls.target.z);
    if (camera.position.y < ground + .85) camera.position.y = ground + .85;
    if (controls.target.y < targetGround + .45) controls.target.y = targetGround + .45;
    camera.lookAt(controls.target);
    renderer.render(scene, camera);
  }
  function animate(now) {
    frame = 0;
    if (disposed) return;
    const delta = Math.min((now - (previous || now)) / 1000, .05);
    previous = now;
    if (!paused && !document.hidden) {
      elapsed += delta;
      updateContactPulse();
      updateContact(delta);
      moveRover(delta);
      if (!reduced) {
        const speed = environment === 'storm' ? 6.0 : .35;
        for (let i = 0; i < dustCount; i += 1) {
          dustPositions[i * 3] += delta * speed;
          if (dustPositions[i * 3] > 40) dustPositions[i * 3] -= 80;
        }
        dustGeometry.attributes.position.needsUpdate = true;
      }
      applyPalette(reduced ? 1 : 1 - Math.exp(-delta * .85));
      if (cameraTween) {
        const amount = 1 - Math.exp(-delta * 3.2);
        camera.position.lerp(cameraTween.position, amount);
        controls.target.lerp(cameraTween.target, amount);
        if (camera.position.distanceTo(cameraTween.position) < .015) cameraTween = null;
      }
      if(!contactActive && !contactPulse && (look.x || look.y)) {
        cameraTween=null;
        const offset=camera.position.clone().sub(controls.target);
        const orbit=new THREE.Spherical().setFromVector3(offset);
        orbit.theta-=look.x*delta*1.6;
        orbit.phi=THREE.MathUtils.clamp(orbit.phi+look.y*delta*1.2,controls.minPolarAngle,controls.maxPolarAngle);
        camera.position.copy(controls.target).add(offset.setFromSpherical(orbit));
      }
      controls.update();
      render();
      sampleInspection();
    }
    frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    const previousAspect = camera.aspect;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (inspecting && Math.abs(camera.aspect / previousAspect - 1) > .08) inspect(true);
    if (contactFraming && Math.abs(camera.aspect / previousAspect - 1) > .08) {
      contactCamera = contactFrame();
      camera.position.copy(contactCamera.position);
      controls.target.copy(contactCamera.target);
      cameraTween = null;
      controls.update();
    }
    render();
  }
  function blur() { stopDrive(); contactInput = { x: 0, y: 0 }; }
  function contextLost(event) {
    event.preventDefault();
    paused = true;
    cancelContactPulse();
    stopDrive();
    status('error', 'The 3D view was interrupted. Reload to restore the rover.');
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('blur', blur);
  canvas.addEventListener('webglcontextlost', contextLost);
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  resize();
  focusRover(true);
  setScene('sunset');
  applyPalette(1);
  frame = requestAnimationFrame(animate);

  return {
    setScene,
    setMode(value) {
      const nextMode = ['title', 'game', 'ending'].includes(value) ? value : 'title';
      if (nextMode === mode) return;
      mode = nextMode;
      stopDrive();
      marker.visible = mode === 'game' && Boolean(waypoint && !waypoint.reached);
      focusRover();
    },
    stopDrive,
    setInvestigation,
    setContact,
    setContactInput,
    nudgeContact,
    sendContact,
    cancelContactPulse,
    setDrive(value = {}) {
      if (value.forward || value.turn) route = null;
      drive = {
        forward: THREE.MathUtils.clamp(Number(value.forward) || 0, -1, 1),
        turn: THREE.MathUtils.clamp(Number(value.turn) || 0, -1, 1),
      };
    },
    setLook(value={}) {
      look={x:THREE.MathUtils.clamp(Number(value.x)||0,-1,1),y:THREE.MathUtils.clamp(Number(value.y)||0,-1,1)};
    },
    setReducedMotion(value) {
      reduced = Boolean(value);
      controls.enableDamping = !reduced;
      if (reduced && cameraTween) {
        camera.position.copy(cameraTween.position);
        controls.target.copy(cameraTween.target);
        cameraTween = null;
        controls.update();
      }
      applyPalette(1);
      render();
    },
    setPaused(value) {
      paused = Boolean(value);
      controls.enabled = !paused && !contactActive && !contactPulse;
      if (paused) {cancelContactPulse();blur();look={x:0,y:0};}
      previous = 0;
    },
    focusRover,
    inspect,
    setWaypoint,
    setObservationTarget,
    travelToWaypoint,
    reset() {
      route = null;
      waypoint = null;
      observationTarget = null;
      investigation = false;
      setContact(false);
      contactFraming = false;
      marker.visible = false;
      stopDrive();
      distance = 0;
      eventTime = 0;
      heading = -.45;
      vehicle.position.set(0, surfaceHeight(0, 0), 0);
      groundRover();
      trackCursor = 0;
      tracks.count = 0;
      lastTrackPosition.copy(vehicle.position);
      canDrive = true;
      focusRover(true);
      render();
    },
    destroy() {
      if (disposed) return;
      cancelContactPulse();
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('webglcontextlost', contextLost);
      controls.dispose();
      vehicle.traverse((object) => { if (object.isMesh) disposeModel(object); });
      for (const resource of resources) resource.dispose?.();
      for (const field of rockField) field.dispose();
      pebbles.dispose();
      grains.dispose();
      tracks.dispose();
      contacts.dispose();
      renderer.dispose();
    },
  };
}

// Scanned roughness files can contain nearly black values: multiplying those
// by roughness=1 still produces a mirror. Dust retains high microsurface
// roughness everywhere while preserving subtle scanned variation above a floor.
function setDrySurface(material, floor) {
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>\nroughnessFactor = ${floor.toFixed(3)} + ${(1 - floor).toFixed(3)} * clamp(roughnessFactor, 0.0, 1.0);`);
  };
  material.customProgramCacheKey = () => `dry-mineral-${floor.toFixed(3)}`;
}

function setTerrainVariation(material) {
  const dryCompile = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    dryCompile(shader);
    shader.vertexShader = 'varying vec3 vSurfacePosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvSurfacePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = 'varying vec3 vSurfacePosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec2 terrainUv = vMapUv + .065 * vec2(sin(vSurfacePosition.z * .37), sin(vSurfacePosition.x * .29));
        vec2 rotatedUv = mat2(.71, -.71, .71, .71) * terrainUv * .61 + vec2(.37, .63);
        vec3 fineSoil = texture2D(map, terrainUv).rgb;
        vec3 broadSoil = texture2D(map, rotatedUv).rgb;
        float surfacePatch = .5 + .5 * sin(vSurfacePosition.x * .19 + sin(vSurfacePosition.z * .14) * 2.0);
        vec3 soil = mix(fineSoil, broadSoil, .18 + .25 * surfacePatch);
        float detail = 1.0 - smoothstep(12.0, 55.0, length(vViewPosition));
        float macro = .94 + .09 * sin(vSurfacePosition.x * .11 + vSurfacePosition.z * .07)
          + .045 * sin(vSurfacePosition.z * .23 - vSurfacePosition.x * .04);
        soil = mix(vec3(.38, .32, .25) * macro, soil, .78 * detail);
        diffuseColor.rgb *= soil;
      #endif`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>',
      THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;',
        'mapN.xy *= normalScale * mix(.12, 1.0, 1.0 - smoothstep(10.0, 45.0, length(vViewPosition)));'));
  };
  material.customProgramCacheKey = () => 'dry-terrain-macro-v1';
}

function setSedimentSurface(material) {
  const dryCompile = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    dryCompile(shader);
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec3 sedimentSample = texture2D(map, vMapUv).rgb;
        float mineralGrain = dot(sedimentSample, vec3(.2126, .7152, .0722));
        // Generic scanned fractures must not masquerade as the authored strata.
        diffuseColor.rgb *= vec3(.82, .80, .75) * (.85 + .25 * mineralGrain);
      #endif`);
  };
  material.customProgramCacheKey = () => 'dry-light-sediment-v1';
}

function makeRockGeometry(variant) {
  const source = new THREE.IcosahedronGeometry(1, 3);
  const vertices = source.attributes.position;
  for (let i = 0; i < vertices.count; i += 1) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const erosion = .91 + fbm(x * 2.9 + variant * 11, z * 3.1 + y * 2.5) * .23;
    // Broad fractured planes break the uniform potato silhouette; fine relief
    // comes from scanned normals, rather than adding thousands more triangles.
    const px = THREE.MathUtils.clamp(x, -.83 + variant * .025, .88 - variant * .035);
    const py = THREE.MathUtils.clamp(y, -.78, .84 + variant * .025);
    const pz = THREE.MathUtils.clamp(z, -.87, .82);
    vertices.setXYZ(i, px * erosion + .055 * Math.sin(y * 5 + variant),
      py * erosion + .035 * Math.sin(x * 7 + z * 4), pz * erosion);
  }
  source.deleteAttribute('normal');
  const geometry = mergeVertices(source, .0001);
  geometry.computeVertexNormals();
  source.dispose();
  return geometry;
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function hash(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), ux),
    THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux), uy);
}
function fbm(x, y) {
  let sum = 0, amplitude = .55;
  for (let i = 0; i < 4; i += 1) {
    sum += (noise(x, y) * 2 - 1) * amplitude;
    x = x * 2.03 + 11.1;
    y = y * 2.03 + 7.7;
    amplitude *= .5;
  }
  return sum;
}
function makeSoilTexture(random) {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const grain = random() * 36;
      const ripple = Math.sin(y * .18 + Math.sin(x * .04) * 2) * 10;
      const value = Math.round(174 + grain + ripple + noise(x * .18, y * .18) * 32);
      pixels[i] = value;
      pixels[i + 1] = value;
      pixels[i + 2] = value;
      pixels[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(65, 65);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
function disposeModel(model) {
  const dispose = (object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material || {})) {
        if (value?.isTexture) value.dispose();
      }
      material?.dispose();
    }
  };
  if (model.isMesh) dispose(model);
  else model.traverse(dispose);
}
