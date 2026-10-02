// DNS resolution engine: iterative resolution, multi-level caching with TTL expiry,
// packet loss/retry, transport overhead (UDP/DoT/DoH), DNSSEC cost, and statistics.
export const DEFAULTS = { cache: true, ttl: 300, loss: 0.03, dnssec: false, proto: "UDP" };
export const DOMAINS = ["google.com", "youtube.com", "github.com", "wikipedia.org", "amazon.com",
  "netflix.com", "iisc.ac.in", "reddit.com", "openai.com", "stackoverflow.com", "bvrithyderabad.edu.in", "example.com"];

const NS_TTL = 86400;                                   // referral (NS) records live much longer
const BASE_RTT = { stub: 12, root: 28, tld: 38, auth: 60 }; // ms, resolver-side links
const PROTO_COST = { UDP: 0, DoT: 18, DoH: 30 };         // per-query overhead; handshake on 1st query
const rnd = (a, b) => a + Math.random() * (b - a);

export const newState = () => ({ now: 0, stub: {}, rec: {}, ns: {}, conn: false });

export function resolve(domain, cfg, st) {
  const steps = [];
  let total = 0;
  const alive = (m, k) => cfg.cache && (m[k] ?? -1) > st.now;
  const add = (from, to, label, base, extra = 0) => {
    let ms = base * rnd(0.8, 1.3) + extra, lost = false;
    if (Math.random() < cfg.loss) { ms += 400; lost = true; }   // timeout + retransmit
    steps.push({ from, to, label: label + (lost ? " (lost, retried)" : ""), ms: +ms.toFixed(1), lost });
    total += ms;
  };
  const finish = (level) => ({ domain, level, total: +total.toFixed(1), steps, at: st.now });
  const tld = domain.split(".").pop();

  add("client", "stub", `A? ${domain}`, 0.2);
  if (alive(st.stub, domain)) { add("stub", "client", "Answer from stub cache", 0.2); return finish("stub"); }

  const first = cfg.proto !== "UDP" && !st.conn;
  st.conn = true;
  const proto = PROTO_COST[cfg.proto] * (first ? 3 : 1);        // TLS handshake on a cold connection
  add("stub", "rec", `Recursive query (${cfg.proto})`, BASE_RTT.stub, proto);
  if (alive(st.rec, domain)) { add("rec", "stub", "Answer from resolver cache", 0.3); return finish("resolver"); }

  let skipped = 0;
  if (alive(st.ns, "tld:" + tld)) skipped++;
  else { add("rec", "root", `Ask root for .${tld}`, BASE_RTT.root); st.ns["tld:" + tld] = st.now + NS_TTL; }
  if (alive(st.ns, "auth:" + domain)) skipped++;
  else { add("rec", "tld", `Ask .${tld} TLD for ${domain} NS`, BASE_RTT.tld); st.ns["auth:" + domain] = st.now + NS_TTL; }
  add("rec", "auth", `Ask authoritative NS for A record`, BASE_RTT.auth, cfg.dnssec ? 14 : 0);

  st.rec[domain] = st.now + cfg.ttl;
  st.stub[domain] = st.now + cfg.ttl;
  add("rec", "stub", `Final answer (TTL ${cfg.ttl}s)`, 0.3);
  return finish(skipped ? "partial" : "full");
}

export function stats(rs) {
  if (!rs.length) return { n: 0, avg: 0, p50: 0, p95: 0, hit: 0, levels: {} };
  const t = rs.map((r) => r.total).sort((a, b) => a - b);
  const q = (p) => t[Math.min(t.length - 1, Math.floor(p * t.length))];
  const levels = {};
  rs.forEach((r) => (levels[r.level] = (levels[r.level] || 0) + 1));
  const hits = (levels.stub || 0) + (levels.resolver || 0);
  return { n: rs.length, avg: t.reduce((a, b) => a + b, 0) / t.length, p50: q(0.5), p95: q(0.95), hit: hits / rs.length, levels };
}

// Zipf-like popularity: a few domains dominate, as in real traffic.
function pick() {
  const w = DOMAINS.map((_, i) => 1 / (i + 1));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) <= 0) return DOMAINS[i];
  return DOMAINS[0];
}

export function benchmark(cfg, n = 300) {
  const st = newState();
  const rs = [];
  for (let i = 0; i < n; i++) { st.now += rnd(1, 40); rs.push(resolve(pick(), cfg, st)); }
  return stats(rs);
}
