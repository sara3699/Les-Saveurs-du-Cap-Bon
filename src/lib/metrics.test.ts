import { describe, expect, it } from "vitest";
import { TEAM_CONVERSION_METRICS } from "@/lib/mock/core";
import { conversionRate, summarizeConversions } from "./metrics";

describe("team conversion metrics", () => {
  it("rolls the team funnel into dashboard totals", () => {
    expect(summarizeConversions(TEAM_CONVERSION_METRICS)).toMatchObject({
      callsReceived: 100,
      customersReached: 81,
      customersWon: 38,
      customersRejected: 18,
      ordersPlaced: 32,
      revenue: 13710,
      reachRate: 81,
      conversionRate: 38,
      orderRate: 32,
    });
  });

  it("calculates each member rate from calls received", () => {
    expect(conversionRate(TEAM_CONVERSION_METRICS[0])).toBeCloseTo(40.909, 2);
    expect(conversionRate(TEAM_CONVERSION_METRICS[1])).toBeCloseTo(41.935, 2);
  });

  it("returns zero rates when no calls were received", () => {
    expect(
      summarizeConversions([
        {
          id: "empty",
          teamMemberId: "tm_empty",
          callsReceived: 0,
          customersReached: 0,
          customersWon: 0,
          customersRejected: 0,
          ordersPlaced: 0,
          revenue: 0,
        },
      ]),
    ).toMatchObject({ reachRate: 0, conversionRate: 0, orderRate: 0 });
  });
});
