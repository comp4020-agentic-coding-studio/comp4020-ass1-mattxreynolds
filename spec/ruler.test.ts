import { describe, expect, it } from "vitest";
import { progressForRulerFraction, rulerFraction, unitRegime, type RulerStep } from "../ruler";
import { WAYPOINTS } from "../waypoints";

describe("ruler: unitRegime", () => {
  it("buckets each real waypoint's lookback time into the right unit regime", () => {
    const expected: Record<string, string> = {
      moon: "seconds",
      sun: "minutes",
      "proxima-centauri": "years",
      vega: "years",
      "sagittarius-a": "millennia",
      andromeda: "millions of years",
      "virgo-cluster": "millions of years",
      "3c273": "billions of years",
      "gn-z11": "billions of years",
      "jades-gs-z14-0": "billions of years",
      "reionization-fog": "billions of years",
      cmb: "billions of years",
    };
    for (const waypoint of WAYPOINTS) {
      expect(unitRegime(waypoint.lookbackYears)).toBe(expected[waypoint.id]);
    }
  });
});

describe("ruler: fraction mapping", () => {
  const staged = WAYPOINTS.filter((w) => w.from !== undefined);
  const simple: RulerStep[] = [{ from: 0 }, { from: 0.5 }];

  it("gives every step an equal-length share of the ruler", () => {
    expect(rulerFraction(0, simple)).toBe(0);
    expect(rulerFraction(0.25, simple)).toBeCloseTo(0.25, 5);
    expect(rulerFraction(0.5, simple)).toBeCloseTo(0.5, 5);
    expect(rulerFraction(0.75, simple)).toBeCloseTo(0.75, 5);
    expect(rulerFraction(1, simple)).toBe(1);
  });

  it("lands exactly at each real waypoint's boundary", () => {
    staged.forEach((w, i) => {
      expect(rulerFraction(w.from ?? 0, staged)).toBeCloseTo(i / staged.length, 10);
    });
  });

  it("is the exact inverse of progressForRulerFraction", () => {
    for (const fraction of [0, 0.1, 0.33, 0.5, 0.6, 0.9, 1]) {
      const progress = progressForRulerFraction(fraction, staged);
      expect(rulerFraction(progress, staged)).toBeCloseTo(fraction, 5);
    }
  });

  it("clamps out-of-range fractions to the ends", () => {
    expect(progressForRulerFraction(-1, staged)).toBe(staged[0].from ?? 0);
    expect(progressForRulerFraction(2, staged)).toBe(1);
  });
});
