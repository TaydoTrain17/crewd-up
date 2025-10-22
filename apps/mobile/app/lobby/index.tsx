import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, FlatList } from "react-native";
import { Button } from "../../src/components/Button";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/providers/session";
import { useEventTracker } from "../../src/lib/analytics";
import { useTheme } from "../../src/theme";

const STANDARD_MIN_PLAYERS = 3;
const COUNTDOWN_SECONDS = 90;

export default function LobbyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const code = typeof params.code === "string" ? params.code : "";
  const { state, dispatch } = useSession();
  const { track } = useEventTracker();
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minPlayers = state.isPractice ? 1 : STANDARD_MIN_PLAYERS;
  const canStart = state.players.filter((p) => p.connected).length >= minPlayers;

  const startGame = () => {
    dispatch({
      type: "setRound",
      round: {
        index: 0,
        type: "hot_take",
        prompt: "NYC bodegas should charge for bathroom access.",
        status: "active",
        timer: 60,
        votes: {},
      },
    });
    dispatch({ type: "setPlayers", players: state.players });
    track("sessionStarted", { code, practice: state.isPractice ?? false });
    router.push("/game/round");
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted }}>ROOM CODE</Text>
        <Text style={{ color: colors.text, fontSize: 36, fontWeight: "700", letterSpacing: 4 }}>{code}</Text>
        <Text style={{ color: colors.muted }}>
          Starts when {minPlayers} {minPlayers === 1 ? "player is" : "players are"} ready. Auto-start in {timeLeft}s.
        </Text>
        {state.isPractice && (
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Practice Mode adds two playful bots so you can rehearse the flow solo.
          </Text>
        )}
      </View>
      <FlatList
        data={state.players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surface,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "600" }}>{item.nickname}</Text>
            <Text style={{ color: item.connected ? colors.primary : colors.muted }}>
              {item.connected ? "Ready" : "Reconnecting"}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
      <Button label="Start Session" onPress={startGame} disabled={!canStart} />
    </Screen>
  );
}
