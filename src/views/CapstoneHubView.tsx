import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  GraduationCap,
  Sparkles,
  Sliders,
  CheckCircle,
  HelpCircle,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  BookMarked,
  Layers,
  Wrench,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface CapstoneProject {
  id?: string;
  title: string;
  problemStatement: string;
  proposedArchitecture: string;
  tools: string[];
  createdAt?: string;
}

const INTERESTS_OPTIONS = [
  'Power Electronics (EEE 3203)',
  'Digital Signal Processing (EEE 3207)',
  'Power Systems II (EEE 3211)',
  'Communication II (EEE 3217)',
  'Embedded Systems & Microcontrollers',
  'VLSI & Silicon IC Design (EEE 2213)',
  'Analog Circuit Design'
];

export default function CapstoneHubView() {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<string>('Intermediate');
  const [customGoal, setCustomGoal] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<CapstoneProject[]>([]);
  const [savedToProfile, setSavedToProfile] = useState(false);

  // Past saved projects
  const [pastProjects, setPastProjects] = useState<CapstoneProject[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const isLoggedIn = !!token;

  // Initialize auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load past projects
  useEffect(() => {
    if (token) {
      fetch('/api/capstone-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data) => {
          setPastProjects(data);
        })
        .catch((err) => console.error('Error fetching past recommendations:', err));
    }
  }, [isLoggedIn, savedToProfile]);

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest area.');
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendedProjects([]);
    setSavedToProfile(false);

    try {
      const response = await fetch('/api/recommend-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          interests: selectedInterests,
          skillLevel,
          customGoal
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to recommend capstone projects.');
      }

      const data = await response.json();
      setRecommendedProjects(data.projects);
      setSavedToProfile(data.savedToProfile);
      setStep(4); // Move to results step
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during project recommendation generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(1);
    setSelectedInterests([]);
    setSkillLevel('Intermediate');
    setCustomGoal('');
    setRecommendedProjects([]);
    setSavedToProfile(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-sans text-slate-100 bg-navy-dark min-h-screen space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Title */}
      <div className="border-b border-navy-light pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-emerald-accent" />
            AI Capstone Project Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Academic Project Advisor calibrating complex capstone, seminar, and graduation thesis topics (EEE 3202).
          </p>
        </div>
        {isLoggedIn && pastProjects.length > 0 && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-navy-light/40 border border-navy-light text-xs font-semibold text-slate-300">
            <BookMarked className="h-3.5 w-3.5 text-emerald-accent" />
            {pastProjects.length} Saved Projects in Profile
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wizard Form Column (Left side) */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Recommendation Error</h4>
                <p className="text-xs text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form container */}
          <div className="rounded-2xl border border-navy-light bg-navy-card p-6 min-h-[400px] flex flex-col justify-between">
            <div>
              {/* Wizard progress dots */}
              <div className="flex items-center gap-2 mb-6 border-b border-navy-light/40 pb-4">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-all ${
                      step === s ? 'w-8 bg-emerald-accent' : 'w-2 bg-navy-light'
                    }`}
                  />
                ))}
                <span className="text-[10px] font-mono font-bold text-slate-500 ml-auto">
                  STEP {step} OF 4
                </span>
              </div>

              {/* STEP 1: SELECT INTERESTS */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-5 w-5 text-emerald-accent" />
                      Select Core EEE Interests
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose which academic modules or design branches you wish to integrate into your capstone project.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {INTERESTS_OPTIONS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          onClick={() => handleInterestToggle(interest)}
                          className={`p-3 text-left rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-emerald-accent/40 bg-emerald-accent/5 text-emerald-accent shadow-lg shadow-emerald-accent/5'
                              : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                          }`}
                        >
                          {interest}
                          <CheckCircle
                            className={`h-4 w-4 transition-opacity ${isSelected ? 'text-emerald-accent opacity-100' : 'opacity-0'}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: SKILL LEVEL */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Sliders className="h-5 w-5 text-emerald-accent" />
                      Select Project Complexity
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Calibrate the technical depth, academic complexity, and implementation scope.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {[
                      { level: 'Beginner', desc: 'Proof-of-concept prototype. Standard development boards, basic algorithms.' },
                      { level: 'Intermediate', desc: 'Fully realized functional design. Clean signal lines, robust coding architecture.' },
                      { level: 'Advanced', desc: 'Highly complex academic thesis. Mathematical validation, custom hardware layout.' }
                    ].map((item) => (
                      <button
                        key={item.level}
                        onClick={() => setSkillLevel(item.level)}
                        className={`p-4 text-left rounded-xl border transition-all flex flex-col justify-between h-36 cursor-pointer ${
                          skillLevel === item.level
                            ? 'border-emerald-accent/40 bg-emerald-accent/5 text-emerald-accent shadow-lg shadow-emerald-accent/5'
                            : 'border-navy-light bg-navy-dark hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono uppercase">{item.level}</span>
                        <p className="text-[11px] text-slate-400 leading-normal mt-2">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: CUSTOM GOAL / THEME */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <HelpCircle className="h-5 w-5 text-emerald-accent" />
                      Add Custom Themes or Goals
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      (Optional) Describe specific keywords, target industries, or components you'd love to include (e.g. "renewable energy grid protection", "STM32 microcontroller", "IoT smart agriculture").
                    </p>
                  </div>

                  <textarea
                    value={customGoal}
                    onChange={(e) => setSkillLevel(skillLevel)} // standard state
                    onInput={(e: React.FormEvent<HTMLTextAreaElement>) => setCustomGoal(e.currentTarget.value)}
                    placeholder="Enter any custom engineering themes, software frameworks, or sensor technologies here..."
                    className="w-full bg-navy-dark border border-navy-light rounded-xl p-4 text-xs font-sans focus:border-emerald-accent focus:outline-none min-h-36 placeholder:text-slate-600 leading-relaxed"
                  />
                </div>
              )}

              {/* STEP 4: SUGGESTIONS */}
              {step === 4 && recommendedProjects.length > 0 && (
                <div className="space-y-6">
                  <div className="border-b border-navy-light/40 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-white">Recommended Projects</h3>
                      <p className="text-xs text-slate-400">Custom recommended project architectures based on your profile.</p>
                    </div>
                    {savedToProfile && (
                      <span className="text-[10px] font-bold text-emerald-accent uppercase font-mono bg-emerald-accent/10 border border-emerald-accent/20 px-2.5 py-1 rounded-full">
                        Saved to Profile
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {recommendedProjects.map((proj, idx) => (
                      <div key={idx} className="border border-navy-light/60 bg-navy-dark/40 rounded-xl p-5 space-y-3.5 hover:border-emerald-accent/40 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20 text-xs font-bold text-emerald-accent font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-snug">{proj.title}</h4>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Problem Statement:</span>
                            <p className="text-slate-300 leading-relaxed font-sans">{proj.problemStatement}</p>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Proposed Architecture:</span>
                            <p className="text-slate-300 leading-relaxed font-sans">{proj.proposedArchitecture}</p>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase block mb-1">Key Tools & Technologies:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {proj.tools.map((t, tIdx) => (
                                <span key={tIdx} className="bg-navy-light/30 border border-navy-light rounded-lg px-2 py-0.5 text-[10px] font-medium text-slate-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex justify-between items-center border-t border-navy-light/40 pt-4 mt-6">
              {step > 1 && step < 4 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white text-xs font-bold bg-transparent border-0 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              {step === 4 ? (
                <button
                  onClick={handleRestart}
                  className="ml-auto py-2.5 px-4 rounded-xl text-xs font-bold bg-navy-light hover:bg-navy-light/80 text-white cursor-pointer transition-colors border border-navy-light/60"
                >
                  Generate New Recommendations
                </button>
              ) : (
                <div className="ml-auto flex items-center gap-3">
                  {step < 3 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 && selectedInterests.length === 0}
                      className={`flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        step === 1 && selectedInterests.length === 0
                          ? 'bg-navy-light text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-accent text-navy-dark hover:bg-emerald-hover'
                      }`}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateRecommendations}
                      disabled={loading}
                      className="flex items-center gap-1.5 py-2.5 px-6 rounded-xl text-xs font-bold bg-emerald-accent text-navy-dark hover:bg-emerald-hover cursor-pointer shadow-lg shadow-emerald-accent/10 transition-all"
                    >
                      {loading ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-navy-dark border-t-transparent rounded-full animate-spin" />
                          Consulting AI...
                        </>
                      ) : (
                        <>
                          Get Recommendations
                          <Sparkles className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile/History Column (Right side) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-navy-light bg-navy-card p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-1.5 border-b border-navy-light/40 pb-3">
              <Bookmark className="h-5 w-5 text-emerald-accent" />
              Saved Project Ideas
            </h3>

            {!isLoggedIn ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">
                  Please log in or register to save your recommended capstone projects directly to your profile.
                </p>
              </div>
            ) : pastProjects.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                No saved project architectures yet. Use the wizard to generate and automatically save some!
              </p>
            ) : (
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                {pastProjects.map((proj) => (
                  <div key={proj.id} className="border border-navy-light/40 bg-navy-dark/40 rounded-xl p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-white leading-snug">{proj.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{proj.problemStatement}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.tools.slice(0, 3).map((t, i) => (
                        <span key={i} className="bg-navy-light/20 border border-navy-light/40 text-[9px] px-1.5 py-0.5 rounded text-slate-300">
                          {t}
                        </span>
                      ))}
                      {proj.tools.length > 3 && (
                        <span className="text-[9px] text-slate-500 font-mono">+{proj.tools.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-navy-light bg-navy-card/50 p-6 space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-accent" />
              Multi-Module Synergy
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Academic guidelines suggest integrating at least 2 distinct specialties (e.g. DSP + Power Electronics or Power Systems + Communication) to create an outstanding 3rd-year capstone proposal. Let the AI Advisor cross-examine your parameters to achieve high compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
