import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View, Alert } from "react-native";
import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useSession } from "../../src/providers/session";
import { useTheme } from "../../src/theme";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signInWithOtp, verifyOtp, state, dispatch } = useSession();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(state.self ? true : false);
  const [name, setName] = useState(state.self?.nickname ?? "");
  const [borough, setBorough] = useState(state.self?.borough ?? "");
  const [phoneVerified, setPhoneVerified] = useState(state.self?.phoneVerified ?? false);
  const [showVerify, setShowVerify] = useState(false);
  const [loading, setLoading] = useState(false);

  const completeProfile = () => {
    if (!ageConfirmed) {
      Alert.alert("Age check", "You must be 16 or older to play Crew'd Up.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Display name", "Let the crew know who you are.");
      return;
    }
    dispatch({
      type: "setSelf",
      self: {
        id: state.self?.id ?? `local-${Date.now()}`,
        nickname: name.trim(),
        borough: borough.trim(),
        phoneVerified,
        role: state.self?.role ?? "host",
        isGuest: false,
      },
    });
    dispatch({ type: "setPlayers", players: [] });
    router.replace("/home");
  };

  const requestOtp = async () => {
    setLoading(true);
    try {
      await signInWithOtp(phone);
      Alert.alert("Code sent", "Enter the 6 digit code to verify your host number.");
      setShowVerify(true);
    } catch (error) {
      Alert.alert("Unable to send code", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    setLoading(true);
    try {
      await verifyOtp(phone, code);
      setPhoneVerified(true);
      Alert.alert("Verified", "You're cleared to host games.");
      setShowVerify(false);
    } catch (error) {
      Alert.alert("Verification failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 32, fontWeight: "700", color: colors.text }}>Crew'd Up</Text>
        <Text style={{ color: colors.muted }}>Six minutes, three rounds, zero cringe. Let's crew up.</Text>
      </View>
      <View style={{ gap: 16 }}>
        <Field
          label="Display name"
          value={name}
          onChangeText={setName}
          placeholder="What's your crew call you?"
        />
        <Field label="Borough" value={borough} onChangeText={setBorough} placeholder="Brooklyn" />
        <Button
          label={ageConfirmed ? "Age confirmed" : "I am 16+"}
          onPress={() => setAgeConfirmed(true)}
          variant={ageConfirmed ? "secondary" : "primary"}
        />
        <Button label="Save and continue" onPress={completeProfile} />
      </View>
      <View style={{ marginTop: 24, gap: 12 }}>
        <Text style={{ color: colors.muted, fontWeight: "600" }}>Hosting a party?</Text>
        {!showVerify && (
          <Button
            label={phoneVerified ? "Phone verified" : "Verify phone to host"}
            onPress={() => {
              if (phoneVerified) {
                Alert.alert("All set", "Your phone is already verified to host.");
                return;
              }
              setShowVerify(true);
            }}
            variant="secondary"
          />
        )}
        {(showVerify || !phoneVerified) && (
          <View style={{ gap: 12 }}>
            <Field
              label="Phone"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholder="(917) 555-0123"
            />
            <Button label="Text me a code" onPress={requestOtp} disabled={!phone} loading={loading} />
            <Field
              label="SMS Code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              placeholder="000000"
            />
            <Button label="Verify" onPress={confirmOtp} disabled={!code} loading={loading} />
          </View>
        )}
        <Text style={{ color: colors.muted }}>
          Hosts verify once via SMS. Guests can join instantly with a nickname.
        </Text>
      </View>
    </Screen>
  );
}
