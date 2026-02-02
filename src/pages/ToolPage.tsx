import React from "react";
import spinWheel from "@/assets/spin.jpg";
import { useNavigate } from "react-router-dom";

const ToolsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <div className="rounded-lg p-[2px] bg-gradient-to-r from-purple-300 to-purple-500 bg-[length:200%_100%] animate-rainbow-shimmer w-full">
        <h1 className="text-2xl font-bold text-white p-4 rounded-[6px] bg-background">
          Tools
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/tools/spin-wheel")}
          className="rounded-lg p-[2px] bg-gradient-to-r from-purple-300 to-purple-500 bg-[length:200%_100%] animate-rainbow-shimmer transition-transform duration-500 hover:scale-105 cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center gap-4 bg-background p-4 rounded-[6px]">
            <div className="text-2xl font-bold">Spin Wheel</div>
            <img
              src={spinWheel}
              alt="Spin Wheel"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
