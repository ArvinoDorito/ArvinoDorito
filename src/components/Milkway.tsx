"use client";

import {
  Suspense, Component, type ReactNode,
  useRef, useMemo, useState, useContext, createContext, useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Structure {
  id: string;
  name: string;
  type: string;
  pos: [number, number, number]; // galaxy-local (disc in XZ plane)
  color: string;
  r: number;
  zoomDist: number; // camera distance for fly-to
  description: string;
  stats: { label: string; value: string }[];
  facts: string[];
}

// ── Galaxy rotation helpers ───────────────────────────────────────────────────
const GALAXY_EULER  = new THREE.Euler(1.26, 0.0, 0.18, "XYZ");
const GALAXY_MATRIX = new THREE.Matrix4().makeRotationFromEuler(GALAXY_EULER);
function toWorld(local: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(...local).applyMatrix4(GALAXY_MATRIX);
}

// ── Scene context ─────────────────────────────────────────────────────────────
interface SceneCtxType {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  flyToRef: React.MutableRefObject<((pos: THREE.Vector3, tgt: THREE.Vector3) => void) | null>;
}
const SceneCtx = createContext<SceneCtxType>({ selectedId: null, onSelect: () => {}, flyToRef: { current: null } });

// ── Real galactic structures (scale: 1 u ≈ 1,400 ly, disc radius ≈ 35 u) ─────
const STRUCTURES: Structure[] = [
  {
    id: "sgrA",
    name: "Sagittarius A*",
    type: "Supermassive Black Hole",
    pos: [0, 0.15, 0],
    color: "#ff6600",
    r: 0.55,
    zoomDist: 9,
    description: "The supermassive black hole anchoring the Milky Way. With 4.1 million solar masses it was first directly imaged by the Event Horizon Telescope in 2022. Stars near the core orbit it at up to 3% of the speed of light.",
    stats: [
      { label: "Mass", value: "4.1 million M☉" },
      { label: "Event horizon", value: "~44 million km" },
      { label: "Distance from Earth", value: "26,000 ly" },
      { label: "First image", value: "2022 (EHT)" },
    ],
    facts: [
      "Stars in the S-cluster orbit it in as little as 12 years.",
      "It is surprisingly dim — far quieter than quasars in other galaxies.",
      "A gamma-ray structure called the Fermi Bubbles extends 25,000 ly above and below it.",
    ],
  },
  {
    id: "bar",
    name: "Galactic Bar",
    type: "Central Bar Structure",
    pos: [7, 0, 2],
    color: "#ffaa33",
    r: 0.45,
    zoomDist: 18,
    description: "A massive elongated bar of old stars — up to 27,000 ly long — cuts through the Milky Way's centre at ~44° to the Sun–Galactic Centre line. It channels gas inward, fuelling star formation near Sgr A*.",
    stats: [
      { label: "Length", value: "~27,000 ly" },
      { label: "Orientation", value: "~44° from Sun–centre line" },
      { label: "Rotation period", value: "~100–120 Myr" },
      { label: "Dominant stars", value: "Old red giants" },
    ],
    facts: [
      "Rotates as a rigid body, unlike the differential rotation of the disc.",
      "Its pattern speed is ~38 km s⁻¹ kpc⁻¹.",
      "Evidence for the bar was confirmed by infrared surveys in the 1990s.",
    ],
  },
  {
    id: "local-arm",
    name: "Orion Arm — Local Arm",
    type: "Minor Spiral Spur",
    pos: [0, 0, 18],
    color: "#88ccff",
    r: 0.45,
    zoomDist: 20,
    description: "The Sun's home spur, wedged between the Sagittarius and Perseus Arms. Recent Gaia and VLBI data suggest it may be a full spiral arm segment ~10,000 ly long containing the Solar System, the Orion Nebula, and the Cygnus OB associations.",
    stats: [
      { label: "Width", value: "~3,500 ly" },
      { label: "Length", value: "~10,000 ly" },
      { label: "Sun from centre", value: "~26,000 ly" },
      { label: "Type", value: "Minor spur / emerging arm" },
    ],
    facts: [
      "Contains the Orion Nebula, Pleiades, and many famous star-forming regions.",
      "First recognised via 21-cm radio emission maps in the 1950s.",
      "Gaia parallaxes (2018–2022) show it may be longer than previously thought.",
    ],
  },
  {
    id: "sag-arm",
    name: "Sagittarius Arm",
    type: "Major Spiral Arm",
    pos: [5, 0, 11],
    color: "#ffdd55",
    r: 0.45,
    zoomDist: 20,
    description: "One of the Milky Way's two main spiral arms, ~6,500 ly interior to the Sun. Rich in OB associations and giant molecular clouds, hosting the Eagle Nebula, the Omega Nebula, and the Lagoon Nebula.",
    stats: [
      { label: "Interior of Sun by", value: "~6,500 ly" },
      { label: "Type", value: "Major spiral arm" },
      { label: "Key nebulae", value: "M16, M17, M8" },
      { label: "Star density", value: "Very high" },
    ],
    facts: [
      "Named for the Sagittarius constellation direction from Earth.",
      "Contains some of the galaxy's densest HII regions.",
      "The Pillars of Creation (M16) formed here ~5.5 million years ago.",
    ],
  },
  {
    id: "perseus-arm",
    name: "Perseus Arm",
    type: "Major Spiral Arm",
    pos: [-4, 0, 24],
    color: "#aaddff",
    r: 0.45,
    zoomDist: 22,
    description: "The second major spiral arm, ~6,400 ly exterior to the Sun. One of the most luminous arms, packed with young blue OB supergiants. The spectacular Double Cluster (NGC 869/884) sits within it.",
    stats: [
      { label: "Exterior of Sun by", value: "~6,400 ly" },
      { label: "Type", value: "Major spiral arm" },
      { label: "Key objects", value: "Double Cluster, W3, NGC 1491" },
      { label: "Dominant stars", value: "Young OB supergiants" },
    ],
    facts: [
      "Contains the Double Cluster — visible to the naked eye.",
      "W3 is one of the most massive star-forming complexes in the outer galaxy.",
      "Perseus OB1 association includes some of the brightest stars in the Milky Way.",
    ],
  },
  {
    id: "scutum-arm",
    name: "Scutum–Centaurus Arm",
    type: "Major Spiral Arm",
    pos: [-14, 0, -9],
    color: "#ff9966",
    r: 0.45,
    zoomDist: 22,
    description: "The most massive spiral arm, originating from the far end of the galactic bar. It sweeps ~60,000 ly and hosts W43 and W51 — two of the most luminous HII regions in the galaxy.",
    stats: [
      { label: "Type", value: "Major spiral arm" },
      { label: "Origin", value: "Far end of galactic bar" },
      { label: "Key objects", value: "W43, W51, Scutum Star Cloud" },
      { label: "Span", value: "~60,000 ly" },
    ],
    facts: [
      "W43 produces as much UV radiation as 3.5 million Suns combined.",
      "The Scutum Star Cloud is one of the densest star fields visible from Earth.",
      "It may be the longest arm, wrapping more than halfway around the galaxy.",
    ],
  },
  {
    id: "norma-arm",
    name: "Norma / Outer Arm",
    type: "Outer Spiral Arm",
    pos: [-20, 0, 10],
    color: "#cc99ff",
    r: 0.38,
    zoomDist: 22,
    description: "Sits at the farthest observable edge of the Milky Way's disc. Detected primarily through radio (HI) and infrared observations, it marks the boundary of the galaxy's active star-forming disc.",
    stats: [
      { label: "Distance from centre", value: "~35,000–45,000 ly" },
      { label: "Type", value: "Outer spiral arm" },
      { label: "Detection", value: "21-cm radio / IR" },
      { label: "Star density", value: "Low" },
    ],
    facts: [
      "Difficult to observe due to dust obscuring the galactic plane.",
      "Marks the approximate outer boundary of active star formation.",
      "Some surveys suggest the disc continues further as a warped sheet.",
    ],
  },
  {
    id: "orion-nebula",
    name: "Orion Nebula — M42",
    type: "Emission Nebula / Stellar Nursery",
    pos: [0.55, -0.25, 17.2],
    color: "#dd88ff",
    r: 0.25,
    zoomDist: 10,
    description: "The closest large stellar nursery to Earth and one of the most studied objects in astronomy. The Trapezium Cluster at its core illuminates the surrounding cloud. Over 700 stars in various stages of formation have been catalogued here.",
    stats: [
      { label: "Distance", value: "1,344 ly" },
      { label: "Diameter", value: "~40 ly" },
      { label: "Mass", value: "~2,000 M☉" },
      { label: "Trapezium age", value: "~300,000 years" },
    ],
    facts: [
      "Visible to the naked eye as the fuzzy middle star of Orion's sword.",
      "Hubble found ~150 protoplanetary discs (proplyds) inside it in 1993.",
      "The bright region is just the surface of a much larger cold molecular cloud.",
    ],
  },
  {
    id: "eagle-nebula",
    name: "Eagle Nebula — M16",
    type: "Pillars of Creation",
    pos: [5.2, 0.25, 11.5],
    color: "#88ffcc",
    r: 0.28,
    zoomDist: 12,
    description: "Home to the iconic Pillars of Creation — towering columns of gas and dust sculpted by intense UV radiation from young stars. First imaged by Hubble in 1995. A nearby supernova may have already destroyed them.",
    stats: [
      { label: "Distance", value: "7,000 ly" },
      { label: "Pillar height", value: "Up to 9.5 ly" },
      { label: "Nebula diameter", value: "~70 ly" },
      { label: "Cluster age", value: "~1–2 million years" },
    ],
    facts: [
      "One of the most famous Hubble images — taken in 1995.",
      "A Spitzer IR image (2007) suggests a supernova may have already vaporised the pillars.",
      "Light from any such destruction won't reach Earth for about 1,000 more years.",
    ],
  },
];

// ── Shaders ───────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3  aColor;
  attribute float aBright;
  varying   vec3  vColor;
  varying   float vBright;
  void main() {
    vColor  = aColor;
    vBright = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (420.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  varying vec3  vColor;
  varying float vBright;
  void main() {
    vec2  uv = gl_PointCoord - 0.5;
    float d  = length(uv);
    if (d > 0.5) discard;
    float a = clamp(exp(-d * 10.0) + pow(max(0.0, 1.0 - d * 2.0), 2.5) * 0.55, 0.0, 1.0) * vBright;
    gl_FragColor = vec4(vColor * a * 1.6, a);
  }
`;

// ── Noise (FBM) ───────────────────────────────────────────────────────────────
function hash(n: number) { return (Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1; }
function noise2(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx*fx*(3-2*fx), uz = fz*fz*(3-2*fz);
  const a = Math.abs(hash(ix   + iz*57)),   b = Math.abs(hash(ix+1 + iz*57));
  const c = Math.abs(hash(ix   + (iz+1)*57)), d = Math.abs(hash(ix+1 + (iz+1)*57));
  return a + ux*(b-a) + uz*(c-a) + ux*uz*(a-b-c+d);
}
function fbm(x: number, z: number) {
  let v = 0, amp = 0.5, freq = 1;
  for (let o = 0; o < 4; o++) { v += noise2(x*freq, z*freq)*amp; amp*=0.5; freq*=2.1; }
  return v;
}

// ── Galaxy stars ──────────────────────────────────────────────────────────────
const STAR_MAT = new THREE.ShaderMaterial({
  vertexShader: VERT, fragmentShader: FRAG,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});

function GalaxyStars({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors, sizes, brights } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);
    const brights   = new Float32Array(count);
    const wW = new THREE.Color("#fff5e0"), cA = new THREE.Color("#ffcc66");
    const bW = new THREE.Color("#c0d4ff"), hB = new THREE.Color("#90aaff");
    const wh = new THREE.Color("#ffffff"), du = new THREE.Color("#cc8833");
    const R = 14, MAX = 40, VOID_R = 5.0;
    let i = 0;
    while (i < count) {
      const roll = Math.random();
      let x = 0, y = 0, z = 0, col: THREE.Color, size: number, bright: number;
      if (roll < 0.20) {
        const r = Math.pow(Math.random(), 3.5)*6.5, th = Math.random()*Math.PI*2, ph = (Math.random()-0.5)*Math.PI;
        if (r < VOID_R) continue;
        x = r*Math.cos(th)*Math.cos(ph); y = r*Math.sin(ph)*0.55; z = r*Math.sin(th)*Math.cos(ph);
        const tf = 1 - r/6.5;
        col = wW.clone().lerp(cA, 0.3+Math.random()*0.5);
        size = 0.4+tf*3.2+Math.random()*0.9; bright = 0.55+tf*0.55+Math.random()*0.25;
      } else if (roll < 0.92) {
        const r = -R * Math.log(Math.max(Math.random(), 1e-6)) * 0.55;
        if (r > MAX || r < VOID_R) continue;
        const angle = Math.random()*Math.PI*2;
        y = (Math.random()-0.5)*2*(0.25+(r/MAX)*0.55)*(1.5+r*0.04);
        const fv = fbm(Math.cos(angle)*r*0.12, Math.sin(angle)*r*0.12);
        if (Math.random() > Math.exp(-r/(R*0.9))*0.55 + fv*0.55 + 0.08) continue;
        x = Math.cos(angle)*r+(Math.random()-0.5)*1.8; z = Math.sin(angle)*r+(Math.random()-0.5)*1.8;
        const tf = r/MAX;
        col = r<5 ? wW.clone().lerp(bW, Math.random()*0.4) : r<18 ? bW.clone().lerp(wh, Math.random()) : bW.clone().lerp(du, Math.random()*0.5);
        if (Math.random()<0.05) { col=hB.clone().lerp(wh,Math.random()); size=0.8+Math.random()*2.2; bright=0.75+Math.random()*0.45; }
        else { size=0.12+(1-tf)*1.1+Math.random()*0.5; bright=0.15+fv*0.6+Math.random()*0.35; }
      } else {
        const r=12+Math.pow(Math.random(),0.4)*28, th=Math.random()*Math.PI*2, ph=(Math.random()-0.5)*Math.PI*0.6;
        x=Math.cos(th)*Math.cos(ph)*r+(Math.random()-0.5)*5; y=Math.sin(ph)*r*0.5; z=Math.sin(th)*Math.cos(ph)*r+(Math.random()-0.5)*5;
        col=du.clone().lerp(new THREE.Color("#aa7733"),Math.random()); size=0.08+Math.random()*0.22; bright=0.06+Math.random()*0.22;
      }
      // Hard 3-D distance guard — catches jitter that slips inside the void
      if (x*x + y*y + z*z < VOID_R * VOID_R) continue;
      positions[i*3]=x; positions[i*3+1]=y; positions[i*3+2]=z;
      colors[i*3]=col.r; colors[i*3+1]=col.g; colors[i*3+2]=col.b;
      sizes[i]=size; brights[i]=bright; i++;
    }
    return { positions, colors, sizes, brights };
  }, [count]);

  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.016; });

  return (
    <points ref={ref} material={STAR_MAT}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor"   args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize"    args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aBright"  args={[brights, 1]} />
      </bufferGeometry>
    </points>
  );
}

// ── Core glow (outer orange halo only — inner region is the black hole) ────────
function CoreGlow() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.016; });
  return (
    <group ref={ref}>
      <pointLight color="#ffaa33" intensity={8} distance={80} decay={2} />
      <pointLight color="#334488" intensity={2.0} distance={120} decay={2} />
      {([
        [7.5,"#ffcc55",0.14],[11,"#ff9900",0.09],[16,"#cc5500",0.05],[22,"#441100",0.03],
      ] as [number,string,number][]).map(([r,c,op]) => (
        <mesh key={r}>
          <sphereGeometry args={[r,16,16]} />
          <meshBasicMaterial color={c} transparent opacity={op} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Black hole (Sagittarius A*) ───────────────────────────────────────────────
function BlackHole() {
  const diskRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (diskRef.current) diskRef.current.rotation.y = t * 0.18;
    if (glowRef.current) {
      const pulse = 1 + 0.06 * Math.sin(t * 1.3);
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      {/* Strong warm light illuminating the accretion disk */}
      <pointLight color="#ff8822" intensity={35} distance={25} decay={1.6} />
      <pointLight color="#ffffff" intensity={12} distance={15} decay={2} />

      {/* Wide soft glow behind everything */}
      {([
        [3.5, "#ff6600", 0.18],
        [5.5, "#cc3300", 0.10],
        [8.0, "#661100", 0.05],
      ] as [number, string, number][]).map(([r, c, op]) => (
        <mesh key={r}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshBasicMaterial color={c} transparent opacity={op} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}

      {/* Event horizon — solid black, occludes stars behind it */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Photon / lensing ring right at the shadow boundary */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.18, 2.55, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Accretion disk — inclined 15°, slowly rotating */}
      <group ref={diskRef} rotation={[0.26, 0, 0]}>
        <mesh>
          <ringGeometry args={[2.5, 3.6, 96]} />
          <meshBasicMaterial color="#fff0d0" transparent opacity={0.98} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[3.5, 5.0, 96]} />
          <meshBasicMaterial color="#ff8800" transparent opacity={0.82} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[4.9, 6.8, 96]} />
          <meshBasicMaterial color="#cc3300" transparent opacity={0.50} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[6.6, 9.0, 96]} />
          <meshBasicMaterial color="#771100" transparent opacity={0.22} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* Relativistic jets along the rotation axis */}
      <group ref={glowRef}>
        {[1, -1].map(dir => (
          <mesh key={dir} position={[0, dir * 6, 0]}>
            <cylinderGeometry args={[0.1, 0.5, 7, 16]} />
            <meshBasicMaterial color="#99ccff" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
        {[1, -1].map(dir => (
          <mesh key={`outer-${dir}`} position={[0, dir * 10, 0]}>
            <cylinderGeometry args={[0.04, 0.4, 8, 12]} />
            <meshBasicMaterial color="#6699ff" transparent opacity={0.10} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── Background stars ──────────────────────────────────────────────────────────
function BackgroundStars() {
  const ref = useRef<THREE.Points>(null);
  const { pos, col } = useMemo(() => {
    const n = 10000, pos = new Float32Array(n*3), col = new Float32Array(n*3);
    const pal = ["#ffffff","#cce4ff","#ffeedd","#ffd8ee"].map(c => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), r=300+Math.random()*700;
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
      const c=pal[Math.floor(Math.random()*4)], b=0.3+Math.random()*0.7;
      col[i*3]=c.r*b; col[i*3+1]=c.g*b; col[i*3+2]=c.b*b;
    }
    return { pos, col };
  }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.002; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color"    args={[col, 3]} />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.2} sizeAttenuation transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ── Structure marker ──────────────────────────────────────────────────────────
function StructureMarker({ s }: { s: Structure }) {
  const { selectedId, onSelect, flyToRef } = useContext(SceneCtx);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedId === s.id;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.scale.setScalar(1 + (isSelected ? 0.28 : hovered ? 0.18 : 0.07) * Math.sin(t * 3));
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.4 + 0.35*Math.sin(t*2) : 0.12;
    }
  });

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const next = isSelected ? null : s.id;
    onSelect(next);
    if (next && flyToRef.current) {
      const wp = toWorld(s.pos);
      const dir = wp.length() < 2 ? new THREE.Vector3(0.4, 0.55, 0.75).normalize() : wp.clone().normalize();
      const camPos = wp.clone().add(dir.clone().multiplyScalar(s.zoomDist)).add(new THREE.Vector3(0, s.zoomDist * 0.25, 0));
      flyToRef.current(camPos, wp);
    }
  }, [isSelected, s, onSelect, flyToRef]);

  return (
    <group position={s.pos}>
      <mesh>
        <sphereGeometry args={[s.r * 2.5, 12, 12]} />
        <meshBasicMaterial color={s.color} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh
        ref={meshRef}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut ={() => { setHovered(false); document.body.style.cursor = "default"; }}
        onClick={handleClick}
      >
        <sphereGeometry args={[s.r, 16, 16]} />
        <meshBasicMaterial color={isSelected || hovered ? "#ffffff" : s.color}
          transparent opacity={isSelected || hovered ? 0.92 : 0.72}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[s.r*1.5, s.r*1.85, 28]} />
        <meshBasicMaterial color={s.color} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html position={[0, s.r * 2.6 + 0.15, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          color: isSelected ? "#fff" : hovered ? "#fff" : s.color,
          fontSize: 10, fontFamily: "monospace", fontWeight: isSelected ? 700 : 400,
          letterSpacing: "0.08em", whiteSpace: "nowrap",
          textShadow: `0 0 8px ${s.color}, 0 0 18px ${s.color}`,
          opacity: isSelected || hovered ? 1 : 0.72,
          transition: "color 0.2s, opacity 0.2s",
        }}>
          {s.name.split("—")[0].trim()}
        </div>
      </Html>
    </group>
  );
}

// ── Camera controller + smooth fly-to ─────────────────────────────────────────
const _flyTgt = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), active: false };

function CameraController() {
  const { flyToRef } = useContext(SceneCtx);
  const { camera }   = useThree();
  const ctrlRef      = useRef<any>(null);

  flyToRef.current = useCallback((pos: THREE.Vector3, tgt: THREE.Vector3) => {
    _flyTgt.pos.copy(pos); _flyTgt.tgt.copy(tgt); _flyTgt.active = true;
  }, []);

  useFrame(() => {
    if (!_flyTgt.active) return;
    camera.position.lerp(_flyTgt.pos, 0.055);
    if (ctrlRef.current) { ctrlRef.current.target.lerp(_flyTgt.tgt, 0.055); ctrlRef.current.update(); }
    if (camera.position.distanceTo(_flyTgt.pos) < 0.3) _flyTgt.active = false;
  });

  return (
    <OrbitControls
      ref={ctrlRef}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={5}
      maxDistance={180}
      zoomSpeed={1.3}
      rotateSpeed={0.6}
      panSpeed={0.8}
      onStart={() => { _flyTgt.active = false; }}
    />
  );
}

// ── Galaxy scene ──────────────────────────────────────────────────────────────
function Galaxy() {
  return (
    <>
      <ambientLight intensity={0.01} />
      <fog attach="fog" args={["#000007", 150, 700]} />
      <BackgroundStars />
      <CameraController />
      <group rotation={[1.26, 0.0, 0.18]}>
        <BlackHole />
        <CoreGlow />
        <GalaxyStars count={250000} />
        {STRUCTURES.map(s => <StructureMarker key={s.id} s={s} />)}
      </group>
    </>
  );
}

// ── Info panel ────────────────────────────────────────────────────────────────
function InfoPanel({ s, onClose }: { s: Structure; onClose: () => void }) {
  return (
    <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", width:292, zIndex:20, fontFamily:"system-ui,sans-serif", animation:"slideIn 0.2s ease" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-50%) translateX(10px)}to{opacity:1;transform:translateY(-50%)}}`}</style>
      <div style={{ background:"rgba(3,3,15,0.88)", backdropFilter:"blur(18px)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:14, overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,${s.color},transparent)` }} />
        <div style={{ padding:"16px 18px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div style={{ color:"#fff", fontSize:16, fontWeight:700, lineHeight:1.2 }}>{s.name.split("—")[0].trim()}</div>
              {s.name.includes("—") && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 }}>{s.name.split("—")[1].trim()}</div>}
              <div style={{ color:s.color, fontSize:9, textTransform:"uppercase", letterSpacing:"0.13em", marginTop:4, opacity:0.85 }}>{s.type}</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:17, padding:2 }}>✕</button>
          </div>
          <p style={{ color:"rgba(255,255,255,0.58)", fontSize:11.5, lineHeight:1.65, marginBottom:12 }}>{s.description}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
            {s.stats.map(st => (
              <div key={st.label} style={{ background:"rgba(255,255,255,0.05)", borderRadius:7, padding:"7px 9px" }}>
                <div style={{ color:"rgba(255,255,255,0.38)", fontSize:8.5, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>{st.label}</div>
                <div style={{ color:"#fff", fontSize:10.5, fontWeight:600, fontFamily:"monospace" }}>{st.value}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10 }}>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:8.5, textTransform:"uppercase", letterSpacing:"0.13em", marginBottom:7 }}>Notable Facts</div>
            {s.facts.map((f, i) => (
              <div key={i} style={{ display:"flex", gap:7, marginBottom:5, alignItems:"flex-start" }}>
                <span style={{ color:s.color, fontSize:9, marginTop:1.5, flexShrink:0 }}>▸</span>
                <span style={{ color:"rgba(255,255,255,0.52)", fontSize:10.5, lineHeight:1.55 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preset view buttons ────────────────────────────────────────────────────────
function ViewControls() {
  const { flyToRef } = useContext(SceneCtx);
  const fly = useCallback((p: [number,number,number], t: [number,number,number] = [0,0,0]) => {
    flyToRef.current?.(new THREE.Vector3(...p), new THREE.Vector3(...t));
  }, [flyToRef]);

  const btn: React.CSSProperties = {
    background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.11)",
    color:"rgba(255,255,255,0.62)", borderRadius:7, padding:"5px 12px",
    fontSize:10.5, cursor:"pointer", fontFamily:"monospace", letterSpacing:"0.06em",
    backdropFilter:"blur(8px)", transition:"background 0.15s",
  };

  return (
    <div style={{ position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)", zIndex:20, display:"flex", gap:7 }}>
      {([
        ["Overview",    [12,18,52],   [0,0,0]],
        ["Core",        [3,6,12],     [0,0,0]],
        ["Edge-On",     [0,5,68],     [0,0,0]],
        ["Top-Down",    [0,75,4],     [0,0,0]],
      ] as [string,[number,number,number],[number,number,number]][]).map(([label, p, t]) => (
        <button key={label} style={btn}
          onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.13)")}
          onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.06)")}
          onClick={() => fly(p, t)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Structure list (left sidebar) ─────────────────────────────────────────────
function StructureList() {
  const { selectedId, onSelect, flyToRef } = useContext(SceneCtx);

  const handleClick = useCallback((s: Structure) => {
    const next = selectedId === s.id ? null : s.id;
    onSelect(next);
    if (next && flyToRef.current) {
      const wp = toWorld(s.pos);
      const dir = wp.length() < 2 ? new THREE.Vector3(0.4, 0.55, 0.75).normalize() : wp.clone().normalize();
      const camPos = wp.clone().add(dir.clone().multiplyScalar(s.zoomDist)).add(new THREE.Vector3(0, s.zoomDist * 0.25, 0));
      flyToRef.current(camPos, wp);
    }
  }, [selectedId, onSelect, flyToRef]);

  return (
    <div style={{
      position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
      zIndex:20, fontFamily:"system-ui,sans-serif",
      background:"rgba(3,3,15,0.78)", backdropFilter:"blur(14px)",
      border:"1px solid rgba(255,255,255,0.08)", borderRadius:12,
      overflow:"hidden", minWidth:158, maxHeight:"72vh", overflowY:"auto",
    }}>
      <div style={{ padding:"9px 13px 7px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ color:"rgba(255,255,255,0.3)", fontSize:8.5, textTransform:"uppercase", letterSpacing:"0.15em" }}>Milky Way</div>
      </div>
      {STRUCTURES.map(s => {
        const active = selectedId === s.id;
        return (
          <button key={s.id} onClick={() => handleClick(s)} style={{
            width:"100%", display:"flex", alignItems:"center", gap:8, padding:"7px 13px",
            background: active ? "rgba(255,255,255,0.1)" : "transparent",
            border:"none", cursor:"pointer", textAlign:"left",
          }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.055)"; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background="transparent"; }}
          >
            <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:s.color, flexShrink:0, boxShadow: active ? `0 0 7px ${s.color}` : "none" }} />
            <div>
              <div style={{ color: active ? "#fff" : "rgba(255,255,255,0.68)", fontSize:10.5, fontWeight: active ? 600 : 400, lineHeight:1.2 }}>
                {s.name.split("—")[0].trim()}
              </div>
              <div style={{ color:"rgba(255,255,255,0.28)", fontSize:8.5, marginTop:1 }}>{s.type.split("/")[0].trim()}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────
class WebGLErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  constructor(p: {children:ReactNode}) { super(p); this.state={failed:false}; }
  componentDidCatch() { this.setState({failed:true}); }
  static getDerivedStateFromError() { return {failed:true}; }
  render() {
    return this.state.failed
      ? <div style={{width:"100vw",height:"100vh",background:"#000007",display:"flex",alignItems:"center",justifyContent:"center",color:"#555",fontFamily:"sans-serif"}}>WebGL required.</div>
      : this.props.children;
  }
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Milkway() {
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const flyToRef = useRef<((pos: THREE.Vector3, tgt: THREE.Vector3) => void) | null>(null);
  const selected  = STRUCTURES.find(s => s.id === selectedId) ?? null;
  const ctx = useMemo(() => ({ selectedId, onSelect: setSelectedId, flyToRef }), [selectedId]);

  return (
    <SceneCtx.Provider value={ctx}>
      <div style={{ width:"100vw", height:"100vh", background:"#000007", overflow:"hidden", position:"relative" }}>

        <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", zIndex:20, textAlign:"center", pointerEvents:"none" }}>
          <div style={{ color:"rgba(255,255,255,0.72)", fontSize:13, fontFamily:"monospace", letterSpacing:"0.28em", textTransform:"uppercase" }}>Milky Way Explorer</div>
          <div style={{ color:"rgba(255,255,255,0.25)", fontSize:9.5, fontFamily:"monospace", marginTop:3, letterSpacing:"0.1em" }}>Drag · Scroll · Click to explore</div>
        </div>

        <StructureList />
        {selected && <InfoPanel s={selected} onClose={() => setSelectedId(null)} />}
        <ViewControls />

        <WebGLErrorBoundary>
          <Canvas
            camera={{ position:[12,18,52], fov:58, near:0.1, far:2000 }}
            gl={{ antialias:true, alpha:false, failIfMajorPerformanceCaveat:false }}
            dpr={[1, 1.5]}
          >
            <Suspense fallback={null}>
              <Galaxy />
            </Suspense>
          </Canvas>
        </WebGLErrorBoundary>

      </div>
    </SceneCtx.Provider>
  );
}
