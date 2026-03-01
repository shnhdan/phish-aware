"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import {
  Shield, AlertTriangle, Zap, Activity,
  Globe, Clock, TrendingUp, Terminal, Search
} from "lucide-react";

// ─── Mock data (replace with Supabase real-time) ──────────────

const MOCK_STATS = {
  total_scans: 1247,
  dangerous: 89,
  suspicious: 234,
  safe: 924,
  avg_risk_score: 28.4,
};

const MOCK_TREND = [
  { day: "Mon", dangerous: 12, suspicious: 34, safe: 98 },
  { day: "Tue", dangerous: 8,  suspicious: 28, safe: 112 },
  { day: "Wed", dangerous: 19, suspicious: 41, safe: 87  },
  { day: "Thu", dangerous: 7,  suspicious: 22, safe: 134 },
  { day: "Fri", dangerous: 23, suspicious: 51, safe: 91  },
  { day: "Sat", dangerous: 5,  suspicious: 18, safe: 67  },
  { day: "Sun", dangerous: 15, suspicious: 40, safe: 89  },
];

const MOCK_FEED = [
  { id: 1, domain: "amaz0n-secure.xyz",        score: 94, label: "DANGEROUS",   time: "2m ago",  keywords: ["verify immediately", "account suspended"] },
  { id: 2, domain: "paypal-verify.net",         score: 87, label: "DANGEROUS",   time: "5m ago",  keywords: ["click here immediately"] },
  { id: 3, domain: "newsletter.spotify.com",    score: 12, label: "SAFE",        time: "7m ago",  keywords: [] },
  { id: 4, domain: "confirm-banklogin.tk",      score: 76, label: "SUSPICIOUS",  time: "12m ago", keywords: ["confirm your identity"] },
  { id: 5, domain: "github.com",                score: 4,  label: "SAFE",        time: "15m ago", keywords: [] },
  { id: 6, domain: "verify-account-chase.xyz",  score: 91, label: "DANGEROUS",   time: "18m ago", keywords: ["account will be closed", "urgent"] },
];

const MOCK_KEYWORDS = [
  { keyword: "verify immediately",   count: 234, avg_risk: 78 },
  { keyword: "account suspended",    count: 189, avg_risk: 82 },
  { keyword: "click here",           count: 156, avg_risk: 71 },
  { keyword: "confirm identity",     count: 142, avg_risk: 75 },
  { keyword: "unusual activity",     count: 98,  avg_risk: 69 },
];

// ─── Components ───────────────────────────────────────────────

function RiskBadge({ label }: { label: string }) {
  const cfg: Record<string, string> = {
    DANGEROUS:  "bg-red-500/20 text-red-400 border-red-500/40",
    SUSPICIOUS: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    SAFE:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  };
  const icons: Record<string, string> = {
    DANGEROUS: "🚨", SUSPICIOUS: "⚠️", SAFE: "✅"
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono font-semibold ${cfg[label]}`}>
      {icons[label]} {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4 hover:border-zinc-700 transition-colors">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">{label}</p>
        <p className="text-white text-2xl font-bold font-mono mt-0.5">{value}</p>
        {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────

export default function Dashboard() {
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [feed, setFeed] = useState(MOCK_FEED);
  const [tick, setTick] = useState(0);

  // Simulate live feed updates
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 8000);
    return () => clearInterval(interval);
  }, []);

  async function handleQuickScan() {
    if (!scanInput.trim()) return;
    setScanning(true);
    setScanResult(null);
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));
    const isBad = scanInput.includes(".xyz") || scanInput.includes(".tk") || scanInput.includes("verify");
    setScanResult({
      risk_score: isBad ? 87 : 14,
      risk_label: isBad ? "DANGEROUS" : "SAFE",
      explanation: isBad
        ? "DANGEROUS: suspicious TLD; sender domain is 3 days old; contains urgent language."
        : "No significant threats detected.",
    });
    setScanning(false);
  }

  const pieData = [
    { name: "Dangerous",  value: MOCK_STATS.dangerous,  fill: "#ef4444" },
    { name: "Suspicious", value: MOCK_STATS.suspicious, fill: "#f59e0b" },
    { name: "Safe",       value: MOCK_STATS.safe,        fill: "#22c55e" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace" }}>

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 px-8 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <Shield size={16} className="text-red-400" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PhishAware</span>
          <span className="text-zinc-600 text-xs">v1.0 // SDG-16</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs">PIPELINE ACTIVE</span>
        </div>

        <nav className="flex items-center gap-6 text-sm text-zinc-500">
          <a href="#" className="text-white">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Scan History</a>
          <a href="#" className="hover:text-white transition-colors">Domain Lookup</a>
          <a href="#" className="hover:text-white transition-colors">Pipeline</a>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* ── Hero title ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Threat Intelligence
              <span className="text-red-400"> Dashboard</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Real-time phishing detection pipeline · Powered by Airflow + Supabase
            </p>
          </div>
          <div className="text-right text-xs text-zinc-600">
            <div>Last pipeline run: <span className="text-zinc-400">2 min ago</span></div>
            <div>Airflow DAGs: <span className="text-emerald-400">3/3 healthy</span></div>
          </div>
        </div>

        {/* ── Quick scan bar ─────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={14} className="text-zinc-500" />
            <span className="text-zinc-500 text-xs uppercase tracking-widest">Quick Scan</span>
          </div>
          <div className="flex gap-3">
            <input
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/60 font-mono"
              placeholder="paste sender email or domain... e.g. noreply@verify-paypal.xyz"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuickScan()}
            />
            <button
              onClick={handleQuickScan}
              disabled={scanning}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {scanning ? (
                <><span className="animate-spin">⟳</span> Scanning...</>
              ) : (
                <><Search size={14} /> Scan</>
              )}
            </button>
          </div>

          {scanResult && (
            <div className={`mt-3 p-3 rounded-lg border text-sm flex items-center justify-between ${
              scanResult.risk_label === "DANGEROUS" ? "bg-red-500/10 border-red-500/30 text-red-300" :
              scanResult.risk_label === "SUSPICIOUS" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}>
              <span>{scanResult.explanation}</span>
              <span className="font-bold text-lg ml-4">{scanResult.risk_score}/100</span>
            </div>
          )}
        </div>

        {/* ── Stat cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Activity}      label="Total Scans"  value={MOCK_STATS.total_scans.toLocaleString()} sub="all time"          color="bg-blue-500/20 text-blue-400" />
          <StatCard icon={Zap}           label="Dangerous"    value={MOCK_STATS.dangerous}  sub="last 7 days"       color="bg-red-500/20 text-red-400" />
          <StatCard icon={AlertTriangle} label="Suspicious"   value={MOCK_STATS.suspicious} sub="last 7 days"       color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={TrendingUp}    label="Avg Risk"     value={`${MOCK_STATS.avg_risk_score}`} sub="score / 100"  color="bg-purple-500/20 text-purple-400" />
        </div>

        {/* ── Charts row ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Area chart */}
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm text-zinc-400 uppercase tracking-widest mb-4">Scan Volume · Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MOCK_TREND}>
                <defs>
                  <linearGradient id="gDanger" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSuspect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#e4e4e7" }} />
                <Area type="monotone" dataKey="dangerous"  stroke="#ef4444" fill="url(#gDanger)"  strokeWidth={2} />
                <Area type="monotone" dataKey="suspicious" stroke="#f59e0b" fill="url(#gSuspect)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm text-zinc-400 uppercase tracking-widest mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#e4e4e7" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span className="text-zinc-400">{d.name}</span>
                  </span>
                  <span className="text-zinc-300 font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom row: Live feed + Keywords ───────────── */}
        <div className="grid grid-cols-5 gap-6">

          {/* Live threat feed */}
          <div className="col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-zinc-400 uppercase tracking-widest">Live Threat Feed</h2>
              <span className="text-xs text-zinc-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                real-time
              </span>
            </div>
            <div className="space-y-2">
              {feed.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <Globe size={14} className="text-zinc-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 text-sm font-mono truncate">{item.domain}</p>
                    {item.keywords.length > 0 && (
                      <p className="text-zinc-600 text-xs truncate">{item.keywords.join(", ")}</p>
                    )}
                  </div>
                  <RiskBadge label={item.label} />
                  <span className="text-zinc-200 font-mono font-bold text-sm w-12 text-right">{item.score}</span>
                  <span className="text-zinc-600 text-xs w-14 text-right flex items-center gap-1">
                    <Clock size={10} />{item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top keywords */}
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm text-zinc-400 uppercase tracking-widest mb-4">Top Phishing Keywords</h2>
            <div className="space-y-3">
              {MOCK_KEYWORDS.map((kw, i) => (
                <div key={kw.keyword}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 font-mono">{kw.keyword}</span>
                    <span className="text-zinc-500">{kw.count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(kw.count / 250) * 100}%`,
                        background: kw.avg_risk > 75 ? "#ef4444" : kw.avg_risk > 60 ? "#f59e0b" : "#22c55e"
                      }}
                    />
                  </div>
                  <p className="text-zinc-600 text-xs mt-0.5">avg risk: {kw.avg_risk}/100</p>
                </div>
              ))}
            </div>

            {/* Pipeline status */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Airflow Pipeline</h3>
              {[
                { name: "email_ingestion",    status: "success", ago: "2m" },
                { name: "domain_enrichment",  status: "success", ago: "2m" },
                { name: "feature_engineering", status: "success", ago: "1h" },
              ].map(dag => (
                <div key={dag.name} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-zinc-400 font-mono">{dag.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-zinc-600">{dag.ago} ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
