"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useUserData } from "../UserDataContext";

interface Todo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const { userData } = useUserData();
  const userId = userData?._id;

  useEffect(() => {
    if (userId) {
      fetchTodos();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchTodos = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/${userId}/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error("Error fetching todos:", error);
      toast({
        title: "Error",
        description: "Failed to fetch todos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async () => {
    if (!userId || newTodo.trim() === "") return;

    try {
      setActionInProgress("add");
      const response = await api.post(`/${userId}/todos`, {
        text: newTodo.trim(),
        completed: false,
      });

      setTodos((prevTodos) => [...prevTodos, response.data]);
      setNewTodo("");
      toast({
        title: "Success",
        description: "Todo added successfully",
      });
    } catch (error) {
      console.error("Error adding todo:", error);
      toast({
        title: "Error",
        description: "Failed to add todo",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const toggleTodo = async (todoId: string) => {
    if (!userId) return;

    try {
      setActionInProgress(todoId);
      const todo = todos.find((t) => t.id === todoId);
      if (!todo) return;

      const response = await api.put(`/${userId}/todos/${todoId}`, {
        completed: !todo.completed,
      });

      setTodos((prevTodos) => prevTodos.map((t) => (t.id === todoId ? response.data : t)));
    } catch (error) {
      console.error("Error updating todo:", error);
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const removeTodo = async (todoId: string) => {
    if (!userId) return;

    try {
      setActionInProgress(todoId);
      await api.delete(`/${userId}/todos/${todoId}`);
      setTodos((prevTodos) => prevTodos.filter((t) => t.id !== todoId));
      toast({
        title: "Success",
        description: "Todo deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (!userData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Please log in to manage your todos.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input type="text" placeholder="Add a new todo" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTodo()} />
          <Button onClick={addTodo} disabled={actionInProgress === "add" || !newTodo.trim()}>
            {actionInProgress === "add" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center text-gray-500">No todos yet. Add one above!</div>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li key={todo.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <Checkbox id={`todo-${todo.id}`} checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} disabled={actionInProgress === todo.id} />
                  <label htmlFor={`todo-${todo.id}`} className={`${todo.completed ? "line-through text-gray-500" : ""}`}>
                    {todo.text}
                  </label>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeTodo(todo.id)} disabled={actionInProgress === todo.id}>
                  {actionInProgress === todo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
