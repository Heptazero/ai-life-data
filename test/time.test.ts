import assert from "node:assert/strict";
import test from "node:test";
import { logicalClock, localDateTime } from "../src/utils/time.js";

test("凌晨两点前仍属于前一逻辑日", () => {
  const clock = logicalClock(new Date("2026-08-31T17:30:00.000Z"), "Asia/Shanghai", 2);
  assert.deepEqual(clock, {
    logicalDate: "2026-08-31",
    minute: 1530,
    localDate: "2026-09-01",
    localHour: 1,
    localMinute: 30
  });
});

test("逻辑分钟可跨越自然日", () => {
  assert.equal(localDateTime("2026-08-31", 1500), "2026-09-01T01:00:00");
});
