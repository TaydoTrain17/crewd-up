import { ThemeProvider } from "../src/theme";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

export default function RootLayout() {
  useFonts({});

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </ThemeProvider>
  );
}
