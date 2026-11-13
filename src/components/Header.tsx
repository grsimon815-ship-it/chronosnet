import React from 'react';
import { 
  Vote, 
  Globe, 
  Clock, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Terminal,
  Activity
} from 'lucide-react';
import { ModuleTab } from '../types';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
  onOpenTheory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenTheory,
  soundEnabled,
  onToggleSound,
}) => {
  const tabs: Array<{ id: ModuleTab; label: string; icon: React.ReactNode; accent: string }> = [
    { id: 'byzantine', label: 'Byzantine Consensus', icon: <Vote className="w-4 h-4" />, accent: 'border-[#7c3aed] text-[#a78bfa]' },
    { id: 'topology', label: 'Global BGP Topology', icon: <Globe className="w-4 h-4" />, accent: 'border-[#38bdf8] text-[#38bdf8]' },
    { id: 'clocks', label: 'Relativistic Clocks', icon: <Clock className="w-4 h-4" />, accent: 'border-[#a855f7] text-[#c084fc]' },
    { id: 'ddos', label: 'DDoS Resilience', icon: <ShieldAlert className="w-4 h-4" />, accent: 'border-[#f43f5e] text-[#fb7185]' },
  ];

  return (
    <header className="h-14 border-b border-[#1f212c] bg-[#0c0d12] flex items-center justify-between px-6 flex-shrink-0 z-20">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] via-[#6366f1] to-[#38bdf8] p-[1px] shadow-glow-amethyst flex items-center justify-center">
          <div className="w-full h-full bg-[#0a0b0e] rounded-[7px] flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#38bdf8]" />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-sm text-[#e2e5ec]">ChronosNet</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1f212c] text-[#858b9f]">v2.4-PROD</span>
          </div>
          <span className="text-[10px] text-[#858b9f] font-mono tracking-wider">SERENITY SYSTEM COCKPIT</span>
        </div>
      </div>

      {/* Center Module Navigation Tabs */}
      <nav className="flex items-center space-x-1 bg-[#12131a] p-1 rounded-lg border border-[#1f212c]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                soundManager.playTick(800);
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-mono transition-all duration-200 ${
                isActive
                  ? 'bg-[#1a1c27] text-[#e2e5ec] shadow-sm border border-[#2a2d3e]'
                  : 'text-[#858b9f] hover:text-[#e2e5ec] hover:bg-[#161822]'
              }`}
            >
              <span className={isActive ? tab.accent.split(' ')[1] : 'text-[#858b9f]'}>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Utility Controls */}
      <div className="flex items-center space-x-3">
        {/* Theory / CS Docs Modal Button */}
        <button
          onClick={onOpenTheory}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#161822] hover:bg-[#1d202e] border border-[#1f212c] text-xs font-mono text-[#a78bfa] transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>ACADEMIC FOUNDATIONS</span>
        </button>

        {/* Audio Mute / Unmute */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Telemetry Sound' : 'Enable Telemetry Audio'}
          className={`p-1.5 rounded border text-xs transition-all ${
            soundEnabled
              ? 'bg-[#7c3aed]/15 border-[#7c3aed]/40 text-[#a78bfa]'
              : 'bg-[#161822] border-[#1f212c] text-[#858b9f]'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
