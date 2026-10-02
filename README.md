# DNS Resolution & Performance Analyzer
Interactive simulator (React + Vite + React Flow + Framer Motion) that animates a DNS lookup across
Client -> Stub -> Recursive Resolver -> Root -> TLD -> Authoritative server and analyses performance.

## Run
npm install && npm run dev

## Concepts modelled (src/dnsEngine.js)
- Iterative resolution with referrals (root -> TLD -> authoritative)
- Two cache layers (stub, recursive) + NS-referral caching, with TTL expiry on a simulated clock
- Packet loss with timeout/retransmission (+400 ms), jitter on every hop
- Transport cost: UDP vs DoT vs DoH (TLS handshake on first query)
- DNSSEC validation overhead
- Metrics: average, P50/P95 latency, cache hit ratio; benchmark of cache ON vs OFF on Zipf traffic

## Ideas to extend
Negative caching (NXDOMAIN), CNAME chains, real lookups via a small Express + dns.promises backend (deployable on Render).
