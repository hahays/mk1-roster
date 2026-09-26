import assert from "node:assert/strict";
import test from "node:test";
import { IMPACT_TIME, INTRO_DURATION, sampleIntro } from "../src/lib/versus-timeline.ts";

test("portraits enter before the plates rush to the shared impact point", () => {
  assert.equal(sampleIntro(0).entrance, 0);
  assert.equal(sampleIntro(0).plate, 0);
  assert.ok(sampleIntro(0.25).entrance > 0);
  assert.equal(sampleIntro(0.25).plate, 0);
  assert.ok(sampleIntro(0.7).plate > sampleIntro(0.4).plate);
  assert.equal(sampleIntro(IMPACT_TIME).entrance, 1);
  assert.equal(sampleIntro(IMPACT_TIME).plate, 1);
});

test("flash and particles start on impact and finish before the final frame", () => {
  assert.equal(sampleIntro(IMPACT_TIME - 0.001).flash, 0);
  assert.equal(sampleIntro(IMPACT_TIME - 0.001).burst, -1);
  assert.equal(sampleIntro(IMPACT_TIME).flash, 1);
  assert.equal(sampleIntro(IMPACT_TIME).burst, 0);
  assert.ok(sampleIntro(IMPACT_TIME + 0.1).flash < 1);
  assert.equal(sampleIntro(IMPACT_TIME + 0.3).flash, 0);
  assert.equal(sampleIntro(INTRO_DURATION).burst, -1);
  assert.equal(sampleIntro(INTRO_DURATION).shake, 0);
  assert.equal(sampleIntro(INTRO_DURATION).finished, true);
});

test("reduced motion always presents the complete matchup without effects", () => {
  const hold = sampleIntro(null);
  for (const time of [0, 0.5, IMPACT_TIME, 1.5, INTRO_DURATION, 20]) {
    assert.deepEqual(sampleIntro(time, true), hold);
  }
});

test("replay restarts without carrying effects from the previous run", () => {
  sampleIntro(IMPACT_TIME + 0.1);
  sampleIntro(INTRO_DURATION);
  const firstFrame = sampleIntro(0);
  assert.equal(firstFrame.entrance, 0);
  assert.equal(firstFrame.plate, 0);
  assert.equal(firstFrame.burst, -1);
  assert.equal(firstFrame.finished, false);
});

test("plates touch on impact, recoil apart, and finish at rest", () => {
  assert.equal(sampleIntro(0).collision, 0);
  assert.equal(sampleIntro(IMPACT_TIME).collision, 1);
  assert.equal(sampleIntro(IMPACT_TIME).recoil, 0);
  assert.ok(sampleIntro(IMPACT_TIME + 0.06).recoil > 0);
  assert.ok(sampleIntro(IMPACT_TIME + 0.2).recoil < 0);
  assert.ok(sampleIntro(IMPACT_TIME + 0.3).collision < 0.1);
  assert.equal(sampleIntro(INTRO_DURATION).collision, 0);
  assert.equal(sampleIntro(INTRO_DURATION).recoil, 0);
  assert.equal(sampleIntro(INTRO_DURATION).energy, 0);
});

test("VS appears as the plates separate after impact", () => {
  assert.equal(sampleIntro(null).vs, 1);
  assert.equal(sampleIntro(IMPACT_TIME - 0.001).vs, 0);
  assert.equal(sampleIntro(IMPACT_TIME).vs, 0);
  assert.ok(sampleIntro(IMPACT_TIME + 0.2).vs > 0);
  assert.equal(sampleIntro(IMPACT_TIME + 0.45).vs, 1);
  assert.equal(sampleIntro(INTRO_DURATION).vs, 1);
});
