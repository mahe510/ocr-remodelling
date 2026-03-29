import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, AlertTriangle, CheckCircle2, Loader2,
  Network, Layers3, Search, BarChart3, X, ChevronDown,
  Shield, Zap, Eye, TrendingUp, Users, Activity
} from "lucide-react";

/* ─────────────────────────────────────────
   UTILITIES
───────────────────────────────────────── */
function getRisk(score) {
  if (score >= 80) return {
    label: "High Risk", short: "HIGH",
    chip: "bg-red-500/15 text-red-400 border-red-500/30 ring-red-500/20",
    bar: "from-red-600 to-red-400",
    glow: "shadow-red-500/20",
    dot: "bg-red-400",
    panel: "border-red-500/20 bg-red-500/5",
    icon: AlertTriangle,
  };
  if (score >= 60) return {
    label: "Medium Risk", short: "MED",
    chip: "bg-amber-500/15 text-amber-400 border-amber-500/30 ring-amber-500/20",
    bar: "from-amber-500 to-amber-400",
    glow: "shadow-amber-500/20",
    dot: "bg-amber-400",
    panel: "border-amber-500/20 bg-amber-500/5",
    icon: AlertTriangle,
  };
  return {
    label: "Low Risk", short: "LOW",
    chip: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-emerald-500/20",
    bar: "from-emerald-500 to-emerald-400",
    glow: "shadow-emerald-500/20",
    dot: "bg-emerald-400",
    panel: "border-emerald-500/20 bg-emerald-500/5",
    icon: CheckCircle2,
  };
}

function normalizeHeatmap(heatmapObj) {
  const names = Object.keys(heatmapObj || {});
  const matrix = names.map((row) =>
    names.map((col) => {
      const v = heatmapObj?.[row]?.[col];
      return typeof v === "number" ? v : 0;
    })
  );
  return { names, matrix };
}

function cleanName(name) {
  return (name || "").replace(/\.[^.]+$/i, "");
}

function heatColor(value) {
  if (value >= 0.85) return { bg: "rgba(220,38,38,0.85)", text: "#fff" };
  if (value >= 0.70) return { bg: "rgba(245,158,11,0.8)", text: "#fff" };
  if (value >= 0.55) return { bg: "rgba(234,179,8,0.7)", text: "#1a1a2e" };
  if (value >= 0.40) return { bg: "rgba(132,204,22,0.6)", text: "#1a1a2e" };
  if (value >= 0.25) return { bg: "rgba(56,189,248,0.5)", text: "#1a1a2e" };
  return { bg: "rgba(255,255,255,0.04)", text: "#94a3b8" };
}

/* ─────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = typeof value === "number" ? value : parseFloat(value) || 0;
    if (start === end) { setDisplay(end); return; }
    const duration = 900;
    const step = (end - start) / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accent = "#6366f1", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm"
    >
      <div className="absolute inset-0 opacity-30" style={{
        background: `radial-gradient(circle at top right, ${accent}22 0%, transparent 60%)`
      }} />
      <div className="relative">
        <div className="mb-4 inline-flex rounded-xl p-2.5" style={{ background: `${accent}22` }}>
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <p className="text-3xl font-bold tracking-tight text-white">
          {typeof value === "number"
            ? <AnimatedNumber value={value} />
            : value}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-300">{label}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   HEATMAP LEGEND
───────────────────────────────────────── */
function HeatmapLegend() {
  const stops = [
    { label: "0–24%", bg: "rgba(255,255,255,0.04)", text: "#94a3b8" },
    { label: "25–39%", bg: "rgba(56,189,248,0.5)", text: "#0f172a" },
    { label: "40–54%", bg: "rgba(132,204,22,0.6)", text: "#0f172a" },
    { label: "55–69%", bg: "rgba(234,179,8,0.7)", text: "#0f172a" },
    { label: "70–84%", bg: "rgba(245,158,11,0.8)", text: "#fff" },
    { label: "≥ 85%", bg: "rgba(220,38,38,0.85)", text: "#fff" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {stops.map((s) => (
        <div key={s.label} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border border-white/10"
          style={{ background: s.bg, color: s.text === "#fff" ? "#fff" : "#94a3b8" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: s.text === "#fff" ? "#fff" : s.text }} />
          {s.label}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   PAIR CARD
───────────────────────────────────────── */
function PairCard({ pair, rank }) {
  const risk = getRisk(pair.similarity);
  const RiskIcon = risk.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.07, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${risk.panel} ${risk.glow}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Rank badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8 text-sm font-bold text-slate-300 ring-1 ring-white/10">
          #{rank}
        </div>

        {/* File names */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-white">
            <span className="max-w-[160px] truncate">{cleanName(pair.file1)}</span>
            <span className="shrink-0 text-slate-500">↔</span>
            <span className="max-w-[160px] truncate">{cleanName(pair.file2)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Manual review recommended</p>
        </div>

        {/* Score + badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-white">{pair.similarity}%</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">similarity</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ring-1 ${risk.chip}`}>
            <RiskIcon className="h-3.5 w-3.5" />
            {risk.short}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pair.similarity}%` }}
            transition={{ delay: rank * 0.07 + 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${risk.bar}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   BAR CHART — ranked pairs
───────────────────────────────────────── */
function RankedBarChart({ pairs }) {
  const top = pairs.slice(0, 8);
  const max = Math.max(...top.map((p) => p.similarity), 1);
  return (
    <div className="space-y-3">
      {top.map((pair, i) => {
        const risk = getRisk(pair.similarity);
        return (
          <div key={i} className="flex items-center gap-3">
            <p className="w-32 shrink-0 truncate text-right text-xs text-slate-400 font-medium">
              {cleanName(pair.file1).slice(0, 10)}↔{cleanName(pair.file2).slice(0, 10)}
            </p>
            <div className="relative flex-1 h-7 rounded-lg overflow-hidden bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(pair.similarity / max) * 100}%` }}
                transition={{ delay: i * 0.08 + 0.3, duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-lg bg-gradient-to-r ${risk.bar} opacity-80`}
              />
              <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white">
                {pair.similarity}%
              </span>
            </div>
            <div className={`h-2 w-2 shrink-0 rounded-full ${risk.dot}`} />
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   MINI NETWORK SVG
───────────────────────────────────────── */
function NetworkGraph({ network, allNames }) {
  const svgW = 480, svgH = 280;
  const nodes = useMemo(() => {
    if (!allNames?.length) return {};
    const n = allNames.length;
    const cx = svgW / 2, cy = svgH / 2;
    const r = Math.min(svgW, svgH) * 0.38;
    const map = {};
    allNames.forEach((name, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      map[name] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), name };
    });
    return map;
  }, [allNames]);

  if (!network?.length || !Object.keys(nodes).length) return (
    <div className="flex h-48 items-center justify-center text-sm text-slate-500">
      No network edges above threshold
    </div>
  );

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-full">
      {/* edges */}
      {network.map((edge, i) => {
        const s = nodes[edge.source] || nodes[Object.keys(nodes).find(k => k.startsWith(edge.source.replace(/\.txt$/, "")))];
        const t = nodes[edge.target] || nodes[Object.keys(nodes).find(k => k.startsWith(edge.target.replace(/\.txt$/, "")))];
        if (!s || !t) return null;
        const risk = getRisk(edge.weight);
        const color = edge.weight >= 80 ? "#ef4444" : edge.weight >= 60 ? "#f59e0b" : "#10b981";
        return (
          <g key={i}>
            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={color} strokeWidth={Math.max(1, edge.weight / 25)} strokeOpacity={0.6} />
            <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 5}
              textAnchor="middle" fontSize="9" fill={color} opacity="0.9" fontWeight="700">
              {edge.weight}%
            </text>
          </g>
        );
      })}
      {/* nodes */}
      {Object.values(nodes).map((node, i) => (
        <g key={node.name}>
          <circle cx={node.x} cy={node.y} r={20} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
          <circle cx={node.x} cy={node.y} r={20} fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth={1} strokeOpacity={0.5} />
          <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="8" fill="#cbd5e1" fontWeight="600">
            {cleanName(node.name).slice(0, 6)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, accent = "#6366f1" }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="mt-0.5 shrink-0 rounded-xl p-2.5" style={{ background: `${accent}22` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN APP
───────────────────────────────────────── */
export default function AssignmentSimilarity() {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

  const { names, matrix } = useMemo(() => {
    if (!result?.heatmap) return { names: [], matrix: [] };
    return normalizeHeatmap(result.heatmap);
  }, [result]);

  const topPair = result?.pairs?.[0] || null;
  const suspiciousPairs = result?.pairs?.length || 0;
  const clusterCount = result?.clusters?.length || 0;
  const edgeCount = result?.network?.length || 0;

  const handleFiles = (selected) => {
    const pdfs = Array.from(selected || []).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    setFiles(pdfs);
    setError("");
  };

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const simulateProgress = () => {
    setProgress(0);
    const stages = [
      { target: 30, duration: 800 },
      { target: 65, duration: 1200 },
      { target: 85, duration: 1000 },
      { target: 95, duration: 600 },
    ];
    let current = 0;
    stages.forEach(({ target, duration }, idx) => {
      setTimeout(() => {
        const start = current;
        const end = target;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const pct = Math.min(elapsed / duration, 1);
          setProgress(Math.round(start + (end - start) * pct));
          if (pct < 1) requestAnimationFrame(animate);
          else current = end;
        };
        requestAnimationFrame(animate);
      }, idx * 600);
    });
  };

  const onSubmit = async () => {
    if (files.length < 2) { setError("Please upload at least 2 PDF files."); return; }
    try {
      setLoading(true);
      setError("");
      setResult(null);
      simulateProgress();

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const response = await fetch("http://127.0.0.1:8000/check", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Analysis failed.");
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      setTimeout(() => {
        setResult(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
      }, 300);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{
      background: "linear-gradient(135deg, #0a0e1a 0%, #0d1525 40%, #0a1020 100%)",
      fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif",
    }}>
      {/* ── HEADER ── */}
      <header className="border-b border-white/6 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/40">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">SimilarCheck</span>
              <span className="ml-2 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Beta</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>System online</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-16">

        {/* ── HERO ── */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Plagiarism Detection
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
            Assignment<br />
            <span style={{ background: "linear-gradient(90deg, #818cf8, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Similarity
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed">
            Upload student PDFs and instantly generate a comprehensive similarity report — heatmaps, ranked pairs, clusters, and network graphs — ready to present.
          </p>
        </motion.section>

        {/* ── UPLOAD PANEL ── */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">

          {/* Drop zone + controls */}
          <div className="rounded-3xl border border-white/8 bg-white/3 p-8 backdrop-blur-sm space-y-6">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer ${
                dragActive
                  ? "border-indigo-400 bg-indigo-500/8 scale-[1.01]"
                  : "border-white/12 bg-white/2 hover:border-indigo-500/40 hover:bg-indigo-500/4"
              }`}
            >
              <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${dragActive ? "bg-indigo-500/20 ring-2 ring-indigo-400/40" : "bg-white/6 ring-1 ring-white/10"}`}>
                <Upload className={`h-7 w-7 transition-colors ${dragActive ? "text-indigo-400" : "text-slate-400"}`} />
              </div>
              <p className="text-base font-semibold text-white">
                {dragActive ? "Drop your files here" : "Drag & drop PDF files"}
              </p>
              <p className="mt-2 text-sm text-slate-500">or click to browse — at least 2 files required</p>
              <label className="mt-6 cursor-pointer">
                <input type="file" accept=".pdf,application/pdf" multiple className="hidden"
                  onChange={(e) => handleFiles(e.target.files)} />
                <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-colors">
                  <FileText className="h-4 w-4" />
                  Select Files
                </span>
              </label>
            </div>

            {/* File list */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-300">Selected files</p>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">{files.length} files</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {files.map((file) => (
                      <motion.div key={file.name}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                          <FileText className="h-4 w-4 text-red-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{file.name}</p>
                          <p className="text-[10px] text-slate-500 mono">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => removeFile(file.name)}
                          className="shrink-0 rounded-lg p-1 text-slate-600 opacity-0 transition group-hover:opacity-100 hover:bg-white/8 hover:text-red-400">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3">
              <button onClick={onSubmit} disabled={loading}
                className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</>) : (<><Search className="h-4 w-4" />Generate Report</>)}
              </button>
              <button onClick={() => { setFiles([]); setResult(null); setError(""); }}
                className="rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/8">
                Reset
              </button>
            </div>

            {/* Progress bar */}
            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Running OCR · Computing TF-IDF · Detecting clusters</span>
                    <span className="mono text-indigo-400 font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
                      animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <div className="flex gap-4">
                    {["Text Extraction", "Similarity Scoring", "Report Generation"].map((s, i) => (
                      <div key={s} className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors ${progress > i * 33 ? "text-indigo-400" : "text-slate-600"}`}>
                        <div className={`h-1.5 w-1.5 rounded-full transition-colors ${progress > i * 33 ? "bg-indigo-400" : "bg-slate-700"}`} />
                        {s}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* What you'll get */}
          <div className="rounded-3xl border border-white/8 bg-white/3 p-8 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">What you'll get</p>
            <div className="space-y-4">
              {[
                { icon: BarChart3, title: "Ranked Pairs", desc: "Strongest overlaps first — each with a similarity score and risk level.", color: "#6366f1" },
                { icon: Eye, title: "Similarity Heatmap", desc: "Full n×n matrix comparing every document pair visually.", color: "#f59e0b" },
                { icon: Users, title: "Cluster Groups", desc: "See which documents behave similarly as a group, not just pairwise.", color: "#10b981" },
                { icon: Network, title: "Network Graph", desc: "Visual link map of documents above the similarity threshold.", color: "#ec4899" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-white/6 bg-white/3 p-4">
                  <div className="mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                    <Icon className="h-4.5 w-4.5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── RESULTS ── */}
        <AnimatePresence>
          {result && (
            <motion.section ref={resultsRef}
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-10">

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/4 px-5 py-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Analysis Report</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* ── STAT CARDS ── */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={FileText} label="Files Analyzed" value={files.length}
                  sub="PDFs in this run" accent="#6366f1" delay={0} />
                <StatCard icon={AlertTriangle} label="Suspicious Pairs" value={suspiciousPairs}
                  sub="Above threshold" accent="#f59e0b" delay={0.08} />
                <StatCard icon={TrendingUp} label="Top Match"
                  value={topPair ? `${topPair.similarity}%` : "—"}
                  sub={topPair ? `${cleanName(topPair.file1)} ↔ ${cleanName(topPair.file2)}` : "No strong pair"}
                  accent="#ef4444" delay={0.16} />
                <StatCard icon={Layers3} label="Groups Found" value={clusterCount}
                  sub={`${edgeCount} suspicious link(s)`} accent="#10b981" delay={0.24} />
              </div>

              {/* ── RANKED PAIRS + BAR CHART ── */}
              <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">

                {/* Ranked pair cards */}
                <div className="rounded-3xl border border-white/8 bg-white/3 p-8">
                  <SectionHeader icon={Search} title="Suspicious Pairs"
                    subtitle="Sorted by similarity score — review from top to bottom." accent="#6366f1" />
                  <div className="space-y-4">
                    {result.pairs?.length ? (
                      result.pairs.map((pair, i) => <PairCard key={`${pair.file1}${pair.file2}`} pair={pair} rank={i + 1} />)
                    ) : (
                      <div className="rounded-2xl border border-white/6 bg-white/3 p-5 text-sm text-slate-500">
                        No pairs crossed the similarity threshold. All assignments appear unique.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bar chart + risk legend */}
                <div className="space-y-8">
                  <div className="rounded-3xl border border-white/8 bg-white/3 p-8">
                    <SectionHeader icon={BarChart3} title="Similarity Rankings"
                      subtitle="Top document pairs visualized." accent="#f59e0b" />
                    {result.pairs?.length
                      ? <RankedBarChart pairs={result.pairs} />
                      : <p className="text-sm text-slate-500">No data available.</p>}
                  </div>

                  {/* Risk legend */}
                  <div className="rounded-3xl border border-white/8 bg-white/3 p-8">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">Risk Level Guide</p>
                    <div className="space-y-3">
                      {[
                        { label: "Low Risk", range: "< 60%", desc: "Limited overlap. Unlikely to indicate copying.", color: "#10b981", icon: CheckCircle2 },
                        { label: "Medium Risk", range: "60–79%", desc: "Worth manual review — shared structure or phrasing.", color: "#f59e0b", icon: AlertTriangle },
                        { label: "High Risk", range: "≥ 80%", desc: "Strong overlap. Prioritise these pairs immediately.", color: "#ef4444", icon: AlertTriangle },
                      ].map(({ label, range, desc, color, icon: Icon }) => (
                        <div key={label} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 p-4">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                          <div>
                            <p className="text-sm font-semibold text-white">{label} <span className="mono text-xs font-normal text-slate-500">{range}</span></p>
                            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── HEATMAP ── */}
              <div className="rounded-3xl border border-white/8 bg-white/3 p-8">
                <SectionHeader icon={BarChart3} title="Similarity Heatmap"
                  subtitle="Full document-vs-document matrix. Darker = higher similarity." accent="#a78bfa" />
                <HeatmapLegend />
                <div className="mt-6 overflow-auto rounded-2xl border border-white/8">
                  <table className="border-collapse text-xs" style={{ minWidth: `${names.length * 100 + 160}px` }}>
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 border-b border-r border-white/8 bg-slate-900 px-4 py-3 text-left font-semibold text-slate-400 min-w-[140px]">Document</th>
                        {names.map((name) => (
                          <th key={name} className="border-b border-r border-white/8 px-3 py-3 text-center font-semibold text-slate-400 min-w-[90px]">
                            {cleanName(name)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {names.map((rowName, rIdx) => (
                        <tr key={rowName}>
                          <td className="sticky left-0 z-10 border-b border-r border-white/8 bg-slate-900 px-4 py-3 font-semibold text-slate-300">
                            {cleanName(rowName)}
                          </td>
                          {matrix[rIdx].map((value, cIdx) => {
                            const { bg, text } = heatColor(value);
                            return (
                              <td key={cIdx}
                                className="border-b border-r border-white/5 px-3 py-3 text-center font-bold mono transition-all"
                                style={{ background: bg, color: text }}
                                title={`${cleanName(rowName)} vs ${cleanName(names[cIdx])}: ${(value * 100).toFixed(0)}%`}
                              >
                                {(value * 100).toFixed(0)}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── CLUSTERS + NETWORK ── */}
              <div className="grid gap-8 xl:grid-cols-2">

                {/* Clusters */}
                <div className="rounded-3xl border border-white/8 bg-white/3 p-8">
                  <SectionHeader icon={Layers3} title="Document Clusters"
                    subtitle="Groups of assignments that are mutually similar." accent="#10b981" />
                  <div className="space-y-4">
                    {result.clusters?.length ? (
                      result.clusters.map((cluster, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-2xl border border-white/8 bg-white/3 p-5"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Cluster {i + 1}</p>
                            <span className="ml-auto text-xs text-slate-500">{cluster.length} docs</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cluster.map((name) => (
                              <span key={name} className="rounded-lg border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200">
                                {cleanName(name)}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/6 bg-white/3 p-5 text-sm text-slate-500">No clusters detected.</div>
                    )}
                  </div>
                </div>

                {/* Network */}
                <div className="rounded-3xl border border-white/8 bg-white/3 p-8">
                  <SectionHeader icon={Network} title="Network Graph"
                    subtitle="Documents connected above the similarity threshold." accent="#ec4899" />

                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4 mb-5">
                    <NetworkGraph network={result.network} allNames={names} />
                  </div>

                  <div className="space-y-3">
                    {result.network?.length ? (
                      result.network.map((edge, i) => {
                        const risk = getRisk(edge.weight);
                        return (
                          <div key={i} className={`flex items-center justify-between rounded-xl border p-3.5 ${risk.panel}`}>
                            <p className="text-sm font-medium text-slate-200">
                              <span className="text-slate-300">{cleanName(edge.source)}</span>
                              <span className="mx-2 text-slate-600">→</span>
                              <span className="text-slate-300">{cleanName(edge.target)}</span>
                            </p>
                            <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold mono ${risk.chip}`}>
                              {edge.weight}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-white/6 bg-white/3 p-4 text-sm text-slate-500">
                        No suspicious connections above threshold.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-24 border-t border-white/6 px-6 py-8 text-center text-xs text-slate-600">
        SimilarCheck · Assignment Similarity Detection · Results are indicative and require human review
      </footer>
    </div>
  );
}
