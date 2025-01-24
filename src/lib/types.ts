interface Reflection {
  day: string;
  user_id: string;
  date: string;
  reflection: Record<string, any>;
}

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
