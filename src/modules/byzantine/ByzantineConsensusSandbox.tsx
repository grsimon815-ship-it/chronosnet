import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Vote, 
  Zap, 
  RotateCcw, 
  Play, 
  Pause, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  SplitSquareVertical, 
  Skull, 
  Activity,
  Info
} from 'lucide-react';
import { ByzantineNode, ByzantineMessage, ConsensusAlgorithm, ByzantineNodeState } from '../../types';
import { soundManager } from '../../utils/sound';

const INITIAL_NODES: ByzantineNode[] = [
  { id: 'node-0', name: 'Validator Alpha (Node 0)', x: 0.5, y: 0.18, role: 'leader', state: 'healthy', term: 1, votedFor: null, ledger: [{ index: 1, term: 1, command: 'GENESIS_INIT', hash: '0x8f2a' }], prepared: true, committed: true, votesReceived: [], partitionGroup: 0 },
  { id: 'node-1', name: 'Validator Beta (Node 1)', x: 0.8, y: 0.38, role: 'follower', state: 'healthy', term: 1, votedFor: null, ledger: [{ index: 1, term: 1, command: 'GENESIS_INIT', hash: '0x8f2a' }], prepared: true, committed: true, votesReceived: [], partitionGroup: 0 },
  { id: 'node-2', name: 'Validator Gamma (Node 2)', x: 0.7, y: 0.82, role: 'follower', state: 'healthy', term: 1, votedFor: null, ledger: [{ index: 1, term: 1, command: 'GENESIS_INIT', hash: '0x8f2a' }], prepared: true, committed: true, votesReceived: [], partitionGroup: 0 },
  { id: 'node-3', name: 'Validator Delta (Node 3)', x: 0.3, y: 0.82, role: 'follower', state: 'healthy', term: 1, votedFor: null, ledger: [{ index: 1, term: 1, command: 'GENESIS_INIT', hash: '0x8f2a' }], prepared: true, committed: true, votesReceived: [], partitionGroup: 0 },
  { id: 'node-4', name: 'Validator Epsilon (Node 4)', x: 0.2, y: 0.38, role: 'follower', state: 'healthy', term: 1, votedFor: null, ledger: [{ index: 1, term: 1, command: 'GENESIS_INIT', hash: '0x8f2a' }], prepared: true, committed: true, votesReceived: [], partitionGroup: 0 },
];

export const ByzantineConsensusSandbox: React.FC = () => {
  const [nodes, setNodes] = useState<ByzantineNode[]>(INITIAL_NODES);
  const [algorithm, setAlgorithm] = useState<ConsensusAlgorithm>('pbft');
  const [messages, setMessages] = useState<ByzantineMessage[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-0');
  const [splitBrainActive, setSplitBrainActive] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'warn' | 'success' | 'danger' }>>([
    { id: '1', time: '00:00:01', text: 'Serenity Consensus Engine initialized. 5 Byzantine nodes online.', type: 'info' },
    { id: '2', time: '00:00:02', text: 'Algorithm: PBFT (Tolerates f < n/3 = 1 Byzantine failure)', type: 'info' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Compute metrics
  const totalNodes = nodes.length;
  const byzantineNodes = nodes.filter(n => n.state === 'byzantine').length;
  const healthyNodes = nodes.filter(n => n.state === 'healthy').length;
  const isolatedNodes = nodes.filter(n => n.state === 'isolated').length;

  // Max tolerable faults
  // PBFT: f < n/3 -> 3f + 1 <= n -> max f = floor((n-1)/3)
  // Raft / Paxos (CFT): f < n/2 -> max f = floor((n-1)/2)
  const maxFaults = algorithm === 'pbft' ? Math.floor((totalNodes - 1) / 3) : Math.floor((totalNodes - 1) / 2);
  const quorumThreshold = algorithm === 'pbft' ? 2 * maxFaults + 1 : Math.floor(totalNodes / 2) + 1;
  const isConsensusSafe = algorithm === 'pbft' ? byzantineNodes <= maxFaults : byzantineNodes === 0;
  const hasQuorum = healthyNodes >= quorumThreshold;

  const addLog = useCallback((text: string, type: 'info' | 'warn' | 'success' | 'danger' = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
  }, []);

  // Broadcast message between nodes
  const broadcast = useCallback((fromId: string, type: ByzantineMessage['type'], payload: any, isMalicious = false) => {
    const sender = nodes.find(n => n.id === fromId);
    if (!sender) return;

    const newMsgs: ByzantineMessage[] = [];
    nodes.forEach(target => {
      if (target.id === fromId) return;

      // Check partition boundaries
      if (splitBrainActive && sender.partitionGroup !== target.partitionGroup) {
        return; // Message dropped across partition barrier
      }

      newMsgs.push({
        id: Math.random().toString(36).substring(2, 9),
        from: fromId,
        to: target.id,
        type,
        term: sender.term,
        payload,
        progress: 0,
        speed: 0.015 + Math.random() * 0.01,
        isMalicious
      });
    });

    setMessages(prev => [...prev, ...newMsgs]);
    soundManager.playTick(isMalicious ? 400 : 700);
  }, [nodes, splitBrainActive]);

  // Propose a new ledger block transaction
  const proposeTransaction = useCallback((customCommand?: string) => {
    const leader = nodes.find(n => n.role === 'leader' || n.role === 'primary' || n.role === 'proposer') || nodes[0];
    const cmd = customCommand || `TX_STATE_${Math.floor(Math.random() * 9000 + 1000)}`;
    const newIndex = leader.ledger.length + 1;
    const hash = '0x' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

    addLog(`Proposer [${leader.name}] issued proposal #${newIndex}: "${cmd}"`, 'info');

    if (algorithm === 'raft') {
      broadcast(leader.id, 'AppendEntries', { index: newIndex, command: cmd, hash });
    } else if (algorithm === 'pbft') {
      broadcast(leader.id, 'PrePrepare', { index: newIndex, command: cmd, hash });
    } else if (algorithm === 'paxos') {
      broadcast(leader.id, 'PreparePaxos', { proposalId: newIndex * 10 + leader.term, command: cmd });
    }
  }, [nodes, algorithm, broadcast, addLog]);

  // Trigger Leader Election
  const triggerElection = useCallback(() => {
    const candidate = nodes.find(n => n.state === 'healthy') || nodes[0];
    setNodes(prev => prev.map(n => n.id === candidate.id ? { ...n, role: 'candidate', term: n.term + 1, votesReceived: [n.id] } : n));
    addLog(`Node [${candidate.name}] timed out, incremented term to ${candidate.term + 1} & started Leader Election`, 'warn');
    broadcast(candidate.id, 'RequestVote', { term: candidate.term + 1 });
  }, [nodes, broadcast, addLog]);

  // Toggle node corruption (Byzantine state)
  const toggleNodeState = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextState: ByzantineNodeState = n.state === 'healthy' ? 'byzantine' : 'healthy';
        addLog(`Node [${n.name}] status toggled to [${nextState.toUpperCase()}]`, nextState === 'byzantine' ? 'danger' : 'success');
        if (nextState === 'byzantine') soundManager.playAlert();
        return { ...n, state: nextState };
      }
      return n;
    }));
  }, [addLog]);

  // Toggle Split-Brain network isolation
  const toggleSplitBrain = useCallback(() => {
    const nextActive = !splitBrainActive;
    setSplitBrainActive(nextActive);
    setNodes(prev => prev.map((n, idx) => ({
      ...n,
      partitionGroup: nextActive ? (idx < 3 ? 1 : 2) : 0
    })));

    if (nextActive) {
      addLog('SPLIT-BRAIN ACTIVATED: Network partitioned into Group 1 (3 nodes - Quorum) and Group 2 (2 nodes - Minority)', 'warn');
      soundManager.playAlert();
    } else {
      addLog('Network partition healed. Global cross-cluster gossip re-established.', 'success');
      soundManager.playConsensusChime();
    }
  }, [splitBrainActive, addLog]);

  // Reset Sandbox
  const resetSandbox = () => {
    setNodes(INITIAL_NODES);
    setMessages([]);
    setSplitBrainActive(false);
    addLog('Consensus environment reset to initial state.', 'info');
  };

  // Main simulation tick
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Periodic heartbeats or leader activity
      const leader = nodes.find(n => n.role === 'leader' || n.role === 'primary');
      if (leader && leader.state === 'healthy' && Math.random() < 0.25) {
        // Send small heartbeat ping
        broadcast(leader.id, 'AppendEntries', { heartbeat: true });
      }

      // If leader is byzantine, occasionally send conflicting messages!
      if (leader && leader.state === 'byzantine' && Math.random() < 0.3) {
        addLog(`Byzantine Leader [${leader.name}] sending equivocal (conflicting) payloads to split peers!`, 'danger');
        broadcast(leader.id, 'PrePrepare', { command: 'EQUIVOCATED_FORK_TX' }, true);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isRunning, nodes, broadcast, addLog]);

  // Message animation & delivery loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Resize canvas to match display size
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw background partition zones if split brain
      if (splitBrainActive) {
        ctx.fillStyle = 'rgba(124, 58, 237, 0.05)';
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(20, 20, width * 0.58, height - 40);
        ctx.fillRect(20, 20, width * 0.58, height - 40);

        ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.strokeRect(width * 0.62, 20, width * 0.35, height - 40);
        ctx.fillRect(width * 0.62, 20, width * 0.35, height - 40);
        ctx.setLineDash([]);

        ctx.font = '11px JetBrains Mono';
        ctx.fillStyle = '#a78bfa';
        ctx.fillText('PARTITION A (QUORUM: 3 NODES)', 32, 42);
        ctx.fillStyle = '#fb7185';
        ctx.fillText('PARTITION B (MINORITY: 2 NODES)', width * 0.64, 42);
      }

      // Draw Network Links
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const isCrossPartition = splitBrainActive && n1.partitionGroup !== n2.partitionGroup;

          ctx.beginPath();
          ctx.moveTo(n1.x * width, n1.y * height);
          ctx.lineTo(n2.x * width, n2.y * height);

          if (isCrossPartition) {
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.15)';
            ctx.setLineDash([4, 6]);
          } else {
            ctx.strokeStyle = 'rgba(31, 33, 44, 0.8)';
            ctx.setLineDash([]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Update & Draw In-Flight Messages
      if (isRunning) {
        setMessages(prev => {
          const nextMsgs: ByzantineMessage[] = [];
          const deliveredMsgs: ByzantineMessage[] = [];

          prev.forEach(msg => {
            const nextProgress = msg.progress + msg.speed * (dt * 60);
            if (nextProgress >= 1) {
              deliveredMsgs.push(msg);
            } else {
              nextMsgs.push({ ...msg, progress: nextProgress });
            }
          });

          // Handle delivery side-effects
          if (deliveredMsgs.length > 0) {
            deliveredMsgs.forEach(msg => {
              const targetNode = nodes.find(n => n.id === msg.to);
              if (!targetNode) return;

              // If delivered to healthy node
              if (targetNode.state === 'healthy') {
                if (msg.type === 'RequestVote') {
                  // Vote response
                  soundManager.playTick(600);
                } else if (msg.type === 'PrePrepare' || msg.type === 'AppendEntries') {
                  if (msg.payload?.command) {
                    // Log commit
                    setNodes(curr => curr.map(n => {
                      if (n.id === targetNode.id) {
                        const exists = n.ledger.some(l => l.command === msg.payload.command);
                        if (!exists) {
                          return {
                            ...n,
                            ledger: [...n.ledger, { index: n.ledger.length + 1, term: n.term, command: msg.payload.command, hash: msg.payload.hash || '0x4e12' }]
                          };
                        }
                      }
                      return n;
                    }));
                  }
                }
              }
            });
          }

          return nextMsgs;
        });
      }

      // Draw Messages on Canvas
      messages.forEach(msg => {
        const fromNode = nodes.find(n => n.id === msg.from);
        const toNode = nodes.find(n => n.id === msg.to);
        if (!fromNode || !toNode) return;

        const startX = fromNode.x * width;
        const startY = fromNode.y * height;
        const targetX = toNode.x * width;
        const targetY = toNode.y * height;

        const curX = startX + (targetX - startX) * msg.progress;
        const curY = startY + (targetY - startY) * msg.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(curX, curY, msg.isMalicious ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = msg.isMalicious ? '#f43f5e' : (msg.type === 'AppendEntries' ? '#38bdf8' : '#7c3aed');
        ctx.shadowColor = msg.isMalicious ? '#f43f5e' : '#7c3aed';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // Draw Nodes
      nodes.forEach(node => {
        const nx = node.x * width;
        const ny = node.y * height;
        const isSelected = node.id === selectedNodeId;

        // Outer Glow / Ring
        ctx.beginPath();
        ctx.arc(nx, ny, 26, 0, Math.PI * 2);
        if (node.state === 'byzantine') {
          ctx.strokeStyle = '#f43f5e';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
        } else if (node.role === 'leader' || node.role === 'primary') {
          ctx.strokeStyle = '#7c3aed';
          ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
        } else {
          ctx.strokeStyle = isSelected ? '#38bdf8' : '#1f212c';
          ctx.fillStyle = '#12131a';
        }
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fill();
        ctx.stroke();

        // Inner Server Core Dot
        ctx.beginPath();
        ctx.arc(nx, ny, 8, 0, Math.PI * 2);
        ctx.fillStyle = node.state === 'byzantine' ? '#f43f5e' : (node.role === 'leader' ? '#a78bfa' : '#38bdf8');
        ctx.fill();

        // Node Label
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#e2e5ec';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.split(' ')[0], nx, ny - 34);

        // Role & State Tag
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = node.state === 'byzantine' ? '#fb7185' : (node.role === 'leader' ? '#c084fc' : '#858b9f');
        ctx.fillText(`${node.role.toUpperCase()} [T:${node.term}]`, nx, ny + 40);
        ctx.fillText(`Ledger: ${node.ledger.length} tx`, nx, ny + 53);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [nodes, messages, isRunning, splitBrainActive, selectedNodeId]);

  // Click on canvas to select node or toggle state
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Check hit test against nodes
    for (const node of nodes) {
      const dx = (node.x - clickX) * rect.width;
      const dy = (node.y - clickY) * rect.height;
      if (Math.hypot(dx, dy) < 32) {
        setSelectedNodeId(node.id);
        return;
      }
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="flex flex-col h-full bg-[#0a0b0e] text-[#e2e5ec] overflow-hidden select-none">
      {/* Top Protocol Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-[#1f212c] bg-[#12131a]/80 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#a78bfa]">
            <Vote className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider font-mono uppercase">BYZANTINE SANDBOX</span>
          </div>
          <div className="text-xs text-[#858b9f]">
            Active Algorithm: <span className="text-[#38bdf8] font-mono font-medium uppercase">{algorithm}</span>
          </div>
        </div>

        {/* Algorithm Switcher Buttons */}
        <div className="flex items-center space-x-2">
          {(['pbft', 'raft', 'paxos'] as ConsensusAlgorithm[]).map(alg => (
            <button
              key={alg}
              onClick={() => {
                setAlgorithm(alg);
                addLog(`Switched consensus protocol to ${alg.toUpperCase()}`, 'info');
              }}
              className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                algorithm === alg 
                  ? 'bg-[#7c3aed] text-white shadow-glow-amethyst' 
                  : 'bg-[#161822] text-[#858b9f] hover:text-[#e2e5ec] border border-[#1f212c]'
              }`}
            >
              {alg.toUpperCase()}
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
            onClick={resetSandbox}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#858b9f] hover:text-[#e2e5ec]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Left Interactive Canvas Area */}
        <div className="col-span-8 flex flex-col relative border-r border-[#1f212c] bg-radial from-[#12131a] to-[#0a0b0e]">
          {/* Canvas Overlay Quick Action HUD */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
            <button
              onClick={() => proposeTransaction()}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-glow-amethyst transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>PROPOSE TX</span>
            </button>
            <button
              onClick={triggerElection}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-[#38bdf8] transition-all"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>TRIGGER ELECTION</span>
            </button>
            <button
              onClick={toggleSplitBrain}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-all ${
                splitBrainActive 
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300' 
                  : 'bg-[#161822] hover:bg-[#1d202e] border-[#1f212c] text-amber-400'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>{splitBrainActive ? 'HEAL PARTITION' : 'INSPECT SPLIT-BRAIN'}</span>
            </button>
          </div>

          {/* Canvas Legend & Health Badge */}
          <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-2 pointer-events-none">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-xs font-mono ${
              isConsensusSafe && hasQuorum
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
            }`}>
              {isConsensusSafe && hasQuorum ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{isConsensusSafe && hasQuorum ? 'SAFETY & LIVENESS PRESERVED' : 'QUORUM COMPROMISED / STALLED'}</span>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#0a0b0e]/80 border border-[#1f212c] text-[10px] font-mono text-[#858b9f]">
              BFT Fault Threshold: <span className="text-[#e2e5ec]">f &lt; {algorithm === 'pbft' ? 'n/3' : 'n/2'} (Max {maxFaults} faulty)</span>
            </div>
          </div>

          {/* Interactive HTML5 Simulation Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="flex-1 w-full h-full cursor-crosshair"
          />

          {/* Bottom Live Ledger State Strip */}
          <div className="h-28 border-t border-[#1f212c] bg-[#0d0e14] px-4 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#858b9f] font-mono">
              <span className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-[#e2e5ec] font-semibold">REPLICATED STATE MACHINE LEDGER (BLOCKCHAIN LOG)</span>
              </span>
              <span>Committed Blocks: {selectedNode.ledger.length}</span>
            </div>
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              {selectedNode.ledger.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 px-3 py-1.5 rounded bg-[#161822] border border-[#1f212c] flex flex-col font-mono text-[11px]"
                >
                  <div className="flex items-center justify-between space-x-2 text-[#858b9f]">
                    <span>#{entry.index}</span>
                    <span className="text-[#38bdf8]">{entry.hash}</span>
                  </div>
                  <div className="text-[#e2e5ec] font-semibold truncate max-w-[140px]">{entry.command}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Cockpit Panel: Node Inspector & Event Stream */}
        <div className="col-span-4 flex flex-col h-full bg-[#12131a] overflow-hidden">
          {/* Node Inspector Card */}
          <div className="p-4 border-b border-[#1f212c]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold text-[#858b9f] flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>NODE INSPECTION TERMINAL</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                selectedNode.state === 'byzantine' ? 'bg-rose-950/80 text-rose-300 border border-rose-600' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-600'
              }`}>
                {selectedNode.state}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Node Identifier:</span>
                <span className="text-[#e2e5ec] font-semibold">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Consensus Role:</span>
                <span className="text-[#a78bfa] uppercase font-bold">{selectedNode.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Current Term / View:</span>
                <span className="text-[#38bdf8]">Term {selectedNode.term}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1f212c]/60">
                <span className="text-[#858b9f]">Partition Group:</span>
                <span className="text-[#e2e5ec]">{splitBrainActive ? `Partition ${selectedNode.partitionGroup}` : 'Unified Network'}</span>
              </div>
            </div>

            {/* Node Actions */}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => toggleNodeState(selectedNode.id)}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded text-xs font-mono font-semibold transition-all ${
                  selectedNode.state === 'byzantine'
                    ? 'bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600 text-emerald-200'
                    : 'bg-rose-900/60 hover:bg-rose-800 border border-rose-600 text-rose-200 shadow-glow-rose'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>{selectedNode.state === 'byzantine' ? 'RESTORE TO HONEST' : 'CORRUPT (BYZANTINE)'}</span>
              </button>
            </div>
          </div>

          {/* Quorum Math & Fault Model Explainer */}
          <div className="p-4 border-b border-[#1f212c] bg-[#161822]/60">
            <div className="flex items-center space-x-1.5 text-xs font-mono text-[#a78bfa] mb-2 font-semibold">
              <Info className="w-3.5 h-3.5" />
              <span>THEORETICAL FAULT BOUNDS</span>
            </div>
            <p className="text-[11px] text-[#858b9f] leading-relaxed mb-2">
              Under <strong className="text-[#e2e5ec]">PBFT</strong>, consensus is guaranteed if strictly less than 1/3 of nodes are Byzantine (<code className="text-[#38bdf8]">f &lt; n/3</code>). With 5 nodes, tolerating 1 faulty node requires a quorum of <strong className="text-[#e2e5ec]">2f + 1 = 3 votes</strong>.
            </p>
            <div className="w-full bg-[#0a0b0e] h-2 rounded-full overflow-hidden border border-[#1f212c]">
              <div 
                className={`h-full transition-all duration-300 ${byzantineNodes > maxFaults ? 'bg-rose-500' : 'bg-[#7c3aed]'}`}
                style={{ width: `${Math.min(100, (byzantineNodes / Math.max(1, maxFaults)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#858b9f] mt-1">
              <span>Byzantine: {byzantineNodes}/{totalNodes}</span>
              <span>Tolerance Limit: {maxFaults} max</span>
            </div>
          </div>

          {/* Real-time Consensus Event Stream */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#858b9f] flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>LIVE PROTOCOL EVENT STREAM</span>
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
