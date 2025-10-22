export const AnalyticsEvents = {
  appOpen: "app_open",
  loginStarted: "login_started",
  loginSuccess: "login_success",
  createRoom: "create_room",
  joinRoom: "join_room",
  sessionStarted: "session_started",
  roundCompleted: "round_completed",
  recapGenerated: "recap_generated",
  shareTapped: "share_tapped",
  shareCompleted: "share_completed",
  sessionEnded: "session_ended",
  practiceStarted: "practice_started",
  practiceEnded: "practice_ended",
  joinOpened: "join_opened",
  guestJoinSubmitted: "guest_join_submitted",
  guestJoinSucceeded: "guest_join_succeeded",
  guestJoinFailed: "guest_join_failed",
  crash: "crash",
} as const;

export type AnalyticsEventKey = keyof typeof AnalyticsEvents;
