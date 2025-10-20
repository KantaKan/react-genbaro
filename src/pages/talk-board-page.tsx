import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Smile } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/AuthContext";

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

const fetchPosts = async (): Promise<Post[]> => {
  const response = await api.get("/board/posts");
  return response.data.data;
};

const createPost = async (content: string) => {
  const response = await api.post("/board/posts", { content });
  return response.data.data;
};

const addReaction = async ({ postId, reaction }: { postId: string; reaction: string }) => {
  const response = await api.post(`/board/posts/${postId}/reactions`, { reaction });
  return response.data.data;
};

const TalkBoardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");

  const { data: posts, isLoading, error } = useQuery("talkBoardPosts", fetchPosts);

  const createPostMutation = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries("talkBoardPosts");
      setNewPostContent("");
    },
  });

  const addReactionMutation = useMutation(addReaction, {
    onSuccess: () => {
      queryClient.invalidateQueries("talkBoardPosts");
    },
  });

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      createPostMutation.mutate(newPostContent);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading posts.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Talk Board</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create a new post</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind?"
            className="mb-4"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreatePost} disabled={createPostMutation.isLoading}>
            {createPostMutation.isLoading ? "Posting..." : "Post"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <AnimatePresence>
          {posts?.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <PostCard post={post} addReactionMutation={addReactionMutation} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: Post; addReactionMutation: any }> = ({ post, addReactionMutation }) => {
  const { userId } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const hasUserReacted = post.reactions.some(reaction => reaction.userId === userId);

  const handleReact = (e: React.MouseEvent, reaction: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasUserReacted) {
      addReactionMutation.mutate({ postId: post.id, reaction });
      setShowReactionPicker(false);
    }
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
  ];

  const reactionMap: { [key: string]: string } = {
    "peepolike": "/reaction/peepoLIKE-2x.webp",
    "pepelaugh": "/reaction/PepeLaugh-2x.webp",
    "sadge": "/reaction/Sadge-2x.png",
  };


  return (
    <Link to={`/talk-board/${post.id}`} className="block">
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
          <p>{post.content}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-4 relative">
            <Button variant="ghost" size="sm" onClick={toggleReactionPicker} disabled={hasUserReacted}>
              <Smile className="mr-2 h-4 w-4" />
              React
            </Button>
            {showReactionPicker && (
              <div className="absolute bottom-10 flex gap-2 bg-card p-2 rounded-lg border">
                {reactions.map((r) => (
                  <button
                    key={r.name}
                    onClick={(e) => handleReact(e, r.name)}
                    className="text-2xl hover:scale-125 transition-transform"
                    disabled={hasUserReacted}
                  >
                    <img src={r.url} alt={r.name} className="w-8 h-8" />
                  </button>
                ))}
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
    </Link>
  );
};

export default TalkBoardPage;