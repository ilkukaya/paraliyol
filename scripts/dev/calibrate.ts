import { computeTrip } from "../../src/lib/engine";
// reference: typical Google Maps road km / minutes (fastest, normal traffic)
const REF: [string, string, number, number][] = [
  ["ankara", "izmir", 585, 400], ["ankara", "konya", 260, 170], ["ankara", "antalya", 480, 330], ["ankara", "samsun", 410, 285],
  ["istanbul-anadolu", "ankara", 450, 285], ["ankara", "kapadokya", 300, 200], ["istanbul-anadolu", "antalya", 700, 470],
  ["izmir", "antalya", 450, 330], ["ankara", "eskisehir", 235, 160], ["istanbul-anadolu", "trabzon", 1070, 750],
  ["adana", "gaziantep", 220, 140], ["izmir", "bodrum", 240, 190], ["bursa", "eskisehir", 150, 115], ["konya", "antalya", 305, 230],
  ["istanbul-avrupa", "edirne", 235, 150], ["kayseri", "ankara", 315, 210], ["mersin", "adana", 70, 55], ["istanbul-anadolu", "izmir", 480, 300],
];
let e = 0;
for (const [a, b, rk, rm] of REF) {
  const f = computeTrip(a, b)!.byClass["1"].fastest;
  e += Math.abs(f.km - rk) / rk;
  console.log(`${a}>${b}`.padEnd(32), `km ${f.km} / ${rk}`.padEnd(16), `min ${f.minutes} / ${rm}`.padEnd(16), `${f.total} TL`, f.highways.join(","));
}
console.log("mean km err", (e / REF.length * 100).toFixed(1) + "%");
