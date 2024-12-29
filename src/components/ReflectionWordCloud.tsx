"use client";

import React from "react";
import ReactWordcloud from "react-wordcloud";

// This is a simplified version. You'll need to process your actual data.
const words = [
  { text: "Go", value: 64 },
  { text: "Collaboration", value: 40 },
  { text: "Error Handling", value: 32 },
];

export function ReflectionWordCloud() {
  return (
    <div style={{ height: "300px", width: "100%" }}>
      <ReactWordcloud words={words} />
    </div>
  );
}
