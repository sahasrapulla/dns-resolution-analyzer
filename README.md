# DNS Resolution & Performance Analyzer

An interactive browser-based simulator for understanding **DNS resolution, caching, TTL expiration, network latency, packet loss, transport overhead, and DNS performance metrics**.

> **Note:** This project is a simulation and educational tool. It does not perform real DNS resolution or contact actual DNS servers. Network behavior, latency, packet loss, retransmission, DoT/DoH overhead, and DNSSEC overhead are simulated.

## Overview

DNS is one of the fundamental services of the Internet. A DNS lookup may involve multiple components such as the stub resolver, recursive resolver, root server, TLD server, and authoritative name server.

This project provides an interactive visualization of that process and allows users to experiment with different network and caching conditions.

The simulated resolution path is:

```text
Client
  ↓
Stub Resolver
  ↓
Recursive Resolver
  ↓
Root Server
  ↓
TLD Server
  ↓
Authoritative Name Server
```

The application also measures simulated latency and displays performance statistics for different resolution scenarios.

## Objectives

- Visualize the DNS resolution process.
- Demonstrate iterative DNS resolution.
- Show the effect of DNS caching.
- Demonstrate TTL-based cache expiration.
- Simulate packet loss and retransmission.
- Model UDP, DNS-over-TLS (DoT), and DNS-over-HTTPS (DoH) overhead.
- Model DNSSEC-related processing overhead.
- Calculate average and P95 latency.
- Calculate cache hit ratio.
- Compare cached and uncached DNS traffic.
- Provide an interactive learning environment for DNS concepts.

## Key Features

- Interactive DNS resolution visualization
- Stub resolver cache
- Recursive resolver cache
- NS referral caching
- Configurable DNS record TTL
- Simulated clock
- Packet-loss simulation
- Retransmission simulation
- UDP / DoT / DoH transport options
- DNSSEC overhead simulation
- Average latency
- P95 latency
- Cache hit ratio
- Per-query latency chart
- Resolution trace
- Query history
- 300-query performance benchmark
- Cache ON vs OFF comparison
- Zipf-like DNS traffic distribution

## How It Works

When a user enters a domain and clicks **Resolve**, the simulator performs the following steps:

1. The client sends a query to the stub resolver.
2. The stub cache is checked.
3. If there is no valid cached response, the query is forwarded to the recursive resolver.
4. The recursive resolver checks its cache.
5. If necessary, the resolver queries the root server.
6. The resolver follows the TLD referral.
7. The resolver queries the authoritative name server.
8. The response is returned to the client.
9. The result is stored in the simulated cache according to the configured TTL.

Depending on the cache state, a query may result in:

- **Stub Cache Hit**
- **Resolver Cache Hit**
- **Partial Resolution**
- **Full Recursion**

## Caching and TTL

The simulator models multiple caching layers:

```text
Stub Cache
Recursive Resolver Cache
NS Referral Cache
```

Cached records remain valid until their configured TTL expires.

The default TTL is:

```text
300 seconds
```

The application uses a simulated clock so that cache expiration can be demonstrated without waiting in real time.

Available controls include:

```text
+1 min
+10 min
Reset
```

For example, a user can resolve a domain, resolve it again to observe a cache hit, advance simulated time, and resolve it again after the cache expires.

## Network Simulation

The simulator models network conditions using configurable latency, jitter, and packet loss.

### Packet Loss

Packet loss can cause a simulated timeout and retransmission:

```text
Query
 ↓
Packet Lost
 ↓
Timeout
 ↓
Retransmission
```

This allows users to observe how unreliable network conditions can increase DNS resolution latency.

### Transport

The application provides three simulated transport options:

- UDP
- DNS-over-TLS (DoT)
- DNS-over-HTTPS (DoH)

These options represent different transport overheads within the simulation.

> DoT and DoH are modeled for performance comparison. The application does not establish real DoT or DoH connections.

## DNSSEC

DNSSEC can be enabled from the configuration panel.

When enabled, the simulator adds additional processing overhead to represent the performance cost associated with DNSSEC validation.

> The current implementation models DNSSEC overhead and does not perform actual DNSSEC cryptographic validation.

## Performance Metrics

The dashboard provides several metrics.

### Average Latency

The average simulated latency across completed queries.

### P95 Latency

A high-percentile latency measurement showing the performance of slower queries.

### Cache Hit Ratio

The percentage of queries served from the simulated cache.

### Query Count

The total number of completed simulated queries.

The application also displays latency for the latest queries and categorizes them based on the resolution path.

## Resolution Trace

After a query is completed, the application displays the individual stages of the simulated resolution.

A typical resolution may contain:

```text
Client → Stub
Stub → Recursive Resolver
Recursive Resolver → Root
Recursive Resolver → TLD
Recursive Resolver → Authoritative Server
Authoritative Server → Recursive Resolver
Recursive Resolver → Stub
Stub → Client
```

The trace also shows simulated latency and retry information when packet loss occurs.

## Performance Benchmark

The application includes a benchmark that runs **300 simulated DNS queries** using a Zipf-like traffic distribution.

The benchmark compares:

```text
Cache ON
Cache OFF
```

and reports:

- Average latency
- P95 latency
- Cache hit ratio

The Zipf-like distribution represents workloads where some domains are requested more frequently than others.

Because the simulator uses randomized latency, packet loss, and traffic selection, benchmark results may vary between runs.

## Example Experiments

### Cache Experiment

1. Enable caching.
2. Enter `github.com`.
3. Click **Resolve**.
4. Resolve the same domain again.
5. Compare the resolution paths and latency.
6. Advance simulated time.
7. Resolve again after TTL expiration.
8. Disable caching and repeat the experiment.

This demonstrates the effect of DNS caching on resolution performance.

### Packet Loss Experiment

1. Set packet loss to `0%`.
2. Run several queries.
3. Increase packet loss.
4. Run the queries again.
5. Observe retransmissions in the resolution trace.
6. Compare average and P95 latency.

### Transport Experiment

Run the same query using:

```text
UDP
DoT
DoH
```

and compare the simulated latency.

## System Architecture

```text
+---------------------------+
|        React UI           |
|                           |
| Query | Controls | Graph  |
| Metrics | Trace | History |
+-------------+-------------+
              |
              v
+---------------------------+
|     DNS Simulation        |
|          Engine           |
|                           |
| Resolution | Cache | TTL  |
| Packet Loss | Transport  |
| DNSSEC | Statistics      |
+-------------+-------------+
              |
              v
+---------------------------+
|    Simulated DNS System   |
|                           |
| Stub → Recursive → Root   |
|       → TLD → Authoritative|
+---------------------------+
```

## Technology Stack

- React 18
- Vite
- JavaScript / ES Modules
- React Flow
- Framer Motion
- Lucide React
- CSS

The application is currently implemented as a client-side application and does not require a backend or external DNS service.

## Project Structure

```text
dns-resolution-analyzer/
│
├── src/
│   ├── App.jsx
│   ├── dnsEngine.js
│   ├── App.css
│   └── main.jsx
│
├── public/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/sahasrapulla/dns-resolution-analyzer.git
cd dns-resolution-analyzer
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration Options

| Option | Description |
|---|---|
| Caching | Enables or disables simulated DNS caching |
| DNSSEC | Enables simulated DNSSEC overhead |
| TTL | Controls cache lifetime |
| Packet Loss | Controls simulated packet loss |
| Transport | Selects UDP, DoT, or DoH |

## Limitations

This project focuses on simulation and visualization rather than complete DNS protocol implementation.

Current limitations include:

- No real DNS queries
- No real packet capture
- No real network measurements
- Simplified DNS record handling
- Simplified DNSSEC modeling
- Simplified DoT and DoH modeling
- Randomized latency and packet loss
- No complete CNAME chain simulation
- No NXDOMAIN/negative caching simulation

The displayed latency values represent simulated network behavior rather than measurements from real DNS infrastructure.

## Future Improvements

Possible future enhancements include:

- Support for A, AAAA, CNAME, MX, TXT, and SOA records
- NXDOMAIN and negative caching
- CNAME chain simulation
- More detailed DNSSEC modeling
- Real DNS lookup mode
- Real network latency measurements
- Configurable per-hop latency
- Advanced retry and timeout configuration
- Concurrent query simulation
- Export of benchmark results to CSV/JSON
- Reproducible benchmarks using configurable random seeds
- Additional performance visualizations

## Learning Outcomes

This project demonstrates practical concepts related to:

- DNS architecture
- Recursive and iterative resolution
- DNS caching
- TTL and cache expiration
- Network latency
- Packet loss and retransmission
- DNS transport protocols
- DNSSEC overhead
- Performance measurement
- Percentile latency
- Cache hit ratio
- Traffic distribution and benchmarking

## Conclusion

The **DNS Resolution & Performance Analyzer** provides an interactive environment for studying DNS resolution and performance.

By combining DNS visualization, caching, simulated network conditions, performance metrics, and benchmarking, the project makes it possible to observe how different factors affect DNS resolution without relying on unpredictable real-world network conditions.

It can be used as a networking learning tool, classroom demonstration, performance-analysis prototype, or foundation for future real-network DNS experiments.

## License

No open-source license is currently specified for this repository.

If the project is intended for public reuse, an appropriate license such as MIT or Apache-2.0 can be added.

## Author

**Sahasra Pulla**

GitHub: https://github.com/sahasrapulla/dns-resolution-analyzer
