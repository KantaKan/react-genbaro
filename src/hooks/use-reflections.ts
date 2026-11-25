"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import type { Reflection, ReflectionData, TechSession, NonTechSession } from "@/domain/types/user";

export type { Reflection, ReflectionData, TechSession, NonTechSession };

// Add this interface to match the API response structure
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface StreakData {
  currentStreak: number;
  oldStreak: number;
  bestStreak: number;
  lastActiveDate: Date | null;
  hasCurrentStreak: boolean;
  eligibleProtectDate: string | null;
}

const ALREADY_TODAY = "You have already submitted a reflection today. Please try again tomorrow.";

export function useReflections(userId?: string, initialReflections: Reflection[] = []) {
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalReflections, setOriginalReflections] = useState<Reflection[]>([]);

  // Update reflections when initialReflections changes
  useEffect(() => {
    if (initialReflections.length > 0) {
      setReflections(initialReflections);
    }
  }, [initialReflections]);

  const fetchReflections = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ApiResponse<Reflection[]>>(`users/${userId}/reflections`);
      setReflections(response.data.data || []); // Correctly access the nested data array
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : "Failed to fetch reflections");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addReflection = useCallback(
    async (newReflection: Reflection) => {
      setIsLoading(true);

      try {
        // Check if user already has a reflection for today before making the request
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        const existingReflection = reflections.find((r) => {
          const reflectionDate = new Date(r.day || r.date);
          reflectionDate.setHours(0, 0, 0, 0);
          return reflectionDate.getTime() === today.getTime();
        });

        if (existingReflection) {
          throw new Error(ALREADY_TODAY);
        }

        // Optimistic update
        const optimisticReflection = {
          ...newReflection,
          _id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          day: todayString,
        };
        setReflections((prev) => [optimisticReflection, ...prev]);

        const response = await api.post<ApiResponse<Reflection>>(`users/${newReflection.user_id}/reflections`, newReflection);

        // Replace optimistic update with real data
        setReflections((prev) => prev.map((r) => (r._id === optimisticReflection._id ? response.data.data : r)));

        // The form shows the success message; showing it here too made two toasts.
        return response.data.data;
      } catch (err) {
        // Revert optimistic update
        setReflections((prev) => prev.filter((r) => !r._id?.startsWith("temp-")));

        // Throw one readable message; the form shows it (once).
        if (err instanceof AxiosError) {
          if (err.response?.status === 409) throw new Error(ALREADY_TODAY);
          const msg = (err.response?.data as { message?: string } | undefined)?.message;
          throw new Error(msg || "Failed to submit reflection. Please try again later.");
        }
        throw err instanceof Error ? err : new Error("Failed to submit reflection. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    },
    [reflections]
  );

  const deleteReflection = useCallback(
    async (reflectionId: string) => {
      setIsLoading(true);

      try {
        // Optimistic update
        setOriginalReflections(reflections);
        setReflections((prev) => prev.filter((r) => r._id !== reflectionId));

        await api.delete<ApiResponse<unknown>>(`reflections/${reflectionId}`);
        toast.success("Reflection deleted successfully!");
      } catch (err) {
        // Revert optimistic update
        setReflections(originalReflections);
        toast.error(err instanceof AxiosError ? err.message : "Failed to delete reflection. Please try again.");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [reflections, originalReflections]
  );

  return {
    reflections,
    isLoading,
    error,
    addReflection,
    deleteReflection,
    refetch: fetchReflections,
  };
}
