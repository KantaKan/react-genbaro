import type { UserRole } from "./auth";
import type { Badge } from "./badge";

export type { Badge };

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_number: number;
  jsd_number?: string;
  role: UserRole;
  project_group?: string;
  genmate_group?: string;
  zoom_name?: string;
  reflections?: Reflection[];
  badges?: Badge[];
  salesforce_id?: string;
  profile_comments?: ProfileComment[];
  profile_reactions?: ProfileReaction[];
  bio?: string;
  social_links?: SocialLinks;
  pinned_badge_ids?: string[];
}

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  github?: string;
}

export interface ProfileReaction {
  id: string;
  userId: string;
  type: string;
  value: string;
  createdAt: string;
}

export interface ProfileComment {
  id: string;
  _id?: string;
  userId: string;
  zoomName: string;
  cohort: number;
  content: string;
  reactions?: ProfileReaction[];
  replies?: ProfileComment[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserData extends User {
  reflections: Reflection[];
  badges?: Badge[];
}

export interface UserContextType {
  userData: UserData;
  updateUserData: (data: UserData) => void;
  loading: boolean;
  error: string | null;
}

export interface GetAllUsersResponse {
  status: string;
  message: string;
  data: {
    limit: number;
    page: number;
    total: number;
    users: User[];
  };
}

export interface JWTPayload {
  user_id: string;
  cohort?: number;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface UserDataContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refetchUserData: () => Promise<void>;
  userId: string;
  clearUserData: () => void;
}

export interface Reflection {
  _id?: string;
  user_id: string;
  date: string;
  day?: string;
  createdAt?: string;
  reflection: ReflectionData;
}

export interface ReflectionData {
  barometer: string;
  tech_sessions: TechSession;
  non_tech_sessions: NonTechSession;
}

export interface TechSession {
  session_name?: string[];
  happy: string;
  improve: string;
}

export interface NonTechSession {
  session_name?: string[];
  happy: string;
  improve: string;
}

export interface CreateReflectionPayload {
  barometer: string;
  tech_sessions: {
    happy: string;
    improve: string;
  };
  non_tech_sessions: {
    happy: string;
    improve: string;
  };
}
