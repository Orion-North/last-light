// A static, low-cost interpretation of the dusty Martian atmosphere. The
// palette remains controlled by landscape.js, including storm and night fades.
export function createSky(THREE, { own, sunDirection }) {
  const uniforms = {
    top: { value: new THREE.Color('#776558') },
    horizon: { value: new THREE.Color('#dca97d') },
    lower: { value: new THREE.Color('#976748') },
    sunDirection: { value: sunDirection.clone().normalize() },
    sunColor: { value: new THREE.Color('#ffe4b4') },
    sunStrength: { value: 1 },
  };
  const geometry = own(new THREE.SphereGeometry(300, 32, 20));
  const material = own(new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying vec3 vPosition;
      uniform vec3 top; uniform vec3 horizon; uniform vec3 lower;
      uniform vec3 sunDirection; uniform vec3 sunColor; uniform float sunStrength;
      void main() {
        vec3 direction = normalize(vPosition);
        float elevation = direction.y;
        float height = clamp(elevation, 0.0, 1.0);
        vec3 sky = mix(horizon, top, pow(height, 0.55));
        sky = mix(sky, lower, smoothstep(0.0, 0.23, -elevation));

        // Low, broad dust layers add depth around the entire horizon. The
        // modulation is deliberately soft and stationary.
        float haze = exp(-abs(elevation - 0.035) * 12.0);
        float bands = sin(elevation * 45.0 + direction.x * 3.0)
                    * sin(elevation * 18.0 - direction.z * 2.0);
        sky += horizon * haze * (0.07 + 0.025 * bands);

        // Faint, stretched high-altitude dust veils; no texture fetches or
        // time-dependent animation. Keep their contrast tied to the palette.
        float veilWindow = smoothstep(0.13, 0.32, elevation)
                         * (1.0 - smoothstep(0.60, 0.88, elevation));
        float wisps = sin(direction.y * 47.0 + direction.x * 5.0
                          + sin(direction.z * 5.0) * 1.8);
        wisps *= sin(direction.y * 21.0 - direction.z * 4.0);
        sky += horizon * veilWindow * max(wisps, 0.0) * 0.035;

        float alignment = clamp(dot(direction, normalize(sunDirection)), 0.0, 1.0);
        // Fine dust forward-scatters blue light near a low Martian sun.
        float blueHalo = pow(alignment, 32.0) * smoothstep(-0.08, 0.08, elevation);
        sky = mix(sky, vec3(0.46, 0.57, 0.67), blueHalo * 0.52 * clamp(sunStrength, 0.0, 1.0));
        float glow = pow(alignment, 120.0) * 0.13;
        float disk = smoothstep(0.99990, 0.99996, alignment);
        sky += sunColor * (glow + disk * 1.2) * sunStrength;
        gl_FragColor = vec4(sky, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  return { mesh: new THREE.Mesh(geometry, material), uniforms };
}
