import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Smile } from "lucide-react";
import { useAuth } from "@/AuthContext";
import { addReaction, removeReaction, addCommentReaction, removeCommentReaction } from "@/lib/api";

// Types (should be in a types file)
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

interface AddReactionMutation {
  mutate: (variables: { postId: string; reaction: string }) => void;
  isLoading: boolean;
}

interface RemoveReactionMutation {
  mutate: (variables: string) => void;
  isLoading: boolean;
}

interface AddCommentReactionMutation {
  mutate: (variables: { commentId: string; reaction: string }) => void;
  isLoading: boolean;
}

interface RemoveCommentReactionMutation {
  mutate: (variables: string) => void;
  isLoading: boolean;
}

const fetchPost = async (postId: string): Promise<Post> => {
  const response = await api.get(`/board/posts/${postId}`);
  return response.data.data;
};

const createComment = async ({ postId, content }: { postId: string; content: string }) => {
  const response = await api.post(`/board/posts/${postId}/comments`, { content });
  return response.data.data;
};

const PostCard: React.FC<{ post: Post; addReactionMutation: AddReactionMutation; removeReactionMutation: RemoveReactionMutation }> = ({ post, addReactionMutation, removeReactionMutation }) => {
  const { userId } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const userReaction = post.reactions.find(reaction => reaction.userId === userId);
  const hasUserReacted = !!userReaction;

  const handleReact = (e: React.MouseEvent, reaction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  const reactions = [
    { name: "peepolike", url: "/reaction/peepoLIKE-2x.webp" },
    { name: "pepelaugh", url: "/reaction/PepeLaugh-2x.webp" },
    { name: "sadge", url: "/reaction/Sadge-2x.png" },
    { name: "peepoheart", url: "/reaction/peepoHeart-2x.webp" },
  ];

  const reactionMap: { [key: string]: string } = {
    "peepolike": "/reaction/peepoLIKE-2x.webp",
    "pepelaugh": "/reaction/PepeLaugh-2x.webp",
    "sadge": "/reaction/Sadge-2x.png",
    "peepoheart": "/reaction/peepoHeart-2x.webp",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarFallback>{post.zoomName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{post.zoomName}</p>
          <p className="text-sm text-muted-foreground">
            Cohort {post.cohort} - {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg">{post.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-4 relative">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleReactionPicker} 
            disabled={addReactionMutation.isLoading || removeReactionMutation.isLoading}
          >
            <Smile className="mr-2 h-4 w-4" />
            {hasUserReacted ? "Change Reaction" : "React"}
          </Button>
          {showReactionPicker && (
            <div className="absolute bottom-10 flex gap-2 bg-card p-2 rounded-lg border">
              {reactions.map((r) => (
                <button
                  key={r.name}
                  onClick={(e) => handleReact(e, r.name)}
                  className={`text-2xl hover:scale-125 transition-transform ${
                    userReaction?.value === r.name ? 'ring-2 ring-blue-500 rounded-full' : ''
                  }`}
                  title={userReaction?.value === r.name ? 'Current reaction' : `React with ${r.name}`}
                >
                  <img src={r.url} alt={r.name} className="w-8 h-8" />
                </button>
              ))}
              {hasUserReacted && (
                <button
                  onClick={handleRemoveReaction}
                  className="text-2xl hover:scale-125 transition-transform p-1 bg-red-100 hover:bg-red-200 rounded-full"
                  title="Remove reaction"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Comment ({post.comments.length})
          </Button>
        </div>
        <div>
          {post.reactions.length > 0 && (
            <div className="flex items-center gap-2">
              {Object.entries(
                post.reactions.reduce((acc, reaction) => {
                  acc[reaction.value] = (acc[reaction.value] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([reactionType, count]) => (
                <div key={reactionType} className="flex items-center gap-1">
                  {reactionMap[reactionType] ? (
                    <img src={reactionMap[reactionType]} alt={reactionType} className="w-5 h-5" />
                  ) : (
                    <span>{reactionType}</span>
                  )}
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const CommentCard: React.FC<{ comment: Comment; addCommentReactionMutation: AddCommentReactionMutation; removeCommentReactionMutation: RemoveCommentReactionMutation }> = ({ comment, addCommentReactionMutation, removeCommentReactionMutation }) => {
  const { userId } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const userReaction = comment.reactions.find(reaction => reaction.userId === userId);
  const hasUserReacted = !!userReaction;

  const handleReact = (e: React.MouseEvent, reaction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasUserReacted) {
      removeCommentReactionMutation.mutate(comment.id, {
        onSuccess: () => {
          addCommentReactionMutation.mutate({ commentId: comment.id, reaction });
        }
      });
    } else {
      addCommentReactionMutation.mutate({ commentId: comment.id, reaction });
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeCommentReactionMutation.mutate(comment.id);
    setShowReactionPicker(false);
  };

  const toggleReactionPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowReactionPicker(!showReactionPicker);
  };

  const reactions = [
    { name: "peepolike", url: "/reaction/peepoLIKE-2x.webp" },
    { name: "pepelaugh", url: "/reaction/PepeLaugh-2x.webp" },
    { name: "sadge", url: "/reaction/Sadge-2x.png" },
    { name: "peepoheart", url: "/reaction/peepoHeart-2x.webp" },
  ];

  const reactionMap: { [key: string]: string } = {
    "peepolike": "/reaction/peepoLIKE-2x.webp",
    "pepelaugh": "/reaction/PepeLaugh-2x.webp",
    "sadge": "/reaction/Sadge-2x.png",
    "peepoheart": "/reaction/peepoHeart-2x.webp",
  };

  return (
    <Card className="ml-12">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          <AvatarFallback>{comment.zoomName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{comment.zoomName}</p>
          <p className="text-sm text-muted-foreground">
            Cohort {comment.cohort} - {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p>{comment.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-4 relative">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleReactionPicker} 
            disabled={addCommentReactionMutation.isLoading || removeCommentReactionMutation.isLoading}
          >
            <Smile className="mr-2 h-4 w-4" />
            {hasUserReacted ? "Change Reaction" : "React"}
          </Button>
          {showReactionPicker && (
            <div className="absolute bottom-10 flex gap-2 bg-card p-2 rounded-lg border">
              {reactions.map((r) => (
                <button
                  key={r.name}
                  onClick={(e) => handleReact(e, r.name)}
                  className={`text-2xl hover:scale-125 transition-transform ${
                    userReaction?.value === r.name ? 'ring-2 ring-blue-500 rounded-full' : ''
                  }`}
                  title={userReaction?.value === r.name ? 'Current reaction' : `React with ${r.name}`}
                >
                  <img src={r.url} alt={r.name} className="w-8 h-8" />
                </button>
              ))}
              {hasUserReacted && (
                <button
                  onClick={handleRemoveReaction}
                  className="text-2xl hover:scale-125 transition-transform p-1 bg-red-100 hover:bg-red-200 rounded-full"
                  title="Remove reaction"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          {comment.reactions.length > 0 && (
            <div className="flex items-center gap-2">
              {Object.entries(
                comment.reactions.reduce((acc, reaction) => {
                  acc[reaction.value] = (acc[reaction.value] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([reactionType, count]) => (
                <div key={reactionType} className="flex items-center gap-1">
                  {reactionMap[reactionType] ? (
                    <img src={reactionMap[reactionType]} alt={reactionType} className="w-5 h-5" />
                  ) : (
                    <span>{reactionType}</span>
                  )}
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: post, isLoading, error } = useQuery(
    ["talkBoardPost", postId], 
    () => fetchPost(postId!), 
    { enabled: !!postId }
  );

  const createCommentMutation = useMutation(createComment, {
    onSuccess: () => {
      queryClient.invalidateQueries(["talkBoardPost", postId]);
      setNewComment("");
    },
  });

  const addReactionMutation = useMutation(addReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries(["talkBoardPost", postId]);
    },
  });

  const removeReactionMutation = useMutation(removeReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries(["talkBoardPost", postId]);
    },
  });

  const addCommentReactionMutation = useMutation(addCommentReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries(["talkBoardPost", postId]);
    },
  });

  const removeCommentReactionMutation = useMutation(removeCommentReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries(["talkBoardPost", postId]);
    },
  });

  const handleAddComment = () => {
    if (newComment.trim() && postId) {
      createCommentMutation.mutate({ postId, content: newComment });
    }
  };

  if (isLoading) {
    return <div>Loading post...</div>;
  }

  if (error || !post) {
    return <div>Error loading post.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <PostCard 
        post={post} 
        addReactionMutation={addReactionMutation} 
        removeReactionMutation={removeReactionMutation} 
      />
      
      <h2 className="text-2xl font-bold mt-8 mb-4">Comments</h2>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add a comment</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="mb-4"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddComment} disabled={createCommentMutation.isLoading}>
            {createCommentMutation.isLoading ? "Commenting..." : "Comment"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <AnimatePresence>
          {post.comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <CommentCard 
                comment={comment} 
                addCommentReactionMutation={addCommentReactionMutation} 
                removeCommentReactionMutation={removeCommentReactionMutation} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PostPage;