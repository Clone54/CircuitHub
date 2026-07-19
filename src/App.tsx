import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatAssistant from './components/ChatAssistant';
import HomeView from './views/HomeView';
import ExploreView from './views/ExploreView';
import DetailsView from './views/DetailsView';
import LoginView from './views/LoginView';
import AddEditView from './views/AddEditView';
import ManageView from './views/ManageView';
import AboutView from './views/AboutView';
import ContactView from './views/ContactView';
import ToolsView from './views/ToolsView';
import AITutor from './views/AITutor';
import AdvancedToolsView from './views/AdvancedToolsView';
import HardwareAIView from './views/HardwareAIView';
import CoreToolsLayout from './views/CoreToolsLayout';
import ProSimulatorsView from './views/ProSimulatorsView';
import ResearchAssistantView from './views/ResearchAssistantView';
import CapstoneHubView from './views/CapstoneHubView';
import CapstoneWorkspaceView from './views/CapstoneWorkspaceView';
import ServicesDesignView from './views/ServicesDesignView';
import EmbeddedToolsView from './views/EmbeddedToolsView';
import PowerEconomicsView from './views/PowerEconomicsView';
import ProtectionToolsView from './views/ProtectionToolsView';
import MicrowaveToolsView from './views/MicrowaveToolsView';
import RenewableToolsView from './views/RenewableToolsView';
import CommToolsView from './views/CommToolsView';
import MLEngineeringView from './views/MLEngineeringView';
import IoTDashboardView from './views/IoTDashboardView';
import BiomedicalAnalyzerView from './views/BiomedicalAnalyzerView';
import TelecomRadarView from './views/TelecomRadarView';
import PowerOperationsView from './views/PowerOperationsView';
import RoboticsHubView from './views/RoboticsHubView';
import CircuitToolsView from './views/CircuitToolsView';
import AdvancedCircuitToolsView from './views/AdvancedCircuitToolsView';
import ElectronicsIToolsView from './views/ElectronicsIToolsView';
import ElectronicsIIToolsView from './views/ElectronicsIIToolsView';
import MaterialToolsView from './views/MaterialToolsView';
import EMToolsView from './views/EMToolsView';
import DigitalToolsView from './views/DigitalToolsView';
import LinearSystemsView from './views/LinearSystemsView';
import MachineToolsView from './views/MachineToolsView';
import ACMachinesView from './views/ACMachinesView';
import MachineDrivesView from './views/MachineDrivesView';
import IIoTToolsView from './views/IIoTToolsView';
import ComputationalToolsView from './views/ComputationalToolsView';
import MeasurementToolsView from './views/MeasurementToolsView';
import VLSIToolsView from './views/VLSIToolsView';
import HardwareShopView from './views/HardwareShopView';
import ControlToolsView from './views/ControlToolsView';
import IndustrialAutomationView from './views/IndustrialAutomationView';
import TransmissionDesignView from './views/TransmissionDesignView';
import CommunicationToolsView from './views/CommunicationToolsView';
import PowerElectronicsView from './views/PowerElectronicsView';
import DSPToolsView from './views/DSPToolsView';
import PowerSystemsIIView from './views/PowerSystemsIIView';
import AdvancedCommView from './views/AdvancedCommView';
import PowerStabilityView from './views/PowerStabilityView';
import HighVoltageSuiteView from './views/HighVoltageSuiteView';
import HVDCFactsView from './views/HVDCFactsView';
import SmartGridsAdvancedView from './views/SmartGridsAdvancedView';
import NuclearToolsView from './views/NuclearToolsView';
import GridOperationsView from './views/GridOperationsView';
import ReliabilityToolsView from './views/ReliabilityToolsView';
import { User, ComponentItem, Review, PlatformStat, FAQItem, TestimonialItem } from './types';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, getDocs, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { seedData, seedStats, seedFAQs, seedTestimonials } from './seedData';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [appLoading, setAppLoading] = useState(true);

  // Initialize: Load user session from JWT token, and fetch all components
  useEffect(() => {
    const initApp = async () => {
      // 1. Fetch all semiconductor components & circuits from Firebase Firestore
      try {
        let querySnapshot;
        try {
          const q = query(collection(db, 'components'), orderBy('createdAt', 'desc'));
          querySnapshot = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, 'components');
          console.warn("Using local fallback components due to Firestore access error.");
          setComponents(seedData);
          return;
        }
        const fetched: ComponentItem[] = [];
        querySnapshot.forEach((docSnapshot) => {
          fetched.push({ id: docSnapshot.id, ...docSnapshot.data() } as ComponentItem);
        });

        if (fetched.length > 0) {
          setComponents(fetched);
        } else {
          for (const comp of seedData) {
            try {
              await setDoc(doc(db, 'components', comp.id), {
                title: comp.title,
                description: comp.description,
                fullDescription: comp.fullDescription,
                category: comp.category,
                imageUrl: comp.imageUrl,
                specs: comp.specs,
                creatorId: comp.creatorId,
                rating: comp.rating,
                createdAt: comp.createdAt
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `components/${comp.id}`);
            }
          }
          setComponents(seedData);
        }
      } catch (err) {
        console.error('Failed to fetch Firebase components, loading local fallback', err);
        setComponents(seedData);
      }

      // 1.1 Fetch platformStats
      try {
        let statsSnapshot;
        try {
          const q = query(collection(db, 'platformStats'), orderBy('order', 'asc'));
          statsSnapshot = await getDocs(q);
        } catch (err) {
          console.warn("Using local fallback stats due to Firestore access error.");
          setPlatformStats(seedStats as any);
          return;
        }
        const fetchedStats: PlatformStat[] = [];
        statsSnapshot.forEach((docSnapshot) => {
          fetchedStats.push({ id: docSnapshot.id, ...docSnapshot.data() } as PlatformStat);
        });

        if (fetchedStats.length > 0) {
          setPlatformStats(fetchedStats);
        } else {
          for (const stat of seedStats) {
            try {
              await setDoc(doc(db, 'platformStats', stat.id), {
                month: stat.month,
                ActiveUsers: stat.ActiveUsers,
                ComponentScans: stat.ComponentScans,
                Queries: stat.Queries,
                order: stat.order
              });
            } catch (err) {
              console.error(`Failed to write stats/${stat.id}`, err);
            }
          }
          setPlatformStats(seedStats as any);
        }
      } catch (err) {
        console.error('Failed to fetch platform stats', err);
        setPlatformStats(seedStats as any);
      }

      // 1.2 Fetch faqs
      try {
        let faqsSnapshot;
        try {
          const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
          faqsSnapshot = await getDocs(q);
        } catch (err) {
          console.warn("Using local fallback FAQs due to Firestore access error.");
          setFaqs(seedFAQs as any);
          return;
        }
        const fetchedFAQs: FAQItem[] = [];
        faqsSnapshot.forEach((docSnapshot) => {
          fetchedFAQs.push({ id: docSnapshot.id, ...docSnapshot.data() } as FAQItem);
        });

        if (fetchedFAQs.length > 0) {
          setFaqs(fetchedFAQs);
        } else {
          for (const faq of seedFAQs) {
            try {
              await setDoc(doc(db, 'faqs', faq.id), {
                q: faq.q,
                a: faq.a,
                order: faq.order
              });
            } catch (err) {
              console.error(`Failed to write faqs/${faq.id}`, err);
            }
          }
          setFaqs(seedFAQs as any);
        }
      } catch (err) {
        console.error('Failed to fetch faqs', err);
        setFaqs(seedFAQs as any);
      }

      // 1.3 Fetch testimonials
      try {
        let testimonialsSnapshot;
        try {
          const q = query(collection(db, 'testimonials'), orderBy('order', 'asc'));
          testimonialsSnapshot = await getDocs(q);
        } catch (err) {
          console.warn("Using local fallback testimonials due to Firestore access error.");
          setTestimonials(seedTestimonials as any);
          return;
        }
        const fetchedTestimonials: TestimonialItem[] = [];
        testimonialsSnapshot.forEach((docSnapshot) => {
          fetchedTestimonials.push({ id: docSnapshot.id, ...docSnapshot.data() } as TestimonialItem);
        });

        if (fetchedTestimonials.length > 0) {
          setTestimonials(fetchedTestimonials);
        } else {
          for (const testimonial of seedTestimonials) {
            try {
              await setDoc(doc(db, 'testimonials', testimonial.id), {
                quote: testimonial.quote,
                authorName: testimonial.authorName,
                authorRole: testimonial.authorRole,
                initials: testimonial.initials,
                order: testimonial.order
              });
            } catch (err) {
              console.error(`Failed to write testimonials/${testimonial.id}`, err);
            }
          }
          setTestimonials(seedTestimonials as any);
        }
      } catch (err) {
        console.error('Failed to fetch testimonials', err);
        setTestimonials(seedTestimonials as any);
      }

      // 2. Load User Profile from Firebase Auth
      // Loading state will be handled by the auth state listener below
    };

    initApp();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.email || 'User')}`
        });
      } else {
        setUser(null);
      }
      setAppLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (token: string, loggedUser: User) => {
    setUser(loggedUser);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
  };

  // State update helpers (Immediate responsive feedback on edits/adds/deletes)
  const handleComponentAdded = (newComponent: ComponentItem) => {
    setComponents((prev) => [newComponent, ...prev]);
  };

  const handleComponentDeleted = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleReviewAdded = (componentId: string, review: Review) => {
    // Recalculate rating on state components list immediately
    setComponents((prev) => {
      return prev.map((c) => {
        if (c.id === componentId) {
          // It is updated on the backend. We can approximate here.
          const currentRating = c.rating;
          const updatedRating = Math.round(((currentRating + review.rating) / 2) * 10) / 10;
          return { ...c, rating: updatedRating };
        }
        return c;
      });
    });
  };

  return (
    <Router>
      {appLoading ? (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-navy-dark text-slate-100 gap-4 font-sans">
          <Navbar user={null} onLogout={() => {}} />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 animate-spin">
              <Cpu className="h-6 w-6 text-emerald-accent" />
            </div>
            <div className="text-xs font-mono text-emerald-accent tracking-widest animate-pulse">
              INITIALIZING CIRCUIT CORE...
            </div>
          </div>
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen flex flex-col justify-between bg-navy-dark text-slate-100 selection:bg-emerald-accent/30 selection:text-white">
          
          {/* Navigation bar */}
          <Navbar user={user} onLogout={handleLogout} />

          {/* Floating global EEE chat assistance widget */}
          <ChatAssistant />

          {/* View Switchboard */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomeView components={components} stats={platformStats} faqs={faqs} testimonials={testimonials} />} />
              <Route path="/explore" element={<ExploreView components={components} />} />
              <Route
                path="/component/:id"
                element={<DetailsView components={components} user={user} onReviewAdded={handleReviewAdded} />}
              />
              <Route path="/login" element={<LoginView onLoginSuccess={handleLoginSuccess} />} />
              
              {/* Protected Routes */}
              <Route
                path="/items/add"
                element={user ? <AddEditView user={user} onComponentAdded={handleComponentAdded} /> : <Navigate to="/login" />}
              />
              <Route
                path="/items/manage"
                element={
                  user ? (
                    <ManageView user={user} components={components} onComponentDeleted={handleComponentDeleted} />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Static pages */}
              <Route path="/tools" element={<ToolsView />} />
              <Route path="/advanced-tools" element={<AdvancedToolsView />} />
              <Route path="/hardware-ai" element={<HardwareAIView />} />
              <Route path="/core-tools" element={<CoreToolsLayout />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              <Route path="/pro-simulators" element={<ProSimulatorsView />} />
              <Route path="/research-assistant" element={<ResearchAssistantView />} />
              <Route path="/capstone-hub" element={<CapstoneHubView />} />
              
              {/* 4th Year Modules routes */}
              <Route
                path="/capstone-workspace"
                element={user ? <CapstoneWorkspaceView /> : <Navigate to="/login" />}
              />
              <Route path="/services-design" element={<ServicesDesignView />} />
              <Route path="/electrical-services" element={<ServicesDesignView />} />
              <Route path="/embedded-assistant" element={<EmbeddedToolsView />} />
              <Route path="/embedded-tools" element={<EmbeddedToolsView />} />
              <Route path="/power-economics" element={<PowerEconomicsView />} />
              <Route path="/power-tools/plant-economics" element={<PowerEconomicsView />} />
              <Route path="/protection-tools" element={<ProtectionToolsView />} />
              <Route path="/power-tools/protection" element={<ProtectionToolsView />} />
              <Route path="/microwave-tools" element={<MicrowaveToolsView />} />
               <Route path="/renewable-tools" element={<RenewableToolsView />} />
              <Route path="/comm-tools" element={<CommToolsView />} />
              <Route path="/ml-engineering" element={<MLEngineeringView />} />
              <Route path="/iot-dashboard" element={<IoTDashboardView />} />
              <Route path="/iiot-tools" element={<IIoTToolsView />} />
              <Route path="/biomedical-analyzer" element={<BiomedicalAnalyzerView />} />
              <Route path="/telecom-radar" element={<TelecomRadarView />} />
              <Route path="/power-operations" element={<PowerOperationsView />} />
              <Route path="/circuit-tools" element={<CircuitToolsView />} />
              <Route path="/circuit-tools/advanced" element={<AdvancedCircuitToolsView />} />
              <Route path="/circuit-tools/electronics-i" element={<ElectronicsIToolsView />} />
              <Route path="/circuit-tools/electronics-ii" element={<ElectronicsIIToolsView />} />
              <Route path="/material-tools" element={<MaterialToolsView />} />
              <Route path="/em-tools" element={<EMToolsView />} />
              <Route path="/digital-tools" element={<DigitalToolsView />} />
              <Route path="/signal-tools/linear-systems" element={<LinearSystemsView />} />
              <Route path="/machine-tools" element={<MachineToolsView />} />
              <Route path="/machine-tools/ac-machines" element={<ACMachinesView />} />
              <Route path="/machine-drives" element={<MachineDrivesView />} />
              <Route path="/computational-tools" element={<ComputationalToolsView />} />
              <Route path="/power-tools/transmission-design" element={<TransmissionDesignView />} />
              <Route path="/power-tools/system-analysis" element={<PowerSystemsIIView />} />
              <Route path="/power-tools/stability-control" element={<PowerStabilityView />} />
              <Route path="/power-tools/high-voltage" element={<HighVoltageSuiteView />} />
              <Route path="/power-tools/hvdc-facts" element={<HVDCFactsView />} />
              <Route path="/smart-grids-advanced" element={<SmartGridsAdvancedView />} />
              <Route path="/nuclear-tools" element={<NuclearToolsView />} />
              <Route path="/grid-operations" element={<GridOperationsView />} />
              <Route path="/reliability-tools" element={<ReliabilityToolsView />} />
              <Route path="/communication-tools" element={<CommunicationToolsView />} />
              <Route path="/communication-tools/advanced" element={<AdvancedCommView />} />
              <Route path="/power-electronics" element={<PowerElectronicsView />} />
              <Route path="/dsp-tools" element={<DSPToolsView />} />
              <Route path="/measurement-tools" element={<MeasurementToolsView />} />
              <Route path="/vlsi-tools" element={<VLSIToolsView />} />
              <Route path="/hardware-shop" element={<HardwareShopView />} />
              <Route path="/control-tools" element={<ControlToolsView />} />
              <Route path="/automation-tools" element={<IndustrialAutomationView />} />
              <Route path="/robotics-hub" element={<RoboticsHubView />} />

              <Route path="/about" element={<AboutView />} />
              <Route path="/contact" element={<ContactView />} />

              {/* Wildcard redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Bottom footer */}
          <Footer />

        </div>
      )}
    </Router>
  );
}
