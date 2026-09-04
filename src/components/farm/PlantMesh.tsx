import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, type Group } from "three";
import type { PlantPalette, PlantSpecies } from "@/lib/plant-variants";
import type { PlantTier } from "@/lib/streak-milestones";
import type { FarmPart } from "@/lib/farm-geometry";
import { useFarmPlantParts } from "@/hooks/use-farm-plant";
import { getPartTexture, getToonGradientMap, repeatForPart } from "@/lib/farm-textures";

export const OUTLINE_SCALE = 1.06;
export const OUTLINE_COLOR = "#1a1410";

interface PlantMeshProps {
  species: PlantSpecies;
  tier: PlantTier;
  palette: PlantPalette;
  /** Matches SeedlingPlant's `active` — false (streak lapsed) renders grey, same shape. */
  active: boolean;
}

const GROW_DURATION_S = 1.2;

/**
 * When (species/archetype, tier, palette, active) changes — a genmate's plant
 * leveling up while you're looking at the field, since fertilize/rescue
 * already invalidate and refetch — the new shape grows into place instead of
 * swapping instantly. Ticket 04's decision, chosen for consistency with the
 * brand's celebratory tone and the existing milestone-toast precedent.
 *
 * This is a whole-plant scale grow, not a true per-part morph between the old
 * and new geometry: the two states can have entirely different part counts
 * (a 3-segment stem becoming a 4-segment one), so there's no natural 1:1
 * mapping to interpolate between. A uniform ease-out scale from a genmate
 * seeing it at rest to full size reads as "growing" without needing to solve
 * that harder problem.
 */
export function PlantMesh({ species, tier, palette, active }: PlantMeshProps) {
  const parts = useFarmPlantParts(species, tier, palette, active);
  const groupRef = useRef<Group>(null);
  const growElapsed = useRef(GROW_DURATION_S); // starts fully grown; only animates on a later change
  const prevPartsRef = useRef(parts);

  if (prevPartsRef.current !== parts) {
    growElapsed.current = 0;
    prevPartsRef.current = parts;
  }

  useFrame((_, delta) => {
    if (growElapsed.current >= GROW_DURATION_S || !groupRef.current) return;
    growElapsed.current = Math.min(GROW_DURATION_S, growElapsed.current + delta);
    const t = growElapsed.current / GROW_DURATION_S;
    const eased = 1 - (1 - t) ** 3;
    const scale = 0.75 + 0.25 * eased;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {parts.map((part, i) => (
        <PartMesh key={i} part={part} />
      ))}
    </group>
  );
}

function PartGeometry({ part }: { part: FarmPart }) {
  if (part.kind === "cylinder") return <cylinderGeometry args={part.args as [number, number, number, number]} />;
  if (part.kind === "sphere") return <sphereGeometry args={part.args as [number, number, number]} />;
  if (part.kind === "box") return <boxGeometry args={part.args as [number, number, number]} />;
  return <torusGeometry args={part.args as [number, number, number, number, number]} />;
}

export function PartMesh({ part }: { part: FarmPart }) {
  const texture = useMemo(() => {
    const base = getPartTexture(part.color);
    if (!base) return null;
    const tex = base.clone();
    const [repeatX, repeatY] = repeatForPart(part);
    tex.repeat.set(repeatX, repeatY);
    tex.needsUpdate = true;
    return tex;
  }, [part]);
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const scale = part.scale ?? [1, 1, 1];
  const outlineScale: [number, number, number] = [scale[0] * OUTLINE_SCALE, scale[1] * OUTLINE_SCALE, scale[2] * OUTLINE_SCALE];

  const mesh = (
    <group position={part.position} rotation={part.rotation ?? [0, 0, 0]}>
      {/* Inverted-hull outline: a slightly larger, backface-only black copy
          rendered behind the real mesh — the "toylike" cel-shaded rim, cheaper
          and more reliable here than an edge-detection post-process since it
          needs no per-mesh selection wiring. */}
      <mesh scale={outlineScale}>
        <PartGeometry part={part} />
        <meshBasicMaterial color={OUTLINE_COLOR} side={BackSide} />
      </mesh>
      <mesh castShadow scale={scale}>
        <PartGeometry part={part} />
        <meshToonMaterial color={part.color} map={texture ?? undefined} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
  if (!part.pivot) return mesh;
  return (
    <group position={part.pivot.position} rotation={part.pivot.rotation}>
      {mesh}
    </group>
  );
}
