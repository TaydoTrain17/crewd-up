import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { Button } from "../../src/components/Button";
import { Screen } from "../../src/components/Screen";
import { quickFilter } from "../../src/lib/moderation";
import { useEventTracker } from "../../src/lib/analytics";
import { useSession } from "../../src/providers/session";
import { useTheme } from "../../src/theme";

const ROUND_TIMERS = [90, 120, 150];

function getPrompt(type: string, index: number) {
  switch (type) {
    case "hot_take":
      return "Subway performers deserve a cover charge.";
    case "callout":
      return "Who is most likely to talk their way into a rooftop party?";
    case "dare":
    default:
      return "Drop your spiciest (but safe) one-liner about tonight.";
  }
}

export default function RoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { state, dispatch } = useSession();
  const { track } = useEventTracker();
  const [response, setResponse] = useState("");
  const currentRound = state.currentRound ?? 0;
  const round = state.rounds[currentRound];

  useEffect(() => {
    if (!round) return;
    const interval = setInterval(() => {
      const next = Math.max((round.timer ?? ROUND_TIMERS[currentRound]) - 1, 0);
      dispatch({ type: "updateTimer", roundIndex: currentRound, timer: next });
    }, 1000);
    return () => clearInterval(interval);
  }, [round, currentRound, dispatch]);

  const nextRound = () => {
    track("roundCompleted", { round: currentRound, practice: state.isPractice ?? false });
    if (currentRound >= 2) {
      router.replace("/results/summary");
      dispatch({ type: "setRecap", recapUrl: "https://supabase.local/recap.png" });
      track("sessionEnded", { practice: state.isPractice ?? false });
      if (state.isPractice) {
        track("practiceEnded", { practice: true });
      }
      return;
    }
    const nextIndex = currentRound + 1;
    const type = nextIndex === 1 ? "callout" : "dare";
    dispatch({
      type: "setRound",
      round: {
        index: nextIndex,
        type,
        prompt: getPrompt(type, nextIndex),
        status: "active",
        timer: ROUND_TIMERS[nextIndex],
        votes: {},
      },
    });
  };

  const submitResponse = () => {
    const sample = quickFilter(response);
    if (!sample.allowed) {
      Alert.alert("Try again", "That answer might be too spicy. Give it another shot.");
      return;
    }
    Alert.alert("Response submitted", "Waiting for crew...");
    setResponse("");
    nextRound();
  };

  const content = useMemo(() => {
    if (!round) return null;
    return (
      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.muted }}>ROUND {round.index + 1} / 3</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{round.prompt}</Text>
          <Text style={{ color: colors.muted }}>Time left: {round.timer ?? ROUND_TIMERS[currentRound]}s</Text>
        </View>
        {round.type === "hot_take" && (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button label="🔥 Yes" onPress={submitResponse} />
            <Button label="❄️ Nah" onPress={submitResponse} />
          </View>
        )}
        {round.type === "callout" && (
          <View style={{ gap: 8 }}>
            {state.players.map((player) => (
              <Button key={player.id} label={player.nickname} onPress={submitResponse} />
            ))}
          </View>
        )}
        {round.type === "dare" && (
          <View style={{ gap: 12 }}>
            <TextInput
              value={response}
              onChangeText={setResponse}
              placeholder="Keep it safe, keep it funny"
              placeholderTextColor={colors.muted}
              style={{ backgroundColor: colors.surface, color: colors.text, padding: 16, borderRadius: 12 }}
            />
            <Button label="Submit" onPress={submitResponse} disabled={!response} />
          </View>
        )}
      </View>
    );
  }, [round, colors, currentRound, state.players]);

  return <Screen>{content}</Screen>;
}
