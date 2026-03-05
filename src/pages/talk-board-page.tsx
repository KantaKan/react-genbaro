import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Smile, X, Pin, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";

interface Reaction {
  id: string;
  userId: string;
  type: "emoji" | "image";
  value: string;
}

interface Comment {
  id: string;
  userId: string;
  zoomName: string;
  cohort: number;
  content: string;
  reactions: Reaction[];
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  zoomName: string;
  cohort: number;
  content: string;
  reactions: Reaction[];
  comments: Comment[];
  createdAt: string;
}

const REACTION_EMOJIS = [
  { name: "peepolike", url: "/reaction/peepoLIKE-2x.webp" },
  { name: "pepelaugh", url: "/reaction/PepeLaugh-2x.webp" },
  { name: "sadge", url: "/reaction/Sadge-2x.png" },
  { name: "peepoheart", url: "/reaction/peepoHeart-2x.webp" },
];

const REACTION_MAP: { [key: string]: string } = {
  "peepolike": "/reaction/peepoLIKE-2x.webp",
  "pepelaugh": "/reaction/PepeLaugh-2x.webp",
  "sadge": "/reaction/Sadge-2x.png",
  "peepoheart": "/reaction/peepoHeart-2x.webp",
};

const COHORT_COLORS: { [key: number]: string } = {
  1: "border-l-[hsl(var(--cohort-1))]",
  2: "border-l-[hsl(var(--cohort-2))]",
  3: "border-l-[hsl(var(--cohort-3))]",
  4: "border-l-[hsl(var(--cohort-4))]",
};

const getCohortColor = (cohort: number) => COHORT_COLORS[cohort % 4] || COHORT_COLORS[1];

const fetchPosts = async (): Promise<Post[]> => {
  const response = await api.get("/board/posts");
  return response.data.data;
};

const createPost = async ({ content, zoomName, cohort }: { content: string; zoomName: string; cohort: number }) => {
  const response = await api.post("/board/posts", { content, zoomName, cohort });
  return response.data.data;
};

const addReaction = async ({ postId, reaction }: { postId: string; reaction: string }) => {
  const response = await api.post(`/board/posts/${postId}/reactions`, { reaction });
  return response.data.data;
};

const removeReaction = async (postId: string) => {
  const response = await api.delete(`/board/posts/${postId}/reactions`);
  return response.data.data;
};

const TalkBoardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { userData } = useUserData();
  const [newPostContent, setNewPostContent] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const { data: posts, isLoading, error } = useQuery("talkBoardPosts", fetchPosts);

  const createPostMutation = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries("talkBoardPosts");
      setNewPostContent("");
      setShowComposer(false);
    },
  });

  const addReactionMutation = useMutation(addReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries("talkBoardPosts");
    },
  });

  const removeReactionMutation = useMutation(removeReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries("talkBoardPosts");
    },
  });

  const handleCreatePost = () => {
    if (newPostContent.trim() && userData) {
      createPostMutation.mutate({ 
        content: newPostContent, 
        zoomName: userData.zoom_name || "Unknown", 
        cohort: userData.cohort_number || 0 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-destructive">Oops! Couldn't load the campus chat.</p>
          <p className="text-muted-foreground text-sm mt-2">Give it another try soon.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen dot-grid-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Campus Lounge</h1>
              <p className="text-muted-foreground mt-1 font-handwriting">
                From the community, for the community
              </p>
            </div>
            <Button 
              onClick={() => setShowComposer(true)}
              className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
            >
              <StickyNote className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Composer */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowComposer(false)}
          >
            <motion.div
              initial={{ rotate: -2 }}
              animate={{ rotate: 0 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="paper-texture shadow-xl border-2 border-primary/20 relative">
                {/* Pin decoration */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-lg" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {userData?.zoom_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="What's on your mind? Share with the cohort..."
                        className="min-h-[120px] resize-none border-0 focus-visible:ring-2 focus-visible:ring-primary/50 bg-transparent text-lg"
                        autoFocus
                      />
                      <div className="flex items-center justify-between mt-4">
                        <span className={`text-sm ${newPostContent.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                          {newPostContent.length}/500
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowComposer(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || createPostMutation.isLoading}
                            className="rounded-full px-6"
                          >
                            {createPostMutation.isLoading ? (
                              "Posting..."
                            ) : (
                              <>
                                Post
                                <Send className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <AnimatePresence>
            {posts?.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <PostCard 
                  post={post} 
                  addReactionMutation={addReactionMutation} 
                  removeReactionMutation={removeReactionMutation}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <MessageSquare className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-xl font-semibold">The lounge is quiet...</h3>
            <p className="text-muted-foreground mt-2">Be the first to start a conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface PostCardProps {
  post: Post;
  addReactionMutation: any;
  removeReactionMutation: any;
}

const PostCard: React.FC<PostCardProps> = ({ post, addReactionMutation, removeReactionMutation }) => {
  const { userId } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [bouncingReaction, setBouncingReaction] = useState<string | null>(null);

  const postReactions = post.reactions || [];
  const postComments = post.comments || [];
  const userReaction = postReactions.find(reaction => reaction.userId === userId);
  const hasUserReacted = !!userReaction;

  const handleReact = (e: React.MouseEvent, reaction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBouncingReaction(reaction);
    setTimeout(() => setBouncingReaction(null), 400);
    
    if (hasUserReacted) {
      removeReactionMutation.mutate(post.id, {
        onSuccess: () => {
          addReactionMutation.mutate({ postId: post.id, reaction });
        }
      });
    } else {
      addReactionMutation.mutate({ postId: post.id, reaction });
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeReactionMutation.mutate(post.id);
    setShowReactionPicker(false);
  };

  const toggleReactionPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowReactionPicker(!showReactionPicker);
  };

  const reactionCounts = postReactions.reduce((acc, reaction) => {
    acc[reaction.value] = (acc[reaction.value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Link to={`/talk-board/${post.id}`} className="block">
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="relative"
      >
        {/* Pin */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="w-3 h-3 rounded-full bg-primary/80 shadow-md" />
        </div>

        <Card className={`
          paper-texture shadow-md hover:shadow-xl transition-shadow duration-300
          border-l-4 ${getCohortColor(post.cohort)}
        `}>
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {post.zoomName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{post.zoomName}</p>
                <p className="text-xs text-muted-foreground">
                  Cohort {post.cohort} · {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Content */}
            <p className="text-foreground/90 leading-relaxed mb-4">
              {post.content}
            </p>

            {/* Reactions Display */}
            <div className="flex items-center gap-2 mb-4">
              {Object.entries(reactionCounts).map(([type, count]) => (
                <motion.div
                  key={type}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(var(--reactions-bg))]
                    ${userReaction?.value === type ? 'ring-2 ring-primary/50' : ''}
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  {REACTION_MAP[type] ? (
                    <img 
                      src={REACTION_MAP[type]} 
                      alt={type} 
                      className={`w-5 h-5 ${bouncingReaction === type ? 'reaction-bounce' : ''}`}
                    />
                  ) : (
                    <span className="text-sm">{type}</span>
                  )}
                  <span className="text-xs font-medium">{count}</span>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 relative">
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleReactionPicker}
                  disabled={addReactionMutation.isLoading || removeReactionMutation.isLoading}
                  className={`h-8 px-3 text-sm ${hasUserReacted ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Smile className="mr-1.5 h-4 w-4" />
                  {hasUserReacted ? 'Reacted' : 'React'}
                </Button>
                
                <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  {postComments.length}
                </Button>
              </div>

              {/* Reaction Picker */}
              <AnimatePresence>
                {showReactionPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-2 bg-card/95 backdrop-blur-md rounded-xl border shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {REACTION_EMOJIS.map((r) => (
                      <motion.button
                        key={r.name}
                        onClick={(e) => handleReact(e, r.name)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className={`
                          p-1.5 rounded-lg hover:bg-[hsl(var(--reactions-bg))] transition-colors
                          ${userReaction?.value === r.name ? 'bg-primary/20 ring-1 ring-primary/30' : ''}
                        `}
                      >
                        <img src={r.url} alt={r.name} className="w-7 h-7" />
                      </motion.button>
                    ))}
                    {hasUserReacted && (
                      <motion.button
                        onClick={handleRemoveReaction}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive ml-1"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

export default TalkBoardPage;
