
export enum ParticleType {
  ELECTRON = 'electron',
  PROTON = 'proton',
  NEUTRON = 'neutron',
  PHOTON = 'photon',
  HIGGS = 'higgs'
}

export interface PhysicalProperties {
  mass: number; // kg
  charge: number; // C
  spin: number;
}

export interface QuantumState {
  amplitude0: number; // Probability amplitude for state |0>
  amplitude1: number; // Probability amplitude for state |1>
  collapsed: boolean;
  observedValue: 0 | 1 | null;
}

export interface HyperBit {
  id: string;
  type: ParticleType;
  physics: PhysicalProperties;
  quantum: QuantumState;
  position: { x: number; y: number; z: number }; // Initial position
  velocity: { x: number; y: number; z: number }; // Drift vector
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
  introspection?: string; // System burst reasoning
  attachment?: string; // Base64 image data
  mode?: string; // Mode in which the message was generated
}

export interface SystemMetrics {
  stability: number;
  entropy: number;
  coherence: number;
  dimension: number;
  resonance: number; // Synaptic Resonance (Hz)
}

export interface NeuralTopology {
  activeNodes: number;
  dominantMode: 'ANALYTIC' | 'CREATIVE' | 'DREAM' | 'EMPATHIC' | 'ALCHEMY';
  globalFrequency: number; // Hz
  shadowContext: string[]; // Emotional footprint
}

export interface VSM {
  px: number;
  py: number;
  pz: number;
  energy: number;
}

export interface GenesisEntry {
  id: string;
  timestamp: number;
  actionType: string;
  metadata: any;
}

// --- VERSIONING TYPES ---

export enum UpdateStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  PLANNED = 'planned'
}

export interface SystemUpdate {
  version: string;
  date: string;
  title: string;
  description: string;
  status: UpdateStatus;
  features: string[];
}
