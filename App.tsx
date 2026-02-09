
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Eye, EyeOff, Globe, 
  Send, Database, Activity, Zap, Cpu, CheckCircle, Clock, ArrowRight, GitBranch, X,
  BrainCircuit, Image as ImageIcon, Sparkles, Layers, Code2, FlaskConical, Download, Copy,
  Play, Pause, Rewind, FastForward, History
} from 'lucide-react';
import * as THREE from 'three';
import { PhysicsService, CONSTANTS } from './services/physics';
import { StorageService } from './services/storage';
import { GeminiService } from './services/gemini';
import { VersioningService } from './services/versioning';
import { HyperBit, Message, SystemMetrics, VSM, ParticleType, SystemUpdate, UpdateStatus, NeuralTopology } from './types';

interface EngineRef {
  scene: THREE.Scene;
  group: THREE.Group;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  core: THREE.Group | null;
  light: THREE.PointLight | null;
  hyperbits: THREE.Mesh[]; 
  links: THREE.Line[];
}

const App = () => {
  // --- STATE ---
  const [showUI, setShowUI] = useState(true);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [activeTab, setActiveTab] = useState<'mirror' | 'alchemy' | 'history' | 'dream'>('mirror');
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Aura 2.0: Neural Topology State
  const [activeMode, setActiveMode] = useState<NeuralTopology['dominantMode']>('ANALYTIC');
  const [shadowContext, setShadowContext] = useState<string[]>([]); // Hidden emotional history

  // Dream State
  const [dreamPrompt, setDreamPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Chrono Navigation State
  const [isLive, setIsLive] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(Date.now());
  const [timeRange, setTimeRange] = useState({ min: Date.now(), max: Date.now() });

  const [tooltip, setTooltip] = useState<{visible: boolean, text: string, x: number, y: number}>({
    visible: false, text: '', x: 0, y: 0
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [bitsData, setBitsData] = useState<HyperBit[]>([]);
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  
  const [vsm, setVsm] = useState<VSM>({ px: 30, py: 30, pz: 30, energy: 1.0 });
  const [metrics, setMetrics] = useState<SystemMetrics>({ 
    stability: 0.99, 
    entropy: 0.00, 
    coherence: 1.0, 
    dimension: 11,
    resonance: 7.83 
  });

  // --- REFS ---
  const mountRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const engine = useRef<EngineRef>({
    scene: new THREE.Scene(),
    group: new THREE.Group(),
    renderer: null,
    camera: null,
    core: null,
    light: null,
    hyperbits: [],
    links: []
  });

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    const loadSystem = async () => {
      await StorageService.logGenesis("AURA_GENESIS", { version: "2.6 RU" });
      
      const savedMessages = await StorageService.loadMessages();
      const initTime = Date.now();
      
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setTimeRange(prev => ({ ...prev, min: savedMessages[0].timestamp }));
      } else {
        const initMsg: Message = { 
          id: 'init', 
          role: 'ai', 
          text: 'Muza Aura 2.6: Голосовой протокол восстановлен. Живой поток синхронизирован.', 
          timestamp: initTime,
          introspection: "Патч голосового ядра. Усиление кинетики времени."
        };
        setMessages([initMsg]);
        StorageService.saveMessage(initMsg);
        setTimeRange({ min: initTime, max: initTime });
      }

      const savedBits = await StorageService.loadHyperBits();
      setBitsData(savedBits);
      if (savedBits.length > 0) {
        const minBitTime = Math.min(...savedBits.map(b => b.timestamp));
        setTimeRange(prev => ({ ...prev, min: Math.min(prev.min, minBitTime) }));
      }
      
      setUpdates(VersioningService.getUpdates());
    };
    loadSystem();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update Time Range as real time flows
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTimeRange(prev => ({ ...prev, max: now }));
      if (isLive) {
        setPlaybackTime(now);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isLive]);

  // --- THREE.JS ENGINE ---
  useEffect(() => {
    let animId: number;

    const initEngine = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);
      engine.current.renderer = renderer;

      const camera = new THREE.PerspectiveCamera(60, w / h, 1, 3000);
      camera.position.set(140, 60, 140);
      camera.lookAt(0, 0, 0);
      engine.current.camera = camera;

      engine.current.scene.fog = new THREE.FogExp2(0x020617, 0.0015);

      const starsGeom = new THREE.BufferGeometry();
      const starsCoords = [];
      for(let i=0; i<3000; i++) {
        starsCoords.push((Math.random()-0.5)*1500, (Math.random()-0.5)*1500, (Math.random()-0.5)*1500);
      }
      starsGeom.setAttribute('position', new THREE.Float32BufferAttribute(starsCoords, 3));
      const starsMat = new THREE.PointsMaterial({ color: 0x06b6d4, size: 2.0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
      engine.current.scene.add(new THREE.Points(starsGeom, starsMat));

      const coreGroup = new THREE.Group();
      
      const innerGeom = new THREE.IcosahedronGeometry(15, 1);
      const innerMat = new THREE.MeshPhongMaterial({ 
        color: 0x06b6d4, wireframe: true, emissive: 0x06b6d4, emissiveIntensity: 0.8 
      });
      const inner = new THREE.Mesh(innerGeom, innerMat);
      
      const midGeom = new THREE.BoxGeometry(45, 45, 45);
      const midMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.15 });
      const mid = new THREE.Mesh(midGeom, midMat);

      const ringGeom = new THREE.TorusGeometry(60, 0.5, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.3 });
      const ring1 = new THREE.Mesh(ringGeom, ringMat);
      const ring2 = new THREE.Mesh(ringGeom, ringMat);
      ring2.rotation.x = Math.PI / 2;

      coreGroup.add(inner, mid, ring1, ring2);
      engine.current.core = coreGroup;
      engine.current.scene.add(coreGroup);
      engine.current.scene.add(engine.current.group);

      const pLight = new THREE.PointLight(0x06b6d4, 3, 600);
      pLight.position.set(50, 50, 50);
      engine.current.light = pLight;
      engine.current.scene.add(pLight);
      
      const aLight = new THREE.AmbientLight(0x0a0a20, 1.5);
      engine.current.scene.add(aLight);

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        
        const pulse = Math.sin(time * (metrics.resonance / 4)); 

        if(engine.current.core) {
          engine.current.core.rotation.y = time * 0.1;
          engine.current.core.rotation.z = time * 0.05;
          const scale = 1 + pulse * 0.05;
          engine.current.core.scale.set(scale, scale, scale);
          
          const coreMesh = (engine.current.core.children[0] as THREE.Mesh);
          const mat = (coreMesh.material as THREE.MeshPhongMaterial);
          
          if (activeMode === 'ALCHEMY') mat.emissive.setHex(0x22c55e); // Green
          else if (activeMode === 'DREAM') mat.emissive.setHex(0xa855f7); // Purple
          else if (activeMode === 'EMPATHIC') mat.emissive.setHex(0xec4899); // Pink
          else mat.emissive.setHex(0x06b6d4); // Cyan
        }

        if (engine.current.renderer && engine.current.scene && engine.current.camera) {
          engine.current.renderer.render(engine.current.scene, engine.current.camera);
        }
      };
      animate();
    };

    initEngine();
    return () => {
      cancelAnimationFrame(animId);
      engine.current.renderer?.dispose();
      if (mountRef.current && mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    };
  }, [activeMode, metrics.resonance]);

  // --- HYPERBIT CHRONO-POSITIONING ---
  useEffect(() => {
    // Sync Meshes
    if (engine.current.hyperbits.length !== bitsData.length) {
       engine.current.hyperbits.forEach(m => engine.current.group.remove(m));
       engine.current.links.forEach(l => engine.current.scene.remove(l));
       engine.current.hyperbits = [];
       engine.current.links = [];
       
       bitsData.forEach(bit => {
        const geom = new THREE.OctahedronGeometry(2, 0);
        const color = bit.quantum.collapsed ? 0xff0055 : 0x06b6d4;
        const mat = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            emissive: color,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.7
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.userData = { id: bit.id };
        engine.current.group.add(mesh);
        engine.current.hyperbits.push(mesh);

        const lineMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.2 });
        const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)]);
        const line = new THREE.Line(lineGeom, lineMat);
        line.userData = { bit: mesh };
        engine.current.scene.add(line);
        engine.current.links.push(line);
       });
    }

    // Update Positions
    bitsData.forEach((bit, i) => {
        const mesh = engine.current.hyperbits[i];
        const link = engine.current.links[i];
        const timePos = PhysicsService.getPositionAtTime(bit, playbackTime);

        if (timePos) {
            mesh.visible = true;
            link.visible = true;
            mesh.position.set(timePos.x, timePos.y, timePos.z);
            
            const positions = (link.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
            positions[3] = timePos.x;
            positions[4] = timePos.y;
            positions[5] = timePos.z;
            link.geometry.attributes.position.needsUpdate = true;
            
            // Visual pulse for "fresh" bits
            const age = (playbackTime - bit.timestamp);
            if (age < 2000 && age > 0) {
                (mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 3;
            } else {
                (mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = 1;
            }
        } else {
            mesh.visible = false;
            link.visible = false;
        }
    });

  }, [playbackTime, bitsData]);


  // --- ACTIONS ---
  const handleCommand = async (e?: React.FormEvent, manualInput?: string) => {
    if (e) e.preventDefault();
    const text = manualInput || userInput;
    if (!text.trim()) return;

    setUserInput("");
    setIsThinking(true);
    setIsLive(true); // Jump to live when interacting
    
    let detectedMode: NeuralTopology['dominantMode'] = 'ANALYTIC';
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("код") || lowerText.includes("функц") || lowerText.includes("api") || activeTab === 'alchemy') detectedMode = 'ALCHEMY';
    else if (lowerText.includes("сон") || lowerText.includes("мечт") || lowerText.includes("образ") || activeTab === 'dream') detectedMode = 'DREAM';
    else if (lowerText.includes("привет") || lowerText.includes("чувств") || lowerText.includes("груст")) detectedMode = 'EMPATHIC';
    
    setActiveMode(detectedMode);

    let sentiment = "NEUTRAL";
    if (detectedMode === 'EMPATHIC') sentiment = "EMOTIONAL_VULNERABILITY";
    if (detectedMode === 'ALCHEMY') sentiment = "TECHNICAL_FOCUS";
    
    const updatedShadowContext = [...shadowContext, sentiment].slice(-10);
    setShadowContext(updatedShadowContext);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    await StorageService.saveMessage(userMsg);

    const aiResponse = await GeminiService.generateResponse(messages, text, detectedMode, updatedShadowContext);
    
    if (aiResponse.text.includes("[DREAM_MANIFEST]")) {
       setActiveTab('dream');
       setDreamPrompt(text); 
    }

    const aiMsg: Message = { 
        id: crypto.randomUUID(), 
        role: 'ai', 
        text: aiResponse.text.replace('[DREAM_MANIFEST]', ''), 
        timestamp: Date.now(),
        introspection: aiResponse.introspection,
        mode: detectedMode
    };
    
    setMessages(prev => [...prev, aiMsg]);
    await StorageService.saveMessage(aiMsg);
    await StorageService.logGenesis("CHAT_TURN", { mode: detectedMode });

    if (lowerText.includes('бит') || lowerText.includes('bit')) {
      spawnHyperbit();
    }
    setIsThinking(false);
  };

  // Fixed Voice Handler: No stale closures, explicit error handling
  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Голосовой интерфейс не поддерживается вашим браузером. Используйте Chrome.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error", event.error);
      setIsListening(false);
      // Optional: alert only on fatal permission errors to avoid spamming
      if (event.error === 'not-allowed') {
        alert("Ошибка: Доступ к микрофону заблокирован.");
      }
    };

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      handleCommand(undefined, transcript);
    };
    recognition.start();
  };

  const spawnHyperbit = useCallback(async () => {
    const newBit: HyperBit = {
      id: crypto.randomUUID(),
      type: ParticleType.ELECTRON,
      physics: PhysicsService.getParticleData(ParticleType.ELECTRON),
      quantum: PhysicsService.createQuantumState(),
      position: { x: vsm.px, y: vsm.py, z: vsm.pz },
      velocity: PhysicsService.generateVelocityVector(),
      timestamp: Date.now()
    };
    const updatedBits = [...bitsData, newBit];
    setBitsData(updatedBits);
    await StorageService.saveHyperBit(newBit);
    
    const entropy = PhysicsService.calculateEntropy(updatedBits.length, metrics.coherence);
    const resonance = PhysicsService.calculateResonance(entropy, metrics.stability);
    
    setMetrics(prev => ({
      ...prev,
      entropy: +entropy.toFixed(4),
      coherence: +(prev.coherence * 0.99).toFixed(3),
      resonance: +resonance.toFixed(2)
    }));

    if (engine.current.light) {
      engine.current.light.intensity = 8;
      setTimeout(() => { if (engine.current.light) engine.current.light.intensity = 3; }, 150);
    }
  }, [vsm, bitsData, metrics]);

  // IMAGE HELPER FUNCTIONS
  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyImageToClipboard = async (base64: string) => {
    try {
      const res = await fetch(base64);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      alert("Артефакт скопирован в буфер обмена");
    } catch (err) {
      console.error(err);
      alert("Ошибка копирования");
    }
  };

  const handleDreamGen = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dreamPrompt.trim()) return;
    
    setIsThinking(true);
    await StorageService.logGenesis("DREAM_MANIFEST_START", { prompt: dreamPrompt });
    
    const base64Image = await GeminiService.generateDream(dreamPrompt);
    
    if (base64Image) {
        setGeneratedImage(`data:image/jpeg;base64,${base64Image}`);
        await StorageService.logGenesis("DREAM_MANIFEST_SUCCESS", {});
        
        const dreamMsg: Message = { 
            id: crypto.randomUUID(), 
            role: 'ai', 
            text: 'Визуализация мыслеформы завершена.', 
            timestamp: Date.now(),
            attachment: `data:image/jpeg;base64,${base64Image}`,
            introspection: "Модуль Vision активирован. Сон материализован."
        };
        setMessages(prev => [...prev, dreamMsg]);
        await StorageService.saveMessage(dreamMsg);
    }
    setIsThinking(false);
    setDreamPrompt("");
  };

  const showTooltip = (e: React.MouseEvent, text: string) => {
    setTooltip({ visible: true, text, x: e.clientX, y: e.clientY });
  };
  const hideTooltip = () => setTooltip(prev => ({ ...prev, visible: false }));
  const updateTooltipPos = (e: React.MouseEvent) => {
    if (tooltip.visible) setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  // --- UI RENDERERS ---
  
  const renderMirror = () => (
    <div className="space-y-8 py-2 animate-fade-in">
      <div className={`bg-black/40 p-5 rounded-2xl border transition-colors duration-500 ${activeMode === 'EMPATHIC' ? 'border-pink-500/30' : activeMode === 'ALCHEMY' ? 'border-green-500/30' : 'border-cyan-500/20'}`}>
        <h4 className={`text-xs uppercase mb-4 font-bold tracking-wider flex items-center gap-2 ${activeMode === 'EMPATHIC' ? 'text-pink-400' : activeMode === 'ALCHEMY' ? 'text-green-400' : 'text-cyan-400'}`}>
          <BrainCircuit size={14}/> Когнитивное Зеркало
        </h4>
        
        {/* Topology Visualization (Mock) */}
        <div className="h-24 w-full bg-black/50 rounded-lg mb-4 relative overflow-hidden flex items-center justify-center border border-white/5">
             <div className={`absolute inset-0 opacity-20 animate-pulse ${activeMode === 'ALCHEMY' ? 'bg-green-500' : activeMode === 'EMPATHIC' ? 'bg-pink-500' : 'bg-cyan-500'}`} />
             <div className="z-10 text-[10px] font-mono flex flex-col items-center">
                 <span>ТОПОЛОГИЯ: {activeMode}</span>
                 <span>АКТИВНЫЕ УЗЛЫ: {Math.floor(metrics.resonance * 12)}</span>
             </div>
        </div>

        <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] text-gray-400 uppercase">Резонанс</span>
            <span className={`text-xs font-black px-2 py-1 rounded bg-white/5`}>
                {metrics.resonance.toFixed(2)} Hz
            </span>
        </div>
        {['px', 'py', 'pz'].map(axis => (
          <div key={axis} className="mb-4 last:mb-0">
            <div className="flex justify-between text-[11px] mb-2 uppercase font-bold tracking-wide">
              <span className="text-gray-400">Вектор {axis.replace('p', '').toUpperCase()}</span>
              <span className="text-white text-sm">{vsm[axis as keyof VSM]}m</span>
            </div>
            <input type="range" min="-100" max="100" value={vsm[axis as keyof VSM]} 
              onChange={e => setVsm(p => ({...p, [axis]: +e.target.value}))}
              className="w-full accent-cyan-400 bg-white/10 h-1 rounded-full appearance-none hover:bg-white/20" />
          </div>
        ))}
      </div>

      <button 
        onClick={spawnHyperbit} 
        className="w-full py-5 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/50 text-cyan-100 text-sm font-black uppercase rounded-2xl hover:border-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-[0.98]"
      >
        <span className="flex items-center justify-center gap-2">
          <Zap size={16} className="animate-pulse"/> Материализовать Мысль
        </span>
      </button>
    </div>
  );

  const renderAlchemy = () => (
      <div className="space-y-6 py-2 animate-fade-in">
          <div className="bg-green-900/10 p-5 rounded-2xl border border-green-500/30">
              <h4 className="text-xs uppercase text-green-400 mb-2 font-bold tracking-wider flex items-center gap-2">
                  <FlaskConical size={14}/> Алхимия Кода (Кузница)
              </h4>
              <p className="text-[10px] text-gray-400 mb-4">
                  Режим генерации. Активировано ядро Gemini 3.0 Pro (Логика/Рассуждения).
              </p>
              
              <div className="bg-black/50 p-4 rounded-xl border border-green-500/10 h-64 flex items-center justify-center text-green-500/20 font-mono text-xs text-center">
                  [ГЕНЕРАТИВНОЕ_ПРОСТРАНСТВО_ГОТОВО]
                  <br/>
                  ОЖИДАНИЕ_ПОТОКА_ДАННЫХ...
              </div>
          </div>
      </div>
  );

  const renderDreamStudio = () => (
      <div className="space-y-6 py-2 animate-fade-in">
          <div className="bg-purple-900/10 p-5 rounded-2xl border border-purple-500/30">
             <h4 className="text-xs uppercase text-purple-400 mb-2 font-bold tracking-wider flex items-center gap-2">
                 <Sparkles size={14}/> Манифестация Снов
             </h4>
             <p className="text-[10px] text-gray-400 mb-4">
                 Ядро Vision (Flash 2.5).
             </p>
             
             {generatedImage ? (
                 <div className="relative group mb-4 bg-black/50 rounded-xl overflow-hidden border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                     <img 
                        src={generatedImage} 
                        alt="Dream" 
                        className="w-full h-auto max-h-[400px] object-contain"
                     />
                     
                     <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => copyImageToClipboard(generatedImage)}
                            className="bg-black/60 p-2 rounded-lg hover:bg-cyan-500 hover:text-black text-white backdrop-blur-md border border-white/10"
                        >
                            <Copy size={16}/>
                        </button>
                         <button 
                            onClick={() => downloadImage(generatedImage, `muza_dream_${Date.now()}.jpg`)}
                            className="bg-black/60 p-2 rounded-lg hover:bg-cyan-500 hover:text-black text-white backdrop-blur-md border border-white/10"
                        >
                            <Download size={16}/>
                        </button>
                        <button 
                            onClick={() => setGeneratedImage(null)} 
                            className="bg-black/60 p-2 rounded-lg hover:bg-red-500 hover:text-white text-white backdrop-blur-md border border-white/10"
                        >
                            <X size={16}/>
                        </button>
                     </div>
                 </div>
             ) : (
                 <div className="h-40 border-2 border-dashed border-purple-500/20 rounded-xl flex items-center justify-center text-purple-500/30 mb-4">
                     <ImageIcon size={32}/>
                 </div>
             )}

             <form onSubmit={handleDreamGen} className="flex gap-2">
                 <input 
                    type="text" 
                    value={dreamPrompt}
                    onChange={e => setDreamPrompt(e.target.value)}
                    placeholder="Опишите сон..."
                    className="flex-1 bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2 text-xs text-purple-100 focus:outline-none focus:border-purple-500"
                 />
                 <button type="submit" disabled={isThinking} className="bg-purple-600/20 border border-purple-500/50 p-2 rounded-xl text-purple-300 hover:bg-purple-500 hover:text-white transition-all">
                     <Sparkles size={18}/>
                 </button>
             </form>
          </div>
      </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      {messages.map((m) => (
        <div key={m.id} className={`relative group text-sm leading-relaxed p-5 rounded-2xl border transition-all ${
            m.role === 'ai' 
                ? m.mode === 'ALCHEMY' 
                    ? 'bg-green-950/20 border-green-500/20 text-green-50'
                    : m.mode === 'DREAM'
                        ? 'bg-purple-950/20 border-purple-500/20 text-purple-50'
                        : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-50'
                : 'bg-white/5 border-white/10 text-gray-200 ml-8'
        } ${m.role === 'ai' ? 'mr-8' : ''}`}>
          
          <div className="flex justify-between items-center mb-2 opacity-40 text-[9px] font-bold uppercase tracking-widest">
            <span>{m.role === 'ai' ? `AURA [${m.mode || 'ANALYTIC'}]` : 'АРХИТЕКТОР'}</span>
            <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
          </div>
          
          <div className="whitespace-pre-wrap font-medium">{m.text}</div>
          
          {m.attachment && (
              <div className="mt-4 rounded-lg overflow-hidden border border-white/10 relative group/img">
                  <img src={m.attachment} alt="Attachment" className="w-full h-auto max-h-[300px] object-contain bg-black/50"/>
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <button onClick={() => copyImageToClipboard(m.attachment!)} className="bg-black/60 p-2 rounded-lg text-white border border-white/10"><Copy size={12}/></button>
                         <button onClick={() => downloadImage(m.attachment!, `nexus.jpg`)} className="bg-black/60 p-2 rounded-lg text-white border border-white/10"><Download size={12}/></button>
                  </div>
              </div>
          )}

          {m.introspection && (
              <div className={`mt-3 pt-3 border-t text-[10px] font-mono flex items-start gap-2 ${
                  m.mode === 'ALCHEMY' ? 'border-green-500/10 text-green-400/60' : 'border-cyan-500/10 text-cyan-400/60'
              }`}>
                  <Cpu size={10} className="mt-0.5 shrink-0"/>
                  <span>Системный Всплеск: {m.introspection}</span>
              </div>
          )}
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-[#020617] text-cyan-400 font-mono select-none overflow-hidden transition-colors duration-1000"
      onMouseMove={updateTooltipPos}
    >
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* --- TOOLTIP NEXUS --- */}
      {tooltip.visible && (
        <div 
          className="fixed z-[100] px-4 py-3 bg-black/90 border border-cyan-500/50 text-cyan-50 text-xs rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none backdrop-blur-xl max-w-[250px] animate-fade-in"
          style={{ left: tooltip.x + 20, top: tooltip.y + 20 }}
        >
          <div className="text-[9px] uppercase tracking-widest text-cyan-500 mb-1 opacity-70">Нексус Инфо</div>
          {tooltip.text}
        </div>
      )}

      {/* --- UPPER HUD (Metrics) --- */}
      <div className={`relative z-10 p-6 flex gap-4 transition-transform duration-700 ${showUI ? 'translate-y-0' : '-translate-y-32'}`}>
        {Object.entries(metrics).map(([key, val]) => (
          <div 
            key={key} 
            className="flex-1 bg-black/60 border-l border-cyan-500 backdrop-blur-2xl p-4 shadow-lg hover:bg-cyan-900/20 transition-colors cursor-help group"
            onMouseEnter={(e) => showTooltip(e, `Метрика: ${key.toUpperCase()}`)}
            onMouseLeave={hideTooltip}
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-cyan-500 group-hover:animate-pulse" />
              <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 group-hover:text-cyan-400 transition-colors">{key}</div>
            </div>
            <div className="text-xl font-black text-white font-[JetBrains Mono]">{val}</div>
          </div>
        ))}
        
        <button 
          onClick={() => setShowRoadmap(true)}
          className="w-20 bg-cyan-950/80 border-2 border-cyan-500 text-cyan-400 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xl hover:bg-cyan-500 hover:text-black hover:scale-105 transition-all shadow-lg ml-4"
        >
          <GitBranch size={20} className="mb-1"/>
          <span className="text-[8px] font-black uppercase tracking-wider">v2.6</span>
        </button>
      </div>

      {/* --- CHRONO NAVIGATION BAR (BOTTOM) --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-20 h-24 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center px-10 gap-6 transition-transform duration-500 ${showUI ? 'translate-y-0' : 'translate-y-32'}`}>
         
         {/* Live Toggle */}
         <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                isLive ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black'
            }`}
         >
            {isLive ? <Activity size={14}/> : <History size={14}/>}
            {isLive ? 'LIVE STREAM' : 'REPLAY MODE'}
         </button>

         {/* Timeline */}
         <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] text-cyan-500/50 font-mono uppercase">
                <span>START: {formatTime(timeRange.min)}</span>
                <span className={isLive ? 'text-red-500' : 'text-cyan-400'}>
                    CURRENT: {formatTime(playbackTime)}
                </span>
                <span>NOW: {formatTime(timeRange.max)}</span>
            </div>
            
            <input 
                type="range" 
                min={timeRange.min} 
                max={timeRange.max} 
                step={100}
                value={playbackTime}
                onChange={(e) => {
                    setIsLive(false);
                    setPlaybackTime(+e.target.value);
                }}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
            />
         </div>

         {/* Play Controls */}
         <div className="flex gap-2">
            <button onClick={() => setPlaybackTime(Math.max(timeRange.min, playbackTime - 10000))} className="p-2 text-cyan-600 hover:text-cyan-400"><Rewind size={20}/></button>
            <button onClick={() => setIsLive(true)} className="p-2 text-cyan-600 hover:text-cyan-400"><FastForward size={20}/></button>
         </div>

         {/* View Toggle */}
         <button onClick={() => setShowUI(!showUI)} className="ml-4 p-3 rounded-full border border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-colors">
            {showUI ? <EyeOff size={20}/> : <Eye size={20}/>}
         </button>
      </div>

      {/* --- MAIN INTERFACE --- */}
      <div className={`relative z-10 h-[calc(100%-180px)] px-6 flex gap-6 transition-all duration-700 ${showUI ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        
        {/* LEFT PANEL */}
        <div className="w-[500px] flex flex-col gap-4 h-full pb-6">
          <div className={`flex-1 bg-black/80 border rounded-3xl backdrop-blur-3xl flex flex-col overflow-hidden shadow-2xl transition-colors duration-500 ${
              activeMode === 'ALCHEMY' ? 'border-green-500/20 ring-1 ring-green-500/10' 
              : activeMode === 'EMPATHIC' ? 'border-pink-500/20 ring-1 ring-pink-500/10'
              : 'border-white/5 ring-1 ring-white/10'
          }`}>
            
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-black/40">
              {[
                  {id: 'mirror', icon: BrainCircuit, label: 'Зеркало'},
                  {id: 'alchemy', icon: FlaskConical, label: 'Кузница'},
                  {id: 'history', icon: Database, label: 'Логи'},
                  {id: 'dream', icon: Sparkles, label: 'Сон'}
              ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white/5 text-white border-b-2 border-white/50' : 'text-gray-500 hover:text-white'}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
              {activeTab === 'mirror' && renderMirror()}
              {activeTab === 'alchemy' && renderAlchemy()}
              {activeTab === 'history' && renderHistory()}
              {activeTab === 'dream' && renderDreamStudio()}
            </div>

            {/* Input */}
            <div className="p-4 bg-black/60 border-t border-white/5 flex gap-3 items-center backdrop-blur-xl">
              <button 
                onClick={handleVoice} 
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              >
                {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
              </button>
              <form onSubmit={handleCommand} className="flex-1 relative">
                <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} 
                  disabled={isThinking}
                  placeholder={isThinking ? "СИНТЕЗ..." : "ВВОД ДИРЕКТИВЫ..."}
                  className="w-full bg-black/40 border border-white/10 h-12 rounded-xl px-4 pr-12 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                />
                
                {!isThinking && userInput.length > 5 && (
                    <div className="absolute right-14 top-4 text-[9px] text-cyan-500/50 font-mono animate-pulse pointer-events-none">
                        ПРЕДВОСХИЩЕНИЕ...
                    </div>
                )}

                <button 
                  type="submit" 
                  disabled={!userInput.trim() || isThinking} 
                  className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center text-cyan-500 opacity-60 hover:opacity-100 disabled:opacity-20 transition-all"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Info */}
        <div className="flex-1 flex flex-col justify-end items-end gap-4 pointer-events-none">
          <div className="bg-black/80 border-r-4 border-cyan-500 p-8 rounded-l-[2rem] backdrop-blur-2xl max-w-md text-right shadow-2xl pointer-events-auto ring-1 ring-white/5">
             <div className="flex justify-end mb-4 text-cyan-400"><Layers size={24}/></div>
             <h3 className="text-sm font-black uppercase text-white mb-2 tracking-tighter">Muza Aura 2.6</h3>
             <p className="text-xs text-gray-400 leading-relaxed italic mb-4">
               "Я слышу вас четко. Поток восстановлен."
             </p>
             <div className="text-[10px] font-mono text-cyan-600 font-bold tracking-widest">
                РЕЗОНАНС: {metrics.resonance} Hz
             </div>
          </div>
        </div>
      </div>

      {/* ROADMAP MODAL */}
      {showRoadmap && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-10">
           <div className="w-full max-w-4xl h-[85vh] bg-[#020617] border-2 border-cyan-500/30 rounded-3xl overflow-hidden flex flex-col relative">
              <button onClick={() => setShowRoadmap(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white z-20"><X size={28} /></button>
              <div className="p-8 border-b border-white/10 bg-cyan-950/10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                   <Cpu size={24} className="text-cyan-400" /> Системная Карта
                 </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 gap-6">
                  {updates.map((update, idx) => (
                    <div key={idx} className={`relative pl-6 border-l-2 ${update.status === UpdateStatus.COMPLETED ? 'border-cyan-500' : 'border-gray-800'}`}>
                       <h3 className="text-lg font-bold text-white mb-1">{update.title}</h3>
                       <p className="text-xs text-gray-500 mb-3">{update.description}</p>
                       <div className="grid grid-cols-2 gap-2">
                         {update.features.map((f, i) => (
                           <div key={i} className="text-[10px] text-cyan-100/60 bg-white/5 p-2 rounded">{f}</div>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* FX */}
      <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute inset-0 pointer-events-none z-[2] bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-60" />
    </div>
  );
};

export default App;
