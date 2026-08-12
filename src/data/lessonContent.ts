export type LessonStep =
  | { type: 'explanation'; heading: string; body: string }
  | { type: 'example'; heading: string; body: string; steps: string[] }
  | {
      type: 'question';
      prompt: string;
      options: string[];
      correctIndex: number;
      hint: string;
      explanation: string;
    };

const CONTENT: Record<string, LessonStep[]> = {
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

export function getLessonContent(lessonId: string, lessonTitle: string): LessonStep[] {
  if (CONTENT[lessonId]) return CONTENT[lessonId];

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
