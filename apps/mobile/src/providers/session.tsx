import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { createClient, SupabaseClient } from "supabase-js";
import { AnalyticsEvents } from "@crewdup/shared";
import Constants from "expo-constants";
import { useAnalytics } from "./analytics";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { useSupabaseRealtime } from "../hooks/useSupabaseRealtime";
import { GameSessionState, initialSessionState, sessionReducer } from "../state/sessionReducer";
import { useImmerReducer } from "use-immer";

const STORAGE_KEY = "crewdup.session";

const SessionContext = createContext<{
  supabase: SupabaseClient;
  state: GameSessionState;
  dispatch: (action: any) => void;
  signInWithOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  guestJoin: (roomCode: string, nickname: string) => Promise<void>;
}>({
  supabase: undefined as unknown as SupabaseClient,
  state: initialSessionState,
  dispatch: () => undefined,
  signInWithOtp: async () => undefined,
  verifyOtp: async () => undefined,
  guestJoin: async () => undefined,
});

function createSupabaseClient() {
  const url = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("Supabase credentials missing, falling back to demo project");
  }

  return createClient(url ?? "https://demo.supabase.co", key ?? "public-anon-key", {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const { track, identify } = useAnalytics();
  const [state, dispatch] = useImmerReducer(sessionReducer, initialSessionState);
  const edgeUrl = useMemo(
    () => Constants.expoConfig?.extra?.EXPO_PUBLIC_EDGE_URL ?? process.env.EXPO_PUBLIC_EDGE_URL,
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        supabase.auth.refreshSession().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [supabase]);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const { queryParams } = Linking.parse(url);
      if (queryParams?.code) {
        dispatch({ type: "deepLink", code: String(queryParams.code) });
      }
    });
    return () => sub.remove();
  }, [dispatch]);

  useEffect(() => {
    const loadState = async () => {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        dispatch({ type: "hydrate", payload: JSON.parse(cached) });
      }
    };
    loadState();
  }, [dispatch]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state]);

  useSupabaseRealtime(supabase, state, dispatch);

  const signInWithOtp = useCallback(
    async (phone: string) => {
      await supabase.auth.signInWithOtp({ phone });
      track(AnalyticsEvents.loginStarted, { phone, role: state.self?.role ?? "host" });
    },
    [supabase, track, state.self?.role],
  );

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
      if (error) throw error;
      if (data.session?.user.id) {
        identify(data.session.user.id);
        track(AnalyticsEvents.loginSuccess, { role: state.self?.role ?? "host" });
        dispatch({ type: "markPhoneVerified" });
      }
    },
    [supabase, track, identify, dispatch, state.self?.role],
  );

  const guestJoin = useCallback(
    async (roomCode: string, nickname: string) => {
      if (!edgeUrl) {
        throw new Error("Edge URL missing");
      }
      track(AnalyticsEvents.guestJoinSubmitted, { code: roomCode, nickname, role: "guest" });
      const response = await fetch(`${edgeUrl}/guest_join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_code: roomCode, nickname }),
      });
      if (!response.ok) {
        track(AnalyticsEvents.guestJoinFailed, { code: roomCode, status: response.status, role: "guest" });
        throw new Error("Guest join failed");
      }
      const { access_token, refresh_token } = await response.json();
      await supabase.auth.setSession({ access_token, refresh_token });
      const { data } = await supabase.auth.getUser();
      dispatch({
        type: "setSelf",
        self: {
          id: data?.user?.id ?? `guest-${Date.now()}`,
          nickname,
          phoneVerified: false,
          role: "guest",
          isGuest: true,
        },
      });
      dispatch({
        type: "setPlayers",
        players: [
          {
            id: data?.user?.id ?? `guest-${Date.now()}`,
            nickname,
            connected: true,
            role: "player",
          },
        ],
      });
      dispatch({ type: "setPractice", isPractice: false });
      dispatch({ type: "setRoom", roomId: `joined-${roomCode}`, roomCode: roomCode.toUpperCase() });
      track(AnalyticsEvents.guestJoinSucceeded, { code: roomCode, role: "guest" });
    },
    [edgeUrl, supabase, dispatch, track],
  );

  return (
    <SessionContext.Provider value={{ supabase, state, dispatch, signInWithOtp, verifyOtp, guestJoin }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
