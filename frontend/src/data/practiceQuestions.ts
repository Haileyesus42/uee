export type PracticeQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const BANKS: Record<string, PracticeQuestion[]> = {
  mathematics: [
    {
      prompt: 'Solve for x: 3x − 9 = 0',
      options: ['x = 3', 'x = −3', 'x = 9', 'x = 0'],
      correctIndex: 0,
      explanation: 'Add 9 to both sides then divide by 3: x = 9/3 = 3.',
    },
    {
      prompt: 'What is the value of 5² − 3²?',
      options: ['4', '8', '16', '34'],
      correctIndex: 2,
      explanation: '25 − 9 = 16.',
    },
    {
      prompt: 'A line has slope 2 and passes through (0, 1). What is its equation?',
      options: ['y = 2x + 1', 'y = x + 2', 'y = 2x − 1', 'y = 1x + 2'],
      correctIndex: 0,
      explanation: 'Slope-intercept form y = mx + b with m = 2 and b = 1 gives y = 2x + 1.',
    },
    {
      prompt: 'Simplify: (x²)(x³)',
      options: ['x⁵', 'x⁶', 'x⁹', '2x⁵'],
      correctIndex: 0,
      explanation: 'When multiplying powers with the same base, add the exponents: 2 + 3 = 5.',
    },
    {
      prompt: 'What is 15% of 200?',
      options: ['15', '20', '30', '45'],
      correctIndex: 2,
      explanation: '0.15 × 200 = 30.',
    },
  ],
  physics: [
    {
      prompt: 'What is the SI unit of force?',
      options: ['Joule', 'Watt', 'Newton', 'Pascal'],
      correctIndex: 2,
      explanation: 'Force is measured in Newtons (N), defined as kg·m/s².',
    },
    {
      prompt: 'An object in free fall accelerates due to gravity at approximately…',
      options: ['9.8 m/s²', '9.8 m/s', '9.8 N', '9.8 km/h²'],
      correctIndex: 0,
      explanation: "Earth's gravitational acceleration is about 9.8 m/s².",
    },
    {
      prompt: 'Which quantity is a vector?',
      options: ['Speed', 'Distance', 'Velocity', 'Mass'],
      correctIndex: 2,
      explanation: 'Velocity has both magnitude and direction, making it a vector quantity.',
    },
    {
      prompt: 'Work is calculated as…',
      options: ['Force × time', 'Force × distance', 'Mass × acceleration', 'Mass × velocity'],
      correctIndex: 1,
      explanation: 'Work = Force × displacement in the direction of the force.',
    },
  ],
  chemistry: [
    {
      prompt: 'What is the atomic number of an element determined by?',
      options: ['Number of neutrons', 'Number of protons', 'Number of electrons only', 'Atomic mass'],
      correctIndex: 1,
      explanation: 'The atomic number equals the number of protons in the nucleus.',
    },
    {
      prompt: 'Which of these is a noble gas?',
      options: ['Oxygen', 'Nitrogen', 'Neon', 'Hydrogen'],
      correctIndex: 2,
      explanation: 'Neon is a noble gas found in Group 18 of the periodic table.',
    },
    {
      prompt: 'A covalent bond is formed by…',
      options: ['Transferring electrons', 'Sharing electrons', 'Sharing protons', 'Transferring neutrons'],
      correctIndex: 1,
      explanation: 'Covalent bonds form when atoms share pairs of electrons.',
    },
  ],
  biology: [
    {
      prompt: 'What is the powerhouse of the cell?',
      options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'],
      correctIndex: 2,
      explanation: 'Mitochondria produce ATP, the cell’s main energy currency.',
    },
    {
      prompt: 'DNA replication occurs during which phase of the cell cycle?',
      options: ['G1', 'S phase', 'G2', 'Mitosis'],
      correctIndex: 1,
      explanation: 'DNA is replicated during the synthesis (S) phase of interphase.',
    },
    {
      prompt: 'Which organelle is responsible for photosynthesis?',
      options: ['Chloroplast', 'Mitochondria', 'Nucleus', 'Vacuole'],
      correctIndex: 0,
      explanation: 'Chloroplasts contain chlorophyll and carry out photosynthesis in plant cells.',
    },
  ],
  english: [
    {
      prompt: 'Choose the correctly punctuated sentence.',
      options: [
        "Its a beautiful day, isn't it?",
        "It's a beautiful day, isn't it?",
        "Its' a beautiful day, isnt it?",
        'It is a beautiful day isnt it',
      ],
      correctIndex: 1,
      explanation: '"It\'s" is the contraction of "it is," and the sentence needs a question mark.',
    },
    {
      prompt: 'Identify the synonym of "abundant."',
      options: ['Scarce', 'Plentiful', 'Empty', 'Rare'],
      correctIndex: 1,
      explanation: '"Abundant" means existing in large quantities, i.e. plentiful.',
    },
    {
      prompt: 'Which sentence uses the correct verb tense?',
      options: [
        'She have finished her homework.',
        'She has finished her homework.',
        'She having finished her homework.',
        'She finish her homework.',
      ],
      correctIndex: 1,
      explanation: 'Third-person singular present perfect uses "has," not "have."',
    },
  ],
  aptitude: [
    {
      prompt: 'What comes next in the series: 2, 4, 8, 16, __?',
      options: ['24', '30', '32', '20'],
      correctIndex: 2,
      explanation: 'Each term doubles the previous one: 16 × 2 = 32.',
    },
    {
      prompt: 'If 5 workers finish a job in 6 days, how many days would 10 workers take?',
      options: ['3', '6', '12', '5'],
      correctIndex: 0,
      explanation: 'Doubling the workers halves the time: 6 ÷ 2 = 3 days.',
    },
    {
      prompt: 'A train travels 60 km in 45 minutes. What is its speed in km/h?',
      options: ['60 km/h', '80 km/h', '75 km/h', '90 km/h'],
      correctIndex: 1,
      explanation: '60 km in 0.75 hours = 60 ÷ 0.75 = 80 km/h.',
    },
  ],
  civics: [
    {
      prompt: "How many regional states are recognized in Ethiopia's federal structure?",
      options: ['9', '10', '11', '12'],
      correctIndex: 1,
      explanation: "Ethiopia's federal system currently recognizes 10 regional states plus 2 chartered cities.",
    },
    {
      prompt: 'What is the primary role of a constitution?',
      options: [
        'To list national holidays',
        'To establish the fundamental laws and rights of a state',
        'To manage foreign trade',
        'To set tax rates',
      ],
      correctIndex: 1,
      explanation: 'A constitution establishes the fundamental structure, laws, and rights of a state.',
    },
    {
      prompt: 'Which of these is considered a civic duty rather than a right?',
      options: ['Freedom of speech', 'Paying taxes', 'Freedom of religion', 'Right to a fair trial'],
      correctIndex: 1,
      explanation: 'Paying taxes is a civic duty citizens owe to the state, unlike the other options, which are rights.',
    },
  ],
};

export function getPracticeQuestions(subjectId: string, count: number): PracticeQuestion[] {
  const bank = BANKS[subjectId] ?? BANKS.mathematics;
  const questions: PracticeQuestion[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(bank[i % bank.length]);
  }
  return questions;
}
