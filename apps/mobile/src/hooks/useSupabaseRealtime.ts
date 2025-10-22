import { useEffect } from "react";
import { SupabaseClient } from "supabase-js";
import { GameSessionState } from "../state/sessionReducer";

type Action = { type: string; payload?: any; [key: string]: any };

export function useSupabaseRealtime(
  supabase: SupabaseClient,
  state: GameSessionState,
  dispatch: (action: Action) => void,
) {
  useEffect(() => {
    if (!state.sessionId) return;

    const channel = supabase
      .channel(`session:${state.sessionId}`)
      .on("broadcast", { event: "sync" }, (payload) => {
        const data = payload.payload as Partial<GameSessionState>;
        dispatch({ type: "serverSync", payload: data });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, state.sessionId, dispatch]);
}
