import { AnalyticsEvents, AnalyticsEventKey } from "@crewdup/shared";
import { useAnalytics } from "../providers/analytics";
import { useSession } from "../providers/session";

export function useEventTracker() {
  const analytics = useAnalytics();
  const { state } = useSession();
  return {
    track: (event: AnalyticsEventKey, props?: Record<string, unknown>) => {
      const role = state.self?.role ?? (state.isPractice ? "host" : "guest");
      analytics.track(AnalyticsEvents[event], { role, ...props });
    },
  };
}
