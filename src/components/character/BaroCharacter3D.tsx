import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BackSide, Shape, type Group } from "three";
import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { characterInk } from "./characterAppearance";
import { resolveCharacter3D } from "./character3dAppearance";

type Appearance = ReturnType<typeof resolveCharacter3D>;

const heartShape = new Shape();
heartShape.moveTo(0, -0.17);
heartShape.bezierCurveTo(-0.31, 0.02, -0.13, 0.23, 0, 0.08);
heartShape.bezierCurveTo(0.13, 0.23, 0.31, 0.02, 0, -0.17);
const starShape = new Shape();
for (let index = 0; index < 10; index++) {
  const angle = -Math.PI / 2 + index * Math.PI / 5;
  const radius = index % 2 === 0 ? 0.19 : 0.085;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  if (index === 0) starShape.moveTo(x, y);
  else starShape.lineTo(x, y);
}
starShape.closePath();

function Ball({ position, scale, color, rotation, outline = false }: { position: [number, number, number]; scale: [number, number, number]; color: string; rotation?: [number, number, number]; outline?: boolean }) {
  return <group position={position} rotation={rotation}><mesh scale={scale}><sphereGeometry args={[1, 28, 18]} /><meshToonMaterial color={color} /></mesh>{outline && <mesh scale={[scale[0] * 1.09, scale[1] * 1.09, scale[2] * 1.09]}><sphereGeometry args={[1, 28, 18]} /><meshBasicMaterial color={characterInk} side={BackSide} /></mesh>}</group>;
}

function Ears({ look }: { look: Appearance }) {
  if (look.ears === "none") return null;
  const pointed = look.ears === "cat" || look.ears === "point" || look.ears === "horn";
  return <group>{[-1, 1].map((side) => <group key={side} position={[side * 0.59, 0.8, look.body === "mushroom" || look.body === "cloud" ? 0.62 : 0]} rotation={[0, 0, -side * (look.ears === "leaf" ? 0.72 : 0.18)]}>
    {pointed ? <mesh scale={look.ears === "horn" ? [0.2, 0.45, 0.21] : [0.27, 0.38, 0.19]}><coneGeometry args={[1, 1, 4]} /><meshToonMaterial color={look.ears === "horn" ? look.palette.accent : look.palette.body} /></mesh> : <Ball position={[0, 0, 0]} scale={look.ears === "leaf" ? [0.39, 0.18, 0.12] : [0.28, 0.29, 0.2]} color={look.ears === "leaf" ? look.palette.shade : look.palette.body} outline />}
    {look.ears === "cat" && <Ball position={[0, -0.09, 0.17]} scale={[0.08, 0.11, 0.025]} color={look.palette.accent} />}
    {look.ears === "antenna" && <Ball position={[0, 0.29, 0]} scale={[0.12, 0.12, 0.12]} color={look.palette.accent} />}
  </group>)}</group>;
}

function Eyes({ look, faceZ }: { look: Appearance; faceZ: number }) {
  if (look.eyes === "sleepy") return <group>{[-1, 1].map((side) => <Ball key={side} position={[side * 0.3, 0.1, faceZ]} scale={[0.15, 0.035, 0.025]} color={characterInk} rotation={[0, 0, side * 0.13]} />)}</group>;
  return <group>{[-1, 1].map((side) => <group key={side} position={[side * 0.3, 0.1, faceZ]}>{look.eyes === "spark" ? <><Ball position={[0, 0, 0]} scale={[0.13, 0.045, 0.025]} color={characterInk} rotation={[0, 0, 0.75]} /><Ball position={[0, 0, 0]} scale={[0.13, 0.045, 0.025]} color={characterInk} rotation={[0, 0, -0.75]} /></> : <><Ball position={[0, 0, 0]} scale={look.eyes === "wide" ? [0.15, 0.18, 0.04] : look.eyes === "oval" ? [0.08, 0.14, 0.03] : [0.09, 0.1, 0.03]} color={characterInk} />{look.eyes === "wide" && <Ball position={[-0.045, 0.055, 0.04]} scale={[0.035, 0.045, 0.012]} color="#fffaf0" />}</>}</group>)}</group>;
}

function BodyMark({ look, faceZ }: { look: Appearance; faceZ: number }) {
  if (look.mark === "none") return null;
  if (look.mark === "spots") return <group><Ball position={[-0.18, -0.43, faceZ * 0.91]} scale={[0.11, 0.09, 0.02]} color={look.palette.accent} /><Ball position={[0.2, -0.48, faceZ * 0.89]} scale={[0.07, 0.07, 0.02]} color={look.palette.accent} /></group>;
  if (look.mark === "stripe") return <Ball position={[0, -0.47, faceZ * 0.97]} scale={[0.34, 0.065, 0.025]} color={look.palette.accent} rotation={[0, 0, -0.12]} />;
  if (look.mark === "moon") return <group><Ball position={[0.02, -0.43, faceZ * 0.97]} scale={[0.14, 0.16, 0.025]} color={look.palette.accent} /><Ball position={[0.08, -0.37, faceZ * 0.99]} scale={[0.12, 0.14, 0.027]} color={look.palette.body} /></group>;
  if (look.mark === "star") return <mesh position={[0, -0.43, faceZ * 0.97]}><extrudeGeometry args={[starShape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }]} /><meshToonMaterial color={look.palette.accent} /></mesh>;
  return <mesh position={[0, -0.43, faceZ * 0.96]}><extrudeGeometry args={[heartShape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.013, bevelThickness: 0.013, bevelSegments: 2 }]} /><meshToonMaterial color={look.palette.accent} /></mesh>;
}

function BodyPattern({ look }: { look: Appearance }) {
  const points = look.patternPoints;
  const p = look.pattern;
  const count = p === "egg" ? 5 : p === "error404" ? 11 : p === "freckles" ? 28 : p === "potato" ? 20 : p === "constellation" ? 11 : p === "bubbles" ? 16 : 13;
  return <group>{points.slice(0, count).map((point, index) => {
    const u = (point.x - 110) / 75;
    const v = (155 - point.y) / 88;
    const distance = u * u + v * v;
    if (distance > 0.88) return null;
    const x = u * look.bodyScale[0] * 0.92;
    const y = v * look.bodyScale[1] * 0.92;
    const z = look.body === "boxy" ? look.bodyScale[2] + 0.028 : Math.sqrt(1 - distance) * look.bodyScale[2] + 0.028;
    const size = point.size / 70;
    if (p === "egg") return <group key={index} position={[x, y, z]}><Ball position={[0, 0, 0]} scale={[size * 1.5, size, 0.018]} color="#fffaf0" /><Ball position={[0, 0, 0.025]} scale={[size * 0.57, size * 0.57, 0.018]} color="#f3ba48" /></group>;
    if (p === "bubbles" || p === "constellation") return <group key={index} position={[x, y, z]}><Ball position={[0, 0, 0]} scale={[size, size, 0.016]} color="#fffaf0" /><Ball position={[0, 0, 0.012]} scale={[size * 0.65, size * 0.65, 0.016]} color={look.palette.body} /></group>;
    if (p === "sprouts") return <group key={index} position={[x, y, z]}><Ball position={[0, 0, 0]} scale={[0.018, size * 1.8, 0.015]} color={look.palette.shade} /><Ball position={[-size * 0.6, size * 0.5, 0]} scale={[size * 0.7, size * 0.33, 0.015]} color={look.palette.shade} /><Ball position={[size * 0.6, size * 0.5, 0]} scale={[size * 0.7, size * 0.33, 0.015]} color={look.palette.shade} /></group>;
    const line = ["stripes", "waves", "marble", "zigzag", "ramen"].includes(p);
    const color = p === "ramen" ? "#f7e4a8" : ["polka", "hearts", "paint", "petals"].includes(p) ? look.palette.accent : p === "potato" ? "#987352" : look.palette.shade;
    return <Ball key={index} position={[x, y, z]} scale={line ? [size * 0.5, size * 2.2, 0.018] : p === "freckles" || p === "potato" ? [size * 0.4, size * 0.4, 0.018] : p === "checker" || p === "mosaic" || p === "error404" ? [size * 0.9, size * 0.8, 0.018] : [size, size, 0.018]} color={color} rotation={line ? [0, 0, point.turn * Math.PI / 180] : undefined} />;
  })}{p === "error404" && <group position={[0, -0.58, look.bodyScale[2] + 0.05]}><mesh><boxGeometry args={[0.6, 0.24, 0.04]} /><meshToonMaterial color="#fffaf0" /></mesh><mesh position={[0, 0, 0.025]}><boxGeometry args={[0.41, 0.045, 0.01]} /><meshBasicMaterial color={characterInk} /></mesh></group>}{p === "ramen" && <Ball position={[0, -0.55, look.bodyScale[2] + 0.045]} scale={[0.3, 0.17, 0.05]} color="#fff5da" />}</group>;
}

function CharacterProp({ look }: { look: Appearance }) {
  const faceZ = look.bodyScale[2] + 0.13;
  if (look.prop === "halo") return <mesh position={[0, 1.04, 0]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.39, 0.055, 8, 32]} /><meshToonMaterial color="#fff1a9" /></mesh>;
  if (look.prop === "cat-ears") return <group>{[-1, 1].map((side) => <mesh key={side} position={[side * 0.49, 1.05, 0.08]} rotation={[0, 0, side * 0.15]}><coneGeometry args={[0.2, 0.37, 4]} /><meshToonMaterial color="#f4abc1" /></mesh>)}</group>;
  if (look.prop === "egg" || look.pattern === "egg") return <group position={[0.57, 0.96, look.body === "mushroom" ? 0.78 : 0.29]}><Ball position={[0, 0, 0]} scale={[0.22, 0.17, 0.07]} color="#fffaf0" /><Ball position={[0, 0, 0.07]} scale={[0.1, 0.1, 0.025]} color="#f5bd4f" /></group>;
  if (look.prop === "flower") return <group position={[0.58, 0.95, 0.28]}>{Array.from({ length: 5 }, (_, index) => <Ball key={index} position={[Math.sin(index * Math.PI * 2 / 5) * 0.13, Math.cos(index * Math.PI * 2 / 5) * 0.13, 0]} scale={[0.09, 0.09, 0.04]} color="#fff1d5" />)}<Ball position={[0, 0, 0.05]} scale={[0.08, 0.08, 0.03]} color="#f2bb63" /></group>;
  if (look.prop === "headphones") return <group><mesh position={[0, 0.46, 0]}><torusGeometry args={[0.82, 0.065, 8, 32, Math.PI]} /><meshToonMaterial color="#5fa9c9" /></mesh>{[-1, 1].map((side) => <Ball key={side} position={[side * 0.83, 0.14, 0]} scale={[0.13, 0.27, 0.16]} color="#f4bd80" outline />)}</group>;
  if (look.prop === "pixel-glasses") return <group position={[0, 0.09, faceZ]}>{[-1, 1].map((side) => <mesh key={side} position={[side * 0.29, 0, 0]}><boxGeometry args={[0.37, 0.25, 0.055]} /><meshToonMaterial color="#78c6df" transparent opacity={0.82} /></mesh>)}<mesh><boxGeometry args={[0.21, 0.055, 0.045]} /><meshBasicMaterial color={characterInk} /></mesh></group>;
  if (look.prop === "tiny-crown") return <group position={[0, 1.03, 0]}><mesh position={[0, -0.08, 0]}><boxGeometry args={[0.72, 0.18, 0.28]} /><meshToonMaterial color="#f5c451" /></mesh>{[-0.28, 0, 0.28].map((x, index) => <mesh key={x} position={[x, 0.16 + (index === 1 ? 0.08 : 0), 0]}><coneGeometry args={[0.17, index === 1 ? 0.5 : 0.38, 4]} /><meshToonMaterial color="#f5c451" /></mesh>)}</group>;
  return null;
}

function Figure({ dna, prop, reducedMotion }: { dna: CharacterDNA; prop?: string; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const look = resolveCharacter3D(dna, prop);
  const faceZ = look.bodyScale[2] + 0.07;
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.6) * 0.045;
  });
  return <group ref={group} position={[0, 0, 0]}>
    {look.body === "boxy" ? <group><mesh><boxGeometry args={[look.bodyScale[0] * 2, look.bodyScale[1] * 2, look.bodyScale[2] * 2]} /><meshToonMaterial color={look.palette.body} /></mesh><mesh scale={1.055}><boxGeometry args={[look.bodyScale[0] * 2, look.bodyScale[1] * 2, look.bodyScale[2] * 2]} /><meshBasicMaterial color={characterInk} side={BackSide} /></mesh></group> : <group scale={look.bodyScale}><mesh><sphereGeometry args={[1, 36, 26]} /><meshToonMaterial color={look.palette.body} /></mesh><mesh scale={1.055}><sphereGeometry args={[1, 36, 26]} /><meshBasicMaterial color={characterInk} side={BackSide} /></mesh></group>}
    {look.body === "drop" && <mesh position={[0, 0.88, 0]}><coneGeometry args={[0.34, 0.54, 24]} /><meshToonMaterial color={look.palette.body} /></mesh>}
    {look.body === "pear" && <Ball position={[0, -0.34, 0]} scale={[0.9, 0.6, 0.67]} color={look.palette.body} />}
    {look.body === "wobble" && <Ball position={[-0.64, -0.42, 0]} scale={[0.37, 0.41, 0.49]} color={look.palette.body} />}
    {look.body === "mushroom" && <Ball position={[0, 0.64, 0]} scale={[0.9, 0.34, 0.65]} color={look.palette.shade} />}
    {look.body === "cloud" && [-0.62, 0, 0.62].map((x) => <Ball key={x} position={[x, 0.48, 0]} scale={[0.35, 0.35, 0.35]} color={look.palette.body} />)}
    <Ears look={look} />
    <BodyPattern look={look} />
    <BodyMark look={look} faceZ={faceZ} />
    <Eyes look={look} faceZ={faceZ} />
    <mesh position={[0, -0.13, faceZ]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.11, 0.021, 6, 20, Math.PI]} /><meshBasicMaterial color={characterInk} /></mesh>
    {[-1, 1].map((side) => <group key={side}><Ball position={[side * 0.91, -0.36, 0]} scale={[0.19, 0.36, 0.25]} color={look.palette.body} rotation={[0, 0, side * 0.35]} outline /><Ball position={[side * 0.42, -0.84, 0.04]} scale={[0.22, 0.22, 0.28]} color={look.palette.shade} outline /></group>)}
    <CharacterProp look={look} />
    {look.rarity === "legendary" && <mesh position={[0, 0, -0.7]} rotation={[0, 0, 0]}><torusGeometry args={[1.25, 0.04, 8, 48]} /><meshBasicMaterial color="#e7c7ff" /></mesh>}
  </group>;
}

export function BaroCharacter3D({ dna, prop, reducedMotion, onContextLost }: { dna: CharacterDNA; prop?: string; reducedMotion: boolean; onContextLost: () => void }) {
  return <Canvas frameloop={reducedMotion ? "demand" : "always"} dpr={[1, 1.5]} camera={{ position: [0, 0.3, 4.4], fov: 42 }} onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); onContextLost(); })}>
    <color attach="background" args={["#ded3ed"]} />
    <ambientLight intensity={0.8} />
    <directionalLight position={[-3, 5, 5]} intensity={1.4} />
    <directionalLight position={[3, 2, -2]} intensity={0.35} color="#f5d5ad" />
    <mesh position={[0, -1.18, 0]}><cylinderGeometry args={[1.55, 1.65, 0.28, 48]} /><meshToonMaterial color="#c9e4d3" /></mesh>
    <mesh position={[0, -1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.77, 32]} /><meshBasicMaterial color="#a3bdad" transparent opacity={0.3} /></mesh>
    <Figure dna={dna} prop={prop} reducedMotion={reducedMotion} />
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI * 0.38} maxPolarAngle={Math.PI * 0.62} />
  </Canvas>;
}
