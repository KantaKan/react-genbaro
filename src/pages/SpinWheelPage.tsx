import { useState, useMemo } from "react";
import { Wheel } from "react-custom-roulette";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Users } from "lucide-react";

type WheelOption = {
  option: string;
  style: { backgroundColor: string; textColor: string };
};

const COLORS = ["#3e3e3e", "#df3428"] as const;

const toWheelOption = (label: string, index: number): WheelOption => ({
  option: label,
  style: {
    backgroundColor: COLORS[index % COLORS.length],
    textColor: "white",
  },
});

const INITIAL_GENMATE = [
  "Genmate A",
  "Genmate B",
  "Genmate C",
  "Genmate D",
  "Genmate E",
  "Genmate F",
  "Genmate G",
];

// Mock learners - ภายหลังจะเปลี่ยนเป็น fetch API
const MOCK_LEARNERS = [
  "สมชาย เรียนดี",
  "สมหญิง รักเรียน",
  "วิชัย มานะ",
  "มานี มีสุข",
  "ปิติ ตั้งใจ",
  "ดวงใจ ขยัน",
  "ประเสริฐ ดีเด่น",
  "สุภาพ เรียบร้อย",
];

type SpinMode = "custom" | "genmate" | "learner";

const SpinWheelPage = () => {
  const [mode, setMode] = useState<SpinMode>("custom");
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  // Custom: รายการที่ user ใส่เอง
  const [customOptions, setCustomOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
  ]);
  const [newOptionInput, setNewOptionInput] = useState("");

  // Genmate: รายการ Genmate A–G + เพิ่ม/ลดได้
  const [genmateOptions, setGenmateOptions] = useState<string[]>(() => [
    ...INITIAL_GENMATE,
  ]);

  // Learner: mock ข้อมูล, ภายหลัง fetch API
  const [learnerOptions, setLearnerOptions] = useState<string[]>([]);
  const [learnersLoading, setLearnersLoading] = useState(false);

  const wheelData = useMemo((): WheelOption[] => {
    let labels: string[] = [];
    if (mode === "custom") labels = customOptions.filter(Boolean);
    else if (mode === "genmate") labels = genmateOptions.filter(Boolean);
    else labels = learnerOptions.filter(Boolean);

    return labels.map((label, i) => toWheelOption(label, i));
  }, [mode, customOptions, genmateOptions, learnerOptions]);

  const canSpin = wheelData.length > 0;

  const handleSpinClick = () => {
    if (!mustSpin && canSpin) {
      const newPrizeNumber = Math.floor(Math.random() * wheelData.length);
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
      setWinner(null);
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    if (wheelData[prizeNumber]) setWinner(wheelData[prizeNumber].option);
  };

  // --- Custom mode ---
  const addCustomOption = () => {
    const trimmed = newOptionInput.trim();
    if (trimmed) {
      setCustomOptions((prev) => [...prev, trimmed]);
      setNewOptionInput("");
    }
  };

  const removeCustomOption = (index: number) => {
    setCustomOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Genmate mode ---
  const addGenmateOption = () => {
    const nextLetter = String.fromCharCode(65 + genmateOptions.length);
    setGenmateOptions((prev) => [...prev, `Genmate ${nextLetter}`]);
  };

  const removeGenmateOption = (index: number) => {
    setGenmateOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGenmateOption = (index: number, value: string) => {
    setGenmateOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // --- Learner mode (mock fetch, ภายหลังเป็น API) ---
  const fetchLearners = async () => {
    setLearnersLoading(true);
    try {
      // TODO: แทนที่ด้วย API จริง เช่น await api.get("/learners") หรือตาม endpoint
      await new Promise((r) => setTimeout(r, 800));
      setLearnerOptions([...MOCK_LEARNERS]);
    } finally {
      setLearnersLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Spin Wheel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_auto] gap-4 lg:gap-6 items-start">
        {/* ซ้าย: แถบเครื่องมือ */}
        <div className="w-full max-w-md">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as SpinMode)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="genmate">Genmate</TabsTrigger>
              <TabsTrigger value="learner">Learner</TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="mt-4">
              <div className="rounded-lg border bg-card p-4 space-y-4 max-w-md">
                <p className="text-sm text-muted-foreground">
                  จัดการ option เอง — เพิ่มหรือลบรายการ
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="ชื่อ option"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomOption()}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={addCustomOption}
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="space-y-2">
                  {customOptions.map((opt, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2 rounded border px-3 py-2"
                    >
                      <span>{opt || "(ว่าง)"}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCustomOption(i)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="genmate" className="mt-4">
              <div className="rounded-lg border bg-card p-4 space-y-4 max-w-md">
                <p className="text-sm text-muted-foreground">
                  Genmate A–G (เริ่มต้น) — เพิ่มหรือลบได้
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGenmateOption}
                >
                  <Plus className="h-4 w-4 mr-1" /> เพิ่ม Genmate
                </Button>
                <ul className="space-y-2">
                  {genmateOptions.map((opt, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateGenmateOption(i, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeGenmateOption(i)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="learner" className="mt-4">
              <div className="rounded-lg border bg-card p-4 space-y-4 max-w-md">
                <p className="text-sm text-muted-foreground">
                  โหลดรายชื่อผู้เรียน (mock ข้อมูล — ภายหลังจะ fetch API)
                </p>
                <Button
                  type="button"
                  onClick={fetchLearners}
                  disabled={learnersLoading}
                  variant="secondary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {learnersLoading ? "กำลังโหลด..." : "โหลดรายชื่อผู้เรียน"}
                </Button>
                {learnerOptions.length > 0 && (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="font-medium text-foreground">
                      จำนวน {learnerOptions.length} คน
                    </li>
                    {learnerOptions.slice(0, 5).map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                    {learnerOptions.length > 5 && <li>...</li>}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ขวา: ล้อ + ปุ่ม SPIN */}
        <div className="flex flex-col items-center gap-4">
          {canSpin ? (
            <>
              <div className="relative">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={wheelData}
                  onStopSpinning={handleStopSpinning}
                  backgroundColors={[...COLORS]}
                  textColors={["#ffffff"]}
                  outerBorderColor="#333"
                  outerBorderWidth={4}
                  radiusLineColor="#333"
                  radiusLineWidth={2}
                  spinDuration={0.8}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleSpinClick}
                  disabled={mustSpin}
                  className="px-6 py-3 font-semibold"
                >
                  {mustSpin ? "Spinning..." : "SPIN"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWinner(null)}
                  disabled={mustSpin}
                  className="px-6 py-3 font-semibold bg-red-600 text-white"
                >
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              {mode === "learner"
                ? "กดปุ่ม โหลดรายชื่อผู้เรียน ก่อน"
                : "เพิ่มอย่างน้อย 1 option เพื่อหมุนล้อ"}
            </p>
          )}

          {winner && (
            <p className="text-lg font-medium text-muted-foreground">
              Winner:{" "}
              <span className="text-foreground font-bold">{winner}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheelPage;
