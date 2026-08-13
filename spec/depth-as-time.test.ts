import { describe, expect, it } from "vitest";
import { WAYPOINTS } from "../waypoints";
import { clampProgress, currentWaypoint, interpLayer } from "../zoom";

describe("depth-as-time: content ordering", () => {
  it("orders waypoints by strictly increasing lookback time", () => {
    for (let i = 1; i < WAYPOINTS.length; i++) {
      expect(WAYPOINTS[i].lookbackYears).toBeGreaterThan(WAYPOINTS[i - 1].lookbackYears);
    }
  });
});

describe("depth-as-time: zoom engine", () => {
  const frames = [
    { t: 0, scale: 2, x: 50, y: 0, opacity: 0 },
    { t: 0.5, scale: 1, x: 0, y: 0, opacity: 1 },
  ];

  it("holds the first keyframe before its progress is reached", () => {
    expect(interpLayer(frames, -1)).toEqual({ scale: 2, x: 50, y: 0, opacity: 0 });
  });

  it("holds the last keyframe past its progress", () => {
    expect(interpLayer(frames, 5)).toEqual({ scale: 1, x: 0, y: 0, opacity: 1 });
  });

  it("linearly interpolates between two keyframes", () => {
    expect(interpLayer(frames, 0.25)).toEqual({ scale: 1.5, x: 25, y: 0, opacity: 0.5 });
  });

  it("clamps progress to [0, 1]", () => {
    expect(clampProgress(-3)).toBe(0);
    expect(clampProgress(3)).toBe(1);
    expect(clampProgress(0.4)).toBe(0.4);
  });

  it("picks the waypoint whose progress threshold has most recently been crossed", () => {
    const staged = WAYPOINTS.filter((w) => w.from !== undefined);
    expect(currentWaypoint(0, staged).id).toBe("moon");
    expect(currentWaypoint(0.05, staged).id).toBe("moon");
    expect(currentWaypoint(0.055, staged).id).toBe("sun");
    expect(currentWaypoint(0.495, staged).id).toBe("virgo-cluster");
    expect(currentWaypoint(0.843, staged).id).toBe("reionization-fog");
    expect(currentWaypoint(0.942, staged).id).toBe("cmb");
    expect(currentWaypoint(1, staged).id).toBe("cmb");
  });
});
