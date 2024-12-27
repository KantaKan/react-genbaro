import React from "react";

interface BaroCardProps {
  name: string;
  picture: string;
  feels: string;
}

const BaroCard: React.FC<BaroCardProps> = ({ name, picture, feels }) => {
  return (
    <div className="relative w-[500px] h-[200px] bg-white overflow-hidden mb-4 group cursor-pointer">
      {/* Grayscale cover image with hover effect */}
      <div className="w-[400px] h-[200px] bg-cover bg-center transition-all duration-300 group-hover:filter-none filter grayscale" style={{ backgroundImage: `url(${picture})` }}></div>

      <h2 className="absolute bottom-0 right-[130px] text-white text-5xl font-bold">{name}</h2>

      <p className="absolute top-[20px] right-[70px] text-gray-600 opacity-70 text-xl tracking-wide">{feels}</p>

      {/* Circle button with animation on hover */}
      <button className="absolute right-[14px] bottom-[14px] w-[30px] h-[30px] bg-[#DA4D1D] rounded-full cursor-pointer transition-all duration-300 transform scale-100 group-hover:scale-[16.5]">
        <i className="text-3xl text-white fas fa-plus"></i>
      </button>
    </div>
  );
};

export default BaroCard;
