import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, Smile, StickyNote } from "lucide-react";

import { BoardReactionPicker } from "@/components/board-reaction-picker";
import { BoardReactionSummary } from "@/components/board-reaction-summary";
import { PageError, PageLoading } from "@/components/page-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";
import { addReaction, createPost, getPosts, removeReaction } from "@/lib/api";
import { getBoardUserPayload, type BoardPost } from "@/lib/board";

const COHORT_COLORS: Record<number, string> = {
  1: "border-l-[hsl(var(--cohort-1))]",
  2: "border-l-[hsl(var(--cohort-2))]",
  3: "border-l-[hsl(var(--cohort-3))]",
  4: "border-l-[hsl(var(--cohort-4))]",
};

const getCohortColor = (cohort: number) => COHORT_COLORS[cohort % 4] || COHORT_COLORS[1];

interface MutationOptions {
  onSuccess?: () => void;
}

interface PostCardProps {
  post: BoardPost;
  addReactionMutation: {
    mutate: (variables: { postId: string; reaction: string }, options?: MutationOptions) => void;
    isLoading: boolean;
  };
  removeReactionMutation: {
    mutate: (variables: string, options?: MutationOptions) => void;
    isLoading: boolean;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post, addReactionMutation, removeReactionMutation }) => {
  const { userId } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [bouncingReaction, setBouncingReaction] = useState<string | null>(null);

  const postReactions = post.reactions || [];
  const postComments = post.comments || [];
  const userReaction = postReactions.find((reaction) => reaction.userId === userId);
  const hasUserReacted = !!userReaction;

  const handleReact = (event: React.MouseEvent, reaction: string) => {
    event.preventDefault();
    event.stopPropagation();

    setBouncingReaction(reaction);
    setTimeout(() => setBouncingReaction(null), 400);

    if (hasUserReacted) {
      removeReactionMutation.mutate(post.id, {
        onSuccess: () => {
          addReactionMutation.mutate({ postId: post.id, reaction });
        },
      });
    } else {
      addReactionMutation.mutate({ postId: post.id, reaction });
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeReactionMutation.mutate(post.id);
    setShowReactionPicker(false);
  };

  const toggleReactionPicker = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowReactionPicker((isOpen) => !isOpen);
  };

  return (
    <Link to={`/talk-board/${post.id}`} className="block">
      <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="w-3 h-3 rounded-full bg-primary/80 shadow-md" />
        </div>

        <Card className={`paper-texture shadow-md hover:shadow-xl transition-shadow duration-300 border-l-4 ${getCohortColor(post.cohort)}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar
                userId={post.userId}
                name={post.zoomName}
                className="h-10 w-10 border-2 border-primary/20"
                fallbackClassName="bg-primary/10 text-primary font-semibold text-sm"
              />
              <div>
                <p className="font-semibold text-sm">{post.zoomName}</p>
                <p className="text-xs text-muted-foreground">
                  Cohort {post.cohort} - {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-foreground/90 leading-relaxed mb-4">{post.content}</p>

            <BoardReactionSummary
              reactions={postReactions}
              currentReaction={userReaction?.value}
              bouncingReaction={bouncingReaction}
              className="flex items-center gap-2 mb-4"
              itemClassName="flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(var(--reactions-bg))]"
              animated
            />

            <div className="flex items-center gap-2 relative">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleReactionPicker}
                  disabled={addReactionMutation.isLoading || removeReactionMutation.isLoading}
                  className={`h-8 px-3 text-sm ${hasUserReacted ? "bg-primary/10 text-primary" : ""}`}
                >
                  <Smile className="mr-1.5 h-4 w-4" />
                  {hasUserReacted ? "Reacted" : "React"}
                </Button>

                <Button variant="ghost" size="sm" className="h-8 px-3 text-sm">
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  {postComments.length}
                </Button>
              </div>

              <AnimatePresence>
                {showReactionPicker && (
                  <BoardReactionPicker
                    currentReaction={userReaction?.value}
                    hasReaction={hasUserReacted}
                    onReact={handleReact}
                    onRemove={handleRemoveReaction}
                    className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-2 bg-card/95 backdrop-blur-md rounded-xl border shadow-lg"
                    reactionClassName="p-1.5 rounded-lg hover:bg-[hsl(var(--reactions-bg))] transition-colors"
                    removeClassName="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive ml-1"
                    animated
                  />
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

const TalkBoardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { userData } = useUserData();
  const [newPostContent, setNewPostContent] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const { data: posts, isLoading, error } = useQuery("talkBoardPosts", getPosts);

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
      const { zoomName, cohort } = getBoardUserPayload(userData);
      createPostMutation.mutate({
        content: newPostContent,
        zoomName,
        cohort,
      });
    }
  };

  const composerUser = getBoardUserPayload(userData);

  if (isLoading) {
    return <PageLoading label="Loading posts..." />;
  }

  if (error) {
    return <PageError title="Couldn't load the campus chat." message="Give it another try soon." />;
  }

  return (
    <div className="min-h-screen dot-grid-bg pb-20">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Campus Lounge</h1>
              <p className="text-muted-foreground mt-1 font-handwriting">From the community, for the community</p>
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

      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
            onClick={() => setShowComposer(false)}
          >
            <motion.div initial={{ rotate: -2 }} animate={{ rotate: 0 }} className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
              <Card className="paper-texture shadow-xl border-2 border-primary/20 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-lg" />
                </div>

                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      userId={composerUser.userId}
                      name={composerUser.zoomName}
                      firstName={composerUser.firstName}
                      lastName={composerUser.lastName}
                      email={composerUser.email}
                      className="h-10 w-10 border-2 border-primary/30"
                      fallbackClassName="bg-primary/10 text-primary font-semibold"
                    />
                    <div className="flex-1">
                      <Textarea
                        value={newPostContent}
                        onChange={(event) => setNewPostContent(event.target.value)}
                        placeholder="What's on your mind? Share with the cohort..."
                        className="min-h-[120px] resize-none border-0 focus-visible:ring-2 focus-visible:ring-primary/50 bg-transparent text-lg"
                        autoFocus
                      />
                      <div className="flex items-center justify-between mt-4">
                        <span className={`text-sm ${newPostContent.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                          {newPostContent.length}/500
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setShowComposer(false)}>
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
                <PostCard post={post} addReactionMutation={addReactionMutation} removeReactionMutation={removeReactionMutation} />
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

export default TalkBoardPage;
