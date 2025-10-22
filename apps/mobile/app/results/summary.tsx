import { Share, View, Text, Image } from "react-native";
import { Screen } from "../../src/components/Screen";
import { Button } from "../../src/components/Button";
import { useSession } from "../../src/providers/session";
import { useEventTracker } from "../../src/lib/analytics";
import { useTheme } from "../../src/theme";

export default function SummaryScreen() {
  const { state, dispatch } = useSession();
  const { track } = useEventTracker();
  const { colors } = useTheme();

  const shareRecap = async () => {
    if (!state.recapUrl) return;
    track("shareTapped", { practice: state.isPractice ?? false });
    await Share.share({ url: state.recapUrl, message: "Crew'd Up recap" });
    track("shareCompleted", { practice: state.isPractice ?? false });
    if (state.isPractice) {
      dispatch({ type: "resetSession" });
    }
  };

  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.muted }}>WINNER</Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>{state.players[0]?.nickname ?? "You"}</Text>
        <Text style={{ color: colors.muted }}>Highlights are ready. Send the recap card to the crew.</Text>
      </View>
      {state.recapUrl && (
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: state.recapUrl }}
            style={{ width: "100%", height: 240, borderRadius: 16, backgroundColor: colors.surface }}
          />
          {state.isPractice && (
            <View
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                backgroundColor: colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "700" }}>PRACTICE</Text>
            </View>
          )}
        </View>
      )}
      {state.isPractice && !state.preferences.savePracticeRecaps && (
        <Text style={{ color: colors.muted }}>
          Practice Mode recaps won't be saved to your camera roll unless you enable it in Settings.
        </Text>
      )}
      <Button label="Share Recap" onPress={shareRecap} />
    </Screen>
  );
}
