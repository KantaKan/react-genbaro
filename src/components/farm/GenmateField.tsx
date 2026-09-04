import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { PlantPalette, PlantSpecies } from "@/lib/plant-variants";
import { getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import { PlantMesh, PartMesh } from "@/components/farm/PlantMesh";
import { FarmEffects } from "@/components/farm/FarmEffects";
import { GrassField } from "@/components/farm/GrassField";
import { SkyDome } from "@/components/farm/SkyDome";
import { getPartTexture, getToonGradientMap } from "@/lib/farm-textures";
import { terrainHeightAt, TERRAIN_MARGIN } from "@/lib/farm-terrain";
import { useFarmPlantParts, useFarmPlantHeight } from "@/hooks/use-farm-plant";
import { buildFenceParts, buildGroundProps, buildBackgroundTrees } from "@/lib/farm-decorations";
import {
  computeTileSize,
  tilePositionsForCount,
  tileCenter,
  leastOccludingRotationStep,
  gridDimensionsForCount,
  auraSpecForTier,
  buildParticleDefs,
  isRisingParticle,
  FIELD_PITCH,
  FIELD_YAW_BASE,
  type ParticleDef,
} from "@/lib/farm-layout";

export interface GenmateFieldMember {
  id: string;
  name: string;
  species: PlantSpecies;
  tier: PlantTier;
  palette: PlantPalette;
  active: boolean;
  displayStreakDays: number;
}

interface GenmateFieldProps {
  members: GenmateFieldMember[];
  onContextLost?: () => void;
}

// Shared between the key light and the visible sun in the sky dome, so the
// glowing disc up there is actually where the light comes from instead of a
// decoration floating in an unrelated direction.
const SUN_DIRECTION: [number, number, number] = [6, 10, 4];

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.5;
const ZOOM_SENSITIVITY = 0.0015;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * One connected block of land, an FFT-style fixed-angle camera with 90°
 * rotation steps, real 3D plants standing together — the genmate-farm map's
 * tickets 02/09/03/04/05/10/11, resolved as a spike
 * (https://claude.ai/code/artifact/c78b6a76-bbc7-445a-8efd-f327213f1a6b) and
 * ported here to real @react-three/fiber primitives rather than the spike's
 * hand-rolled software renderer.
 */
export function GenmateField({ members, onContextLost }: GenmateFieldProps) {
  const tileSize = useMemo(() => computeTileSize(), []);
  // Sized to the actual headcount — a genmate group stays the tuned 3×3, a
  // whole cohort field grows instead of silently dropping anyone past 9.
  const { cols, rows } = useMemo(() => gridDimensionsForCount(members.length), [members.length]);
  const positions = useMemo(() => tilePositionsForCount(members.length, cols, rows), [members.length, cols, rows]);
  const [rotationStep, setRotationStep] = useState(() => leastOccludingRotationStep(positions, tileSize, cols, rows));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const landW = cols * tileSize;
  const landD = rows * tileSize;
  const fieldDiag = Math.hypot(landW, landD);

  const emptyTileWorldPositions = useMemo(() => {
    const occupied = new Set(positions.map((p) => `${p.col},${p.row}`));
    const empties: Array<{ x: number; z: number }> = [];
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        if (occupied.has(`${col},${row}`)) continue;
        empties.push(tileCenter(col, row, tileSize, cols, rows));
      }
    }
    return empties;
  }, [positions, tileSize, cols, rows]);
  const groundProps = useMemo(() => buildGroundProps(emptyTileWorldPositions), [emptyTileWorldPositions]);
  const fenceParts = useMemo(() => buildFenceParts(landW, landD), [landW, landD]);
  const backgroundTreeParts = useMemo(() => buildBackgroundTrees(landW, landD), [landW, landD]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-gradient-to-b from-sky-200 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
        <Canvas
          shadows
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              onContextLost?.();
            });
            // Native listener with `{ passive: false }`, not React's `onWheel`
            // (which React makes passive by default and silently ignores
            // `preventDefault()` on) — needed so zooming the field doesn't
            // also scroll the page. Trackpad pinch arrives as the same
            // `wheel` event (browser-synthesized with `ctrlKey: true`), so
            // one handler covers both scroll-to-zoom and pinch-to-zoom.
            gl.domElement.addEventListener(
              "wheel",
              (e) => {
                e.preventDefault();
                setZoom((z) => clamp(z - e.deltaY * ZOOM_SENSITIVITY, ZOOM_MIN, ZOOM_MAX));
              },
              { passive: false }
            );
          }}
        >
          <FieldCamera fieldDiag={fieldDiag} rotationStep={rotationStep} zoom={zoom} />
          <SkyDome radius={fieldDiag * 1.8} sunDirection={SUN_DIRECTION} />
          <ambientLight intensity={0.35} />
          <directionalLight position={SUN_DIRECTION} intensity={0.9} castShadow />
          <directionalLight position={[-5, 6, -3]} intensity={0.3} color="#cfe4ff" />
          <directionalLight position={[0, 4, -8]} intensity={0.28} color="#fff8e6" />
          <Ground landW={landW} landD={landD} />
          <GrassField landW={landW} landD={landD} />
          <ContactShadows position={[0, 0.01, 0]} opacity={0.4} blur={2} far={fieldDiag} />
          {fenceParts.map((part, i) => (
            <PartMesh key={`fence-${i}`} part={part} />
          ))}
          {groundProps.map((part, i) => (
            <PartMesh key={`prop-${i}`} part={part} />
          ))}
          {backgroundTreeParts.map((part, i) => (
            <PartMesh key={`tree-${i}`} part={part} />
          ))}
          <Butterflies count={5} spread={Math.min(landW, landD) * 0.4} />
          <FarmEffects />
          {members.map((member, i) => {
            const pos = positions[i];
            if (!pos) return null;
            const center = tileCenter(pos.col, pos.row, tileSize, cols, rows);
            return (
              <MemberOnTile
                key={member.id}
                member={member}
                worldX={center.x}
                worldZ={center.z}
                isHovered={hoveredId === member.id}
                onHoverChange={(hovered) => setHoveredId(hovered ? member.id : null)}
              />
            );
          })}
        </Canvas>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRotationStep((s) => (s + 3) % 4)}
          className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          ⟲ Rotate
        </button>
        <button
          type="button"
          onClick={() => setRotationStep((s) => (s + 1) % 4)}
          className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          ⟳ Rotate
        </button>
      </div>
    </div>
  );
}

function FieldCamera({ fieldDiag, rotationStep, zoom }: { fieldDiag: number; rotationStep: number; zoom: number }) {
  const { size, set, camera: previousCamera } = useThree();
  const camRef = useRef<THREE.OrthographicCamera>(null);
  const yaw = FIELD_YAW_BASE + rotationStep * (Math.PI / 2);
  const distance = fieldDiag * 1.4;
  const camX = distance * Math.sin(yaw) * Math.cos(FIELD_PITCH);
  const camZ = distance * Math.cos(yaw) * Math.cos(FIELD_PITCH);
  const camY = distance * Math.sin(FIELD_PITCH);

  // Explicit world-unit frustum bounds, sized from the actual field diagonal —
  // not `zoom` against an assumed default frustum, so the framing is exact
  // regardless of drei/r3f version defaults.
  const halfHeight = fieldDiag * 0.42;
  const halfWidth = halfHeight * (size.width / size.height);

  useEffect(() => {
    if (!camRef.current) return;
    set({ camera: camRef.current });
    return () => set({ camera: previousCamera });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // three.js never recomputes a camera's projection matrix on its own — a
  // frustum edge or `near`/`far` change only takes effect after an explicit
  // `updateProjectionMatrix()` call. Passing left/right/top/bottom as JSX
  // props alone left the camera stuck at its constructed default (a ±1 unit
  // frustum), so it only ever saw a sliver of the nearest surface, filling
  // the whole canvas with flat grass green. Setting the properties and
  // updating the matrix explicitly, every frame, fixes it for certain.
  useFrame(() => {
    if (!camRef.current) return;
    const cam = camRef.current;
    cam.position.set(camX, camY, camZ);
    cam.lookAt(0, fieldDiag * 0.08, 0);
    cam.left = -halfWidth;
    cam.right = halfWidth;
    cam.top = halfHeight;
    cam.bottom = -halfHeight;
    cam.near = 0.1;
    cam.far = distance * 3;
    cam.zoom = zoom;
    cam.updateProjectionMatrix();
  });

  return <orthographicCamera ref={camRef} />;
}

function groundTexture(color: string, width: number, depth: number): THREE.Texture | null {
  const base = getPartTexture(color);
  if (!base) return null;
  const tex = base.clone();
  tex.repeat.set(Math.max(1, Math.round(width)), Math.max(1, Math.round(depth)));
  tex.needsUpdate = true;
  return tex;
}

const TERRAIN_SEGMENTS = 28;

/** A displaced heightfield grid: flat inside the tile footprint (matches
 * `terrainHeightAt`'s own definition exactly, so the play surface — tile
 * math, occlusion, `ContactShadows`, grass — stays untouched), rolling hills
 * in the decorative apron beyond it, out to `TERRAIN_MARGIN`. Built directly
 * with `three` primitives in the component (same custom-vertex-geometry
 * pattern `SkyDome` already uses for its own gradient sphere), not a
 * `planeGeometry` + rotation — X/Z map straight onto the grid so the height
 * math needs no coordinate-frame juggling. */
function buildTerrainGeometry(landW: number, landD: number): THREE.BufferGeometry {
  const outerW = landW + TERRAIN_MARGIN * 2;
  const outerD = landD + TERRAIN_MARGIN * 2;
  const segs = TERRAIN_SEGMENTS;
  const vertsPerRow = segs + 1;
  const positions = new Float32Array(vertsPerRow * vertsPerRow * 3);
  const uvs = new Float32Array(vertsPerRow * vertsPerRow * 2);

  let p = 0;
  let u = 0;
  for (let j = 0; j <= segs; j++) {
    const z = (j / segs - 0.5) * outerD;
    for (let i = 0; i <= segs; i++) {
      const x = (i / segs - 0.5) * outerW;
      positions[p++] = x;
      positions[p++] = terrainHeightAt(x, z, landW / 2, landD / 2);
      positions[p++] = z;
      uvs[u++] = i / segs;
      uvs[u++] = j / segs;
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < segs; j++) {
    for (let i = 0; i < segs; i++) {
      const a = j * vertsPerRow + i;
      const b = a + 1;
      const c = a + vertsPerRow;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function Ground({ landW, landD }: { landW: number; landD: number }) {
  // Same grain texture and toon shading the plants use — a flat-colored,
  // standard-shaded ground next to textured/toon plants read as unfinished.
  // The field's tile lines don't need a literal `gridHelper` (a default
  // three.js debug primitive) to be legible; the hover highlight already
  // marks the active tile.
  const outerW = landW + TERRAIN_MARGIN * 2;
  const outerD = landD + TERRAIN_MARGIN * 2;
  const soilTexture = useMemo(() => groundTexture("#6b4a34", outerW, outerD), [outerW, outerD]);
  const grassTexture = useMemo(() => groundTexture("#5f8a3f", outerW, outerD), [outerW, outerD]);
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const terrainGeometry = useMemo(() => buildTerrainGeometry(landW, landD), [landW, landD]);

  return (
    <group>
      <mesh position={[0, -0.9, 0]}>
        <boxGeometry args={[outerW, 1.2, outerD]} />
        <meshToonMaterial color="#6b4a34" map={soilTexture ?? undefined} gradientMap={gradientMap} />
      </mesh>
      {/* The rolling terrain surface itself. No inverted-hull outline here
          (unlike the plants and the old flat slab this replaces) — a
          heightfield has no real side faces for that trick to rim, and the
          mesh's own outer edge now sits well past the fence, out of the
          frame's usual focus. Known ceiling: the grass surface has no
          thickness, so at extreme zoom-out you could in principle glimpse
          the flat soil block's edge behind a hill's silhouette — not worth a
          fully extruded terrain solid for that edge case. */}
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshToonMaterial color="#5f8a3f" map={grassTexture ?? undefined} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

function MemberOnTile({
  member,
  worldX,
  worldZ,
  isHovered,
  onHoverChange,
}: {
  member: GenmateFieldMember;
  worldX: number;
  worldZ: number;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const parts = useFarmPlantParts(member.species, member.tier, member.palette, member.active);
  const height = useFarmPlantHeight(parts);
  const auraSpec = useMemo(() => auraSpecForTier(member.tier), [member.tier]);
  const particleDefs = useMemo(() => buildParticleDefs(member.tier), [member.tier]);
  const tierName = getPlantTierConfig(member.tier).name;

  return (
    <group position={[worldX, 0, worldZ]}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverChange(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHoverChange(false);
        }}
      >
        <PlantMesh species={member.species} tier={member.tier} palette={member.palette} active={member.active} />
      </group>
      {particleDefs.length > 0 && auraSpec && (
        <Particles defs={particleDefs} anchorHeight={height * 0.7} palette={member.palette} glowColor={auraSpec.color} />
      )}
      {isHovered && <TileHighlight />}
      {/* Keyboard access: a real focusable DOM element per tile, not a canvas-only
          hit region — ticket 05. Same hover treatment fires on focus. */}
      <Html position={[0, 0.05, 0]} center distanceFactor={undefined} style={{ pointerEvents: "none" }}>
        <button
          type="button"
          onFocus={() => onHoverChange(true)}
          onBlur={() => onHoverChange(false)}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          className="h-2 w-2 rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ pointerEvents: "auto" }}
          aria-label={`${member.name}, ${member.displayStreakDays} day streak, ${tierName}`}
        />
      </Html>
      {isHovered && (
        <Html position={[0, height + 0.6, 0]} center style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-lg">
            <div className="font-semibold">{member.name}</div>
            <div className="text-muted-foreground">
              {member.displayStreakDays} day{member.displayStreakDays === 1 ? "" : "s"} · {tierName}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function TileHighlight() {
  return (
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.4, 1.7, 24]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.55} toneMapped={false} />
    </mesh>
  );
}

function Particles({
  defs,
  anchorHeight,
  palette,
  glowColor,
}: {
  defs: ParticleDef[];
  anchorHeight: number;
  palette: PlantPalette;
  glowColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // Matches the real split: petal uses the learner's flower color, leaf uses
  // their leaf color, pollen/light use the tier's glow color (tier-driven, not
  // palette-driven, same as the real AuraGlow).
  const colorFor = (type: ParticleDef["type"]): string =>
    type === "petal" ? palette.flower : type === "leaf" ? palette.leaf : glowColor;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const def = defs[i];
      if (!def) return;
      const dur = 2.4 + hash(def.seed) * 1.6;
      const phase = (t % dur) / dur;
      const rising = isRisingParticle(def.type);
      const travel = rising ? 1.6 : 2.0;
      const y = rising ? -phase * travel : -0.5 + phase * travel;
      const wobble = Math.sin(phase * Math.PI * 2 + def.seed) * 0.28;
      child.position.set(wobble, y, 0);
      const alpha = Math.sin(Math.min(Math.max(phase, 0), 1) * Math.PI);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = alpha * 0.85;
    });
  });

  return (
    <group ref={groupRef} position={[0, anchorHeight, 0]}>
      {defs.map((def, i) => (
        <mesh key={i}>
          <sphereGeometry args={[def.type === "petal" ? 0.09 : def.type === "leaf" ? 0.08 : 0.05, 4, 3]} />
          <meshBasicMaterial
            color={colorFor(def.type)}
            transparent
            opacity={0}
            toneMapped={false}
            blending={isRisingParticle(def.type) ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

const BUTTERFLY_COLORS = ["#ffd166", "#ff8fa3", "#8ecae6", "#c8a2ff", "#b8f2b8"];

/** Purely decorative — a handful of butterflies wandering the field on gentle
 * looping paths, wings flapping. No interaction, no data dependency; the
 * "cute and funny" ask, not a design decision recorded on any ticket. */
function Butterflies({ count, spread }: { count: number; spread: number }) {
  const flies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length],
        radiusX: spread * (0.4 + hash(i * 3.1) * 0.5),
        radiusZ: spread * (0.4 + hash(i * 7.7) * 0.5),
        speed: 0.25 + hash(i * 5.3) * 0.2,
        phase: hash(i * 9.1) * Math.PI * 2,
        baseHeight: 1.5 + hash(i * 4.4) * 2,
        bob: 0.3 + hash(i * 6.6) * 0.3,
        flapSeed: i * 11.1,
      })),
    [count, spread]
  );
  return (
    <>
      {flies.map((fly) => (
        <Butterfly key={fly.id} {...fly} />
      ))}
    </>
  );
}

function Butterfly({
  color,
  radiusX,
  radiusZ,
  speed,
  phase,
  baseHeight,
  bob,
  flapSeed,
}: {
  color: string;
  radiusX: number;
  radiusZ: number;
  speed: number;
  phase: number;
  baseHeight: number;
  bob: number;
  flapSeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    if (groupRef.current) {
      const x = Math.cos(t) * radiusX;
      const z = Math.sin(t * 1.3) * radiusZ; // figure-8-ish wander, not a plain circle
      const y = baseHeight + Math.sin(t * 2 + flapSeed) * bob;
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = -t;
    }
    const flap = Math.sin(clock.elapsedTime * 14 + flapSeed) * 0.7 + 0.75;
    if (leftWingRef.current) leftWingRef.current.rotation.y = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.y = -flap;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.045, 4, 3]} />
        <meshStandardMaterial color="#3d3d3d" />
      </mesh>
      <group ref={leftWingRef} position={[0.03, 0, 0]}>
        <mesh position={[0.09, 0, 0]}>
          <boxGeometry args={[0.16, 0.02, 0.13]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[-0.03, 0, 0]}>
        <mesh position={[-0.09, 0, 0]}>
          <boxGeometry args={[0.16, 0.02, 0.13]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
