import React, { useState } from "react";
import BaroCard from "./BaroCard";

const CardContainer: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const cards = [
    {
      name: "North",
      picture: "https://images.unsplash.com/photo-1525543907410-b2562b6796d6?ixlib=rb-0.3.5&s=9ff8e5e718a6a40cbd0e1471235912f4&auto=format&fit=crop&w=3452&q=80",
    },
    {
      name: "Happy",
      picture: "https://wallpapers.com/images/featured/happy-background-z5lxug4hkrnxr2xh.jpg",
    },
    {
      name: "East",
      picture: "https://images.unsplash.com/photo-1534330173596-c5b36d0ab515?crop=entropy&cs=tinysrgb&fit=max&ixid=MnwzNjAzOXwwfDF8c2VhY2h8Nnx8fGJlYWNoZXxlbnwwfHx8fDE2NzQxMTY0NzE&ixlib=rb-1.2.1&q=80&w=400",
    },
    {
      name: "South",
      picture: "https://images.unsplash.com/photo-1527000898709-383410f8b1a4?crop=entropy&cs=tinysrgb&fit=max&ixid=MXwzNjAzOXwwfDF8c2VhY2h8M3x8fGJlYWNoZXxlbnwwfHx8fDE2NzQxMTY1MzM&ixlib=rb-1.2.1&q=80&w=400",
    },
  ];

  const handleCardClick = (index: number) => {
    setSelectedCard(index === selectedCard ? null : index); // Toggle the selected card
  };

  return (
    <div className="flex flex-col justify-center items-center space-y-4">
      {cards.map((card, index) => (
        <BaroCard key={index} name={card.name} picture={card.picture} isSelected={selectedCard === index} onClick={() => handleCardClick(index)} />
      ))}
    </div>
  );
};

export default CardContainer;
