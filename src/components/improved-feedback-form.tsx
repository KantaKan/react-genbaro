import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Users, 
  Target, 
  Wrench, 
  ActivitySquare, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2 
} from "lucide-react";
import { toast } from "react-toastify";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserData } from "@/UserDataContext";
import { motion, AnimatePresence } from "framer-motion";

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
  placeholder: string;
}

interface ComfortZone {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
  description: string;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate progress
  const totalSteps = 3; // Tech, Non-Tech, Comfort
  const completedSteps = [
    categoryInputs["tech-happy"] || categoryInputs["tech-improve"],
    categoryInputs["non-tech-happy"] || categoryInputs["non-tech-improve"],
    comfortLevel
  ].filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

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
      placeholder: "What went well technically today? What are you proud of?",
    },
    {
      id: "tech-improve",
      title: "Tech-Improve",
      icon: <Wrench className="w-5 h-5 text-blue-500" />,
      description: "Identify areas for technical growth and improvement",
      placeholder: "What technical challenges did you face? What would you like to improve?",
    },
    {
      id: "non-tech-happy",
      title: "Non-Tech Happy",
      icon: <Users className="w-5 h-5 text-purple-500" />,
      description: "Highlight positive non-technical experiences and interactions",
      placeholder: "What non-technical moments made you smile? How did you connect with others?",
    },
    {
      id: "non-tech-improve",
      title: "Non-Tech Improve",
      icon: <Target className="w-5 h-5 text-orange-500" />,
      description: "Suggest non-technical areas for development",
      placeholder: "How could your non-technical experiences be better? What would help you grow?",
    },
  ];

  const comfortZones: ComfortZone[] = [
    {
      id: "comfort",
      label: "Comfort Zone",
      color: "text-white",
      bgColor: "bg-emerald-500",
      emoji: "😊",
      description: "Tasks are easy and familiar. Feeling safe and in control."
    },
    {
      id: "stretch-enjoying",
      label: "Stretch zone - Enjoying the challenges",
      color: "text-white",
      bgColor: "bg-amber-500",
      emoji: "💪",
      description: "Pushing your boundaries, feeling challenged but excited."
    },
    {
      id: "stretch-overwhelmed",
      label: "Stretch zone - Overwhelmed",
      color: "text-white",
      bgColor: "bg-red-500",
      emoji: "😰",
      description: "Feeling stressed, but still learning and growing."
    },
    {
      id: "panic",
      label: "Panic Zone",
      color: "text-white",
      bgColor: "bg-violet-500",
      emoji: "😵",
      description: "Feeling extreme stress or fear. Learning is difficult here."
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
      setIsSubmitted(true);

      // Reset form
      setTimeout(() => {
        setCategoryInputs({});
        setComfortLevel("");
        setCurrentStep(1);
        setIsSubmitted(false);
        onSuccess?.();
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit reflection");
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (error) return <div className="text-center text-destructive p-4">Error loading user data</div>;

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto" />
        </motion.div>
        <motion.h3 
          className="text-2xl font-bold mt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Reflection Submitted!
        </motion.h3>
        <motion.p 
          className="text-muted-foreground mt-2 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Thank you for taking time to reflect on your journey
        </motion.p>
      </motion.div>
    );
  }

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
        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Daily Reflection
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Take a moment to reflect on your day</p>
      </DialogHeader>
      
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{completedSteps} of {totalSteps} completed</span>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="tech-step"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Technical Experiences</h3>
                <Badge variant="secondary" className="ml-auto">Step 1</Badge>
              </div>
              
              <Tabs defaultValue="tech-happy" className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="tech-happy">Happy</TabsTrigger>
                  <TabsTrigger value="tech-improve">Improve</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tech-happy" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <Code className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Tech-Happy</CardTitle>
                          <p className="text-sm text-muted-foreground">Share your technical achievements and positive experiences</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        id="tech-happy"
                        placeholder="What went well technically today? What are you proud of?"
                        value={categoryInputs["tech-happy"] || ""}
                        onChange={(e) =>
                          setCategoryInputs((prev) => ({
                            ...prev,
                            "tech-happy": e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="tech-improve" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Wrench className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Tech-Improve</CardTitle>
                          <p className="text-sm text-muted-foreground">Identify areas for technical growth and improvement</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        id="tech-improve"
                        placeholder="What technical challenges did you face? What would you like to improve?"
                        value={categoryInputs["tech-improve"] || ""}
                        onChange={(e) =>
                          setCategoryInputs((prev) => ({
                            ...prev,
                            "tech-improve": e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
          
          {currentStep === 2 && (
            <motion.div
              key="non-tech-step"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Non-Technical Experiences</h3>
                <Badge variant="secondary" className="ml-auto">Step 2</Badge>
              </div>
              
              <Tabs defaultValue="non-tech-happy" className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="non-tech-happy">Happy</TabsTrigger>
                  <TabsTrigger value="non-tech-improve">Improve</TabsTrigger>
                </TabsList>
                
                <TabsContent value="non-tech-happy" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Non-Tech Happy</CardTitle>
                          <p className="text-sm text-muted-foreground">Highlight positive non-technical experiences and interactions</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        id="non-tech-happy"
                        placeholder="What non-technical moments made you smile? How did you connect with others?"
                        value={categoryInputs["non-tech-happy"] || ""}
                        onChange={(e) =>
                          setCategoryInputs((prev) => ({
                            ...prev,
                            "non-tech-happy": e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="non-tech-improve" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Target className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Non-Tech Improve</CardTitle>
                          <p className="text-sm text-muted-foreground">Suggest non-technical areas for development</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        id="non-tech-improve"
                        placeholder="How could your non-technical experiences be better? What would help you grow?"
                        value={categoryInputs["non-tech-improve"] || ""}
                        onChange={(e) =>
                          setCategoryInputs((prev) => ({
                            ...prev,
                            "non-tech-improve": e.target.value,
                          }))
                        }
                        disabled={isLoading}
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
          
          {currentStep === 3 && (
            <motion.div
              key="comfort-step"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <ActivitySquare className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Comfort Barometer</h3>
                <Badge variant="secondary" className="ml-auto">Step 3</Badge>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ActivitySquare className="w-5 h-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">How are you feeling today?</CardTitle>
                      <p className="text-sm text-muted-foreground">Select the zone that best describes your current state</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={comfortLevel} 
                    onValueChange={setComfortLevel} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {comfortZones.map((zone) => (
                      <Label
                        key={zone.id}
                        className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                          comfortLevel === zone.id 
                            ? `border-primary ${zone.bgColor} ${zone.color}` 
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <RadioGroupItem 
                          value={zone.id} 
                          id={zone.id} 
                          className="mt-0.5 peer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{zone.emoji}</span>
                            <span className={`font-medium ${comfortLevel === zone.id ? zone.color : ""}`}>
                              {zone.label}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${comfortLevel === zone.id ? zone.color + ' opacity-90' : 'text-muted-foreground'}`}>
                            {zone.description}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                  
                  {comfortLevel && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-lg bg-secondary/50 border flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Selected: {comfortZones.find(z => z.id === comfortLevel)?.label}</p>
                        <p className="text-sm text-muted-foreground">This will help us understand your learning journey</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          disabled={currentStep === 1 || isLoading}
        >
          Previous
        </Button>
        
        {currentStep < 3 ? (
          <Button 
            onClick={handleNext} 
            disabled={isLoading}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !comfortLevel}
          >
            {isLoading ? "Submitting..." : "Submit Reflection"}
          </Button>
        )}
      </div>
    </div>
  );
}