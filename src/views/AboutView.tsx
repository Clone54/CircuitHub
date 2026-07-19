import { Link } from 'react-router-dom';
import { Cpu, Award, Users, ShieldCheck, Zap, Activity, ArrowLeft } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 min-h-[80vh]">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto border-b border-navy-light pb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 mb-2">
          <Cpu className="h-6 w-6 text-emerald-accent" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-white">Our Academic Mission</h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          CircuitHub was engineered specifically to bridge physical electrical laboratory grids with intelligent, rapid analytical reference tools.
        </p>
      </div>

      {/* Grid: Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="bg-navy-card border border-navy-light p-6 rounded-2xl space-y-3">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-accent" /> Interactive Lab Checkers
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
<<<<<<< HEAD
            In standard EEE courses, verifying theoretical circuit outputs manually can lead to delays. CircuitHub features live numerical simulation solvers for 555-timer free running oscillations and operational amplifier feedback networks. Scholars can input their laboratory resistor and capacitor constants to verify physical breadboard wave configurations immediately.
=======
            In standard EEE-2104 courses, verifying theoretical circuit outputs manually can lead to delays. CircuitHub features live numerical simulation solvers for 555-timer free running oscillations and operational amplifier feedback networks. Scholars can input their laboratory resistor and capacitor constants to verify physical breadboard wave configurations immediately.
>>>>>>> 6183e3e30f0dad1b928ff0629653d32a42b17d0c
          </p>
        </div>

        <div className="bg-navy-card border border-navy-light p-6 rounded-2xl space-y-3">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-accent" /> Gemini Datasheet Extraction
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Reading hundreds of pages in semiconductor manufacturer PDF specifications is highly inefficient. We utilize state-of-the-art Generative AI models from Google to parse documents and present clear pin-out, thermal capability, and biasing metrics in beautiful, direct tables.
          </p>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-white border-l-2 border-emerald-accent pl-3">
          Addressing the Gap in Modern Electrical Engineering
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Traditionally, students and makers design hardware systems using heavy CAD simulators (such as LTSpice, Multisim) or by sifting through complex printed textbooks. While these systems are highly accurate, they lack lightweight, cloud-accessible, intuitive specifications interfaces where students can quickly browse parameters.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          CircuitHub compiles and curates the most frequently studied operational amplifiers, discrete semiconductors, voltage controllers, and microchip microcontrollers in a single, high-speed dashboard. This empowers rapid prototyping and consolidates EEE knowledge directly.
        </p>
      </div>

      {/* Team stats and copyright credit */}
      <div className="bg-navy-card border border-navy-light p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="font-display text-sm font-bold text-white block">Project Stewardship</span>
          <span className="text-xs text-slate-400 block max-w-md">
            This platform is fully designed, implemented, and maintained as an academic project by Firoz Ahmed, specifically aligned with university syllabus milestones.
          </span>
        </div>
        <div className="text-xs font-mono font-bold text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-4 py-2 rounded-xl shrink-0">
          Developed by Firoz Ahmed
        </div>
      </div>
    </div>
  );
}
