import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  width?: string;
  height?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className, width = "100%", height = "20px" }) => {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} style={{ width, height }} />;
};

export default SkeletonLoader;
