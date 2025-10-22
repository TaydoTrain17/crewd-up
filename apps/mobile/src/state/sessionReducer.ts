import { Draft } from "immer";

export type RoundType = "hot_take" | "callout" | "dare";

export type RoundState = {
  id?: string;
  index: number;
  type: RoundType;
  prompt?: string;
  timer: number;
  status: "idle" | "active" | "complete";
  votes: Record<string, { target?: string; text?: string }>;
};

export type PlayerState = {
  id: string;
  nickname: string;
  isHost?: boolean;
  connected: boolean;
  role?: 'host' | 'player';
};

export type SelfState = {
  id: string;
  nickname: string;
  borough?: string;
  phoneVerified: boolean;
  role: 'host' | 'guest';
  isGuest?: boolean;
};

export type PreferencesState = {
  savePracticeRecaps: boolean;
};

export type GameSessionState = {
  roomCode?: string;
  roomId?: string;
  sessionId?: string;
  rounds: RoundState[];
  players: PlayerState[];
  currentRound?: number;
  deepLinkCode?: string;
  recapUrl?: string;
  isPractice?: boolean;
  self?: SelfState;
  preferences: PreferencesState;
};

export const initialSessionState: GameSessionState = {
  rounds: [],
  players: [],
  preferences: {
    savePracticeRecaps: false,
  },
};

type Actions =
  | { type: "hydrate"; payload: GameSessionState }
  | { type: "deepLink"; code: string }
  | { type: "serverSync"; payload: Partial<GameSessionState> }
  | { type: "setRoom"; roomId: string; roomCode: string }
  | { type: "setPlayers"; players: PlayerState[] }
  | { type: "setRound"; round: RoundState }
  | { type: "updateTimer"; roundIndex: number; timer: number }
  | { type: "setRecap"; recapUrl: string }
  | { type: "setSelf"; self: SelfState }
  | { type: "markPhoneVerified" }
  | { type: "setPractice"; isPractice: boolean }
  | { type: "togglePracticeRecaps"; value?: boolean }
  | { type: "resetSession" };

export function sessionReducer(draft: Draft<GameSessionState>, action: Actions) {
  switch (action.type) {
    case "hydrate":
      Object.assign(draft, action.payload);
      draft.preferences = {
        ...initialSessionState.preferences,
        ...action.payload.preferences,
      };
      return draft;
    case "deepLink":
      draft.deepLinkCode = action.code;
      return draft;
    case "serverSync":
      Object.assign(draft, action.payload);
      return draft;
    case "setRoom":
      draft.roomId = action.roomId;
      draft.roomCode = action.roomCode;
      return draft;
    case "setPlayers":
      draft.players = action.players;
      return draft;
    case "setRound":
      draft.currentRound = action.round.index;
      const existingIndex = draft.rounds.findIndex((r) => r.index === action.round.index);
      if (existingIndex >= 0) {
        draft.rounds[existingIndex] = action.round;
      } else {
        draft.rounds.push(action.round);
      }
      return draft;
    case "updateTimer":
      if (draft.rounds[action.roundIndex]) {
        draft.rounds[action.roundIndex].timer = action.timer;
      }
      return draft;
    case "setRecap":
      draft.recapUrl = action.recapUrl;
      return draft;
    case "setSelf":
      draft.self = action.self;
      return draft;
    case "markPhoneVerified":
      if (draft.self) {
        draft.self.phoneVerified = true;
        draft.self.role = draft.self.role ?? "host";
      }
      return draft;
    case "setPractice":
      draft.isPractice = action.isPractice;
      if (!action.isPractice) {
        draft.rounds = [];
        draft.sessionId = undefined;
        draft.recapUrl = undefined;
      }
      return draft;
    case "togglePracticeRecaps":
      draft.preferences.savePracticeRecaps =
        action.value ?? !draft.preferences.savePracticeRecaps;
      return draft;
    case "resetSession":
      draft.rounds = [];
      draft.players = [];
      draft.sessionId = undefined;
      draft.recapUrl = undefined;
      draft.isPractice = false;
      draft.roomId = undefined;
      draft.roomCode = undefined;
      return draft;
    default:
      return draft;
  }
}
