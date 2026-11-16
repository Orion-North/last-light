import { refineLastChance, refineBerryBowl } from './world-geology-refinement.js';
import { convexHull, componentHulls, clearRoverPose, sweepRover, clearCamera } from '../engine/rock-collision.js';
import { createGeologyTool } from '../engine/geology-tool.js';
import { createSky } from './sky.js';
import { createDriveMotion } from '../engine/drive-motion.js';
import { sampleSurface } from '../input/surface.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A real, navigable Martian diorama. NASA's rover is loaded from a local GLB. */
export function createLandscape(canvas) {
  const noop = () => {};
  const empty = { capturePhoto: async () => null, setDiscoveryCamera: () => false, setDiscoveryCameraFrozen: noop, setToolMode: () => false, setToolInput: noop, compareToolSamples: () => false, setMissionAge: noop, setScene: noop, setPaused: noop,
    setMode: noop, setIntro: noop, previewMemory: noop, revealFirstView: noop, setRemoteView: noop, setDrive: noop, stopDrive: noop, setSurvey: noop, setInvestigation: noop, setContact: noop, setContactInput: noop, nudgeContact: noop, sendContact: noop, cancelContactPulse: noop, focusRover: noop, inspect: noop,
    setWaypoint: noop, setObservationTarget: noop, reset: noop, destroy: noop };
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
  let mode = 'title';
  let environment = 'sunset';
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let modelReady = false;
  // Artistic mission-era finish, independent of power, weather and driving.
  const missionAge = { value: 0 };
  const agedMaterials = new Set();
  let modelFailed = false;
  let canDrive = true;
  let eventTime = 0;
  let heading = -0.45;
  let drive = { forward: 0, turn: 0 };
  const motion = createDriveMotion();
  let wasMoving = false;
  let roverFrame = null;
  let evidence = null, retainedTool = null;
  let discoveryCamera = null, discoveryPointer = null, discoverySampleTime = -1;
  let tool = null, toolPointer = null, toolSampleTime = 0;
  let investigation = false;
  let inspectionOrigin = null;
  let inspectionTravel = 0;
  let orbitGesture = false;
  let survey = null;
  let surveySampleTime = 0;
  let surveyPointer = null;
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
  let guidanceTime = -Infinity;
  let samplePosition = new THREE.Vector3();
  let sampleDirection = new THREE.Vector3();
  let distance = 0;
  let look = {x:0,y:0};
  let lastManualLook = -Infinity;
  let lastTrackPosition = new THREE.Vector3();
  let cameraTween = null;
  let cameraLensTarget = 43;
  let intro = null;
  let waypoint = null;
  let observationTarget = null;
  let inspecting = false;
  let remoteView = false;
  let memoryPreview = null;
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
  controls.addEventListener('start', () => { cameraTween = null; orbitGesture = true; });
  controls.addEventListener('end', () => { orbitGesture = false; });
  controls.addEventListener('change', () => { if (paused) render(); });

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
  const collisions = [], cameraRocks = [];
  const roverFootprint = { halfWidth:.65, halfLength:.85, groundHeight:surfaceHeight };
  function registerRock(bounds,points) {
    const b={minX:bounds.min.x,maxX:bounds.max.x,minY:bounds.min.y,maxY:bounds.max.y,minZ:bounds.min.z,maxZ:bounds.max.z};
    cameraRocks.push(b);
    const x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2;
    // Test protrusion at visible vertices, not the ground at a box's center.
    // Wheel-sized loose stones are traversable; buried geometry cannot block air.
    if(Math.hypot(x,z)>=24)return;
    const visible=points.filter(p=>p.y-surfaceHeight(p.x,p.z)>.08);
    if(!visible.some(p=>p.y-surfaceHeight(p.x,p.z)>.20))return;
    const hull=convexHull(visible);
    if(hull.length>=3)collisions.push({...b,hull});
  }
  function registerInstance(geometry,matrix) {
    if(!geometry.boundingBox)geometry.computeBoundingBox();
    const points=[],position=geometry.attributes.position;
    for(let i=0;i<position.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(matrix));
    registerRock(geometry.boundingBox.clone().applyMatrix4(matrix),points);
  }
  function registerLandmark(object) {
    object.updateMatrixWorld(true);
    object.traverse(mesh=>{if(mesh.isMesh&&!mesh.isInstancedMesh)registerInstance(mesh.geometry,mesh.matrixWorld);});
  }
  for (let i = 0; i < rockCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 4.5 + Math.pow(random(), 0.8) * 94;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    let size = 0.12 + Math.pow(random(), 3) * 1.75;
    if (radius < 14) size = Math.min(size, .4);
    const flatness = 0.28 + random() * 0.34;
    dummy.position.set(x, surfaceHeight(x, z) + size * flatness * 0.42, z);
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
    registerInstance(field.geometry,dummy.matrix);
  }
  const pebbleGeometry = own(new THREE.IcosahedronGeometry(1, 0));
  const pebbles = new THREE.InstancedMesh(pebbleGeometry, rockMaterial, 1100);
  pebbles.receiveShadow = true;
  for (let i = 0; i < pebbles.count; i += 1) {
    const x = (random() - 0.5) * 75, z = (random() - 0.5) * 75;
    const size = 0.025 + random() * 0.085;
    dummy.position.set(x, surfaceHeight(x, z) + size * 0.25, z);
    dummy.rotation.set(random(), random() * 6.28, random());
    dummy.scale.set(size * 1.4, size * 0.45, size);
    if (Math.hypot(x - 7, z + 7) < 2.2 || Math.hypot(x + 5, z + 10) < 2.2) dummy.scale.multiplyScalar(.45);
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
  scene.add(pebbles);

  // Persistent fieldwork landmarks, not surveyed reconstructions. Geometry and
  // grain scale favor recognition on phones; interpretation lives in content.
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
    material.userData.normalStrength = .42;
  });
  // Clockwise weathered silhouette: broad low shoulders, chipped rising crown.
  const outcropOutline = [[-1.5, .06], [-1.32, .58], [-1.03, .99],
    [-.63, 1.36], [-.13, 1.3], [.43, 1.13], [.99, .86],
    [1.48, .13], [.92, -.09], [-.91, -.07]];
  const lastChance = new THREE.Group();
  const laminaBatches = strataMaterials.map(() => []);
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
      let geometry = own(new THREE.ExtrudeGeometry(shape, { depth: .72,
        bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: .017, bevelThickness: .012 }));
      const vertices = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      const faceNormals = geometry.attributes.normal;
      for (let i = 0; i < vertices.count; i += 1) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        // Continuous metre-scale mapping on the exposed face, independent of
        // triangulation and individual lamina shape. Side faces use their depth.
        const front = Math.abs(faceNormals.getZ(i)) > .6;
        uv.setXY(i, (front ? x : x + z) * 1.35, y * 1.35);
        vertices.setXYZ(i, x + .016 * Math.sin(y * 19 + z * 7),
          y + .065 * Math.sin(x * 2.3 + packet * 1.7) + .014 * Math.sin(x * 13 + z * 5),
          z + .035 * noise(x * 8 + 12, y * 9)
            + .07 * Math.sin(x * 2.8 + packet) - .045 * Math.cos(y * 11 + x * 3));
      }
      vertices.needsUpdate = true;
      // ExtrudeGeometry is non-indexed: recomputing normals directly produces
      // a visibly faceted fan on each broad cap. Weld before smoothing instead.
      geometry.deleteAttribute('normal');
      const source = geometry;
      geometry = own(mergeVertices(source, .0001));
      resources.delete(source); source.dispose();
      geometry.computeVertexNormals();
      geometry.translate(0, 0, -.18 + Math.sin(band * 2.4 + packet) * .016);
      laminaBatches[(band + 12 + packet) % 4].push(geometry);
    }
  }
  // Four material batches instead of one draw call per lamina.
  laminaBatches.forEach((batch, index) => {
    if (!batch.length) return;
    const geometry = own(mergeGeometries(batch));
    batch.forEach(part => { resources.delete(part); part.dispose(); });
    const mesh = new THREE.Mesh(geometry, strataMaterials[index]);
    mesh.castShadow = mesh.receiveShadow = true;
    lastChance.add(mesh);
  });
  const outcropBack = new THREE.Mesh(rockGeometries[1], strataMaterials[1]);
  outcropBack.position.set(-.08, .45, -.35);
  outcropBack.scale.set(1.35, .65, .57);
  outcropBack.castShadow = outcropBack.receiveShadow = true;
  lastChance.add(outcropBack);
  scene.add(lastChance);
  lastChance.updateMatrixWorld(true);
  refineLastChance({ THREE, group: lastChance, own, materials: strataMaterials });
  registerLandmark(lastChance);
  observationSites.push({ x: 7, z: -7,
    target: lastChance.position.clone().add(new THREE.Vector3(0, .67, .5)),
    normal: new THREE.Vector3(0, 0, 1), kind: 'layers',
    offset: new THREE.Vector3(.5, 1.0, 3.2), min: 2.1, max: 6.5 });

  const berryBowl = new THREE.Group();
  berryBowl.position.set(-5, surfaceHeight(-5, -11.8), -11.8);
  // An eroded hollow in intact bedrock, with a broken perimeter and concave
  // surface: the loose concretions collect here rather than floating on a plate.
  function bowlHeight(x, z) {
    const radius = Math.hypot((x + .18) / 1.42, (z - .06) / .9);
    return .14 + .075 * THREE.MathUtils.smoothstep(radius, .18, .94)
      + .012 * Math.sin(x * 7 + z * 4) + .006 * Math.sin(z * 19 - x * 3)
      - .025 * Math.exp(-((x - .67) ** 2 + (z + .24) ** 2) / .008)
      - .020 * Math.exp(-((x + .71) ** 2 + (z - .31) ** 2) / .006);
  }
  const bowlGeometry = own(makeBowlGeometry(bowlHeight));
  const bowlMaterial = own(strataMaterials[2].clone());
  setDrySurface(bowlMaterial, .9);
  setSedimentSurface(bowlMaterial);
  setBowlSurface(bowlMaterial);
  const slab = new THREE.Mesh(bowlGeometry, bowlMaterial);
  slab.receiveShadow = slab.castShadow = true;
  berryBowl.add(slab);
  const grainGeometry = own(new THREE.SphereGeometry(1, 12, 8));
  const grainVertices = grainGeometry.attributes.position;
  for (let i = 0; i < grainVertices.count; i += 1) {
    const x = grainVertices.getX(i), y = grainVertices.getY(i), z = grainVertices.getZ(i);
    const wear = .96 + .045 * Math.sin(x * 9 + y * 8) * Math.sin(z * 7 - y * 4);
    grainVertices.setXYZ(i, x * wear, y * wear, z * wear);
  }
  grainGeometry.computeVertexNormals();
  const grainMaterial = own(new THREE.MeshStandardMaterial({ color: '#aeb3b5',
    roughness: .9, metalness: .015, bumpMap: outcropTexture, bumpScale: .012 }));
  grainMaterial.userData.normalStrength = .2;
  const grains = new THREE.InstancedMesh(grainGeometry, grainMaterial, 96);
  const grainRandom = seededRandom(7403);
  for (let i = 0; i < grains.count; i += 1) {
    const angle = grainRandom() * Math.PI * 2;
    const radius = Math.pow(grainRandom(), .8) * 1.08;
    let x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * .65;
    // A deliberately brushed comparison patch exposes the host rock beside the
    // nodules. Keep its whole radius free, including overhanging grain edges.
    if (Math.hypot(x - .5, z + .1024) < .38) x -= .78;
    const size = (.055 + grainRandom() * .035) * .75;
    // Every third nodule remains partly locked into the host sediment.
    const embedded = i % 3 === 0;
    dummy.position.set(x, bowlHeight(x, z) + size * (embedded ? .15 : .72), z);
    dummy.rotation.set(grainRandom() * 3, grainRandom() * 6, grainRandom() * 3);
    dummy.scale.set(size, size * (.68 + grainRandom() * .35), size * (.8 + grainRandom() * .35));
    grains.setColorAt(i, new THREE.Color().setHSL(.06 + grainRandom() * .06, .08 + grainRandom() * .12, .3 + grainRandom() * .25));
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
  }
  grains.castShadow = grains.receiveShadow = true;
  berryBowl.add(grains);
  scene.add(berryBowl);
  // A conforming grid of dusty chips makes every swept footprint visible.
  const toolGroup = new THREE.Group(); scene.add(toolGroup); toolGroup.visible = false;
  // Soft granular deposits, not opaque tiled paint. The cell mask still owns
  // removal; each cell renders a feathered irregular dust footprint.
  const powderSize = 64, powderPixels = new Uint8Array(powderSize * powderSize * 4);
  const powderRandom = seededRandom(12024);
  for (let y = 0; y < powderSize; y++) for (let x = 0; x < powderSize; x++) {
    const index = (y * powderSize + x) * 4;
    const px = (x + .5) / powderSize * 2 - 1, py = (y + .5) / powderSize * 2 - 1;
    const angle = Math.atan2(py, px), edge = .83 + .09 * Math.sin(angle * 5) + .06 * Math.cos(angle * 9);
    const feather = THREE.MathUtils.smoothstep(edge - Math.hypot(px, py), 0, .42);
    const grain = powderRandom();
    powderPixels[index] = 206 + grain * 30;
    powderPixels[index + 1] = 177 + grain * 25;
    powderPixels[index + 2] = 139 + grain * 20;
    powderPixels[index + 3] = Math.round(255 * feather * (.2 + .8 * grain));
  }
  const powderTexture = own(new THREE.DataTexture(powderPixels, powderSize, powderSize));
  powderTexture.colorSpace = THREE.SRGBColorSpace; powderTexture.needsUpdate = true;
  const toolDustMaterial = own(new THREE.MeshStandardMaterial({ color: '#e6c59b', map: powderTexture,
    roughness: 1, transparent: true, opacity: .83, depthWrite: false, alphaTest: .035,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, side: THREE.DoubleSide }));
  const dustChip = own(new THREE.PlaneGeometry(2 / 24 * 1.7, 2 / 24 * 1.7));
  const toolDust = new THREE.InstancedMesh(dustChip, toolDustMaterial, 24 * 24); toolGroup.add(toolDust);
  const toolHead = new THREE.Group(); toolGroup.add(toolHead);
  // The cursor is an emissive instrument reticle, explicitly a diagram rather
  // than a floating mechanical arm. Its open center leaves the surface visible.
  const headMaterial = own(new THREE.MeshBasicMaterial({ color: '#d9f3ff', depthTest: false, transparent: true, opacity: .9 }));
  const headRing = new THREE.Mesh(own(new THREE.TorusGeometry(.085, .005, 6, 32)), headMaterial);
  headRing.renderOrder = 6; toolHead.add(headRing);
  for (let i = 0; i < 4; i++) {
    const tick = new THREE.Mesh(own(new THREE.BoxGeometry(.045, .005, .005)), headMaterial);
    tick.position.set(Math.cos(i * Math.PI / 2) * .115, Math.sin(i * Math.PI / 2) * .115, 0);
    tick.rotation.z = i * Math.PI / 2; tick.renderOrder = 6; toolHead.add(tick);
  }
  const toolRings = [0, 1].map(() => {
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(.16, .012, 6, 32)), own(new THREE.MeshBasicMaterial({ color: '#ffd18b', depthTest: false })));
    ring.renderOrder = 5; toolGroup.add(ring); return ring;
  });
  const traceGuide = new THREE.InstancedMesh(own(new THREE.SphereGeometry(.014, 8, 6)),
    own(new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false, toneMapped: false })), 80);
  traceGuide.renderOrder = 4; traceGuide.visible = false; toolGroup.add(traceGuide);
  let traceGuidePositions = null;
  let toolBerry = false;
  const toolSurfaceRay = new THREE.Raycaster();
  lastChance.updateMatrixWorld(true);
  function layerSurface(x, y) {
    toolSurfaceRay.set(lastChance.position.clone().add(new THREE.Vector3(x, y, 2)), new THREE.Vector3(0, 0, -1));
    const hit = toolSurfaceRay.intersectObject(lastChance, true)[0];
    return { z: hit ? hit.point.z - lastChance.position.z : .72,
      normal: hit ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 0, 1) };
  }
  function toolPoint(x, y, lift = 0) {
    return toolBerry ? new THREE.Vector3(x, bowlHeight(x, y * .64) + .035 + lift, y * .64)
      : new THREE.Vector3(x, .67 - y * .48, layerSurface(x, .67 - y * .48).z + .012 + lift);
  }
  const layerDustPoints = Array.from({ length: 576 }, (_, index) => toolPoint(-1 + (index % 24 + .5) / 12, -1 + (Math.floor(index / 24) + .5) / 12));
  const layerDustNormals = Array.from({ length: 576 }, (_, index) => layerSurface(-1 + (index % 24 + .5) / 12, .67 - (-1 + (Math.floor(index / 24) + .5) / 12) * .48).normal);
  const localFront = new THREE.Vector3(0, 0, 1);
  function updateToolVisual(state) {
    toolHead.position.copy(toolPoint(state.cursor.x, state.cursor.y, .07));
    toolHead.rotation.x = toolBerry ? -Math.PI / 2 : 0;
    headRing.rotation.z += state.stage === 'brush' && state.operating ? .12 : 0;
    toolDust.visible = state.mode !== 'trace';
    traceGuide.visible = state.mode === 'trace';
    if (state.mode === 'trace') {
      if (!traceGuidePositions) traceGuidePositions = state.paths.flatMap(path => path.points.map(point => toolPoint(point.x, point.y, .035)));
      state.paths.forEach((path, pathIndex) => path.points.forEach((point, index) => {
        const instance = pathIndex * 40 + index;
        dummy.position.copy(traceGuidePositions[instance]); dummy.quaternion.identity();
        const near = Math.hypot(point.x - state.cursor.x, point.y - state.cursor.y) < .12;
        dummy.scale.setScalar(near ? 1.35 : 1); dummy.updateMatrix(); traceGuide.setMatrixAt(instance, dummy.matrix);
        // Violet stays distinct from completed mint-green; amber marks the lower path.
        traceGuide.setColorAt(instance, new THREE.Color(path.complete || point.visited ? '#8be0bb' : pathIndex ? '#d69aff' : '#ffd18b'));
      }));
      traceGuide.instanceMatrix.needsUpdate = true; traceGuide.instanceColor.needsUpdate = true;
    }
    if (state.mode !== 'trace') for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
      const index = j * 24 + i;
      dummy.position.copy(toolBerry ? toolPoint(-1 + (i + .5) / 12, -1 + (j + .5) / 12) : layerDustPoints[index]);
      if (toolBerry) {
        const x = dummy.position.x, z = dummy.position.z, h = .008;
        const normal = new THREE.Vector3(-(bowlHeight(x + h, z) - bowlHeight(x - h, z)) / (2 * h), 1,
          -(bowlHeight(x, z + h) - bowlHeight(x, z - h)) / (2 * h)).normalize();
        dummy.quaternion.setFromUnitVectors(localFront, normal);
      } else dummy.quaternion.setFromUnitVectors(localFront, layerDustNormals[index]);
      dummy.scale.set(1, toolBerry ? .64 : .48, 1).multiplyScalar(state.cleared[index] ? 0 : 1);
      dummy.updateMatrix(); toolDust.setMatrixAt(index, dummy.matrix);
    }
    toolDust.instanceMatrix.needsUpdate = true;
    toolRings.forEach((ring, i) => {
      const target = state.targets[i]; ring.position.copy(toolPoint(target.x, target.y, .055));
      ring.rotation.x = toolBerry ? -Math.PI / 2 : 0;
      ring.visible = state.mode !== 'trace' && state.stage !== 'brush';
      ring.material.color.set(state.samples.some(s => s.id === target.id) ? '#8be0bb' : '#ffd18b');
    });
  }
  function emitToolFeedback(feedback = { active: false }) {
    canvas.dispatchEvent(new CustomEvent('tool-feedback', { bubbles: true, detail: feedback }));
  }
  function emitTool(state) {
    const { cleared, ...detail } = state;
    canvas.dispatchEvent(new CustomEvent('tool-sample', { bubbles: true, detail }));
  }
  function setToolMode(sceneId, savedTool = null) {
    if (sceneId && discoveryCamera) setDiscoveryCamera(null, { immediate: true });
    if (tool?.sceneId === sceneId) return true;
    if (tool) retainedTool = tool;
    emitToolFeedback();
    tool?.stop(); toolPointer = null;
    const next = !savedTool && retainedTool?.sceneId === sceneId ? retainedTool : createGeologyTool(sceneId, savedTool);
    tool = next ? Object.assign(next, { sceneId }) : null;
    toolGroup.visible = Boolean(tool || evidence); traceGuidePositions = null;
    controls.enabled = !tool && !evidence && !survey && !remoteView && !paused && !intro && !contactActive;
    if (!tool) return false;
    setSurvey(false); investigation = false; stopDrive(); look = { x: 0, y: 0 };
    toolBerry = sceneId === 'blueberries';
    toolGroup.position.copy(toolBerry ? berryBowl.position : lastChance.position);
    const center = toolGroup.position.clone().add(toolPoint(0, 0));
    cameraTween = null; controls.target.copy(center);
    camera.position.copy(center).add(toolBerry ? new THREE.Vector3(0, 2.9, 1.8) : new THREE.Vector3(0, .2, 3.2));
    controls.update(); controls.enabled = false;
    toolHead.visible = !evidence;
    updateToolVisual(tool.snapshot()); emitTool(tool.snapshot()); render(); return true;
  }
  function setEvidence(sceneId) {
    evidence = sceneId === 'blueberries' || sceneId === 'stone-ripples' ? sceneId : null;
    if (evidence) emitToolFeedback();
    const source = tool?.sceneId === evidence ? tool : retainedTool?.sceneId === evidence ? retainedTool : null;
    toolGroup.visible = Boolean(tool || evidence && source);
    toolHead.visible = Boolean(tool && !evidence);
    if (evidence) {
      toolBerry = evidence === 'blueberries';
      toolGroup.position.copy(toolBerry ? berryBowl.position : lastChance.position);
      stopDrive(); if (!discoveryCamera) look = { x: 0, y: 0 }; toolPointer = null;
      // Legacy saves and explicit skips have no recorded physical work. Frame
      // the authored rock itself, without inventing cleared dust or samples.
      // Hide the whole overlay if no matching engine exists so another site's
      // cached rings/dust/path marks cannot masquerade as earned evidence.
      toolGroup.visible = Boolean(source);
      if (source) { source.stop(); updateToolVisual(source.snapshot()); }
      controls.enabled = false;
    }
    render();
  }
  // The same eye, scene and atmosphere used while driving. Photo framing moves
  // from the current world view to the actual rover mast; only its gaze changes.
  function setDiscoveryCamera(sceneId, { immediate = false, aspect, frame: photoFrame } = {}) {
    if (!sceneId) {
      const previous = discoveryCamera;
      if (!previous) return true;
      discoveryCamera = null; discoveryPointer = null; look = { x: 0, y: 0 };
      controls.enabled = false;
      cameraLensTarget = previous.returnFov;
      cameraTween = { position: previous.returnPosition, target: previous.returnTarget, fov: previous.returnFov, restoreControls: true };
      if (immediate) {
        camera.position.copy(cameraTween.position); controls.target.copy(cameraTween.target);
        camera.fov = previous.returnFov; camera.updateProjectionMatrix();
        cameraTween = null;
        controls.enabled = !tool && !evidence && !survey && !remoteView && !paused && !intro && !contactActive && !contactPulse;
      }
      render(); return true;
    }
    if (disposed || mode !== 'game' || remoteView || !['first-morning','stone-ripples','blueberries','ordinary-day','last-image'].includes(sceneId)) return false;
    if (discoveryCamera?.sceneId === sceneId) {
      if (Number.isFinite(aspect) && aspect > 0) discoveryCamera.aspect = aspect;
      if (photoFrame) discoveryCamera.frame = { ...photoFrame };
      fitDiscoveryLens();
      if (immediate) { camera.fov = discoveryCamera.fov; camera.updateProjectionMatrix(); }
      render(); return true;
    }
    if (discoveryCamera) setDiscoveryCamera(null, { immediate: true });
    // Save the rendered view before changing survey/tool state. Returning from
    // the mast retraces this move instead of jumping to an unrelated composition.
    const returnPosition = camera.position.clone(), returnTarget = controls.target.clone(), returnFov = camera.fov;
    setSurvey(false); stopDrive(); tool?.stop(); emitToolFeedback();
    toolPointer = null; discoveryPointer = null; look = { x: 0, y: 0 };
    investigation = inspecting = false;
    cancelContactPulse(); contactActive = contactFraming = false; contactVisual.visible = false;
    vehicle.updateMatrixWorld(true);
    // NASA model normalized to 2.4 m: the camera head is at z=.49, y=1.67.
    // Five centimetres of clearance above it avoids looking through the model
    // when looking back over the real solar deck or turning toward a landmark.
    const eye = vehicle.localToWorld(new THREE.Vector3(-.046, 1.72, .49));
    let target;
    if (sceneId === 'blueberries') target = berryBowl.position.clone().add(new THREE.Vector3(0, .16, 0));
    else if (sceneId === 'stone-ripples') target = lastChance.position.clone().add(new THREE.Vector3(0, .67, .55));
    else if (sceneId === 'first-morning') {
      // Look across the landing ground and its persistent low bedrock apron.
      target = new THREE.Vector3(-1, surfaceHeight(-1, -12) + .12, -12);
    } else if (sceneId === 'ordinary-day') {
      // The rover's actual deck and the tracks left by driving share this view.
      const behind = new THREE.Vector3(0, 0, -1).applyQuaternion(vehicle.quaternion);
      target = eye.clone().addScaledVector(behind, 2.8);
      target.y = surfaceHeight(target.x, target.z) + .1;
    } else {
      // Look up into the current storm sky. Missing downlink pixels appear only
      // in the authentic NASA observation revealed after the live capture.
      const direction = new THREE.Vector3(Math.sin(heading), 1.8, Math.cos(heading)).normalize();
      target = eye.clone().addScaledVector(direction, 20);
    }
    const safe = clearCamera(target, eye, cameraRocks, cameraClearance(), surfaceHeight, { tether: false });
    eye.set(safe.x, safe.y, safe.z);
    const gaze = new THREE.Spherical().setFromVector3(target.clone().sub(eye));
    discoveryCamera = { sceneId, eye, target, theta: gaze.theta, phi: gaze.phi,
      distance: gaze.radius, yaw: 0, pitch: 0, frozen: false, returnPosition, returnTarget, returnFov,
      readyAt: elapsed + (immediate ? 0 : .45),
      aspect: Number.isFinite(aspect) && aspect > 0 ? aspect : 4 / 3,
      frame: photoFrame && { ...photoFrame } };
    fitDiscoveryLens();
    discoverySampleTime = -1; controls.enabled = false;
    // Flush orbit damping without letting its distance/polar limits clamp the
    // mast view. Projection remains the normal, full-viewport world projection.
    const damping = controls.enableDamping; controls.enableDamping = false;
    controls.update(); controls.enableDamping = damping;
    camera.position.copy(returnPosition); controls.target.copy(returnTarget);
    cameraTween = { position: eye.clone(), target: target.clone() };
    if (immediate) { camera.position.copy(eye); controls.target.copy(target); camera.fov = discoveryCamera.fov; camera.updateProjectionMatrix(); cameraTween = null; }
    render(); return true;
  }
  function discoveryCrop(d) {
    const rect = canvas.getBoundingClientRect(), width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    const cropWidth = Math.min(width, height * d.aspect), cropHeight = cropWidth / d.aspect;
    return { width, height, crop: d.frame || { left: (width - cropWidth) / 2, top: (height - cropHeight) / 2, width: cropWidth, height: cropHeight } };
  }
  function fitDiscoveryLens() {
    const d = discoveryCamera;
    if (!d) return;
    d.fov = d.sceneId === 'ordinary-day' ? 58 : 43;
    cameraLensTarget = d.fov;
    const subject = d.sceneId === 'stone-ripples' ? lastChance : d.sceneId === 'blueberries' ? berryBowl : null;
    if (!subject) return;
    // Measure the actual persistent landmark from the mast, then open the same
    // physical lens. The source-shaped HUD is a crop, never another projection.
    const bounds = new THREE.Box3().setFromObject(subject);
    const forward = d.target.clone().sub(d.eye).normalize();
    const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
    const up = right.clone().cross(forward).normalize();
    const { width, height, crop } = discoveryCrop(d);
    const xRoom = Math.max(.05, Math.min(width / 2 - crop.left, crop.left + crop.width - width / 2) / (width / 2) * .8);
    const yRoom = Math.max(.05, Math.min(height / 2 - crop.top, crop.top + crop.height - height / 2) / (height / 2) * .8);
    let tangent = Math.tan(THREE.MathUtils.degToRad(50 / 2));
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new THREE.Vector3(x, y, z).sub(d.eye), depth = Math.max(.12, point.dot(forward));
      tangent = Math.max(tangent, Math.abs(point.dot(right)) / (depth * camera.aspect * xRoom), Math.abs(point.dot(up)) / (depth * yRoom));
    }
    // Close approaches can exceed a plausible wide lens. Keep the real eye and
    // an honest crop rather than pulling the camera through the rover or rock.
    d.fov = Math.min(85, THREE.MathUtils.radToDeg(2 * Math.atan(tangent)));
    cameraLensTarget = d.fov;
  }
  function setDiscoveryCameraFrozen(value) {
    if (!discoveryCamera) return;
    discoveryCamera.frozen = Boolean(value); discoveryPointer = null; look = { x: 0, y: 0 };
  }
  function aimDiscovery(right, down) {
    const d = discoveryCamera;
    if (!d || d.frozen || paused || cameraTween || elapsed < d.readyAt) return;
    d.yaw = THREE.MathUtils.clamp(d.yaw - right, -.30, .30);
    d.pitch = THREE.MathUtils.clamp(d.pitch + down, -.24, .24);
  }
  function frameDiscovery() {
    const d = discoveryCamera;
    if (!d) return;
    marker.visible = false;
    toolHead.visible = traceGuide.visible = false;
    toolRings.forEach(ring => { ring.visible = false; });
    // Cleared dust remains on the same rock. Probe, rings and trace dots are UI.
    if (!cameraTween) {
      camera.position.copy(d.eye);
      controls.target.copy(d.eye).add(new THREE.Vector3().setFromSpherical(
        new THREE.Spherical(d.distance, THREE.MathUtils.clamp(d.phi + d.pitch, .03, Math.PI - .03), d.theta + d.yaw)));
    }
  }
  function sampleDiscovery() {
    const d = discoveryCamera;
    if (!d || paused || elapsed - discoverySampleTime < .1) return;
    discoverySampleTime = elapsed;
    camera.updateMatrixWorld();
    const point = d.target.clone().project(camera);
    const { width, height, crop } = discoveryCrop(d);
    const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
    const ready = modelReady && !cameraTween && Math.abs(camera.fov - d.fov) < .05 && elapsed >= d.readyAt;
    canvas.dispatchEvent(new CustomEvent('discovery-camera-sample', { bubbles: true,
      detail: { ready, aligned: ready && point.z > -1 && point.z < 1
        && x > crop.left + crop.width * .12 && x < crop.left + crop.width * .88
        && y > crop.top + crop.height * .12 && y < crop.top + crop.height * .88,
        yaw: d.yaw, pitch: d.pitch } }));
  }
  function getCheckpoint() {
    const source = tool || retainedTool;
    return { position: { x: vehicle.position.x, z: vehicle.position.z, heading },
      tool: source?.checkpoint ? { ...source.checkpoint(), sceneId: source.sceneId } : null };
  }
  function restoreCheckpoint(checkpoint) {
    const saved = checkpoint?.position;
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) {
      const length = Math.hypot(saved.x, saved.z), scale = length > 19 ? 19 / length : 1;
      vehicle.position.set(saved.x * scale, 0, saved.z * scale);
      heading = Number.isFinite(saved.heading) ? saved.heading : -.45;
      recoverRoverPosition();
      stopDrive(); groundRover(); lastTrackPosition.copy(vehicle.position);
      focusRover(true);
    }
    if (checkpoint?.tool?.sceneId) {
      const saved = checkpoint.tool;
      const restored = createGeologyTool(saved.sceneId, saved);
      retainedTool = restored ? Object.assign(restored, { sceneId: saved.sceneId }) : null;
    }
    render();
  }
  function setToolInput(value) { if (tool && !evidence && toolPointer === null && !paused && !document.hidden) tool.setInput(value); }
  function compareToolSamples() { const result = !evidence && tool?.compare() || false; if (result) emitTool(tool.snapshot()); return result; }

  // Pale, broken low bedrock continues through the landing ground. It exists
  // during driving, fieldwork and photography alike, using the landmark stone
  // materials rather than appearing only when the shutter is raised.
  const bedrock = new THREE.InstancedMesh(rockGeometries[2], strataMaterials[0], 28);
  const bedrockRandom = seededRandom(8302);
  for (let i = 0; i < bedrock.count; i += 1) {
    const center = [[-1.4, -7.3], [3.1, -8.8], [.2, -11.3]][Math.floor(i / 10)];
    const angle = bedrockRandom() * Math.PI * 2, radius = Math.sqrt(bedrockRandom()) * 1.85;
    const x = center[0] + Math.cos(angle) * radius;
    const z = center[1] + Math.sin(angle) * radius * .7;
    const width = .38 + bedrockRandom() * .48, depth = .28 + bedrockRandom() * .42;
    // Bury the underside into the local slope. The low exposed plates are
    // traversable, and register the actual geometry for camera clearance.
    const ground = Math.min(surfaceHeight(x - width, z), surfaceHeight(x + width, z),
      surfaceHeight(x, z - depth), surfaceHeight(x, z + depth));
    dummy.position.set(x, ground + .035, z);
    dummy.rotation.set(0, -.2 + bedrockRandom() * .5, 0);
    dummy.scale.set(width, .075 + bedrockRandom() * .035, depth);
    dummy.updateMatrix(); bedrock.setMatrixAt(i, dummy.matrix);
    bedrock.setColorAt(i, new THREE.Color().setScalar(.83 + bedrockRandom() * .17));
    registerInstance(bedrock.geometry, dummy.matrix);
  }
  bedrock.castShadow = bedrock.receiveShadow = true;
  scene.add(bedrock);

  // Fractured shoulders and talus tie each hero to the ground. Shared geometry
  // and one instanced batch keep staging inexpensive on mobile GPUs.
  const talus = own(new THREE.InstancedMesh(rockGeometries[2], strataMaterials[1], 34));
  const talusRandom = seededRandom(6021);
  for (let i = 0; i < talus.count; i += 1) {
    const center = i < 22 ? lastChance.position : berryBowl.position;
    const angle = talusRandom() * Math.PI * 2;
    const radius = 1.35 + talusRandom() * .8;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius * .65;
    const size = .09 + talusRandom() * .27;
    dummy.position.set(x, surfaceHeight(x, z) + size * .11, z);
    dummy.rotation.set(talusRandom() * .5, angle, talusRandom() * .4);
    dummy.scale.set(size * 1.7, size * .45, size);
    dummy.updateMatrix(); talus.setMatrixAt(i, dummy.matrix);
    registerInstance(talus.geometry,dummy.matrix);
  }
  talus.castShadow = talus.receiveShadow = true;
  scene.add(talus);
  refineBerryBowl({ THREE, group: berryBowl, own, bowlHeight, grains, slab });
  berryBowl.updateMatrixWorld(true);
  registerLandmark(berryBowl);
  observationSites.push({ x: -5, z: -10,
    target: berryBowl.position.clone().add(new THREE.Vector3(0, .2, 0)),
    normal: new THREE.Vector3(0, 1, 0), kind: 'grains',
    offset: new THREE.Vector3(.25, 3.0, 1.45), min: 1.9, max: 5.8 });

  function loadSurfaceMaps(paths, materials, repeat, normalStrength) {
    const textureLoader = new THREE.TextureLoader();
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    for (const [property, path] of Object.entries(paths)) {
      const texture = own(textureLoader.load(new URL(`../../public/${path}`, import.meta.url).href,
        loaded => {
          if (disposed) { loaded.dispose(); return; }
          for (const material of materials) {
            // Preserve mineral color variation; borrow only scanned microrelief.
            if (material === grainMaterial && property === 'map') continue;
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
    roughnessMap: 'textures/rock/roughness.jpg' }, [rockMaterial, ...strataMaterials, bowlMaterial, grainMaterial], 1.1, .7);

  const sun = new THREE.DirectionalLight('#ffd4a3', 3.2);
  sun.position.set(-28, 7, -58);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
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
  const sunOffset = sun.position.clone();
  // Keep the same single shadow map useful along the route. Texel snapping
  // avoids continuous shadow swimming as the close follow camera moves.
  const shadowTexel = 48 / sun.shadow.mapSize.x;
  function anchorShadows() {
    const x = Math.round(vehicle.position.x / shadowTexel) * shadowTexel;
    const z = Math.round(vehicle.position.z / shadowTexel) * shadowTexel;
    sun.target.position.set(x, 0, z);
    sun.position.copy(sun.target.position).add(sunOffset);
    sun.target.updateMatrixWorld();
  }
  const hemisphere = new THREE.HemisphereLight('#d7b9a3', '#39261e', 2.2);
  scene.add(hemisphere);
  const groundBounce = new THREE.Color();
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
  contacts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
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
      roverFootprint.halfWidth=(bounds.max.x-bounds.min.x)/2+.06;
      roverFootprint.halfLength=(bounds.max.z-bounds.min.z)/2+.06;
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= bounds.min.y;
      model.updateMatrixWorld(true);
      roverFootprint.parts=[];
      model.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const points=[],positions=mesh.geometry.attributes.position;
        let minY=Infinity,maxY=-Infinity;
        for(let i=0;i<positions.count;i++){
          const point=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
          points.push(point);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);
        }
        const hull=convexHull(points);
        if(hull.length>=3)roverFootprint.parts.push({hull,minY:minY-.02,maxY:maxY+.02,children:componentHulls(points,mesh.geometry.index?.array)});
      });
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!agedMaterials.has(material)) {
            agedMaterials.add(material);
            setMissionFinish(material, missionAge);
          }
          if (material.roughness !== undefined) material.roughness = Math.max(0.38, material.roughness);
          if (material.metalness !== undefined) material.metalness = Math.min(0.85, material.metalness);
        }
      });
      vehicle.add(model);
      modelReady = true;
      recoverRoverPosition();
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
    controls.enabled = !survey && !remoteView && !paused && !contactActive;
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
    packet.position.copy(contactPulse.start).lerp(contactPulse.end, travel);
    packetMaterial.color.set(returning ? '#c7e1de' : '#ffe1a9');
    const fade = returning ? 1 - THREE.MathUtils.smoothstep(time, 1.08, 1.2)
      : contactPulse.mode === 'reply' ? 1 : 1 - THREE.MathUtils.smoothstep(time, .5, 1.05);
    packetMaterial.opacity = .95 * fade;
    beamMaterial.opacity = .14 * Math.max(.15, fade);
  }

  function contactFrame() {
    // Earth is represented by the uplink interface; keep the player beside
    // Opportunity instead of pulling back to fit the entire antenna beam.
    return desiredFrame(false);
  }

  function setContact(active, options = {}) {
    if (active && discoveryCamera) return;
    cancelContactPulse();
    if (!active) {
      contactActive = false;
      contactInput = { x: 0, y: 0 };
      contactVisual.visible = false;
      controls.enabled = !tool && !evidence && !survey && !remoteView && !paused;
      render();
      return;
    }
    if (disposed || remoteView) return;
    stopDrive();
    investigation = false;
    inspecting = false;
    roverFrame = null;
    look = { x: 0, y: 0 };
    setSurvey(false);
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
    cameraTween = contactCamera;
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
    guideMaterial.opacity = .88 + Math.sin(elapsed * 1.7) * .035;
    if (elapsed - contactSampleTime >= .095) {
      contactSampleTime = elapsed;
      canvas.dispatchEvent(new CustomEvent('contact-sample', { bubbles: true, detail: { quality } }));
    }
  }

  function setObservationTarget(value) {
    const changed = !value || !observationTarget || value.x !== observationTarget.x || value.z !== observationTarget.z;
    if (!value || !observationTarget || value.x !== observationTarget.x || value.z !== observationTarget.z) investigation = false;
    observationTarget = value && Number.isFinite(value.x) && Number.isFinite(value.z)
      ? { x: value.x, z: value.z, label: value.label } : null;
    if (inspecting) {
      if (observationTarget && !changed) inspect();
      else focusRover();
    }
  }

  function setWaypoint(value) {
    guidanceTime = -Infinity;
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

  function recoverRoverPosition() {
    const safe=clearRoverPose({x:vehicle.position.x,z:vehicle.position.z,heading},collisions,roverFootprint);
    if(safe){vehicle.position.x=safe.x;vehicle.position.z=safe.z;heading=safe.heading;}
  }

  function setMissionAge(years) {
    const number = Number(years);
    missionAge.value = Number.isFinite(number) ? THREE.MathUtils.clamp(number, 0, 14) / 14 : 0;
    // Also redraw during a paused passage; the shared uniform survives late loading.
    render();
  }

  function setScene(next, state = {}) {
    environment = Object.hasOwn(palettes, next) ? next : 'dawn';
    canDrive = !(state.power === 0 || state.signal === 0);
    if (!canDrive) stopDrive();
    planetState = palettes[environment];
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
    // Bounce and sky fill follow the atmosphere too: a fixed blue key made
    // sheltered hardware glow even after direct sunlight disappeared.
    hemisphere.color.lerp(skyUniforms.horizon.value, blend);
    groundBounce.copy(skyUniforms.lower.value).multiplyScalar(.22);
    hemisphere.groundColor.lerp(groundBounce, blend);
    fill.color.lerp(skyUniforms.top.value, blend);
    const fillIntensity = environment === 'storm' ? .12
      : environment === 'night' ? .045 : environment === 'earth' ? .08 : .32;
    fill.intensity = THREE.MathUtils.lerp(fill.intensity, fillIntensity, blend);
    skyUniforms.sunColor.value.lerp(sun.color, blend);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, planetState.exposure, blend);
    dustMaterial.opacity = THREE.MathUtils.lerp(dustMaterial.opacity, environment === 'storm' ? .47 : .14, blend);
    dustMaterial.size = environment === 'storm' ? .08 : .035;
  }

  function desiredFrame(inspect = false) {
    const narrow = camera.aspect < 0.85;
    if (remoteView && mode === 'game') {
      const target = vehicle.position.clone().add(new THREE.Vector3(0, .55, 0));
      const offset = new THREE.Vector3(10, 5.5, 14);
      offset.multiplyScalar(Math.max(1, .85 / Math.max(camera.aspect, .25)));
      controls.maxDistance = Math.max(28, offset.length() * 1.2);
      return { position: target.clone().add(offset), target };
    }
    if (memoryPreview && mode === 'game' && !inspect) {
      const ground = memoryPreview === 'ground';
      const target = vehicle.position.clone().add(new THREE.Vector3(-.7, ground ? .05 : 1.35, ground ? -.8 : -2.2));
      const offset = new THREE.Vector3(3.2, ground ? 3.8 : .95, ground ? 3.8 : 5.4);
      offset.multiplyScalar(Math.max(1, .8 / Math.max(camera.aspect, .25)));
      controls.maxDistance = Math.max(12, offset.length() * 1.3);
      return { position: target.clone().add(offset), target };
    }
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
      const horizontalFit = 2.85 / (2 * Math.tan(halfFov) * Math.max(camera.aspect, .2) * .82);
      const verticalFit = 1.45 / (2 * Math.tan(halfFov) * .72);
      const fitDistance = Math.max(offset.length(), horizontalFit, verticalFit);
      offset.setLength(fitDistance);
      controls.maxDistance = Math.max(site?.max || 7, fitDistance * 1.45);
      return { position: target.clone().add(offset), target };
    }
    if (mode === 'game' || inspect) {
      const target = vehicle.position.clone().add(new THREE.Vector3(0, .75, 0));
      const offset = new THREE.Vector3(1.5, 1.3, -4.7).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
      const halfFov = THREE.MathUtils.degToRad(camera.fov * .5);
      // Fit the rover's 2.4m wheel footprint plus a small shoulder in portrait.
      // Landscape stays intimate; an iPad/phone still retains the whole rover.
      const fit = 2.8 / (2 * Math.tan(halfFov) * Math.max(camera.aspect, .25) * .86);
      const range = Math.max(offset.length(), fit);
      offset.setLength(range);
      controls.maxDistance = Math.max(7.5, range * 1.3);
      return { position: target.clone().add(offset), target };
    }
    const offset = mode === 'ending' ? new THREE.Vector3(6.5, 3.4, 9.3)
      : new THREE.Vector3(narrow ? 5.3 : 5.6, narrow ? 3.3 : 2.5, narrow ? 8.3 : 7.7);
    const target = vehicle.position.clone().add(new THREE.Vector3(mode === 'title' && !narrow ? -1.7 : 0, .75, 0));
    return { position: vehicle.position.clone().add(offset), target };
  }

  // These are authored views of Mars, not a simulated Earth camera or photograph.
  function frameMemory(immediate = false) {
    const desired = desiredFrame(false);
    if (immediate) {
      camera.position.copy(desired.position);
      controls.target.copy(desired.target);
      cameraTween = null;
      controls.update(); render();
    } else cameraTween = desired;
  }
  function previewMemory(choiceId, sceneId) {
    if (disposed || remoteView || sceneId !== 'first-morning' || !['horizon', 'ground'].includes(choiceId)) return;
    if (memoryPreview === choiceId) return;
    stopDrive(); look = { x: 0, y: 0 };
    inspecting = investigation = false;
    memoryPreview = choiceId;
    frameMemory();
  }
  function revealFirstView() {
    if (disposed || remoteView) return;
    cancelContactPulse();
    if (contactActive) setContact(false);
    contactFraming = false; contactCamera = null;
    memoryPreview = null;
    previewMemory('horizon', 'first-morning');
  }
  function setRemoteView(active) {
    const next = Boolean(active && mode === 'game');
    if (disposed || remoteView === next) return;
    if (next && discoveryCamera) setDiscoveryCamera(null, { immediate: true });
    stopDrive(); look = { x: 0, y: 0 };
    cancelContactPulse();
    if (contactActive) setContact(false);
    contactFraming = false; contactCamera = null;
    inspecting = investigation = false; roverFrame = null; memoryPreview = null;
    setSurvey(false);
    remoteView = next;
    // Flush any residual pointer damping before freezing the remote composition.
    const damping = controls.enableDamping;
    controls.enableDamping = false; controls.update(); controls.enableDamping = damping;
    controls.enabled = !survey && !remoteView && !paused && !intro;
    controls.minDistance = 3.3; controls.minPolarAngle = .32;
    controls.maxPolarAngle = Math.PI * .475;
    // Role handover is a deliberate cut, including while its timeline is paused.
    frameMemory(true);
  }

  function focusRover(immediate = false) {
    if (disposed || discoveryCamera) return;
    memoryPreview = null;
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
    if (immediate) {
      camera.position.copy(desired.position);
      controls.target.copy(desired.target);
      cameraTween = null;
      controls.update();
      render();
    } else cameraTween = desired;
  }
  function inspect(immediate = false) {
    if (disposed || remoteView || discoveryCamera) return;
    if (memoryPreview && !observationTarget) { frameMemory(immediate); return; }
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
    controls.minPolarAngle = .18;
    controls.maxPolarAngle = Math.PI * .46;
    cameraTween = desiredFrame(true);
    if (immediate) {
      camera.position.copy(cameraTween.position);
      controls.target.copy(cameraTween.target);
      cameraTween = null;
      controls.update();
      render();
    }
  }

  function returnFromInspection() {
    if (!inspecting) return;
    inspecting = false;
    roverFrame = null;
    controls.minDistance = 3.3;
    controls.maxDistance = 28;
    controls.minPolarAngle = .32;
    controls.maxPolarAngle = Math.PI * .475;
    const desired = desiredFrame(false);
    cameraTween = { ...desired, follow: true };
  }

  function setSurvey(active) {
    const next = Boolean(active && !remoteView && mode === 'game' && !disposed);
    if (!next) {
      if (!survey) return;
      survey = null; surveyPointer = null;
      look = { x: 0, y: 0 };
      controls.enabled = !tool && !evidence && !survey && !remoteView && !paused && !intro && !contactActive;
      return;
    }
    survey = null;
    investigation = false; inspectionOrigin = null; inspectionTravel = 0;
    focusRover();
    stopDrive(); look = { x: 0, y: 0 };
    // Keep the eye safely above ground; survey rotates its gaze, not its orbit.
    // This makes both skyward and groundward goals reachable without clipping.
    survey = { origin: null, previous: null };
    surveySampleTime = elapsed;
    controls.enabled = false;
  }

  function aimSurvey(right, down) {
    if (!survey?.origin || cameraTween || paused || remoteView) return;
    const gaze = new THREE.Spherical().setFromVector3(controls.target.clone().sub(camera.position));
    gaze.theta -= right;
    gaze.phi = THREE.MathUtils.clamp(gaze.phi + down, .20, Math.PI - .20);
    controls.target.copy(camera.position).add(new THREE.Vector3().setFromSpherical(gaze));
  }
  function surveyPointerDown(event) {
    if (discoveryCamera) {
      if (paused || discoveryCamera.frozen) return;
      discoveryPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture?.(event.pointerId); return;
    }
    if (tool && !evidence && !paused) {
      tool.setInput({}); // A fresh pointer press follows a released pointer.
      toolPointer = event.pointerId;
      toolPointerMove(event); return;
    }
    if (survey?.origin && !paused) surveyPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function toolPointerMove(event) {
    if (!tool || evidence || toolPointer !== event.pointerId || paused) return;
    const rect = canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera);
    const origin = toolGroup.position.clone().add(toolPoint(0, 0));
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, toolBerry ? 1 : 0, toolBerry ? 0 : 1), origin);
    const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
    if (hit) { hit.sub(toolGroup.position); tool.setCursor(hit.x, toolBerry ? hit.z / .64 : (.67 - hit.y) / .48); }
    tool.setInput({ pressure: 1 });
  }
  function surveyPointerMove(event) {
    if (discoveryPointer?.id === event.pointerId) {
      aimDiscovery((event.clientX - discoveryPointer.x) * .003, (event.clientY - discoveryPointer.y) * .003);
      discoveryPointer.x = event.clientX; discoveryPointer.y = event.clientY;
      render(); return;
    }
    if (toolPointer !== null) { toolPointerMove(event); return; }
    if (!surveyPointer || surveyPointer.id !== event.pointerId) return;
    aimSurvey((event.clientX - surveyPointer.x) * .004, (event.clientY - surveyPointer.y) * .004);
    surveyPointer.x = event.clientX; surveyPointer.y = event.clientY;
    render();
  }
  function surveyPointerEnd(event) {
    discoveryPointer = null;
    surveyPointer = null;
    if (toolPointer !== null && (!event || event.pointerId === toolPointer)) { toolPointer = null; tool?.stop(); }
  }

  function sampleSurvey() {
    if (!survey || paused || remoteView || cameraTween || elapsed - surveySampleTime < .1) return;
    surveySampleTime = elapsed;
    const direction = camera.getWorldDirection(new THREE.Vector3());
    const gaze = new THREE.Spherical().setFromVector3(direction);
    if (!survey.origin) {
      survey.origin = { theta: gaze.theta, phi: gaze.phi };
      survey.previous = direction.clone();
    }
    const yaw = -Math.atan2(Math.sin(gaze.theta - survey.origin.theta), Math.cos(gaze.theta - survey.origin.theta));
    const pitch = gaze.phi - survey.origin.phi; // gaze polar grows DOWN
    const steady = direction.angleTo(survey.previous) < .016;
    survey.previous.copy(direction);
    canvas.dispatchEvent(new CustomEvent('survey-sample', { bubbles: true,
      detail: { yaw, pitch, steady } }));
  }

  function setInvestigation(active) {
    if (remoteView) return;
    const site = observationSites.find(site => observationTarget
      && Math.hypot(site.x - observationTarget.x, site.z - observationTarget.z) < .5);
    const next = Boolean(active && site);
    if (!next && !investigation) return;
    if (next && tool) return;
    investigation = next;
    inspectionOrigin = null; inspectionTravel = 0;
    sampleTime = elapsed;
    if (!investigation) return;
    setSurvey(false);
    stopDrive();
    if (!inspecting) inspect();
    const desired = desiredFrame(true);
        // Begin with useful evidence already visible. Deliberate orbit reveals it;
    // the camera animation itself never counts as the player's investigation.
    cameraTween = desired;
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
    if (!cameraTween) {
      const directionFromSite = camera.position.clone().sub(site.target).normalize();
      if (inspectionOrigin && (Math.abs(look.x) + Math.abs(look.y) > .05 || orbitGesture)) inspectionTravel += Math.min(.15, directionFromSite.angleTo(inspectionOrigin));
      inspectionOrigin = directionFromSite;
    } else { inspectionOrigin = null; inspectionTravel = 0; }
    const revealed = inspectionTravel >= .11;
    const quality = revealed ? THREE.MathUtils.clamp(facing * proximity, 0, 1) : 0;
    const hint = !revealed ? (site.kind === 'layers' ? 'Look left or right across the layers' : 'Look around the grain-covered hollow')
      : facing < .65 ? (site.kind === 'layers' ? 'Look back toward the broad layered face' : 'Look down into the hollow')
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
      // A flat decal intersects the upslope and floats above the downslope.
      // Match the terrain's local support plane, then retain wheel heading.
      const span = .12;
      contactNormal.set(surfaceHeight(x - span, z) - surfaceHeight(x + span, z),
        2 * span, surfaceHeight(x, z - span) - surfaceHeight(x, z + span)).normalize();
      dummy.quaternion.setFromUnitVectors(contactUp, contactNormal);
      dummy.rotateY(heading);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tracks.setMatrixAt(trackCursor % 1600, dummy.matrix);
      trackCursor += 1;
    }
    tracks.count = Math.min(trackCursor, 1600);
    tracks.instanceMatrix.needsUpdate = true;
  }

  function moveRover(delta) {
    if (remoteView || intro || mode !== 'game' || !modelReady || modelFailed || !canDrive || investigation || survey || contactActive || contactPulse) return;
    let forward = THREE.MathUtils.clamp(drive.forward, -1, 1);
    let turn = THREE.MathUtils.clamp(drive.turn, -1, 1);
    const velocity = motion.step({ forward, turn }, delta);
    const moving = Boolean(velocity.speed || velocity.turnRate);
    if (!moving && !wasMoving) return;
    wasMoving = moving;
    if (inspecting && moving) returnFromInspection();
    if (cameraTween && !cameraTween.follow) cameraTween = null;
    const nextHeading=heading+velocity.turnRate*delta;
    const step = velocity.speed * delta;
    const from={x:vehicle.position.x,z:vehicle.position.z,heading};
    const intended={x:from.x+Math.sin(nextHeading)*step,z:from.z+Math.cos(nextHeading)*step,heading:nextHeading};
    const resolved=sweepRover(from,intended,collisions,roverFootprint);
    const blocked=resolved.blocked;
    heading=resolved.heading;
    {
      const old = vehicle.position.clone();
      vehicle.position.x = resolved.x;
      vehicle.position.z = resolved.z;
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
      distance += Math.hypot(resolved.x-from.x,resolved.z-from.z);
      addTracks();
    }
    if (blocked && Math.hypot(resolved.x-from.x,resolved.z-from.z)<1e-6) motion.reset();
    groundRover();
    // Follow the direction the wheels travel, while preserving deliberate free look.
    if((forward || turn) && elapsed-lastManualLook>2.5 && !orbitGesture) {
      cameraTween=null;
      const follow=desiredFrame(false),amount=1-Math.exp(-delta*2.8);
      camera.position.lerp(follow.position,amount);controls.target.lerp(follow.target,amount);
    }
    if (!moving || elapsed - eventTime > .08) {
      eventTime = elapsed;
      const texture=sampleSurface(surfaceHeight,{x:vehicle.position.x,z:vehicle.position.z,heading,speed:blocked ? 0 : Math.abs(velocity.speed),blocked});
      const detail = { ...texture, x: vehicle.position.x, z: vehicle.position.z, distance, blocked,
        blockedReason:blocked?(Math.hypot(intended.x,intended.z)>19?'boundary':'rock'):null,
        remaining: waypoint ? Math.hypot(vehicle.position.x - waypoint.x, vehicle.position.z - waypoint.z) : 0 };
      canvas.dispatchEvent(new CustomEvent('world-drive', { bubbles: true, detail }));
      canvas.dispatchEvent(new CustomEvent('rover-move', { bubbles: true, detail }));
    }
    checkArrival();
  }

  const contactUp = new THREE.Vector3(0, 1, 0);
  const contactNormal = new THREE.Vector3();
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
      // A flat decal intersects the upslope and floats above the downslope.
      // Match the terrain's local support plane, then retain wheel heading.
      const span = .12;
      contactNormal.set(surfaceHeight(x - span, z) - surfaceHeight(x + span, z),
        2 * span, surfaceHeight(x, z - span) - surfaceHeight(x, z + span)).normalize();
      dummy.quaternion.setFromUnitVectors(contactUp, contactNormal);
      dummy.rotateY(heading);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      contacts.setMatrixAt(i, dummy.matrix);
    });
    contacts.instanceMatrix.needsUpdate = true;
  }

  const guidancePoint = new THREE.Vector3();
  function sampleWaypointGuidance() {
    if (disposed || paused || remoteView || intro || mode !== 'game'
      || !waypoint || waypoint.reached || elapsed - guidanceTime < .1) return;
    guidanceTime = elapsed;
    // Camera space keeps left/right correct behind the eye; perspective project()
    // alone flips those directions when its homogeneous W becomes negative.
    guidancePoint.set(waypoint.x, surfaceHeight(waypoint.x, waypoint.z) + 1, waypoint.z)
      .applyMatrix4(camera.matrixWorldInverse);
    const depth = -guidancePoint.z;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov * .5));
    const denominator = Math.max(Math.abs(depth), .001);
    const nx = guidancePoint.x / (denominator * tangent * camera.aspect);
    const ny = guidancePoint.y / (denominator * tangent);
    const onScreen = depth >= camera.near && depth <= camera.far
      && Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
    let dx = nx * .5, dy = -ny * .5;
    // A target directly behind has no lateral direction: point down to turn back.
    if (depth <= 0 && Math.hypot(dx, dy) < .001) dy = 1;
    const scale = Math.min(1, .38 / Math.max(Math.abs(dx), .0001),
      (dy < 0 ? .18 : .22) / Math.max(Math.abs(dy), .0001));
    canvas.dispatchEvent(new CustomEvent('waypoint-guidance', { bubbles: true, detail: {
      x: THREE.MathUtils.clamp(.5 + dx * scale, .12, .88),
      y: THREE.MathUtils.clamp(.5 + dy * scale, .32, .72),
      onScreen,
      steering: Math.atan2(Math.sin(Math.atan2(waypoint.x-vehicle.position.x,waypoint.z-vehicle.position.z)-heading),Math.cos(Math.atan2(waypoint.x-vehicle.position.x,waypoint.z-vehicle.position.z)-heading)),
      remaining: Math.hypot(waypoint.x-vehicle.position.x,waypoint.z-vehicle.position.z),
      // CSS rotation of an upward arrow: clockwise degrees, screen Y points down.
      angle: THREE.MathUtils.radToDeg(Math.atan2(dx, -dy)),
    } }));
  }

  function cameraClearance() {
    return Math.max(.24,camera.near*Math.sqrt(1+Math.tan(THREE.MathUtils.degToRad(camera.fov/2))**2*(1+camera.aspect**2))+.06);
  }

  function render() {
    if (disposed) return;
    if (discoveryCamera) frameDiscovery();
    if (evidence && !discoveryCamera && !cameraTween) {
      const center = toolGroup.position.clone().add(toolPoint(0, 0));
      const offset = toolBerry ? new THREE.Vector3(0, 2.9, 1.8) : new THREE.Vector3(0, .2, 3.2);
      // After comparison, leave the lower reading/signal dock clear. Move the
      // aim down in camera space while backing away; active tools keep their
      // original surface-centered camera and pointer projection.
      const screenUp = new THREE.Vector3(0, offset.z, -offset.y).normalize();
      controls.target.copy(center).addScaledVector(screenUp, -.55);
      camera.position.copy(center).add(offset.multiplyScalar(1.15));
      toolHead.visible = false;
    }
    // Orbiting and following the rover must never put the eye beneath a dune.
    const ground = surfaceHeight(camera.position.x, camera.position.z);
    const targetGround = surfaceHeight(controls.target.x, controls.target.z);
    if (camera.position.y < ground + .85) camera.position.y = ground + .85;
    if (!survey && !evidence && !discoveryCamera && controls.target.y < targetGround + .45) controls.target.y = targetGround + .45;
    const nearClearance=cameraClearance();
    const safeCamera=clearCamera(controls.target,camera.position,cameraRocks,nearClearance,surfaceHeight,{tether:!survey && !discoveryCamera});
    camera.position.set(safeCamera.x,safeCamera.y,safeCamera.z);
    camera.lookAt(controls.target);
    // Dedicated evidence close-ups omit the foreground rover that otherwise
    // blocks the near-side rock/grains. Restored on every other world view.
    vehicle.visible = Boolean(discoveryCamera || cameraTween?.restoreControls) || !investigation && !tool && !evidence;
    anchorShadows();
    renderer.render(scene, camera);
    sampleWaypointGuidance();
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
      if (tool && !evidence) {
        const state = tool.update(delta); updateToolVisual(state);
        // Dot contacts can occur faster than the 10 Hz UI/save samples.
        // Forward physical feedback on each simulation frame, without a queue.
        emitToolFeedback(state.feedback);
        if (elapsed - toolSampleTime >= .1) { toolSampleTime = elapsed; emitTool(state); }
      } else if (!evidence) moveRover(delta);
      const speed = environment === 'storm' ? 6.0 : .35;
      for (let i = 0; i < dustCount; i += 1) {
        dustPositions[i * 3] += delta * speed;
        if (dustPositions[i * 3] > 40) dustPositions[i * 3] -= 80;
      }
      dustGeometry.attributes.position.needsUpdate = true;
      applyPalette(1 - Math.exp(-delta * .85));
      const lensFov = cameraLensTarget;
      if (Number.isFinite(lensFov) && Math.abs(camera.fov - lensFov) > .005) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, lensFov, 1 - Math.exp(-delta * 3.2));
        camera.updateProjectionMatrix();
      }
      if (cameraTween) {
        // A survey must finish at an attainable, clear eye position. Comparing
        // against a point inside rock/terrain would leave aiming locked forever.
        if (survey) {
          const destination = cameraTween.position.clone();
          destination.y = Math.max(destination.y, surfaceHeight(destination.x, destination.z) + .85);
          const safe = clearCamera(cameraTween.target, destination, cameraRocks, cameraClearance(), surfaceHeight, { tether: false });
          cameraTween.position.set(safe.x, safe.y, safe.z);
        }
        const amount = 1 - Math.exp(-delta * 3.2);
        camera.position.lerp(cameraTween.position, amount);
        controls.target.lerp(cameraTween.target, amount);
        if (camera.position.distanceTo(cameraTween.position) < .015 && controls.target.distanceTo(cameraTween.target) < .015
          && (!Number.isFinite(lensFov) || Math.abs(camera.fov - lensFov) < .02)) {
          camera.position.copy(cameraTween.position); controls.target.copy(cameraTween.target);
          const restoreControls = cameraTween.restoreControls;
          cameraTween = null;
          if (restoreControls) controls.enabled = !discoveryCamera && !tool && !evidence && !survey && !remoteView && !paused && !intro && !contactActive && !contactPulse;
        }
      }
      if (discoveryCamera && (look.x || look.y)) aimDiscovery(look.x * delta * .65, look.y * delta * .55);
      if(look.x || look.y || orbitGesture)lastManualLook=elapsed;
      if(!discoveryCamera && !tool && !remoteView && !intro && !contactActive && !contactPulse && (look.x || look.y)) {
        // Finish authored survey framing before accepting relative camera input.
        if (!survey || !cameraTween && survey.origin) {
          cameraTween = null;
          if (survey) {
            aimSurvey(look.x * delta * 1.6, look.y * delta * 1.2);
          } else {
            const offset=camera.position.clone().sub(controls.target);
            const orbit=new THREE.Spherical().setFromVector3(offset);
            orbit.theta-=look.x*delta*1.6;
            orbit.phi=THREE.MathUtils.clamp(orbit.phi+look.y*delta*1.2,controls.minPolarAngle,controls.maxPolarAngle);
            camera.position.copy(controls.target).add(offset.setFromSpherical(orbit));
          }
        }
      }
      // Survey owns a fixed eye and independent gaze, including its arrival.
      if (!survey && !discoveryCamera && !cameraTween) controls.update();
      render();
      sampleInspection();
      sampleSurvey();
      sampleDiscovery();
    }
    frame = requestAnimationFrame(animate);
  }
  function setIntro(active, { progress = 0 } = {}) {
    if (!active) {
      if (!intro) return;
      const returned = mode === 'game' ? desiredFrame(false) : intro;
      camera.position.copy(returned.position);
      controls.target.copy(returned.target);
      intro = null;
      stopDrive(); look = { x: 0, y: 0 };
      controls.enabled = !tool && !evidence && !survey && !remoteView && !intro && !paused && !contactActive && !contactPulse;
      controls.update(); render();
      return;
    }
    if (disposed || remoteView) return;
    if (!intro) {
      stopDrive(); look = { x: 0, y: 0 }; cameraTween = null;
      // Flush OrbitControls' last damping step before recording the return view.
      const damping = controls.enableDamping;
      controls.enableDamping = false; controls.update(); controls.enableDamping = damping;
      intro = { position: camera.position.clone(), target: controls.target.clone() };
    }
    controls.enabled = false;
    const t = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1);
    const hero = lastChance.position.clone().add(new THREE.Vector3(0, .65, .5));
    const heroCamera = hero.clone().add(new THREE.Vector3(-1.5, 1.9, 5.8));
    // One continuous establish-and-return move, driven by the caller's paused clock.
    const amount = t < .55 ? THREE.MathUtils.smoothstep(t, .08, .45)
      : 1 - THREE.MathUtils.smoothstep(t, .66, 1);
    camera.position.lerpVectors(intro.position, heroCamera, amount);
    controls.target.lerpVectors(intro.target, hero, amount);
    render();
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
    if (discoveryCamera) {
      // Resize changes the regular full-world projection and measured HUD crop.
      fitDiscoveryLens();
    } else if (tool) {
      const center = toolGroup.position.clone().add(toolPoint(0, 0));
      camera.position.copy(center).add(toolBerry ? new THREE.Vector3(0, 2.9, 1.8) : new THREE.Vector3(0, .2, 3.2));
      controls.target.copy(center); controls.update();
    } else if ((remoteView || memoryPreview) && Math.abs(camera.aspect / previousAspect - 1) > .08) frameMemory(true);
    else if (inspecting && Math.abs(camera.aspect / previousAspect - 1) > .08) inspect(true);
    else if (mode === 'game' && !survey && !intro && !contactFraming
      && Math.abs(camera.aspect / previousAspect - 1) > .08) focusRover(true);
    if (contactFraming && Math.abs(camera.aspect / previousAspect - 1) > .08) {
      contactCamera = contactFrame();
      camera.position.copy(contactCamera.position);
      controls.target.copy(contactCamera.target);
      cameraTween = null;
      controls.update();
    }
    render();
  }
  function blur() { discoveryPointer = null; tool?.stop(); toolPointer = null; surveyPointer = null; orbitGesture = false; stopDrive(); contactInput = { x: 0, y: 0 }; }
  function visibilityChanged() { if (document.hidden) blur(); }
  function contextLost(event) {
    event.preventDefault();
    paused = true;
    cancelContactPulse();
    stopDrive();
    status('error', 'The 3D view was interrupted. Reload to restore the rover.');
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibilityChanged);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('pointerdown', surveyPointerDown);
  window.addEventListener('pointermove', surveyPointerMove);
  window.addEventListener('pointerup', surveyPointerEnd);
  window.addEventListener('pointercancel', surveyPointerEnd);
  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  resize();
  focusRover(true);
  setScene('sunset');
  applyPalette(1);
  frame = requestAnimationFrame(animate);

  return {
    capturePhoto() {
      if (disposed || !modelReady || renderer.getContext().isContextLost()) return Promise.resolve(null);
      // Read immediately after rendering: keep normal WebGL buffer disposal and
      // avoid a permanent preserveDrawingBuffer cost during gameplay.
      render();
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    },
    setDiscoveryCamera, setDiscoveryCameraFrozen,
    setToolMode, setToolInput, compareToolSamples, setEvidence, getCheckpoint, restoreCheckpoint,
    setMissionAge,
    previewMemory,
    revealFirstView,
    setRemoteView,
    setScene,
    setIntro,
    setMode(value) {
      const nextMode = ['title', 'game', 'ending'].includes(value) ? value : 'title';
      if (nextMode === mode) return;
      mode = nextMode;
      if (mode !== 'game') { setDiscoveryCamera(null, { immediate: true }); setToolMode(null); setSurvey(false); remoteView = false; memoryPreview = null; }
      controls.enabled = !tool && !evidence && !survey && !remoteView && !paused && !intro && !contactActive && !contactPulse;
      stopDrive();
      marker.visible = mode === 'game' && Boolean(waypoint && !waypoint.reached);
      focusRover();
    },
    stopDrive,
    setSurvey,
    setInvestigation,
    setContact,
    setContactInput,
    nudgeContact,
    sendContact,
    cancelContactPulse,
    setDrive(value = {}) {
      if (discoveryCamera || tool || evidence || intro || remoteView) return;
      drive = {
        forward: THREE.MathUtils.clamp(Number(value.forward) || 0, -1, 1),
        turn: THREE.MathUtils.clamp(Number(value.turn) || 0, -1, 1),
      };
    },
    setLook(value={}) {
      if (discoveryCamera) {
        look = discoveryCamera.frozen || paused ? { x: 0, y: 0 } : {x:THREE.MathUtils.clamp(Number(value.x)||0,-1,1),y:THREE.MathUtils.clamp(Number(value.y)||0,-1,1)}; return;
      }
      if (tool || evidence || intro || remoteView) return;
      look={x:THREE.MathUtils.clamp(Number(value.x)||0,-1,1),y:THREE.MathUtils.clamp(Number(value.y)||0,-1,1)};
    },
    setPaused(value) {
      paused = Boolean(value);
      controls.enabled = !discoveryCamera && !tool && !evidence && !survey && !remoteView && !intro && !paused && !contactActive && !contactPulse;
      if (paused) {cancelContactPulse();blur();look={x:0,y:0};}
      if (survey) { controls.enabled = false; survey.previous = camera.getWorldDirection(new THREE.Vector3()); }
      previous = 0;
    },
    focusRover,
    inspect,
    setWaypoint,
    setObservationTarget,
    reset() {
      setDiscoveryCamera(null, { immediate: true });
      evidence = null; retainedTool = null;
      setToolMode(null);
      retainedTool = null;
      setSurvey(false);
      remoteView = false; memoryPreview = null;
      missionAge.value = 0;
      setIntro(false);
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
      survey = null; inspectionOrigin = null;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('pointerdown', surveyPointerDown);
      window.removeEventListener('pointermove', surveyPointerMove);
      window.removeEventListener('pointerup', surveyPointerEnd);
      window.removeEventListener('pointercancel', surveyPointerEnd);
      controls.dispose();
      vehicle.traverse((object) => { if (object.isMesh) disposeModel(object); });
      for (const resource of resources) resource.dispose?.();
      for (const field of rockField) field.dispose();
      pebbles.dispose();
      bedrock.dispose();
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
        // Cross-scale deposits break the scanned tile repetition without
        // drawing new geometry or exaggerating the metre-scale ground relief.
        float deposit = sin(vSurfacePosition.x * .83 + sin(vSurfacePosition.z * .51) * 1.6)
          * sin(vSurfacePosition.z * .67 - vSurfacePosition.x * .21);
        soil *= mix(vec3(.97, .98, 1.0), vec3(1.03, 1.01, .97), .5 + .5 * deposit);
        float macro = .94 + .09 * sin(vSurfacePosition.x * .11 + vSurfacePosition.z * .07)
          + .045 * sin(vSurfacePosition.z * .23 - vSurfacePosition.x * .04);
        soil = mix(vec3(.38, .32, .25) * macro, soil, .78 * detail);
        diffuseColor.rgb *= soil;
      #endif`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>',
      THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;',
        'mapN.xy *= normalScale * mix(.12, 1.0, 1.0 - smoothstep(10.0, 45.0, length(vViewPosition)));'));
  };
  material.customProgramCacheKey = () => 'dry-terrain-macro-v2';
}

function setSedimentSurface(material) {
  const dryCompile = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    dryCompile(shader);
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec3 sedimentSample = texture2D(map, vMapUv).rgb;
        float mineralGrain = dot(sedimentSample, vec3(.2126, .7152, .0722));
        // Retain the scanned mineral relief and tonal variation while muting
        // its orange tint. The original near-constant gray erased all detail.
        vec3 mineral = mix(vec3(mineralGrain), sedimentSample, .30);
        diffuseColor.rgb *= .22 + 1.18 * mineral;
      #endif`);
  };
  material.customProgramCacheKey = () => 'dry-light-sediment-v2';
}

// A visible brushed comparison circle is part of the same bowl draw call.
function setBowlSurface(material) {
  const sedimentCompile = material.onBeforeCompile;
  material.onBeforeCompile = shader => {
    sedimentCompile(shader);
    shader.vertexShader = 'varying vec3 vBowlPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvBowlPosition = position;');
    shader.fragmentShader = 'varying vec3 vBowlPosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float brushRadius = length(vBowlPosition.xz - vec2(.5, .16));
      float brush = (1.0 - smoothstep(.265, .30, brushRadius))
        * smoothstep(.08, .16, vBowlPosition.y);
      float sweep = .98 + .02 * sin(brushRadius * 210.0);
      diffuseColor.rgb *= mix(vec3(1.0), vec3(1.32, 1.27, 1.19) * sweep, brush);
    `);
  };
  material.customProgramCacheKey = () => 'dry-brushed-bowl-v1';
}

// Radial rings give the hollow real depth and a chipped lip; lower ring closes
// the sides. UVs stay in world scale for the existing scanned stone maps.
function makeBowlGeometry(height) {
  const positions = [], uv = [], indices = [];
  const segments = 64, rings = 12;
  for (let ring = 0; ring <= rings + 2; ring += 1) {
    const radius = Math.min(ring / rings, 1);
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      const edge = 1 + .075 * Math.sin(angle * 5) + .045 * Math.cos(angle * 9);
      const x = Math.cos(angle) * radius * 1.48 * edge;
      const z = Math.sin(angle) * radius * .91 * edge;
      positions.push(x, ring === rings + 2 ? -.09 : height(x, z), z);
      // Duplicate the rim for independent side UVs: no vertical stretching of
      // the planar top scan down the thickness of the broken plate.
      if (ring > rings) uv.push(angle * 1.6, ring === rings + 2 ? -.12 : height(x, z) * 1.35);
      else uv.push(x * 1.35, z * 1.35);
      if (ring && segment) {
        const a = ring * (segments + 1) + segment, b = a - segments - 1;
        indices.push(a, a - 1, b, b, a - 1, b - 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
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

// A restrained, reversible editorial cue, not historical panel-dust telemetry.
// Shared shader uniform changes only shading: no overlays, textures or draw calls.
function setMissionFinish(material, age) {
  if (!material.isMeshStandardMaterial) return;
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey.bind(material);
  const baseKey = previousKey();
  material.onBeforeCompile = function(shader, renderer) {
    previousCompile.call(this, shader, renderer);
    shader.uniforms.missionAge = age;
    shader.vertexShader = 'varying vec3 vMissionNormal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <defaultnormal_vertex>',
      '#include <defaultnormal_vertex>\nvMissionNormal = inverseTransformDirection(transformedNormal, viewMatrix);');
    shader.fragmentShader = 'uniform float missionAge;\nvarying vec3 vMissionNormal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float missionDust = missionAge * .22 * smoothstep(.15, .85, normalize(vMissionNormal).y);
      float missionDetail = dot(diffuseColor.rgb, vec3(.2126, .7152, .0722));
      vec3 missionDustColor = vec3(.46, .32, .21) * (.35 + .65 * missionDetail);
      diffuseColor.rgb = mix(diffuseColor.rgb, missionDustColor, missionDust);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(roughnessFactor, max(roughnessFactor, .88), missionDust);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', `
      #include <metalnessmap_fragment>
      metalnessFactor *= 1.0 - missionDust;
    `);
  };
  material.customProgramCacheKey = () => `${baseKey}|mission-finish-v1`;
  material.needsUpdate = true;
}
