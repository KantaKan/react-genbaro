import { useQuery } from "react-query";
import { slackApi } from "./api";

/** Whether Slack is connected (any staff may know this). Not connected, or any error, means hide the Slack buttons. */
export function useSlackAvailable(): boolean {
  const q = useQuery(["admin-slack-available"], () => slackApi.available(), { staleTime: 60_000, retry: false });
  return q.data?.connected === true;
}
