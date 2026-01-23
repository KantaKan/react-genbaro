interface UserData {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_number: number;
  reflections: Reflection[];
  role: string;
  password?: string;
}

interface UserContextType {
  userData: UserData;
  updateUserData: (data: UserData) => void;
  loading: boolean;
  error: string | null;
}
export interface Todo {
  id: string; // This matches the backend JSON response
  userId: string; // This will be the ObjectID as string
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  text: string;
  completed: boolean;
}

export interface UpdateTodoInput {
  text?: string;
  completed?: boolean;
}

export interface TechSession {
  happy: string;
  improve: string;
}

export interface NonTechSession {
  happy: string;
  improve: string;
}

export interface ReflectionData {
  barometer: string;
  tech_sessions: TechSession;
  non_tech_sessions: NonTechSession;
}

export interface Reflection {
  user_id: string;
  date: string;
  reflection: ReflectionData;
}

export type Zone = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic" | "no-data" | "weekend";

export interface Badge {
  _id?: string;
  type: string;
  name: string;
  emoji: string;
  imageUrl?: string;
  color?: string;        // Custom color hex code for badge
  style?: 'pixel' | 'rounded' | 'minimal';  // Badge display style
  awardedAt: string;
}
