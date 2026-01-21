import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Code, Users, Target, Wrench, ActivitySquare } from "lucide-react";
import { toast } from "sonner";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserData } from "@/UserDataContext";

interface TechSession {
  happy: string;
  improve: string;
}

interface NonTechSession {
  happy: string;
  improve: string;
}

interface ReflectionData {
  barometer: string;
  tech_sessions: TechSession;
  non_tech_sessions: NonTechSession;
}

interface Reflection {
  user_id: string;
  date: string;
  reflection: ReflectionData;
}

interface FeedbackCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

interface ComfortZone {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

interface FeedbackFormProps {
  onSubmit: (reflection: Reflection) => Promise<void>;
  onSuccess?: () => void;
  initialData?: {
    categoryInputs: Record<string, string>;
    comfortLevel: string;
  };
  onChange?: (data: { categoryInputs: Record<string, string>; comfortLevel: string }) => void;
  isLoading?: boolean;
}

export default function FeedbackForm({ onSubmit, onSuccess, initialData, onChange, isLoading = false }: FeedbackFormProps) {
  const { userData, loading, error } = useUserData();
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>(initialData?.categoryInputs || {});
  const [comfortLevel, setComfortLevel] = useState(initialData?.comfortLevel || "");

  // Add effect to sync changes
  useEffect(() => {
    onChange?.({ categoryInputs, comfortLevel });
  }, [categoryInputs, comfortLevel, onChange]);

  const categories: FeedbackCategory[] = [
    {
      id: "tech-happy",
      title: "Tech-Happy",
      icon: <Code className="w-5 h-5 text-emerald-500" />,
      description: "Share your technical achievements and positive experiences",
    },
    {
      id: "tech-improve",
      title: "Tech-Improve",
      icon: <Wrench className="w-5 h-5 text-blue-500" />,
      description: "Identify areas for technical growth and improvement",
    },
    {
      id: "non-tech-happy",
      title: "Non-Tech Happy",
      icon: <Users className="w-5 h-5 text-purple-500" />,
      description: "Highlight positive non-technical experiences and interactions",
    },
    {
      id: "non-tech-improve",
      title: "Non-Tech Improve",
      icon: <Target className="w-5 h-5 text-orange-500" />,
      description: "Suggest non-technical areas for development",
    },
  ];

  const comfortZones: ComfortZone[] = [
    {
      id: "comfort",
      label: "Comfort Zone",
      color: "text-white",
      bgColor: "bg-green-500",
    },
    {
      id: "stretch-enjoying",
      label: "Stretch zone - Enjoying the challenges",
      color: "text-white",
      bgColor: "bg-yellow-500",
    },
    {
      id: "stretch-overwhelmed",
      label: "Stretch zone - Overwhelmed",
      color: "text-white",
      bgColor: "bg-red-500",
    },
    {
      id: "panic",
      label: "Panic Zone",
      color: "text-white",
      bgColor: "bg-purple-500",
    },
  ];

  const handleSubmit = async () => {
    if (!comfortLevel) {
      toast.error("Please select your comfort level");
      return;
    }

    if (Object.values(categoryInputs).filter(Boolean).length === 0) {
      toast.error("Please provide at least one reflection");
      return;
    }

    const userId = userData?._id;
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    try {
      const newReflection: Reflection = {
        user_id: userId,
        date: new Date().toISOString(),
        reflection: {
          tech_sessions: {
            happy: categoryInputs["tech-happy"] || "",
            improve: categoryInputs["tech-improve"] || "",
          },
          non_tech_sessions: {
            happy: categoryInputs["non-tech-happy"] || "",
            improve: categoryInputs["non-tech-improve"] || "",
          },
          barometer: comfortZones.find((zone) => zone.id === comfortLevel)?.label || "",
        },
      };

      await onSubmit(newReflection);
      toast.success("Reflection submitted successfully!");

      // Reset form
      setCategoryInputs({});
      setComfortLevel("");

      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit reflection");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading user data</div>;

  return (
    <div className="relative space-y-6 h-full flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-2 text-lg">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Submitting...</span>
          </div>
        </div>
      )}
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">Daily Reflection</DialogTitle>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <Card key={category.id} className={index === categories.length - 1 && categories.length % 2 !== 0 ? "md:col-span-2" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-muted rounded-lg">{category.icon}</div>
                  <Label htmlFor={category.id} className="font-semibold text-lg">
                    {category.title}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                <Textarea
                  id={category.id}
                  placeholder="Share your thoughts..."
                  value={categoryInputs[category.id] || ""}
                  onChange={(e) =>
                    setCategoryInputs((prev) => ({
                      ...prev,
                      [category.id]: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <ActivitySquare className="w-5 h-5 text-blue-500" />
                <Label className="font-semibold text-lg">Comfort Barometer</Label>
              </div>
              <RadioGroup value={comfortLevel} onValueChange={setComfortLevel} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comfortZones.map((zone, index) => (
                  <Label
                    key={zone.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${zone.bgColor} ${comfortLevel === zone.id ? "ring-2 ring-offset-2" : ""} ${
                      index === comfortZones.length - 1 && comfortZones.length % 2 !== 0 ? "md:col-span-2" : ""
                    }`}
                  >
                    <RadioGroupItem value={zone.id} id={zone.id} />
                    <span className={`font-medium`}>{zone.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-auto flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Reflection"}
        </Button>
      </div>
    </div>
  );
}
