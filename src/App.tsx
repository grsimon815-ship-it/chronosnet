import React, { useState, useEffect } from 'react';
import { ModuleTab, SystemTelemetry } from './types';
import { Header } from './components/Header';
import { TelemetryHUD } from './components/TelemetryHUD';
import { TheoryModal } from './components/TheoryModal';
import { ByzantineConsensusSandbox } from './modules/byzantine/ByzantineConsensusSandbox';
import { BgpTopologySimulator } from './modules/topology/BgpTopologySimulator';
import { RelativisticClockDrift } from './modules/clocks/RelativisticClockDrift';
import { DdosResilienceArena } from './modules/ddos/DdosResilienceArena';
import { soundManager } from './utils/sound';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModuleTab>('byzantine');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    rttMs: 38,
    jitterMs: 1.2,
    packetLossPercent: 0.01,
    consensusHealth: 100,
    throughputRps: 2480,
    activeNodesCount: 19,
    totalPacketsDelivered: 14209,
    totalPacketsDropped: 14,
    anomaliesDetected: 0,
  });

  // Dynamic telemetry jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        rttMs: Math.floor(35 + Math.random() * 8),
        jitterMs: parseFloat((1.0 + Math.random() * 0.6).toFixed(1)),
        packetLossPercent: parseFloat((Math.random() * 0.04).toFixed(2)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    soundManager.enabled = nextSound;
    if (nextSound) soundManager.playConsensusChime();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0b0e] text-[#e2e5ec] overflow-hidden font-sans select-none">
      {/* Top Cockpit Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenTheory={() => setIsTheoryOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Interactive Simulation Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'byzantine' && <ByzantineConsensusSandbox />}
        {activeTab === 'topology' && <BgpTopologySimulator />}
        {activeTab === 'clocks' && <RelativisticClockDrift />}
        {activeTab === 'ddos' && <DdosResilienceArena />}
      </main>

      {/* Bottom Live System Telemetry HUD */}
      <TelemetryHUD telemetry={telemetry} />

      {/* Academic Theory Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
};

export default App;
