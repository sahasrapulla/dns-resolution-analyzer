import { useMemo, useRef, useState } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Clock, Gauge, RotateCcw, Globe } from "lucide-react";
import { DEFAULTS, DOMAINS, newState, resolve, stats, benchmark } from "./dnsEngine.js";

const POS = { client: [0, 130], stub: [220, 130], rec: [450, 130], root: [720, 0], tld: [720, 130], auth: [720, 260] };
const LABEL = { client: "Client (Browser)", stub: "Stub Resolver\n(OS cache)", rec: "Recursive Resolver\n(ISP / 8.8.8.8)", root: "Root Server (.)", tld: "TLD Server (.com)", auth: "Authoritative NS" };
const LINKS = [["client", "stub"], ["stub", "rec"], ["rec", "root"], ["rec", "tld"], ["rec", "auth"]];
const LEVEL_COLOR = { stub: "#34d399", resolver: "#60a5fa", partial: "#fbbf24", full: "#f87171" };
const LEVEL_NAME = { stub: "Stub cache hit", resolver: "Resolver cache hit", partial: "Partial (NS cached)", full: "Full recursion" };
const edgeId = (a, b) => LINKS.find(([x, y]) => (x === a && y === b) || (x === b && y === a)).join("-");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [domain, setDomain] = useState("github.com");
  const [results, setResults] = useState([]);
  const [active, setActive] = useState({ node: null, edge: null });
  const [busy, setBusy] = useState(false);
  const [bench, setBench] = useState(null);
  const [clock, setClock] = useState(0);
  const st = useRef(newState());
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  const nodes = useMemo(() => Object.keys(POS).map((id) => ({
    id, position: { x: POS[id][0], y: POS[id][1] }, data: { label: LABEL[id] },
    className: "dns-node" + (active.node === id ? " on" : ""), draggable: false,
  })), [active.node]);
  const edges = useMemo(() => LINKS.map(([s, t]) => {
    const id = `${s}-${t}`, on = active.edge === id;
    return { id, source: s, target: t, animated: on, style: { stroke: on ? "#fbbf24" : "#475569", strokeWidth: on ? 3 : 1.5 } };
  }), [active.edge]);

  async function run() {
    if (busy) return;
    setBusy(true);
    const r = resolve(domain.trim().toLowerCase() || "example.com", cfg, st.current);
    for (const s of r.steps) {
      setActive({ node: s.to, edge: edgeId(s.from, s.to) });
      await sleep(450);
    }
    setActive({ node: null, edge: null });
    setResults((p) => [r, ...p].slice(0, 200));
    setBusy(false);
  }
  const advance = (s) => { st.current.now += s; setClock(st.current.now); };
  const reset = () => { st.current = newState(); setClock(0); setResults([]); setBench(null); };
  const runBench = () => setBench({ cached: benchmark({ ...cfg, cache: true }), uncached: benchmark({ ...cfg, cache: false }) });

  const s = stats(results);
  const last = results[0];

  return (
    <div className="app">
      <header><Globe size={22} /> <h1>DNS Resolution & Performance Analyzer</h1><span className="clock"><Clock size={14} /> sim time: {Math.round(clock)}s</span></header>
      <div className="grid">
        <aside className="panel">
          <h3>Query</h3>
          <input list="d" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <datalist id="d">{DOMAINS.map((d) => <option key={d} value={d} />)}</datalist>
          <button className="primary" onClick={run} disabled={busy}><Play size={14} /> Resolve</button>
          <div className="row">
            <button onClick={() => advance(60)}>+1 min</button>
            <button onClick={() => advance(600)}>+10 min</button>
            <button onClick={reset}><RotateCcw size={13} /></button>
          </div>
          <h3>Configuration</h3>
          <label className="chk"><input type="checkbox" checked={cfg.cache} onChange={(e) => set("cache", e.target.checked)} /> Caching enabled</label>
          <label className="chk"><input type="checkbox" checked={cfg.dnssec} onChange={(e) => set("dnssec", e.target.checked)} /> DNSSEC validation</label>
          <label>Record TTL: {cfg.ttl}s<input type="range" min="10" max="3600" step="10" value={cfg.ttl} onChange={(e) => set("ttl", +e.target.value)} /></label>
          <label>Packet loss: {(cfg.loss * 100).toFixed(0)}%<input type="range" min="0" max="0.3" step="0.01" value={cfg.loss} onChange={(e) => set("loss", +e.target.value)} /></label>
          <label>Transport
            <select value={cfg.proto} onChange={(e) => set("proto", e.target.value)}>
              <option>UDP</option><option>DoT</option><option>DoH</option>
            </select>
          </label>
        </aside>

        <main>
          <div className="flow"><ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false} proOptions={{ hideAttribution: true }}><Background color="#1e293b" /><Controls showInteractive={false} /></ReactFlow></div>
          <div className="cards">
            <Card k="Queries" v={s.n} />
            <Card k="Avg latency" v={`${s.avg.toFixed(1)} ms`} />
            <Card k="P95" v={`${s.p95.toFixed(1)} ms`} />
            <Card k="Cache hit ratio" v={`${(s.hit * 100).toFixed(0)}%`} />
          </div>
          <div className="two">
            <section className="panel">
              <h3><Gauge size={14} /> Latency per query (latest 30)</h3>
              <div className="bars">
                {results.slice(0, 30).reverse().map((r, i) => (
                  <div key={i} className="bar" title={`${r.domain}: ${r.total} ms`} style={{ height: Math.min(100, r.total / 3) + "%", background: LEVEL_COLOR[r.level] }} />
                ))}
              </div>
              <div className="legend">{Object.keys(LEVEL_NAME).map((k) => <span key={k}><i style={{ background: LEVEL_COLOR[k] }} />{LEVEL_NAME[k]}</span>)}</div>
            </section>
            <section className="panel">
              <h3>Benchmark: 300 queries, Zipf traffic</h3>
              <button onClick={runBench}>Run cache ON vs OFF</button>
              {bench && (
                <table><thead><tr><th></th><th>Avg</th><th>P95</th><th>Hit</th></tr></thead><tbody>
                  {[["Cache ON", bench.cached], ["Cache OFF", bench.uncached]].map(([n, b]) => (
                    <tr key={n}><td>{n}</td><td>{b.avg.toFixed(1)} ms</td><td>{b.p95.toFixed(1)} ms</td><td>{(b.hit * 100).toFixed(0)}%</td></tr>))}
                </tbody></table>
              )}
              {bench && <p className="note">Caching cut mean latency by {(100 * (1 - bench.cached.avg / bench.uncached.avg)).toFixed(0)}%.</p>}
            </section>
          </div>
        </main>

        <aside className="panel log">
          <h3>Resolution trace {last && <small>({LEVEL_NAME[last.level]}, {last.total} ms)</small>}</h3>
          <AnimatePresence initial={false}>
            {last && last.steps.map((x, i) => (
              <motion.div key={last.at + last.domain + i + results.length} className={"step" + (x.lost ? " lost" : "")} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <b>{x.from} → {x.to}</b> <span>{x.label}</span> <em>{x.ms} ms</em>
              </motion.div>))}
          </AnimatePresence>
          <h3>History</h3>
          {results.slice(0, 12).map((r, i) => <div key={i} className="hist"><i style={{ background: LEVEL_COLOR[r.level] }} />{r.domain}<em>{r.total} ms</em></div>)}
        </aside>
      </div>
    </div>
  );
}
const Card = ({ k, v }) => <div className="card"><small>{k}</small><strong>{v}</strong></div>;
