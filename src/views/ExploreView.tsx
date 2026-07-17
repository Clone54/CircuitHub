import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, Cpu, Filter, Calendar, Star, ArrowLeft } from 'lucide-react';
import { ComponentItem } from '../types';

interface ExploreViewProps {
  components: ComponentItem[];
}

export default function ExploreView({ components }: ExploreViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState('0'); // min rating
  const [selectedAge, setSelectedAge] = useState('All'); // added date range
  const [sortBy, setSortBy] = useState('newest'); // sorted by date
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(components.map((c) => c.category));
    return ['All', ...Array.from(list)];
  }, [components]);

  // Combined search, filtering, and sorting
  const processedComponents = useMemo(() => {
    let result = [...components];

    // Search term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Rating filter (minimum rating)
    const minRate = parseFloat(selectedRating);
    if (minRate > 0) {
      result = result.filter((c) => c.rating >= minRate);
    }

    // Age / Date added filter (e.g. within last 30 days, within last 6 months, or All)
    if (selectedAge !== 'All') {
      const now = new Date();
      result = result.filter((c) => {
        const addedDate = new Date(c.createdAt);
        const diffTime = Math.abs(now.getTime() - addedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (selectedAge === '30') {
          return diffDays <= 30;
        } else if (selectedAge === '180') {
          return diffDays <= 180;
        }
        return true;
      });
    }

    // Sorting
    if (sortBy === 'a-z') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'z-a') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [components, searchTerm, selectedCategory, selectedRating, selectedAge, sortBy]);

  // Paginated slices
  const totalPages = Math.ceil(processedComponents.length / itemsPerPage);
  const paginatedComponents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedComponents.slice(start, start + itemsPerPage);
  }, [processedComponents, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-navy-light pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">Engineering Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse fully vetted operational amplifiers, semiconductors, logic blocks, and timing controllers.
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald-accent bg-emerald-accent/10 px-3 py-1.5 rounded-lg border border-emerald-accent/20">
          Showing <span className="font-mono">{processedComponents.length}</span> of <span className="font-mono">{components.length}</span> components
        </div>
      </div>

      {/* Control Panel (Search, Filters, Sort) */}
      <div className="bg-navy-card border border-navy-light p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Search bar */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search components by name or details..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent text-xs rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category selection */}
          <div className="lg:col-span-3 relative flex items-center">
            <Filter className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent text-xs rounded-xl pl-10 pr-4 py-3 text-slate-300 focus:outline-none appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Selection */}
          <div className="lg:col-span-2 relative flex items-center">
            <Star className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent text-xs rounded-xl pl-10 pr-4 py-3 text-slate-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="0">All Ratings</option>
              <option value="4.8">4.8+ Stars</option>
              <option value="4.7">4.7+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </select>
          </div>

          {/* Date added Selection */}
          <div className="lg:col-span-2 relative flex items-center">
            <Calendar className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedAge}
              onChange={(e) => {
                setSelectedAge(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-navy-dark border border-navy-light focus:border-emerald-accent text-xs rounded-xl pl-10 pr-4 py-3 text-slate-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Any Time Added</option>
              <option value="30">Added last 30 Days</option>
              <option value="180">Added last 6 Months</option>
            </select>
          </div>

        </div>

        {/* Sorting options */}
        <div className="flex flex-wrap items-center justify-between border-t border-navy-light/40 pt-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-accent" />
            <span className="text-slate-400 font-semibold">Refine options:</span>
            <span className="text-slate-500 text-[11px]">Toggle filters above to isolate elements.</span>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Sort By:</span>
            <div className="flex gap-1">
              {[
                { val: 'newest', label: 'Newest' },
                { val: 'a-z', label: 'A-Z' },
                { val: 'rating', label: 'Highest Rating' }
              ].map((sortOption) => (
                <button
                  key={sortOption.val}
                  onClick={() => setSortBy(sortOption.val)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    sortBy === sortOption.val
                      ? 'bg-emerald-accent text-navy-dark'
                      : 'bg-navy-dark border border-navy-light text-slate-300 hover:text-white hover:bg-navy-light/40'
                  }`}
                >
                  {sortOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid listing (4 cards per row on desktop) */}
      {paginatedComponents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedComponents.map((comp) => {
            const formattedDate = new Date(comp.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={comp.id}
                className="rounded-2xl border border-navy-light bg-navy-card overflow-hidden flex flex-col justify-between h-[420px] circuit-card-glow shadow-md hover:shadow-emerald-accent/5"
              >
                {/* Header Image */}
                <div className="h-40 relative bg-slate-900 overflow-hidden shrink-0">
                  <img
                    src={comp.imageUrl}
                    alt={comp.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <span className="absolute top-3 left-3 bg-navy-dark/95 border border-navy-light text-emerald-accent text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {comp.category}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-2">
                    <h2 className="font-display text-sm font-bold text-white line-clamp-1" title={comp.title}>
                      {comp.title}
                    </h2>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {comp.description}
                    </p>
                  </div>

                  {/* Metadata and View Details */}
                  <div className="space-y-4 mt-4 pt-3 border-t border-navy-light/40 shrink-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-accent font-bold font-mono">★</span>
                        <span className="font-bold text-slate-200">{comp.rating}</span>
                      </div>
                      <div className="font-mono text-slate-500">
                        {formattedDate}
                      </div>
                    </div>

                    <Link
                      to={`/component/${comp.id}`}
                      className="block w-full text-center rounded-xl bg-navy-light/40 hover:bg-emerald-accent hover:text-navy-dark border border-navy-light/60 py-2.5 text-xs font-bold text-emerald-accent transition-all cursor-pointer"
                    >
                      View Full Specifications
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-navy-card border border-navy-light rounded-2xl p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-navy-light/40 text-slate-500">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-white">No Matching Components Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your category filter, rating filter, or search query to find relevant electronic chips or circuits.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedRating('0');
              setSelectedAge('All');
              setSortBy('newest');
            }}
            className="text-xs font-semibold text-emerald-accent hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-lg bg-navy-card border border-navy-light text-slate-300 text-xs font-semibold hover:bg-navy-light/40 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            ← Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-emerald-accent text-navy-dark'
                  : 'bg-navy-card border border-navy-light text-slate-300 hover:bg-navy-light/40'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-lg bg-navy-card border border-navy-light text-slate-300 text-xs font-semibold hover:bg-navy-light/40 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
