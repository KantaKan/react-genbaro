import { useQuery } from "react-query";
import { cupApi } from "./api";

/** Last week's Cup winners wear the gold frame this week. */
export function useCup() {
  return useQuery(["my-cup"], cupApi.me, { staleTime: 60_000, retry: false });
}

export function useChampion() {
  const { data } = useCup();
  const group = data?.champion_group ?? "";
  return { championGroup: group, isChampion: (g?: string) => !!group && g === group, medals: data?.my_medals ?? [] };
}
