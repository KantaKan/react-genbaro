import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Code, Users, Target, Wrench, ActivitySquare, ChevronDown, ChevronUp } from "lucide-react";
import { CalendarView } from "./CalendarView";
import { formatDate } from "../lib/utils";
import { toast } from "sonner";

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

export default function FeedbackForm() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comfortLevel, setComfortLevel] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filledDates, setFilledDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // In a real app, replace this with an actual API call
    const mockFilledDates = [new Date(2024, 0, 15), new Date(2024, 0, 16), new Date(2024, 0, 17)];
    setFilledDates(mockFilledDates);
  }, []);

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
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "stretch-enjoying",
      label: "Stretch zone- enjoying the challenges",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      id: "stretch-overwhelmed",
      label: "Stretch zone- overwhelmed",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "panic",
      label: "Panic Zone",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]));
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!comfortLevel) {
      toast.error("Please select your comfort level");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Feedback submitted successfully!");
      setFilledDates((prev) => [...prev, selectedDate]);

      // Reset form
      setSelectedCategories([]);
      setCategoryInputs({});
      setComfortLevel("");
      setSelectedDate(new Date());
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Daily Barometer</h1>
        <p className="text-muted-foreground">{selectedDate ? formatDate(selectedDate) : "Select a date to provide feedback"}</p>
      </div>

      <CalendarView filledDates={filledDates} onSelectDate={setSelectedDate} selectedDate={selectedDate} />

      <div className="grid md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className={`transition-all hover:shadow-md ${selectedCategories.includes(category.id) ? "ring-2 ring-primary ring-offset-2" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-pointer" onClick={() => toggleCategory(category.id)}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-lg">{category.icon}</div>
                <h2 className="font-semibold text-lg">{category.title}</h2>
              </div>
              {selectedCategories.includes(category.id) ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
              {selectedCategories.includes(category.id) && (
                <Textarea placeholder="Add your thoughts here..." value={categoryInputs[category.id] || ""} onChange={(e) => setCategoryInputs((prev) => ({ ...prev, [category.id]: e.target.value }))} className="mt-2" rows={4} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ActivitySquare className="w-5 h-5 text-blue-500" />
              <Label>Comfort Barometer</Label>
            </div>
            <RadioGroup value={comfortLevel} onValueChange={setComfortLevel} className="grid gap-2">
              {comfortZones.map((zone) => (
                <Label
                  key={zone.id}
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${zone.bgColor} ${comfortLevel === zone.id ? "ring-2 ring-offset-2" : ""}`}
                  style={{
                    ringColor: comfortLevel === zone.id ? getComputedStyle(document.documentElement).getPropertyValue(`--${zone.color}`) : "",
                  }}
                >
                  <RadioGroupItem value={zone.id} className="sr-only" />
                  <span className={`font-medium ${zone.color}`}>{zone.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "SUBMIT"}
      </Button>
    </div>
  );
}
