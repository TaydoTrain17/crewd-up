import { sessionReducer, initialSessionState, RoundState } from "../src/state/sessionReducer";

describe("round flow", () => {
  it("advances rounds sequentially", () => {
    let state = { ...initialSessionState } as any;
    const round: RoundState = {
      index: 0,
      type: "hot_take",
      prompt: "Test",
      status: "active",
      timer: 60,
      votes: {},
    };
    state = sessionReducer(state, { type: "setRound", round });
    expect(state.rounds[0].type).toBe("hot_take");

    const nextRound: RoundState = { ...round, index: 1, type: "callout" };
    state = sessionReducer(state, { type: "setRound", round: nextRound });
    expect(state.rounds[1].type).toBe("callout");
  });
});
