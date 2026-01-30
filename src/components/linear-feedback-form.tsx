import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Users, 
  Target, 
  Wrench, 
  ActivitySquare, 
  Lightbulb, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle 
} from "lucide-react";
import { toast } from "react-toastify";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
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
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalSteps = 5;
  const steps = [
    { id: "tech-happy", title: "Tech Happy", icon: <Code className="w-5 h-5 text-emerald-500" /> },
    { id: "tech-improve", title: "Tech Improve", icon: <Wrench className="w-5 h-5 text-blue-500" /> },
    { id: "non-tech-happy", title: "Non-Tech Happy", icon: <Users className="w-5 h-5 text-purple-500" /> },
    { id: "non-tech-improve", title: "Non-Tech Improve", icon: <Target className="w-5 h-5 text-orange-500" /> },
    { id: "comfort-barometer", title: "Comfort Barometer", icon: <ActivitySquare className="w-5 h-5 text-blue-500" /> },
  ];

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

  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    onChange?.({ categoryInputs, comfortLevel });
  }, [categoryInputs, comfortLevel, onChange]);

  useEffect(() => {
    if (currentStep <= 4 && textareaRef.current) {
      const timeout = setTimeout(() => {
        textareaRef.current?.focus();
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [currentStep]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Backspace" && currentStep > 1) {
      const target = e.target as HTMLTextAreaElement;
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        handlePrev();
      }
    }
  };

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
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === totalSteps && comfortLevel) {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyDownGlobal = (e: KeyboardEvent) => {
    if (currentStep === 5) {
      const zoneKeys: Record<string, string> = {
        '1': 'comfort',
        '2': 'stretch-enjoying',
        '3': 'stretch-overwhelmed',
        '4': 'panic'
      };
      
      if (zoneKeys[e.key]) {
        e.preventDefault();
        setComfortLevel(zoneKeys[e.key]);
      } else if (e.key === 'Enter' && comfortLevel) {
        e.preventDefault();
        setShowSubmitConfirmation(true);
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && comfortLevel) {
      e.preventDefault();
      setShowSubmitConfirmation(true);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => window.removeEventListener("keydown", handleKeyDownGlobal);
  }, [currentStep, comfortLevel]);

  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      if (showSubmitConfirmation && e.key === 'Enter') {
        e.preventDefault();
        setShowSubmitConfirmation(false);
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, [showSubmitConfirmation]);

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
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <div className="flex gap-1">
            {steps.map((step, index) => (
              <span key={step.id} className={index < currentStep ? "text-primary" : "text-muted-foreground"}>
                {step.icon}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          {currentStep >= 1 && currentStep <= 4 && (
            <motion.div
              key={`text-step-${currentStep}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                {steps[currentStep - 1].icon}
                <h3 className="text-lg font-semibold">{steps[currentStep - 1].title}</h3>
                <Badge variant="secondary" className="ml-auto">Step {currentStep}</Badge>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      currentStep === 1 ? "bg-emerald-100 dark:bg-emerald-900/30" :
                      currentStep === 2 ? "bg-blue-100 dark:bg-blue-900/30" :
                      currentStep === 3 ? "bg-purple-100 dark:bg-purple-900/30" :
                      "bg-orange-100 dark:bg-orange-900/30"
                    }`}>
                      {steps[currentStep - 1].icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{categories[currentStep - 1].title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{categories[currentStep - 1].description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    ref={textareaRef}
                    id={categories[currentStep - 1].id}
                    placeholder={categories[currentStep - 1].placeholder}
                    value={categoryInputs[categories[currentStep - 1].id] || ""}
                    onChange={(e) =>
                      setCategoryInputs((prev) => ({
                        ...prev,
                        [categories[currentStep - 1].id]: e.target.value,
                      }))
                    }
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to continue
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {currentStep === 5 && (
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
                <Badge variant="secondary" className="ml-auto">Step 5</Badge>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <ActivitySquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">How are you feeling today?</CardTitle>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Select the zone that best describes your current state</p>
                        <p className="text-xs text-muted-foreground">
                          Press <kbd className="px-1.5 py-0.5 rounded bg-muted border">1</kbd>-<kbd className="px-1.5 py-0.5 rounded bg-muted border">4</kbd> to select, then <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to continue
                        </p>
                      </div>
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
                            <kbd className="px-1.5 py-0.5 rounded bg-muted border text-xs font-mono">
                              {comfortZones.findIndex(z => z.id === zone.id) + 1}
                            </kbd>
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep === totalSteps ? (
          <Button 
            onClick={() => setShowSubmitConfirmation(true)}
            disabled={isLoading || !comfortLevel}
          >
            Submit Reflection
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            disabled={isLoading}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <AlertDialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
        <AlertDialogContent>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Submit Reflection</h3>
            <p>Are you sure you want to submit your daily reflection?</p>
            <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to confirm</p>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel onClick={() => setShowSubmitConfirmation(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowSubmitConfirmation(false);
                  handleSubmit();
                }}
              >
                Submit
              </AlertDialogAction>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
