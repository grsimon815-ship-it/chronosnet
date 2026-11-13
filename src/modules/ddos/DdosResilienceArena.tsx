import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, 
  Flame, 
  RotateCcw, 
  Play, 
  Pause, 
  Zap, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Server, 
  Network, 
  Cpu, 
  Layers,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { DdosAttackVector, DdosConfig, DdosNode, DdosPacket } from '../../types';
import { soundManager } from '../../utils/sound';

export const DdosResilienceArena: React.FC = () => {
  const [config, setConfig] = useState<DdosConfig>({
    activeVector: 'syn_flood',
    attackIntensity: 5, // 1 to 10
    tokenBucketEnabled: true,
    tokenBucketRate: 40,
    tokenBucketCapacity: 80,
    anycastEnabled: false,
    synCookiesEnabled: false,
    circuitBreakerThreshold: 85,
    adaptiveThrottling: true,
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [originCpu, setOriginCpu] = useState<number>(35);
  const [originMem, setOriginMem] = useState<number>(28);
  const [circuitTripped, setCircuitTripped] = useState<boolean>(false);
  const [p99LatencyMs, setP99LatencyMs] = useState<number>(18);
  const [packets, setPackets] = useState<DdosPacket[]>([]);
  const [tokens, setTokens] = useState<number>(80);

  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'warn' | 'danger' | 'success' }>>([
    { id: '1', time: '00:00:01', text: 'Serenity Edge Anti-DDoS Defense System online.', type: 'info' },
    { id: '2', time: '00:00:02', text: 'Token Bucket rate limiter active (Capacity: 80, Rate: 40/s).', type: 'info' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const addLog = useCallback((text: string, type: 'info' | 'warn' | 'danger' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
  }, []);

  // Update Config Helper
  const updateConfig = <K extends keyof DdosConfig>(key: K, val: DdosConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: val }));
    addLog(`Defense parameter [${String(key)}] updated to ${val}`, 'info');
  };

  // Refill Token Bucket
  useEffect(() => {
    if (!isRunning || !config.tokenBucketEnabled) return;

    const interval = setInterval(() => {
      setTokens(curr => Math.min(config.tokenBucketCapacity, curr + config.tokenBucketRate / 10));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, config.tokenBucketEnabled, config.tokenBucketCapacity, config.tokenBucketRate]);

  // Traffic & Attack Generator Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const newBatch: DdosPacket[] = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const originX = w * 0.85;
      const originY = h * 0.5;

      // 1. Generate Legitimate Client Requests (2 - 5 per tick)
      const legitCount = Math.floor(Math.random() * 3 + 2);
      for (let i = 0; i < legitCount; i++) {
        const clientY = h * (0.2 + Math.random() * 0.6);
        newBatch.push({
          id: Math.random().toString(36).substring(2, 7),
          from: 'client',
          to: 'origin',
          type: 'legit',
          protocol: 'TCP_SYN',
          sizeBytes: 64,
          progress: 0,
          dropped: false,
          path: [
            { x: 40, y: clientY },
            { x: w * 0.45, y: h * 0.5 },
            { x: originX, y: originY }
          ]
        });
      }

      // 2. Generate DDoS Attack Bots based on intensity (5 to 40 per tick)
      const botCount = config.attackIntensity * 4;
      for (let i = 0; i < botCount; i++) {
        const botY = h * (0.1 + Math.random() * 0.8);
        const isDns = config.activeVector === 'dns_amplification';
        newBatch.push({
          id: Math.random().toString(36).substring(2, 7),
          from: 'botnet',
          to: 'origin',
          type: 'malicious',
          protocol: isDns ? 'DNS_RESP' : config.activeVector === 'http_rapid_reset' ? 'HTTP2_RST' : 'TCP_SYN',
          sizeBytes: isDns ? 4096 : 64, // 64x amplification
          progress: 0,
          dropped: false,
          path: [
            { x: 40, y: botY },
            { x: w * 0.45, y: h * 0.5 },
            { x: originX, y: originY }
          ]
        });
      }

      setPackets(prev => [...prev.slice(-120), ...newBatch]);
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, config.attackIntensity, config.activeVector]);

  // Main Canvas Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      const scrubberX = w * 0.48;
      const originX = w * 0.85;
      const originY = h * 0.5;

      // Draw Defense Pipeline Shield Wall
      ctx.strokeStyle = config.tokenBucketEnabled ? 'rgba(124, 58, 237, 0.4)' : 'rgba(31, 33, 44, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(scrubberX, 20);
      ctx.lineTo(scrubberX, h - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Scrubber Node in center
      ctx.beginPath();
      ctx.arc(scrubberX, originY, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#12131a';
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('SCRUBBER', scrubberX, originY - 34);
      ctx.fillText(`${Math.floor(tokens)} TOKENS`, scrubberX, originY + 42);

      // Draw Origin Target Server
      ctx.beginPath();
      ctx.arc(originX, originY, 32, 0, Math.PI * 2);
      ctx.fillStyle = circuitTripped ? 'rgba(244, 63, 94, 0.2)' : '#12131a';
      ctx.strokeStyle = circuitTripped ? '#f43f5e' : (originCpu > 70 ? '#f59e0b' : '#38bdf8');
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e5ec';
      ctx.font = 'bold 11px Inter';
      ctx.fillText('ORIGIN SERVER', originX, originY - 42);
      ctx.font = '10px JetBrains Mono';
      ctx.fillStyle = originCpu > 70 ? '#fb7185' : '#38bdf8';
      ctx.fillText(`CPU: ${originCpu.toFixed(0)}%`, originX, originY + 48);

      // Update & Draw Packets
      if (isRunning) {
        setPackets(prev => {
          const nextPackets: DdosPacket[] = [];
          let incomingRpsDelta = 0;

          prev.forEach(p => {
            const nextProgress = p.progress + dt * 1.2;

            // When packet crosses the Scrubber Wall (progress ~ 0.5)
            if (p.progress < 0.5 && nextProgress >= 0.5 && !p.dropped) {
              let shouldDrop = false;

              // Anycast absorption
              if (config.anycastEnabled && p.type === 'malicious' && Math.random() < 0.55) {
                shouldDrop = true;
                p.dropReason = 'Anycast Scrubbing PoP Absorbed';
              }

              // SYN Cookies stateless filter
              if (config.synCookiesEnabled && p.type === 'malicious' && p.protocol === 'TCP_SYN') {
                shouldDrop = true;
                p.dropReason = 'SYN Cookie Validation Failed';
              }

              // Token Bucket filter
              if (!shouldDrop && config.tokenBucketEnabled) {
                if (tokens > 1) {
                  setTokens(t => Math.max(0, t - 1));
                } else {
                  // Bucket exhausted!
                  shouldDrop = true;
                  p.dropReason = 'Rate Limited (Token Bucket Empty)';
                }
              }

              if (shouldDrop) {
                p.dropped = true;
                soundManager.playMitigationBeep();
              }
            }

            if (nextProgress < 1) {
              nextPackets.push({ ...p, progress: nextProgress });
            } else {
              // Packet reached Origin Server!
              if (!p.dropped) {
                incomingRpsDelta += p.type === 'malicious' ? 2 : 1;
              }
            }
          });

          // Dynamic CPU / Pressure adjustment
          setOriginCpu(prevCpu => {
            const targetCpu = Math.min(100, 20 + incomingRpsDelta * 3 + (config.attackIntensity * 2));
            const smoothed = prevCpu + (targetCpu - prevCpu) * 0.1;

            if (smoothed > config.circuitBreakerThreshold && !circuitTripped) {
              setCircuitTripped(true);
              soundManager.playAlert();
            } else if (smoothed <= config.circuitBreakerThreshold - 15 && circuitTripped) {
              setCircuitTripped(false);
              soundManager.playConsensusChime();
            }

            return smoothed;
          });

          setP99LatencyMs(circuitTripped ? 2500 : Math.floor(18 + (originCpu / 100) * 80));

          return nextPackets;
        });
      }

      // Draw Packets on Canvas
      packets.forEach(p => {
        let px = 0;
        let py = 0;

        if (p.progress < 0.5) {
          // Travel from ingress to scrubber
          const t = p.progress / 0.5;
          px = p.path[0].x + (scrubberX - p.path[0].x) * t;
          py = p.path[0].y + (originY - p.path[0].y) * t;
        } else {
          // Travel from scrubber to origin
          const t = (p.progress - 0.5) / 0.5;
          px = scrubberX + (originX - scrubberX) * t;
          py = originY;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.dropped ? 2.5 : (p.type === 'malicious' ? 4.5 : 3.5), 0, Math.PI * 2);

        if (p.dropped) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
        } else if (p.type === 'malicious') {
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
        }
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [packets, tokens, config, isRunning, originCpu, circuitTripped]);

  return (
    <div className="flex flex-col h-full bg-[#0a0b0e] text-[#e2e5ec] overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#1f212c] bg-[#12131a]/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider font-mono uppercase">DDOS RESILIENCE ARENA</span>
          </div>
          <div className="text-xs text-[#858b9f]">
            Active Attack Vector: <span className="text-rose-400 font-mono uppercase font-bold">{config.activeVector.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Vector Switcher */}
        <div className="flex items-center space-x-2">
          {(['syn_flood', 'dns_amplification', 'http_rapid_reset'] as DdosAttackVector[]).map(vec => (
            <button
              key={vec}
              onClick={() => {
                updateConfig('activeVector', vec);
                addLog(`Switched attack vector to ${vec.toUpperCase()}`, 'warn');
              }}
              className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                config.activeVector === vec 
                  ? 'bg-rose-600 text-white shadow-glow-rose font-bold' 
                  : 'bg-[#161822] text-[#858b9f] hover:text-[#e2e5ec] border border-[#1f212c]'
              }`}
            >
              {vec.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#e2e5ec]"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isRunning ? 'PAUSE' : 'RESUME'}</span>
          </button>
          <button
            onClick={() => {
              setOriginCpu(30);
              setCircuitTripped(false);
              setTokens(80);
              setPackets([]);
              addLog('DDoS Stress test environment reset.', 'info');
            }}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#858b9f] hover:text-[#e2e5ec]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Left Visualization Area */}
        <div className="col-span-8 flex flex-col relative border-r border-[#1f212c] bg-radial from-[#12131a] to-[#0a0b0e]">
          {/* Quick HUD Metrics */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-[#12131a]/90 border border-[#1f212c] text-xs font-mono">
              <span className="text-[#858b9f]">P99 Latency:</span>
              <span className={p99LatencyMs > 200 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{p99LatencyMs}ms</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-[#12131a]/90 border border-[#1f212c] text-xs font-mono">
              <span className="text-[#858b9f]">Origin Load:</span>
              <span className={originCpu > 70 ? 'text-rose-400 font-bold' : 'text-[#38bdf8] font-bold'}>{originCpu.toFixed(0)}%</span>
            </div>
          </div>

          {/* Circuit Breaker Status Banner */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-xs font-mono ${
              circuitTripped 
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-glow-rose' 
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            }`}>
              {circuitTripped ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{circuitTripped ? 'CIRCUIT BREAKER TRIPPED! ORIGIN SHEDDING LOAD' : 'SERVICE HEALTHY & RESILIENT'}</span>
            </div>
          </div>

          {/* High-speed Particle Canvas */}
          <canvas
            ref={canvasRef}
            className="flex-1 w-full h-full"
          />

          {/* Bottom Defense Tuning Deck */}
          <div className="h-28 border-t border-[#1f212c] bg-[#0d0e14] px-4 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#858b9f] font-mono">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[#e2e5ec] font-semibold">ATTACK INTENSITY & VOLUMETRIC SCALING</span>
              </span>
              <span>Vector: {config.activeVector.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-6 py-1">
              <div className="flex flex-col space-y-1 bg-[#161822] p-2 rounded border border-[#1f212c]">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#e2e5ec]">Botnet Swarm Size:</span>
                  <span className="text-rose-400 font-bold">Tier {config.attackIntensity} / 10 ({config.attackIntensity * 120} Gbps equiv)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={config.attackIntensity}
                  onChange={(e) => updateConfig('attackIntensity', parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-[#0a0b0e] rounded-lg"
                />
              </div>

              <div className="flex flex-col space-y-1 bg-[#161822] p-2 rounded border border-[#1f212c]">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#e2e5ec]">Token Bucket Refill Rate:</span>
                  <span className="text-[#38bdf8] font-bold">{config.tokenBucketRate} tokens/sec</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={config.tokenBucketRate}
                  onChange={(e) => updateConfig('tokenBucketRate', parseInt(e.target.value, 10))}
                  className="w-full accent-[#7c3aed] cursor-pointer h-1.5 bg-[#0a0b0e] rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Cockpit Panel: Defense Toggles & Stream */}
        <div className="col-span-4 flex flex-col h-full bg-[#12131a] overflow-hidden">
          {/* Active Mitigation Layers */}
          <div className="p-4 border-b border-[#1f212c]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-[#858b9f] flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#7c3aed]" />
                <span>ACTIVE MITIGATION STACK</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30">
                L3 - L7 SHIELD
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Token Bucket Toggle */}
              <div className="flex items-center justify-between p-2 rounded bg-[#161822] border border-[#1f212c]">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#e2e5ec]">Token Bucket Rate Limiter</div>
                  <div className="text-[10px] text-[#858b9f]">Drops burst overflows beyond burst limit</div>
                </div>
                <button
                  onClick={() => updateConfig('tokenBucketEnabled', !config.tokenBucketEnabled)}
                  className={`px-3 py-1 text-xs font-mono rounded font-bold transition-all ${
                    config.tokenBucketEnabled ? 'bg-emerald-600 text-white' : 'bg-[#0a0b0e] text-[#858b9f] border border-[#1f212c]'
                  }`}
                >
                  {config.tokenBucketEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Anycast BGP Scrubbing Toggle */}
              <div className="flex items-center justify-between p-2 rounded bg-[#161822] border border-[#1f212c]">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#e2e5ec]">Anycast Scrubbing Centers</div>
                  <div className="text-[10px] text-[#858b9f]">Disperses flood to edge PoPs via BGP</div>
                </div>
                <button
                  onClick={() => updateConfig('anycastEnabled', !config.anycastEnabled)}
                  className={`px-3 py-1 text-xs font-mono rounded font-bold transition-all ${
                    config.anycastEnabled ? 'bg-[#7c3aed] text-white shadow-glow-amethyst' : 'bg-[#0a0b0e] text-[#858b9f] border border-[#1f212c]'
                  }`}
                >
                  {config.anycastEnabled ? 'ACTIVE' : 'OFFLINE'}
                </button>
              </div>

              {/* SYN Cookies Stateless Filter */}
              <div className="flex items-center justify-between p-2 rounded bg-[#161822] border border-[#1f212c]">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#e2e5ec]">SYN Cookies Protection</div>
                  <div className="text-[10px] text-[#858b9f]">Prevents TCP SYN queue memory exhaustion</div>
                </div>
                <button
                  onClick={() => updateConfig('synCookiesEnabled', !config.synCookiesEnabled)}
                  className={`px-3 py-1 text-xs font-mono rounded font-bold transition-all ${
                    config.synCookiesEnabled ? 'bg-[#38bdf8] text-[#0a0b0e]' : 'bg-[#0a0b0e] text-[#858b9f] border border-[#1f212c]'
                  }`}
                >
                  {config.synCookiesEnabled ? 'ACTIVE' : 'OFFLINE'}
                </button>
              </div>
            </div>
          </div>

          {/* Defense Theory Card */}
          <div className="p-4 border-b border-[#1f212c] bg-[#161822]/60">
            <div className="text-xs font-mono text-rose-400 mb-2 font-semibold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>AMPLIFICATION & STATE EXHAUSTION</span>
            </div>
            <p className="text-[11px] text-[#858b9f] leading-relaxed">
              In a <strong className="text-[#e2e5ec]">DNS Amplification</strong> attack, the attacker spoofs UDP packets with the victim&apos;s source IP to open resolvers. Small 64-byte queries trigger 4,096-byte DNSSEC responses, achieving a massive <strong className="text-rose-400">64x bandwidth multiplier</strong>.
            </p>
          </div>

          {/* Event Stream */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#858b9f] flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>TELEMETRY & MITIGATION STREAM</span>
              </span>
              <span className="text-[10px] font-mono text-[#858b9f]">{logs.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`p-2 rounded border text-left leading-tight ${
                    log.type === 'danger'
                      ? 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                      : log.type === 'warn'
                      ? 'bg-amber-950/30 border-amber-900/60 text-amber-300'
                      : log.type === 'success'
                      ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300'
                      : 'bg-[#161822] border-[#1f212c] text-[#858b9f]'
                  }`}
                >
                  <span className="text-[#858b9f] text-[10px] mr-2">[{log.time}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
