import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, BufferAttribute, Color, Group, SphereGeometry, Vector3 } from "three";

const TOP_COLOR = "#7ab8dd";
const HORIZON_COLOR = "#e8d9ae";
const SUN_COLOR = "#ffe9a3";
const CLOUD_COLOR = "#fdfaf3";
const CLOUD_COUNT = 6;

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

interface SkyDomeProps {
  radius: number;
  /** Same direction the scene's key light shines from, so the visible sun
   * sits where the light actually comes from instead of floating decoratively
   * in an unrelated part of the sky. */
  sunDirection: [number, number, number];
}

/**
 * A vertex-colored gradient sky dome, a sun anchored to the actual key
 * light's direction, and a handful of slowly drifting clouds — replacing the
 * flat CSS gradient that used to sit as page chrome behind the canvas. Being
 * part of the actual scene means it's lit consistently with everything else
 * instead of a static backdrop that doesn't react to anything.
 *
 * Plain vertex colors on a sphere rather than a custom shader — no GLSL
 * needed for a two-stop gradient, and it composes with the existing
 * toon/outline pipeline without a new material type to reason about. Clouds
 * stay a plain unlit color (no toon/outline treatment) — this far from the
 * subject and this small on screen, the outline pass would read as noise
 * rather than the clean rim that works for the plants and ground.
 */
export function SkyDome({ radius, sunDirection }: SkyDomeProps) {
  const geometry = useMemo(() => {
    const geo = new SphereGeometry(radius, 24, 16);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const top = new Color(TOP_COLOR);
    const horizon = new Color(HORIZON_COLOR);
    const tmp = new Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, pos.getY(i) / radius + 0.15));
      tmp.copy(horizon).lerp(top, t);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new BufferAttribute(colors, 3));
    return geo;
  }, [radius]);

  const sunPosition = useMemo(() => {
    const dir = new Vector3(...sunDirection).normalize().multiplyScalar(radius * 0.9);
    return [dir.x, dir.y, dir.z] as [number, number, number];
  }, [radius, sunDirection]);

  return (
    <group>
      {/* Tone-mapped like everything else in the scene — a background this
          large left non-tone-mapped registered as bright enough to trip
          Bloom's luminance threshold across the whole frame, reading as a
          hazy/blurred backdrop instead of a plain sky. */}
      <mesh geometry={geometry} renderOrder={-1}>
        <meshBasicMaterial vertexColors side={BackSide} depthWrite={false} />
      </mesh>
      <mesh position={sunPosition}>
        <sphereGeometry args={[radius * 0.05, 10, 8]} />
        <meshBasicMaterial color={SUN_COLOR} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={sunPosition} scale={1.6}>
        <sphereGeometry args={[radius * 0.05, 10, 8]} />
        <meshBasicMaterial
          color={SUN_COLOR}
          transparent
          opacity={0.2}
          toneMapped={false}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <Clouds radius={radius} />
    </group>
  );
}

interface CloudPuff {
  x: number;
  y: number;
  z: number;
  r: number;
}
interface CloudDef {
  angle0: number;
  height: number;
  speed: number;
  orbitRadius: number;
  puffs: CloudPuff[];
}

function Clouds({ radius }: { radius: number }) {
  const groupRefs = useRef<(Group | null)[]>([]);

  const cloudDefs = useMemo<CloudDef[]>(() => {
    const orbitRadius = radius * 0.85;
    return Array.from({ length: CLOUD_COUNT }, (_, i) => {
      const puffCount = 4 + Math.floor(hash(i * 2.2) * 2);
      const puffs: CloudPuff[] = Array.from({ length: puffCount }, (_, j) => ({
        x: (hash(i * 11 + j * 3) - 0.5) * radius * 0.06,
        y: (hash(i * 13 + j * 5) - 0.5) * radius * 0.015,
        z: (hash(i * 17 + j * 7) - 0.5) * radius * 0.03,
        r: radius * (0.02 + hash(i * 19 + j * 2) * 0.015),
      }));
      return {
        angle0: (i / CLOUD_COUNT) * Math.PI * 2 + hash(i * 3.3) * 0.6,
        height: radius * (0.15 + hash(i * 7.1) * 0.2),
        speed: 0.01 + hash(i * 5.5) * 0.015,
        orbitRadius,
        puffs,
      };
    });
  }, [radius]);

  useFrame(({ clock }) => {
    cloudDefs.forEach((def, i) => {
      const group = groupRefs.current[i];
      if (!group) return;
      const angle = def.angle0 + clock.elapsedTime * def.speed;
      group.position.set(Math.cos(angle) * def.orbitRadius, def.height, Math.sin(angle) * def.orbitRadius);
    });
  });

  return (
    <>
      {cloudDefs.map((def, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          {def.puffs.map((p, j) => (
            <mesh key={j} position={[p.x, p.y, p.z]}>
              <sphereGeometry args={[p.r, 8, 6]} />
              <meshBasicMaterial color={CLOUD_COLOR} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
