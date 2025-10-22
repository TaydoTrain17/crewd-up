import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/providers/session";
import { useTheme } from "../../src/theme";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useSession();
  const [status, setStatus] = useState<string>("Notifications off");

  const enableNotifications = async () => {
    const perms = await Notifications.requestPermissionsAsync();
    setStatus(perms.status === "granted" ? "Notifications on" : "Notifications off");
  };

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>Settings</Text>
        <Button label="Enable notifications" onPress={enableNotifications} />
        <Text style={{ color: colors.muted }}>{status}</Text>
        <Button label="Terms" onPress={() => Linking.openURL("https://crewdup.example.com/terms") } variant="secondary" />
        <Button
          label="Privacy"
          onPress={() => Linking.openURL("https://crewdup.example.com/privacy") }
          variant="secondary"
        />
        <Button label="Manage Block List" onPress={() => dispatch({ type: "setPlayers", players: [] })} variant="secondary" />
        <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surface, gap: 8 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Practice recaps</Text>
          <Text style={{ color: colors.muted }}>
            {state.preferences.savePracticeRecaps
              ? "Practice Mode recaps will save alongside regular sessions."
              : "Skip saving Practice Mode recaps to your camera roll."}
          </Text>
          <Button
            label={state.preferences.savePracticeRecaps ? "Disable practice saves" : "Save practice recaps"}
            onPress={() => dispatch({ type: "togglePracticeRecaps" })}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
}
