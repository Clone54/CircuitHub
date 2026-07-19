import fs from 'fs';
import path from 'path';

// Define TS Types for Database Schema
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Specification {
  label: string;
  value: string;
}

export interface ComponentItem {
  id: string;
  title: string;
  description: string; // Short description
  fullDescription: string; // Detailed technical overview
  category: string; // e.g. "Analog IC", "Mixed-Signal IC", "Discrete Semiconductor", "Power Management"
  imageUrl: string;
  specs: Specification[];
  creatorId: string; // user id or "system"
  rating: number; // calculated overall rating
  createdAt: string;
}

export interface Review {
  id: string;
  componentId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface CapstoneProject {
  id: string;
  userId: string;
  title: string;
  problemStatement: string;
  proposedArchitecture: string;
  tools: string[];
  createdAt: string;
}

export interface ThesisChapter {
  id: string;
  userId: string;
  title: string;
  bullets: string;
  draftContent: string;
  status: 'Draft' | 'In Review' | 'Completed';
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  components: ComponentItem[];
  reviews: Review[];
  chatMessages: ChatMessage[];
  capstoneProjects?: CapstoneProject[];
  thesisChapters?: ThesisChapter[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Helper to ensure data directory exists and return parsed database
function loadDatabase(): DatabaseSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialDb: DatabaseSchema = {
      users: [],
      components: getSeedComponents(),
      reviews: getSeedReviews(),
      chatMessages: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.capstoneProjects) {
      parsed.capstoneProjects = [];
    }
    if (!parsed.thesisChapters) {
      parsed.thesisChapters = [];
    }
    return parsed;
  } catch (err) {
    console.error('Error loading DB file, rebuilding seed:', err);
    const initialDb: DatabaseSchema = {
      users: [],
      components: getSeedComponents(),
      reviews: getSeedReviews(),
      chatMessages: [],
      capstoneProjects: [],
      thesisChapters: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
}

function saveDatabase(db: DatabaseSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// Highly detailed seed components for electronics and circuit analysis
function getSeedComponents(): ComponentItem[] {
  return [
    {
      id: 'lm358',
      title: 'LM358 Operational Amplifier',
      description: 'Highly versatile, industry-standard dual operational amplifier designed for single-supply operation.',
      fullDescription: 'The LM358 consists of two independent, high-gain, internally frequency compensated operational amplifiers designed specifically to operate from a single power supply over a wide range of voltages. Operation from split power supplies is also possible, and the low power supply current drain is independent of the magnitude of the power supply voltage. This operational amplifier is exceptionally suited for EEE active filters, DC gain blocks, and general signal amplification circuits.',
      category: 'Analog IC',
      imageUrl: 'https://images.unsplash.com/photo-1517055727180-d5a0cd2e1960?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      creatorId: 'system',
      createdAt: '2026-01-10T08:00:00.000Z',
      specs: [
        { label: 'Supply Voltage Range', value: '3.0V to 32V (Single), ±1.5V to ±16V (Dual)' },
        { label: 'Gain Bandwidth Product', value: '1.1 MHz' },
        { label: 'Input Bias Current', value: '45 nA (Max)' },
        { label: 'Input Offset Voltage', value: '2.0 mV' },
        { label: 'Operating Temperature', value: '0°C to 70°C' },
        { label: 'Slew Rate', value: '0.6 V/μs' }
      ]
    },
    {
      id: 'ne555',
      title: '555 Precision Timer IC',
      description: 'The legendary mixed-signal timer IC, perfect for generating stable time delays or pulse oscillations.',
      fullDescription: 'The 555 timer is a highly stable controller capable of producing accurate time delays or oscillation. In the time-delay mode of operation, the time is precisely controlled by one external resistor and capacitor. For astable operation as an oscillator, the free running frequency and duty cycle are accurately controlled with two external resistors and one capacitor. It is the absolute cornerstone of basic frequency generators, PWM motor controllers, and LED flasher circuits.',
      category: 'Mixed-Signal IC',
      imageUrl: 'https://images.unsplash.com/photo-1601524909162-be87252be298?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      creatorId: 'system',
      createdAt: '2026-02-15T10:30:00.000Z',
      specs: [
        { label: 'Supply Voltage Range', value: '4.5V to 16V' },
        { label: 'Maximum Frequency', value: '500 kHz' },
        { label: 'Trigger Voltage', value: '1/3 VCC' },
        { label: 'Threshold Voltage', value: '2/3 VCC' },
        { label: 'Max Output Current', value: '200 mA' },
        { label: 'Timing Error (Astable)', value: '1.5% (Typical)' }
      ]
    },
    {
      id: 'ne5532',
      title: 'NE5532 Dual Low-Noise Op-Amp',
      description: 'High-performance operational amplifier combining outstanding DC and AC audio qualities.',
      fullDescription: 'The NE5532 is a high-performance operational amplifier combining excellent DC and AC characteristics. It features very low noise, high output-drive capability, high unity-gain and maximum-output-oscillation bandwidths, low distortion, high slew rate, input-protection diodes, and output short-circuit protection. It is highly recommended for professional and high-quality audio equipment, instrumentation and control circuits, and EEE active bandpass filters.',
      category: 'Analog IC',
      imageUrl: 'https://images.unsplash.com/photo-1591405351990-4726e33df58d?auto=format&fit=crop&w=600&q=80',
      rating: 4.7,
      creatorId: 'system',
      createdAt: '2026-03-01T12:00:00.000Z',
      specs: [
        { label: 'Supply Voltage Range', value: '±3.0V to ±22V' },
        { label: 'Input Noise Voltage', value: '5 nV/√Hz (at 1 kHz)' },
        { label: 'Unity Gain Bandwidth', value: '10 MHz' },
        { label: 'Slew Rate', value: '9 V/μs' },
        { label: 'DC Voltage Gain', value: '100,000 (V/V)' },
        { label: 'THD (Total Harmonic Distortion)', value: '0.002% (Typical)' }
      ]
    },
    {
      id: 'irf540n',
      title: 'IRF540N N-Channel Power MOSFET',
      description: 'Advanced HEXFET Power MOSFET engineered for high-speed switching and heavy DC loads.',
      fullDescription: 'The IRF540N from International Rectifier utilizes advanced processing techniques to achieve extremely low on-resistance per silicon area. This benefit, combined with the fast switching speed and ruggedized device design that HEXFET power MOSFETs are well known for, provides the designer with an extremely efficient and reliable device for use in active switching applications, H-bridge motor drivers, and high-frequency DC-DC converters.',
      category: 'Discrete Semiconductor',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
      rating: 4.6,
      creatorId: 'system',
      createdAt: '2026-04-12T14:45:00.000Z',
      specs: [
        { label: 'Drain-to-Source Voltage (Vdss)', value: '100 V' },
        { label: 'Continuous Drain Current (Id)', value: '33 A (at 25°C)' },
        { label: 'On-Resistance Rds(on)', value: '44 mΩ' },
        { label: 'Gate Threshold Voltage Vgs(th)', value: '2.0V to 4.0V' },
        { label: 'Total Gate Charge (Qg)', value: '71 nC' },
        { label: 'Power Dissipation (Pd)', value: '130 W' }
      ]
    },
    {
      id: 'lm7805',
      title: 'LM7805 Positive 5V Voltage Regulator',
      description: 'Classic three-terminal positive linear regulator offering bulletproof 5V DC power rails.',
      fullDescription: 'The LM7805 series of three-terminal positive regulators are available in the TO-220 package and with several fixed output voltages, making them useful in a wide range of applications. Each type employs internal current limiting, thermal shut-down and safe area protection, making it essentially indestructible. If adequate heat sinking is provided, they can deliver over 1.5A output current. They are primarily used as fixed voltage regulators in digital TTL electronics, microcontrollers, and laboratory power supplies.',
      category: 'Power Management',
      imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&q=80',
      rating: 4.5,
      creatorId: 'system',
      createdAt: '2026-05-18T16:20:00.000Z',
      specs: [
        { label: 'Output Voltage', value: '5.0 V' },
        { label: 'Max Input Voltage', value: '35 V' },
        { label: 'Output Current Cap', value: '1.5 A' },
        { label: 'Quiescent Current', value: '5 mA' },
        { label: 'Dropout Voltage', value: '2.0 V' },
        { label: 'Operating Junction Temp', value: '0°C to 125°C' }
      ]
    },
    {
      id: 'atmega328p',
      title: 'ATmega328P 8-Bit Microcontroller',
      description: 'High-performance, low-power AVR RISC-based microcontroller. The heart of the Arduino Uno.',
      fullDescription: 'The ATmega328P is a low-power CMOS 8-bit microcontroller based on the AVR enhanced RISC architecture. By executing powerful instructions in a single clock cycle, the ATmega328P achieves throughputs approaching 1 MIPS per MHz, balancing power consumption and processing speed. It features 32KB of flash memory, 1KB EEPROM, 2KB SRAM, 23 general purpose I/O lines, 32 general purpose working registers, internal and external interrupts, a 6-channel 10-bit A/D converter, and a programmable watchdog timer.',
      category: 'Digital IC',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      rating: 4.9,
      creatorId: 'system',
      createdAt: '2026-06-20T09:15:00.000Z',
      specs: [
        { label: 'CPU Architecture', value: '8-Bit AVR RISC' },
        { label: 'Operating Voltage', value: '1.8V to 5.5V' },
        { label: 'Max Clock Frequency', value: '20 MHz' },
        { label: 'Flash Memory size', value: '32 KB' },
        { label: 'SRAM Size', value: '2 KB' },
        { label: 'Peripherals', value: 'I2C, SPI, UART, 6 PWM, 8-Ch 10-bit ADC' }
      ]
    }
  ];
}

function getSeedReviews(): Review[] {
  return [
    {
      id: 'r1',
      componentId: 'lm358',
      userName: 'Firoz Ahmed',
      userEmail: 'firozahmedskt1@gmail.com',
      rating: 5,
      comment: 'Absolutely essential for the active high-pass filter design in my EEE lab. Works perfectly and has broad simulation support.',
      createdAt: '2026-06-15T14:30:00.000Z'
    },
    {
      id: 'r2',
      componentId: 'ne555',
      userName: 'Dr. Sarah Jenkins',
      userEmail: 's.jenkins@university.edu',
      rating: 5,
      comment: 'Excellent teaching aid. Students configured this in Astable mode to analyze pulse width variations. Very linear behavior in lab simulations.',
      createdAt: '2026-07-02T10:15:00.000Z'
    },
    {
      id: 'r3',
      componentId: 'lm7805',
      userName: 'Alex Rivers',
      userEmail: 'alex.r@makermail.com',
      rating: 4,
      comment: 'Highly reliable linear regulator. It gets quite warm at 1A output when dropping 12V input, so a good heatsink is non-negotiable!',
      createdAt: '2026-07-05T18:40:00.000Z'
    },
    {
      id: 'r4',
      componentId: 'ne5532',
      userName: 'Markus Audio',
      userEmail: 'markus@audioforge.com',
      rating: 5,
      comment: 'Standard op-amp for pre-amplifier boards. Lower noise floor than LM358 which is noticeable in low-frequency audio pre-amplifiers.',
      createdAt: '2026-07-10T11:50:00.000Z'
    }
  ];
}

// Database Methods
export const db = {
  // Users
  getUsers: () => loadDatabase().users,
  getUserById: (id: string) => loadDatabase().users.find(u => u.id === id),
  getUserByEmail: (email: string) => loadDatabase().users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => {
    const database = loadDatabase();
    const newUser: User = {
      ...user,
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    database.users.push(newUser);
    saveDatabase(database);
    return newUser;
  },

  // Components
  getComponents: () => loadDatabase().components,
  getComponentById: (id: string) => loadDatabase().components.find(c => c.id === id),
  createComponent: (component: Omit<ComponentItem, 'id' | 'rating' | 'createdAt'>) => {
    const database = loadDatabase();
    const newComponent: ComponentItem = {
      ...component,
      id: 'comp_' + Math.random().toString(36).substr(2, 9),
      rating: 5.0, // default rating for newly added component
      createdAt: new Date().toISOString(),
    };
    database.components.push(newComponent);
    saveDatabase(database);
    return newComponent;
  },
  deleteComponent: (id: string, creatorId: string) => {
    const database = loadDatabase();
    const initialLen = database.components.length;
    // Only allow system or creator to delete
    database.components = database.components.filter(c => c.id !== id || (c.creatorId !== creatorId && creatorId !== 'system'));
    const success = database.components.length < initialLen;
    if (success) {
      // also delete associated reviews
      database.reviews = database.reviews.filter(r => r.componentId !== id);
      saveDatabase(database);
    }
    return success;
  },

  // Reviews
  getReviewsByComponentId: (componentId: string) => loadDatabase().reviews.filter(r => r.componentId === componentId),
  createReview: (review: Omit<Review, 'id' | 'createdAt'>) => {
    const database = loadDatabase();
    const newReview: Review = {
      ...review,
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    database.reviews.push(newReview);

    // Recalculate average rating for component
    const componentReviews = database.reviews.filter(r => r.componentId === review.componentId);
    const avgRating = componentReviews.reduce((sum, r) => sum + r.rating, 0) / componentReviews.length;
    const component = database.components.find(c => c.id === review.componentId);
    if (component) {
      component.rating = Math.round(avgRating * 10) / 10;
    }

    saveDatabase(database);
    return newReview;
  },

  // Chat History
  getChatMessages: (userId: string) => loadDatabase().chatMessages.filter(msg => msg.userId === userId),
  addChatMessage: (userId: string, role: 'user' | 'assistant', content: string) => {
    const database = loadDatabase();
    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      userId,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    database.chatMessages.push(newMsg);
    saveDatabase(database);
    return newMsg;
  },
  clearChatHistory: (userId: string) => {
    const database = loadDatabase();
    database.chatMessages = database.chatMessages.filter(msg => msg.userId !== userId);
    saveDatabase(database);
  },

  // Capstone Projects Recommendation Storage
  getCapstoneProjects: (userId: string) => {
    const dbData = loadDatabase();
    if (!dbData.capstoneProjects) return [];
    return dbData.capstoneProjects.filter(p => p.userId === userId);
  },
  createCapstoneProject: (userId: string, project: Omit<CapstoneProject, 'id' | 'userId' | 'createdAt'>) => {
    const dbData = loadDatabase();
    if (!dbData.capstoneProjects) {
      dbData.capstoneProjects = [];
    }
    const newProject: CapstoneProject = {
      ...project,
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      userId,
      createdAt: new Date().toISOString(),
    };
    dbData.capstoneProjects.push(newProject);
    saveDatabase(dbData);
    return newProject;
  },

  // Thesis Chapters
  getThesisChapters: (userId: string) => {
    const dbData = loadDatabase();
    if (!dbData.thesisChapters) return [];
    return dbData.thesisChapters.filter(c => c.userId === userId);
  },
  createThesisChapter: (userId: string, chapter: Omit<ThesisChapter, 'id' | 'userId' | 'createdAt'>) => {
    const dbData = loadDatabase();
    if (!dbData.thesisChapters) {
      dbData.thesisChapters = [];
    }
    const newChapter: ThesisChapter = {
      ...chapter,
      id: 'chap_' + Math.random().toString(36).substr(2, 9),
      userId,
      createdAt: new Date().toISOString(),
    };
    dbData.thesisChapters.push(newChapter);
    saveDatabase(dbData);
    return newChapter;
  },
  updateThesisChapter: (userId: string, id: string, updates: Partial<Omit<ThesisChapter, 'id' | 'userId' | 'createdAt'>>) => {
    const dbData = loadDatabase();
    if (!dbData.thesisChapters) return null;
    const idx = dbData.thesisChapters.findIndex(c => c.id === id && c.userId === userId);
    if (idx === -1) return null;
    dbData.thesisChapters[idx] = {
      ...dbData.thesisChapters[idx],
      ...updates
    };
    saveDatabase(dbData);
    return dbData.thesisChapters[idx];
  },
  deleteThesisChapter: (userId: string, id: string) => {
    const dbData = loadDatabase();
    if (!dbData.thesisChapters) return false;
    const initialLen = dbData.thesisChapters.length;
    dbData.thesisChapters = dbData.thesisChapters.filter(c => !(c.id === id && c.userId === userId));
    saveDatabase(dbData);
    return dbData.thesisChapters.length < initialLen;
  }
};
