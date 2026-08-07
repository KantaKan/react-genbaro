export interface FertilizerLogEntry {
  _id?: string;
  kind: "grant" | "protect" | "feed";
  amount: number;
  relatedDate?: string;
  note?: string;
  grantedBy?: string;
  createdAt: string;
}

export interface FertilizerState {
  fertilizer_balance: number;
  growth_points: number;
  fertilizer_log: FertilizerLogEntry[];
}

export interface FertilizerGrantPayload {
  amount: number;
  note?: string;
}

export interface FertilizerActionResponse {
  success: boolean;
  message: string;
  data: null;
}
