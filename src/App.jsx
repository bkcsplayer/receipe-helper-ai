import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Home, Receipt, PieChart, User, Camera, Check, Clock, AlertCircle, Sparkles, Server, Database, Mail, Brain, Zap, Scan, FileUp, Cloud, TableProperties, Bot, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ... (existing imports)

// --- Components ---

const FutureFrontierLogo = ({ className }) => (
  <img 
    src="/logo-ff-removebg-preview.png" 
    alt="Future Frontier Logo" 
    className={className}
  />
);

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'ffthelper' && password === '1q2w3e4R.') {
      onLogin();
    } else {
      setError('The cosmic keys do not match.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          "w-full max-w-sm bg-white border-2 border-ink rounded-xl shadow-hand p-8 relative z-10",
          shaking && "animate-[shake_0.5s_ease-in-out]"
        )}
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <FutureFrontierLogo className="w-32 h-32 object-contain drop-shadow-sm" />
          </motion.div>
          <h1 className="text-3xl text-brand-blue mt-2 font-hand font-bold">Future Frontier</h1>
          <p className="text-ink/50 font-hand text-lg">Receipt Manifestation Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-ink/60 ml-1">Identity</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-ink/40" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-paper/50 border-2 border-ink/20 rounded-lg py-2.5 pl-10 pr-4 font-hand text-xl focus:border-brand-orange focus:outline-none transition-colors text-ink"
                placeholder="Enter username..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-ink/60 ml-1">Passphrase</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-ink/40" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper/50 border-2 border-ink/20 rounded-lg py-2.5 pl-10 pr-4 font-hand text-xl focus:border-brand-orange focus:outline-none transition-colors text-ink"
                placeholder="Enter password..."
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 text-highlight-pink font-bold text-sm justify-center"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit"
            className="w-full bg-brand-blue text-white font-hand text-2xl py-3 rounded-lg border-2 border-ink shadow-hand hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 group"
          >
            <span>Unlock Portal</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
      
      <p className="absolute bottom-6 text-ink/30 text-xs font-bold uppercase tracking-widest">
        System v1.0.0 • Secure Connection
      </p>
    </div>
  );
};

// Hand-Drawn Card Component
const HandDrawnCard = ({ children, className, onClick, style }) => (
  <motion.div 
    whileHover={{ scale: 1.01, rotate: -0.5 }}
    whileTap={{ scale: 0.98 }}
    className={clsx("card-hand", className)}
    onClick={onClick}
    style={style}
  >
    {children}
  </motion.div>
);

const FullScreenUploadStatus = ({ currentStep, progressData, onClose }) => {
  const steps = [
    { id: 0, icon: FileUp, label: "Uploading Evidence", desc: "Sending your artifact to the ether..." },
    { id: 2, icon: Brain, label: "AI Divination", desc: "Extracting wisdom from chaos..." },
    { id: 3, icon: Cloud, label: "Cloud Archive", desc: "Preserving memory in the digital vault..." },
    { id: 4, icon: TableProperties, label: "Ledger Entry", desc: "Inscribing value into the sheets..." },
    { id: 5, icon: Check, label: "Manifested!", desc: "It is done." }
  ];

  // Determine active step details
  // Map backend steps to our UI steps. Backend skips 1 sometimes or jumps.
  // Backend: 0/1=Upload, 2=AI, 3=Drive, 4=Sheet, 5=Done
  const activeStepObj = steps.find(s => s.id >= currentStep) || steps[steps.length - 1];
  const isCompleted = currentStep >= 5;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md relative">
        {/* Main Status Card */}
        <motion.div 
          layoutId="upload-card"
          className="bg-paper rounded-3xl p-8 shadow-2xl border-2 border-white/10 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center space-y-8"
        >
          {/* Background Ambient Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-transparent to-brand-orange/20 opacity-50"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

          {/* Central Large Icon */}
          <div className="relative z-10">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeStepObj.id}
                 initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                 animate={{ scale: 1, opacity: 1, rotate: 0 }}
                 exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                 transition={{ type: "spring", bounce: 0.5 }}
                 className={clsx(
                   "w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-lg mb-4",
                   isCompleted ? "bg-brand-green text-white border-white" : "bg-white text-brand-blue border-brand-blue"
                 )}
               >
                 <activeStepObj.icon size={64} strokeWidth={1.5} />
               </motion.div>
             </AnimatePresence>
             
             {/* Pulse Effect behind icon */}
             {!isCompleted && (
               <div className="absolute inset-0 rounded-full border-4 border-brand-blue/30 animate-ping"></div>
             )}
          </div>

          {/* Text Status */}
          <div className="relative z-10 space-y-2">
            <AnimatePresence mode="wait">
               <motion.h2 
                 key={activeStepObj.label}
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 className="text-3xl font-bold text-brand-blue"
               >
                 {activeStepObj.label}
               </motion.h2>
            </AnimatePresence>
            <p className="font-hand text-xl text-ink/60">{activeStepObj.desc}</p>
          </div>

          {/* Progress Timeline */}
          <div className="w-full flex justify-between items-center relative z-10 px-2 pt-4">
            {steps.map((step, idx) => {
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id || (currentStep > steps[idx-1]?.id && currentStep < steps[idx+1]?.id);
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative">
                   {/* Line Connector */}
                   {idx < steps.length - 1 && (
                     <div className={clsx(
                       "absolute top-3 left-1/2 w-full h-1 -z-10",
                       currentStep > step.id ? "bg-brand-green" : "bg-ink/10"
                     )} style={{ width: '200%' }}></div>
                   )}
                   
                   <div className={clsx(
                     "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                     isDone ? "bg-brand-green border-brand-green text-white scale-110" : 
                     isCurrent ? "bg-white border-brand-blue text-brand-blue scale-125" : 
                     "bg-white border-ink/20 text-transparent scale-100"
                   )}>
                     {isDone && <Check size={14} />}
                   </div>
                </div>
              );
            })}
          </div>
          
          {isCompleted && (
             <motion.button
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               onClick={onClose}
               className="mt-8 px-8 py-3 bg-brand-blue text-white rounded-full font-bold text-lg hover:bg-brand-blue/90 transition-colors shadow-lg relative z-10"
             >
               Close & View
             </motion.button>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
};

const StepProgress = ({ currentStep }) => {
  const steps = [
    { id: 1, icon: FileUp, label: "Upload" },
    { id: 2, icon: Brain, label: "AI Scan" }, // Use Brain for AI
    { id: 3, icon: Cloud, label: "Archive" },
    { id: 4, icon: TableProperties, label: "Record" }
  ];

  return (
    <div className="w-full py-4">
      <div className="flex justify-between items-center relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 -z-0 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-highlight-yellow -z-0 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isActive = currentStep >= step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
              <motion.div 
                initial={false}
                animate={{ 
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isActive ? "#FCD34D" : "rgba(255,255,255,0.2)"
                }}
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                  isActive ? "border-highlight-yellow text-brand-blue shadow-[0_0_15px_rgba(252,211,77,0.5)]" : "border-white/30 text-white/50"
                )}
              >
                <Icon size={isCurrent ? 20 : 16} strokeWidth={2.5} />
              </motion.div>
              <span className={clsx(
                "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                isActive ? "text-highlight-yellow" : "text-white/40"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SystemHealthBar = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(setHealth)
      .catch(err => console.error("Health check failed", err));
  }, []);

  if (!health) return null;

  const HealthItem = ({ icon: Icon, status, label, colorClass = "text-brand-green", customIcon }) => (
    <div className="flex flex-col items-center gap-1 group cursor-help relative" title={status?.msg}>
       <motion.div 
         whileHover={{ scale: 1.1 }}
         className={clsx(
           "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all shadow-sm",
           status?.ok 
             ? `bg-white border-${colorClass.split('-')[1] || 'brand-green'} text-${colorClass.split('-')[1] || 'brand-green'}` 
             : "bg-brand-orange/5 border-brand-orange text-brand-orange grayscale"
         )}
         style={{ borderColor: status?.ok ? 'currentColor' : undefined }}
       >
         {customIcon ? customIcon : <Icon size={20} strokeWidth={2} />}
         
         {/* Status Dot */}
         <span className={clsx(
           "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
           status?.ok ? "bg-green-500" : "bg-red-500 animate-pulse"
         )} />
       </motion.div>
       <span className="text-[10px] font-bold uppercase tracking-wider text-ink/60">{label}</span>
    </div>
  );

  // Custom OpenRouter Logo (Simulated with Brain + Sparkles)
  const AI_Logo = (
    <div className="relative">
      <Brain size={20} />
      <Sparkles size={10} className="absolute -top-1 -right-2 text-highlight-yellow" fill="currentColor" />
    </div>
  );

  return (
    <div className="flex justify-between px-6 py-4 bg-white/60 backdrop-blur-md rounded-2xl mx-4 mb-6 border border-white/50 shadow-sm">
      <HealthItem 
        icon={Brain} 
        customIcon={AI_Logo}
        status={health.ai} 
        label="AI Brain" 
        colorClass="text-purple-600" 
      />
      <HealthItem 
        icon={Server} 
        status={health.drive} 
        label="Drive" 
        colorClass="text-blue-500" 
      />
      <HealthItem 
        icon={Database} 
        status={health.sheets} 
        label="Sheet" 
        colorClass="text-emerald-600" 
      />
      <HealthItem 
        icon={Mail} 
        status={health.email} 
        label="Email" 
        colorClass="text-pink-500" 
      />
       <HealthItem 
        icon={Bot} // Uses Bot icon from lucide-react
        status={health.telegram} 
        label="Telegram" 
        colorClass="text-sky-500" 
      />
    </div>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-1 transition-colors",
      active ? "text-brand-blue" : "text-ink/60"
    )}
  >
    <div className={clsx(
      "p-2 rounded-full transition-all",
      active && "bg-brand-blue/10 ring-2 ring-brand-blue/20"
    )}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} className={clsx(active && "animate-bounce-slight")} />
    </div>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

const ProgressBar = ({ step, progress, message }) => {
  // Use progress prop directly if available, otherwise fallback to step-based estimation
  const width = progress || (step / 4) * 100;
  
  return (
    <div className="w-full space-y-2">
      <div className="w-full h-4 border-2 border-ink rounded-full overflow-hidden bg-white p-0.5 relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/scribble-light.png')]"></div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-brand-orange rounded-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite_linear]" 
               style={{backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)'}} 
          />
        </motion.div>
      </div>
      {message && (
        <p className="text-white text-center font-hand text-lg animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [receipts, setReceipts] = useState([]); // Clean slate, no mock data
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [progressData, setProgressData] = useState({ progress: 0, message: "Initializing..." });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All'); // Month filter
  const fileInputRef = React.useRef(null);

  // Determine API Base URL (Dev uses proxy, Prod uses env var)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const fetchReceiptsData = useCallback(() => {
    if (!isAuthenticated) return;
    fetch(`${API_BASE}/api/receipts`)
      .then(res => res.json())
      .then(data => setReceipts(data))
      .catch(err => console.error("Failed to load history", err));
  }, [isAuthenticated]);

  // Load History on Mount or after login
  useEffect(() => {
    fetchReceiptsData();
  }, [fetchReceiptsData]);

  // Poll for updates (emails processed in background)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchReceiptsData, 15000);
    return () => clearInterval(interval);
  }, [fetchReceiptsData, isAuthenticated]);

  const handleCardClick = () => {
    if (!uploading && !selectedImage) {
      fileInputRef.current?.click();
    } else if (selectedImage && !uploading) {
      handleUpload();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Immediately show loading overlay feedback before FileReader completes
      setUploading(true);
      setUploadStep(1);
      setProgressData({ progress: 5, message: "Preparing upload..." });

      const reader = new FileReader();
      reader.onloadend = () => {
        // Using functional update to ensure we have the latest state
        // But handleUpload relies on selectedImage state, which is async.
        // Better approach: pass base64 directly to handleUpload or trigger via effect.
        // Let's use a flag/effect or just wait for state.
        // For simplicity and reliability: Update state, and let useEffect trigger upload?
        // No, useEffect on selectedImage might trigger on initial load or unwanted times.
        // Best: Pass the base64 string directly to handleUpload.
        
        setSelectedImage(reader.result);
        // Trigger upload immediately with the data we just read
        handleUpload(reader.result, { skipInit: true });
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  // Calculate Total Amount from Receipts (using correct property names)
  const filteredReceipts = selectedMonth === 'All' 
    ? receipts 
    : receipts.filter(r => r.date.startsWith(selectedMonth));

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + (Number(receipt.total_amount || receipt.amount) || 0), 0);

  // Extract unique months for filter
  const availableMonths = [...new Set(receipts.map(r => r.date.substring(0, 7)))].sort().reverse();

  // Modified to accept optional image data argument
  const handleUpload = async (imageData = null, options = {}) => {
    if (!isAuthenticated) return;
    const imageToUpload = imageData || selectedImage;
    if (!imageToUpload) return;
    
    if (!options.skipInit) {
      setUploading(true);
      setUploadStep(0); // 0 = Initial Uploading State
      setProgressData({ progress: 0, message: "Initiating Upload..." });
    }

    // Start SSE Listener
    const eventSource = new EventSource(`${API_BASE}/api/progress`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Progress Update:', data);
      
      // Only update visual state if backend explicitly moves step forward
      // Use functional state update to avoid race conditions
      setProgressData({ progress: data.progress, message: data.message });
      
      // Only update step if it's greater than current (avoid regression)
      if (data.step > 0) setUploadStep(prev => Math.max(prev, data.step));
    };
    
    try {
      // 1. Convert base64 preview to blob for upload
      const res = await fetch(imageToUpload);
      const blob = await res.blob();
      const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('receipt', file);
      
      // 3. Send to Backend
      const response = await fetch(`${API_BASE}/api/process-receipt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Manifestation blocked by cosmic rays');
      
      const result = await response.json();
      console.log('Manifestation Result:', result);

      // 4. Update visual steps
      eventSource.close(); // Close SSE on success
      
      // Force complete state
      setUploadStep(5);
      setProgressData({ progress: 100, message: "Complete" });
      
      setTimeout(() => {
        // Add new receipt to list
        if (result.data) {
          // Ensure we use consistent property names (store_name, total_amount) to match backend
          const newReceipt = {
            id: Date.now(),
            store_name: result.data.store_name || "Unknown Store",
            date: result.data.date || new Date().toISOString().split('T')[0],
            total_amount: Number(result.data.total_amount) || 0,
            status: 'completed',
            items: result.data.items || [],
            ...result.data // Merge other fields just in case
          };
          setReceipts(prev => [newReceipt, ...prev]);
        }
        
        // Reset state for next upload after a brief delay to show completion
        setUploading(false);
        setSelectedImage(null);
        setUploadStep(0);
        setProgressData({ progress: 0, message: "" });
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
      }, 2000); // Show "Manifested" for 2 seconds then close

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Manifestation failed. Please try again.');
      setUploading(false);
      eventSource.close(); // Close SSE on error
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-paper relative pb-20 overflow-hidden border-x-2 border-ink/10 shadow-2xl">
      
      {/* Full Screen Upload Overlay */}
      <AnimatePresence>
        {uploading && (
          <FullScreenUploadStatus 
            currentStep={uploadStep} 
            progressData={progressData} 
            onClose={() => {
              setUploading(false);
              setSelectedImage(null);
              setUploadStep(0);
            }} 
          />
        )}
      </AnimatePresence>

      {/* --- Top Navigation --- */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-gradient-to-b from-paper to-transparent z-10 relative">
        <div>
          <h1 className="text-3xl text-brand-blue">Hi, User <span className="inline-block animate-wave">👋</span></h1>
          <p className="font-hand text-ink/60 text-lg -mt-1">Ready to manifest order?</p>
        </div>
        <button className="relative p-2 hover:bg-black/5 rounded-full transition-colors">
          <Bell size={24} className="text-ink" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-highlight-pink rounded-full border border-white"></span>
        </button>
      </header>

      {/* System Health Status */}
      <SystemHealthBar />

      <main className="px-5 space-y-8">
        
        {/* --- Card 1: Upload Action (Tarot Style) --- */}
        <section>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange}
          />
          <HandDrawnCard 
            onClick={handleCardClick}
            className="h-64 flex flex-col justify-between group cursor-pointer !border-0 !p-0 overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, #2A3A68 0%, #1a2542 100%)'
            }}
          >
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            {selectedImage && (
              <div className="absolute inset-0 z-0">
                 <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-40 blur-sm" />
                 <div className="absolute inset-0 bg-brand-blue/50 mix-blend-multiply"></div>
              </div>
            )}
            
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-orange/20 rounded-full blur-3xl group-hover:bg-brand-orange/30 transition-colors z-0"></div>
            
            <div className="relative z-10 p-6 h-full flex flex-col items-center justify-center text-center text-paper space-y-4 w-full">
              {selectedImage ? (
                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                  <div className="w-32 h-32 mx-auto relative rounded-lg overflow-hidden border-4 border-white rotate-2 shadow-lg">
                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-2xl text-highlight-yellow">Ready to Manifest?</h2>
                  <p className="font-hand text-white/80 text-sm">Tap again to process</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Camera size={40} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl text-highlight-yellow mb-1">Capture Receipt</h2>
                    <p className="font-hand text-xl opacity-80">"Transform chaos into structured data."</p>
                  </div>
                </>
              )}
            </div>
            
            {/* Decorative border */}
            <div className="absolute inset-2 border-2 border-white/20 rounded-lg pointer-events-none"></div>
          </HandDrawnCard>
        </section>

        {/* --- Card 2: Status / Insight (Wish Style) --- */}
        <section>
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-2xl text-ink">Spending Insight</h3>
            <span className="font-hand text-brand-orange text-lg">Nov 2025</span>
          </div>
          
          <HandDrawnCard className="!bg-brand-green/10 !border-brand-green">
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-white rounded-full border-2 border-brand-green flex items-center justify-center shadow-sm">
                 <span className="text-2xl">💰</span>
               </div>
               <div>
                 <p className="font-hand text-lg text-ink/70">This Month's Total</p>
                 <h2 className="text-4xl text-brand-green">${totalAmount.toFixed(2)}</h2>
               </div>
             </div>
             <div className="mt-4 pt-3 border-t-2 border-brand-green/20 flex gap-2 text-sm font-bold text-brand-green">
                <Sparkles size={16} />
                <span>Keep flowing, abundance is here.</span>
             </div>
          </HandDrawnCard>
        </section>

        {/* --- Card 3: Recent Rituals (History List) --- */}
        <section className="pb-8">
           <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-2xl text-ink">Recent Rituals</h3>
            
            {/* Month Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-[50%] justify-end no-scrollbar">
              <button 
                onClick={() => setSelectedMonth('All')}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                  selectedMonth === 'All' ? "bg-brand-blue text-white" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                )}
              >
                All
              </button>
              {availableMonths.map(month => (
                <button 
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                    selectedMonth === month ? "bg-brand-blue text-white" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                  )}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-8 text-ink/40 font-hand text-xl border-2 border-dashed border-ink/20 rounded-lg">
                No rituals found for this period.
              </div>
            ) : (
              filteredReceipts.map((receipt, idx) => (
                <motion.div 
                  key={receipt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={clsx(
                    "border-2 rounded-lg p-4 shadow-sm flex items-center justify-between group hover:shadow-hand hover:-translate-y-1 transition-all",
                    receipt.source === 'Email' 
                      ? "bg-brand-blue/5 border-brand-blue/40" 
                      : "bg-highlight-yellow/10 border-highlight-yellow/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center",
                      receipt.status === 'completed' ? "bg-brand-green/20 text-brand-green" :
                      receipt.status === 'processing' ? "bg-highlight-yellow/20 text-brand-orange" :
                      "bg-highlight-pink/20 text-highlight-pink"
                    )}>
                      {receipt.status === 'completed' && <Check size={20} />}
                      {receipt.status === 'processing' && <Clock size={20} />}
                      {receipt.status === 'failed' && <AlertCircle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg leading-none">{receipt.store_name || receipt.store || "Unknown Store"}</h4>
                        <span className={clsx(
                          "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest",
                          receipt.source === 'Email' ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/30" : "bg-highlight-yellow/20 text-highlight-yellow border border-highlight-yellow/40"
                        )}>
                          {receipt.source === 'Email' ? 'Email' : 'Camera'}
                        </span>
                      </div>
                      <p className="font-hand text-ink/60">{receipt.date}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-xl">${(Number(receipt.total_amount || receipt.amount) || 0).toFixed(2)}</p>
                    <span className="block text-xs font-bold uppercase tracking-wider opacity-50">{receipt.status}</span>
                    {receipt.driveLink ? (
                      <a 
                        href={receipt.driveLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue underline decoration-dotted"
                      >
                        <Cloud size={14} />
                        View Image
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                        <AlertCircle size={12} />
                        No Cloud Link
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-ink px-6 py-3 z-50 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Receipt} label="Receipts" active={activeTab === 'receipts'} onClick={() => setActiveTab('receipts')} />
          <div className="w-12"></div> {/* Spacer for FAB if needed, or just spacing */}
          <NavItem icon={PieChart} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <NavItem icon={User} label="Me" active={activeTab === 'me'} onClick={() => setActiveTab('me')} />
        </div>
        {/* Floating Main Button */}
        <button 
          onClick={handleUpload}
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-orange text-white p-4 rounded-full border-2 border-ink shadow-hand hover:shadow-hand-hover hover:-translate-y-1 transition-all active:translate-y-0"
        >
          <Camera size={28} strokeWidth={2.5} />
        </button>
      </nav>

    </div>
  );
}
