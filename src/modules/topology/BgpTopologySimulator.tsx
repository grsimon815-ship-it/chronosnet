import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Globe, 
  Radio, 
  Scissors, 
  AlertOctagon, 
  Zap, 
  Route, 
  RotateCcw, 
  Play, 
  Pause, 
  Cpu, 
  CheckCircle2, 
  ShieldAlert, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { TopologyNode, TopologyLink, TopologyPacket, RoutingProtocol } from '../../types';
import { soundManager } from '../../utils/sound';

const INITIAL_NODES: TopologyNode[] = [
  { id: 'as-us-east', asn: 13335, name: 'AS13335 (Cloudflare Ashburn)', city: 'Ashburn', country: 'USA', lat: 39.04, lng: -77.48, x: 0.28, y: 0.38, prefixes: ['198.51.100.0/16'], isRogue: false, routingTable: new Map() },
  { id: 'as-eu-west', asn: 3356, name: 'AS3356 (Lumen Tier-1 London)', city: 'London', country: 'UK', lat: 51.50, lng: -0.12, x: 0.48, y: 0.28, prefixes: ['195.66.224.0/19'], isRogue: false, routingTable: new Map() },
  { id: 'as-eu-central', asn: 15169, name: 'AS15169 (Google Frankfurt)', city: 'Frankfurt', country: 'Germany', lat: 50.11, lng: 8.68, x: 0.54, y: 0.34, prefixes: ['8.8.8.0/24'], isRogue: false, routingTable: new Map() },
  { id: 'as-asia-east', asn: 2497, name: 'AS2497 (IIJ Tokyo Hub)', city: 'Tokyo', country: 'Japan', lat: 35.67, lng: 139.65, x: 0.82, y: 0.40, prefixes: ['202.232.0.0/16'], isRogue: false, routingTable: new Map() },
  { id: 'as-asia-south', asn: 4657, name: 'AS4657 (Singtel Singapore)', city: 'Singapore', country: 'Singapore', lat: 1.35, lng: 103.81, x: 0.74, y: 0.68, prefixes: ['165.21.0.0/16'], isRogue: false, routingTable: new Map() },
  { id: 'as-sa-east', asn: 28573, name: 'AS28573 (Claro São Paulo)', city: 'São Paulo', country: 'Brazil', lat: -23.55, lng: -46.63, x: 0.35, y: 0.78, prefixes: ['200.245.0.0/16'], isRogue: false, routingTable: new Map() },
  { id: 'as-rogue', asn: 66666, name: 'AS66666 (Rogue Autonomous System)', city: 'Offshore', country: 'Anonymous', lat: 10.0, lng: 20.0, x: 0.52, y: 0.56, prefixes: [], isRogue: true, routingTable: new Map() },
];

const INITIAL_LINKS: TopologyLink[] = [
  { id: 'link-us-eu', from: 'as-us-east', to: 'as-eu-west', latencyMs: 68, capacityGbps: 800, status: 'active' },
  { id: 'link-eu-frankfurt', from: 'as-eu-west', to: 'as-eu-central', latencyMs: 14, capacityGbps: 1200, status: 'active' },
  { id: 'link-eu-asia', from: 'as-eu-central', to: 'as-asia-east', latencyMs: 185, capacityGbps: 400, status: 'active' },
  { id: 'link-asia-sing', from: 'as-asia-east', to: 'as-asia-south', latencyMs: 65, capacityGbps: 600, status: 'active' },
  { id: 'link-us-sa', from: 'as-us-east', to: 'as-sa-east', latencyMs: 110, capacityGbps: 300, status: 'active' },
  { id: 'link-sa-sing', from: 'as-sa-east', to: 'as-asia-south', latencyMs: 240, capacityGbps: 200, status: 'active' },
  // Rogue links (can bridge or hijack)
  { id: 'link-rogue-eu', from: 'as-rogue', to: 'as-eu-central', latencyMs: 25, capacityGbps: 500, status: 'active' },
  { id: 'link-rogue-us', from: 'as-rogue', to: 'as-us-east', latencyMs: 80, capacityGbps: 500, status: 'active' },
];

export const BgpTopologySimulator: React.FC = () => {
  const [nodes, setNodes] = useState<TopologyNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<TopologyLink[]>(INITIAL_LINKS);
  const [packets, setPackets] = useState<TopologyPacket[]>([]);
  const [protocol, setProtocol] = useState<RoutingProtocol>('bgp');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('as-us-east');
  const [isHijackActive, setIsHijackActive] = useState<boolean>(false);
  const [hasRoutingLoop, setHasRoutingLoop] = useState<boolean>(false);
  
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'warn' | 'danger' | 'success' }>>([
    { id: '1', time: '00:00:01', text: 'Global Autonomous System (AS) Fiber Grid initialized.', type: 'info' },
    { id: '2', time: '00:00:02', text: 'BGP Path Vector Routing active. 7 Autonomous Systems peered.', type: 'info' }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const addLog = useCallback((text: string, type: 'info' | 'warn' | 'danger' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
  }, []);

  // Calculate Shortest Path using Dijkstra / Bellman-Ford
  const calculatePath = useCallback((srcId: string, destId: string): string[] => {
    // If destination is targeted by hijack and hijack is active, destination becomes rogue!
    const effectiveDestId = (isHijackActive && destId === 'as-us-east') ? 'as-rogue' : destId;

    if (hasRoutingLoop && (srcId === 'as-eu-central' || srcId === 'as-rogue')) {
      return ['as-eu-central', 'as-rogue', 'as-eu-central'];
    }

    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    nodes.forEach(n => {
      dist[n.id] = Infinity;
      prev[n.id] = null;
      unvisited.add(n.id);
    });

    dist[srcId] = 0;

    while (unvisited.size > 0) {
      let u: string | null = null;
      let minDist = Infinity;
      unvisited.forEach(nodeId => {
        if (dist[nodeId] < minDist) {
          minDist = dist[nodeId];
          u = nodeId;
        }
      });

      if (!u || minDist === Infinity || u === effectiveDestId) break;
      unvisited.delete(u);

      // Find neighbors with active links
      const activeNeighbors = links
        .filter(l => l.status === 'active' && (l.from === u || l.to === u))
        .map(l => ({
          neighborId: l.from === u ? l.to : l.from,
          weight: protocol === 'bgp' ? 1 : l.latencyMs // BGP prefers AS-PATH hop count, OSPF/Dijkstra prefers latency cost
        }));

      for (const { neighborId, weight } of activeNeighbors) {
        if (unvisited.has(neighborId)) {
          const alt = dist[u] + weight;
          if (alt < dist[neighborId]) {
            dist[neighborId] = alt;
            prev[neighborId] = u;
          }
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = effectiveDestId;
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }

    return path[0] === srcId ? path : [];
  }, [nodes, links, isHijackActive, hasRoutingLoop, protocol]);

  // Toggle Cable Severing
  const toggleLinkStatus = useCallback((linkId: string) => {
    setLinks(prev => prev.map(l => {
      if (l.id === linkId) {
        const nextStatus = l.status === 'active' ? 'severed' : 'active';
        addLog(`Submarine cable [${l.id}] ${nextStatus === 'severed' ? 'SEVERED! Recalculating SPF...' : 'RESTORED. Route converging.'}`, nextStatus === 'severed' ? 'warn' : 'success');
        if (nextStatus === 'severed') soundManager.playAlert();
        else soundManager.playConsensusChime();
        return { ...l, status: nextStatus };
      }
      return l;
    }));
  }, [addLog]);

  // Toggle BGP Hijack (Subprefix Hijack: 198.51.100.0/24 injected by Rogue AS66666)
  const toggleBgpPrefixHijack = useCallback(() => {
    const nextHijack = !isHijackActive;
    setIsHijackActive(nextHijack);

    setNodes(prev => prev.map(n => {
      if (n.id === 'as-rogue') {
        return {
          ...n,
          prefixes: nextHijack ? ['198.51.100.0/24 (SUB-PREFIX HIJACK)'] : []
        };
      }
      return n;
    }));

    if (nextHijack) {
      addLog('BGP HIJACK INJECTED: Rogue AS66666 announces specific /24 prefix! Longest Prefix Match redirects global traffic!', 'danger');
      soundManager.playAlert();
    } else {
      addLog('BGP Hijack withdrawn. Origin Validation (RPKI ROA) enforced. Normal routing restored.', 'success');
      soundManager.playConsensusChime();
    }
  }, [isHijackActive, addLog]);

  // Toggle Routing Loop simulation
  const toggleRoutingLoop = useCallback(() => {
    const nextLoop = !hasRoutingLoop;
    setHasRoutingLoop(nextLoop);
    if (nextLoop) {
      addLog('ROUTING LOOP INDUCED: AS-Path poisoned between Frankfurt and Rogue AS. Packets looping until TTL=0!', 'danger');
      soundManager.playAlert();
    } else {
      addLog('Split Horizon / Poison Reverse applied. Loop dissolved.', 'success');
    }
  }, [hasRoutingLoop, addLog]);

  // Emit interactive test packet across globe
  const sendTestPacket = useCallback((src = 'as-asia-east', dest = 'as-us-east') => {
    const path = calculatePath(src, dest);
    if (path.length < 2) {
      addLog(`Packet dropped: No route from ${src} to ${dest} (Network partitioned)`, 'warn');
      return;
    }

    const newPacket: TopologyPacket = {
      id: Math.random().toString(36).substring(2, 9),
      from: src,
      to: dest,
      destIp: isHijackActive ? '198.51.100.42 (HIJACKED)' : '198.51.100.42 (LEGIT)',
      currentHop: path[0],
      nextHop: path[1],
      path,
      progress: 0,
      isIntercepted: isHijackActive,
      isLooped: hasRoutingLoop,
      ttl: 64
    };

    setPackets(prev => [...prev, newPacket]);
    soundManager.playTick(isHijackActive ? 450 : 850);
  }, [calculatePath, isHijackActive, hasRoutingLoop, addLog]);

  // Simulation Packet Generation Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Pick random source and send to Cloudflare Ashburn / US East
      const candidateSources = ['as-asia-east', 'as-eu-central', 'as-asia-south', 'as-sa-east'];
      const randomSrc = candidateSources[Math.floor(Math.random() * candidateSources.length)];
      sendTestPacket(randomSrc, 'as-us-east');
    }, 1800);

    return () => clearInterval(interval);
  }, [isRunning, sendTestPacket]);

  // Main Canvas Render & Packet Motion Loop
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

      // Draw World Grid Lines
      ctx.strokeStyle = 'rgba(31, 33, 44, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Backbone Fiber Cables
      links.forEach(link => {
        const fromNode = nodes.find(n => n.id === link.from);
        const toNode = nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) return;

        const x1 = fromNode.x * width;
        const y1 = fromNode.y * height;
        const x2 = toNode.x * width;
        const y2 = toNode.y * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (link.status === 'severed') {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Latency tag at midpoint
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        ctx.fillStyle = link.status === 'severed' ? '#fb7185' : '#858b9f';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${link.latencyMs}ms`, midX, midY - 6);
      });

      // Update & Render Packets
      if (isRunning) {
        setPackets(prev => {
          const nextPackets: TopologyPacket[] = [];

          prev.forEach(p => {
            const nextProgress = p.progress + dt * 0.9;
            if (nextProgress < 1) {
              nextPackets.push({ ...p, progress: nextProgress });
            } else {
              // Advance to next hop along path
              const currIndex = p.path.indexOf(p.nextHop);
              if (currIndex !== -1 && currIndex + 1 < p.path.length) {
                nextPackets.push({
                  ...p,
                  currentHop: p.nextHop,
                  nextHop: p.path[currIndex + 1],
                  progress: 0,
                  ttl: p.ttl - 1
                });
              } else {
                // Packet reached destination or intercepted
                if (p.isIntercepted && p.nextHop === 'as-rogue') {
                  soundManager.playAlert();
                } else {
                  soundManager.playTick(900);
                }
              }
            }
          });

          return nextPackets;
        });
      }

      // Draw Packets on Canvas
      packets.forEach(p => {
        const fromNode = nodes.find(n => n.id === p.currentHop);
        const toNode = nodes.find(n => n.id === p.nextHop);
        if (!fromNode || !toNode) return;

        const x1 = fromNode.x * width;
        const y1 = fromNode.y * height;
        const x2 = toNode.x * width;
        const y2 = toNode.y * height;

        const px = x1 + (x2 - x1) * p.progress;
        const py = y1 + (y2 - y1) * p.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, p.isIntercepted ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = p.isIntercepted ? '#f43f5e' : '#38bdf8';
        ctx.shadowColor = p.isIntercepted ? '#f43f5e' : '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      });

      // Draw Nodes (AS Points of Presence)
      nodes.forEach(node => {
        const nx = node.x * width;
        const ny = node.y * height;
        const isSelected = node.id === selectedNodeId;

        // Outer AS Ring
        ctx.beginPath();
        ctx.arc(nx, ny, 22, 0, Math.PI * 2);
        if (node.isRogue) {
          ctx.strokeStyle = '#f43f5e';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
        } else {
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#7c3aed';
          ctx.fillStyle = '#12131a';
        }
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fill();
        ctx.stroke();

        // Center AS Core Dot
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.fillStyle = node.isRogue ? '#f43f5e' : (isSelected ? '#38bdf8' : '#a78bfa');
        ctx.fill();

        // City & ASN Label
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#e2e5ec';
        ctx.textAlign = 'center';
        ctx.fillText(node.city, nx, ny - 30);

        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = node.isRogue ? '#fb7185' : '#858b9f';
        ctx.fillText(`AS${node.asn}`, nx, ny + 36);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [nodes, links, packets, isRunning, selectedNodeId]);

  // Click on canvas to select node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    for (const node of nodes) {
      const dx = (node.x - clickX) * rect.width;
      const dy = (node.y - clickY) * rect.height;
      if (Math.hypot(dx, dy) < 28) {
        setSelectedNodeId(node.id);
        return;
      }
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="flex flex-col h-full bg-[#0a0b0e] text-[#e2e5ec] overflow-hidden select-none">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#1f212c] bg-[#12131a]/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider font-mono uppercase">GLOBAL BGP TOPOLOGY</span>
          </div>
          <div className="text-xs text-[#858b9f]">
            Routing Algorithm: <span className="text-[#a78bfa] font-mono uppercase">{protocol}</span>
          </div>
        </div>

        {/* Protocol Selector */}
        <div className="flex items-center space-x-2">
          {(['bgp', 'dijkstra', 'bellman_ford'] as RoutingProtocol[]).map(p => (
            <button
              key={p}
              onClick={() => {
                setProtocol(p);
                addLog(`Switched route convergence engine to ${p.toUpperCase()}`, 'info');
              }}
              className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                protocol === p 
                  ? 'bg-[#38bdf8] text-[#0a0b0e] font-bold shadow-glow-cyan' 
                  : 'bg-[#161822] text-[#858b9f] hover:text-[#e2e5ec] border border-[#1f212c]'
              }`}
            >
              {p === 'dijkstra' ? 'DIJKSTRA (SPF)' : p === 'bellman_ford' ? 'BELLMAN-FORD' : 'BGP PATH-VECTOR'}
            </button>
          ))}
        </div>

        {/* Global Action Buttons */}
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
              setNodes(INITIAL_NODES);
              setLinks(INITIAL_LINKS);
              setIsHijackActive(false);
              setHasRoutingLoop(false);
              addLog('Global topology and fiber links reset to clean state.', 'info');
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
        {/* Left Canvas Visualization */}
        <div className="col-span-8 flex flex-col relative border-r border-[#1f212c] bg-radial from-[#12131a] to-[#0a0b0e]">
          {/* Action HUD Buttons */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
            <button
              onClick={() => sendTestPacket('as-asia-east', 'as-us-east')}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#38bdf8] hover:bg-[#0284c7] text-[#0a0b0e] font-semibold shadow-glow-cyan transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>DISPATCH PACKET</span>
            </button>
            <button
              onClick={toggleBgpPrefixHijack}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
                isHijackActive 
                  ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-glow-rose' 
                  : 'bg-[#161822] hover:bg-[#1d202e] border-[#1f212c] text-rose-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isHijackActive ? 'WITHDRAW HIJACK (RPKI)' : 'INJECT BGP HIJACK (/24)'}</span>
            </button>
            <button
              onClick={toggleRoutingLoop}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
                hasRoutingLoop 
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300' 
                  : 'bg-[#161822] hover:bg-[#1d202e] border-[#1f212c] text-[#858b9f]'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>{hasRoutingLoop ? 'HEAL LOOP (SPLIT HORIZON)' : 'SIMULATE ROUTING LOOP'}</span>
            </button>
          </div>

          {/* Right Status Banner */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-xs font-mono ${
              isHijackActive 
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300' 
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            }`}>
              {isHijackActive ? <AlertOctagon className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isHijackActive ? 'TRAFFIC INTERCEPTED BY ROGUE AS66666' : 'ALL AS PATHS VERIFIED VIA RPKI'}</span>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="flex-1 w-full h-full cursor-crosshair"
          />

          {/* Bottom Fiber Cable Controls */}
          <div className="h-28 border-t border-[#1f212c] bg-[#0d0e14] px-4 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#858b9f] font-mono">
              <span className="flex items-center space-x-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="text-[#e2e5ec] font-semibold">SUBMARINE FIBER OPTIC CABLE MANAGEMENT (CLICK TO CUT/RESTORE)</span>
              </span>
              <span>Active Links: {links.filter(l => l.status === 'active').length}/{links.length}</span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              {links.map(link => (
                <button
                  key={link.id}
                  onClick={() => toggleLinkStatus(link.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded border text-[11px] font-mono flex items-center space-x-2 transition-all ${
                    link.status === 'severed'
                      ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                      : 'bg-[#161822] hover:bg-[#1d202e] border-[#1f212c] text-[#e2e5ec]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${link.status === 'severed' ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                  <span>{link.id.replace('link-', '').toUpperCase()}</span>
                  <span className="text-[#858b9f]">({link.latencyMs}ms)</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Cockpit Panel */}
        <div className="col-span-4 flex flex-col h-full bg-[#12131a] overflow-hidden">
          {/* Autonomous System Inspector */}
          <div className="p-4 border-b border-[#1f212c]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-[#858b9f] flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>BGP BORDER ROUTER TELEMETRY</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                selectedNode.isRogue ? 'bg-rose-950/80 text-rose-300 border border-rose-600' : 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30'
              }`}>
                {selectedNode.isRogue ? 'ROGUE AS' : 'PEERED AS'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Autonomous System:</span>
                <span className="text-[#e2e5ec] font-semibold">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">ASN:</span>
                <span className="text-[#38bdf8] font-bold">AS{selectedNode.asn}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Location:</span>
                <span className="text-[#e2e5ec]">{selectedNode.city}, {selectedNode.country}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Originated Prefixes:</span>
                <span className="text-[#a78bfa]">{selectedNode.prefixes.join(', ') || 'None'}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => sendTestPacket(selectedNode.id, 'as-us-east')}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded text-xs font-mono font-semibold bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#38bdf8] transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>TRACE ROUTE FROM THIS AS TO ASHBURN</span>
              </button>
            </div>
          </div>

          {/* Longest Prefix Match & BGP Explainer */}
          <div className="p-4 border-b border-[#1f212c] bg-[#161822]/60">
            <div className="text-xs font-mono text-[#38bdf8] mb-2 font-semibold flex items-center space-x-1.5">
              <Route className="w-3.5 h-3.5" />
              <span>LONGEST PREFIX MATCH (LPM) MECHANICS</span>
            </div>
            <p className="text-[11px] text-[#858b9f] leading-relaxed">
              When an attacker advertises <code className="text-[#fb7185]">198.51.100.0/24</code>, routers globally prefer it over the legitimate <code className="text-[#38bdf8]">198.51.100.0/16</code> advertisement because <strong className="text-[#e2e5ec]">longer subnet masks (/24 &gt; /16) take absolute precedence</strong> in FIB tables regardless of AS-PATH length.
            </p>
          </div>

          {/* Event Stream */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#858b9f] flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>ROUTING EVENT STREAM</span>
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
