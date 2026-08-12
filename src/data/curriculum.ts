import { Ionicons } from '@expo/vector-icons';
import { JourneyStatus } from '../components/progress/JourneyRow';

export type Grade = 9 | 10 | 11 | 12;

export type Lesson = { id: string; title: string; status: JourneyStatus };
export type Unit = { id: string; title: string; description: string; grade: Grade; lessons: Lesson[] };
export type Subject = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  mastery: number;
  units: Unit[];
};

export const GRADES: Grade[] = [9, 10, 11, 12];

export const SUBJECTS: Subject[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'calculator-outline',
    mastery: 0.62,
    units: [
      {
        id: 'geometry',
        title: 'Geometry',
        grade: 9,
        description: 'Shapes, angles, and the relationships between them.',
        lessons: [
          { id: 'shapes-angles', title: 'Shapes & Angles', status: 'locked' },
          { id: 'triangles', title: 'Triangles', status: 'locked' },
          { id: 'circles', title: 'Circles', status: 'locked' },
        ],
      },
      {
        id: 'algebra',
        title: 'Algebra',
        grade: 10,
        description: 'Build the foundations you need for every other unit — equations, patterns, and functions.',
        lessons: [
          { id: 'algebra-foundations', title: 'Algebra Foundations', status: 'completed' },
          { id: 'linear-equations', title: 'Linear Equations', status: 'completed' },
          { id: 'quadratic-equations', title: 'Quadratic Equations', status: 'current' },
          { id: 'functions', title: 'Functions', status: 'available' },
          { id: 'calculus-intro', title: 'Calculus', status: 'locked' },
        ],
      },
      {
        id: 'trigonometry',
        title: 'Trigonometry',
        grade: 11,
        description: 'Angles, ratios, and the functions that describe them.',
        lessons: [
          { id: 'trig-ratios', title: 'Trigonometric Ratios', status: 'locked' },
          { id: 'trig-identities', title: 'Trigonometric Identities', status: 'locked' },
        ],
      },
      {
        id: 'calculus-advanced',
        title: 'Calculus',
        grade: 12,
        description: 'Limits, derivatives, and integrals — the mathematics of change.',
        lessons: [
          { id: 'limits-continuity', title: 'Limits & Continuity', status: 'locked' },
          { id: 'derivatives-integrals', title: 'Derivatives & Integrals', status: 'locked' },
        ],
      },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: 'planet-outline',
    mastery: 0.41,
    units: [
      {
        id: 'physics-foundations',
        title: 'Physics Foundations',
        grade: 9,
        description: 'Measurement, units, and the basics of motion.',
        lessons: [
          { id: 'measurement-units', title: 'Measurement & Units', status: 'locked' },
          { id: 'motion-basics', title: 'Motion Basics', status: 'locked' },
        ],
      },
      {
        id: 'waves-sound',
        title: 'Waves & Sound',
        grade: 10,
        description: 'How waves carry energy, and the physics of sound.',
        lessons: [
          { id: 'wave-properties', title: 'Wave Properties', status: 'locked' },
          { id: 'sound-waves', title: 'Sound Waves', status: 'locked' },
        ],
      },
      {
        id: 'mechanics',
        title: 'Mechanics',
        grade: 11,
        description: "Forces, motion, and Newton's laws — the physics behind everything that moves.",
        lessons: [
          { id: 'newtons-laws', title: "Newton's Laws", status: 'current' },
          { id: 'motion-forces', title: 'Motion & Forces', status: 'locked' },
          { id: 'energy-work', title: 'Energy & Work', status: 'locked' },
        ],
      },
      {
        id: 'electricity-magnetism',
        title: 'Electricity & Magnetism',
        grade: 12,
        description: 'Circuits, magnetic fields, and how the two connect.',
        lessons: [
          { id: 'electric-circuits', title: 'Electric Circuits', status: 'locked' },
          { id: 'magnetism', title: 'Magnetism', status: 'locked' },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'flask-outline',
    mastery: 0.3,
    units: [
      {
        id: 'atomic-structure',
        title: 'Atomic Structure',
        grade: 9,
        description: 'The building blocks of matter, from atoms to the periodic table.',
        lessons: [
          { id: 'atoms-elements', title: 'Atoms & Elements', status: 'available' },
          { id: 'periodic-table', title: 'The Periodic Table', status: 'locked' },
          { id: 'bonding', title: 'Chemical Bonding', status: 'locked' },
        ],
      },
      {
        id: 'chemical-reactions',
        title: 'Chemical Reactions',
        grade: 10,
        description: 'How substances transform, and the math behind it.',
        lessons: [
          { id: 'types-of-reactions', title: 'Types of Reactions', status: 'locked' },
          { id: 'stoichiometry', title: 'Stoichiometry', status: 'locked' },
        ],
      },
      {
        id: 'organic-chemistry',
        title: 'Organic Chemistry',
        grade: 11,
        description: 'Carbon-based compounds and the groups that define them.',
        lessons: [
          { id: 'hydrocarbons', title: 'Hydrocarbons', status: 'locked' },
          { id: 'functional-groups', title: 'Functional Groups', status: 'locked' },
        ],
      },
      {
        id: 'acids-bases',
        title: 'Acids & Bases',
        grade: 12,
        description: 'Acid-base theory and how to measure it.',
        lessons: [
          { id: 'acid-base-theory', title: 'Acid-Base Theory', status: 'locked' },
          { id: 'ph-titration', title: 'pH & Titration', status: 'locked' },
        ],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'leaf-outline',
    mastery: 0.55,
    units: [
      {
        id: 'intro-biology',
        title: 'Intro to Biology',
        grade: 9,
        description: 'What defines life, and how living things are classified.',
        lessons: [
          { id: 'characteristics-of-life', title: 'Characteristics of Life', status: 'locked' },
          { id: 'classification', title: 'Classification', status: 'locked' },
        ],
      },
      {
        id: 'cell-biology',
        title: 'Cell Biology',
        grade: 10,
        description: 'The structure and function of the basic unit of life.',
        lessons: [
          { id: 'cell-structure', title: 'Cell Structure', status: 'available' },
          { id: 'cell-division', title: 'Cell Division', status: 'locked' },
          { id: 'genetics-intro', title: 'Genetics', status: 'locked' },
        ],
      },
      {
        id: 'human-physiology',
        title: 'Human Physiology',
        grade: 11,
        description: 'How the body’s major systems keep you alive.',
        lessons: [
          { id: 'digestive-system', title: 'Digestive System', status: 'locked' },
          { id: 'circulatory-system', title: 'Circulatory System', status: 'locked' },
        ],
      },
      {
        id: 'ecology-evolution',
        title: 'Ecology & Evolution',
        grade: 12,
        description: 'Ecosystems, and how species change over time.',
        lessons: [
          { id: 'ecosystems', title: 'Ecosystems', status: 'locked' },
          { id: 'evolution-theory', title: 'Evolution Theory', status: 'locked' },
        ],
      },
    ],
  },
  {
    id: 'english',
    name: 'English',
    icon: 'book-outline',
    mastery: 0.78,
    units: [
      {
        id: 'grammar',
        title: 'Grammar & Usage',
        grade: 9,
        description: 'The rules that make your writing clear and correct.',
        lessons: [
          { id: 'sentence-structure', title: 'Sentence Structure', status: 'available' },
          { id: 'punctuation', title: 'Punctuation', status: 'locked' },
          { id: 'comprehension', title: 'Reading Comprehension', status: 'locked' },
        ],
      },
      {
        id: 'writing-skills',
        title: 'Writing Skills',
        grade: 10,
        description: 'Structuring your ideas into clear, organized writing.',
        lessons: [
          { id: 'essay-writing', title: 'Essay Writing', status: 'locked' },
          { id: 'paragraph-structure', title: 'Paragraph Structure', status: 'locked' },
        ],
      },
      {
        id: 'literature',
        title: 'Literature',
        grade: 11,
        description: 'Reading and analyzing poetry and prose.',
        lessons: [
          { id: 'poetry-analysis', title: 'Poetry Analysis', status: 'locked' },
          { id: 'prose-analysis', title: 'Prose Analysis', status: 'locked' },
        ],
      },
      {
        id: 'advanced-comprehension',
        title: 'Advanced Comprehension',
        grade: 12,
        description: 'Critical reading and summarizing at exam level.',
        lessons: [
          { id: 'critical-reading', title: 'Critical Reading', status: 'locked' },
          { id: 'summary-writing', title: 'Summary Writing', status: 'locked' },
        ],
      },
    ],
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    icon: 'bulb-outline',
    mastery: 0.35,
    units: [
      {
        id: 'basic-numeracy',
        title: 'Basic Numeracy',
        grade: 9,
        description: 'Core number sense and simple arithmetic.',
        lessons: [
          { id: 'number-basics', title: 'Number Basics', status: 'locked' },
          { id: 'simple-arithmetic', title: 'Simple Arithmetic', status: 'locked' },
        ],
      },
      {
        id: 'verbal-reasoning',
        title: 'Verbal Reasoning',
        grade: 10,
        description: 'Analogies and vocabulary in context.',
        lessons: [
          { id: 'analogies', title: 'Analogies', status: 'locked' },
          { id: 'vocabulary-context', title: 'Vocabulary in Context', status: 'locked' },
        ],
      },
      {
        id: 'logical-reasoning',
        title: 'Logical Reasoning',
        grade: 11,
        description: 'Syllogisms and pattern recognition.',
        lessons: [
          { id: 'syllogisms', title: 'Syllogisms', status: 'locked' },
          { id: 'pattern-recognition', title: 'Pattern Recognition', status: 'locked' },
        ],
      },
      {
        id: 'quantitative-reasoning',
        title: 'Quantitative Reasoning',
        grade: 12,
        description: 'Numerical logic, patterns, and problem-solving under time pressure.',
        lessons: [
          { id: 'number-series', title: 'Number Series', status: 'completed' },
          { id: 'logical-patterns', title: 'Logical Patterns', status: 'current' },
          { id: 'word-problems', title: 'Word Problems', status: 'available' },
          { id: 'data-interpretation', title: 'Data Interpretation', status: 'locked' },
        ],
      },
    ],
  },
  {
    id: 'civics',
    name: 'Civics',
    icon: 'people-outline',
    mastery: 0.2,
    units: [
      {
        id: 'government-citizenship',
        title: 'Government & Citizenship',
        grade: 9,
        description: "Ethiopia's constitution, civic rights, and responsibilities.",
        lessons: [
          { id: 'constitution-basics', title: 'Constitution Basics', status: 'available' },
          { id: 'rights-duties', title: 'Rights & Duties', status: 'locked' },
          { id: 'government-structure', title: 'Government Structure', status: 'locked' },
        ],
      },
      {
        id: 'rule-of-law',
        title: 'Rule of Law',
        grade: 10,
        description: 'The legal system and human rights.',
        lessons: [
          { id: 'legal-system-basics', title: 'Legal System Basics', status: 'locked' },
          { id: 'human-rights', title: 'Human Rights', status: 'locked' },
        ],
      },
      {
        id: 'ethiopian-governance',
        title: 'Ethiopian Governance',
        grade: 11,
        description: 'Federalism and the political party system.',
        lessons: [
          { id: 'federalism', title: 'Federalism', status: 'locked' },
          { id: 'political-parties', title: 'Political Parties', status: 'locked' },
        ],
      },
      {
        id: 'global-citizenship',
        title: 'Global Citizenship',
        grade: 12,
        description: 'International relations and global issues.',
        lessons: [
          { id: 'international-relations', title: 'International Relations', status: 'locked' },
          { id: 'global-issues', title: 'Global Issues', status: 'locked' },
        ],
      },
    ],
  },
];

export function findSubject(subjectId: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === subjectId);
}

export function findUnit(subjectId: string, unitId: string): Unit | undefined {
  return findSubject(subjectId)?.units.find((u) => u.id === unitId);
}

export function findLesson(subjectId: string, unitId: string, lessonId: string): Lesson | undefined {
  return findUnit(subjectId, unitId)?.lessons.find((l) => l.id === lessonId);
}

export function countLessons(subject: Subject): { completed: number; total: number } {
  const lessons = subject.units.flatMap((u) => u.lessons);
  return { completed: lessons.filter((l) => l.status === 'completed').length, total: lessons.length };
}

export function countLessonsForGrade(subject: Subject, grade: Grade): { completed: number; total: number } {
  const lessons = subject.units.filter((u) => u.grade === grade).flatMap((u) => u.lessons);
  return { completed: lessons.filter((l) => l.status === 'completed').length, total: lessons.length };
}
