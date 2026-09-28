import { GenmateField, type GenmateFieldMember } from "@/components/farm/GenmateField";
import { resolvePlantAppearance } from "@/lib/plant-appearance";
import { getAllPalettes, SPECIES } from "@/lib/plant-variants";

const palettes = getAllPalettes();

const members: GenmateFieldMember[] = SPECIES.map((species, index) => ({
  id: `qa-${species}`,
  name: species,
  appearance: resolvePlantAppearance({
    userId: `qa-${species}`,
    tier: 7,
    active: true,
    growthPoints: 120,
    overrides: {
      species,
      palette: palettes[index % palettes.length]?.name,
    },
  }),
  displayStreakDays: 30,
}));

export default function PlantVisualQaPage() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Development visual matrix</p>
          <h1 className="text-3xl font-bold">23 species · tier 7</h1>
        </div>
        <GenmateField members={members} />
      </div>
    </main>
  );
}
