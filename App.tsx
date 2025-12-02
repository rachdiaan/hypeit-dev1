import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Calendar, Wand2, BarChart3, Palette, X, ChevronRight, Upload, Check, Zap, 
  TrendingUp, Users, Target, Settings, HelpCircle, LogOut, Sparkles, Mic, Volume2, Search, 
  BookOpen, LifeBuoy, Coffee, Megaphone, Star, MessageCircle, Filter, GraduationCap, Clock, 
  Menu, Bell, GitBranch, Code, Network, Layout, Smartphone, Globe, Cloud, Server, Lock, Cpu, 
  Database, CreditCard, CheckCircle2, Calculator, ShoppingCart, Award, ArrowRight, Video,
  PlayCircle, FileText, DollarSign, Instagram, Youtube, Share2, Image as ImageIcon, Film,
  Smile, AlertCircle, MapPin, ShieldCheck, User, Music, Radio, MonitorPlay, ShoppingBag, Send, 
  Loader2, Download, Grid, List, RefreshCw, Maximize2, Minimize2, Cast, ThumbsUp, Eye,
  ArrowDown, Box, Layers, Smartphone as MobileIcon, Laptop, Flame
} from 'lucide-react';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Notification, TourStep, CalendarItem, KOL, Plan, ClassItem, AnalysisResult } from './types';

// ==========================================
// 0. CONFIGURATION & UTILS
// ==========================================

// --- GENAI CLIENT SETUP ---
// We initialize this once to be reused, but for safety in this environment we check key in func.
const getGenAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// --- REFINED: Structured Data Generation (JSON) ---
const callGeminiStructured = async <T,>(prompt: string, schema: Schema): Promise<T | null> => {
  const ai = getGenAI();
  if (!ai) {
      console.warn("API Key missing");
      return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7, // Creative but focused
      }
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Gemini Structured API Error:", error);
    return null;
  }
};

// --- REFINED: Free Text Generation ---
const callGeminiText = async (prompt: string): Promise<string | null> => {
    const ai = getGenAI();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || null;
    } catch (error) {
        console.error("Gemini Text API Error:", error);
        return null;
    }
};

// --- REFINED: Image Generation ---
const callGeminiImage = async (prompt: string): Promise<string | null> => {
    const ai = getGenAI();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                // Ensure we get 1 image
                // Image generation parameters if supported by SDK in future updates
            }
        });
        
        // Robust extraction of base64 data
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Image API Error:", error);
        return null;
    }
};

// --- UTILS ---
const downloadImage = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// ==========================================
// 1. DATA & CONSTANTS
// ==========================================

const TOUR_STEPS: Record<string, TourStep[]> = {
  planner: [
    { targetId: "inp-business-name", title: "1. Profil Bisnis", desc: "AI butuh konteks. Isi nama bisnis Anda di sini.", position: "bottom" },
    { targetId: "btn-generate-plan", title: "2. Generate Jadwal", desc: "Satu klik untuk membuat kalender konten sebulan penuh.", position: "top" }
  ],
  generator: [
    { targetId: "gen-prompt-area", title: "1. Studio Kreatif", desc: "Deskripsikan visual atau pilih gaya yang diinginkan.", position: "top" },
    { targetId: "gen-style-select", title: "2. Gaya Visual", desc: "Pilih gaya (Cinematic, 3D, dll) agar hasil lebih pro.", position: "bottom" }
  ],
  livestream: [
    { targetId: "live-preview", title: "1. Preview Stream", desc: "Tampilan avatar AI Anda saat live.", position: "right" },
    { targetId: "live-products", title: "2. Produk Unggulan", desc: "Pin produk agar muncul di layar penonton.", position: "left" }
  ],
  kol: [
    { targetId: "kol-filter", title: "1. Smart Filter", desc: "Cari KOL berdasarkan budget (Micro/Macro) dan kategori.", position: "bottom" },
    { targetId: "kol-list", title: "2. Database KOL", desc: "Pilih influencer yang sudah terverifikasi.", position: "top" }
  ]
};

const MOCK_KOLS: KOL[] = [
  { id: 1, name: "Sasa Kuliner", handle: "@sasaeats", category: "F&B", followers: "45K", er: "5.2%", price: 350000, tags: ["Micro", "Halal"], verified: true },
  { id: 2, name: "OOTD Budi", handle: "@budistyle", category: "Fashion", followers: "120K", er: "3.8%", price: 1200000, tags: ["Macro", "Style"], verified: true },
  { id: 3, name: "Gadget Rina", handle: "@rinatech", category: "Technology", followers: "25K", er: "8.5%", price: 500000, tags: ["Nano", "Review"], verified: false },
  { id: 4, name: "Mama Dapur", handle: "@mamacooks", category: "F&B", followers: "80K", er: "4.1%", price: 750000, tags: ["Micro", "Resep"], verified: true },
  { id: 5, name: "Fit with Andi", handle: "@andifit", category: "Health", followers: "200K", er: "2.9%", price: 2500000, tags: ["Macro", "Gym"], verified: true },
  { id: 6, name: "Travel Santuy", handle: "@santuytrip", category: "Travel", followers: "60K", er: "6.0%", price: 900000, tags: ["Micro", "Trip"], verified: false },
];

const PLANS: Plan[] = [
  { name: "Gratis", price: "Rp 0", period: "", features: ["1 gambar/hari", "Konsultasi AI"], highlight: false, color: "border-white/10" },
  { name: "Starter", price: "Rp 150rb", period: "/bln", features: ["15 gambar/bln", "Logo Generator"], highlight: true, tag: "Paling Populer", color: "border-purple-500" },
  { name: "Pro", price: "Rp 250rb", period: "/bln", features: ["Unlimited Gambar", "Viral Strategy"], highlight: false, color: "border-white/10" },
  { name: "Specialist", price: "Rp 1.2jt", period: "/bln", features: ["Auto-Posting", "Audit AI"], highlight: false, tag: "Vibe Marketing", color: "border-yellow-500" }
];

const ALACARTE_FEATURES = [
    { id: 'f1', name: 'Unlimited AI Image', price: 50000 },
    { id: 'f2', name: 'Viral Predictor', price: 35000 },
    { id: 'f3', name: 'Competitor Spy', price: 75000 },
    { id: 'f4', name: 'Auto-Posting Bot', price: 100000 },
];

const MOCK_CALENDAR: CalendarItem[] = [
    { day: 1, title: 'Behind the Scene', category: 'Awareness', desc: 'Tunjukkan proses pembuatan produk.' },
    { day: 2, title: 'Testimoni Pelanggan', category: 'Social Proof', desc: 'Repost story pelanggan yang puas.' },
    { day: 3, title: 'Tips & Trik', category: 'Education', desc: 'Bagikan cara penggunaan produk.' },
];

const MOCK_CLASSES: ClassItem[] = [
  { id: 1, title: "Jago Jualan di TikTok Shop", mentor: "Coach Rian", role: "TikTok Expert", date: "25 Nov", time: "19:00", rating: 4.9, students: 1250, price: "Gratis", image: "bg-blue-600" },
  { id: 2, title: "Fotografi Produk Modal HP", mentor: "Siska Visuals", role: "Photographer", date: "26 Nov", time: "10:00", rating: 4.8, students: 850, price: "Rp 50.000", image: "bg-pink-600" },
  { id: 3, title: "AI untuk Copywriting Kilat", mentor: "Dr. Prompt", role: "AI Specialist", date: "28 Nov", time: "15:00", rating: 5.0, students: 2100, price: "Rp 75.000", image: "bg-purple-600" },
  { id: 4, title: "Financial Planning UMKM", mentor: "Budi Cuan", role: "Financial Advisor", date: "30 Nov", time: "13:00", rating: 4.7, students: 600, price: "Gratis", image: "bg-green-600" },
];

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================

const ToastContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    {notifications.map((note) => (
      <div key={note.id} className="bg-[#1a1b26]/90 backdrop-blur-xl border border-white/10 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right pointer-events-auto">
        {note.type === 'success' ? <div className="bg-green-500/20 p-1 rounded-full"><Check size={14} className="text-green-400" /></div> : <div className="bg-red-500/20 p-1 rounded-full"><AlertCircle size={14} className="text-red-400" /></div>}
        <span className="text-sm font-medium">{note.message}</span>
      </div>
    ))}
  </div>
);

const SidebarItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active ? 'text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-xl" />}
    <Icon size={20} className={`relative z-10 transition-colors ${active ? 'text-purple-400' : 'group-hover:text-purple-400'}`} />
    <span className="relative z-10 text-sm font-medium">{label}</span>
    {active && <ChevronRight size={16} className="relative z-10 ml-auto text-purple-500 opacity-80" />}
  </button>
);

const InteractiveTour: React.FC<{ steps?: TourStep[], isActive: boolean, onComplete: () => void }> = ({ steps, isActive, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<{ top: number, left: number, width: number, height: number, targetTop: number, targetLeft: number } | null>(null);

  useEffect(() => {
    if (!isActive || !steps || steps.length === 0) { if (!isActive) setCurrentStep(0); return; }
    const updatePosition = () => {
        const stepData = steps[currentStep];
        if (!stepData) return;
        const target = document.getElementById(stepData.targetId);
        if (target) {
            const rect = target.getBoundingClientRect();
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            let top, left;
            const isMobile = window.innerWidth < 768;
            if (isMobile) { top = rect.bottom + 15; left = 10; } 
            else {
                if (stepData.position === 'right') { top = rect.top; left = rect.right + 20; } 
                else if (stepData.position === 'top') { top = rect.top - 160; left = rect.left; } 
                else if (stepData.position === 'left') { top = rect.top; left = rect.left - 340; }
                else { top = rect.bottom + 20; left = rect.left; }
            }
            // Ensure bounds
            if (top < 10) top = 10;
            if (left < 10) left = 10;
            
            setPosition({ top, left, width: rect.width, height: rect.height, targetTop: rect.top, targetLeft: rect.left });
        }
    };
    const timer = setTimeout(updatePosition, 600);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => { window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition); clearTimeout(timer); };
  }, [currentStep, isActive, steps]);

  if (!isActive || !position || !steps || !steps[currentStep]) return null;
  const stepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
        <div className="absolute inset-0 bg-black/60 transition-all duration-500 backdrop-blur-[2px]" style={{clipPath: `polygon(0% 0%, 0% 100%, ${position.targetLeft}px 100%, ${position.targetLeft}px ${position.targetTop}px, ${position.targetLeft + position.width}px ${position.targetTop}px, ${position.targetLeft + position.width}px ${position.targetTop + position.height}px, ${position.targetLeft}px ${position.targetTop + position.height}px, ${position.targetLeft}px 100%, 100% 100%, 100% 0%)`}}></div>
        <div className="absolute border-2 border-purple-500 rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-pulse" style={{ top: position.targetTop - 4, left: position.targetLeft - 4, width: position.width + 8, height: position.height + 8 }}></div>
        <div className="absolute pointer-events-auto bg-[#1a1b26]/95 backdrop-blur-xl border border-purple-500/50 p-5 rounded-xl shadow-2xl w-[calc(100%-20px)] md:w-80 transition-all duration-300" style={{ top: position.top, left: position.left }}>
            <div className="flex items-start gap-3 mb-2"><HelpCircle className="text-purple-400 shrink-0" size={20} /><h4 className="font-bold text-white text-md">{stepData.title}</h4></div>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">{stepData.desc}</p>
            <div className="flex justify-between items-center"><span className="text-xs text-slate-500">{currentStep + 1} / {steps.length}</span><div className="flex gap-2">{currentStep > 0 && (<button onClick={() => setCurrentStep(c => c - 1)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5">Back</button>)}<button onClick={() => { if (currentStep < steps.length - 1) { setCurrentStep(c => c + 1); } else { onComplete(); } }} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-lg">{currentStep === steps.length - 1 ? "Selesai" : "Lanjut"}</button></div></div>
        </div>
    </div>
  );
};

const AIVoiceAssistant: React.FC<{ onAutoFill?: () => void, addNotification?: (type: 'success'|'error', msg: string) => void }> = ({ onAutoFill, addNotification }) => {
  const [isListening, setIsListening] = useState(false);
  const [minimized, setMinimized] = useState(true); 
  useEffect(() => { setTimeout(() => { if (window.innerWidth > 768) setMinimized(false); }, 2000); }, []);
  const handleMicClick = () => { setIsListening(true); setTimeout(() => { setIsListening(false); if(onAutoFill) onAutoFill(); if(addNotification) addNotification('success', 'Data diisi otomatis!'); }, 1500); };

  if (minimized) return (<button onClick={() => setMinimized(false)} className="fixed bottom-24 right-4 md:right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.5)] flex items-center justify-center animate-bounce hover:scale-110 transition-transform z-40"><Sparkles className="text-white" size={24} /></button>);

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-40 w-[calc(100%-2rem)] md:w-80 max-w-sm animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-[#1a1b26]/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-900/50 overflow-hidden">
        <div className="h-14 bg-gradient-to-r from-purple-900/50 to-pink-900/50 relative flex items-center justify-between px-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-inner"><Volume2 size={14} className="text-white" /></div><span className="text-white font-bold text-sm">Ava Assistant</span></div><button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-white"><X size={16}/></button></div>
        <div className="p-4"><p className="text-slate-300 text-xs mb-4 bg-white/5 p-3 rounded-lg leading-relaxed border border-white/5">{isListening ? "Mendengarkan..." : "Butuh bantuan mengisi form? Klik mic di bawah."}</p><button onClick={handleMicClick} className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white'}`}><Mic size={14} /> {isListening ? "Mendengarkan..." : "Bicara Sekarang"}</button></div>
      </div>
    </div>
  );
};

// --- UPGRADED: DOCUMENTATION MODAL COMPONENTS ---

const RenderMentoring = () => (
    <div className="max-w-5xl mx-auto animate-in fade-in space-y-8">
        <div className="flex justify-between items-end">
            <div>
                <h3 className="text-3xl font-bold text-white mb-2">HypeIt Pro Academy</h3>
                <p className="text-slate-400 text-sm">Upgrade skill bisnis Anda dengan mentor kelas dunia.</p>
            </div>
            <div className="flex gap-2">
                 <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/20">All Courses</span>
                 <span className="text-slate-500 px-3 py-1 rounded-full text-xs font-bold hover:text-white cursor-pointer">My Learning</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {MOCK_CLASSES.map((cls) => (
                <div key={cls.id} className="bg-slate-800/30 border border-white/5 rounded-2xl p-5 hover:border-purple-500/40 transition-all hover:bg-slate-800/50 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                         <div className="bg-black/40 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                             <Star size={10} className="text-yellow-400 fill-yellow-400"/> {cls.rating}
                         </div>
                    </div>
                    <div className="flex gap-5">
                        <div className={`w-24 h-24 ${cls.image} rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-2xl`}>{cls.mentor.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                             <div className="flex gap-2 mb-1">
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Webinar</span>
                                <span className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded uppercase font-bold">{cls.price}</span>
                             </div>
                             <h4 className="font-bold text-white text-lg mb-1 leading-tight group-hover:text-purple-400 transition-colors">{cls.title}</h4>
                             <p className="text-xs text-slate-400 mb-4 line-clamp-1">{cls.mentor} • {cls.role}</p>
                             
                             <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                 <div className="flex items-center gap-3 text-slate-500 text-xs">
                                     <span className="flex items-center gap-1"><Users size={12}/> {cls.students}</span>
                                     <span className="flex items-center gap-1"><Clock size={12}/> {cls.time}</span>
                                 </div>
                                 <button className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-purple-400 hover:text-white transition-colors">Daftar</button>
                             </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const RenderUML = () => (
    <div className="h-full flex flex-col">
        <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white">System Architecture (Class Diagram)</h3>
            <p className="text-slate-400 text-sm">Representasi visual struktur data inti.</p>
        </div>
        <div className="flex-1 bg-slate-900/50 relative overflow-hidden rounded-xl border border-white/10 flex items-center justify-center p-8">
            {/* Visual SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                </defs>
                <line x1="50%" y1="180" x2="30%" y2="350" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="50%" y1="180" x2="70%" y2="350" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="70%" y1="450" x2="70%" y2="520" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </svg>

            <div className="relative w-full max-w-4xl h-[600px] flex flex-col items-center justify-between py-10">
                
                {/* Top Node */}
                <div className="bg-slate-800 border-2 border-purple-500 rounded-lg w-64 shadow-[0_0_20px_rgba(168,85,247,0.3)] z-10">
                    <div className="bg-purple-900/50 p-2 border-b border-purple-500 text-center font-bold text-white text-sm">UserController</div>
                    <div className="p-3 text-xs text-slate-300 font-mono space-y-1">
                        <p>+ userId: String</p>
                        <p>+ email: String</p>
                        <hr className="border-slate-600 my-1"/>
                        <p>+ createCampaign()</p>
                        <p>+ generateContent()</p>
                    </div>
                </div>

                {/* Middle Nodes */}
                <div className="flex justify-between w-full px-20">
                    <div className="bg-slate-800 border border-blue-500 rounded-lg w-64 shadow-lg z-10">
                        <div className="bg-blue-900/50 p-2 border-b border-blue-500 text-center font-bold text-white text-sm">PlannerModule</div>
                        <div className="p-3 text-xs text-slate-300 font-mono space-y-1">
                            <p>+ campaignId: UUID</p>
                            <p>+ startDate: Date</p>
                            <hr className="border-slate-600 my-1"/>
                            <p>+ generateSchedule()</p>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-pink-500 rounded-lg w-64 shadow-lg z-10">
                        <div className="bg-pink-900/50 p-2 border-b border-pink-500 text-center font-bold text-white text-sm">AIService</div>
                        <div className="p-3 text-xs text-slate-300 font-mono space-y-1">
                            <p>+ model: Gemini-Flash</p>
                            <p>+ apiKey: SecureString</p>
                            <hr className="border-slate-600 my-1"/>
                            <p>+ callTextAPI(prompt)</p>
                            <p>+ callImageAPI(prompt)</p>
                        </div>
                    </div>
                </div>

                 {/* Bottom Node */}
                 <div className="bg-slate-800 border border-green-500 rounded-lg w-64 shadow-lg z-10 mt-auto">
                    <div className="bg-green-900/50 p-2 border-b border-green-500 text-center font-bold text-white text-sm">GoogleCloudPlatform</div>
                    <div className="p-3 text-xs text-slate-300 font-mono space-y-1">
                        <p>+ Vertex AI</p>
                        <p>+ Cloud Storage</p>
                    </div>
                </div>

            </div>
        </div>
    </div>
);

const RenderNetwork = () => (
    <div className="h-full flex flex-col">
        <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white">Network Topology</h3>
            <p className="text-slate-400 text-sm">Infrastruktur Server & Alur Data.</p>
        </div>
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
             {/* Background Grid */}
             <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.1}}></div>
             
             <div className="flex flex-col items-center gap-12 w-full max-w-3xl relative z-10">
                 {/* Client Layer */}
                 <div className="flex flex-col items-center">
                    <div className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center gap-2"><Smartphone size={16}/> Client (Browser/Mobile)</div>
                    <ArrowDown className="text-slate-500 my-2" size={24}/>
                 </div>

                 {/* Edge Layer */}
                 <div className="w-full border-t border-dashed border-slate-600 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-widest">Edge Layer</span>
                 </div>

                 <div className="flex justify-center gap-12">
                     <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-orange-500/20 border border-orange-500 rounded-lg flex items-center justify-center text-orange-500 mb-2"><Globe size={32}/></div>
                         <p className="text-xs font-bold text-slate-300">CDN / WAF</p>
                     </div>
                 </div>
                 
                 <ArrowDown className="text-slate-500" size={24}/>

                 {/* App Layer */}
                 <div className="flex gap-4 p-4 border border-blue-500/30 rounded-2xl bg-blue-900/10 backdrop-blur-sm relative">
                    <span className="absolute -top-3 left-4 bg-blue-600 px-2 text-[10px] text-white rounded font-bold">Kubernetes Cluster</span>
                    <div className="flex flex-col items-center p-3 bg-slate-800 rounded border border-white/5">
                        <Server size={24} className="text-blue-400 mb-1"/>
                        <span className="text-[10px] text-slate-300">App Pod 1</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-slate-800 rounded border border-white/5">
                        <Server size={24} className="text-blue-400 mb-1"/>
                        <span className="text-[10px] text-slate-300">App Pod 2</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-slate-800 rounded border border-white/5">
                        <Server size={24} className="text-blue-400 mb-1"/>
                        <span className="text-[10px] text-slate-300">Worker</span>
                    </div>
                 </div>

                 <div className="flex w-full justify-between px-20 relative">
                     {/* Connecting Lines (CSS borders) */}
                     <div className="absolute top-0 left-1/2 w-px h-8 bg-slate-600 -translate-x-1/2"></div>
                     <div className="absolute top-8 left-[25%] right-[25%] h-px bg-slate-600"></div>
                     <div className="absolute top-8 left-[25%] w-px h-8 bg-slate-600"></div>
                     <div className="absolute top-8 right-[25%] w-px h-8 bg-slate-600"></div>
                 </div>

                 {/* Data Layer */}
                 <div className="flex justify-between w-full max-w-lg mt-4">
                     <div className="flex flex-col items-center">
                         <div className="w-14 h-14 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center text-green-500 mb-2"><Database size={24}/></div>
                         <p className="text-xs font-bold text-slate-300">PostgreSQL</p>
                     </div>
                     <div className="flex flex-col items-center">
                         <div className="w-14 h-14 bg-purple-500/20 border border-purple-500 rounded-full flex items-center justify-center text-purple-500 mb-2"><Zap size={24}/></div>
                         <p className="text-xs font-bold text-slate-300">Gemini API</p>
                     </div>
                 </div>
             </div>
        </div>
    </div>
);

const RenderMockups = () => {
    const [selectedMockup, setSelectedMockup] = useState('login');
    
    return (
        <div className="h-full flex flex-col">
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">High-Fidelity UI Mockups</h3>
                <p className="text-slate-400 text-sm">Galeri desain antarmuka aplikasi.</p>
            </div>
            
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 flex flex-col gap-2">
                    {[
                        {id:'login', label:'Login Screen', icon: Lock},
                        {id:'dash', label:'Dashboard', icon: LayoutDashboard},
                        {id:'gen', label:'AI Generator', icon: Wand2},
                        {id:'mobile', label:'Mobile View', icon: MobileIcon},
                    ].map(m => (
                        <button 
                            key={m.id} 
                            onClick={()=>setSelectedMockup(m.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedMockup === m.id ? 'bg-white text-black shadow-lg' : 'bg-slate-800/50 text-slate-400 hover:text-white'}`}
                        >
                            <m.icon size={16}/> {m.label}
                        </button>
                    ))}
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-black rounded-2xl border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                    {/* Fake Browser Bar */}
                    <div className="bg-slate-800 h-8 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="flex-1 text-center text-[10px] text-slate-400 font-mono">hypeit.ai/app/{selectedMockup}</div>
                    </div>

                    {/* Mockup Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-900 relative">
                        {selectedMockup === 'login' && (
                            <div className="h-full flex items-center justify-center bg-slate-900">
                                <div className="w-80 p-8 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur">
                                    <div className="text-center mb-8">
                                        <div className="w-12 h-12 bg-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold">H</div>
                                        <h4 className="text-white font-bold text-xl">Welcome Back</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-10 bg-slate-900 rounded-lg border border-white/10"></div>
                                        <div className="h-10 bg-slate-900 rounded-lg border border-white/10"></div>
                                        <button className="w-full h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold text-sm">Sign In</button>
                                    </div>
                                </div>
                            </div>
                        )}
                         {selectedMockup === 'dash' && (
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between">
                                    <div className="w-32 h-8 bg-slate-800 rounded animate-pulse"></div>
                                    <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-32 bg-slate-800/50 rounded-xl border border-white/5"></div>
                                    <div className="h-32 bg-slate-800/50 rounded-xl border border-white/5"></div>
                                    <div className="h-32 bg-slate-800/50 rounded-xl border border-white/5"></div>
                                </div>
                                <div className="h-64 bg-slate-800/30 rounded-xl border border-white/5 p-4">
                                     <div className="w-full h-full bg-gradient-to-t from-purple-900/20 to-transparent rounded"></div>
                                </div>
                            </div>
                        )}
                        {selectedMockup === 'gen' && (
                            <div className="flex h-full">
                                <div className="w-1/3 border-r border-white/10 p-4 space-y-4 bg-slate-900">
                                    <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                                    <div className="h-32 bg-slate-800 rounded border border-white/10"></div>
                                    <div className="h-10 bg-purple-600 rounded"></div>
                                </div>
                                <div className="flex-1 p-8 flex items-center justify-center bg-black">
                                     <div className="w-64 h-64 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center">
                                         <Wand2 className="text-slate-700" size={48}/>
                                     </div>
                                </div>
                            </div>
                        )}
                        {selectedMockup === 'mobile' && (
                            <div className="flex items-center justify-center h-full py-8">
                                <div className="w-[300px] h-[550px] border-8 border-slate-800 rounded-[3rem] bg-slate-900 overflow-hidden relative shadow-2xl">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-10"></div>
                                    <div className="p-4 pt-10 space-y-4">
                                        <div className="h-20 bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl"></div>
                                        <div className="h-24 bg-slate-800 rounded-xl"></div>
                                        <div className="h-24 bg-slate-800 rounded-xl"></div>
                                        <div className="h-24 bg-slate-800 rounded-xl"></div>
                                    </div>
                                    <div className="absolute bottom-0 w-full h-16 bg-slate-800/90 backdrop-blur flex justify-around items-center px-4">
                                        <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                                        <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
                                        <div className="w-6 h-6 bg-slate-600 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN MODAL WRAPPER ---
const DocumentationModal: React.FC<{ isOpen: boolean, onClose: () => void, initialTab: string }> = ({ isOpen, onClose, initialTab = 'user-guide' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => { if (isOpen) setActiveTab(initialTab); }, [initialTab, isOpen]);
  if (!isOpen) return null;

  const tabs = [
    { id: 'user-guide', label: 'Panduan UMKM', icon: LifeBuoy, type: 'guide' },
    { id: 'mentoring', label: 'Pro Academy', icon: GraduationCap, type: 'guide' }, 
    { id: 'flowchart', label: 'System Flowchart', icon: GitBranch, type: 'tech' },
    { id: 'uml', label: 'UML Class Diagram', icon: Code, type: 'tech' },
    { id: 'network', label: 'Network Topology', icon: Network, type: 'tech' },
    { id: 'mockup', label: 'UI Mockups', icon: Layout, type: 'tech' },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-4 animate-in zoom-in-95 duration-300">
      <div className="bg-[#0B0C15] border border-white/10 rounded-2xl w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#05050A]/50">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tabs.find(t => t.id === activeTab)?.type === 'guide' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {tabs.find(t => t.id === activeTab)?.type === 'guide' ? <LifeBuoy size={20} /> : <BookOpen size={20} />}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</h2>
                    <p className="text-slate-400 text-xs hidden md:block">HYPEIT Knowledge Base</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        
        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-[#05050A]/30 border-b md:border-r border-white/10 p-2 md:p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar shrink-0">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-xs md:text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? (tab.type === 'guide' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30') : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
                    <tab.icon size={16} /><span>{tab.label}</span>
                </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 bg-[#1a1b26]/50 p-4 md:p-8 overflow-y-auto custom-scrollbar relative">
            
            {activeTab === 'mentoring' && <RenderMentoring />}
            
            {activeTab === 'flowchart' && (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-6 bg-blue-900/20 rounded-full mb-4 animate-pulse"><GitBranch size={48} className="text-blue-400"/></div>
                    <h3 className="text-xl font-bold text-white">System Flowchart</h3>
                    <p className="text-slate-400 text-sm max-w-md mt-2">Diagram alur data dari Input User &rarr; Pemrosesan Gemini AI &rarr; Output Konten/Visual.</p>
                    <div className="mt-8 p-4 border border-white/10 rounded-lg bg-black/40 text-xs font-mono text-left w-full max-w-lg space-y-2">
                        <p className="text-green-400">START</p>
                        <p className="pl-4">|-- User Inputs Business Profile</p>
                        <p className="pl-4">|-- User Selects Module (Planner/Generator)</p>
                        <p className="pl-4">|-- <span className="text-yellow-400">System Calls Gemini API</span></p>
                        <p className="pl-8">|-- Validate Prompt</p>
                        <p className="pl-8">|-- Generate Content/Image</p>
                        <p className="pl-4">|-- Return Result to Dashboard</p>
                        <p className="text-red-400">END</p>
                    </div>
                 </div>
            )}

            {activeTab === 'uml' && <RenderUML />}
            {activeTab === 'network' && <RenderNetwork />}
            {activeTab === 'mockup' && <RenderMockups />}

            {activeTab === 'user-guide' && <div className="text-center text-slate-400 py-20 flex flex-col items-center"><LifeBuoy size={48} className="mb-4 text-green-400"/><p>Panduan Pengguna Interaktif & Video Tutorial</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. FEATURE VIEWS
// ==========================================

const ViewPlanner: React.FC<{ onAutoFill: () => void, addNotification: (t: 'success'|'error', m: string) => void }> = ({ onAutoFill, addNotification }) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [form, setForm] = useState({name:'', industry:'', market:'', idea:''});
  const [calendarData, setCalendarData] = useState<CalendarItem[]>(MOCK_CALENDAR);

  const handleFill = () => { setForm({name: "Kopi Senja", industry: "F&B", market: "Gen Z", idea: "Promo Akhir Bulan"}); };
  
  const handleGen = async () => {
    if (!form.name) { addNotification('error', 'Mohon isi nama bisnis.'); return; }
    setLoading(true);
    
    // Define strict schema for Gemini
    const calendarSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                day: { type: Type.INTEGER },
                title: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Awareness', 'Sales', 'Engagement', 'Education', 'Other'] },
                desc: { type: Type.STRING },
            },
            required: ["day", "title", "category", "desc"]
        }
    };

    const prompt = `Create a 6-day social media content calendar for '${form.name}' (${form.industry}, target: ${form.market}). Focus: '${form.idea}'. Use creative and engaging Indonesian language.`;
    
    const result = await callGeminiStructured<CalendarItem[]>(prompt, calendarSchema);
    
    if (result) {
        setCalendarData(result);
        addNotification('success', 'Jadwal berhasil dibuat!');
    } else {
        addNotification('error', 'Gagal membuat jadwal, coba lagi.');
        // Fallback or keep existing
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <AIVoiceAssistant onAutoFill={handleFill} addNotification={addNotification} />
      
      {/* Input Section */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
        <h3 className="font-bold text-white mb-6 flex gap-2 relative z-10"><Zap size={20} className="text-yellow-400 fill-yellow-400"/> AI Campaign Architect</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 relative z-10">
            {(['name', 'industry', 'market'] as const).map(f => (<div key={f} className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f}</label><input id={f==='name'?'inp-business-name':undefined} value={form[f]} onChange={e=>setForm({...form, [f]:e.target.value})} placeholder={`Input ${f}...`} className="w-full bg-slate-900/80 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none hover:bg-slate-900"/></div>))}
        </div>
        <div className="space-y-2 mb-6 relative z-10"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campaign Focus</label><textarea value={form.idea} onChange={e=>setForm({...form, idea:e.target.value})} placeholder="Apa tujuan kampanye bulan ini?" className="w-full bg-slate-900/80 border border-white/10 text-white px-4 py-3 rounded-lg text-sm h-20 resize-none focus:border-purple-500 outline-none hover:bg-slate-900"/></div>
        <button id="btn-generate-plan" onClick={handleGen} disabled={loading} className="relative z-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white px-8 py-3 rounded-lg font-bold w-full md:w-auto transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{loading ? <><Loader2 className="animate-spin" size={18}/> Meracik Strategi...</> : <><Sparkles size={18}/> Generate Calendar</>}</button>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar size={20} className="text-purple-400"/> Content Roadmap</h3>
            <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-white/10 self-end">
                <button onClick={()=>setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode==='list'?'bg-slate-600 text-white shadow-sm':'text-slate-400 hover:text-white'}`}><List size={16}/></button>
                <button onClick={()=>setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode==='grid'?'bg-slate-600 text-white shadow-sm':'text-slate-400 hover:text-white'}`}><Grid size={16}/></button>
            </div>
          </div>
          
          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse border border-white/5"></div>)}
             </div>
          ) : (
             <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {calendarData.map((c, i) => (
                    <div key={i} className={`bg-slate-800/30 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all hover:-translate-y-1 hover:bg-slate-800/60 group relative overflow-hidden ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-4 p-4 items-start md:items-center' : 'p-5 flex flex-col h-full'}`}>
                        <div className={`flex items-center justify-center bg-slate-900/80 rounded-lg shrink-0 border border-white/5 text-purple-400 ${viewMode==='list'?'w-12 h-12':'w-full h-10 mb-3'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider">Day {c.day}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white truncate pr-2 text-base">{c.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${c.category==='Sales'?'bg-green-500/10 text-green-400 border-green-500/20': c.category==='Awareness' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{c.category}</span>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{c.desc}</p>
                        </div>
                        {viewMode === 'list' && <button className="p-2 hover:bg-white/10 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight size={16}/></button>}
                    </div>
                ))}
             </div>
          )}
      </div>
    </div>
  );
};

const ViewGenerator: React.FC<{ addNotification: (t: 'success'|'error', m: string) => void }> = ({ addNotification }) => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('Photorealistic');
    const [ratio, setRatio] = useState('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) { addNotification('error', 'Masukkan prompt!'); return; }
        setLoading(true);
        const enhancedPrompt = `Create a ${ratio} image. Style: ${style}. Subject: ${prompt}. High quality, detailed, professional lighting.`;
        const imgData = await callGeminiImage(enhancedPrompt);
        
        if (imgData) {
            setGeneratedImage(imgData);
            addNotification('success', 'Gambar berhasil dibuat!');
        } else {
            addNotification('error', 'Gagal membuat gambar. Coba prompt lain.');
        }
        setLoading(false);
    };

    return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 animate-in fade-in duration-500 h-full lg:h-[calc(100vh-140px)]">
        {/* Controls Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            <div className="bg-slate-800/40 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex-1 flex flex-col shadow-lg">
                <div className="mb-6"><h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Wand2 size={18} className="text-pink-400"/> AI Studio</h3><p className="text-slate-400 text-xs">Powered by Gemini 2.5 Flash Image.</p></div>
                
                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div id="gen-prompt-area" className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt Visual</label>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Misal: Coffee shop futuristik dengan lampu neon di Jakarta Selatan, cinematic shot..." className="w-full bg-slate-900/80 border border-white/10 text-white p-3 rounded-lg h-32 text-sm resize-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all hover:bg-slate-900"/>
                    </div>

                    <div id="gen-style-select" className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Photorealistic', '3D Render', 'Anime', 'Oil Painting', 'Cyberpunk', 'Minimalist', 'Vintage', 'Pop Art'].map(s => (
                                <button key={s} onClick={()=>setStyle(s)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${style===s ? 'bg-pink-600/20 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio</label>
                        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
                            {['1:1', '16:9', '9:16', '4:3'].map(r => (
                                <button key={r} onClick={()=>setRatio(r)} className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${ratio === r ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={loading} id="gen-btn-action" className="mt-6 w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} Generate Visual
                </button>
            </div>
        </div>

        {/* Preview Panel */}
        <div id="gen-result-area" className="lg:col-span-8 bg-[#05050A] border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group min-h-[400px] shadow-inner">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            
            {/* Background Decor */}
            {!generatedImage && !loading && (
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-pink-900/10 pointer-events-none"></div>
            )}

            {loading ? (
                <div className="text-center relative z-10">
                    <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 animate-pulse font-medium">Meracik piksel...</p>
                    <p className="text-xs text-slate-500 mt-2">Estimasi: 5-10 detik</p>
                </div>
            ) : generatedImage ? (
                <div className="relative w-full h-full p-4 flex items-center justify-center">
                    <img src={generatedImage} alt="Result" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500"/>
                    <div className="absolute bottom-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur rounded-full px-4 py-2 border border-white/10 translate-y-2 group-hover:translate-y-0 duration-300">
                        <button onClick={() => downloadImage(generatedImage, `hypeit-gen-${Date.now()}.png`)} className="text-white hover:text-pink-400 transition-colors flex items-center gap-2 text-xs font-bold pr-3 border-r border-white/20"><Download size={16}/> Save</button>
                        <button className="text-white hover:text-pink-400 transition-colors"><Maximize2 size={16}/></button>
                    </div>
                </div>
            ) : (
                <div className="text-center relative z-10 opacity-50 max-w-sm px-6">
                    <div className="bg-slate-800/50 p-6 rounded-full inline-block mb-4 border border-white/5">
                        <ImageIcon className="text-slate-500" size={48}/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">Canvas Kosong</h3>
                    <p className="text-slate-500 text-sm">Tulis prompt di panel kiri untuk mulai membuat visual menakjubkan.</p>
                </div>
            )}
        </div>
    </div>
    );
};

const ViewStrategy: React.FC<{ addNotification: (t: 'success'|'error', m: string) => void }> = ({ addNotification }) => {
  const [inputText, setInputText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!inputText) return;
    setLoading(true);

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER },
            hook: { type: Type.STRING },
            fit: { type: Type.STRING },
            format: { type: Type.STRING },
            improvements: { type: Type.STRING },
        },
        required: ["score", "hook", "fit", "format", "improvements"]
    };

    const prompt = `Analyze this social media caption: "${inputText}". Rate it 0-100 on viral potential. Identify the hook strength, audience fit, best format (Reels/Post/Story), and provide 1 specific improvement tip.`;
    
    const data = await callGeminiStructured<AnalysisResult>(prompt, schema);

    if (data) {
        setAnalysis(data);
    } else {
        // Fallback simulation if API fails
        addNotification('error', 'Analisis gagal, menggunakan simulasi.');
        setAnalysis({ score: 78, hook: "Avg", fit: "85%", format: "Carousel", improvements: "Make hook shorter" });
    }
    setLoading(false);
  };

  const handleRewrite = async () => {
     if(!inputText) return;
     setLoading(true);
     const prompt = `Rewrite this caption to be more viral, engaging, and relatable for Gen Z in Bahasa Indonesia slang but polite: "${inputText}"`;
     const res = await callGeminiText(prompt);
     if(res) { 
         setInputText(res); 
         addNotification('success', 'Caption berhasil di-upgrade!'); 
    }
     setLoading(false);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden shadow-lg group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-purple-500/30 transition-all"/>
            <Target size={32} className="text-purple-400 mb-2"/>
            <h3 className="text-5xl font-black text-white tracking-tight">{analysis?.score || '--'}<span className="text-lg font-normal text-slate-400 ml-1">/100</span></h3>
            <p className="text-sm text-purple-300 mt-2 font-medium">Viral Probability</p>
            {analysis && <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{width: `${analysis.score}%`}}></div></div>}
          </div>
          <div className="bg-slate-800/40 border border-white/10 p-6 rounded-2xl col-span-2 shadow-lg">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Flame size={18} className="text-orange-500 fill-orange-500"/> Trending Now (Indonesia)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[{t:"#LokalPride", v:"1.2M"}, {t:"#OOTDIndo", v:"850K"}, {t:"#KulinerViral", v:"2.1M"}, {t:"#BisnisAnakMuda", v:"500K"}].map((t,i)=>(
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-white/5 hover:border-orange-500/30 transition-colors cursor-pointer group">
                        <span className="text-white font-medium group-hover:text-orange-400 transition-colors">{t.t}</span>
                        <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">{t.v}</span>
                    </div>
                ))}
            </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/10 p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold text-white mb-4 flex gap-2"><Zap size={18} className="text-yellow-400"/> Content Optimizer</h3>
              <div className="bg-slate-900/50 p-1 rounded-xl border border-white/5 focus-within:border-purple-500/50 transition-colors relative">
                  <textarea id="strat-input" value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder="Tulis ide caption kasar Anda di sini..." className="w-full bg-transparent text-white text-sm p-4 focus:outline-none resize-none h-32"/>
                  {loading && <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-purple-500"/></div>}
                  <div className="flex justify-between items-center px-4 py-2 border-t border-white/5 bg-slate-900/80 rounded-b-lg">
                      <button onClick={handleRewrite} disabled={loading||!inputText} className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50"><RefreshCw size={12}/> Magic Rewrite</button>
                      <button id="strat-btn" onClick={handlePredict} disabled={loading || !inputText} className="bg-white text-black px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">{loading?"Analyzing...":"Check Score"}</button>
                  </div>
              </div>
              
              {analysis && (
                  <div className="grid grid-cols-3 gap-4 mt-6 animate-in slide-in-from-top-4">
                      {[['Hook', analysis.hook, 'text-blue-400', 'bg-blue-500/10'], ['Fit', analysis.fit, 'text-green-400', 'bg-green-500/10'], ['Format', analysis.format, 'text-pink-400', 'bg-pink-500/10']].map(([l, v, tc, bg], i) => (
                          <div key={i} className={`${bg} border border-white/5 rounded-xl p-3 text-center`}>
                              <p className={`text-[10px] uppercase font-bold opacity-70 mb-1 ${tc}`}>{l as string}</p>
                              <p className="text-white font-bold">{v as string}</p>
                          </div>
                      ))}
                      <div className="col-span-3 bg-slate-900/80 border border-white/10 p-4 rounded-xl flex gap-4 items-start shadow-sm">
                          <div className="bg-yellow-500/20 p-2 rounded-full shrink-0"><Sparkles size={16} className="text-yellow-400"/></div>
                          <div>
                              <p className="text-xs font-bold text-white mb-1">AI Recommendation</p>
                              <p className="text-xs text-slate-300 leading-relaxed">{analysis.improvements}</p>
                          </div>
                      </div>
                  </div>
              )}
          </div>
          <div className="bg-slate-800/40 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4"><Users size={32} className="text-red-400"/></div>
              <h4 className="text-white font-bold mb-1">Competitor Watch</h4>
              <p className="text-xs text-slate-400 mb-6 px-4">Pantau gerakan kompetitor secara real-time.</p>
              <div className="w-full space-y-3">
                  <div className="w-full bg-slate-900/50 p-3 rounded-xl border border-white/5 flex items-center gap-3 text-left hover:bg-slate-900 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">C</div>
                    <div><p className="text-xs font-bold text-white">CoffeeBrandX</p><p className="text-[10px] text-slate-500">Post 15m ago • High Engagement</p></div>
                  </div>
                  <div className="w-full bg-slate-900/50 p-3 rounded-xl border border-white/5 flex items-center gap-3 text-left hover:bg-slate-900 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">K</div>
                    <div><p className="text-xs font-bold text-white">KopiKenanganMantan</p><p className="text-[10px] text-slate-500">Story 2h ago • Promo Alert</p></div>
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
};

const ViewLiveStream: React.FC<{ addNotification: (t: 'success'|'error', m: string) => void }> = ({ addNotification }) => {
    const [isLive, setIsLive] = useState(false);
    const [viewers, setViewers] = useState(120);
    const [chatMessages, setChatMessages] = useState<{user: string, msg: string, color: string}[]>([
        {user: "User 1", msg: "Keren banget produknya! 🔥", color: "bg-blue-500"},
        {user: "User 2", msg: "Harganya berapa kak?", color: "bg-pink-500"},
        {user: "User 3", msg: "Spill keranjang kuning!", color: "bg-green-500"},
    ]);
    
    useEffect(() => {
        if(!isLive) return;
        const interval = setInterval(() => {
            setViewers(v => v + Math.floor(Math.random() * 5) - 2);
            // Simulate random chat
            if(Math.random() > 0.7) {
                setChatMessages(prev => [...prev.slice(-4), {
                    user: `User ${Math.floor(Math.random()*100)}`,
                    msg: ["Wah murah banget", "Auto checkout!", "Restock dong kak", "Warnanya ada apa aja?"][Math.floor(Math.random()*4)],
                    color: ["bg-blue-500", "bg-purple-500", "bg-orange-500"][Math.floor(Math.random()*3)]
                }]);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [isLive]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 animate-in fade-in duration-500 h-full lg:h-[calc(100vh-140px)]">
            {/* Main Stream Area */}
            <div className="lg:col-span-2 flex flex-col gap-4 h-full">
                <div id="live-preview" className="bg-black border border-white/10 rounded-2xl flex-1 relative overflow-hidden group shadow-2xl">
                    {/* Mock Video Feed */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
                        {isLive ? (
                             <div className="text-center animate-pulse">
                                <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]"><User size={64} className="text-purple-400"/></div>
                                <p className="text-purple-300 font-bold">AI Avatar Broadcasting...</p>
                             </div>
                        ) : (
                            <div className="text-center opacity-50">
                                <MonitorPlay size={48} className="mx-auto mb-2 text-slate-500"/>
                                <p className="text-slate-400">Stream Offline</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Overlays */}
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                        <span className="text-xs font-bold text-white">{isLive ? 'LIVE' : 'OFFLINE'}</span>
                    </div>
                    {isLive && <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 border border-white/10 animate-in fade-in">
                        <Eye size={14} className="text-white"/>
                        <span className="text-xs font-bold text-white">{viewers}</span>
                    </div>}

                    {/* Product Pop-up Overlay */}
                    {isLive && (
                        <div className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-xl flex gap-3 items-center max-w-xs animate-in slide-in-from-left shadow-xl">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center"><ShoppingBag className="text-black" size={20}/></div>
                            <div><p className="text-xs font-bold text-white">Paket Bundling Kopi</p><p className="text-xs text-yellow-400 font-bold">Rp 85.000 <span className="line-through text-slate-400 ml-1 font-normal">100rb</span></p></div>
                            <button className="bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg ml-auto transition-colors shadow-lg">Buy</button>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-slate-800/40 border border-white/10 p-4 rounded-xl flex justify-between items-center shadow-lg">
                    <div className="flex gap-4">
                        <button className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 text-white transition-colors relative"><Mic size={20}/><span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-slate-800"></span></button>
                        <button className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 text-white transition-colors"><Video size={20}/></button>
                        <button className="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 text-white transition-colors"><Settings size={20}/></button>
                    </div>
                    <button onClick={()=>{setIsLive(!isLive); addNotification('success', isLive ? 'Stream Ended' : 'You are Live!');}} className={`px-8 py-3 rounded-lg font-bold transition-all shadow-lg ${isLive ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'}`}>
                        {isLive ? 'End Stream' : 'Go Live'}
                    </button>
                </div>
            </div>

            {/* Sidebar: Chat & Products */}
            <div className="flex flex-col gap-4 h-full">
                <div className="bg-slate-800/40 border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-lg">
                    <div className="p-3 border-b border-white/10 bg-slate-900/50"><h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Chat</h4></div>
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                        {chatMessages.map((c, i) => (
                            <div key={i} className="flex gap-2 items-start animate-in slide-in-from-bottom-2">
                                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${c.color}`}>{c.user.charAt(0)}</div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400">{c.user}</p>
                                    <p className="text-xs text-slate-200">{c.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-white/10 bg-slate-900/50 flex gap-2">
                        <input placeholder="Type as Host..." className="bg-slate-800 border-none text-white text-xs rounded-lg px-3 py-2 flex-1 outline-none focus:ring-1 focus:ring-purple-500 transition-all"/>
                        <button className="bg-purple-600 hover:bg-purple-500 p-2 rounded-lg text-white transition-colors"><Send size={14}/></button>
                    </div>
                </div>

                <div id="live-products" className="bg-slate-800/40 border border-white/10 rounded-2xl h-1/3 flex flex-col overflow-hidden shadow-lg">
                    <div className="p-3 border-b border-white/10 bg-slate-900/50 flex justify-between items-center"><h4 className="text-xs font-bold text-white uppercase tracking-wider">Pinned Products</h4><button className="text-[10px] text-purple-400 hover:text-white transition-colors">+ Add</button></div>
                    <div className="p-3 overflow-y-auto space-y-2">
                         <div className="flex gap-3 bg-slate-700/30 p-2 rounded-lg border border-purple-500/50 shadow-sm">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center"><ShoppingBag size={16} className="text-black"/></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">Paket Bundling</p>
                                <p className="text-[10px] text-slate-400">Rp 85.000</p>
                            </div>
                            <button className="text-purple-400 hover:text-white transition-colors"><Cast size={16}/></button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ViewKOL: React.FC<{ addNotification: (t: 'success'|'error', m: string) => void }> = ({ addNotification }) => {
    const [filters, setFilters] = useState({cat: 'All', price: 'All', search: ''});
    const filtered = MOCK_KOLS.filter(k => 
        (filters.cat === 'All' || k.category === filters.cat) &&
        (filters.price === 'All' || (filters.price === 'Micro' ? k.price < 500000 : k.price >= 500000)) &&
        k.name.toLowerCase().includes(filters.search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">KOL Collaboration</h2><button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold text-sm flex gap-2 shadow-lg hover:shadow-yellow-600/20 transition-all transform hover:-translate-y-0.5"><Megaphone size={16}/> Kampanye Baru</button></div>
            
            {/* Filter Section */}
            <div id="kol-filter" className="bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-center shadow-lg">
                <div className="flex items-center gap-2 text-slate-400 font-bold"><Filter size={16}/> Filter:</div>
                <select onChange={e=>setFilters({...filters, cat:e.target.value})} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:border-purple-500 outline-none hover:bg-slate-800 transition-colors cursor-pointer">
                    <option value="All">Semua Kategori</option>
                    <option value="F&B">F&B</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Technology">Technology</option>
                </select>
                <select onChange={e=>setFilters({...filters, price:e.target.value})} className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:border-purple-500 outline-none hover:bg-slate-800 transition-colors cursor-pointer">
                    <option value="All">Semua Harga</option>
                    <option value="Micro">Micro (&lt;500rb)</option>
                    <option value="Macro">Macro (&gt;500rb)</option>
                </select>
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                    <input onChange={e=>setFilters({...filters, search:e.target.value})} type="text" placeholder="Cari influencer..." className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:border-purple-500 outline-none hover:bg-slate-800 transition-colors"/>
                </div>
            </div>

            {/* KOL Cards */}
            <div id="kol-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(k => (
                    <div key={k.id} className="bg-slate-800/30 border border-white/10 p-5 rounded-2xl relative group hover:border-yellow-500/50 transition-all hover:bg-slate-800/50 hover:shadow-xl hover:-translate-y-1">
                        <div className="absolute top-4 right-4 text-yellow-500"><Star size={16}/></div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-0.5 shadow-lg">
                                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-lg font-bold text-white uppercase">{k.name.substring(0,2)}</div>
                            </div>
                            <div>
                                <div className="flex items-center gap-1"><h4 className="text-white font-bold">{k.name}</h4>{k.verified && <ShieldCheck size={14} className="text-blue-400 fill-blue-400/20"/>}</div>
                                <p className="text-xs text-purple-400">{k.handle}</p>
                                <div className="flex gap-1 mt-1">{k.tags.map((t,i)=><span key={i} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">{t}</span>)}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Followers</p>
                                <p className="text-white font-bold text-sm">{k.followers}</p>
                            </div>
                            <div className="text-center border-l border-white/10">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">ER</p>
                                <p className="text-green-400 font-bold text-sm">{k.er}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <div><p className="text-[10px] text-slate-500">Mulai dari</p><p className="text-white font-bold">Rp {k.price.toLocaleString()}</p></div>
                            <button onClick={()=>addNotification('success', 'Proposal terkirim!')} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg">Kontak</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ViewSubscription: React.FC<{ addNotification: (t: 'success'|'error', m: string) => void }> = ({ addNotification }) => {
  const [customFeatures, setCustomFeatures] = useState<Record<string, boolean>>({});
  const toggleFeature = (id: string) => setCustomFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  const calculateTotal = () => ALACARTE_FEATURES.reduce((acc, f) => customFeatures[f.id] ? acc + f.price : acc, 0);
  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="text-center max-w-3xl mx-auto"><h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pilih Paket Berlangganan</h2><p className="text-slate-400 text-sm">Mulai gratis atau buat paket custom sesuai kebutuhan bisnis Anda.</p></div>
      <div id="sub-plans" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">{PLANS.map((plan, idx) => (<div key={idx} className={`relative bg-[#1a1b26]/50 border ${plan.color} rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 group`}>{plan.tag && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">{plan.tag}</div>}<div className="mb-6"><h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{plan.name}</h3><div className="flex items-end gap-1"><span className="text-2xl font-bold text-white">{plan.price}</span><span className="text-xs text-slate-500 mb-1">{plan.period}</span></div></div><div className="flex-1 space-y-3 mb-8">{plan.features.map((f, i) => (<div key={i} className="flex gap-2 text-xs text-slate-300"><Check size={14} className="text-green-500 shrink-0"/>{f}</div>))}</div><button onClick={() => addNotification('success', `Paket ${plan.name} dipilih`)} className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg ${plan.highlight ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700'}`}>Pilih</button></div>))}</div>
      <div id="sub-calculator" className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 shadow-2xl"><div className="lg:col-span-2 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-white/10"><div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Calculator size={24} /></div><div><h3 className="text-xl font-bold text-white">Metode A La Carte</h3><p className="text-slate-400 text-xs">Bayar fitur yang Anda butuhkan saja.</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{ALACARTE_FEATURES.map((feat) => (<div key={feat.id} onClick={() => toggleFeature(feat.id)} className={`p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${customFeatures[feat.id] ? 'bg-blue-900/20 border-blue-500 shadow-lg' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800'}`}><div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${customFeatures[feat.id] ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>{customFeatures[feat.id] && <Check size={12} className="text-white"/>}</div><div><h4 className="text-sm font-bold text-white">{feat.name}</h4><span className="text-xs text-blue-400">{formatPrice(feat.price)}</span></div></div>))}</div></div><div className="p-6 md:p-8 bg-slate-900/80 flex flex-col justify-between h-full"><div><h4 className="font-bold text-white mb-4 flex items-center gap-2"><ShoppingCart size={18}/> Ringkasan</h4><div className="space-y-2 mb-4">{Object.keys(customFeatures).length === 0 ? <p className="text-xs text-slate-500 italic text-center py-4">Belum ada fitur dipilih.</p> : ALACARTE_FEATURES.filter(f => customFeatures[f.id]).map(f => <div key={f.id} className="flex justify-between text-xs text-slate-300 animate-in slide-in-from-right"><span>{f.name}</span><span>{formatPrice(f.price)}</span></div>)}</div></div><div><div className="flex justify-between items-end mb-4"><span className="text-slate-400 text-sm">Total Bulanan</span><span className="text-2xl font-bold text-white">{formatPrice(calculateTotal())}</span></div><button disabled={calculateTotal()===0} onClick={()=>addNotification('success', 'Paket Custom aktif!')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shadow-lg">Langganan Sekarang</button></div></div></div>
    </div>
  );
};

const ViewAnalytics = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[{l:"Total Reach", v:"450K", c:"text-blue-400"}, {l:"Engagement", v:"12.5%", c:"text-pink-400"}, {l:"Conversion", v:"3.2%", c:"text-green-400"}].map((s,i) => (
                 <div key={i} className="bg-slate-800/40 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:bg-slate-800/60 transition-colors shadow-lg">
                     <p className="text-xs text-slate-400 uppercase font-bold">{s.l}</p>
                     <h3 className={`text-3xl font-black ${s.c} mt-1`}>{s.v}</h3>
                     <div className="w-full bg-slate-700/50 h-1 mt-4 rounded-full overflow-hidden"><div className={`h-full w-[70%] ${s.c.replace('text','bg')}`}></div></div>
                 </div>
             ))}
        </div>
        <div className="bg-slate-800/40 border border-white/10 p-6 rounded-2xl h-80 flex items-end gap-2 relative shadow-xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
             <h3 className="absolute top-6 left-6 font-bold text-white z-10 flex items-center gap-2"><BarChart3 size={18} className="text-purple-400"/> Audience Growth</h3>
             {[40,60,35,80,65,90,70,100,85,95,75,60].map((h,i)=>(
                 <div key={i} className="flex-1 bg-gradient-to-t from-purple-600/50 to-pink-500/50 hover:to-pink-400 rounded-t-sm transition-all relative group" style={{height:`${h}%`}}>
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">{h}%</div>
                 </div>
             ))}
        </div>
    </div>
);

// ==========================================
// 4. MAIN APP SHELL
// ==========================================

const HypeItApp = () => {
  const [activeTab, setActiveTab] = useState('planner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isTourActive, setIsTourActive] = useState(false);
  
  // States for Documentation
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [docsInitialTab, setDocsInitialTab] = useState('user-guide');
  const [isFloatingDockOpen, setIsFloatingDockOpen] = useState(false);

  useEffect(() => {
    if (TOUR_STEPS[activeTab]) {
        setIsTourActive(false);
        setTimeout(() => setIsTourActive(true), 300);
    } else {
        setIsTourActive(false);
    }
  }, [activeTab]);

  const addNotification = (type: 'success'|'error'|'info', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      setIsMobileMenuOpen(false);
  };

  const openDocs = (tab: string) => {
      setDocsInitialTab(tab);
      setIsDocsOpen(true);
      setIsFloatingDockOpen(false);
  };

  const renderContent = () => {
    const props = { addNotification };
    switch (activeTab) {
      case 'planner': return <ViewPlanner onAutoFill={()=>{}} {...props} />;
      case 'generator': return <ViewGenerator {...props} />;
      case 'strategy': return <ViewStrategy {...props} />;
      case 'livestream': return <ViewLiveStream {...props} />;
      case 'analytics': return <ViewAnalytics />;
      case 'kol': return <ViewKOL {...props} />;
      case 'subscription': return <ViewSubscription {...props} />; 
      default: return <ViewPlanner onAutoFill={()=>{}} {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#05050A] text-slate-200 font-sans overflow-hidden selection:bg-purple-500 selection:text-white relative">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <ToastContainer notifications={notifications} />
      <InteractiveTour steps={TOUR_STEPS[activeTab]} isActive={isTourActive} onComplete={() => setIsTourActive(false)} />
      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} initialTab={docsInitialTab} />

      {/* Floating Knowledge Dock */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
          {isFloatingDockOpen && (
            <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4">
                <button onClick={() => openDocs('user-guide')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg text-xs font-bold transition-all hover:scale-105"><LifeBuoy size={16}/> Panduan</button>
                <button onClick={() => openDocs('flowchart')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg text-xs font-bold transition-all hover:scale-105"><GitBranch size={16}/> Flowchart</button>
                <button onClick={() => openDocs('uml')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg text-xs font-bold transition-all hover:scale-105"><Code size={16}/> Technical</button>
            </div>
          )}
          <button onClick={() => setIsFloatingDockOpen(!isFloatingDockOpen)} className={`w-14 h-14 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] flex items-center justify-center transition-all hover:scale-110 ${isFloatingDockOpen ? 'bg-slate-700 rotate-45' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`}><BookOpen size={24} /></button>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />)}

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 w-72 bg-[#0B0C15]/90 backdrop-blur-2xl border-r border-white/5 flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl`}>
        <div className="flex items-center justify-between px-2 mb-10 mt-2">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 via-pink-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20">H</div>
              <div><span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 block leading-tight">HYPEIT</span><span className="text-[10px] text-purple-400 font-medium tracking-widest">PRO STUDIO</span></div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400"><X size={24} /></button>
        </div>
        
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Core Tools</p>
          <SidebarItem icon={Calendar} label="AI Planner" active={activeTab === 'planner'} onClick={() => handleTabChange('planner')} />
          <SidebarItem icon={Wand2} label="Visual Generator" active={activeTab === 'generator'} onClick={() => handleTabChange('generator')} />
          <SidebarItem icon={Target} label="Viral Strategy" active={activeTab === 'strategy'} onClick={() => handleTabChange('strategy')} />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-6">Growth</p>
          <SidebarItem icon={Video} label="Live Studio" active={activeTab === 'livestream'} onClick={() => handleTabChange('livestream')} />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === 'analytics'} onClick={() => handleTabChange('analytics')} />
          <SidebarItem icon={Megaphone} label="KOL Marketplace" active={activeTab === 'kol'} onClick={() => handleTabChange('kol')} />
          
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-6">Billing</p>
          <SidebarItem icon={CreditCard} label="Subscription" active={activeTab === 'subscription'} onClick={() => handleTabChange('subscription')} />
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-3 rounded-xl border border-white/5 flex items-center gap-3 shadow-lg hover:shadow-purple-900/20 transition-shadow cursor-pointer">
                <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden border-2 border-purple-500"><User className="w-full h-full p-1 text-slate-300"/></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">UMKM Maju</p><p className="text-[10px] text-green-400 font-medium">Pro Plan Active</p></div>
                <button className="text-slate-400 hover:text-white"><Settings size={18}/></button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden z-10">
        <header className="h-20 border-b border-white/5 bg-[#05050A]/80 backdrop-blur-md flex items-center justify-between px-6 md:px-10 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-400 hover:text-white"><Menu size={24} /></button>
                <div>
                    <h1 className="text-xl font-bold text-white capitalize">{activeTab === 'livestream' ? 'Live Studio' : activeTab.replace('-', ' ')}</h1>
                    <p className="text-xs text-slate-500 hidden md:block">Real-time AI Dashboard</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-900/50 border border-white/10 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-400">System Operational</span>
                </div>
                <button className="p-2 text-slate-400 hover:text-white relative bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Bell size={20}/><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span></button>
            </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default HypeItApp;