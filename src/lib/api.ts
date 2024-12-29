import axios from "axios";
import { WeeklyReflection, User } from "../types";

const api = axios.create({
  baseURL: "http://127.0.0.1:3000/", // Adjust this if your API has a different base URL
});

export const getReflectionsByWeek = async (): Promise<WeeklyReflection[]> => {
  const response = await api.get<WeeklyReflection[]>("/users/reflections/weekly");
  return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");
  return response.data;
};

export const getUsersByBarometer = async (barometer: string): Promise<User[]> => {
  const response = await api.get<User[]>(`/users/barometer/${barometer}`);
  return response.data;
};
