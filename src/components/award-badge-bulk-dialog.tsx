"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgePlus, Sparkles, Palette } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { BadgeRenderer, badgeColors } from "./badge-renderer";
import { Users } from "lucide-react";

interface AwardBadgeBulkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userIds: string[];
  onSuccess?: () => void;
}

const predefinedBadges = [
  { id: "first-reflection", name: "First Reflection", emoji: "✨", description: "Awarded for submitting their very first daily reflection." },
  { id: "consistent-reflector", name: "Consistent Reflector", emoji: "🔥", description: "Awarded for maintaining a reflection streak of 7 days." },
  { id: "insightful-learner", name: "Insightful Learner", emoji: "💡", description: "Awarded for exceptionally thoughtful or detailed reflections." },
  { id: "problem-solver", name: "Problem Solver", emoji: "🐛", description: "Awarded for demonstrating strong problem-solving skills." },
  { id: "great-teammate", name: "Great Teammate", emoji: "🤝", description: "Awarded for positive contributions to group projects." },
  { id: "star-performer", name: "Star Performer", emoji: "⭐", description: "Awarded for outstanding performance and dedication." },
];

const emojiOptions = [
  "🏆", "🎯", "💎", "🔥", "⭐", "🌟", "✨", "💫", "🚀", "🎉",
  "🎊", "🎁", "🏅", "🥇", "🥈", "🥉", "👑", "💪", "💯", "🌈",
];

export function AwardBadgeBulkDialog({ isOpen, onClose, userIds, onSuccess }: AwardBadgeBulkDialogProps) {
  const [activeTab, setActiveTab] = useState<"predefined" | "custom">("custom");
  const [selectedPredefinedBadge, setSelectedPredefinedBadge] = useState<string | null>(null);
  const [customBadge, setCustomBadge] = useState({
    type: "",
    name: "",
    emoji: "",
    imageUrl: "",
    color: "#3B82F6",
    style: "pixel" as "pixel" | "rounded" | "minimal" | "image",
  });
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    let badgeData;

    if (activeTab === "predefined") {
      if (!selectedPredefinedBadge) {
        toast.error("Please select a badge to award.");
        return;
      }
      const selected = predefinedBadges.find(b => b.id === selectedPredefinedBadge);
      badgeData = {
        type: selected!.name,
        name: selected!.name,
        emoji: selected!.emoji,
        imageUrl: "",
      };
    } else {
      if (!customBadge.type || !customBadge.name) {
        toast.error("Badge type and name are required.");
        return;
      }
      if (!customBadge.emoji && !customBadge.imageUrl) {
        toast.error("Please provide either an emoji or image URL.");
        return;
      }
      badgeData = {
        type: customBadge.type,
        name: customBadge.name,
        emoji: customBadge.emoji,
        imageUrl: customBadge.imageUrl,
        color: customBadge.color,
        style: customBadge.style,
      };
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/admin/badges/bulk", {
        userIds,
        ...badgeData,
      });

      const { successCount, failCount } = response.data || {};
      
      setIsSubmitting(false);
      
      if (successCount > 0) {
        toast.success(`Successfully awarded badge to ${successCount} learner${successCount !== 1 ? "s" : ""}`);
        if (failCount > 0) {
          toast.warning(`Failed to award to ${failCount} learner${failCount !== 1 ? "s" : ""}`);
        }
      } else {
        toast.error("Failed to award badge to any learners.");
      }
    } catch (error) {
      console.error("Bulk award failed:", error);
      toast.error("Failed to award badges. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

    onSuccess?.();
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedPredefinedBadge(null);
    setCustomBadge({ type: "", name: "", emoji: "", imageUrl: "", color: "#3B82F6", style: "pixel" });
    setUseImageUrl(false);
    setShowEmojiPicker(false);
    setActiveTab("custom");
  };

  const getBadgePreview = () => {
    if (activeTab === "predefined" && selectedPredefinedBadge) {
      const selected = predefinedBadges.find(b => b.id === selectedPredefinedBadge);
      return { type: selected!.name, name: selected!.name, emoji: selected!.emoji, imageUrl: "", awardedAt: new Date().toISOString() };
    }
    if (activeTab === "custom") {
      return {
        type: customBadge.type || "Custom Badge",
        name: customBadge.name || "Preview Badge",
        emoji: customBadge.emoji || "🏆",
        imageUrl: customBadge.imageUrl || "",
        color: customBadge.color,
        style: customBadge.style,
        awardedAt: new Date().toISOString()
      };
    }
    return null;
  };

  const preview = getBadgePreview();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgePlus className="h-5 w-5" />
            Bulk Award Badge
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Awarding to <span className="font-semibold text-foreground">{userIds.length}</span> learner{userIds.length !== 1 ? "s" : ""}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "predefined" | "custom")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Badge</TabsTrigger>
            <TabsTrigger value="predefined">Predefined Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="predefined" className="space-y-4">
            <Label className="text-base font-semibold">Select a predefined badge:</Label>
            <RadioGroup
              value={selectedPredefinedBadge || ""}
              onValueChange={setSelectedPredefinedBadge}
              className="grid gap-2"
            >
              {predefinedBadges.map((badge) => (
                <Label
                  key={badge.id}
                  htmlFor={badge.id}
                  className="flex flex-col items-start space-x-0 space-y-1 p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={badge.id} id={badge.id} />
                    <span className="text-lg">{badge.emoji}</span>
                    <span className="font-medium">{badge.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">{badge.description}</p>
                </Label>
              ))}
            </RadioGroup>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-type">Badge Type *</Label>
                <Input
                  id="bulk-type"
                  placeholder="e.g., Problem Solver, Great Teammate"
                  value={customBadge.type}
                  onChange={(e) => setCustomBadge({ ...customBadge, type: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-name">Badge Name *</Label>
                <Input
                  id="bulk-name"
                  placeholder="e.g., For debugging the login flow"
                  value={customBadge.name}
                  onChange={(e) => setCustomBadge({ ...customBadge, name: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label>Badge Icon *</Label>
                <RadioGroup value={useImageUrl ? "url" : "emoji"} onValueChange={(v) => setUseImageUrl(v === "url")}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="emoji" id="bulk-emoji" />
                      <Label htmlFor="bulk-emoji" className="cursor-pointer">Select Emoji</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="url" id="bulk-url" />
                      <Label htmlFor="bulk-url" className="cursor-pointer">Image URL</Label>
                    </div>
                  </div>
                </RadioGroup>

                {useImageUrl ? (
                  <Input
                    placeholder="https://example.com/badge.png"
                    value={customBadge.imageUrl}
                    onChange={(e) => setCustomBadge({ ...customBadge, imageUrl: e.target.value })}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Select an emoji..."
                        value={customBadge.emoji}
                        onChange={(e) => setCustomBadge({ ...customBadge, emoji: e.target.value })}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                    {showEmojiPicker && (
                      <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {emojiOptions.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setCustomBadge({ ...customBadge, emoji });
                                setShowEmojiPicker(false);
                              }}
                              className="text-2xl hover:bg-muted p-1 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Badge Style *</Label>
                <RadioGroup
                  value={customBadge.style}
                  onValueChange={(v) => setCustomBadge({ ...customBadge, style: v as "pixel" | "rounded" | "minimal" | "image" })}
                  className="grid grid-cols-2 gap-3"
                >
                  {["pixel", "rounded", "minimal", "image"].map((style) => (
                    <div key={style} className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted transition-colors">
                      <RadioGroupItem value={style} id={`bulk-${style}`} />
                      <Label htmlFor={`bulk-${style}`} className="cursor-pointer flex-1">
                        <div className="text-sm font-medium capitalize">{style}</div>
                        <div className="text-xs text-muted-foreground">
                          {style === "pixel" && "Classic retro style"}
                          {style === "rounded" && "Picture-only badge"}
                          {style === "minimal" && "Minimal indicator"}
                          {style === "image" && "Pure PNG upload"}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Badge Color
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {badgeColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setCustomBadge({ ...customBadge, color: color.hex })}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        customBadge.color === color.hex ? "border-gray-800 shadow-lg" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
          <Label className="text-sm text-muted-foreground mb-2 block">Badge Preview:</Label>
          {preview ? (
            <div className="flex items-center gap-4">
              <BadgeRenderer badge={preview} showTooltip={false} />
              <div className="flex-1">
                <p className="font-medium">{preview.name}</p>
                <p className="text-sm text-muted-foreground">{preview.type}</p>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No badge selected</div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || userIds.length === 0}>
            {isSubmitting ? "Awarding..." : `Award to ${userIds.length} Learner${userIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
