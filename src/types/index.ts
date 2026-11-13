export type ModuleTab = 'byzantine' | 'topology' | 'clocks' | 'ddos';

export interface SystemTelemetry {
  rttMs: number;
  jitterMs: number;
  packetLossPercent: number;
  consensusHealth: number; // 0 - 100%
  throughputRps: number;
  activeNodesCount: number;
  totalPacketsDelivered: number;
  totalPacketsDropped: number;
  anomaliesDetected: number;
}

// Byzantine Types
export type ConsensusAlgorithm = 'raft' | 'pbft' | 'paxos';
export type ByzantineNodeRole = 'leader' | 'follower' | 'candidate' | 'primary' | 'replica' | 'proposer' | 'acceptor';
export type ByzantineNodeState = 'healthy' | 'byzantine' | 'isolated';

export interface ByzantineNode {
  id: string;
  name: string;
  x: number;
  y: number;
  role: ByzantineNodeRole;
  state: ByzantineNodeState;
  term: number;
  votedFor: string | null;
  ledger: Array<{ index: number; term: number; command: string; hash: string }>;
  prepared: boolean;
  committed: boolean;
  votesReceived: string[];
  partitionGroup: number; // 0 = main, 1 = isolated partition A, 2 = isolated partition B
}

export interface ByzantineMessage {
  id: string;
  from: string;
  to: string;
  type: 'RequestVote' | 'VoteResponse' | 'AppendEntries' | 'PrePrepare' | 'Prepare' | 'Commit' | 'PreparePaxos' | 'Promise' | 'Accept' | 'Accepted';
  term: number;
  payload: any;
  progress: number; // 0 to 1
  speed: number;
  isMalicious?: boolean;
}

// BGP & Topology Types
export type RoutingProtocol = 'bgp' | 'dijkstra' | 'bellman_ford';
export type LinkStatus = 'active' | 'severed' | 'congested';

export interface TopologyNode {
  id: string;
  asn: number;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  x: number; // Canvas normalized x
  y: number; // Canvas normalized y
  prefixes: string[];
  isRogue: boolean;
  isAnycast?: boolean;
  routingTable: Map<string, { nextHop: string; asPath: number[]; cost: number }>;
}

export interface TopologyLink {
  id: string;
  from: string;
  to: string;
  latencyMs: number;
  capacityGbps: number;
  status: LinkStatus;
}

export interface TopologyPacket {
  id: string;
  from: string;
  to: string;
  destIp: string;
  currentHop: string;
  nextHop: string;
  path: string[];
  progress: number;
  isIntercepted: boolean;
  isLooped: boolean;
  ttl: number;
}

// Relativistic Clocks & Timestamps
export interface ClockNode {
  id: string;
  name: string;
  oscillatorDriftPpm: number; // -100 to +100 ppm
  physicalTimeMs: number;
  logicalLamportTime: number;
  vectorClock: number[]; // e.g. [A, B, C]
  events: ClockEvent[];
  balance: number;
}

export interface ClockEvent {
  id: string;
  nodeId: string;
  type: 'local' | 'send' | 'receive';
  label: string;
  timestampPhysical: number;
  lamportTime: number;
  vectorClock: number[];
  relatedMessageId?: string;
}

export interface ClockMessage {
  id: string;
  from: string;
  to: string;
  payload: string;
  sendPhysicalTime: number;
  sendLamportTime: number;
  sendVectorClock: number[];
  progress: number;
  transitDelayMs: number;
}

// DDoS Types
export type DdosAttackVector = 'syn_flood' | 'dns_amplification' | 'http_rapid_reset';

export interface DdosConfig {
  activeVector: DdosAttackVector;
  attackIntensity: number; // 1 to 10
  tokenBucketEnabled: boolean;
  tokenBucketRate: number; // tokens per sec
  tokenBucketCapacity: number;
  anycastEnabled: boolean;
  synCookiesEnabled: boolean;
  circuitBreakerThreshold: number; // load %
  adaptiveThrottling: boolean;
}

export interface DdosNode {
  id: string;
  name: string;
  type: 'victim' | 'bot' | 'client' | 'scrubber' | 'reflector';
  x: number;
  y: number;
  currentRps: number;
  droppedRps: number;
  cpuLoad: number; // 0 - 100%
  memoryLoad: number; // 0 - 100%
  isCircuitBroken: boolean;
}

export interface DdosPacket {
  id: string;
  from: string;
  to: string;
  type: 'legit' | 'malicious';
  protocol: 'TCP_SYN' | 'DNS_RESP' | 'HTTP2_RST';
  sizeBytes: number;
  progress: number;
  dropped: boolean;
  dropReason?: string;
  path: { x: number; y: number }[];
}
