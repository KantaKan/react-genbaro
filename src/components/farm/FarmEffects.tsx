import { EffectComposer, Bloom, HueSaturation } from "@react-three/postprocessing";

/**
 * Bloom picks up the Aura's additive, `toneMapped={false}` glow — it was
 * built for this without a real bloom pass, so lighting it up here is mostly
 * free visual gain.
 *
 * A DepthOfField pass was tried here too, but on this field's orthographic
 * camera it has no perspective falloff to key off — it blurred uniformly
 * across the whole scene instead of a tasteful tilt-shift accent, so it's
 * been dropped rather than re-tuned blind (this session's browser automation
 * can't render actual WebGL frames to check parameter changes against).
 */
export function FarmEffects() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.9} intensity={0.5} mipmapBlur />
      <HueSaturation saturation={0.08} />
    </EffectComposer>
  );
}
