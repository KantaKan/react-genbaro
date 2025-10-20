import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Smile } from "lucide-react";

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

const fetchPost = async (postId: string): Promise<Post> => {
  const response = await api.get(`/board/posts/${postId}`);
  return response.data.data;
};

const createComment = async ({ postId, content }: { postId: string; content: string }) => {
  const response = await api.post(`/board/posts/${postId}/comments`, { content });
  return response.data.data;
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: post, isLoading, error } = useQuery(["talkBoardPost", postId], () => fetchPost(postId!), {
    enabled: !!postId,
  });

  const createCommentMutation = useMutation(createComment, {
    onSuccess: () => {
      queryClient.invalidateQueries(["talkBoardPost", postId]);
      setNewComment("");
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
      <PostCard post={post} />

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
              <CommentCard comment={comment} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const reactionMap: { [key: string]: string } = {
    "peepolike": "/reaction/peepoLIKE-2x.webp",
    "pepelaugh": "/reaction/PepeLaugh-2x.webp",
    "sadge": "/reaction/Sadge-2x.png",
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
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">
            <Smile className="mr-2 h-4 w-4" />
            React
          </Button>
        </div>
        <div>
          {post.reactions.length > 0 && (
            <div className="flex items-center gap-2">
              {post.reactions.map((r) => (
                reactionMap[r.value] ? (
                  <img key={r.id} src={reactionMap[r.value]} alt={r.value} className="w-5 h-5" />
                ) : (
                  <span key={r.id}>{r.value}</span>
                )
              ))}
              <span className="text-sm text-muted-foreground">{post.reactions.length}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => {
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
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">
            <Smile className="mr-2 h-4 w-4" />
            React
          </Button>
        </div>
        <div>
          {/* Reactions will be displayed here */}
        </div>
      </CardFooter>
    </Card>
  );
};

export default PostPage;