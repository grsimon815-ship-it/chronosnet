import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clock, 
  Send, 
  RotateCcw, 
  Play, 
  Pause, 
  Cpu, 
  GitCommit, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Activity, 
  ArrowRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { ClockNode, ClockEvent, ClockMessage } from '../../types';
import { soundManager } from '../../utils/sound';

const INITIAL_CLOCKS: ClockNode[] = [
  { id: 'node-A', name: 'Node Alpha (Stock Exchange Server)', oscillatorDriftPpm: 25, physicalTimeMs: 10000, logicalLamportTime: 1, vectorClock: [1, 0, 0], events: [], balance: 1000 },
  { id: 'node-B', name: 'Node Beta (Arbitrage Trading Bot)', oscillatorDriftPpm: -40, physicalTimeMs: 9940, logicalLamportTime: 1, vectorClock: [0, 1, 0], events: [], balance: 500 },
  { id: 'node-C', name: 'Node Gamma (Clearing House Clearing)', oscillatorDriftPpm: 10, physicalTimeMs: 10010, logicalLamportTime: 1, vectorClock: [0, 0, 1], events: [], balance: 2000 },
];

export const RelativisticClockDrift: React.FC = () => {
  const [nodes, setNodes] = useState<ClockNode[]>(INITIAL_CLOCKS);
  const [messages, setMessages] = useState<ClockMessage[]>([]);
  const [events, setEvents] = useState<ClockEvent[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [anomalyCount, setAnomalyCount] = useState<number>(0);
  const [clockMode, setClockMode] = useState<'physical' | 'lamport' | 'vector'>('vector');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-A');

  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'warn' | 'danger' | 'success' }>>([
    { id: '1', time: '00:00:01', text: 'Distributed Clock System initialized. 3 Nodes with independent quartz oscillators.', type: 'info' },
    { id: '2', time: '00:00:02', text: 'Vector Clocks active for strict causal relationship tracing [A, B, C].', type: 'info' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const addLog = useCallback((text: string, type: 'info' | 'warn' | 'danger' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
  }, []);

  // Update drift rates
  const setDriftPpm = (nodeId: string, ppm: number) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, oscillatorDriftPpm: ppm } : n));
    addLog(`Node [${nodeId}] oscillator drift set to ${ppm > 0 ? '+' : ''}${ppm} PPM`, 'info');
  };

  // Trigger Local Computation Event
  const triggerLocalEvent = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextLamport = n.logicalLamportTime + 1;
        const nextVector = [...n.vectorClock];
        const idx = n.id === 'node-A' ? 0 : n.id === 'node-B' ? 1 : 2;
        nextVector[idx] += 1;

        const newEvent: ClockEvent = {
          id: Math.random().toString(36).substring(2, 7),
          nodeId,
          type: 'local',
          label: `Local Op (${n.name.split(' ')[1]})`,
          timestampPhysical: n.physicalTimeMs,
          lamportTime: nextLamport,
          vectorClock: nextVector
        };

        setEvents(e => [...e.slice(-30), newEvent]);
        soundManager.playTick(750);

        return {
          ...n,
          logicalLamportTime: nextLamport,
          vectorClock: nextVector,
          events: [...n.events, newEvent]
        };
      }
      return n;
    }));
  };

  // Send Message between distributed nodes
  const sendMessage = (fromId: string, toId: string, payload = 'TRANSFER $250') => {
    const sender = nodes.find(n => n.id === fromId);
    const receiver = nodes.find(n => n.id === toId);
    if (!sender || !receiver) return;

    // Increment sender's clocks for the send event
    const sendLamport = sender.logicalLamportTime + 1;
    const sendVector = [...sender.vectorClock];
    const senderIdx = sender.id === 'node-A' ? 0 : sender.id === 'node-B' ? 1 : 2;
    sendVector[senderIdx] += 1;

    const sendEvent: ClockEvent = {
      id: Math.random().toString(36).substring(2, 7),
      nodeId: fromId,
      type: 'send',
      label: `Send "${payload}" to ${toId}`,
      timestampPhysical: sender.physicalTimeMs,
      lamportTime: sendLamport,
      vectorClock: sendVector
    };

    setEvents(e => [...e.slice(-30), sendEvent]);

    setNodes(prev => prev.map(n => n.id === fromId ? {
      ...n,
      logicalLamportTime: sendLamport,
      vectorClock: sendVector,
      balance: n.balance - 250,
      events: [...n.events, sendEvent]
    } : n));

    const newMsg: ClockMessage = {
      id: Math.random().toString(36).substring(2, 8),
      from: fromId,
      to: toId,
      payload,
      sendPhysicalTime: sender.physicalTimeMs,
      sendLamportTime: sendLamport,
      sendVectorClock: sendVector,
      progress: 0,
      transitDelayMs: 60 + Math.random() * 40
    };

    setMessages(prev => [...prev, newMsg]);
    soundManager.playTick(600);
    addLog(`[${sender.name.split(' ')[1]}] sent "${payload}" [Lamport: ${sendLamport}, VC: <${sendVector.join(',')}>]`, 'info');
  };

  // Simulate Clock Drift progression every tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setNodes(prev => prev.map(n => {
        // Physical clock increments based on 100ms real time + drift PPM
        // 1 PPM = 1 microsecond per second
        const driftFactor = 1 + (n.oscillatorDriftPpm / 1000);
        return {
          ...n,
          physicalTimeMs: n.physicalTimeMs + 100 * driftFactor
        };
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Space-time Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Node Timeline Y coordinates
      const trackPositions: Record<string, number> = {
        'node-A': height * 0.22,
        'node-B': height * 0.52,
        'node-C': height * 0.82
      };

      // Draw horizontal timelines for each node
      Object.entries(trackPositions).forEach(([nodeId, yPos]) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        ctx.strokeStyle = '#1f212c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, yPos);
        ctx.lineTo(width - 30, yPos);
        ctx.stroke();

        // Node Track Header Box
        ctx.fillStyle = '#12131a';
        ctx.strokeStyle = node.id === selectedNodeId ? '#38bdf8' : '#7c3aed';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(15, yPos - 22, 115, 44, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2e5ec';
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(node.name.split(' ')[1], 24, yPos - 5);

        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = node.oscillatorDriftPpm < 0 ? '#fb7185' : '#38bdf8';
        ctx.fillText(`${node.oscillatorDriftPpm > 0 ? '+' : ''}${node.oscillatorDriftPpm} ppm`, 24, yPos + 12);
      });

      // Update in-flight message transit
      if (isRunning) {
        setMessages(prev => {
          const nextMsgs: ClockMessage[] = [];
          const deliveredMsgs: ClockMessage[] = [];

          prev.forEach(m => {
            const nextProg = m.progress + dt * 0.6;
            if (nextProg >= 1) {
              deliveredMsgs.push(m);
            } else {
              nextMsgs.push({ ...m, progress: nextProg });
            }
          });

          if (deliveredMsgs.length > 0) {
            deliveredMsgs.forEach(msg => {
              const receiver = nodes.find(n => n.id === msg.to);
              if (!receiver) return;

              // Check for Physical Clock Inversion Anomaly!
              if (receiver.physicalTimeMs < msg.sendPhysicalTime) {
                setAnomalyCount(c => c + 1);
                addLog(`PHYSICAL TIME PARADOX DETECTED! Message received at physical t=${receiver.physicalTimeMs.toFixed(0)}ms, which is EARLIER than send time t=${msg.sendPhysicalTime.toFixed(0)}ms! Wall-clock ordering breaks causality!`, 'danger');
                soundManager.playAlert();
              } else {
                soundManager.playTick(950);
              }

              // Apply Lamport Clock Rule: L(recv) = max(L(local), L(msg)) + 1
              const updatedLamport = Math.max(receiver.logicalLamportTime, msg.sendLamportTime) + 1;

              // Apply Vector Clock Rule: V(recv)[i] = max(V(local)[i], V(msg)[i]), then increment local
              const updatedVector = receiver.vectorClock.map((v, idx) => Math.max(v, msg.sendVectorClock[idx]));
              const recvIdx = receiver.id === 'node-A' ? 0 : receiver.id === 'node-B' ? 1 : 2;
              updatedVector[recvIdx] += 1;

              const recvEvent: ClockEvent = {
                id: Math.random().toString(36).substring(2, 7),
                nodeId: msg.to,
                type: 'receive',
                label: `Recv "${msg.payload}"`,
                timestampPhysical: receiver.physicalTimeMs,
                lamportTime: updatedLamport,
                vectorClock: updatedVector,
                relatedMessageId: msg.id
              };

              setEvents(e => [...e.slice(-30), recvEvent]);

              setNodes(curr => curr.map(n => n.id === msg.to ? {
                ...n,
                logicalLamportTime: updatedLamport,
                vectorClock: updatedVector,
                balance: n.balance + 250,
                events: [...n.events, recvEvent]
              } : n));

              addLog(`[${receiver.name.split(' ')[1]}] received message. Synchronized Lamport time to ${updatedLamport}. Causality preserved!`, 'success');
            });
          }

          return nextMsgs;
        });
      }

      // Draw messages in transit (Space-time diagonal vectors)
      messages.forEach(m => {
        const yStart = trackPositions[m.from];
        const yEnd = trackPositions[m.to];
        const xStart = 160 + (m.sendPhysicalTime % 400);
        const xEnd = xStart + 180;

        const curX = xStart + (xEnd - xStart) * m.progress;
        const curY = yStart + (yEnd - yStart) * m.progress;

        // Diagonal vector trajectory line
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated message packet
        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, curY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Draw Events on timelines
      events.forEach((ev, idx) => {
        const yPos = trackPositions[ev.nodeId];
        if (!yPos) return;

        const xPos = 160 + (idx * 22) % (width - 200);

        ctx.beginPath();
        ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
        ctx.fillStyle = ev.type === 'send' ? '#7c3aed' : ev.type === 'receive' ? '#38bdf8' : '#10b981';
        ctx.fill();

        // Label based on current clock mode
        ctx.font = '9px JetBrains Mono';
        ctx.fillStyle = '#858b9f';
        ctx.textAlign = 'center';

        if (clockMode === 'lamport') {
          ctx.fillText(`L:${ev.lamportTime}`, xPos, yPos - 12);
        } else if (clockMode === 'vector') {
          ctx.fillText(`<${ev.vectorClock.join(',')}>`, xPos, yPos - 12);
        } else {
          ctx.fillText(`${(ev.timestampPhysical / 1000).toFixed(1)}s`, xPos, yPos - 12);
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [nodes, messages, events, isRunning, clockMode, selectedNodeId, addLog]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="flex flex-col h-full bg-[#0a0b0e] text-[#e2e5ec] overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#1f212c] bg-[#12131a]/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#a78bfa]">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider font-mono uppercase">RELATIVISTIC TIME & CAUSALITY</span>
          </div>
          <div className="text-xs text-[#858b9f]">
            Visualization Mode: <span className="text-[#38bdf8] font-mono uppercase">{clockMode.toUpperCase()}</span>
          </div>
        </div>

        {/* Clock View Switcher */}
        <div className="flex items-center space-x-2">
          {(['vector', 'lamport', 'physical'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setClockMode(mode)}
              className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                clockMode === mode 
                  ? 'bg-[#7c3aed] text-white shadow-glow-amethyst font-semibold' 
                  : 'bg-[#161822] text-[#858b9f] hover:text-[#e2e5ec] border border-[#1f212c]'
              }`}
            >
              {mode === 'vector' ? 'VECTOR CLOCKS (CAUSALITY)' : mode === 'lamport' ? 'LAMPORT TIMESTAMPS' : 'PHYSICAL WALL-CLOCK'}
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
              setNodes(INITIAL_CLOCKS);
              setMessages([]);
              setEvents([]);
              setAnomalyCount(0);
              addLog('Clock offsets and causality timeline reset.', 'info');
            }}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#858b9f] hover:text-[#e2e5ec]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Left Space-Time Diagram Canvas */}
        <div className="col-span-8 flex flex-col relative border-r border-[#1f212c] bg-radial from-[#12131a] to-[#0a0b0e]">
          {/* Action HUD Buttons */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
            <button
              onClick={() => sendMessage('node-A', 'node-B', 'TRANSACTION_ORDER #101')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-glow-amethyst transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND A &rarr; B</span>
            </button>
            <button
              onClick={() => sendMessage('node-B', 'node-C', 'ARBITRAGE_BUY #102')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#38bdf8] transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND B &rarr; C</span>
            </button>
            <button
              onClick={() => triggerLocalEvent(selectedNodeId)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-emerald-400 transition-all"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>LOCAL EVENT</span>
            </button>
          </div>

          {/* Anomaly Counter Banner */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-xs font-mono ${
              anomalyCount > 0 
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300' 
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            }`}>
              {anomalyCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{anomalyCount > 0 ? `${anomalyCount} PHYSICAL TIME ORDERING ANOMALIES DETECTED` : 'STRICT CAUSALITY MAINTAINED'}</span>
            </div>
          </div>

          {/* Space-time diagram Canvas */}
          <canvas
            ref={canvasRef}
            className="flex-1 w-full h-full"
          />

          {/* Bottom Oscillator Drift Calibration Controls */}
          <div className="h-28 border-t border-[#1f212c] bg-[#0d0e14] px-4 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#858b9f] font-mono">
              <span className="flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-[#e2e5ec] font-semibold">HARDWARE QUARTZ DRIFT ADJUSTMENT (PARTS PER MILLION)</span>
              </span>
              <span>1 PPM = ~86.4 milliseconds drift per day</span>
            </div>
            <div className="grid grid-cols-3 gap-4 py-1">
              {nodes.map(n => (
                <div key={n.id} className="flex flex-col space-y-1 bg-[#161822] p-2 rounded border border-[#1f212c]">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#e2e5ec] font-medium">{n.name.split(' ')[1]}</span>
                    <span className={n.oscillatorDriftPpm < 0 ? 'text-rose-400' : 'text-[#38bdf8]'}>
                      {n.oscillatorDriftPpm > 0 ? '+' : ''}{n.oscillatorDriftPpm} PPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={n.oscillatorDriftPpm}
                    onChange={(e) => setDriftPpm(n.id, parseInt(e.target.value, 10))}
                    className="w-full accent-[#7c3aed] cursor-pointer h-1.5 bg-[#0a0b0e] rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Cockpit Panel */}
        <div className="col-span-4 flex flex-col h-full bg-[#12131a] overflow-hidden">
          {/* Node Clock Inspector */}
          <div className="p-4 border-b border-[#1f212c]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-[#858b9f] flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>CHRONOMETER INSPECTOR</span>
              </span>
              <div className="flex space-x-1">
                {nodes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      selectedNodeId === n.id ? 'bg-[#7c3aed] text-white' : 'bg-[#161822] text-[#858b9f]'
                    }`}
                  >
                    {n.id.replace('node-', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Selected Node:</span>
                <span className="text-[#e2e5ec] font-semibold">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Physical Wall-Clock:</span>
                <span className="text-amber-400 font-bold">{(selectedNode.physicalTimeMs / 1000).toFixed(3)}s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Lamport Scalar Time:</span>
                <span className="text-[#38bdf8] font-bold">L = {selectedNode.logicalLamportTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Vector Clock [A, B, C]:</span>
                <span className="text-[#a78bfa] font-bold">&lt;{selectedNode.vectorClock.join(', ')}&gt;</span>
              </div>
            </div>
          </div>

          {/* Mathematical Foundations Explainer */}
          <div className="p-4 border-b border-[#1f212c] bg-[#161822]/60">
            <div className="text-xs font-mono text-[#a78bfa] mb-2 font-semibold flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>THE HAPPENS-BEFORE (&rarr;) RELATION</span>
            </div>
            <p className="text-[11px] text-[#858b9f] leading-relaxed mb-2">
              Leslie Lamport proved that in distributed systems with no shared memory, physical wall clocks cannot define global ordering. 
            </p>
            <div className="p-2 rounded bg-[#0a0b0e] border border-[#1f212c] font-mono text-[10px] text-[#38bdf8] space-y-1">
              <div>1. If a &rarr; b on same node: L(a) &lt; L(b)</div>
              <div>2. If a is send and b is receive: L(b) &ge; L(a) + 1</div>
              <div>3. Vector Clocks detect concurrency: a || b iff neither V(a) &le; V(b) nor V(b) &le; V(a)</div>
            </div>
          </div>

          {/* Event Stream */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#858b9f] flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>CHRONOLOGICAL EVENT LOG</span>
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
