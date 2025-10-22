import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { init, logEvent, setUserId } from "@amplitude/analytics-react-native";
import Constants from "expo-constants";
import * as Sentry from "sentry-expo";

const AnalyticsContext = createContext<{
  track: (event: string, props?: Record<string, unknown>) => void;
  identify: (userId: string) => void;
}>({
  track: () => undefined,
  identify: () => undefined,
});

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const clientRef = useRef<boolean>(false);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    const key = Constants.expoConfig?.extra?.AMPLITUDE_API_KEY ?? process.env.AMPLITUDE_API_KEY;
    if (!clientRef.current && key) {
      init(key, undefined, {
        trackingOptions: {
          carrier: false,
        },
      });
      clientRef.current = true;
      setReady(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      track: (event: string, props?: Record<string, unknown>) => {
        if (clientRef.current && isReady) {
          logEvent(event, props ?? {});
        }
        Sentry.Native.addBreadcrumb({ category: "analytics", message: event, data: props });
      },
      identify: (userId: string) => {
        if (clientRef.current && isReady) {
          setUserId(userId);
        }
      },
    }),
    [isReady],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

export const useAnalytics = () => useContext(AnalyticsContext);
