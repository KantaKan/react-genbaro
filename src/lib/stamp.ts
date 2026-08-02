export interface Stamp {
  id: string;
  ownerId: string;
  cohortNumber: number;
  imageUrl: string;
  createdAt: string;
}

export interface Cohort {
  cohortNumber: number;
  name?: string;
  startDate?: string;
  lockAt: string;
  isLocked: boolean;
  posterUrl?: string;
  createdAt: string;
}
