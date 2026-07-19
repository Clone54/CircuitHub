import { ComponentItem } from './types';

export const seedData: ComponentItem[] = [
  {
    id: 'lm358',
    title: 'LM358 Operational Amplifier',
    description: 'Highly versatile, industry-standard dual operational amplifier designed for single-supply operation.',

    fullDescription: 'The LM358 consists of two independent, high-gain, internally frequency compensated operational amplifiers designed specifically to operate from a single power supply over a wide range of voltages. Operation from split power supplies is also possible, and the low power supply current drain is independent of the magnitude of the power supply voltage. This operational amplifier is exceptionally suited for EEE-2104 active filters, DC gain blocks, and general signal amplification circuits.',
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

export const seedStats = [
  { id: 'jan', month: 'Jan', ActiveUsers: 320, ComponentScans: 450, Queries: 1200, order: 1 },
  { id: 'feb', month: 'Feb', ActiveUsers: 480, ComponentScans: 680, Queries: 1800, order: 2 },
  { id: 'mar', month: 'Mar', ActiveUsers: 640, ComponentScans: 950, Queries: 2500, order: 3 },
  { id: 'apr', month: 'Apr', ActiveUsers: 890, ComponentScans: 1400, Queries: 3600, order: 4 },
  { id: 'may', month: 'May', ActiveUsers: 1100, ComponentScans: 1950, Queries: 4900, order: 5 },
  { id: 'jun', month: 'Jun', ActiveUsers: 1450, ComponentScans: 2600, Queries: 6800, order: 6 },
  { id: 'jul', month: 'Jul', ActiveUsers: 1850, ComponentScans: 3500, Queries: 9400, order: 7 }
];

export const seedFAQs = [
  {
    id: 'faq1',
    q: 'How does the Gemini Datasheet Analyzer process PDF files?',
    a: 'Our backend uses the Google Gemini API. When you upload a datasheet or copy raw technical specification text, our system reads and processes the text parameters. It extracts structured fields, including exact pin configurations, thermal parameters, and typical application setups, rendering them in neat bullet points and tables.',
    order: 1
  },
  {
    id: 'faq2',
    q: 'Are the interactive calculations calibrated for real physical hardware?',
    a: 'Yes! The calculations for the 555 Astable timer frequency (f = 1.44 / ((Ra + 2Rb) * C)) and Non-Inverting Op-Amp Closed-Loop Gain (Av = 1 + Rf/R1) are fully aligned with standard physics equations and active laboratory manuals. Note that physical components have tolerance values (e.g. 5% or 10% tolerance resistors) which may slightly drift from mathematical theory in real life.',
    order: 2
  },
  {
    id: 'faq3',
    q: 'Can I add my own customized circuits and components to the explore directory?',
    a: 'Absolutely! Once registered and logged in, you can navigate to your Developer Dashboard, click on "Add Component Spec" and input names, specifications (table style), category details, and images. They will immediately become part of the central explore directory and can be analyzed by other engineers.',
    order: 3
  },
  {
    id: 'faq4',
    q: 'Who maintains this electronics engineering repository?',
    a: 'This application is built, tested, and actively managed by Firoz Ahmed, specifically formatted to support researchers and scholars seeking rapid reference tools.',
    order: 4
  }
];

export const seedTestimonials = [
  {
    id: 'test1',
    quote: '"CircuitHub has completely saved my EEE university exams. The op-amp gain and active filter calculations are accurate and help us double-check physical lab board parameters."',
    authorName: 'Ananya Rao',
    authorRole: 'EEE Student, Section B',
    initials: 'AR',
    order: 1
  },
  {
    id: 'test2',
    quote: '"The Datasheet Analyzer works beautifully. Uploading complex manufacturer specification sheets and immediately receiving pin-out summary tables saves immense time in our prototyping stages."',
    authorName: 'David Harrison',
    authorRole: 'Embedded Engineer, MakerLab',
    initials: 'DH',
    order: 2
  },
  {
    id: 'test3',
    quote: '"The AI Chat Assistant provides excellent mathematical derivations. I asked it to explain Astable multivibrators, and it step-by-step analyzed the duty cycle resistors. Highly accurate teaching assistant."',
    authorName: 'Dr. Sarah Jenkins',
    authorRole: 'Associate Professor, Department of EEE',
    initials: 'DR',
    order: 3
  }
];

