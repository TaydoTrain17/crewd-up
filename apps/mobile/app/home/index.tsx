import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/providers/session";
import { useEventTracker } from "../../src/lib/analytics";
import { useTheme } from "../../src/theme";

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { state, dispatch, guestJoin } = useSession();
  const { track } = useEventTracker();
  const [joinCode, setJoinCode] = useState((state.deepLinkCode as string) ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.deepLinkCode) {
      setJoinCode(String(state.deepLinkCode).toUpperCase());
      track("joinOpened", { code: state.deepLinkCode });
    }
  }, [state.deepLinkCode, track]);

  const createRoom = () => {
    if (!state.self?.phoneVerified) {
      Alert.alert(
        "Verify to host",
        "Only verified hosts can start a room. Complete SMS verification first.",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Verify now",
            onPress: () => router.push("/onboarding"),
          },
        ],
      );
      return;
    }
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    dispatch({ type: "setPractice", isPractice: false });
    dispatch({ type: "setRoom", roomId: `local-${code}`, roomCode: code });
    dispatch({
      type: "setPlayers",
      players: [
        {
          id: state.self?.id ?? `host-${code}`,
          nickname: state.self?.nickname ?? "Host",
          connected: true,
          isHost: true,
          role: "host",
        },
      ],
    });
    track("createRoom", { code });
    router.push({ pathname: "/lobby", params: { code } });
  };

  const joinRoom = async () => {
    if (!joinCode) return;
    setLoading(true);
    try {
      await guestJoin(joinCode.toUpperCase(), state.self?.nickname ?? "Guest");
      track("joinRoom", { code: joinCode.toUpperCase() });
      router.push({ pathname: "/lobby", params: { code: joinCode.toUpperCase() } });
    } catch (error) {
      Alert.alert("Join failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const startPractice = () => {
    const code = `PRAC${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    dispatch({ type: "setPractice", isPractice: true });
    dispatch({ type: "setRoom", roomId: `practice-${code}`, roomCode: code });
    dispatch({
      type: "setPlayers",
      players: [
        {
          id: state.self?.id ?? `practice-${Date.now()}`,
          nickname: state.self?.nickname ?? "You",
          connected: true,
          isHost: true,
          role: "host",
        },
        {
          id: "bot-benny",
          nickname: "Bot Benny",
          connected: true,
          role: "player",
        },
        {
          id: "bot-casey",
          nickname: "Bot Casey",
          connected: true,
          role: "player",
        },
      ],
    });
    track("practiceStarted", { practice: true });
    router.push({ pathname: "/lobby", params: { code, practice: "1" } });
  };

  const copyInvite = async () => {
    if (!state.roomCode) return;
    await Clipboard.setStringAsync(`crewdup://join?code=${state.roomCode}`);
    Alert.alert("Invite copied", "Share it with your crew");
  };

  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>
          Hey {state.self?.nickname ?? "friend"}
        </Text>
        <Text style={{ color: colors.muted }}>
          Start a room anytime, run a solo practice, or jump in with a crew code.
        </Text>
      </View>
      <Button label="Create Room" onPress={createRoom} />
      <Button label="Practice Mode" onPress={startPractice} variant="secondary" />
      <View style={{ gap: 12 }}>
        <Field
          label="Join code"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          placeholder="ABC123"
        />
        <Button label="Join Room" onPress={joinRoom} disabled={!joinCode} loading={loading} />
      </View>
      {state.roomCode && (
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.muted }}>Current Room</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{state.roomCode}</Text>
          <Button label="Copy Invite Link" onPress={copyInvite} variant="secondary" />
        </View>
      )}
    </Screen>
  );
}
