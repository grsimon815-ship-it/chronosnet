import React, { useState } from 'react';
import { X, BookOpen, Layers, ShieldCheck, Clock, Globe, Flame } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTopic, setActiveTopic] = useState<'byzantine' | 'bgp' | 'clocks' | 'ddos'>('byzantine');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-4xl max-h-[85vh] bg-[#12131a] border border-[#1f212c] rounded-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f212c] bg-[#161822]">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-[#38bdf8]" />
            <h2 className="text-sm font-semibold font-mono text-[#e2e5ec] uppercase tracking-wider">
              ChronosNet Academic & Architectural Reference
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1f212c] text-[#858b9f] hover:text-[#e2e5ec] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic Selector Tabs */}
        <div className="flex border-b border-[#1f212c] bg-[#0d0e14] px-6">
          <button
            onClick={() => setActiveTopic('byzantine')}
            className={`py-3 px-4 text-xs font-mono border-b-2 font-medium transition-all ${
              activeTopic === 'byzantine' ? 'border-[#7c3aed] text-[#a78bfa]' : 'border-transparent text-[#858b9f] hover:text-[#e2e5ec]'
            }`}
          >
            1. Byzantine Fault Tolerance (BFT)
          </button>
          <button
            onClick={() => setActiveTopic('bgp')}
            className={`py-3 px-4 text-xs font-mono border-b-2 font-medium transition-all ${
              activeTopic === 'bgp' ? 'border-[#38bdf8] text-[#38bdf8]' : 'border-transparent text-[#858b9f] hover:text-[#e2e5ec]'
            }`}
          >
            2. BGP Routing & Prefix Hijacking
          </button>
          <button
            onClick={() => setActiveTopic('clocks')}
            className={`py-3 px-4 text-xs font-mono border-b-2 font-medium transition-all ${
              activeTopic === 'clocks' ? 'border-[#a855f7] text-[#c084fc]' : 'border-transparent text-[#858b9f] hover:text-[#e2e5ec]'
            }`}
          >
            3. Relativistic Clocks & Causality
          </button>
          <button
            onClick={() => setActiveTopic('ddos')}
            className={`py-3 px-4 text-xs font-mono border-b-2 font-medium transition-all ${
              activeTopic === 'ddos' ? 'border-[#f43f5e] text-[#fb7185]' : 'border-transparent text-[#858b9f] hover:text-[#e2e5ec]'
            }`}
          >
            4. DDoS & Cyber Resilience
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 font-sans text-xs text-[#858b9f] leading-relaxed space-y-4">
          {activeTopic === 'byzantine' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#e2e5ec] font-mono">
                The Byzantine Generals Problem & Distributed Consensus
              </h3>
              <p>
                Formulated by Leslie Lamport, Robert Shostak, and Marshall Pease in 1982, the Byzantine Generals Problem abstracts the difficulty of reaching agreement in distributed systems where components may not only fail (crash faults) but may actively send malicious, contradictory, or equivocated information (Byzantine faults).
              </p>
              <div className="p-4 rounded-lg bg-[#0a0b0e] border border-[#1f212c] font-mono space-y-2">
                <div className="text-[#a78bfa] font-bold">Key Theorems & Bounds:</div>
                <div>&bull; <strong className="text-[#e2e5ec]">PBFT Bound:</strong> $3f + 1 \le n$ (A system with $n$ nodes can tolerate strictly $f &lt; n/3$ Byzantine nodes). To guarantee safety and liveness across an asynchronous network, a quorum of $2f + 1$ honest votes is required.</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Crash Fault Tolerance (CFT - Raft/Paxos):</strong> Tolerates $f &lt; n/2$ fail-stop crashes using a majority quorum of $\lfloor n/2 \rfloor + 1$.</div>
                <div>&bull; <strong className="text-[#e2e5ec]">FLP Impossibility (Fischer, Lynch, Paterson, 1985):</strong> In an asynchronous network, no deterministic consensus protocol can guarantee both safety and liveness in the presence of even a single unannounced crash failure.</div>
              </div>
            </div>
          )}

          {activeTopic === 'bgp' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#e2e5ec] font-mono">
                Border Gateway Protocol (BGP-4) & Prefix Hijacking Mechanics
              </h3>
              <p>
                The Internet consists of over 75,000 Autonomous Systems (AS) stitched together via BGP-4. Because BGP originally operated on implicit trust with no cryptographic verification, an attacker can broadcast false route announcements.
              </p>
              <div className="p-4 rounded-lg bg-[#0a0b0e] border border-[#1f212c] font-mono space-y-2">
                <div className="text-[#38bdf8] font-bold">Why BGP Hijacking Works:</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Longest Prefix Matching (LPM):</strong> Forwarding Information Bases (FIB) prioritize the most specific subnet mask. If Google announces <code className="text-[#38bdf8]">8.8.8.0/23</code> and a rogue AS announces <code className="text-[#f43f5e]">8.8.8.0/24</code>, global traffic routes to the /24 rogue AS regardless of path distance!</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Mitigation via RPKI:</strong> Resource Public Key Infrastructure (RPKI) issues cryptographically signed Route Origin Authorizations (ROAs), allowing routers to discard Invalid origin announcements.</div>
              </div>
            </div>
          )}

          {activeTopic === 'clocks' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#e2e5ec] font-mono">
                Relativistic Clock Drift & Logical Timestamps (Leslie Lamport, 1978)
              </h3>
              <p>
                Quartz crystal oscillators fluctuate due to temperature, voltage, and hardware manufacturing variations, causing clock drift typically between 10 to 100 parts per million (PPM). Therefore, physical wall-clock timestamps cannot guarantee causality in distributed transactions.
              </p>
              <div className="p-4 rounded-lg bg-[#0a0b0e] border border-[#1f212c] font-mono space-y-2">
                <div className="text-[#c084fc] font-bold">Causality Formulations:</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Happens-Before Relation ($a \to b$):</strong> If event $a$ caused event $b$, then any causal clock must reflect this ($C(a) &lt; C(b)$).</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Lamport Logical Clocks:</strong> On message receipt, $L(recv) = \max(L(local), L(msg)) + 1$. Provides a strict partial ordering.</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Vector Clocks:</strong> Maintains an array of logical times for all $N$ processes. Distinguishes between causally linked events ($A \to B$) and truly concurrent conflicting events ($A \parallel B$).</div>
              </div>
            </div>
          )}

          {activeTopic === 'ddos' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#e2e5ec] font-mono">
                DDoS Attack Vectors & Resilience Engineering
              </h3>
              <p>
                Distributed Denial of Service attacks weaponize asymmetric resource consumption across network layers (L3/L4 volumetric and state-table attacks vs L7 application floods).
              </p>
              <div className="p-4 rounded-lg bg-[#0a0b0e] border border-[#1f212c] font-mono space-y-2">
                <div className="text-[#fb7185] font-bold">Mechanisms & Defense Pillars:</div>
                <div>&bull; <strong className="text-[#e2e5ec]">Token Bucket Algorithm:</strong> Tokens accumulate in a bucket of capacity $B$ at rate $r$. Packets are accepted only if sufficient tokens exist, smoothing bursts while guaranteeing rate caps.</div>
                <div>&bull; <strong className="text-[#e2e5ec]">SYN Cookies (D.J. Bernstein, 1996):</strong> Eliminates the SYN backlog table by encoding connection state cryptographically inside the TCP sequence number: <code className="text-[#38bdf8]">ISN = HMAC(src_ip, dst_ip, t, secret)</code>.</div>
                <div>&bull; <strong className="text-[#e2e5ec]">BGP Anycast:</strong> Multiple geographic scrubbers broadcast the identical IP address via BGP. Floods are automatically split and diluted across the global Internet backbone.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1f212c] bg-[#161822] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono rounded bg-[#1f212c] hover:bg-[#2a2d3e] text-[#e2e5ec] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
