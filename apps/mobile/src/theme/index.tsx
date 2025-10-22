import { ReactNode, createContext, useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from "../providers/analytics";
import { SessionProvider } from "../providers/session";

const colors = {
  background: "#0F1115",
  surface: "#181B21",
  primary: "#F97316",
  text: "#F5F5F5",
  muted: "#9CA3AF",
  danger: "#EF4444"
};

type Theme = {
  colors: typeof colors;
};

const ThemeContext = createContext<Theme>({ colors });
const queryClient = new QueryClient();

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ colors }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>
            <SessionProvider>
              <StatusBar style="light" />
              {children}
            </SessionProvider>
          </AnalyticsProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
