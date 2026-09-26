import { computeTrip } from "../../src/lib/engine";
const pairs = process.argv.slice(2).map((p) => p.split(":"));
for (const [a, b] of pairs) {
  const t = computeTrip(a, b);
  if (!t) { console.log(a, b, "NO ROUTE"); continue; }
  for (const vc of ["1"] as const) {
    const f = t.byClass[vc].fastest, e = t.byClass[vc].economic;
    console.log(`${a}→${b} [${vc}] ${f.total} TL ${f.km}km ${f.minutes}min | ${f.tolls.map((x) => `${x.name}${x.entry ? ` (${x.entry}→${x.exit})` : ""}=${x.price}${x.estimated ? "*" : ""}`).join(" + ")}`);
    if (e) console.log(`   eco: ${e.total} TL ${e.km}km ${e.minutes}min | ${e.tolls.map((x) => `${x.name}=${x.price}`).join(" + ")}`);
  }
}
