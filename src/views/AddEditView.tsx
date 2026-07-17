import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Plus, Trash2, Sparkles, CheckCircle, AlertCircle, Save, ArrowLeft, Upload, Image } from 'lucide-react';
import { User, ComponentItem, Specification } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AddEditViewProps {
  user: User | null;
  onComponentAdded: (component: ComponentItem) => void;
}

export default function AddEditView({ user, onComponentAdded }: AddEditViewProps) {
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [category, setCategory] = useState('Analog IC');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  
  // Custom specs table list
  const [specs, setSpecs] = useState<Specification[]>([
    { label: 'Supply Voltage', value: '5V to 15V' },
    { label: 'Operating Temp', value: '0°C to 70°C' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle Image Upload on ImgBB
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setImageError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('https://api.imgbb.com/1/upload?key=e7f860f5b9e419ebe8f598701dbcae91', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error('ImgBB response failed');
      }
      const data = await res.json();
      if (data && data.data && data.data.url) {
        setImageUrl(data.data.url);
      } else {
        throw new Error('Invalid upload structure');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setImageError('Failed to upload image. Please check your network and try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Auto-fill specification templates based on chosen category for a highly polished experience
  useEffect(() => {
    if (category === 'Analog IC') {
      setSpecs([
        { label: 'Supply Voltage Range', value: '±5V to ±15V' },
        { label: 'Gain Bandwidth Product', value: '10 MHz' },
        { label: 'Slew Rate', value: '9 V/μs' },
        { label: 'Input Bias Current', value: '50 nA' }
      ]);
    } else if (category === 'Mixed-Signal IC') {
      setSpecs([
        { label: 'Supply Voltage Range', value: '4.5V to 16V' },
        { label: 'Maximum Frequency', value: '500 kHz' },
        { label: 'Output Current Cap', value: '200 mA' }
      ]);
    } else if (category === 'Discrete Semiconductor') {
      setSpecs([
        { label: 'Drain-to-Source Voltage', value: '100 V' },
        { label: 'Continuous Drain Current', value: '30 A' },
        { label: 'On-Resistance Rds(on)', value: '45 mΩ' }
      ]);
    } else if (category === 'Power Management') {
      setSpecs([
        { label: 'Output Fixed Voltage', value: '5.0 V' },
        { label: 'Max Input Voltage', value: '35 V' },
        { label: 'Output Current Cap', value: '1.5 A' }
      ]);
    } else {
      setSpecs([
        { label: 'Supply Voltage', value: '5.0 V' },
        { label: 'Operating Temp', value: '0°C to 70°C' }
      ]);
    }
  }, [category]);

  const handleAddSpecRow = () => {
    setSpecs(prev => [...prev, { label: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', val: string) => {
    setSpecs(prev => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!title || !description || !fullDescription) {
      setError('Please fill out the Title, Summary, and Technical Description fields.');
      return;
    }

    if (uploadingImage) {
      setError('Please wait for the image upload to complete.');
      return;
    }

    // Clean empty specification rows
    const cleanedSpecs = specs.filter(s => s.label.trim() !== '' && s.value.trim() !== '');

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        fullDescription,
        category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
        specs: cleanedSpecs,
        rating: 5.0,
        creatorId: user?.id || 'system',
        createdAt: new Date().toISOString()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'components'), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'components');
        return;
      }
      const newComp: ComponentItem = {
        id: docRef.id,
        ...payload
      };

      onComponentAdded(newComp);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/component/${newComp.id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit component spec sheet to Firebase');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[80vh]">
      {/* Back button */}
      <div>
        <Link
          to="/items/manage"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO MANAGE PANEL
        </Link>
      </div>

      {/* Title */}
      <div className="border-b border-navy-light pb-6">
        <h1 className="font-display text-3xl font-extrabold text-white">Add New Component Spec</h1>
        <p className="text-xs text-slate-400 mt-1">
          Publish a new circuit module, discrete semiconductor, or silicon chip to the public catalog.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 p-4 rounded-xl text-sm font-bold">
          <CheckCircle className="h-5 w-5" />
          Component successfully registered! Redirecting to specifications page...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 text-red-400 bg-red-400/10 border border-red-400/20 p-4 rounded-xl text-xs font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form card */}
      <div className="bg-navy-card border border-navy-light p-6 sm:p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Component Name / Title</label>
              <input
                type="text"
                required
                placeholder="e.g. LM324 Quad Operational Amplifier"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">Silicon Classification Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-4 py-3 text-slate-300 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Analog IC">Analog IC (Operational Amplifier, Multiplier)</option>
                <option value="Mixed-Signal IC">Mixed-Signal IC (Precision Timer, PLL)</option>
                <option value="Discrete Semiconductor">Discrete Semiconductor (MOSFET, BJT, Diode)</option>
                <option value="Power Management">Power Management (Linear Regulator, Buck Converter)</option>
                <option value="Digital IC">Digital IC (MCU, FPGA, Gate Logic)</option>
              </select>
            </div>

          </div>

          {/* Short description */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Short Summary (Featured in Card grids)</label>
            <input
              type="text"
              required
              placeholder="e.g. Industry-standard low-power quad operational amplifier featuring direct voltage sensing."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Full description */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">Full Technical Overview / Engineering Description</label>
            <textarea
              required
              placeholder="Provide a detailed operational description. Explain typical biasing techniques, open-loop gain characteristics, feedback architectures, and expected frequency response in active filters..."
              rows={5}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Image Drag-and-Drop / Upload Button */}
          <div className="space-y-2">
            <label className="text-slate-400 font-semibold block">Component Graphic / Photo Upload</label>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Left/Main upload zone */}
              <div className="flex-1 w-full border border-dashed border-navy-light rounded-xl p-6 text-center hover:border-emerald-accent/50 transition-colors relative bg-navy-dark/10 cursor-pointer text-slate-300">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                {uploadingImage ? (
                  <span className="text-xs text-emerald-accent font-semibold animate-pulse block">
                    Uploading semiconductor graphic to ImgBB...
                  </span>
                ) : imageUrl ? (
                  <span className="text-xs text-emerald-accent font-semibold block truncate">
                    ✓ Image successfully uploaded!
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-slate-300 block">Click or Drag Image here</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">High-quality component photo (JPEG, PNG)</span>
                  </>
                )}
              </div>

              {/* Right preview thumbnail */}
              {imageUrl && (
                <div className="h-24 w-32 border border-navy-light rounded-xl overflow-hidden bg-navy-dark relative shrink-0">
                  <img
                    src={imageUrl}
                    alt="Uploaded thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white bg-emerald-accent/95 px-1.5 py-0.5 rounded uppercase tracking-wider text-navy-dark">
                      Preview
                    </span>
                  </div>
                </div>
              )}
            </div>

            {imageError && (
              <span className="text-[10px] text-red-400 block font-semibold">{imageError}</span>
            )}
            {!imageUrl && !uploadingImage && (
              <span className="text-[10px] text-slate-500 block">Upload a custom image, or we will automatically supply a beautiful semiconductor placeholder graphic.</span>
            )}
          </div>

          {/* Key specs table builder */}
          <div className="space-y-4 pt-4 border-t border-navy-light/40">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-white">Specifications Table Builder</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Parameters are auto-templated. Feel free to modify labels and specify real physical values.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="flex items-center gap-1 bg-emerald-accent/10 hover:bg-emerald-accent/20 border border-emerald-accent/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-emerald-accent cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Custom Parameter
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {specs.map((spec, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Parameter (e.g. Slew Rate)"
                    value={spec.label}
                    onChange={(e) => handleSpecChange(index, 'label', e.target.value)}
                    className="flex-1 bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Value (e.g. 0.5 V/us)"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    className="flex-1 bg-navy-dark border border-navy-light focus:border-emerald-accent rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecRow(index)}
                    className="p-2 text-slate-500 hover:text-red-400 bg-navy-dark hover:bg-red-400/10 border border-navy-light hover:border-red-400/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-accent hover:bg-emerald-hover disabled:bg-slate-700 text-navy-dark py-3 font-bold shadow-lg shadow-emerald-accent/15 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Registering Silicon specs...' : 'Publish Specifications Sheet'}
          </button>

        </form>
      </div>

    </div>
  );
}
