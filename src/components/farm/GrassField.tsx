import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import { getToonGradientMap } from "@/lib/farm-textures";

const BLADE_COLORS = ["#5f8a3f", "#6f9c4a", "#547a35"];
const BLADE_COUNT = 700;
const BLADE_HEIGHT = 0.32;

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

interface GrassFieldProps {
  landW: number;
  landD: number;
}

/** Real grass blades instead of a flat green box — one instanced draw call
 * scattered across the field, not outlined individually (an inverted-hull
 * copy per blade would double the instance count and read as noise at this
 * scale rather than the clean toylike rim that works for larger shapes). */
export function GrassField({ landW, landD }: GrassFieldProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const color = new Color();
    for (let i = 0; i < BLADE_COUNT; i++) {
      const x = (hash(i * 12.9898) - 0.5) * landW * 0.94;
      const z = (hash(i * 78.233) - 0.5) * landD * 0.94;
      const scale = 0.6 + hash(i * 3.71) * 0.8;
      dummy.position.set(x, (BLADE_HEIGHT / 2) * scale, z);
      dummy.rotation.y = hash(i * 5.31) * Math.PI * 2;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(BLADE_COLORS[i % BLADE_COLORS.length]);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [landW, landD]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BLADE_COUNT]} position={[0, 0.02, 0]}>
      <boxGeometry args={[0.05, BLADE_HEIGHT, 0.02]} />
      <meshToonMaterial gradientMap={gradientMap} vertexColors />
    </instancedMesh>
  );
}
