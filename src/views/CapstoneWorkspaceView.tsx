import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Clipboard,
  Check,
  Calendar,
  AlertCircle,
  FileDown,
  BookOpen,
  Eye,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ThesisChapter } from '../types';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function CapstoneWorkspaceView() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ThesisChapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingChapter, setEditingChapter] = useState<ThesisChapter | null>(null);
  const [title, setTitle] = useState<string>('');
  const [bullets, setBullets] = useState<string>('');
  const [status, setStatus] = useState<'Draft' | 'In Review' | 'Completed'>('Draft');
  const [draftContent, setDraftContent] = useState<string>('');
  
  // AI Generator state
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<string>('');
  
  // Copy to clipboard notification
  const [copied, setCopied] = useState<boolean>(false);
  
  // View/Preview active chapter
  const [activeChapter, setActiveChapter] = useState<ThesisChapter | null>(null);

  // Fetch chapters belonging to user
  const fetchChapters = async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      const q = query(collection(db, 'thesisChapters'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const data: ThesisChapter[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ThesisChapter);
      });
      // Sort by createdAt locally since we don't have an index yet
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setChapters(data);
    } catch (err: any) {
      console.error("Save Error:", err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  const handleOpenAddModal = () => {
    setEditingChapter(null);
    setTitle('');
    setBullets('');
    setStatus('Draft');
    setDraftContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (chapter: ThesisChapter) => {
    setEditingChapter(chapter);
    setTitle(chapter.title);
    setBullets(chapter.bullets);
    setStatus(chapter.status);
    setDraftContent(chapter.draftContent || '');
    setIsModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return navigate('/login');

    setIsSaving(true);
    const chapterData = {
      title,
      bullets,
      status,
      draftContent,
      userId,
    };

    try {
      let savedId = editingChapter?.id;
      if (editingChapter) {
        await updateDoc(doc(db, 'thesisChapters', editingChapter.id), chapterData);
      } else {
        const docRef = await addDoc(collection(db, 'thesisChapters'), {
          ...chapterData,
          createdAt: new Date().toISOString()
        });
        savedId = docRef.id;
      }
      setIsModalOpen(false);
      fetchChapters();
      
      if (activeChapter?.id === savedId) {
        setActiveChapter({ id: savedId!, ...chapterData, createdAt: activeChapter.createdAt || new Date().toISOString() } as ThesisChapter);
      }
    } catch (err) {
      console.error("Save Error:", err);
      setError('Error communicating with server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChapter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return navigate('/login');

    try {
      await deleteDoc(doc(db, 'thesisChapters', id));
      fetchChapters();
      if (activeChapter?.id === id) {
        setActiveChapter(null);
      }
    } catch (err) {
      console.error("Save Error:", err);
      setError('Error communicating with server.');
    }
  };

  // Agentic LLM Draft Generation
  const handleGenerateDraft = async () => {
    if (!title.trim() || !bullets.trim()) {
      alert('Please enter a Chapter Title and Key Bullet Points first to guide the academic AI writer.');
      return;
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) return navigate('/login');

    setAiGenerating(true);
    setAiProgress('CONSULTING ACADEMIC SUPERVISOR...');
    
    // Simulate thinking steps
    const steps = [
      'STRUCTURING THESIS OUTLINE...',
      'FORMULATING ENVELOPE DESIGN EQUATIONS...',
      'DRAFTING ACADEMIC FORMAL TEXT...',
      'POLISHING CITATIONS & VERIFYING GREEK CONSTANTS...'
    ];

    let stepIdx = 0;
    const timer = setInterval(() => {
      if (stepIdx < steps.length) {
        setAiProgress(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      const response = await fetch('/api/thesis-chapters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, bullets })
      });

      clearInterval(timer);

      if (response.ok) {
        const data = await response.json();
        setDraftContent(data.draft);
        setAiProgress('SUCCESSFULLY DRAFTED!');
      } else {
        setError('Draft generation failed. Please try again.');
      }
    } catch (err) {
      setError('Draft generation failed due to connection error.');
      clearInterval(timer);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = (chapter: ThesisChapter) => {
    const element = document.createElement("a");
    const file = new Blob([`# ${chapter.title}\n\n${chapter.draftContent}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${chapter.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_draft.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Group chapters by status for Kanban-style display
  const lanes = {
    Draft: chapters.filter(c => c.status === 'Draft'),
    'In Review': chapters.filter(c => c.status === 'In Review'),
    Completed: chapters.filter(c => c.status === 'Completed')
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[85vh]">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-navy-light pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-3 py-1 rounded-full">
            <BookOpen className="h-3 w-3" /> EEE 4002: CAPSTONE PROJECT DESIGN II
          </div>
          <h1 id="thesis-workspace-title" className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Thesis Workspace & AI Thesis Writer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Design and organize your thesis chapters. Use our agentic AI supervisor to generate well-structured, formal academic chapter drafts.
          </p>
        </div>
        <button
          id="btn-add-chapter"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-accent hover:bg-emerald-accent/90 text-navy-dark text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-emerald-accent/10"
        >
          <Plus className="h-4 w-4 stroke-[3]" /> Add Thesis Chapter
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 animate-spin flex">
            <RefreshCw className="h-5 w-5 text-emerald-accent" />
          </div>
          <div className="text-xs font-mono text-emerald-accent animate-pulse tracking-widest">
            LOADING THESIS DATABASE...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Kanban Board - Span 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Lane: Draft */}
              <div id="lane-draft" className="bg-navy-dark/40 rounded-2xl border border-navy-light/60 p-4 flex flex-col h-[70vh]">
                <div className="flex items-center justify-between border-b border-navy-light pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <h3 className="font-display font-bold text-sm text-white">Draft</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-navy-light px-2 py-0.5 rounded-md">
                    {lanes.Draft.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {lanes.Draft.length === 0 ? (
                    <div className="h-32 rounded-xl border border-dashed border-navy-light flex flex-col items-center justify-center text-center p-4">
                      <p className="text-[11px] text-slate-500">No chapters in Draft</p>
                    </div>
                  ) : (
                    lanes.Draft.map(chapter => (
                      <div
                        key={chapter.id}
                        id={`chapter-${chapter.id}`}
                        onClick={() => setActiveChapter(chapter)}
                        className={`group p-4 bg-navy-card hover:bg-navy-light/40 border transition-all rounded-xl cursor-pointer text-left ${activeChapter?.id === chapter.id ? 'border-emerald-accent' : 'border-navy-light'}`}
                      >
                        <h4 className="font-display font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-emerald-accent transition-colors">
                          {chapter.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                          {chapter.bullets || 'No guiding outline provided.'}
                        </p>
                        <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500 border-t border-navy-light/50 pt-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {new Date(chapter.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(chapter); }}
                              className="p-1 hover:text-white rounded hover:bg-navy-light"
                              title="Edit chapter specs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChapter(chapter.id, e)}
                              className="p-1 hover:text-rose-400 rounded hover:bg-navy-light"
                              title="Delete chapter"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lane: In Review */}
              <div id="lane-in-review" className="bg-navy-dark/40 rounded-2xl border border-navy-light/60 p-4 flex flex-col h-[70vh]">
                <div className="flex items-center justify-between border-b border-navy-light pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <h3 className="font-display font-bold text-sm text-white">In Review</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-navy-light px-2 py-0.5 rounded-md">
                    {lanes['In Review'].length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {lanes['In Review'].length === 0 ? (
                    <div className="h-32 rounded-xl border border-dashed border-navy-light flex flex-col items-center justify-center text-center p-4">
                      <p className="text-[11px] text-slate-500">No chapters in Review</p>
                    </div>
                  ) : (
                    lanes['In Review'].map(chapter => (
                      <div
                        key={chapter.id}
                        id={`chapter-${chapter.id}`}
                        onClick={() => setActiveChapter(chapter)}
                        className={`group p-4 bg-navy-card hover:bg-navy-light/40 border transition-all rounded-xl cursor-pointer text-left ${activeChapter?.id === chapter.id ? 'border-emerald-accent' : 'border-navy-light'}`}
                      >
                        <h4 className="font-display font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-emerald-accent transition-colors">
                          {chapter.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                          {chapter.bullets || 'No guiding outline provided.'}
                        </p>
                        <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500 border-t border-navy-light/50 pt-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {new Date(chapter.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(chapter); }}
                              className="p-1 hover:text-white rounded hover:bg-navy-light"
                              title="Edit chapter specs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChapter(chapter.id, e)}
                              className="p-1 hover:text-rose-400 rounded hover:bg-navy-light"
                              title="Delete chapter"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lane: Completed */}
              <div id="lane-completed" className="bg-navy-dark/40 rounded-2xl border border-navy-light/60 p-4 flex flex-col h-[70vh]">
                <div className="flex items-center justify-between border-b border-navy-light pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-accent animate-pulse" />
                    <h3 className="font-display font-bold text-sm text-white">Completed</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-navy-light px-2 py-0.5 rounded-md">
                    {lanes.Completed.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {lanes.Completed.length === 0 ? (
                    <div className="h-32 rounded-xl border border-dashed border-navy-light flex flex-col items-center justify-center text-center p-4">
                      <p className="text-[11px] text-slate-500">No chapters completed yet</p>
                    </div>
                  ) : (
                    lanes.Completed.map(chapter => (
                      <div
                        key={chapter.id}
                        id={`chapter-${chapter.id}`}
                        onClick={() => setActiveChapter(chapter)}
                        className={`group p-4 bg-navy-card hover:bg-navy-light/40 border transition-all rounded-xl cursor-pointer text-left ${activeChapter?.id === chapter.id ? 'border-emerald-accent' : 'border-navy-light'}`}
                      >
                        <h4 className="font-display font-semibold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-emerald-accent transition-colors">
                          {chapter.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                          {chapter.bullets || 'No guiding outline provided.'}
                        </p>
                        <div className="flex items-center justify-between mt-4 text-[10px] text-slate-500 border-t border-navy-light/50 pt-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {new Date(chapter.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditModal(chapter); }}
                              className="p-1 hover:text-white rounded hover:bg-navy-light"
                              title="Edit chapter specs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChapter(chapter.id, e)}
                              className="p-1 hover:text-rose-400 rounded hover:bg-navy-light"
                              title="Delete chapter"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Active Chapter Draft Review & AI Generation Hub - Span 1 Column */}
          <div className="lg:col-span-1">
            {activeChapter ? (
              <div id="active-chapter-panel" className="bg-navy-card border border-navy-light rounded-2xl p-6 space-y-6 flex flex-col h-[70vh]">
                <div className="flex items-start justify-between border-b border-navy-light pb-4 shrink-0">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-white line-clamp-1">{activeChapter.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        activeChapter.status === 'Completed' ? 'bg-emerald-accent/10 border border-emerald-accent/20 text-emerald-accent' :
                        activeChapter.status === 'In Review' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' :
                        'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                      }`}>
                        {activeChapter.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(activeChapter.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveChapter(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-light rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Chapter Guidelines</h4>
                    <p className="text-xs text-slate-300 bg-navy-dark/40 border border-navy-light/60 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {activeChapter.bullets || 'No outlines provided for this chapter.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Chapter Academic Draft</h4>
                      {activeChapter.draftContent && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyDraft(activeChapter.draftContent)}
                            className="p-1.5 text-slate-400 hover:text-emerald-accent hover:bg-navy-light rounded transition-all"
                            title="Copy draft to clipboard"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-accent" /> : <Clipboard className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDownloadMarkdown(activeChapter)}
                            className="p-1.5 text-slate-400 hover:text-emerald-accent hover:bg-navy-light rounded transition-all"
                            title="Download Markdown file"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {activeChapter.draftContent ? (
                      <div className="markdown-body text-xs sm:text-sm text-slate-300 leading-relaxed bg-navy-dark/30 border border-navy-light/40 p-4 rounded-xl max-h-[40vh] overflow-y-auto">
                        <ReactMarkdown>{activeChapter.draftContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-10 px-4 bg-navy-dark/40 rounded-xl border border-dashed border-navy-light/60">
                        <Sparkles className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 leading-relaxed">
                          No chapter draft has been generated yet. Open the chapter settings or generate an academic draft immediately.
                        </p>
                        <button
                          onClick={() => handleOpenEditModal(activeChapter)}
                          className="mt-4 px-3.5 py-1.5 rounded-lg bg-emerald-accent/10 border border-emerald-accent/20 hover:bg-emerald-accent/20 text-emerald-accent text-xs font-bold transition-all"
                        >
                          Generate Chapter Draft
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pt-4 border-t border-navy-light flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleOpenEditModal(activeChapter)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-navy-light hover:bg-navy-light text-white text-xs font-bold transition-all"
                  >
                    <Edit className="h-4 w-4" /> Edit Specs
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-navy-dark/40 border border-navy-light/60 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center h-[70vh] text-slate-500">
                <FileText className="h-12 w-12 text-slate-600 mb-3" />
                <h3 className="font-display font-semibold text-white text-sm">Select a Chapter</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5">
                  Select any thesis chapter from your Kanban board lanes to view guidelines, manage details, and write academic drafts.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add / Edit Chapter & AI Writer Modal */}
      {isModalOpen && (
        <div id="modal-chapter-composer" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-sm">
          <div className="bg-navy-card border border-navy-light/80 rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl animate-fade-in text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-navy-light p-5 shrink-0">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-accent" />
                {editingChapter ? 'Configure Chapter' : 'Add New Thesis Chapter'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-light rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveChapter} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                
                {/* Chapter Title */}
                <div className="md:col-span-2 space-y-1.5">
                  <label htmlFor="input-title" className="text-xs font-mono font-bold text-slate-400">CHAPTER TITLE</label>
                  <input
                    id="input-title"
                    type="text"
                    required
                    placeholder="e.g., Chapter 3: Proposed Multi-Phase Buck Converter Architecture"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-navy-dark/60 border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                {/* Status Selector */}
                <div className="md:col-span-1 space-y-1.5">
                  <label htmlFor="select-status" className="text-xs font-mono font-bold text-slate-400">WORKFLOW STATUS</label>
                  <select
                    id="select-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-navy-dark/60 border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs sm:text-sm text-white outline-none transition-colors"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

              </div>

              {/* Guiding Outline / Bullets */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex justify-between items-center">
                  <label htmlFor="textarea-bullets" className="text-xs font-mono font-bold text-slate-400">GUIDING OUTLINE / CORE CONCEPTS</label>
                  <span className="text-[10px] text-slate-500">Provide bullet points or keywords for the AI writer</span>
                </div>
                <textarea
                  id="textarea-bullets"
                  rows={4}
                  required
                  placeholder="Describe what this chapter should contain. E.g.:&#10;- Introduction to multi-phase switching topology.&#10;- Derivation of peak current balance equations for N phases.&#10;- Highlighting thermal dissipation benefits and duty cycle controls.&#10;- Experimental ripple reduction measurements."
                  value={bullets}
                  onChange={(e) => setBullets(e.target.value)}
                  className="w-full px-4 py-3 bg-navy-dark/60 border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Generated Content Draft */}
              <div className="space-y-2 flex-1 flex flex-col min-h-[25vh]">
                <div className="flex items-center justify-between shrink-0">
                  <label htmlFor="textarea-draft" className="text-xs font-mono font-bold text-slate-400">ACADEMIC TEXT DRAFT (MARKDOWN)</label>
                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={handleGenerateDraft}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-accent text-navy-dark text-[11px] font-extrabold hover:bg-emerald-accent/90 transition-all shadow-md shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiGenerating ? 'Generating...' : 'Generate Chapter Draft'}
                  </button>
                </div>

                {aiGenerating ? (
                  <div className="flex-1 bg-navy-dark/40 border border-navy-light rounded-xl flex flex-col items-center justify-center p-6 text-center animate-pulse">
                    <div className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20 animate-spin flex mb-3">
                      <RefreshCw className="h-4 w-4 text-emerald-accent" />
                    </div>
                    <div className="text-[11px] font-mono text-emerald-accent tracking-widest uppercase">
                      {aiProgress}
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-sm mt-1.5">
                      The academic supervisor is crafting a formal thesis section featuring professional equations and clean markdown.
                    </p>
                  </div>
                ) : (
                  <textarea
                    id="textarea-draft"
                    placeholder="The AI-generated academic thesis chapter draft will appear here. You can also manually write, edit, or adjust this text using standard markdown formatting."
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="flex-1 w-full px-4 py-3 bg-navy-dark/60 border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors font-sans resize-none leading-relaxed min-h-[20vh]"
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-navy-light pt-5 shrink-0 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-navy-light hover:bg-navy-light text-white text-xs sm:text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-accent text-navy-dark hover:bg-emerald-accent/90 text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-emerald-accent/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 mr-2 rounded-full border-2 border-navy-dark border-t-transparent animate-spin" />
                      Saving...
                    </>
                  ) : editingChapter ? 'Save Changes' : 'Create Chapter'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
