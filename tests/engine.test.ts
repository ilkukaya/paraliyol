import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTrip, getLocations, getHighways } from "../src/lib/engine";
import { parseRouteSlug, routeSlug } from "../src/lib/engine/slugs";

const fastest = (a: string, b: string, vc: "1" | "2" | "3" | "4" | "5" | "6" = "1") => {
  const t = computeTrip(a, b);
  assert.ok(t, `${a}→${b} has a route`);
  return t.byClass[vc].fastest;
};

test("İstanbul (Anadolu) → İzmir uses Osmangazi and both O-5 sections", () => {
  const r = fastest("istanbul-anadolu", "izmir");
  const names = r.tolls.map((t) => t.ref);
  assert.ok(names.includes("osmangazi-koprusu"));
  assert.equal(names.filter((n) => n === "O-5").length, 2);
  assert.equal(r.total, r.tolls.reduce((s, t) => s + t.price, 0));
});

test("crossing the Bosphorus always costs something", () => {
  for (const vc of ["1", "2", "3", "4", "5", "6"] as const) {
    const r = fastest("istanbul-avrupa", "istanbul-anadolu", vc);
    assert.ok(r.tolls.some((t) => t.kind !== "highway" || t.ref === "KCY"), `class ${vc} crosses via a paid crossing`);
  }
});

test("heavy vehicles never use 15 Temmuz / FSM / Avrasya", () => {
  for (const vc of ["3", "4", "5"] as const) {
    const r = fastest("istanbul-avrupa", "ankara", vc);
    const refs = r.tolls.map((t) => t.ref);
    assert.ok(!refs.includes("15-temmuz-sehitler-koprusu"));
    assert.ok(!refs.includes("fatih-sultan-mehmet-koprusu"));
    assert.ok(!refs.includes("avrasya-tuneli"));
  }
});

test("Çanakkale from Thrace pays the 1915 bridge once", () => {
  const r = fastest("tekirdag", "canakkale");
  assert.equal(r.tolls.filter((t) => t.ref === "1915-canakkale-koprusu").length, 1);
});

test("every pair of popular locations has a finite, non-negative route", () => {
  const pop = getLocations().filter((l) => l.popular);
  for (const a of pop)
    for (const b of pop) {
      if (a.id === b.id) continue;
      const t = computeTrip(a.id, b.id);
      assert.ok(t, `${a.id}→${b.id}`);
      for (const opt of Object.values(t.byClass)) {
        assert.ok(Number.isFinite(opt.fastest.total) && opt.fastest.total >= 0);
        assert.ok(opt.fastest.tolls.every((x) => !x.estimated), `${a.id}→${b.id} has exact tariff pairs`);
        if (opt.economic) assert.ok(opt.economic.total < opt.fastest.total);
      }
    }
});

test("tariff matrices are well formed", () => {
  for (const hw of getHighways()) {
    const ids = new Set(hw.stations.map((s) => s.id));
    for (const sec of hw.sections)
      for (const [a, row] of Object.entries(sec.prices))
        for (const [b, p] of Object.entries(row)) {
          assert.ok(ids.has(a) && ids.has(b), `${hw.code} ${a}/${b}`);
          assert.equal(p.length, 6);
          assert.ok(p.every((v) => v >= 0));
        }
  }
});

test("route slugs round-trip", () => {
  const locs = getLocations();
  for (const a of locs.slice(0, 40))
    for (const b of locs.slice(0, 40)) {
      if (a.id === b.id) continue;
      const p = parseRouteSlug(routeSlug(a.id, b.id));
      assert.equal(p?.from.id, a.id);
      assert.equal(p?.to.id, b.id);
    }
  assert.equal(routeSlug("istanbul-anadolu", "ankara"), "istanbul-ankara-otoyol-ucreti");
  assert.equal(routeSlug("istanbul-avrupa", "edirne"), "istanbul-edirne-otoyol-ucreti");
});
