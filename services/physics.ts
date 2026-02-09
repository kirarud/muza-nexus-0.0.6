
import { ParticleType, PhysicalProperties, QuantumState, HyperBit } from '../types';

// Real physical constants (SI units)
export const CONSTANTS = {
  PLANCK: 6.62607015e-34, // J⋅s
  LIGHT_SPEED: 299792458, // m/s
  BOLTZMANN: 1.380649e-23, // J/K
  G_CONSTANT: 6.67430e-11, // m^3⋅kg^−1⋅s^−2
  FINE_STRUCTURE: 1 / 137.035999,
  SCHUMANN_RESONANCE: 7.83, // Hz (Earth's frequency)
};

// Particle Data Group (approximated values)
const PARTICLE_DATA: Record<ParticleType, PhysicalProperties> = {
  [ParticleType.ELECTRON]: { mass: 9.10938356e-31, charge: -1.60217663e-19, spin: 0.5 },
  [ParticleType.PROTON]: { mass: 1.6726219e-27, charge: 1.60217663e-19, spin: 0.5 },
  [ParticleType.NEUTRON]: { mass: 1.674927471e-27, charge: 0, spin: 0.5 },
  [ParticleType.PHOTON]: { mass: 0, charge: 0, spin: 1 },
  [ParticleType.HIGGS]: { mass: 2.2e-25, charge: 0, spin: 0 },
};

export const PhysicsService = {
  getParticleData(type: ParticleType): PhysicalProperties {
    return PARTICLE_DATA[type];
  },

  createQuantumState(): QuantumState {
    return {
      amplitude0: Math.sqrt(0.5),
      amplitude1: Math.sqrt(0.5),
      collapsed: false,
      observedValue: null,
    };
  },

  generateVelocityVector(): { x: number; y: number; z: number } {
    // Increased speed factor for visible "Live" movement
    const speed = 5.0; // was 0.5
    return {
      x: (Math.random() - 0.5) * speed,
      y: (Math.random() - 0.5) * speed,
      z: (Math.random() - 0.5) * speed
    };
  },

  // Calculate position at a specific point in time
  getPositionAtTime(bit: HyperBit, currentTime: number): { x: number; y: number; z: number } | null {
    if (currentTime < bit.timestamp) return null; // Bit hasn't been born yet

    const age = (currentTime - bit.timestamp) / 1000; // seconds
    
    // Orbital mechanics simulation (Lissajous-like drift)
    return {
      x: bit.position.x + Math.sin(age * bit.velocity.x) * 10 + (age * bit.velocity.x * 2),
      y: bit.position.y + Math.cos(age * bit.velocity.y) * 10 + (age * bit.velocity.y * 2),
      z: bit.position.z + Math.sin(age * bit.velocity.z) * 10 + (age * bit.velocity.z * 2)
    };
  },

  collapseState(state: QuantumState, bias: number = 0.5): QuantumState {
    const probability1 = state.amplitude1 * state.amplitude1;
    const adjustedProb = (probability1 + bias) / 2;
    const outcome = Math.random() < adjustedProb ? 1 : 0;
    
    return {
      ...state,
      collapsed: true,
      observedValue: outcome,
      amplitude0: outcome === 0 ? 1 : 0,
      amplitude1: outcome === 1 ? 1 : 0,
    };
  },

  calculateEntropy(numParticles: number, coherence: number): number {
    if (numParticles === 0) return 0;
    return -coherence * Math.log(coherence + Number.EPSILON);
  },

  calculateResonance(entropy: number, stability: number): number {
    const baseFreq = CONSTANTS.SCHUMANN_RESONANCE;
    const modulation = (stability - entropy) * 10;
    return Math.max(0.5, baseFreq + modulation);
  }
};
