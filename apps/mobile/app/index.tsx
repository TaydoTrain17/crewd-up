import { Redirect } from "expo-router";
import { useSession } from "../src/providers/session";

export default function Index() {
  const { state } = useSession();
  if (!state.self) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/home" />;
}
