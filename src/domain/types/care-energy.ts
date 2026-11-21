export interface CareEnergyLogEntry {
  _id?: string;
  kind: "grant" | "protect" | "feed" | "gift" | "gifted" | "rescue" | "character-care";
  amount: number;
  relatedDate?: string;
  note?: string;
  grantedBy?: string;
  createdAt: string;
}

export interface CareEnergyAccountFields {
  care_energy_balance: number;
  growth_points: number;
  care_energy_log: CareEnergyLogEntry[];
}

export interface CareEnergyGrantPayload {
  amount: number;
  note?: string;
}

export interface CareEnergyActionResponse {
  success: boolean;
  message: string;
  data: null;
}
