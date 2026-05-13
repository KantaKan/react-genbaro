import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, Smile, Trash2 } from "lucide-react";

import { BoardReactionPicker } from "@/components/board-reaction-picker";
import { BoardReactionSummary } from "@/components/board-reaction-summary";
import { PageError, PageLoading } from "@/components/page-state";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import { useAuth } from "@/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";
import { addCommentReaction, addReaction, createComment, deleteComment, getPost, removeCommentReaction, removeReaction } from "@/lib/api";
import { getBoardUserPayload, type BoardComment, type BoardPost } from "@/lib/board";

interface MutationOptions {
  onSuccess?: () => void;
}

interface AddReactionMutation {
  mutate: (variables: { postId: string; reaction: string }, options?: MutationOptions) => void;
  isLoading: boolean;
}

interface RemoveReactionMutation {
  mutate: (variables: string, options?: MutationOptions) => void;
  isLoading: boolean;
}

interface AddCommentReactionMutation {
  mutate: (variables: { commentId: string; reaction: string }, options?: MutationOptions) => void;
  isLoading: boolean;
}

interface RemoveCommentReactionMutation {
  mutate: (variables: string, options?: MutationOptions) => void;
  isLoading: boolean;
}

const PostCard: React.FC<{
  post: BoardPost;
  addReactionMutation: AddReactionMutation;
  removeReactionMutation: RemoveReactionMutation;
}> = ({ post, addReactionMutation, removeReactionMutation }) => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const postReactions = post.reactions || [];
  const postComments = post.comments || [];
  const userReaction = postReactions.find((reaction) => reaction.userId === userId);
  const hasUserReacted = !!userReaction;

  const handleReact = (event: React.MouseEvent, reaction: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (hasUserReacted) {
      removeReactionMutation.mutate(post.id, {
        onSuccess: () => {
          addReactionMutation.mutate(
            { postId: post.id, reaction },
            {
              onSuccess: () => {
                queryClient.invalidateQueries(["talkBoardPost", post.id]);
              },
            },
          );
        },
      });
    } else {
      addReactionMutation.mutate(
        { postId: post.id, reaction },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(["talkBoardPost", post.id]);
          },
        },
      );
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeReactionMutation.mutate(post.id, {
      onSuccess: () => {
        queryClient.invalidateQueries(["talkBoardPost", post.id]);
      },
    });
    setShowReactionPicker(false);
  };

  const toggleReactionPicker = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowReactionPicker((isOpen) => !isOpen);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar userId={post.userId} name={post.zoomName} />
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
            <BoardReactionPicker
              currentReaction={userReaction?.value}
              hasReaction={hasUserReacted}
              onReact={handleReact}
              onRemove={handleRemoveReaction}
              className="absolute bottom-10 flex gap-2 bg-card p-2 rounded-lg border"
              reactionClassName="text-2xl hover:scale-125 transition-transform"
              removeClassName="text-2xl hover:scale-125 transition-transform p-1 bg-red-100 hover:bg-red-200 rounded-full"
            />
          )}
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Comment ({postComments.length})
          </Button>
        </div>
        <BoardReactionSummary reactions={postReactions} className="flex items-center gap-2" itemClassName="flex items-center gap-1" />
      </CardFooter>
    </Card>
  );
};

const CommentCard: React.FC<{
  comment: BoardComment;
  addCommentReactionMutation: AddCommentReactionMutation;
  removeCommentReactionMutation: RemoveCommentReactionMutation;
  isAdmin: boolean;
  onDeleteClick: (commentId: string) => void;
}> = ({ comment, addCommentReactionMutation, removeCommentReactionMutation, isAdmin, onDeleteClick }) => {
  const { userId } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const commentReactions = comment.reactions || [];
  const userReaction = commentReactions.find((reaction) => reaction.userId === userId);
  const hasUserReacted = !!userReaction;

  const handleReact = (event: React.MouseEvent, reaction: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (hasUserReacted) {
      removeCommentReactionMutation.mutate(comment.id, {
        onSuccess: () => {
          addCommentReactionMutation.mutate({ commentId: comment.id, reaction });
        },
      });
    } else {
      addCommentReactionMutation.mutate({ commentId: comment.id, reaction });
    }
    setShowReactionPicker(false);
  };

  const handleRemoveReaction = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    removeCommentReactionMutation.mutate(comment.id);
    setShowReactionPicker(false);
  };

  const toggleReactionPicker = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowReactionPicker((isOpen) => !isOpen);
  };

  return (
    <Card className="ml-12">
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar userId={comment.userId} name={comment.zoomName} />
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
            <BoardReactionPicker
              currentReaction={userReaction?.value}
              hasReaction={hasUserReacted}
              onReact={handleReact}
              onRemove={handleRemoveReaction}
              className="absolute bottom-10 flex gap-2 bg-card p-2 rounded-lg border"
              reactionClassName="text-2xl hover:scale-125 transition-transform"
              removeClassName="text-2xl hover:scale-125 transition-transform p-1 bg-red-100 hover:bg-red-200 rounded-full"
            />
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDeleteClick(comment.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <BoardReactionSummary reactions={commentReactions} className="flex items-center gap-2" itemClassName="flex items-center gap-1" />
      </CardFooter>
    </Card>
  );
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const { userData } = useUserData();
  const { isAdmin } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: post, isLoading, error } = useQuery(["talkBoardPost", postId], () => getPost(postId!), { enabled: !!postId });

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

  const deleteCommentMutation = useMutation(
    (commentId: string) => deleteComment(postId!, commentId), 
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["talkBoardPost", postId]);
        toast.success("Comment deleted successfully");
        setDeleteCommentId(null);
      },
      onError: () => {
        toast.error("Failed to delete comment");
        setIsDeleting(false);
      },
    }
  );

  const handleDeleteComment = () => {
    if (!deleteCommentId) return;
    setIsDeleting(true);
    deleteCommentMutation.mutate(deleteCommentId);
  };

  const handleAddComment = () => {
    if (newComment.trim() && postId && userData) {
      const { zoomName, cohort } = getBoardUserPayload(userData);
      createCommentMutation.mutate({
        postId,
        content: newComment,
        zoomName,
        cohort,
      });
    }
  };

  if (isLoading) {
    return <PageLoading label="Loading post..." />;
  }

  if (error || !post) {
    return <PageError title="Error loading post." />;
  }

  return (
    <div className="container mx-auto py-10">
      <PostCard post={post} addReactionMutation={addReactionMutation} removeReactionMutation={removeReactionMutation} />

      <h2 className="text-2xl font-bold mt-8 mb-4">Comments</h2>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add a comment</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
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
          {post.comments?.map((comment) => (
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
                isAdmin={isAdmin}
                onDeleteClick={setDeleteCommentId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PostPage;
