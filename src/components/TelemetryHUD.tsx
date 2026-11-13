import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, ShieldCheck, Zap, Server } from 'lucide-react';
import { SystemTelemetry } from '../types';

interface TelemetryHUDProps {
  telemetry: SystemTelemetry;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry }) => {
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <footer className="h-8 border-t border-[#1f212c] bg-[#090a0d] px-6 flex items-center justify-between text-[11px] font-mono text-[#858b9f] flex-shrink-0 z-20">
      {/* Left Core Indicators */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
          <span className="text-[#e2e5ec] font-semibold">SERENITY ENGINE</span>
          <span className="text-[#38bdf8]">[ONLINE]</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Radio className="w-3.5 h-3.5 text-[#858b9f]" />
          <span>GLOBAL RTT:</span>
          <span className="text-[#e2e5ec] font-bold">{telemetry.rttMs} ms</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span>JITTER:</span>
          <span className="text-[#e2e5ec]">{telemetry.jitterMs} ms</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span>PACKET LOSS:</span>
          <span className={telemetry.packetLossPercent > 5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
            {telemetry.packetLossPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Right Health & Rendering Performance */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>CONSENSUS HEALTH:</span>
          <span className="text-[#a78bfa] font-bold">{telemetry.consensusHealth}%</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>CLIENT SIMULATION:</span>
          <span className="text-emerald-400 font-bold">{fps} FPS</span>
        </div>
      </div>
    </footer>
  );
};
