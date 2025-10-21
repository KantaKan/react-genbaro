export const dayColors = {
  "Sunday": "bg-red-500 text-white",
  "Monday": "bg-blue-500 text-white",
  "Tuesday": "bg-green-500 text-white",
  "Wednesday": "bg-purple-500 text-white",
  "Thursday": "bg-orange-500 text-white",
  "Friday": "bg-teal-500 text-white",
  "Saturday": "bg-pink-500 text-white",
};

export const getDayBadge = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { dayName: "Invalid Date", colorClass: "bg-gray-500 text-white" };
  }
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }); // Full day name
  const colorClass = dayColors[dayName as keyof typeof dayColors] || "bg-gray-500 text-white"; // Default to gray if not found
  return { dayName, colorClass };
};
