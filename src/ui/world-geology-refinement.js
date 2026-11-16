// Refine the persistent teaching rocks in place. These are artistic weathering
// cues, not measured NASA topography; tool coordinates remain authoritative.
const FRACTURES = [
  [-1.4, -.35, -.55, -.12], [-.55, -.12, -.2, .68],
  [-.55, -.12, -.05, -.72], [-.55, -.12, .42, -.22],
  [.42, -.22, 1.37, -.42], [.42, -.22, .78, .68],
  [.78, .68, -.2, .68], [.78, .68, 1.3, .29],
  [.42, -.22, .65, -.73],
];

// Same footprint as the teaching laminae. The former small backing boulder
// left their openings empty; this solid host rock joins those exposed sheets.
const OUTCROP_OUTLINE = [[-1.5, .06], [-1.32, .58], [-1.03, .99],
  [-.63, 1.36], [-.13, 1.3], [.43, 1.13], [.99, .86],
  [1.48, .13], [.92, -.09], [-.91, -.07]];

function makeOutcropCore(THREE) {
  const shape = new THREE.Shape();
  // Round the actual host-rock corners, while retaining the layered plates'
  // chipped margins. Short curves avoid the previous faceted polygon crown.
  OUTCROP_OUTLINE.forEach(([x, y], i) => {
    const previous = OUTCROP_OUTLINE[(i + OUTCROP_OUTLINE.length - 1) % OUTCROP_OUTLINE.length];
    const next = OUTCROP_OUTLINE[(i + 1) % OUTCROP_OUTLINE.length];
    const before = Math.min(.09 / Math.hypot(x - previous[0], y - previous[1]), .25);
    const after = Math.min(.09 / Math.hypot(next[0] - x, next[1] - y), .25);
    const ax = x + (previous[0] - x) * before, ay = y + (previous[1] - y) * before;
    if (i === 0) shape.moveTo(ax, ay); else shape.lineTo(ax, ay);
    shape.quadraticCurveTo(x, y, x + (next[0] - x) * after, y + (next[1] - y) * after);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .56, steps: 8, curveSegments: 4,
    bevelEnabled: true, bevelSegments: 3, bevelSize: .035, bevelThickness: .025 });
  geometry.translate(0, 0, -.20);
  return geometry;
}

function roundCoreRear(point, x, y, z) {
  // The teaching face remains a shallow exposure on a substantial host rock.
  // Preserve its entire front cap/bevel; extend and weather only the body
  // behind it, with enough depth rings for a rounded rather than slabbed top.
  const rear = Math.min(1, Math.max(0, (.36 - z) / .56));
  const crown = Math.max(0, Math.min(1, y / 1.1));
  const round = Math.sin(rear * Math.PI);
  point.x *= 1 - .085 * rear + .02 * round;
  point.y += -.12 * rear * Math.max(0, point.y) + .085 * round * crown;
  // Small coherent chips break the crown without new ridges across the trace.
  point.y += .012 * round * crown * Math.sin(x * 11 + rear * 9);
  point.z -= .65 * rear;
  return point;
}

/** Shared by the physical meshes, contact rays, pointer picking and cameras. */
export function mapLastChancePoint(x, y, z = 0) {
  const shoulder = (x / 1.5) ** 2;
  return { x, y: y * (.70 - .055 * shoulder),
    z: .43 + (z - .43) * .36 - .025 * shoulder + .008 * Math.sin(x * 2 + y * 3) };
}

/** Invert the mapped local face before converting pointer hits to tool space. */
export function inverseLastChanceFace(x, y) {
  return { x, y: y / (.70 - .055 * (x / 1.5) ** 2) };
}

function mapRockFaces(geometry) {
  const vertices = geometry.attributes.position, normals = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  if (!uv || !normals) return;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    // Horizontal shelves need an x/z projection. Using x/y on a constant-y
    // top stretched one texture row into the previous wood-grain streaks.
    if (Math.abs(normals.getY(i)) > .55) uv.setXY(i, x * 1.35, z * 1.35);
    else if (Math.abs(normals.getZ(i)) > .6) uv.setXY(i, x * 1.35, y * 1.35);
    else uv.setXY(i, (x + z) * 1.35, y * 1.35);
  }
  uv.needsUpdate = true;
}

const hash = n => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

// Chain the existing scanned-sediment/dry-surface shaders. No new maps or
// materials: asynchronous scanned map loading still updates these same objects.
function weatherMaterial(material, kind) {
  const compile = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey.bind(material);
  const previousKey = cacheKey();
  material.onBeforeCompile = function(shader, renderer) {
    compile.call(this, shader, renderer);
    shader.vertexShader = 'varying vec3 vWeatherPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWeatherPosition = position;');
    shader.fragmentShader = `varying vec3 vWeatherPosition;
      float weatherSegment(vec2 p, vec2 a, vec2 b) {
        vec2 ab = b - a;
        return length(p - a - ab * clamp(dot(p-a, ab) / dot(ab, ab), 0.0, 1.0));
      }\n` + shader.fragmentShader;
    const cracks = FRACTURES.map(([ax, az, bx, bz]) =>
      `fracture = min(fracture, weatherSegment(p, vec2(${ax.toFixed(3)}, ${az.toFixed(3)}), vec2(${bx.toFixed(3)}, ${bz.toFixed(3)})));`).join('\n');
    const detail = kind === 'bowl' ? `
      vec2 p = vWeatherPosition.xz;
      // Slight meanders prevent straight ink-like subdivision lines. Width is
      // subdued; the original height field stays under the brush and probe.
      p += .009 * vec2(sin(p.y * 31.0 + p.x * 9.0), sin(p.x * 27.0));
      float fracture = 10.0;
      ${cracks}
      float channel = 1.0 - smoothstep(.003, .018, fracture);
      diffuseColor.rgb *= mix(vec3(1.0), vec3(.64, .60, .56), channel * .60);
    ` : `
      // Continuous across the four merged lamina batches. Existing relief and
      // scanned normals carry the fine grain, rather than extra giant chips.
      float crust = .5 + .5 * sin(vWeatherPosition.x * 3.4 + sin(vWeatherPosition.y * 5.1));
      float stain = .5 + .5 * sin(vWeatherPosition.x * 7.1 - vWeatherPosition.y * 2.3);
      diffuseColor.rgb *= mix(vec3(.87, .88, .87), vec3(1.06, 1.04, 1.00), crust);
      diffuseColor.rgb *= 1.0 - .055 * stain;
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n' + detail);
  };
  material.customProgramCacheKey = () => `${previousKey}-world-weather-${kind}-v1`;
  material.needsUpdate = true;
}

/** Weather one persistent outcrop, sharing its coordinate mapping with tools. */
export function refineLastChance({ THREE, group, own = value => value, materials }) {
  const palette = ['#c2baa8', '#b9b19f', '#c6bdab', '#beb5a3'];
  materials.forEach((material, i) => {
    material.color.set(palette[i % palette.length]);
    material.userData.normalStrength = .29;
    weatherMaterial(material, 'layers');
  });
  group.children.forEach(mesh => {
    if (!mesh.isMesh) return;
    // Replace the existing backing mesh, preserving the original shared field
    // geometry. The core stays behind the exposed laminae after the same
    // mapping, so gaps have solid host rock without masking the crossing beds.
    const core = mesh.scale.x !== 1 || mesh.scale.y !== 1 || mesh.scale.z !== 1;
    if (core) {
      mesh.geometry = own(makeOutcropCore(THREE));
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);
      mesh.scale.set(1, 1, 1);
    }
    const vertices = mesh.geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const point = mapLastChancePoint(x, y, z);
      if (core) roundCoreRear(point, x, y, z);
      vertices.setXYZ(i, point.x, point.y, point.z);
    }
    vertices.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mapRockFaces(mesh.geometry);
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();
  });
  group.updateMatrixWorld(true);
}

/** Resize/reseat the existing nodules; keep the slab/height sampler identical. */
export function refineBerryBowl({ THREE, group, bowlHeight, grains, slab }) {
  slab.material.color.set('#c5a27a');
  slab.material.userData.normalStrength = .28;
  weatherMaterial(slab.material, 'bowl');
  grains.material.color.set('#a9afad');
  grains.material.roughness = .96;
  grains.material.metalness = 0;
  grains.material.userData.normalStrength = .12;
  const compileGrains = grains.material.onBeforeCompile;
  grains.material.onBeforeCompile = function(shader, renderer) {
    compileGrains.call(this, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor = .80 + .20 * clamp(roughnessFactor, 0.0, 1.0);');
  };
  grains.material.customProgramCacheKey = () => 'world-dry-concretions-v1';
  grains.material.needsUpdate = true;
  const dummy = new THREE.Object3D();
  const placements = [];
  for (let i = 0; i < grains.count; i++) {
    const segment = FRACTURES[Math.floor(hash(i + 1) * FRACTURES.length)];
    const t = .06 + hash(i + 101) * .88;
    // Most collect near fractures; a minority remain embedded in host rock.
    const clustered = i % 4 !== 0;
    let x = clustered ? segment[0] + (segment[2] - segment[0]) * t + (hash(i + 201) - .5) * .20
      : (hash(i + 211) - .5) * 2.45;
    let z = clustered ? segment[1] + (segment[3] - segment[1]) * t + (hash(i + 301) - .5) * .18
      : (hash(i + 311) - .5) * 1.20;
    const size = .0164 + .0164 * Math.pow(hash(i + 401), 1.8);
    // Keep the whole nodule clear of the existing probe's host-rock sample.
    // This is the original tool-space patch, not the visible shader circle.
    if (Math.hypot(x - .5, z + .1024) < .38 + size) {
      x -= .69;
      z -= .08;
    }
    // Avoid fused grapes: a small deterministic separation, while retaining
    // loose clusters and varied sizes like the source's dark concretions.
    for (const other of placements) {
      const dx = x - other.x, dz = z - other.z;
      const distance = Math.hypot(dx, dz), minimum = (size + other.size) * .85;
      if (distance < minimum) {
        const angle = distance > .0001 ? Math.atan2(dz, dx) : i * 2.4;
        x += Math.cos(angle) * (minimum - distance);
        z += Math.sin(angle) * (minimum - distance);
      }
    }
    placements.push({ x, z, size });
    const vertical = .58 + hash(i + 501) * .27;
    const embedded = i % 4 === 0;
    dummy.position.set(x, bowlHeight(x, z) + size * vertical * (embedded ? .18 : .64), z);
    dummy.rotation.set((hash(i + 601) - .5) * .24, hash(i + 701) * 6, (hash(i + 801) - .5) * .24);
    dummy.scale.set(size, size * vertical, size * (.75 + hash(i + 901) * .32));
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
    grains.setColorAt(i, new THREE.Color().setHSL(.08 + hash(i + 1001) * .04,
      .025 + hash(i + 1101) * .055, .43 + hash(i + 1201) * .20));
  }
  grains.instanceMatrix.needsUpdate = true;
  if (grains.instanceColor) grains.instanceColor.needsUpdate = true;
  grains.computeBoundingBox();
  grains.computeBoundingSphere();
  group.updateMatrixWorld(true);
}
