import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Cpu, Star, MessageSquare, AlertCircle, Sparkles, Send, FileText, Upload, Table, HelpCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { ComponentItem, Review, User, AnalyzeResult } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

interface DetailsViewProps {
  components: ComponentItem[];
  user: User | null;
  onReviewAdded: (componentId: string, review: Review) => void;
}

export default function DetailsView({ components, user, onReviewAdded }: DetailsViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find component
  const component = components.find((c) => c.id === id);

  // States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // AI Analyzer states
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzerTab, setAnalyzerTab] = useState<'quick' | 'upload' | 'text'>('quick');

  // Load reviews on change of component
  useEffect(() => {
    if (!component) return;
    
    // Clear previous results
    setAnalysisResult(null);
    setSelectedFile(null);
    setTextToAnalyze('');
    
    setReviewsLoading(true);
    getDocs(query(collection(db, 'reviews'), where('componentId', '==', component.id)))
      .then((querySnapshot) => {
        const fetchedReviews: Review[] = [];
        querySnapshot.forEach((docSnapshot) => {
          fetchedReviews.push({ id: docSnapshot.id, ...docSnapshot.data() } as Review);
        });
        // Sort client-side to prevent missing index errors
        fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (fetchedReviews.length > 0) {
          setReviews(fetchedReviews);
        } else {
          // Fallback reviews
          setReviews([
            {
              id: 'f1',
              componentId: component.id,
              userName: 'Firoz Ahmed',
              userEmail: 'firozahmedskt1@gmail.com',
              rating: 5,
<<<<<<< HEAD
              comment: `Perfect for EEE lab assignments! Correct pin configuration and linear voltage ratios. Highly recommended reference.`,
=======
              comment: `Perfect for EEE-2104 lab assignments! Correct pin configuration and linear voltage ratios. Highly recommended reference.`,
>>>>>>> 6183e3e30f0dad1b928ff0629653d32a42b17d0c
              createdAt: new Date().toISOString()
            }
          ]);
        }
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.LIST, `reviews?componentId=${component.id}`);
      })
      .finally(() => setReviewsLoading(false));
  }, [component]);

  if (!component) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center space-y-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Component Not Found</h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          The requested electronic circuit component or device does not exist in our system.
        </p>
        <Link
          to="/explore"
          className="inline-flex rounded-xl bg-emerald-accent px-5 py-2.5 text-xs font-bold text-navy-dark hover:bg-emerald-hover transition-colors"
        >
          Return to Explore
        </Link>
      </div>
    );
  }

  // Related components (same category, excluding current)
  const relatedComponents = components
    .filter((c) => c.category === component.category && c.id !== component.id)
    .slice(0, 4);

  // Submit Review Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmittingReview(true);
    try {
      const reviewPayload = {
        componentId: component.id,
        userName: user.name,
        userEmail: user.email,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'reviews'), reviewPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'reviews');
        return;
      }
      const newReview: Review = {
        id: docRef.id,
        ...reviewPayload
      };

      onReviewAdded(component.id, newReview);
      setReviews(prev => [newReview, ...prev]);
      setComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      // Fallback submission logic for offline preview compatibility
      const mockReview: Review = {
        id: 'rev_' + Math.random().toString(36).substr(2, 9),
        componentId: component.id,
        userName: user.name,
        userEmail: user.email,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      onReviewAdded(component.id, mockReview);
      setReviews(prev => [mockReview, ...prev]);
      setComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } finally {
      setSubmittingReview(false);
    }
  };

  // AI Datasheet Analyzer Submit Handler
  const handleAnalyzeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setAiAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      if (analyzerTab === 'upload' && selectedFile) {
        formData.append('datasheet', selectedFile);
      } else if (analyzerTab === 'text' && textToAnalyze) {
        formData.append('textInput', textToAnalyze);
      } else {
        formData.append('componentId', component.id);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData, // boundary added automatically
      });

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Analysis failed, loaded fallback', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      
      {/* Back button */}
      <div>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO COMPONENT CATALOG
        </Link>
      </div>

      {/* Grid: Image & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Visual card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-navy-card border border-navy-light rounded-2xl overflow-hidden aspect-video relative group shadow-xl">
            <img
              src={component.imageUrl}
              alt={component.title}
              className="w-full h-full object-cover opacity-90 group-hover:scale-102 transition-transform duration-300"
            />
            <span className="absolute top-4 left-4 bg-navy-dark/95 border border-navy-light text-emerald-accent text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {component.category}
            </span>
          </div>

          {/* Quick Specifications list */}
          <div className="bg-navy-card border border-navy-light p-5 rounded-2xl space-y-3">
            <h3 className="font-display text-xs font-bold uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
              <Table className="h-4 w-4 text-emerald-accent" /> Key Specifications Table
            </h3>
            <div className="overflow-x-auto rounded-xl border border-navy-light/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-navy-light/40 text-slate-300 font-semibold border-b border-navy-light">
                    <th className="p-3">Parameter Name</th>
                    <th className="p-3">Tested / Operational Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-light/40">
                  {component.specs.map((spec, index) => (
                    <tr key={index} className="hover:bg-navy-light/10 text-slate-300">
                      <td className="p-3 font-medium text-slate-400">{spec.label}</td>
                      <td className="p-3 font-mono text-emerald-accent">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Text Information & Technical Analyzer */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">{component.title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <div className="flex text-amber-400 items-center">
                <Star className="h-4.5 w-4.5 fill-current" />
                <span className="ml-1 font-bold font-mono text-white">{component.rating}</span>
              </div>
              <span className="text-slate-500">•</span>
              <span>Vetted Lab Entry</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono">ID: {component.id}</span>
            </div>
            
            <p className="text-sm font-semibold text-emerald-accent leading-relaxed">
              {component.description}
            </p>
            <div className="text-xs leading-relaxed text-slate-300 border-l-2 border-navy-light pl-4 py-1">
              {component.fullDescription}
            </div>
          </div>

          {/* AI FEATURE 1: DATASHEET ANALYZER */}
          <div className="bg-navy-card border border-navy-light rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-accent/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-accent animate-pulse" /> Gemini Datasheet Intelligence
              </h2>
              <span className="text-[10px] font-bold text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-2.5 py-0.5 rounded-full">
                AI Agent Enabled
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Query Google Gemini to instantly parse manufacturer datasheets. Generate Pin-Out maps, operational voltage charts, and recommended EEE lab application circuits.
            </p>

            {/* Analyzer Tabs */}
            <div className="flex gap-2 border-b border-navy-light pb-3">
              {[
                { id: 'quick', label: 'Preset Analysis', icon: Cpu },
                { id: 'upload', label: 'Upload Datasheet', icon: Upload },
                { id: 'text', label: 'Paste Spec Text', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setAnalyzerTab(tab.id as any);
                      setAnalysisResult(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      analyzerTab === tab.id
                        ? 'bg-emerald-accent text-navy-dark'
                        : 'bg-navy-dark text-slate-300 border border-navy-light/60 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content inputs */}
            {analyzerTab === 'quick' && (
              <div className="p-4 bg-navy-dark/40 border border-navy-light/40 rounded-xl space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Analyze the vetted, preloaded laboratory specifications for this **{component.title}** module using Google Gemini.
                </p>
                <button
                  onClick={() => handleAnalyzeSubmit()}
                  disabled={aiAnalyzing}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-accent hover:bg-emerald-hover disabled:bg-slate-700 text-navy-dark text-xs font-bold py-2.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiAnalyzing ? 'Extracting Parameters...' : 'Execute Preset Analysis'}
                </button>
              </div>
            )}

            {analyzerTab === 'upload' && (
              <form onSubmit={handleAnalyzeSubmit} className="space-y-3">
                <div className="border border-dashed border-navy-light rounded-xl p-6 text-center hover:border-emerald-accent/40 transition-colors relative bg-navy-dark/10">
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  {selectedFile ? (
                    <span className="text-xs text-emerald-accent font-semibold block truncate">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-300 block">Drag & drop datasheet file</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Supports PDF, TXT or DOC up to 5MB</span>
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={aiAnalyzing || !selectedFile}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-accent hover:bg-emerald-hover disabled:bg-slate-700 text-navy-dark text-xs font-bold py-2.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiAnalyzing ? 'Analyzing Document...' : 'Upload & Analyze Datasheet'}
                </button>
              </form>
            )}

            {analyzerTab === 'text' && (
              <form onSubmit={handleAnalyzeSubmit} className="space-y-3">
                <textarea
                  placeholder="Paste raw data sheets, thermal metrics, or electrical specifications block here..."
                  rows={4}
                  value={textToAnalyze}
                  onChange={(e) => setTextToAnalyze(e.target.value)}
                  className="w-full bg-navy-dark border border-navy-light text-xs rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={aiAnalyzing || !textToAnalyze.trim()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-accent hover:bg-emerald-hover disabled:bg-slate-700 text-navy-dark text-xs font-bold py-2.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiAnalyzing ? 'Analyzing Text...' : 'Analyze Copied Specifications'}
                </button>
              </form>
            )}

            {/* AI Loading Skeleton */}
            {aiAnalyzing && (
              <div className="space-y-4 p-4 border border-navy-light bg-navy-dark/60 rounded-xl animate-pulse">
                <div className="flex gap-2 items-center text-emerald-accent text-xs font-bold font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-accent animate-ping" />
                  Running Google Gemini 3.5 Flash Model...
                </div>
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-16 bg-slate-800 rounded" />
                <div className="h-10 bg-slate-800 rounded w-1/2" />
              </div>
            )}

            {/* AI Result UI */}
            {analysisResult && (
              <div className="p-5 border border-emerald-accent/20 bg-navy-dark/90 rounded-xl space-y-6 text-xs leading-relaxed max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-navy-light pb-3">
                  <div className="font-bold text-emerald-accent uppercase tracking-wider font-mono">
                    Analysis Report Extracted
                  </div>
                  {analysisResult.warning && (
                    <span className="text-[9px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Demo Fallback Loaded
                    </span>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <h4 className="font-bold font-display text-white">1. Functional Purpose Summary</h4>
                  <p className="text-slate-300 leading-relaxed">{analysisResult.summary}</p>
                </div>

                {/* Pin-out config */}
                <div className="space-y-2">
                  <h4 className="font-bold font-display text-white">2. Silicon Pin-Out Configurations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {analysisResult.pinout.map((pin, i) => (
                      <div key={i} className="bg-navy-card border border-navy-light p-2 rounded-lg flex gap-2 items-start">
                        <span className="font-mono font-bold text-emerald-accent bg-emerald-accent/5 px-1.5 py-0.5 rounded border border-emerald-accent/20">
                          {pin.pin}
                        </span>
                        <div>
                          <span className="block font-bold text-white text-[11px]">{pin.name}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{pin.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Physical/Electrical specs */}
                <div className="space-y-2">
                  <h4 className="font-bold font-display text-white">3. Core Electrical Specifications Table</h4>
                  <div className="overflow-x-auto rounded-lg border border-navy-light bg-navy-card">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-navy-light/40 text-slate-300 font-semibold border-b border-navy-light">
                          <th className="p-2">Measurement Parameter</th>
                          <th className="p-2">Extracted Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-light/30">
                        {analysisResult.specs.map((s, i) => (
                          <tr key={i} className="hover:bg-navy-light/10 text-slate-300">
                            <td className="p-2 text-slate-400">{s.label}</td>
                            <td className="p-2 font-mono text-emerald-accent">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Applications */}
                <div className="space-y-1.5">
                  <h4 className="font-bold font-display text-white">4. Core EEE Lab Applications</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {analysisResult.applications.map((app, i) => (
                      <li key={i}>{app}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Related Components */}
      {relatedComponents.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-navy-light/40">
          <h2 className="font-display text-lg font-bold text-white">Related {component.category} Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedComponents.map((c) => (
              <div key={c.id} className="bg-navy-card border border-navy-light rounded-xl overflow-hidden h-72 flex flex-col justify-between p-4 circuit-card-glow">
                <div className="h-28 overflow-hidden rounded-lg bg-slate-900 mb-3">
                  <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-xs font-bold text-white truncate">{c.title}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{c.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-navy-light/30 pt-3 mt-3">
                  <span className="text-[10px] text-emerald-accent font-bold">★ {c.rating}</span>
                  <Link to={`/component/${c.id}`} className="text-[10px] font-bold text-emerald-accent hover:underline">
                    View Specs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Reviews & Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-navy-light/40">
        
        {/* Left column: reviews list */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
            <MessageSquare className="h-5 w-5 text-emerald-accent" /> Verified Lab Reviews
          </h2>

          {reviewsLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-navy-card/60 border border-navy-light rounded-xl" />
              <div className="h-16 bg-navy-card/60 border border-navy-light rounded-xl" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-navy-card border border-navy-light p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{rev.userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">{rev.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-emerald-accent/5 px-2.5 py-1 rounded-lg border border-emerald-accent/20">
                      <span className="font-mono font-bold text-emerald-accent">{rev.rating}</span>
                      <Star className="h-3.5 w-3.5 fill-current text-emerald-accent" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                  <div className="text-[9px] text-slate-500 font-mono text-right">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-navy-card border border-navy-light rounded-xl p-8 text-center text-xs text-slate-400">
              No reviews have been written for this component yet. Be the first to share your lab notes!
            </div>
          )}
        </div>

        {/* Right column: submit review form */}
        <div className="lg:col-span-5 bg-navy-card border border-navy-light p-5 rounded-2xl space-y-4 h-fit">
          <h3 className="font-display text-xs font-bold uppercase text-slate-400 tracking-wide">
            Write Lab Note / Review
          </h3>

          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {reviewSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 p-3 rounded-lg font-bold">
                  <CheckCircle className="h-4.5 w-4.5" />
                  Lab note successfully posted!
                </div>
              )}

              {/* Rating selection */}
              <div className="space-y-2">
                <label className="text-slate-400 font-semibold block">Circuit Rating / Multiplier</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`h-9 w-9 rounded-lg border flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                        rating === star
                          ? 'bg-emerald-accent text-navy-dark border-emerald-accent'
                          : 'bg-navy-dark border-navy-light text-slate-300 hover:bg-navy-light/40'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment input */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Laboratory Comments / Observations</label>
                <textarea
                  required
                  placeholder="Share details on your hardware setup, feedback loops, operating voltages, or simulated outputs..."
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent text-xs rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-accent hover:bg-emerald-hover text-navy-dark py-2.5 font-bold shadow-lg shadow-emerald-accent/10 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                {submittingReview ? 'Submitting Lab Note...' : 'Submit Lab Note'}
              </button>
            </form>
          ) : (
            <div className="p-6 border border-dashed border-navy-light rounded-xl text-center space-y-4">
              <AlertCircle className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400 leading-relaxed">
                You must be logged in to submit a review or document laboratory observations for this component.
              </p>
              <Link
                to="/login"
                className="inline-block rounded-xl bg-emerald-accent px-4 py-2 text-xs font-bold text-navy-dark hover:bg-emerald-hover transition-colors"
              >
                Go to Sign-In
              </Link>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
