import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Eye, Trash2, Cpu, Plus, AlertCircle, Info, Star, CheckCircle, ArrowLeft } from 'lucide-react';
import { User, ComponentItem } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

interface ManageViewProps {
  user: User | null;
  components: ComponentItem[];
  onComponentDeleted: (id: string) => void;
}

export default function ManageView({ user, components, onComponentDeleted }: ManageViewProps) {
  const navigate = useNavigate();

  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Filter components added by current user
  const userComponents = components.filter(c => c.creatorId === user?.id);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('Are you absolutely sure you want to delete this custom component specification? This action is irreversible.')) return;

    setDeletingId(id);
    setDeleteError('');

    try {
      await deleteDoc(doc(db, 'components', id));
      onComponentDeleted(id);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `components/${id}`);
    } finally {
      setDeletingId(null);
    }
  };


  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[80vh]">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy-light pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-emerald-accent" /> Developer Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your custom published semiconductors, silicon chips, and university lab modules.
          </p>
        </div>
        <Link
          to="/items/add"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-accent px-4 py-2.5 text-xs font-bold text-navy-dark hover:bg-emerald-hover transition-colors shadow-lg shadow-emerald-accent/10"
        >
          <Plus className="h-4 w-4" /> Add Component Spec
        </Link>
      </div>

      {deleteSuccess && (
        <div className="flex items-center gap-2 text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 p-4 rounded-xl text-xs font-semibold">
          <CheckCircle className="h-4.5 w-4.5" />
          Component and reviews successfully deleted from catalog.
        </div>
      )}

      {deleteError && (
        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 p-4 rounded-xl text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* User Uploads Data Table */}
      <div className="bg-navy-card border border-navy-light rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-navy-light bg-navy-light/20">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
            My Custom Component Publications
          </h3>
        </div>

        {userComponents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-navy-light/40 text-slate-300 font-bold border-b border-navy-light">
                  <th className="p-4">Component Image & Name</th>
                  <th className="p-4">Classification Category</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-light/30">
                {userComponents.map((comp) => {
                  const formattedDate = new Date(comp.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={comp.id} className="hover:bg-navy-light/10 text-slate-300">
                      
                      {/* Name & Image */}
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={comp.imageUrl}
                          alt={comp.title}
                          className="h-10 w-10 rounded-lg object-cover bg-slate-900 border border-navy-light"
                        />
                        <div>
                          <span className="font-bold text-white block truncate max-w-[200px]">{comp.title}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">{comp.description}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="bg-navy-dark text-emerald-accent border border-navy-light px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                          {comp.category}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="p-4 font-mono font-bold text-slate-200">
                        <span className="text-amber-400 mr-0.5">★</span> {comp.rating}
                      </td>

                      {/* Date */}
                      <td className="p-4 font-mono text-slate-400">
                        {formattedDate}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/component/${comp.id}`}
                            className="p-2 text-slate-400 hover:text-emerald-accent bg-navy-dark hover:bg-emerald-accent/10 border border-navy-light hover:border-emerald-accent/20 rounded-xl transition-all"
                            title="View Public Specification"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(comp.id)}
                            disabled={deletingId === comp.id}
                            className="p-2 text-slate-400 hover:text-red-400 bg-navy-dark hover:bg-red-400/10 border border-navy-light hover:border-red-400/20 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                            title="Delete Component"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-navy-light/40 text-slate-500">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-white">No Custom Components Added Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              You haven't uploaded or published any electronic components. Add your first hardware specifications to see them listed on your dashboard!
            </p>
            <Link
              to="/items/add"
              className="inline-flex items-center gap-1 bg-emerald-accent hover:bg-emerald-hover text-navy-dark text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg"
            >
              <Plus className="h-4 w-4" /> Create First Entry
            </Link>
          </div>
        )}
      </div>

      {/* Lab Tips/Information block */}
      <div className="bg-navy-light/20 border border-navy-light rounded-2xl p-5 space-y-3 flex items-start gap-3">
        <Info className="h-5 w-5 text-emerald-accent shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-400 space-y-1">
          <span className="font-bold text-white block">A Note on Custom Component Maintenance:</span>
          <span>Any circuits or components you specify here will be instantly accessible to the rest of the public catalog on the Explore page. Make sure values in the specifications tables are accurate according to manufacturer documentation for effective student references.</span>
        </div>
      </div>

    </div>
  );
}
