import { api } from "../../infrastructure/api";
import type { Badge, BadgeAwardPayload, AwardBadgeResponse } from "../../domain/types";

export const badgeService = {
  async awardBadge(userId: string, badgeData: BadgeAwardPayload): Promise<Badge> {
    const response = await api.post<AwardBadgeResponse>(
      `/admin/users/${userId}/badges`,
      badgeData
    );
    return response.data.data;
  },
};

export const awardBadge = badgeService.awardBadge;

export default badgeService;
