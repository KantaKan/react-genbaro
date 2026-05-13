import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { 
  MessageSquare, Send, Smile, Award, Info, 
  Instagram, Linkedin, Github, Edit2, Check, X,
  Pin, MapPin, Crown, Trash2
} from "lucide-react";

import { BoardReactionPicker } from "@/components/board-reaction-picker";
import { BoardReactionSummary } from "@/components/board-reaction-summary";
import { PageError, PageLoading } from "@/components/page-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BadgeRenderer } from "@/components/badge-renderer";
import { useAuth } from "@/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";
import { getUserById, addProfileComment, addProfileReaction, updateUserPersonalDetails, deleteUserById, deleteProfileComment, updateUser } from "@/application/services/userService";
import { deleteComment as deleteBoardComment } from "@/lib/api";
import { getBoardUserPayload } from "@/lib/board";
import { getAuthToken } from "@/infrastructure/storage";
import { toast } from "react-toastify";
import type { JWTPayload } from "@/domain/types";

// Helper to generate a unique, deterministic gradient based on a string (user ID)
const getDeterministicGradient = (str: string) => {
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colors = [
    ["#6366f1", "#a855f7", "#ec4899"], // Indigo -> Purple -> Pink
    ["#3b82f6", "#2dd4bf", "#10b981"], // Blue -> Teal -> Green
    ["#f59e0b", "#ef4444", "#8b5cf6"], // Amber -> Red -> Violet
    ["#06b6d4", "#3b82f6", "#6366f1"], // Cyan -> Blue -> Indigo
    ["#8b5cf6", "#d946ef", "#f43f5e"], // Violet -> Fuchsia -> Rose
    ["#14b8a6", "#0ea5e9", "#6366f1"], // Teal -> Sky -> Indigo
  ];

  const paletteIndex = Math.abs(hash) % colors.length;
  const angle = (Math.abs(hash) % 360);
  const selectedPalette = colors[paletteIndex];

  return `linear-gradient(${angle}deg, ${selectedPalette[0]}, ${selectedPalette[1]}, ${selectedPalette[2]})`;
};

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { userId: currentUserId, userRole } = useAuth();
  const { userData: currentUserData } = useUserData();
  
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editBio, setEditBio] = useState("");
  const [editSocials, setEditSocials] = useState({ instagram: "", linkedin: "", github: "" });
  const [editPinnedBadges, setEditPinnedBadges] = useState<string[]>([]);
  
  // Admin Edit State
  const [adminEditData, setAdminEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    cohort_number: 0,
    jsd_number: "",
    project_group: "",
    genmate_group: "",
    zoom_name: ""
  });

  const isAdmin = userRole === "admin";

  const isOwnProfile = currentUserId === id;

  const { data: user, isLoading, error } = useQuery(
    ["userProfile", id], 
    () => getUserById(id!), 
    { 
      enabled: !!id,
      onSuccess: (data) => {
        setEditBio(data.bio || "");
        setEditSocials({
          instagram: data.social_links?.instagram || "",
          linkedin: data.social_links?.linkedin || "",
          github: data.social_links?.github || "",
        });
        setEditPinnedBadges(data.pinned_badge_ids || []);
        setAdminEditData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          cohort_number: data.cohort_number || 0,
          jsd_number: data.jsd_number || "",
          project_group: data.project_group || "",
          genmate_group: data.genmate_group || "",
          zoom_name: data.zoom_name || ""
        });
      }
    }
  );

  const updateDetailsMutation = useMutation(
    (payload: any) => isAdmin 
      ? updateUser(id!, payload) 
      : updateUserPersonalDetails(id!, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["userProfile", id]);
        setIsEditing(false);
        toast.success("Profile updated!");
      },
      onError: () => {
        toast.error("Failed to update profile");
      }
    }
  );

  const deleteCommentMutation = useMutation(
    (commentId: string) => deleteProfileComment(id!, commentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["userProfile", id]);
        toast.success("Comment deleted");
      },
      onError: () => {
        toast.error("Failed to delete comment");
      }
    }
  );

  const addCommentMutation = useMutation(
    (payload: { content: string; zoomName: string; cohort: number; parentId?: string }) => addProfileComment(id!, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["userProfile", id]);
        setNewComment("");
        setReplyContent("");
        setReplyToCommentId(null);
      },
    }
  );

  const addReactionMutation = useMutation(
    (payload: { type: string; value: string }) => addProfileReaction(id!, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["userProfile", id]);
      },
    }
  );

  const handleSaveDetails = () => {
    if (isAdmin) {
      updateDetailsMutation.mutate({
        ...adminEditData,
        bio: editBio,
        social_links: editSocials,
        pinned_badge_ids: editPinnedBadges,
      });
    } else {
      updateDetailsMutation.mutate({
        bio: editBio,
        social_links: editSocials,
        pinned_badge_ids: editPinnedBadges,
      });
    }
  };

  const togglePinBadge = (badgeId: string) => {
    setEditPinnedBadges(prev => 
      prev.includes(badgeId) 
        ? prev.filter(p => p !== badgeId) 
        : prev.length < 3 ? [...prev, badgeId] : prev
    );
  };

  const handleAddComment = (isReply: boolean = false) => {
    const content = isReply ? replyContent : newComment;
    if (content.trim() && currentUserData) {
      const { zoomName, cohort } = getBoardUserPayload(currentUserData);
      addCommentMutation.mutate({ 
        content: content.trim(), 
        zoomName, 
        cohort, 
        parentId: isReply ? (replyToCommentId || undefined) : undefined 
      });
    }
  };

  const handleReact = (event: React.MouseEvent, reaction: string) => {
    event.preventDefault();
    addReactionMutation.mutate({ type: "emoji", value: reaction });
    setShowReactionPicker(false);
  };

  if (isLoading) return <PageLoading label="Loading profile..." />;
  if (error || !user) return <PageError title="User not found" />;

  const userReaction = user.profile_reactions?.find(r => r.userId === currentUserId);
  const pinnedBadges = user.badges?.filter(b => user.pinned_badge_ids?.includes(b._id!)) || [];
  const coverGradient = getDeterministicGradient(user._id);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
          <div 
            className="h-48 relative transition-all duration-700"
            style={{ background: coverGradient }}
          >
             {(isOwnProfile || isAdmin) && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-none"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                {isEditing ? "Cancel" : isAdmin && !isOwnProfile ? "Edit Profile (Admin)" : "Edit Profile"}
              </Button>
            )}
          </div>
          <CardHeader className="relative pb-0">
            <div className="absolute -top-20 left-8">
              <UserAvatar 
                userId={user._id} 
                name={`${user.first_name} ${user.last_name}`} 
                className="w-40 h-40 border-8 border-background shadow-2xl"
              />
            </div>
            <div className="ml-52 pt-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-4xl font-black tracking-tight italic uppercase">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  {isAdmin && !isOwnProfile && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full text-xs font-bold">
                      <Crown className="w-3 h-3" /> Admin View
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground font-medium">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Cohort {user.cohort_number}
                  </p>
                  <p className="flex items-center gap-1">
                    <Info className="w-4 h-4" /> JSD-{user.jsd_number || "???"}
                  </p>
                </div>
                
                {/* Social Icons */}
                <div className="flex gap-3 mt-4">
                  {user.social_links?.instagram && (
                    <a href={user.social_links.instagram} target="_blank" rel="noreferrer" className="text-pink-500 hover:scale-110 transition-transform">
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {user.social_links?.linkedin && (
                    <a href={user.social_links.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:scale-110 transition-transform">
                      <Linkedin className="w-6 h-6" />
                    </a>
                  )}
                  {user.social_links?.github && (
                    <a href={user.social_links.github} target="_blank" rel="noreferrer" className="text-foreground hover:scale-110 transition-transform">
                      <Github className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 relative">
                 <Button 
                  variant="outline" 
                  size="lg"
                  className="rounded-full font-bold"
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                >
                  <Smile className="mr-2 h-5 w-5" />
                  {userReaction ? "Change Mood" : "React"}
                </Button>
                {showReactionPicker && (
                  <BoardReactionPicker
                    currentReaction={userReaction?.value}
                    hasReaction={!!userReaction}
                    onReact={handleReact}
                    onRemove={() => setShowReactionPicker(false)}
                    className="absolute top-14 right-0 z-50 flex gap-2 bg-card p-3 rounded-2xl border shadow-2xl"
                  />
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="mt-12 space-y-8">
            {/* Bio Section */}
            <div className="max-w-3xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">About Me</h3>
              {isEditing ? (
                <Textarea 
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px] text-lg bg-muted/50"
                />
              ) : (
                <p className="text-xl leading-relaxed">
                  {user.bio || "This learner hasn't written a bio yet."}
                </p>
              )}
            </div>

            {/* Pinned Badges Section */}
            {(pinnedBadges.length > 0 || isEditing) && (
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Pin className="w-4 h-4" /> Pinned Badges {isEditing && "(Select up to 3)"}
                </h3>
                <div className="flex flex-wrap gap-6">
                  {isEditing ? (
                    user.badges?.map(badge => (
                      <div 
                        key={badge._id} 
                        className={`cursor-pointer transition-all ${editPinnedBadges.includes(badge._id!) ? "ring-4 ring-primary rounded-xl scale-110" : "opacity-50 grayscale hover:grayscale-0"}`}
                        onClick={() => togglePinBadge(badge._id!)}
                      >
                        <BadgeRenderer badge={badge as any} />
                      </div>
                    ))
                  ) : (
                    pinnedBadges.map(badge => <BadgeRenderer key={badge._id} badge={badge as any} />)
                  )}
                </div>
              </div>
            )}

            {isEditing && (
              <div className="pt-6 border-t border-white/5 space-y-4">
                {isAdmin && (
                  <>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Learner Information (Admin Only)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold">First Name</label>
                        <Input value={adminEditData.first_name} onChange={e => setAdminEditData({...adminEditData, first_name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">Last Name</label>
                        <Input value={adminEditData.last_name} onChange={e => setAdminEditData({...adminEditData, last_name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">Email</label>
                        <Input value={adminEditData.email} onChange={e => setAdminEditData({...adminEditData, email: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">Cohort Number</label>
                        <Input type="number" value={adminEditData.cohort_number} onChange={e => setAdminEditData({...adminEditData, cohort_number: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">JSD Number</label>
                        <Input value={adminEditData.jsd_number} onChange={e => setAdminEditData({...adminEditData, jsd_number: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">Zoom Name</label>
                        <Input value={adminEditData.zoom_name} onChange={e => setAdminEditData({...adminEditData, zoom_name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">Project Group</label>
                        <Input value={adminEditData.project_group} onChange={e => setAdminEditData({...adminEditData, project_group: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold">Genmate Group</label>
                        <Input value={adminEditData.genmate_group} onChange={e => setAdminEditData({...adminEditData, genmate_group: e.target.value})} />
                      </div>
                    </div>
                    <div className="h-px bg-white/5 my-6" />
                  </>
                )}
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Instagram URL</label>
                    <Input value={editSocials.instagram} onChange={e => setEditSocials({...editSocials, instagram: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">LinkedIn URL</label>
                    <Input value={editSocials.linkedin} onChange={e => setEditSocials({...editSocials, linkedin: e.target.value})} placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">GitHub URL</label>
                    <Input value={editSocials.github} onChange={e => setEditSocials({...editSocials, github: e.target.value})} placeholder="https://..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveDetails} disabled={updateDetailsMutation.isLoading}>
                    <Check className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </div>
            )}

            {user.profile_reactions && user.profile_reactions.length > 0 && (
              <div className="pt-4 border-t border-white/5">
                <BoardReactionSummary 
                  reactions={user.profile_reactions.map(r => ({ ...r, id: r.id || '', userId: r.userId || '', type: r.type as any || 'emoji' }))} 
                  className="flex items-center gap-4"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              The Wall
            </h3>
          </div>

          <Card className="bg-card/30 border-dashed border-2">
            <CardHeader>
              <CardTitle className="text-lg">Leave a recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={`Tell everyone why ${user.first_name} is awesome...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-background/50"
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={() => handleAddComment(false)} 
                disabled={addCommentMutation.isLoading || !newComment.trim()}
                className="rounded-full px-8"
              >
                {addCommentMutation.isLoading ? "Sending..." : "Post to Wall"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-4">
            <AnimatePresence>
              {user.profile_comments && user.profile_comments.length > 0 ? (
                user.profile_comments.slice().reverse().map((comment) => {
                  const commentId = comment.id || comment._id;
                  return (
                    <motion.div key={commentId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <Card className="bg-card/40 border-none shadow-md group">
                        <CardHeader className="flex flex-row items-center gap-3 py-4">
                          <UserAvatar userId={comment.userId} name={comment.zoomName} className="w-10 h-10 ring-2 ring-primary/20" />
                          <div>
                            <p className="font-black text-sm uppercase italic">{comment.zoomName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-6 px-6">
                          <p className="text-lg leading-snug">"{comment.content}"</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs font-bold text-muted-foreground"
                              onClick={() => setReplyToCommentId(commentId || null)}
                            >
                              Reply
                            </Button>
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  if (window.confirm("Delete this comment?")) {
                                    deleteCommentMutation.mutate(commentId!);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            )}
                          </div>
                          {replyToCommentId === commentId && (
                            <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-2">
                               <Textarea 
                                 value={replyContent} 
                                 onChange={(e) => setReplyContent(e.target.value)} 
                                 placeholder="Write a reply..."
                               />
                               <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="sm" onClick={() => {
                                   setReplyToCommentId(null);
                                   setReplyContent("");
                                 }}>Cancel</Button>
                                 <Button 
                                   size="sm" 
                                   onClick={() => handleAddComment(true)}
                                   disabled={addCommentMutation.isLoading || !replyContent.trim()}
                                 >
                                   {addCommentMutation.isLoading ? "Sending..." : "Post Reply"}
                                 </Button>
                               </div>
                            </div>
                          )}
                        </CardContent>
                        {comment.replies && comment.replies.map(reply => (
                          <div key={reply.id || reply._id} className="ml-12 border-l-2 border-primary/20 pl-4 py-2 mb-2">
                             <p className="text-sm font-bold uppercase italic">{reply.zoomName}</p>
                             <p className="text-sm leading-snug">"{reply.content}"</p>
                          </div>
                        ))}
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
                   <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="text-lg font-medium">No recommendations yet.</p>
                   <p className="text-sm">Be the first to celebrate {user.first_name}!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-8">
           <h3 className="text-2xl font-black italic uppercase tracking-tighter">All Badges</h3>
           <Card className="bg-card/30 border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {user.badges && user.badges.length > 0 ? (
                  user.badges.map((badge, idx) => (
                    <div key={badge._id || idx} className="flex justify-center">
                      <BadgeRenderer badge={badge as any} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground italic">
                    No badges earned yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Information</h3>
          <Card className="bg-card/30 border-none shadow-lg overflow-hidden">
            <div className="h-2 bg-primary/20" />
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Generation Cohort</span>
                <span className="font-bold text-lg">{user.cohort_number}</span>
              </div>
              {user.project_group && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Project Team</span>
                  <span className="font-bold text-lg">{user.project_group}</span>
                </div>
              )}
               {user.genmate_group && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Genmate Group</span>
                  <span className="font-bold text-lg">{user.genmate_group}</span>
                </div>
              )}
               <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">JSD ID</span>
                <span className="font-bold text-lg text-primary">#{user.jsd_number || "---"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
