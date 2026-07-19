import { Link } from 'react-router-dom';
import { Cpu, Github, Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-navy-light bg-[#080B13] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20">
                <Cpu className="h-4.5 w-4.5 text-emerald-accent" />
              </div>
              <span className="font-display text-base font-bold tracking-tight text-white">
                Circuit<span className="text-emerald-accent">Hub</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              An intelligent, production-grade learning hub and tool suite designed for electronics engineers, circuit designers, and EEE-2104 university scholars.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-1.5 rounded bg-navy-light/40 hover:text-emerald-accent hover:bg-navy-light/80 transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-1.5 rounded bg-navy-light/40 hover:text-emerald-accent hover:bg-navy-light/80 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-1.5 rounded bg-navy-light/40 hover:text-emerald-accent hover:bg-navy-light/80 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Directory Links */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Explore
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/explore" className="hover:text-emerald-accent transition-colors">Components Catalog</Link>
              </li>
              <li>
                <Link to="/explore?category=Analog%20IC" className="hover:text-emerald-accent transition-colors">Analog Op-Amps</Link>
              </li>
              <li>
                <Link to="/explore?category=Mixed-Signal%20IC" className="hover:text-emerald-accent transition-colors">555 Timers</Link>
              </li>
              <li>
                <Link to="/explore?category=Power%20Management" className="hover:text-emerald-accent transition-colors">Power Regulators</Link>
              </li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h3 className="font-display text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-emerald-accent transition-colors">About Mission</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-accent transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-accent transition-colors">Social Sign-In</Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-accent transition-colors">Frequently Asked Questions</a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 text-xs">
            <h3 className="font-display text-sm font-semibold text-white tracking-wider uppercase mb-2">
              Technical Support
            </h3>
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-emerald-accent" />
              <span className="truncate">firozahmedskt1@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-emerald-accent" />
              <span>+1 (555) 019-2104</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-emerald-accent" />
              <span>EEE Engineering Dept, Labs Block B</span>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="border-t border-navy-light mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} CircuitHub. All simulation and specification files are verified for research use.
          </p>
          <div className="font-display font-semibold text-emerald-accent bg-emerald-accent/5 border border-emerald-accent/20 px-3 py-1 rounded-full">
            Developed by Firoz Ahmed
          </div>
        </div>
      </div>
    </footer>
  );
}
