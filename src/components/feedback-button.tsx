import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, MessageSquareText } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner"; // Assuming 'sonner' for toast notifications

interface FeedbackButtonProps {
  userId: string;
  reflectionId: string;
  initialFeedback?: string;
  onFeedbackUpdated?: () => void;
}

export function FeedbackButton({ userId, reflectionId, initialFeedback = "", onFeedbackUpdated }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState(initialFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveFeedback = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/admin/users/${userId}/reflections/${reflectionId}/feedback`, { feedback_text: feedbackText });
      toast.success("Feedback saved successfully!");
      setIsOpen(false);
      onFeedbackUpdated?.();
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Failed to save feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          {initialFeedback ? (
            <MessageSquareText className="h-4 w-4 mr-2" />
          ) : (
            <MessageSquarePlus className="h-4 w-4 mr-2" />
          )}
          {initialFeedback ? "Edit Feedback" : "Add Feedback"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initialFeedback ? <MessageSquareText className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
            {initialFeedback ? "Edit Admin Feedback" : "Add Admin Feedback"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Type your feedback here..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={5}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSaveFeedback} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
