import { sessionReducer, initialSessionState } from "../src/state/sessionReducer";

it("sets room and players", () => {
  const state = { ...initialSessionState };
  const next = sessionReducer(state as any, { type: "setRoom", roomId: "abc", roomCode: "QWERTY" });
  expect(next.roomCode).toBe("QWERTY");
});

it("hydrates from payload", () => {
  const state = { ...initialSessionState };
  const payload = { ...initialSessionState, roomCode: "HELLO" } as any;
  const next = sessionReducer(state as any, { type: "hydrate", payload });
  expect(next.roomCode).toBe("HELLO");
});

it("toggles practice mode", () => {
  const state = { ...initialSessionState };
  let next = sessionReducer(state as any, { type: "setPractice", isPractice: true });
  expect(next.isPractice).toBe(true);
  next = sessionReducer(next as any, { type: "setPractice", isPractice: false });
  expect(next.isPractice).toBe(false);
});

it("marks phone verified", () => {
  const state = {
    ...initialSessionState,
    self: { id: "1", nickname: "Test", phoneVerified: false, role: "host" },
  } as any;
  const next = sessionReducer(state, { type: "markPhoneVerified" });
  expect(next.self?.phoneVerified).toBe(true);
});

it("toggles practice recap preference", () => {
  const state = { ...initialSessionState } as any;
  let next = sessionReducer(state, { type: "togglePracticeRecaps" });
  expect(next.preferences.savePracticeRecaps).toBe(true);
  next = sessionReducer(next, { type: "togglePracticeRecaps", value: false });
  expect(next.preferences.savePracticeRecaps).toBe(false);
});
