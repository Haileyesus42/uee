// Ports the frontend's mock data (src/data/curriculum.ts, lessonContent.ts,
// practiceQuestions.ts) into real rows — docs/backend-architecture.md §11: "this is
// mechanical ... and should be the very first migration, so the app can run against
// Postgres with zero visible change before any new feature is added."
//
// Lesson `status` from curriculum.ts is intentionally NOT copied — that was
// hand-authored demo progress for a single mock user. Real progress now lives in
// UserLessonProgress, computed per-user (see src/modules/curriculum/routes.ts).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Grade = 9 | 10 | 11 | 12;
type SeedLesson = { id: string; title: string };
type SeedUnit = { id: string; title: string; description: string; grade: Grade; lessons: SeedLesson[] };
type SeedSubject = { id: string; name: string; icon: string; units: SeedUnit[] };

const SUBJECTS: SeedSubject[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'calculator-outline',
    units: [
      {
        id: 'geometry',
        title: 'Geometry',
        grade: 9,
        description: 'Shapes, angles, and the relationships between them.',
        lessons: [
          { id: 'shapes-angles', title: 'Shapes & Angles' },
          { id: 'triangles', title: 'Triangles' },
          { id: 'circles', title: 'Circles' },
        ],
      },
      {
        id: 'algebra',
        title: 'Algebra',
        grade: 10,
        description: 'Build the foundations you need for every other unit — equations, patterns, and functions.',
        lessons: [
          { id: 'algebra-foundations', title: 'Algebra Foundations' },
          { id: 'linear-equations', title: 'Linear Equations' },
          { id: 'quadratic-equations', title: 'Quadratic Equations' },
          { id: 'functions', title: 'Functions' },
          { id: 'calculus-intro', title: 'Calculus' },
        ],
      },
      {
        id: 'trigonometry',
        title: 'Trigonometry',
        grade: 11,
        description: 'Angles, ratios, and the functions that describe them.',
        lessons: [
          { id: 'trig-ratios', title: 'Trigonometric Ratios' },
          { id: 'trig-identities', title: 'Trigonometric Identities' },
        ],
      },
      {
        id: 'calculus-advanced',
        title: 'Calculus',
        grade: 12,
        description: 'Limits, derivatives, and integrals — the mathematics of change.',
        lessons: [
          { id: 'limits-continuity', title: 'Limits & Continuity' },
          { id: 'derivatives-integrals', title: 'Derivatives & Integrals' },
        ],
      },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: 'planet-outline',
    units: [
      {
        id: 'physics-foundations',
        title: 'Physics Foundations',
        grade: 9,
        description: 'Measurement, units, and the basics of motion.',
        lessons: [
          { id: 'measurement-units', title: 'Measurement & Units' },
          { id: 'motion-basics', title: 'Motion Basics' },
        ],
      },
      {
        id: 'waves-sound',
        title: 'Waves & Sound',
        grade: 10,
        description: 'How waves carry energy, and the physics of sound.',
        lessons: [
          { id: 'wave-properties', title: 'Wave Properties' },
          { id: 'sound-waves', title: 'Sound Waves' },
        ],
      },
      {
        id: 'mechanics',
        title: 'Mechanics',
        grade: 11,
        description: "Forces, motion, and Newton's laws — the physics behind everything that moves.",
        lessons: [
          { id: 'newtons-laws', title: "Newton's Laws" },
          { id: 'motion-forces', title: 'Motion & Forces' },
          { id: 'energy-work', title: 'Energy & Work' },
        ],
      },
      {
        id: 'electricity-magnetism',
        title: 'Electricity & Magnetism',
        grade: 12,
        description: 'Circuits, magnetic fields, and how the two connect.',
        lessons: [
          { id: 'electric-circuits', title: 'Electric Circuits' },
          { id: 'magnetism', title: 'Magnetism' },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'flask-outline',
    units: [
      {
        id: 'atomic-structure',
        title: 'Atomic Structure',
        grade: 9,
        description: 'The building blocks of matter, from atoms to the periodic table.',
        lessons: [
          { id: 'atoms-elements', title: 'Atoms & Elements' },
          { id: 'periodic-table', title: 'The Periodic Table' },
          { id: 'bonding', title: 'Chemical Bonding' },
        ],
      },
      {
        id: 'chemical-reactions',
        title: 'Chemical Reactions',
        grade: 10,
        description: 'How substances transform, and the math behind it.',
        lessons: [
          { id: 'types-of-reactions', title: 'Types of Reactions' },
          { id: 'stoichiometry', title: 'Stoichiometry' },
        ],
      },
      {
        id: 'organic-chemistry',
        title: 'Organic Chemistry',
        grade: 11,
        description: 'Carbon-based compounds and the groups that define them.',
        lessons: [
          { id: 'hydrocarbons', title: 'Hydrocarbons' },
          { id: 'functional-groups', title: 'Functional Groups' },
        ],
      },
      {
        id: 'acids-bases',
        title: 'Acids & Bases',
        grade: 12,
        description: 'Acid-base theory and how to measure it.',
        lessons: [
          { id: 'acid-base-theory', title: 'Acid-Base Theory' },
          { id: 'ph-titration', title: 'pH & Titration' },
        ],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'leaf-outline',
    units: [
      {
        id: 'intro-biology',
        title: 'Intro to Biology',
        grade: 9,
        description: 'What defines life, and how living things are classified.',
        lessons: [
          { id: 'characteristics-of-life', title: 'Characteristics of Life' },
          { id: 'classification', title: 'Classification' },
        ],
      },
      {
        id: 'cell-biology',
        title: 'Cell Biology',
        grade: 10,
        description: 'The structure and function of the basic unit of life.',
        lessons: [
          { id: 'cell-structure', title: 'Cell Structure' },
          { id: 'cell-division', title: 'Cell Division' },
          { id: 'genetics-intro', title: 'Genetics' },
        ],
      },
      {
        id: 'human-physiology',
        title: 'Human Physiology',
        grade: 11,
        description: "How the body's major systems keep you alive.",
        lessons: [
          { id: 'digestive-system', title: 'Digestive System' },
          { id: 'circulatory-system', title: 'Circulatory System' },
        ],
      },
      {
        id: 'ecology-evolution',
        title: 'Ecology & Evolution',
        grade: 12,
        description: 'Ecosystems, and how species change over time.',
        lessons: [
          { id: 'ecosystems', title: 'Ecosystems' },
          { id: 'evolution-theory', title: 'Evolution Theory' },
        ],
      },
    ],
  },
  {
    id: 'english',
    name: 'English',
    icon: 'book-outline',
    units: [
      {
        id: 'grammar',
        title: 'Grammar & Usage',
        grade: 9,
        description: 'The rules that make your writing clear and correct.',
        lessons: [
          { id: 'sentence-structure', title: 'Sentence Structure' },
          { id: 'punctuation', title: 'Punctuation' },
          { id: 'comprehension', title: 'Reading Comprehension' },
        ],
      },
      {
        id: 'writing-skills',
        title: 'Writing Skills',
        grade: 10,
        description: 'Structuring your ideas into clear, organized writing.',
        lessons: [
          { id: 'essay-writing', title: 'Essay Writing' },
          { id: 'paragraph-structure', title: 'Paragraph Structure' },
        ],
      },
      {
        id: 'literature',
        title: 'Literature',
        grade: 11,
        description: 'Reading and analyzing poetry and prose.',
        lessons: [
          { id: 'poetry-analysis', title: 'Poetry Analysis' },
          { id: 'prose-analysis', title: 'Prose Analysis' },
        ],
      },
      {
        id: 'advanced-comprehension',
        title: 'Advanced Comprehension',
        grade: 12,
        description: 'Critical reading and summarizing at exam level.',
        lessons: [
          { id: 'critical-reading', title: 'Critical Reading' },
          { id: 'summary-writing', title: 'Summary Writing' },
        ],
      },
    ],
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    icon: 'bulb-outline',
    units: [
      {
        id: 'basic-numeracy',
        title: 'Basic Numeracy',
        grade: 9,
        description: 'Core number sense and simple arithmetic.',
        lessons: [
          { id: 'number-basics', title: 'Number Basics' },
          { id: 'simple-arithmetic', title: 'Simple Arithmetic' },
        ],
      },
      {
        id: 'verbal-reasoning',
        title: 'Verbal Reasoning',
        grade: 10,
        description: 'Analogies and vocabulary in context.',
        lessons: [
          { id: 'analogies', title: 'Analogies' },
          { id: 'vocabulary-context', title: 'Vocabulary in Context' },
        ],
      },
      {
        id: 'logical-reasoning',
        title: 'Logical Reasoning',
        grade: 11,
        description: 'Syllogisms and pattern recognition.',
        lessons: [
          { id: 'syllogisms', title: 'Syllogisms' },
          { id: 'pattern-recognition', title: 'Pattern Recognition' },
        ],
      },
      {
        id: 'quantitative-reasoning',
        title: 'Quantitative Reasoning',
        grade: 12,
        description: 'Numerical logic, patterns, and problem-solving under time pressure.',
        lessons: [
          { id: 'number-series', title: 'Number Series' },
          { id: 'logical-patterns', title: 'Logical Patterns' },
          { id: 'word-problems', title: 'Word Problems' },
          { id: 'data-interpretation', title: 'Data Interpretation' },
        ],
      },
    ],
  },
  {
    id: 'civics',
    name: 'Civics',
    icon: 'people-outline',
    units: [
      {
        id: 'government-citizenship',
        title: 'Government & Citizenship',
        grade: 9,
        description: "Ethiopia's constitution, civic rights, and responsibilities.",
        lessons: [
          { id: 'constitution-basics', title: 'Constitution Basics' },
          { id: 'rights-duties', title: 'Rights & Duties' },
          { id: 'government-structure', title: 'Government Structure' },
        ],
      },
      {
        id: 'rule-of-law',
        title: 'Rule of Law',
        grade: 10,
        description: 'The legal system and human rights.',
        lessons: [
          { id: 'legal-system-basics', title: 'Legal System Basics' },
          { id: 'human-rights', title: 'Human Rights' },
        ],
      },
      {
        id: 'ethiopian-governance',
        title: 'Ethiopian Governance',
        grade: 11,
        description: 'Federalism and the political party system.',
        lessons: [
          { id: 'federalism', title: 'Federalism' },
          { id: 'political-parties', title: 'Political Parties' },
        ],
      },
      {
        id: 'global-citizenship',
        title: 'Global Citizenship',
        grade: 12,
        description: 'International relations and global issues.',
        lessons: [
          { id: 'international-relations', title: 'International Relations' },
          { id: 'global-issues', title: 'Global Issues' },
        ],
      },
    ],
  },
];

type LessonStep =
  | { type: 'explanation'; heading: string; body: string }
  | { type: 'example'; heading: string; body: string; steps: string[] }
  | { type: 'question'; prompt: string; options: string[]; correctIndex: number; hint: string; explanation: string };

const LESSON_CONTENT: Record<string, LessonStep[]> = {
  'quadratic-equations': [
    {
      type: 'explanation',
      heading: 'What is a quadratic equation?',
      body: 'A quadratic equation is any equation where the highest power of x is 2, written in the form ax² + bx + c = 0.',
    },
    {
      type: 'example',
      heading: 'Solving by factoring',
      body: "Let's solve x² − 5x + 6 = 0 by factoring.",
      steps: [
        'Find two numbers that multiply to 6 and add to −5: −2 and −3',
        'Rewrite the equation: (x − 2)(x − 3) = 0',
        'Either factor can equal zero: x = 2 or x = 3',
      ],
    },
    {
      type: 'question',
      prompt: 'Solve: x² − 7x + 12 = 0',
      options: ['x = 3 or x = 4', 'x = 2 or x = 6', 'x = 1 or x = 12', 'x = −3 or x = −4'],
      correctIndex: 0,
      hint: 'Find two numbers that multiply to 12 and add to −7.',
      explanation: '12 = 3 × 4 and 3 + 4 = 7, so (x − 3)(x − 4) = 0, giving x = 3 or x = 4.',
    },
    {
      type: 'question',
      prompt: 'What is the standard form of a quadratic equation?',
      options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + c = 0', 'a/x + b = 0'],
      correctIndex: 1,
      hint: 'Think about the highest power of x in a quadratic.',
      explanation: 'A quadratic has degree 2, so its standard form is ax² + bx + c = 0.',
    },
  ],
  'newtons-laws': [
    {
      type: 'explanation',
      heading: "Newton's First Law",
      body: 'An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted on by a net external force. This is the law of inertia.',
    },
    {
      type: 'example',
      heading: 'Spotting the net force',
      body: 'A book sits still on a table.',
      steps: [
        'Gravity pulls the book downward',
        'The table pushes back up with an equal, opposite force',
        'Net force = 0, so the book stays at rest',
      ],
    },
    {
      type: 'question',
      prompt: 'A ball rolling on a frictionless floor will…',
      options: ['Slow down and stop', 'Speed up on its own', 'Keep moving at constant velocity', 'Reverse direction'],
      correctIndex: 2,
      hint: 'Think about what happens when the net force is zero.',
      explanation: 'With no net force acting on it, Newton’s First Law says its velocity stays constant.',
    },
    {
      type: 'question',
      prompt: "Newton's First Law is also known as the law of…",
      options: ['Acceleration', 'Inertia', 'Momentum', 'Gravity'],
      correctIndex: 1,
      hint: "It's about an object's resistance to changing its motion.",
      explanation: "Inertia is an object's resistance to a change in its state of motion.",
    },
  ],
};

function defaultLessonContent(lessonTitle: string): LessonStep[] {
  return [
    {
      type: 'explanation',
      heading: `What is ${lessonTitle}?`,
      body: `${lessonTitle} is a key concept in this unit — you'll build on it as you keep learning.`,
    },
    {
      type: 'question',
      prompt: `Which statement best describes ${lessonTitle}?`,
      options: [
        `${lessonTitle} is covered in this lesson`,
        `${lessonTitle} is unrelated to this subject`,
        `${lessonTitle} has no real-world use`,
        `${lessonTitle} cannot be practiced`,
      ],
      correctIndex: 0,
      hint: 'Review the explanation above.',
      explanation: `This lesson introduces ${lessonTitle} so you can practice it going forward.`,
    },
  ];
}

type PracticeQuestion = { prompt: string; options: string[]; correctIndex: number; explanation: string };

const QUESTION_BANKS: Record<string, PracticeQuestion[]> = {
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

async function main() {
  console.log('Seeding subjects/units/lessons/steps...');
  for (const subject of SUBJECTS) {
    await prisma.subject.upsert({
      where: { slug: subject.id },
      create: { id: subject.id, slug: subject.id, name: subject.name, icon: subject.icon },
      update: { name: subject.name, icon: subject.icon },
    });

    for (const [unitOrder, unit] of subject.units.entries()) {
      await prisma.unit.upsert({
        where: { id: unit.id },
        create: {
          id: unit.id,
          subjectId: subject.id,
          grade: unit.grade,
          title: unit.title,
          description: unit.description,
          order: unitOrder,
        },
        update: { grade: unit.grade, title: unit.title, description: unit.description, order: unitOrder },
      });

      for (const [lessonOrder, lesson] of unit.lessons.entries()) {
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          create: { id: lesson.id, unitId: unit.id, title: lesson.title, order: lessonOrder },
          update: { title: lesson.title, order: lessonOrder },
        });

        const steps = LESSON_CONTENT[lesson.id] ?? defaultLessonContent(lesson.title);
        await prisma.lessonStep.deleteMany({ where: { lessonId: lesson.id } });
        await prisma.lessonStep.createMany({
          data: steps.map((step, order) => {
            const { type, ...content } = step;
            return { lessonId: lesson.id, type, order, content };
          }),
        });
      }
    }
  }

  console.log('Seeding practice question bank...');
  for (const [subjectId, questions] of Object.entries(QUESTION_BANKS)) {
    await prisma.question.deleteMany({ where: { subjectId } });
    await prisma.question.createMany({
      data: questions.map((q) => ({
        subjectId,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
