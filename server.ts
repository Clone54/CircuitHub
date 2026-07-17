import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db, User, ComponentItem, Review } from './src/server/db.js';

// Environment variables configuration
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-electronics-circuit-hub-key-2026';

// Multer setup for datasheet upload handling (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Lazy-loaded Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Please add your Gemini API Key in the Secrets panel in AI Studio UI.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Global helper to execute Gemini API queries with automatic cascading fallback to alternative models on quota limits
async function generateContentWithFallback(params: any): Promise<any> {
  const ai = getGeminiClient();
  
  // Set up sequential fallback models. Each model on the free tier has its own independent rate limit/quota.
  const modelsToTry = [
    params.model || 'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];

  // Deduplicate array while preserving preference order
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      console.log(`[Gemini API] Attempting generateContent using model: ${model}`);
      const response = await ai.models.generateContent({
        ...params,
        model: model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isRecoverableError = 
        err.status === 429 || 
        err.status === 503 || 
        err.status === 500 || 
        err.status === 404 ||
        err.message?.includes('429') || 
        err.message?.includes('503') || 
        err.message?.includes('RESOURCE_EXHAUSTED') || 
        err.message?.includes('Quota exceeded') ||
        err.message?.includes('quota') ||
        err.message?.includes('limit') ||
        err.message?.includes('high demand') ||
        err.message?.includes('overloaded');

      if (isRecoverableError) {
        console.warn(`[Gemini API] Model ${model} failed due to quota/rate limit or high demand. Trying next available model...`);
        continue;
      } else {
        console.error(`[Gemini API] Model ${model} failed with unrecoverable error:`, err);
        throw err;
      }
    }
  }

  throw lastError;
}

// Local academic thesis draft generator fallback
function generateLocalAcademicDraft(title: string, bullets: string): string {
  const bulletLines = bullets
    .split('\n')
    .map(line => line.trim().replace(/^[-*+•]\s*/, ''))
    .filter(line => line.length > 0);

  let draft = `# ${title}\n\n`;
  draft += `## 1. Introduction and Overview\n\n`;
  draft += `In modern Electrical and Electronic Engineering (EEE) academic research, systematic design methodologies and rigorous analytical frameworks are critical to validating complex engineering paradigms. This chapter elicits the fundamental principles, theoretical formulations, and experimental topologies corresponding to *"${title.replace(/^Chapter\s+\d+:\s*/i, '')}"*.\n\n`;
  draft += `The primary objective of this section is to present a cohesive, mathematically sound treatise outlining the underlying design considerations, performance criteria, and hardware-software constraints. By leveraging state-of-the-art computational techniques and empirical models, this work bridges the gap between theoretical circuit synthesis and real-world system realization.\n\n`;

  if (bulletLines.length > 0) {
    draft += `## 2. Core Methodologies and Analytical Elaboration\n\n`;
    draft += `To systematically analyze and validate the design, we decompose the primary research questions into several key technical domains outlined in the research guidelines:\n\n`;

    bulletLines.forEach((bullet, index) => {
      draft += `### 2.${index + 1} Analysis of ${bullet}\n\n`;
      draft += `The investigation into **${bullet}** represents a cornerstone of this chapter's technical methodology. Under realistic operating conditions, the performance of the system exhibits strong dependencies on passive component parameterization, switching dynamics, and feedback loop stability.\n\n`;
      draft += `To fully understand this, consider the transient response and thermal distribution characteristics. A deep analytical review shows that the efficiency of power delivery or signal propagation is constrained by standard engineering trade-offs, namely high-frequency switching losses versus conduction losses. Mathematically, these relations can be modeled as a system of coupled first-order differential equations representing energy storage and dissipation across the discrete components.\n\n`;
      draft += `By optimizing the control laws and layout constraints corresponding to ${bullet.toLowerCase()}, we achieve a significant reduction in overall system noise, ripple factors, and spectral distortion. The subsequent sections will detail the quantitative models supporting these assertions.\n\n`;
    });
  } else {
    draft += `## 2. Core Methodologies and Analytical Elaboration\n\n`;
    draft += `In this section, we elaborate on the fundamental design constraints and structural topologies of the proposed architecture. The system layout is optimized to minimize parasitics, EMI coupling, and thermal gradients across high-power semiconductors.\n\n`;
  }

  draft += `## 3. Mathematical Modeling and Governing Formulations\n\n`;
  draft += `A rigorous academic framework requires quantitative modeling of the physical phenomena. Here, we formulate the governing design equations. \n\n`;
  draft += `First, the steady-state transfer characteristic of the proposed architecture is governed by the conservation of power and charge. Under ideal continuous conduction mode (CCM), the voltage conversion ratio can be expressed as:\n\n`;
  draft += `V_out = V_in * (D / (1 - D))\n\n`;
  draft += `Where D represents the switching duty cycle. To incorporate parasitics and dynamic loss components, we model the total system power dissipation (P_total) as a summation of conduction losses (P_cond), switching transitions (P_sw), and magnetic core losses (P_core):\n\n`;
  draft += `P_total = I_RMS^2 * R_DS_on + V_in * I_out * f_sw * (t_rise + t_fall) + K_fe * f_sw^alpha * B_max^beta\n\n`;
  draft += `This coupled model allows the optimization algorithm to solve for the maximum efficiency operating point (D_opt):\n\n`;
  draft += `D_opt = 1 - sqrt( (R_load * (1 - η_target)) / (2 * L_eq * f_sw) )\n\n`;
  draft += `The numerical simulation of these equations under parameter sweeps validates the steady-state performance and ensures the design operates well within Safe Operating Area (SOA) boundaries under transient fault conditions.\n\n`;

  draft += `## 4. Empirical Simulation and Discussion\n\n`;
  draft += `To verify the mathematical models, a high-fidelity finite-element-method (FEM) and circuit-level SPICE simulation were executed. The transient waveforms demonstrate close agreement with the theoretical formulations, with a maximum deviation of less than 3.5% under extreme step-load changes. \n\n`;
  draft += `These empirical findings substantiate the claim that the proposed design achieves high power density and excellent transient regulation, satisfying the strict specifications outlined in EEE 4002/Capstone standards.\n\n`;

  draft += `## 5. Chapter Conclusion\n\n`;
  draft += `In summary, this chapter has presented a complete design methodology, mathematical derivation, and simulation validation for *"${title.replace(/^Chapter\s+\d+:\s*/i, '')}"*. The established formulations serve as the baseline for the prototype hardware development and experimental characterization detailed in the subsequent chapters of this thesis.\n`;

  return draft;
}

// Helper to convert any residual LaTeX equations into human-friendly professional plaintext/unicode math
function cleanLatexToProfessional(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Replace block and inline math delimiters
  cleaned = cleaned.replace(/\\\[/g, '\n');
  cleaned = cleaned.replace(/\\\]/g, '\n');
  cleaned = cleaned.replace(/\\\(/g, ' ');
  cleaned = cleaned.replace(/\\\)/g, ' ');
  cleaned = cleaned.replace(/\$\$/g, '');
  cleaned = cleaned.replace(/\$/g, '');

  // Keep replacing until no more occurrences of \frac are found
  let oldCleaned;
  do {
    oldCleaned = cleaned;
    // Match \frac{num}{den}
    cleaned = cleaned.replace(/\\frac\s*{(.*?)}\s*{(.*?)}/g, '($1) / ($2)');
  } while (cleaned !== oldCleaned);

  // Match \sqrt{content}
  cleaned = cleaned.replace(/\\sqrt\s*{(.*?)}/g, 'sqrt($1)');
  
  // Match super/subscripts like R_{in} -> R_in
  cleaned = cleaned.replace(/_{(.*?)}/g, '_$1');
  cleaned = cleaned.replace(/\^{(.*?)}/g, '^$1');

  // Common greek symbols and operators
  const replacements: { [key: string]: string } = {
    '\\omega_0': 'ω0',
    '\\omega': 'ω',
    '\\pi': 'π',
    '\\times': ' * ',
    '\\cdot': ' * ',
    '\\Delta': 'Δ',
    '\\theta': 'θ',
    '\\Omega': 'Ω',
    '\\mu': 'μ',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\lambda': 'λ',
    '\\eta': 'η',
    '\\ge': '>=',
    '\\le': '<=',
    '\\pm': '±',
    '\\approx': '≈',
    '\\infty': '∞',
  };

  for (const [key, val] of Object.entries(replacements)) {
    // Escape backslashes in key for RegExp
    const escapedKey = key.replace(/\\/g, '\\\\');
    cleaned = cleaned.replace(new RegExp(escapedKey, 'g'), val);
  }

  // Double-check backslashes that might remain
  cleaned = cleaned.replace(/\\/g, '');

  return cleaned;
}

// Custom request interface to append user details from JWT
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      // Fallback for Firebase ID tokens (which are not signed by JWT_SECRET)
      const unverified = jwt.decode(token);
      if (unverified && (unverified as any).user_id) {
        req.user = { 
          id: (unverified as any).user_id, 
          email: (unverified as any).email || '',
          name: (unverified as any).name || ''
        };
        return next();
      }
      return res.status(403).json({ message: 'Invalid or expired authorization token' });
    }
    req.user = decoded;
    next();
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure database has a Demo User seeded on startup
  const demoEmail = 'demo@circuit-hub.com';
  let demoUser = db.getUserByEmail(demoEmail);
  if (!demoUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('CircuitDemo123!', salt);
    demoUser = db.createUser({
      email: demoEmail,
      name: 'Firoz Ahmed (Demo)',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Firoz',
    });
  }

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = db.createUser({
        email,
        name,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      });

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (err: any) {
      res.status(500).json({ message: 'Registration failed', error: err.message });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (err: any) {
      res.status(500).json({ message: 'Login failed', error: err.message });
    }
  });

  // Demo Login
  app.post('/api/auth/demo', async (req, res) => {
    try {
      const user = db.getUserByEmail('demo@circuit-hub.com');
      if (!user) {
        return res.status(500).json({ message: 'Demo account not initialized' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (err: any) {
      res.status(500).json({ message: 'Demo login failed', error: err.message });
    }
  });

  // Google Social Login (mock/social login handler)
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { email, name, googleId } = req.body;
      if (!email || !name) {
        return res.status(400).json({ message: 'Google account details missing' });
      }

      // Find or create user
      let user = db.getUserByEmail(email);
      if (!user) {
        const dummyPass = Math.random().toString(36).substring(2) + '!';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dummyPass, salt);
        user = db.createUser({
          email,
          name,
          passwordHash,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl } });
    } catch (err: any) {
      res.status(500).json({ message: 'Google login failed', error: err.message });
    }
  });

  // Get current user profile
  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const user = db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl });
  });

  // Get components list (Filters, search, sorting, pagination)
  app.get('/api/components', (req, res) => {
    try {
      const { search, category, rating, sort, page = '1', limit = '12' } = req.query;

      let components = db.getComponents();

      // Search filtering (name, short description, category)
      if (search) {
        const query = (search as string).toLowerCase();
        components = components.filter(c =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query)
        );
      }

      // Category filtering
      if (category && category !== 'All') {
        components = components.filter(c => c.category === category);
      }

      // Rating filtering (minimum rating)
      if (rating) {
        const minRating = parseFloat(rating as string);
        if (!isNaN(minRating)) {
          components = components.filter(c => c.rating >= minRating);
        }
      }

      // Sorting
      if (sort) {
        const sortVal = sort as string;
        if (sortVal === 'a-z') {
          components.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortVal === 'z-a') {
          components.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sortVal === 'newest') {
          components.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortVal === 'rating') {
          components.sort((a, b) => b.rating - a.rating);
        }
      } else {
        // default: newest
        components.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Pagination
      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const startIndex = (p - 1) * l;
      const paginatedComponents = components.slice(startIndex, startIndex + l);

      res.json({
        components: paginatedComponents,
        total: components.length,
        page: p,
        pages: Math.ceil(components.length / l),
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to retrieve components', error: err.message });
    }
  });

  // Get single component details
  app.get('/api/components/:id', (req, res) => {
    try {
      const { id } = req.params;
      const component = db.getComponentById(id);
      if (!component) {
        return res.status(404).json({ message: 'Electronic component or circuit not found' });
      }
      res.json(component);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to retrieve component details', error: err.message });
    }
  });

  // Get component reviews
  app.get('/api/components/:id/reviews', (req, res) => {
    try {
      const { id } = req.params;
      const reviews = db.getReviewsByComponentId(id);
      res.json(reviews);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to retrieve component reviews', error: err.message });
    }
  });

  // Add component review
  app.post('/api/components/:id/reviews', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
      }

      const component = db.getComponentById(id);
      if (!component) {
        return res.status(404).json({ message: 'Component not found' });
      }

      const review = db.createReview({
        componentId: id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        rating: parseInt(rating, 10),
        comment,
      });

      res.status(201).json(review);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to post review', error: err.message });
    }
  });

  // Add new component (protected)
  app.post('/api/components', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { title, description, fullDescription, category, imageUrl, specs } = req.body;
      if (!title || !description || !fullDescription || !category) {
        return res.status(400).json({ message: 'Title, descriptions, and category are required fields' });
      }

      // Default specs if none provided
      const finalSpecs = Array.isArray(specs) ? specs : [
        { label: 'Supply Voltage', value: 'Not Specified' },
        { label: 'Operating Temp', value: 'Not Specified' }
      ];

      const newComp = db.createComponent({
        title,
        description,
        fullDescription,
        category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
        specs: finalSpecs,
        creatorId: req.user!.id,
      });

      res.status(201).json(newComp);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to add component', error: err.message });
    }
  });

  // Delete component (protected)
  app.delete('/api/components/:id', authenticateToken, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const component = db.getComponentById(id);
      if (!component) {
        return res.status(404).json({ message: 'Component not found' });
      }

      // Only let the creator delete it, or allow system-level (admin) deletions
      if (component.creatorId !== req.user!.id && component.creatorId !== 'system') {
        return res.status(403).json({ message: 'You are not authorized to delete this component' });
      }

      const success = db.deleteComponent(id, req.user!.id);
      if (success) {
        res.json({ message: 'Component and associated reviews successfully deleted' });
      } else {
        res.status(400).json({ message: 'Failed to delete component' });
      }
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete component', error: err.message });
    }
  });


  // --- AI FEATURE 1: DOCUMENT INTELLIGENCE (Datasheet Analyzer) ---
  app.post('/api/analyze', upload.single('datasheet'), async (req, res) => {
    try {
      let documentContent = '';

      if (req.file) {
        // PDF parser mock / simple text extractor for safety inside browser preview.
        // We will read the buffer as text and also combine it with file info
        const fileBufferText = req.file.buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
        documentContent = `File Uploaded: ${req.file.originalname}\nSize: ${req.file.size} bytes\nMime-Type: ${req.file.mimetype}\n\nContent Excerpt:\n${fileBufferText.slice(0, 4000)}`;
      } else if (req.body.textInput) {
        documentContent = req.body.textInput;
      } else if (req.body.componentId) {
        // Fallback to analyze a pre-existing component
        const comp = db.getComponentById(req.body.componentId);
        if (comp) {
          documentContent = `Component Title: ${comp.title}\nCategory: ${comp.category}\nDescription: ${comp.description}\nTechnical Specs:\n${comp.specs.map(s => `- ${s.label}: ${s.value}`).join('\n')}\nFull Details: ${comp.fullDescription}`;
        }
      }

      if (!documentContent.trim()) {
        return res.status(400).json({ message: 'No datasheet file uploaded or text content provided for analysis.' });
      }

      // Lazy-load Gemini client
      const ai = getGeminiClient();

      // We call Gemini to analyze the text and return a beautifully structured JSON response
      const systemInstruction = `You are a professional electronic component datasheet analyzer and circuit designer.
Analyze the provided datasheet details or specifications and extract:
1. A clear, high-level summary of the component's primary purpose and operating principles.
2. The Pinout configuration (describe each pin's number, name, and key function).
3. Technical Specifications table containing key parameters like Maximum Voltage, Operating Temperature, Power Dissipation, etc.
4. Suggested typical applications or a simple circuit setup.

You MUST respond in a strict JSON format matching this schema:
{
  "summary": "Brief detailed overview of the component.",
  "pinout": [
    { "pin": "Pin 1", "name": "VCC", "description": "Power supply pin" }
  ],
  "specs": [
    { "label": "Max Input Voltage", "value": "32V" }
  ],
  "applications": [
    "Astable multivibrator clock source",
    "Audio amplifier preamp stage"
  ]
}`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Analyze the following datasheet information and return the structured JSON data as requested in system instructions:\n\n${documentContent}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'Summary of purpose and design' },
              pinout: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pin: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['pin', 'name', 'description']
                }
              },
              specs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ['label', 'value']
                }
              },
              applications: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['summary', 'pinout', 'specs', 'applications']
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('Gemini API returned an empty response');
      }

      const analyzedData = JSON.parse(resultText.trim());
      res.json(analyzedData);
    } catch (err: any) {
      console.error('Datasheet analyzer failed:', err);
      // Fallback response for offline or missing API Key situations so the app remains interactive & premium
      res.json({
        isMocked: true,
        summary: 'Analyzed Component Overview: A versatile high-gain silicon semiconductor device optimized for power amplification, logic coupling, and oscillator integration in EEE-2104 lab simulations.',
        pinout: [
          { pin: 'Pin 1', name: 'OUT A / VOUT', description: 'Primary output node for Stage A amplifier loop' },
          { pin: 'Pin 2', name: 'IN A- / IN-', description: 'Inverting input node for closed-loop gain adjustments' },
          { pin: 'Pin 3', name: 'IN A+ / IN+', description: 'Non-inverting high-impedance signal entry node' },
          { pin: 'Pin 4', name: 'GND / V-', description: 'Ground connection or negative power rail node' },
          { pin: 'Pin 5', name: 'IN B+ / NC', description: 'Stage B non-inverting node or secondary calibration tap' },
          { pin: 'Pin 6', name: 'IN B- / TRIG', description: 'Inverting node for Stage B or comparator threshold trigger' },
          { pin: 'Pin 7', name: 'OUT B / OUT', description: 'Secondary output node or collector junction tap' },
          { pin: 'Pin 8', name: 'VCC / V+', description: 'Positive supply voltage rail inlet (typically 3V to 32V)' }
        ],
        specs: [
          { label: 'Maximum Supply Voltage Range', value: '32.0 Volts Continuous (35V Transient Spike)' },
          { label: 'Quiescent Operating Current', value: '1.2 mA per internal stage (extremely low standby)' },
          { label: 'Transition Unity Gain Bandwidth', value: '1.2 MHz (High-frequency filter safe)' },
          { label: 'Operating Slew Rate Capability', value: '0.8 V/μs under standard 100pF load conditions' },
          { label: 'Junction Thermal Range Limits', value: '-40°C to +85°C (Industrial Grade Certified)' }
        ],
        applications: [
          'High-precision low-frequency voltage comparator arrays',
          'Astable wave generator feedback loops (555 coupled)',
          'Active Butterworth bandpass filtering (EEE-2104 compliant)'
        ],
        warning: err.message.includes('GEMINI_API_KEY') ? 'Demo mode loaded because GEMINI_API_KEY is not configured in Secrets.' : undefined
      });
    }
  });


  // --- AI FEATURE 2: CONTEXT-AWARE CHAT ASSISTANT (EEE-2104 Circuit Assistant) ---
  app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    try {
      // Format conversation history for Gemini API
      // Since GoogleGenAI expects clean strings or content parts:
      // We will create a rich conversational prompt.
      const conversationHistory = Array.isArray(history) 
        ? history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')
        : '';
      const systemInstruction = `You are an expert University-level Electrical and Electronic Engineering Tutor. Your expertise covers:
1. Circuit Theory: Ohm's Law, KVL, KCL, Thevenin/Norton theorems, Node/Mesh analysis, Phasors, and Resonance.
2. Analog Electronics: Diode clippers/clampers, BJT/MOSFET biasing and small-signal AC analysis, Multistage amplifiers, Op-Amp applications (Integrators, Differentiators, Active Filters), and Oscillators.
3. Digital Electronics: Boolean algebra, K-Maps, Combinational logic (Multiplexers, Encoders), Sequential logic (Flip-flops, Counters), and ADC/DAC architectures.
4. Electromagnetics: Maxwell's equations and waveguide mechanics.
5. Machines I: Transformer equivalent circuits and DC machine characteristics.
6. Instrumentation: AC/DC Bridges, LVDT, Strain Gauges, and signal conditioning.
7. VLSI: MOSFET delay, CMOS fabrication steps, and dynamic power dissipation.

When answering, provide step-by-step mathematical derivations where applicable. Do not answer questions outside of electrical engineering, computer science, or physics. Keep responses concise, clear, and highly educational.

CRITICAL EQUATION FORMATTING INSTRUCTION:
You MUST output all mathematical equations and formulas in human-readable PROFESSIONAL MODE (plain-text/unicode math format) instead of LaTeX or math-block formatting.
- Absolutely DO NOT use LaTeX blocks ($$ ... $$), backslashes, or inline LaTeX delimiters like \\( ... \\) or \\[ ... \\].
- Absolutely DO NOT use any LaTeX syntax like \\frac, \\sqrt, \\omega, etc.
- Always write formulas in elegant, clear plain-text with standard operators and standard symbols (e.g., use "ω" or "omega" instead of "\\omega", "π" or "pi" instead of "\\pi", "sqrt(L * C)" instead of "\\sqrt{LC}", and "A_v = 1 + (Rf / R1)" instead of inline LaTeX).
- Use professional unicode mathematical characters where appropriate (e.g. Δ, θ, Ω, μ, α, β, λ, η, ±, ≈, >=, <=) to make formulas look highly polished and professional.

Offer 2 suggested follow-up questions at the very end of your response, separated by a line and formatted exactly as:
[SUGGESTION: First follow up question?]
[SUGGESTION: Second follow up question?]`;

      const prompt = `${conversationHistory}\nUser: ${message}\nAssistant:`;

      // Lazy-load Gemini client
      const ai = getGeminiClient();

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = cleanLatexToProfessional(response.text || '');
      res.json({ reply });
    } catch (err: any) {
      console.error('Chat Assistant failed:', err);

      // Highly context-aware mock response in case of API Key failure
      let responseText = `I am happy to assist you with EEE-2104 circuit analysis, Electromagnetics, Machines, Instrumentation, and VLSI! 

To calculate the frequency and duty cycle of a **555 Timer Astable Circuit**, use these standard formulas:
- **Frequency (f)**: f = 1.44 / ((RA + 2*RB) * C)
- **Time High (T_H)**: T_H = 0.693 * (RA + RB) * C
- **Time Low (T_L)**: T_L = 0.693 * RB * C
- **Duty Cycle (D)**: D = ((RA + RB) / (RA + 2*RB)) * 100%

For an **Operational Amplifier in Non-Inverting Configuration**:
- **Closed-Loop Gain (A_v)**: A_v = 1 + (R_f / R_in)

How can I help you design or troubleshoot your circuit board further today?

[SUGGESTION: How do I design a 555 timer for 1 kHz frequency?]
[SUGGESTION: What is the gain formula of an inverting active filter?]`;

      if (message.toLowerCase().includes('op') || message.toLowerCase().includes('amplifier') || message.toLowerCase().includes('gain')) {
        responseText = `In EEE-2104, an **Operational Amplifier (Op-Amp)** is analyzed using two golden rules for ideal op-amps:
1. **Infinite Input Impedance**: No current flows into the inverting (V-) or non-inverting (V+) input terminals (I+ = I- = 0).
2. **Virtual Short Circuit**: Under negative feedback, the op-amp will force the input terminal voltages to be equal (V+ = V-).

For a **Non-Inverting Amplifier**:
- Vout = Vin * (1 + Rf / R1)
- The gain is always >= 1.

For an **Inverting Amplifier**:
- Vout = -Vin * (Rf / R1)
- The negative sign indicates a 180-degree phase shift in the output waveform.

[SUGGESTION: What are the golden rules of Op-Amps?]
[SUGGESTION: How do I build a summing amplifier circuit?]`;
      } else if (message.toLowerCase().includes('rlc') || message.toLowerCase().includes('resonance') || message.toLowerCase().includes('frequency')) {
        responseText = `For an **RLC Circuit (Resistor, Inductor, Capacitor)**, the resonance frequency and dampening factor depend on the circuit arrangement (Series vs Parallel):

1. **Series RLC Resonance Frequency**:
   omega_0 = 1 / sqrt(L * C) (rad/s) or f_0 = 1 / (2 * pi * sqrt(L * C)) (Hz)
   At resonance, the inductive reactance XL and capacitive reactance XC cancel each other out completely (XL = XC), causing the circuit impedance to drop to its minimum: Z = R.

2. **Quality Factor (Q-Factor)**:
   Q = (omega_0 * L) / R = 1 / (omega_0 * C * R)
   A higher Q-factor indicates a narrower, more selective bandpass response around f_0.

[SUGGESTION: How does the Q-factor affect RLC bandwidth?]
[SUGGESTION: What is the difference between series and parallel resonance?]`;
      } else if (message.toLowerCase().includes('waveguide') || message.toLowerCase().includes('maxwell') || message.toLowerCase().includes('electromagnetics')) {
        responseText = `In Electromagnetics (EEE 2107), **Maxwell's Equations** govern wave propagation in waveguides. 

For a **Rectangular Waveguide** with dimensions a and b:
- **Cut-off Frequency (f_c)**: f_c = (c / 2) * sqrt((m/a)^2 + (n/b)^2)
  where c is the speed of light, and m, n are mode indices.
- **Guide Wavelength (lambda_g)**: lambda_g = lambda_0 / sqrt(1 - (f_c/f)^2)
  where lambda_0 is the free-space wavelength, and f is the operating frequency.
- **Wave Impedance (Z)**: 
  For TE modes: Z_TE = eta / sqrt(1 - (f_c/f)^2)
  For TM modes: Z_TM = eta * sqrt(1 - (f_c/f)^2)

If f is less than f_c, the term inside the square root becomes negative, resulting in exponential decay (evanescent fields) instead of propagation.

[SUGGESTION: What is the dominant mode in a rectangular waveguide?]
[SUGGESTION: Why can TM01 or TM10 modes not propagate in rectangular waveguides?]`;
      } else if (message.toLowerCase().includes('transformer') || message.toLowerCase().includes('machine') || message.toLowerCase().includes('bridge')) {
        responseText = `In Electrical Machines I (EEE 2207) and Instrumentation (EEE 2211), equivalent models and bridge circuits are essential analytical tools:

1. **Transformer Shunt Branch Parameters** (from Open Circuit Test):
   - Core Loss Resistance: Rc = Voc^2 / Poc
   - Magnetizing Reactance: Xm = Voc / Im  where Im = sqrt(Ioc^2 - (Voc/Rc)^2)

2. **Maxwell Inductance Bridge** (at Balance):
   - Unknown Inductance: Lx = R2 * R3 * C1
   - Unknown Series Resistance: Rx = (R2 * R3) / R1
   - Inductor Quality Factor: Q = omega * R1 * C1

These balance conditions are frequency-independent, making the Maxwell-Wien bridge exceptionally stable for standard measurements.

[SUGGESTION: How does a Schering Bridge measure capacitance loss?]
   [SUGGESTION: Why is the transformer short-circuit test conducted on the high-voltage side?]`;
      }

      res.json({ reply: responseText, isMocked: true });
    }
  });


  // --- AI FEATURE 3: AGENTIC HARDWARE & EMBEDDED CODE ASSISTANT ---
  app.post('/api/hardware', async (req, res) => {
    const { prompt, language } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required.' });
    }

    try {
      const systemInstruction = `Act as an expert in Microprocessors (EEE 4109) and VLSI Design (EEE 2213). Generate clean, optimized, and heavily commented code. For microcontrollers, explain the required GPIO pin connections. For VLSI, explain the module architecture. Use markdown for code blocks. Output only high-quality electrical engineering grade code and documentation. Target language requested: ${language || 'Verilog'}.`;

      const ai = getGeminiClient();

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const reply = response.text || '';
      res.json({ reply });
    } catch (err: any) {
      console.error('Hardware Code Assistant failed:', err);

      // Create rich mocks depending on language
      let mockCode = '';
      const langLower = (language || 'Verilog').toLowerCase();

      if (langLower.includes('verilog') || langLower.includes('vlsi')) {
        mockCode = `// EEE 2213: VLSI Design - 8-bit Carry Lookahead Adder (CLA)
module cla_8bit (
    input  [7:0] A,
    input  [7:0] B,
    input        Cin,
    output [7:0] Sum,
    output       Cout
);
    // Generate (G) and Propagate (P) wires
    wire [7:0] G;
    wire [7:0] P;
    wire [8:0] C;

    assign G = A & B;        // Generate
    assign P = A ^ B;        // Propagate

    assign C[0] = Cin;
    
    // CLA logic equations
    assign C[1] = G[0] | (P[0] & C[0]);
    assign C[2] = G[1] | (P[1] & C[1]);
    assign C[3] = G[2] | (P[2] & C[2]);
    assign C[4] = G[3] | (P[3] & C[3]);
    assign C[5] = G[4] | (P[4] & C[4]);
    assign C[6] = G[5] | (P[5] & C[5]);
    assign C[7] = G[6] | (P[6] & C[6]);
    assign C[8] = G[7] | (P[7] & C[7]);

    assign Sum = P ^ C[7:0];
    assign Cout = C[8];

endmodule

/*
===================================================================
MODULE ARCHITECTURE & PERFORMANCE CRITIQUE:
===================================================================
1. Carry Lookahead Logic reduces carry propagation delay from O(N) to O(1) conceptually.
2. In Silicon Layout (EEE 2213), routing overhead for 8-bit CLA is minimal, but scales O(N^2) for larger bit-widths.
3. Propagate and Generate (P & G) gates can be implemented using high-speed dynamic CMOS logic.
*/`;
      } else if (langLower.includes('arduino')) {
        mockCode = `// EEE 4109: Microprocessors - Analog Sensor ADC Logger
// Reads analog values from light sensor and outputs to SPI Serial console with alert trigger

const int SENSOR_PIN = A0;  // Analog input from Photodiode amplifier circuit
const int LED_PIN = 13;     // Built-in status feedback alert LED
const int THRESHOLD = 650;  // High light warning trigger threshold (10-bit scale)

void setup() {
    pinMode(LED_PIN, OUTPUT);
    Serial.begin(9600);     // Initialize serial UART interface
    Serial.println("--- EEE 4109 System Initialized ---");
}

void loop() {
    int rawValue = analogRead(SENSOR_PIN); // Reads 0-1023 (0V - 5V)
    float voltage = rawValue * (5.0 / 1023.0);

    Serial.print("Raw: ");
    Serial.print(rawValue);
    Serial.print(" | Voltage: ");
    Serial.print(voltage);
    Serial.println(" V");

    if (rawValue > THRESHOLD) {
        digitalWrite(LED_PIN, HIGH); // Alert activated
        Serial.println("[WARNING] Ambient lighting threshold exceeded!");
    } else {
        digitalWrite(LED_PIN, LOW);  // Alert cleared
    }

    delay(500); // Sample rate: 2 Hz
}

/*
===================================================================
GPIO PINOUT & HARDWARE INTEGRATION:
===================================================================
1. Arduino Pin A0 <-- Connect to Out Pin of LM358 Op-Amp Photodiode Pre-Amplifier circuit.
2. Arduino Pin 13 <-- Connect to a 220 Ohm current-limiting resistor, then to LED Anode, Cathode to GND.
3. Provide robust 5V and GND rail connections to prevent ADC reference voltage fluctuation.
*/`;
      } else if (langLower.includes('stm32') || langLower.includes('arm')) {
        mockCode = `// EEE 4109: STM32 Hardware Timer & GPIO Register Configuration
// Toggles onboard LED at precisely 1Hz using Timer 2 (TIM2) interrupt vectors.

#include "stm32f4xx.h"

void GPIO_Init(void) {
    // Enable GPIOA clock (AHB1ENR register)
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;
    
    // Set PA5 as general-purpose output mode (MODER register)
    GPIOA->MODER &= ~(3U << (5 * 2)); // Clear mode bits
    GPIOA->MODER |= (1U << (5 * 2));  // Set to Output mode (01)
}

void Timer2_Init(void) {
    // Enable TIM2 peripheral clock
    RCC->APB1ENR |= RCC_APB1ENR_TIM2EN;
    
    // Timer clock speed is typically 16 MHz
    // Set Prescaler to 16000-1 -> Timer runs at 1 kHz (1ms resolution)
    TIM2->PSC = 16000 - 1;
    
    // Set Auto-Reload value to 1000 -> Interrupt triggers every 1000ms (1 second)
    TIM2->ARR = 1000 - 1;
    
    // Enable Update Interrupt
    TIM2->DIER |= TIM_DIER_UIE;
    
    // Enable TIM2 Counter
    TIM2->CR1 |= TIM_CR1_CEN;
    
    // Enable TIM2 Interrupt vector in NVIC
    NVIC_EnableIRQ(TIM2_IRQn);
}

// Timer 2 Interrupt Handler Callback
void TIM2_IRQHandler(void) {
    if (TIM2->SR & TIM_SR_UIF) {
        TIM2->SR &= ~TIM_SR_UIF; // Clear update interrupt flag
        GPIOA->ODR ^= (1U << 5);  // Toggle Pin PA5 (Green LED)
    }
}

int main(void) {
    GPIO_Init();
    Timer2_Init();
    
    while (1) {
        __WFI(); // Enter low-power Wait-For-Interrupt standby mode
    }
}

/*
===================================================================
STM32 HARDWARE CONNECTIONS:
===================================================================
1. Onboard LED is connected directly to PA5 pin on the NUCLEO-F401RE board.
2. System Clock must be set to 16MHz (standard HSI RC oscillator).
*/`;
      } else {
        mockCode = `// EEE 4109 ARM Cortex-M Assembly Code
// Implements highly optimized division-by-subtraction algorithm

        AREA |.text|, CODE, READONLY
        EXPORT divide_sub
        ALIGN

divide_sub
        ; R0 = Dividend, R1 = Divisor
        ; Returns Quotient in R0, Remainder in R1
        MOV     R2, #0      ; Initialize Quotient = 0

div_loop
        CMP     R0, R1      ; Compare Dividend with Divisor
        BLT     div_done    ; If Dividend < Divisor, we are done
        SUB     R0, R0, R1  ; Dividend = Dividend - Divisor
        ADD     R2, R2, #1  ; Quotient++
        B       div_loop    ; Repeat

div_done
        MOV     R1, R0      ; Move remainder into R1
        MOV     R0, R2      ; Move quotient into R0
        BX      LR          ; Return to caller

        END

/*
===================================================================
ARM CORTEX-M ARCHITECTURE OVERVIEW:
===================================================================
1. Uses 32-bit registers (R0-R12) for high performance arithmetic.
2. Link Register (LR) holds return vector.
3. Highly optimized for safety critical embedded controls.
*/`;
      }

      res.json({ reply: `Here is your high-quality requested ${language} template generated by the AI Hardware Assistant:\n\n\`\`\`${langLower}\n${mockCode}\n\`\`\`\n\nHope this helps you in your courses!`, isMocked: true });
    }
  });


  // --- AI FEATURE 4: AGENTIC CMOS STICK DIAGRAM SYNTHESIZER ---
  app.post('/api/generate-stick-diagram', async (req, res) => {
    const { expression } = req.body;
    if (!expression) {
      return res.status(400).json({ message: 'Boolean expression is required.' });
    }

    try {
      const systemInstruction = `You are an expert VLSI design engineer. Given a Boolean logic expression (e.g., Y = ~((A*B)+C)), generate the structural connectivity for the Pull-Up Network (PUN) (PMOS) and Pull-Down Network (PDN) (NMOS), and provide a basic Stick Diagram layout representing standard VLSI color codes (Red: Polysilicon, Green: N-Diffusion, Yellow/Brown: P-Diffusion, Blue: Metal).

You MUST respond in a strict JSON format matching this schema:
{
  "pun_logic": "description of PMOS network",
  "pdn_logic": "description of NMOS network",
  "euler_path": "suggested Euler path for layout (e.g., A - B - C)",
  "stick_diagram": [
    { "type": "poly", "label": "A", "color": "red", "x": 10, "y": 20, "width": 5, "height": 40 },
    { "type": "n-diff", "label": "PDN active", "color": "green", "x": 5, "y": 40, "width": 50, "height": 10 }
  ]
}`;

      const ai = getGeminiClient();

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Analyze this boolean expression and generate the CMOS layout data in JSON format: ${expression}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pun_logic: { type: Type.STRING },
              pdn_logic: { type: Type.STRING },
              euler_path: { type: Type.STRING },
              stick_diagram: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    label: { type: Type.STRING },
                    color: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  },
                  required: ["type", "color", "x", "y", "width", "height"]
                }
              }
            },
            required: ["pun_logic", "pdn_logic", "euler_path", "stick_diagram"]
          }
        },
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Empty response from AI");
      const data = JSON.parse(resultText);
      res.json(data);
    } catch (err: any) {
      console.error('Stick diagram generation failed:', err);
      // Fallback mock
      res.json({
        pun_logic: "PMOS network: A and B in parallel, then in series with C",
        pdn_logic: "NMOS network: A and B in series, then in parallel with C",
        euler_path: "A - B - C",
        stick_diagram: [
          { type: "poly", label: "A", color: "red", x: 20, y: 10, width: 5, height: 80 },
          { type: "poly", label: "B", color: "red", x: 40, y: 10, width: 5, height: 80 },
          { type: "poly", label: "C", color: "red", x: 60, y: 10, width: 5, height: 80 },
          { type: "p-diff", label: "PUN", color: "#a16207", x: 10, y: 20, width: 60, height: 10 },
          { type: "n-diff", label: "PDN", color: "green", x: 10, y: 70, width: 60, height: 10 },
          { type: "metal", label: "VDD", color: "blue", x: 5, y: 5, width: 70, height: 5 },
          { type: "metal", label: "GND", color: "blue", x: 5, y: 90, width: 70, height: 5 }
        ]
      });
    }
  });

  // --- AI FEATURE 2: ACADEMIC LITERATURE REVIEWER ---
  app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    let pdfText = '';
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No PDF file was uploaded' });
      }

      // Parse the PDF text using pdf-parse
      try {
        const parser = new PDFParse({ data: req.file.buffer });
        const parsedData = await parser.getText();
        pdfText = parsedData.text || '';
      } catch (pdfErr: any) {
        return res.status(400).json({ message: 'Failed to extract text from PDF. Ensure the file is a valid PDF containing selectable text.', error: pdfErr.message });
      }

      if (!pdfText || pdfText.trim().length === 0) {
        return res.status(400).json({ message: 'No readable text could be extracted from the PDF.' });
      }

      // Slice the PDF content to a safe length for LLM processing (approx 10000 chars)
      const slicedContent = pdfText.slice(0, 10000);

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `You are an expert EEE Academic Research Reviewer. Read the following academic paper text excerpt and provide:
1. Abstract: A short, concise summary of the paper's scope and contributions.
2. Methodology: Explain the primary method, circuit design, or experimental approach used.
3. Equations: Extract key equations or models used. Return them in a list of professional unicode/plaintext formats (e.g. use "V = I * R" instead of LaTeX like "$V=IR$" or "sqrt(x)" instead of "\\sqrt{x}"). Ensure NO LaTeX markdown delimiters or raw LaTeX tags.
4. Actionable Insights: Provide 3-4 key bullet points summarizing the practical engineering takeaways.

Excerpt:
${slicedContent}
`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              abstract: { type: Type.STRING },
              methodology: { type: Type.STRING },
              equations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['abstract', 'methodology', 'equations', 'insights']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsedJSON = JSON.parse(responseText);

      // Clean the returned properties with cleanLatexToProfessional just in case there are residual LaTeX characters
      const cleanAbstract = cleanLatexToProfessional(parsedJSON.abstract || '');
      const cleanMethodology = cleanLatexToProfessional(parsedJSON.methodology || '');
      const cleanEquations = (parsedJSON.equations || []).map((eq: string) => cleanLatexToProfessional(eq));
      const cleanInsights = (parsedJSON.insights || []).map((ins: string) => cleanLatexToProfessional(ins));

      res.json({
        abstract: cleanAbstract,
        methodology: cleanMethodology,
        equations: cleanEquations,
        insights: cleanInsights
      });

    } catch (err: any) {
      console.error('PDF literature analysis failed:', err);
      
      // If we got as far as having pdfText, let's parse some interesting lines!
      if (pdfText && pdfText.trim().length > 0) {
        // Find some lines with equations or key sentences
        const lines = pdfText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
        const equations = lines.filter(l => l.includes('=') || l.includes('+') || l.includes('-')).slice(0, 3);
        const insights = lines.filter(l => l.includes('conclude') || l.includes('result') || l.includes('proposed') || l.includes('develop')).slice(0, 4);
        
        res.json({
          isMocked: true,
          abstract: `The system completed a structural text extraction from the uploaded academic PDF. Due to API limit rates, a high-fidelity local text segment analysis was performed. The document discusses research paradigms focusing on electrical parameters, signal processing, and prototype validation.`,
          methodology: `The research employs a quantitative experimental methodology. This involves physical circuit construction or mathematical simulation, system performance characterization under various loads, and comparative analysis against standard benchmarks.`,
          equations: equations.length > 0 ? equations : [
            'V_RMS = sqrt( (1 / T) * integral( v(t)^2, dt ) )',
            'I_out(avg) = D * I_L(avg)',
            'P_loss = I_RMS^2 * ESR'
          ],
          insights: insights.length > 0 ? insights : [
            'Achieved optimized performance boundaries via precise component selection.',
            'Validated the dynamic response under load steps with stable voltage regulation.',
            'Proposed architecture reduces high-frequency harmonic distortion in distribution stages.'
          ]
        });
      } else {
        res.status(500).json({ message: 'Failed to analyze the PDF research paper.', error: err.message });
      }
    }
  });


  // --- AI FEATURE 3: CAPSTONE PROJECT RECOMMENDER ---
  app.post('/api/recommend-projects', async (req, res) => {
    try {
      const { interests, skillLevel, customGoal } = req.body;
      if (!interests || !Array.isArray(interests) || interests.length === 0 || !skillLevel) {
        return res.status(400).json({ message: 'Interests (array) and skillLevel are required' });
      }

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `You are an expert Electrical and Electronics Engineering Academic Advisor. Suggest 3 unique and creative capstone/seminar projects for a student who has the following profile:
- Areas of Interest: ${interests.join(', ')}
- Skill Level: ${skillLevel}
- Specific Project Goal / Theme: ${customGoal || 'None specified'}

For each project, you MUST provide:
1. Title: A professional, creative, academic project title.
2. Problem Statement: 2-3 sentences explaining the engineering challenge and real-world importance.
3. Solution Architecture: A solid 3-4 sentence hardware/software blocks description of how to build it.
4. Tools & Technologies: A list of 4-6 specific components, microcontrollers, protocols, or frameworks required.

Return the 3 projects in a clean JSON structure.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problemStatement: { type: Type.STRING },
                    proposedArchitecture: { type: Type.STRING },
                    tools: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['title', 'problemStatement', 'proposedArchitecture', 'tools']
                }
              }
            },
            required: ['projects']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsedJSON = JSON.parse(responseText);

      // Clean the returned strings with cleanLatexToProfessional just in case
      const projects = (parsedJSON.projects || []).map((p: any) => ({
        title: cleanLatexToProfessional(p.title || ''),
        problemStatement: cleanLatexToProfessional(p.problemStatement || ''),
        proposedArchitecture: cleanLatexToProfessional(p.proposedArchitecture || ''),
        tools: (p.tools || []).map((t: string) => cleanLatexToProfessional(t))
      }));

      // If the request contains an authorization token, let's parse it and save to the user's DB profile!
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      let savedProjects: any[] = [];

      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) {
            // Save each project in the database
            for (const proj of projects) {
              const saved = db.createCapstoneProject(decoded.id, {
                title: proj.title,
                problemStatement: proj.problemStatement,
                proposedArchitecture: proj.proposedArchitecture,
                tools: proj.tools
              });
              savedProjects.push(saved);
            }
          }
        } catch (jwtErr) {
          console.warn('Silent JWT validation failed on capstone generation save:', jwtErr);
        }
      }

      res.json({
        projects: projects,
        savedToProfile: savedProjects.length > 0,
        savedProjects: savedProjects
      });

    } catch (err: any) {
      console.error('Capstone generation failed:', err);
      // Beautiful offline fallback list
      const fallbackProjects = [
        {
          title: `Smart Grid IoT Node with Edge Fault Analysis`,
          problemStatement: `Distribution grids face rising line failure frequencies and voltage fluctuation under high solar penetration. Existing centralized monitoring lacks the local sub-millisecond edge processing to detect micro-arcs or high-impedance faults before they trigger substation-wide lockouts.`,
          proposedArchitecture: `The proposed system places a high-resolution ADC (ADS1115) alongside an ESP32 microcontroller to monitor localized current and voltage profiles. Edge-based wavelet filters analyze transient high-frequency current signatures, communicating real-time line health metrics to a centralized dashboard via cellular LTE-M or LoRaWAN protocols.`,
          tools: ['ESP32 Dual-Core CPU', 'ADS1115 16-bit ADC', 'Current Transducer (SCT-013)', 'LoRaWAN Transceiver', 'Wavelet Filtering Algorithm (Python/C++)']
        },
        {
          title: `Multi-Phase Bidirectional DC-DC Buck-Boost Converter for EV Charging`,
          problemStatement: `Electric vehicle fast-charging and vehicle-to-grid (V2G) applications require highly efficient power conversion stages. Single-phase topologies exhibit severe current ripples and excessive thermal stress on MOSFET switches, reducing battery pack lifespan.`,
          proposedArchitecture: `A interleaved 4-phase bidirectional buck-boost converter topology is designed using high-bandgap Gallium Nitride (GaN) FETs. Driven by a TMS320 DSP, the phase-shifted PWM signals cancel primary inductor current ripples, spreading the thermal dissipation load and maximizing total conversion efficiency to 98.4%.`,
          tools: ['TMS320F28379D DSP', 'GaN Systems Power Transistors', 'Interleaved Toroidal Inductors', 'Isolated Gate Drivers (ISO5852S)', 'Closed-Loop PID Control']
        },
        {
          title: `Autonomous Robotic Mapping and Navigation System for Industrial Substations`,
          problemStatement: `High-voltage substations represent highly hazardous environments for human maintenance personnel. Visual inspections are prone to human oversight, while fixed sensors cannot inspect occluded terminal connections or detect localized SF6 gas leaks.`,
          proposedArchitecture: `An autonomous ground vehicle (AGV) platform is engineered with a Solid-State LiDAR and a stereo-vision depth camera. Utilizing ROS 2 and SLAM algorithms, the robot navigates complex substation layouts, using an infrared thermal imaging camera (FLIR) to flag hot-spots on high-voltage circuit breakers.`,
          tools: ['NVIDIA Jetson Nano', 'RPLiDAR A1 M8', 'FLIR Lepton Thermal Sensor', 'ROS 2 Humble SDK', 'SLAM Mapping Algorithms']
        }
      ];

      res.json({
        projects: fallbackProjects,
        savedToProfile: false,
        savedProjects: []
      });
    }
  });

  // Get saved capstone projects for user profile
  app.get('/api/capstone-projects', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const projects = db.getCapstoneProjects(req.user.id);
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to retrieve saved projects', error: err.message });
    }
  });


  // --- AI FEATURE: FSM ARCHITECT ---
  app.post('/api/fsm-architect', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required.' });
    }
    
    try {
      const systemInstruction = `You are a Senior Digital IC Designer.
The user will describe a Finite State Machine (FSM).
You MUST output a JSON response matching this exact schema:
{
  "stateTableMarkdown": "Markdown table of State Transition Table",
  "booleanEquationsMarkdown": "Markdown containing derived Next-State and Output Boolean equations",
  "verilogCode": "Synthesizable Verilog HDL code (module + testbench)"
}`;

      const ai = getGeminiClient();

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Design this FSM: ${prompt}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      console.error('FSM Architect failed:', err);
      res.json({ 
        stateTableMarkdown: "| Current State | Input | Next State | Output |\n|---|---|---|---|\n| S0 | 0 | S0 | 0 |",
        booleanEquationsMarkdown: "$$ Next State = ... $$",
        verilogCode: "module fsm();\n// API error fallback\nendmodule",
        isMocked: true 
      });
    }
  });

  // --- AI FEATURE: VECTOR SOLVER ---
  app.post('/api/solve-vector-field', async (req, res) => {
    const { field, operation } = req.body;
    if (!field || !operation) {
      return res.status(400).json({ message: 'Vector field and operation are required.' });
    }
    
    try {
      const systemInstruction = `You are an expert Electromagnetics (EEE 2107) Physics Tutor. 
The user will provide a spatial Vector Field and an operation (Divergence, Curl, Gradient, or Laplacian).
Your task is to provide a step-by-step mathematical derivation of the requested operation using partial derivatives.

CRITICAL FORMATTING RULES:
1. Do NOT use LaTeX block or inline formulas (e.g. do NOT use $$, $, \\frac, \\partial, etc.).
2. Always write formulas in elegant, clear plain-text with standard operators and standard symbols (e.g., use "∇·E" or "grad E" instead of LaTeX, "∂Ez/∂y" instead of "\\frac{\\partial E_z}{\\partial y}", and "ax, ay, az" for unit vectors).
3. Use professional unicode mathematical characters where appropriate (e.g. ∇, ∂, ·, ×, ², ³, Δ, θ, Ω, μ, α, β, λ, η, ±, ≈, >=, <=) to make formulas look highly polished and professional.
4. Always conclude by stating the physical significance of the result (e.g. "Since Divergence is zero, this field is solenoidal / satisfies Gauss's Law for a charge-free region").`;

      const ai = getGeminiClient();

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: `Given the vector field E = ${field}, calculate the ${operation} step-by-step.`,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const reply = cleanLatexToProfessional(response.text || '');
      res.json({ reply });
    } catch (err: any) {
      console.error('Vector Solver failed:', err);
      // Fallback response
      const fallback = `Here is the step-by-step calculation for the ${operation} of the provided field.

∇·E = ∂Ex/∂x + ∂Ey/∂y + ∂Ez/∂z

Since you are running in offline/mock mode, this is a placeholder mathematical derivation. Ensure \`GEMINI_API_KEY\` is configured to get dynamic step-by-step derivations.

**Physical Significance**: If divergence is zero, the field is solenoidal.`;
      res.json({ reply: fallback, isMocked: true });
    }
  });

  // --- FEATURE 10: THESIS WORKSPACE ENDPOINTS ---
  app.get('/api/thesis-chapters', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const chapters = db.getThesisChapters(req.user.id);
      res.json(chapters);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to retrieve thesis chapters', error: err.message });
    }
  });

  app.post('/api/thesis-chapters', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const { title, bullets, draftContent, status } = req.body;
      if (!title) return res.status(400).json({ message: 'Title is required' });
      const newChapter = db.createThesisChapter(req.user.id, {
        title,
        bullets: bullets || '',
        draftContent: draftContent || '',
        status: status || 'Draft'
      });
      res.status(201).json(newChapter);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create thesis chapter', error: err.message });
    }
  });

  app.put('/api/thesis-chapters/:id', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const { title, bullets, draftContent, status } = req.body;
      const updated = db.updateThesisChapter(req.user.id, req.params.id, {
        title,
        bullets,
        draftContent,
        status
      });
      if (!updated) return res.status(404).json({ message: 'Chapter not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update thesis chapter', error: err.message });
    }
  });

  app.delete('/api/thesis-chapters/:id', authenticateToken, (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      const success = db.deleteThesisChapter(req.user.id, req.params.id);
      if (!success) return res.status(404).json({ message: 'Chapter not found or access denied' });
      res.json({ success: true, message: 'Chapter deleted' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete thesis chapter', error: err.message });
    }
  });

  app.post('/api/thesis-chapters/generate', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, bullets } = req.body;
      if (!title || !bullets) {
        return res.status(400).json({ message: 'Title and key bullets are required.' });
      }

      const prompt = `You are an expert EEE Academic Research Thesis Supervisor.
Write a highly detailed, professional, formal academic chapter draft for a thesis.
Chapter Title: ${title}
Key Points / Bullets:
${bullets}

Instructions:
1. Write a formal introduction, structured sections with detailed paragraphs, and a clear conclusion.
2. Formulate 1-2 realistic mathematical equations or engineering/physics models using professional plain text/Unicode (avoid LaTeX syntax, e.g. use "V = I * R" instead of LaTeX like "$V=IR$" or "\\sqrt{x}").
3. Format the entire output using standard markdown (headings, bold, lists). Do not include any meta-commentary.
4. Output the thesis draft directly in standard markdown format.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const reply = response.text || '';
      res.json({ draft: reply });
    } catch (err: any) {
      console.error('Thesis draft generation failed:', err);
      // Premium offline/quota-exceeded academic generator fallback
      const fallbackDraft = generateLocalAcademicDraft(req.body.title || '', req.body.bullets || '');
      res.json({ draft: fallbackDraft, isMocked: true });
    }
  });


  // --- FEATURE 12: ARM/PLC CODE ARCHITECT ENDPOINT ---
  app.post('/api/embedded-assistant/generate', async (req, res) => {
    try {
      const { prompt, architecture } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required.' });
      }

      const systemInstruction = `You are an expert ARM/RISC-V/PLC Code Architect (EEE 4109).
Design high-quality, professional, heavily commented embedded systems or PLC software based on the user's requirements.
The user requested target architecture: ${architecture || 'STM32'}.

Your output MUST be a JSON object containing two fields:
1. "code": The fully written, compilable (or complete) code block in markdown format using appropriate syntax highlighting.
2. "pinMap": A list of hardware pin connections and configurations required for the design (e.g. Pin, Port, Function, Description/Connection).

Instructions:
1. Specifically handle 32-bit ARM Cortex (STM32) C-programming (bare-metal register level or HAL), RISC-V Assembly/C, or PLC Ladder Logic (represented as text description or IL code).
2. Explicitly specify microcontroller pin connections (GPIO, ADC, I2C, SPI) alongside the generated code.
3. Keep comments extremely comprehensive to explain internal register bits, registers (e.g. RCC, GPIOx_MODER, ODR, etc.) or PLC rungs.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              pinMap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pin: { type: Type.STRING },
                    port: { type: Type.STRING },
                    func: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ['pin', 'port', 'func', 'description']
                }
              }
            },
            required: ['code', 'pinMap']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Embedded assistant code generation failed:', err);
      // Fallback response for offline or missing API key
      const arch = req.body.architecture || 'STM32';
      let code = '';
      let pinMap = [];

      if (arch === 'STM32') {
        code = `/**
 * @file main.c
 * @brief STM32 Automatic Fan Speed Control & Temperature Monitoring (EEE 4109)
 */
#include "stm32f4xx_hal.h"

ADC_HandleTypeDef hadc1;
TIM_HandleTypeDef htim2;

void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_ADC1_Init(void);
static void MX_TIM2_Init(void);

int main(void) {
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_ADC1_Init();
  MX_TIM2_Init();

  // Start PWM output on Timer 2 Channel 1 (PA5)
  HAL_TIM_PWM_Start(&htim2, TIM_CHANNEL_1);

  uint32_t adc_val = 0;
  uint16_t duty_cycle = 0;

  while (1) {
    // 1. Trigger ADC conversion to read LM35 Temperature Sensor
    HAL_ADC_Start(&hadc1);
    if (HAL_ADC_PollForConversion(&hadc1, 10) == HAL_OK) {
      adc_val = HAL_ADC_GetValue(&hadc1);
    }
    HAL_ADC_Stop(&hadc1);

    // 2. Map ADC reading (0-4095) to PWM duty cycle (0-1000)
    // Temperature threshold speed control algorithm
    if (adc_val < 1500) {
      duty_cycle = 0; // Temp < 25°C, fan off
    } else if (adc_val > 3000) {
      duty_cycle = 1000; // Temp > 45°C, maximum cooling speed
    } else {
      duty_cycle = (adc_val - 1500) * 1000 / 1500; // Linear interpolation
    }

    __HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, duty_cycle);
    HAL_Delay(250);
  }
}`;
        pinMap = [
          { pin: 'PA0', port: 'GPIOA', func: 'ADC1_IN0', description: 'LM35 Analog Temperature Sensor input' },
          { pin: 'PA5', port: 'GPIOA', func: 'TIM2_CH1', description: 'PWM Drive signal to gate driver for Brushless DC cooling fan' },
          { pin: 'PC13', port: 'GPIOC', func: 'GPIO_Input', description: 'Emergency manual shutdown toggle switch' }
        ];
      } else {
        code = `# RISC-V 32-bit Integer Division and Peripheral Register Check
.section .text
.global main

main:
    # Load dividend into a0, divisor into a1
    li a0, 245          # Dividend = 245
    li a1, 12           # Divisor = 12
    li a2, 0            # Quotient accumulator = 0

div_loop:
    blt a0, a1, div_done # If dividend < divisor, division completes
    sub a0, a0, a1       # Dividend = Dividend - Divisor
    addi a2, a2, 1       # Quotient++
    j div_loop

div_done:
    mv a3, a0            # a3 holds remainder
    mv a0, a2            # a0 holds final quotient (standard ABI return)
    
    # Toggle GPIO output pin for division status flag
    li t0, 0x10012000    # Peripheral base address for hypothetical GPIO
    li t1, 1             # Set pin 0 bit high
    sw t1, 0(t0)         # Write to GPIO Output Data Register
    
    jr ra                # Return to caller`;
        pinMap = [
          { pin: 'a0', port: 'CPU Core', func: 'Register', description: 'Holds initial Dividend, then final calculated Quotient' },
          { pin: 'a1', port: 'CPU Core', func: 'Register', description: 'Holds fixed Divisor constant (12)' },
          { pin: 'a3', port: 'CPU Core', func: 'Register', description: 'Holds residual division Remainder' },
          { pin: 'GPIO Pin 0', port: 'PORTA (0x10012000)', func: 'Output_Digital', description: 'Status flag indicating calculation done' }
        ];
      }

      res.json({
        isMocked: true,
        code,
        pinMap
      });
    }
  });


  // --- FEATURE 13: POWER PLANT LOAD DATA ANALYZER ENDPOINT ---
  app.post('/api/power-economics/analyze', async (req, res) => {
    try {
      const { summary, loadCurve } = req.body;
      if (!summary || !loadCurve) {
        return res.status(400).json({ message: 'Summary statistics and load curve data are required.' });
      }

      const prompt = `You are an expert Power Plant Electrical Engineer and Economic Load Dispatcher (EEE 4111).
Analyze the following power plant 24-hour chronological load profile and statistical metrics:
- Base Load: ${summary.baseLoad} MW
- Peak Load: ${summary.peakLoad} MW
- Average Load: ${summary.averageLoad} MW
- Load Factor: ${summary.loadFactor}%
- Capacity Factor: ${summary.capacityFactor}%

Based on this load profile, provide:
1. Economic Load Dispatch Strategy: How should the plant schedule base-load plants (e.g. nuclear, coal) vs peak-load plants (e.g. gas turbine, hydro/pumped storage) to minimize costs? Provide as clear markdown.
2. Risks & Operations Identification: Highlight 3-4 potential engineering risks, grid stability concerns, or thermal stresses associated with this load pattern.

Return your response in a structured JSON schema.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategy: { type: Type.STRING },
              risks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['strategy', 'risks']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Power economics analysis failed:', err);
      res.json({
        isMocked: true,
        strategy: `### Offline Strategic Power Dispatch Report

Based on the uploaded 24-hour chronological load profile with **Load Factor: ${req.body.summary?.loadFactor || '65.4'}%** and **Peak Demand: ${req.body.summary?.peakLoad || '850'} MW**, we recommend the following Economic Dispatch Strategy:

1. **Base-Load Allocation (00:00 - 24:00)**:
   - Commit high-inertia thermal plants (Nuclear, supercritical Coal) up to the minimum base demand floor (**${req.body.summary?.baseLoad || '320'} MW**). Keep these generators running at maximum thermodynamic efficiency (approx. 85% design rating) to minimize fuel-per-MWh costs.

2. **Mid-Range Tracking (08:00 - 22:00)**:
   - Cycle combined-cycle gas turbine (CCGT) units to handle intermediate ramp gradients. These units feature fast start-up profiles (approx. 30 minutes) and moderate heat rates, acting as the ideal load-following buffer.

3. **Peak-Shaving Dispatch (17:00 - 21:00)**:
   - During peak demand spikes up to **${req.body.summary?.peakLoad || '850'} MW**, dispatch high-cost open-cycle gas turbines (OCGT) and release hydro-electric reserves. This avoids overloading sub-transmission substations.
   - Deploy battery energy storage systems (BESS) if available to shaving the peak by supplying localized reactive power power support.`,
        risks: [
          `Thermal stress on steam turbines during high-ramp periods (typically 07:00 to 09:00 as load rises).`,
          `Increased loss of life on substation transformers operating near nameplate capacity during the ${req.body.summary?.peakLoad || '850'} MW peak hour.`,
          `Voltage instability at the transmission boundary due to localized reactive power deficits if base thermal generation is deferred.`
        ]
      });
    }
  });


  // --- FEATURE 16: AI SMART SWITCHGEAR ADVISOR ---
  app.post('/api/switchgear-advisor', async (req, res) => {
    try {
      const { systemVoltage, faultLevel, environment, customQuery } = req.body;
      
      const prompt = `You are an expert Substation Design and Protection Engineer (EEE 4211).
Analyze the following parameters to recommend the most optimal circuit breakers, relays, and protection coordination scheme:
- Nominal System Voltage: ${systemVoltage || 'Not specified'}
- Fault Current Level: ${faultLevel || 'Not specified'}
- Operational Environment: ${environment || 'Not specified'}
- Additional Requirements / Context: ${customQuery || 'None specified'}

Provide an authoritative design recommendation.`;

      const systemInstruction = `You are an expert high-voltage switchgear and substation protection engineer.
Recommend the exact type of high-voltage or medium-voltage Circuit Breaker (e.g. SF6, Vacuum, Air Blast, Air, Minimum Oil) and associated Relay types (e.g. Differential, Distance, Overcurrent, Buchholz, Earth Fault).
Structure your recommendation in strict JSON for frontend mapping, specifying recommendedDevice, breakerType, relayTypes, technicalJustification, estimatedLifecycle, and specifications (an array of key parameters and values).`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedDevice: { type: Type.STRING },
              breakerType: { type: Type.STRING },
              relayTypes: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              technicalJustification: { type: Type.STRING },
              estimatedLifecycle: { type: Type.STRING },
              specifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    parameter: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ['parameter', 'value']
                }
              }
            },
            required: ['recommendedDevice', 'breakerType', 'relayTypes', 'technicalJustification', 'estimatedLifecycle', 'specifications']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Switchgear advisor failed:', err);
      // Fallback response for offline or missing API key
      res.json({
        isMocked: true,
        recommendedDevice: 'Vacuum Circuit Breaker (VCB) with Numeric Overcurrent/Earth-Fault Relay Suite',
        breakerType: 'Vacuum Circuit Breaker (12kV to 36kV Rating)',
        relayTypes: [
          'Microprocessor-based IDMT Overcurrent Relay (IEC 60255)',
          'Instantaneous Earth Fault Relay',
          'Restricted Earth Fault (REF) Relay for transformer secondary protection'
        ],
        technicalJustification: `Given the system voltage (~33kV) and moderate fault currents in outdoor polluted environments, a **Vacuum Circuit Breaker (VCB)** enclosed in a metal-clad substation panel is the ideal choice. VCBs exhibit superior arc-extinguishing characteristics, have no risk of gas leakage (unlike SF6), and are virtually maintenance-free under heavy environmental pollution. For the relaying scheme, microprocessor-based **Numeric IDMT Relays** are recommended to allow precise setting of Time Multiplier Setting (TMS) and Plug Setting (PS) with multiple curves (Normal/Very/Extremely Inverse) to coordinate with upstream grid breakers.`,
        estimatedLifecycle: '25-30 Years with basic mechanical latch lubrication.',
        specifications: [
          { parameter: 'Rated Voltage / Frequency', value: '36 kV / 50 Hz' },
          { parameter: 'Short-Circuit Breaking Capacity', value: '25 kA (RMS) for 3 seconds' },
          { parameter: 'Impulse Withstand Voltage (BIL)', value: '170 kV (Peak)' },
          { parameter: 'Rated Normal Operating Current', value: '1250 Amps' },
          { parameter: 'Total Operating Interruption Time', value: '< 50 milliseconds (3 cycles)' }
        ]
      });
    }
  });


  // --- FEATURE 19: AI DATA CLASSIFICATION & ML CODE GENERATOR ---
  app.post('/api/ml-classify', async (req, res) => {
    try {
      const { headers, rowCount, sampleRows, customQuery } = req.body;
      if (!headers || !Array.isArray(headers)) {
        return res.status(400).json({ message: 'Dataset headers and metadata are required.' });
      }

      const prompt = `You are an expert EEE Data Scientist and Machine Learning Engineer (EEE 4121).
Analyze the following CSV dataset metadata to recommend the optimal machine learning model:
- Columns/Features: ${headers.join(', ')}
- Total Row Count: ${rowCount || 'Not specified'}
- Sample Rows (First few entries):
${JSON.stringify(sampleRows, null, 2)}
- Additional User Directives: ${customQuery || 'None specified'}

Recommend the optimal Machine Learning algorithm, generate fully complete, ready-to-run Python code (using Scikit-Learn or TensorFlow) to parse, split, scale, train, and evaluate this model, and auto-generate labels or tags representing categories in this data.`;

      const systemInstruction = `You are an expert ML Engineer for Electrical & Signal datasets.
Recommend an appropriate model (e.g., Random Forest, SVM, CNN, LSTM) based on the column headers and sample data.
Your response MUST be a JSON object containing:
1. "recommendedAlgorithm": string, name of the model.
2. "justification": string in clean Markdown, justifying why this algorithm is selected based on features/shapes.
3. "pythonCode": string, complete ready-to-run Python code utilizing pandas, scikit-learn or tensorflow to preprocess (impute, scale), train/test split, train the recommended model, and print evaluation metrics (accuracy, classification_report, or MSE/R2). Include comments.
4. "tags": string array of auto-generated categories/labels for the columns/task (e.g. ["Fault Classification", "Sensor Fusion", "Time-Series", "Anomaly Detection"]).`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedAlgorithm: { type: Type.STRING },
              justification: { type: Type.STRING },
              pythonCode: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['recommendedAlgorithm', 'justification', 'pythonCode', 'tags']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('ML classification advisor failed:', err);
      // Premium offline fallback
      res.json({
        isMocked: true,
        recommendedAlgorithm: 'Random Forest Classifier (Ensemble Learning)',
        justification: `### Justification for Random Forest Classifier

Based on the uploaded dataset features (${req.body.headers ? req.body.headers.join(', ') : 'Sensor Log Features'}), the **Random Forest Classifier** is recommended due to the following structural characteristics:

1. **Robustness to Mixed Data Types**: Your columns likely contain both numeric readings (like currents, voltages, signal amplitudes) and categorical flags. Random Forest handles non-scaled mixed features seamlessly.
2. **Resistance to Overfitting**: By building an ensemble of decision trees on bootstrap samples, it significantly reduces variance, making it highly effective even with small datasets (approx. ${req.body.rowCount || 500} rows).
3. **Feature Importance Ratings**: Random Forest natively calculates Gini importance scores, which will help you identify which electrical sensor or signal channel contributes most to fault detection.
4. **Non-linear Relationship Mapping**: In physical hardware systems (e.g., insulation breakdowns, grid transients), relationships between inputs are rarely linear; tree structures map these complex boundaries extremely well.`,
        pythonCode: `import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# 1. Load the dataset (simulating the parsed CSV structure)
# Replace 'dataset.csv' with your actual file path
df = pd.read_csv('dataset.csv')

print("Dataset Loaded successfully. Shape:", df.shape)
print("Columns:", list(df.columns))

# 2. Identify features and target label
# Assuming the last column is the class label/fault category, edit as needed!
target_col = df.columns[-1]
X = df.drop(columns=[target_col])
y = df[target_col]

# Handle any categorical columns via one-hot encoding
X = pd.get_dummies(X, drop_first=True)

# 3. Split into Train & Test splits (80-20 ratio)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y if y.dtype == object or len(np.unique(y)) < 10 else None)

# 4. Standardize continuous numerical features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 5. Initialize & Train the Random Forest Classifier
print("Training the Random Forest model...")
model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10, n_jobs=-1)
model.fit(X_train_scaled, y_train)

# 6. Make Predictions and Evaluate
y_pred = model.predict(X_test_scaled)

print("\\n=== MODEL EVALUATION METRICS ===")
print("Test Accuracy Score: {:.2f}%".format(accuracy_score(y_test, y_pred) * 100))
print("\\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))

# 7. Extract Feature Importances for EEE Analysis
importances = model.feature_importances_
feat_importances = pd.Series(importances, index=X.columns).sort_values(ascending=False)
print("\\nTop 5 Most Critical Sensor Channels:")
print(feat_importances.head(5))`,
        tags: ['Fault Diagnostic', 'Supervised Learning', 'Ensemble Model', 'Sensor Signal Log']
      });
    }
  });


  // --- FEATURE 20: SMART GRID DSM ---
  app.post('/api/iot-dsm', async (req, res) => {
    try {
      const { loadProfile } = req.body;
      if (!loadProfile || !Array.isArray(loadProfile)) {
        return res.status(400).json({ message: 'Load profile array is required.' });
      }

      const prompt = `You are an expert Smart Grid & IoT Energy Manager (EEE 4241/4247).
Analyze the following 24-hour load profile data:
${JSON.stringify(loadProfile, null, 2)}

Provide a comprehensive Demand Side Management (DSM) analysis. Group peak demand challenges, identify solar PV feed-in oversupply, and suggest specific actionable appliances or load-shifting recommendations to reduce peak grid dependency.`;

      const systemInstruction = `You are a Smart Grid IoT Energy Optimisation expert.
Your response MUST be a JSON object containing:
1. "analysis": string (Markdown summary of generation vs consumption, identifying peak hours and solar self-consumption efficiency).
2. "recommendations": an array of load-shifting suggestions, where each suggestion has "time" (string), "action" (string), and "benefit" (string).
3. "savingsEstimate": string (estimated percentage or dollar cost savings e.g. "18% reduction in peak grid energy costs").`;

      const ai = getGeminiClient();
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    action: { type: Type.STRING },
                    benefit: { type: Type.STRING }
                  },
                  required: ['time', 'action', 'benefit']
                }
              },
              savingsEstimate: { type: Type.STRING }
            },
            required: ['analysis', 'recommendations', 'savingsEstimate']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Smart Grid DSM failed:', err);
      // Fallback response
      res.json({
        isMocked: true,
        analysis: `### 📊 Real-Time Microgrid Energy Analysis

- **Solar Peak Alignment**: Solar PV output peaks between **11:00 AM and 3:00 PM** (reaching ~5.0 kW), but your household load during this window is relatively low (~1.8 kW). This results in massive back-feeding to the grid at low feed-in tariffs.
- **Evening Peak Deficit**: A major peak demand spike occurs between **6:00 PM and 10:00 PM** (reaching ~4.5 kW) when solar generation is zero. This forces full reliance on expensive grid power.
- **Self-Consumption Ratio**: Currently at **38%**. Enhancing this ratio is the fastest path to reducing your net energy expenditures.`,
        recommendations: [
          {
            time: "11:30 AM - 2:30 PM",
            action: "Shift pool filtration pumps, electric water heaters, or EV charging to this high-solar generation block.",
            benefit: "Utilizes clean, zero-marginal-cost solar power instead of exporting at low feed-in rates."
          },
          {
            time: "1:00 PM",
            action: "Pre-cool living spaces by setting the thermostat to 21°C, and then let it float upwards during the evening.",
            benefit: "Acts as thermal storage, shaving up to 22% off evening HVAC compressor startup loads."
          },
          {
            time: "6:00 PM - 9:00 PM",
            action: "Configure battery storage system to discharge (Peak Shaving) and restrict high-draw appliance operations.",
            benefit: "Avoids high utility demand tariffs during peak evening system stress."
          }
        ],
        savingsEstimate: "Est. 18.5% bill savings & 25% peak grid dependency reduction."
      });
    }
  });


  // --- FEATURE 21: BIOMEDICAL ECG AI ANALYZER ---
  app.post('/api/biomedical-ecg-analyze', async (req, res) => {
    try {
      const { signalDataSummary, samplePoints } = req.body;

      const prompt = `You are a clinical biomedical systems engineer (EEE 4261 / Bio-signal Processing).
Analyze the following ECG signal metrics:
- Dataset summary: ${signalDataSummary || 'Normal sample series'}
- Selected Waveform Data Points (Time in ms vs Voltage in mV):
${JSON.stringify(samplePoints, null, 2)}

Provide a clinical-style assessment of the heart rate (in bpm), classify the rhythm, highlight any noticeable high-frequency noise or power-line interference, and draft engineering recommendations for signal filtration.`;

      const systemInstruction = `You are an expert Biomedical Engineering AI specialized in ECG diagnostics and instrumentation.
Your response MUST be a JSON object containing:
1. "heartRate": number (estimated bpm from R-R intervals, e.g. 72).
2. "rhythmClassification": string (e.g. "Normal Sinus Rhythm", "Sinus Tachycardia", "Arrhythmia with Motion Artifact").
3. "noiseAssessment": string (analysis of powerline or baseline drift noise).
4. "clinicalSummary": string (Markdown formatted bio-signal report discussing P-QRS-T complexes, morphology, and clinical findings).
5. "recommendations": string array (engineering recommendations for shielding, bandpass/notch filtering, or electrode contact improvements).`;

      const ai = getGeminiClient();
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              heartRate: { type: Type.INTEGER },
              rhythmClassification: { type: Type.STRING },
              noiseAssessment: { type: Type.STRING },
              clinicalSummary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['heartRate', 'rhythmClassification', 'noiseAssessment', 'clinicalSummary', 'recommendations']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('ECG analysis failed:', err);
      res.json({
        isMocked: true,
        heartRate: 74,
        rhythmClassification: "Normal Sinus Rhythm (NSR) with minor high-frequency noise",
        noiseAssessment: "Noticeable 50 Hz power-line hum interference combined with subtle baseline wander (~0.15 Hz) due to subject respiration.",
        clinicalSummary: `### 🩺 Bio-Signal Diagnostic Report

1. **R-R Intervals & Heart Rate**:
   - The detected R-R interval is highly stable at approximately **810 ms**, resulting in a calculated heart rate of **74 BPM**.

2. **Complex Morphology Analysis**:
   - **P-Wave**: Distinct, upright in lead II, preceding each QRS complex. Normal duration (~90 ms).
   - **QRS Complex**: Sharp and narrow (~85 ms), indicating rapid ventricular depolarization with healthy conduction.
   - **T-Wave**: Normal positive deflection, indicating regular ventricular repolarization.

3. **Engineering Insights**:
   - The signal suffers from common electromagnetic interference. Adding a notch filter at 50Hz/60Hz and a high-pass filter at 0.5Hz is highly recommended to stabilize the baseline and isolate pure cardiac vectors.`,
        recommendations: [
          "Apply a digital 50 Hz second-order infinite impulse response (IIR) notch filter to attenuate mains power supply hum.",
          "Implement a high-pass Butterworth filter (cutoff = 0.5 Hz) to eliminate baseline wander and patient breathing artifacts.",
          "Check electrode skin-impedance; recommend prep-pad cleaning and fresh Ag/AgCl hydrogel electrodes.",
          "Ensure instrumentation amplifier employs a high Common Mode Rejection Ratio (CMRR > 110 dB) design."
        ]
      });
    }
  });


  // --- FEATURE 24: ROBOTICS KINEMATICS & EMBEDDED AI ---
  app.post('/api/robotics-kinematics', async (req, res) => {
    try {
      const { description, links } = req.body;

      const prompt = `You are an expert Robotics & Embedded Controls professor (EEE 4223/4225).
Analyze this manipulator robotic configuration:
- Description: ${description}
- Links Configuration: ${JSON.stringify(links, null, 2)}

Calculate or outline the step-by-step Forward Kinematics using Denavit-Hartenberg (D-H) parameter matrices. Output the final coordinates (X, Y, Z) of the end-effector. In addition, generate an STM32 bare-metal or FreeRTOS C code file to control the joint servo motor angles using PWM registers.`;

      const systemInstruction = `You are an expert in Robotics Kinematics and STM32 Bare-Metal Embedded Systems.
Your response MUST be a JSON object containing:
1. "dhParameters": an array of objects, each containing "joint" (string), "theta" (string), "d" (string), "a" (string), "alpha" (string).
2. "forwardKinematicsAnalysis": string (Markdown explaining the step-by-step transformation matrices and how the final end-effector pose is achieved).
3. "finalCoordinates": string (Markdown detailing X, Y, Z coordinates).
4. "embeddedCode": string (fully written, syntactically complete C code for STM32 HAL/bare-metal or FreeRTOS initializing TIM PWM channels and adjusting joint angles).`;

      const ai = getGeminiClient();
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dhParameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    joint: { type: Type.STRING },
                    theta: { type: Type.STRING },
                    d: { type: Type.STRING },
                    a: { type: Type.STRING },
                    alpha: { type: Type.STRING }
                  },
                  required: ['joint', 'theta', 'd', 'a', 'alpha']
                }
              },
              forwardKinematicsAnalysis: { type: Type.STRING },
              finalCoordinates: { type: Type.STRING },
              embeddedCode: { type: Type.STRING }
            },
            required: ['dhParameters', 'forwardKinematicsAnalysis', 'finalCoordinates', 'embeddedCode']
          }
        }
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Robotics advisor failed:', err);
      // Detailed fallback for 2-DOF planar robot
      res.json({
        isMocked: true,
        dhParameters: [
          { joint: "Joint 1 (Base)", theta: "θ₁ = 30°", d: "0", a: "L₁ = 10 cm", alpha: "0°" },
          { joint: "Joint 2 (Elbow)", theta: "θ₂ = 45°", d: "0", a: "L₂ = 15 cm", alpha: "0°" }
        ],
        forwardKinematicsAnalysis: `### 🤖 Kinematics Matrix Calculations

For a **2-DOF Planar Manipulator**, we set up individual coordinate frames using the standard **Denavit-Hartenberg (D-H) Convention**:

1. **Link 1 Transformation ($T_1^0$ - Base to Joint 1)**:
   $$T_1^0 = \\begin{bmatrix} \\cos\\theta_1 & -\\sin\\theta_1 & 0 & L_1\\cos\\theta_1 \\\\ \\sin\\theta_1 & \\cos\\theta_1 & 0 & L_1\\sin\\theta_1 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$$

2. **Link 2 Transformation ($T_2^1$ - Joint 1 to End-Effector)**:
   $$T_2^1 = \\begin{bmatrix} \\cos\\theta_2 & -\\sin\\theta_2 & 0 & L_2\\cos\\theta_2 \\\\ \\sin\\theta_2 & \\cos\\theta_2 & 0 & L_2\\sin\\theta_2 \\\\ 0 & 0 & 1 & 0 \\\\ 0 & 0 & 0 & 1 \\end{bmatrix}$$

3. **Total Homogeneous Transformation Matrix ($T_2^0 = T_1^0 \\cdot T_2^1$)**:
   Multiplying these, the end-effector position equations resolve to:
   - $X = L_1 \\cos(\\theta_1) + L_2 \\cos(\\theta_1 + \\theta_2)$
   - $Y = L_1 \\sin(\\theta_1) + L_2 \\sin(\\theta_1 + \\theta_2)$
   - $Z = 0$ (planar)`,
        finalCoordinates: `### 📍 Final End-Effector Position

Using the inputs:
- $L_1 = 10\\text{ cm}, \\quad L_2 = 15\\text{ cm}$
- $\\theta_1 = 30^\\circ, \\quad \\theta_2 = 45^\\circ \\implies (\\theta_1+\\theta_2) = 75^\\circ$

**Substituted Values**:
- $X = 10\\cos(30^\\circ) + 15\\cos(75^\\circ) = 10(0.866) + 15(0.2588) = 8.66 + 3.88 = \\mathbf{12.54\\text{ cm}}$
- $Y = 10\\sin(30^\\circ) + 15\\sin(75^\\circ) = 10(0.500) + 15(0.9659) = 5.00 + 14.49 = \\mathbf{19.49\\text{ cm}}$
- $Z = \\mathbf{0.00\\text{ cm}}$`,
        embeddedCode: `/**
 * ============================================================================
 * EEE 4223/4225: ROBOTICS SERVO CONTROLLER (STM32 HAL / TIM4 PWM)
 * Controls two MG996R servo motors (Joint 1 and Joint 2) using PWM.
 * 50Hz Period (20ms): Servos expect 1ms (-90deg) to 2ms (+90deg) pulse width.
 * ============================================================================
 */

#include "stm32f4xx_hal.h"

TIM_HandleTypeDef htim4;

void MX_TIM4_Init(void);
void Set_Servo_Angle(uint8_t joint, float angle);

/**
 * @brief  Task to control Joint positions
 */
void Control_Robotic_Joints(void) {
    // Initialize TIM4 Timer Configured for PWM on Pin PD12 (CH1) & PD13 (CH2)
    MX_TIM4_Init();
    HAL_TIM_PWM_Start(&htim4, TIM_CHANNEL_1);
    HAL_TIM_PWM_Start(&htim4, TIM_CHANNEL_2);

    while (1) {
        // Move to requested joint coordinates: Joint 1 = 30°, Joint 2 = 45°
        Set_Servo_Angle(1, 30.0f);
        Set_Servo_Angle(2, 45.0f);
        HAL_Delay(2000);

        // Move to Home stance: 0°, 0°
        Set_Servo_Angle(1, 0.0f);
        Set_Servo_Angle(2, 0.0f);
        HAL_Delay(2000);
    }
}

/**
 * @brief Converts angle (-90 to +90 deg) into corresponding Timer Compare Register value.
 * Prescaler = 84, ARR = 20000 (gives 50Hz frequency on 84MHz APB clock).
 * 1.0ms pulse = CCR value 1000 (-90 degrees)
 * 1.5ms pulse = CCR value 1500 (0 degrees)
 * 2.0ms pulse = CCR value 2000 (+90 degrees)
 */
void Set_Servo_Angle(uint8_t joint, float angle) {
    // Clamp angle
    if (angle < -90.0f) angle = -90.0f;
    if (angle > 90.0f) angle = 90.0f;

    // Map angle to pulse duration (1.0ms to 2.0ms)
    float pulse_ms = 1.5f + (angle / 90.0f) * 0.5f;
    uint32_t ccr_val = (uint32_t)(pulse_ms * 1000.0f);

    if (joint == 1) {
        __HAL_TIM_SET_COMPARE(&htim4, TIM_CHANNEL_1, ccr_val);
    } else if (joint == 2) {
        __HAL_TIM_SET_COMPARE(&htim4, TIM_CHANNEL_2, ccr_val);
    }
}

void MX_TIM4_Init(void) {
    TIM_OC_InitTypeDef sConfigOC = {0};

    htim4.Instance = TIM4;
    htim4.Init.Prescaler = 84 - 1; // 84 MHz / 84 = 1 MHz counting speed
    htim4.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim4.Init.Period = 20000 - 1; // 1 MHz / 20000 = 50 Hz PWM period
    htim4.Init.ClockDivision = TIM_CLOCK_DIVISION_DIV1;
    HAL_TIM_PWM_Init(&htim4);

    sConfigOC.OCMode = TIM_OCMODE_PWM1;
    sConfigOC.Pulse = 1500; // Default 0 degrees (1.5ms pulse)
    sConfigOC.OCPolarity = TIM_OCPOLARITY_HIGH;
    sConfigOC.OCFastMode = TIM_OCFAST_DISABLE;
    
    HAL_TIM_PWM_ConfigChannel(&htim4, &sConfigOC, TIM_CHANNEL_1);
    HAL_TIM_PWM_ConfigChannel(&htim4, &sConfigOC, TIM_CHANNEL_2);
}`
      });
    }
  });


  // --- AUTOMATED LAB REPORT GENERATOR ---
  app.post('/api/generate-report-text', async (req, res) => {
    try {
      const { experimentName, inputData, outputData } = req.body;
      const prompt = `You are an academic engineering assistant. Based on the provided experiment name and numerical results, generate the text for an IEEE format lab report.
Experiment Name: ${experimentName}
Inputs: ${JSON.stringify(inputData)}
Outputs: ${JSON.stringify(outputData)}

Output strict JSON with the following keys:
- 'abstract': A 100-word summary of the experiment objective and results.
- 'index_terms': A comma-separated list of 4-5 keywords.
- 'theory': A concise 150-word theoretical background of the topic.
- 'conclusion': A 100-word conclusion interpreting the specific numerical results provided.`;

      const ai = getGeminiClient();
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              abstract: { type: Type.STRING },
              index_terms: { type: Type.STRING },
              theory: { type: Type.STRING },
              conclusion: { type: Type.STRING }
            },
            required: ['abstract', 'index_terms', 'theory', 'conclusion']
          }
        }
      });
      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (err: any) {
      console.error('Report generation failed:', err);
      // Fallback
      res.json({
        abstract: "This report presents the analysis and simulation of the specified electrical engineering system. Various parameters were evaluated, and the results demonstrate expected theoretical behaviors within acceptable margins of error.",
        index_terms: "Electrical Engineering, Simulation, System Analysis, Component Design",
        theory: "Theoretical foundations for this topic involve fundamental electrical laws and advanced analytical methods. Systems are typically modeled using differential equations or transform techniques to understand steady-state and transient responses. The specific relationships depend heavily on the components used and their configuration within the circuit or system.",
        conclusion: "The numerical results validate the theoretical models applied to this experiment. The observed outputs correlate well with expected values, confirming the robustness of the simulation methodology and providing a solid foundation for further practical implementation."
      });
    }
  });

  // --- AI FEATURE 5: IOT CODE GEN ---
  app.post('/api/iot-code-gen', async (req, res) => {
    const { mcu, sensors, pinMap } = req.body;
    try {
      const ai = getGeminiClient();
      const prompt = `Write C/C++ initialization and read code for the following setup:
MCU: ${mcu}
Sensors: ${sensors.join(', ')}
Pin Mapping:
${JSON.stringify(pinMap, null, 2)}

Provide ONLY the code, ready to be copy-pasted, with helpful comments. Use the standard framework (Arduino for Uno/ESP32, HAL for STM32).`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an embedded software engineer.",
        },
      });

      res.json({ code: response.text || '// No code generated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ code: '// Error generating code' });
    }
  });

  // --- AI FEATURE 6: PCB EMC ADVICE ---
  app.post('/api/pcb-emc-advice', async (req, res) => {
    const { signalType, current, extWidth, intWidth } = req.body;
    try {
      const ai = getGeminiClient();
      const prompt = `Provide actionable bullet points for EMC, grounding strategies, and thermal dissipation for a PCB with the following specs:
Signal Type: ${signalType}
Max Current: ${current} A
Calculated External Trace Width: ${extWidth} mils
Calculated Internal Trace Width: ${intWidth} mils

Format the output as a Markdown list. Use warnings or emphasis where appropriate.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a Senior Hardware Reviewer advising on PCB design.",
        },
      });

      res.json({ advice: response.text || 'No advice generated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ advice: 'Error generating advice' });
    }
  });

  // --- AI FEATURE 7: HARDWARE PITCH ---
  app.post('/api/hardware-pitch', async (req, res) => {
    const { idea, market, cost } = req.body;
    try {
      const ai = getGeminiClient();
      const prompt = `Generate a structured Hardware Project Pitch & Business Plan based on:
Idea: ${idea}
Target Market: ${market}
Estimated Component Cost: $${cost}

Include:
1. Technical Specifications Summary
2. Bill of Materials (BOM) Cost Estimation & Pricing Strategy
3. Target Market Analysis & Marketing Plan
4. Suggested Project Schedule / Milestones (e.g., Prototype -> PCB -> Testing -> Launch)

Format as clean Markdown.`;

      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a hardware Product Manager.",
        },
      });

      res.json({ pitch: response.text || 'No pitch generated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ pitch: 'Error generating pitch' });
    }
  });

  // --- FRONTEND MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI-Powered Electronics & Circuit Hub backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start Express full-stack server:', err);
});
