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
type Stream = 'natural' | 'social';
type SeedLesson = { id: string; title: string };
type SeedUnit = { id: string; title: string; description: string; grade: Grade; lessons: SeedLesson[] };
type SeedSubject = { id: string; name: string; icon: string; streams: Stream[]; units: SeedUnit[] };

const SUBJECTS: SeedSubject[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'calculator-outline',
    streams: ['natural', 'social'],
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
      {
        id: 'mathematics-g9-sets',
        title: 'Sets',
        grade: 9,
        description: 'Well-defined collections, membership, and the four ways to describe a set.',
        lessons: [
          { id: 'mathematics-g9-sets-intro', title: 'Introduction to Sets' },
          { id: 'mathematics-g9-sets-description-methods', title: 'Describing Sets' },
        ],
      },
      {
        id: 'mathematics-g9-inequalities',
        title: 'Inequalities',
        grade: 9,
        description: 'Solving absolute value and quadratic inequalities, and applying them to real-world problems.',
        lessons: [
          { id: 'mathematics-g9-inequalities-absolute-value', title: 'Absolute Value Inequalities' },
          { id: 'mathematics-g9-inequalities-quadratic', title: 'Quadratic Inequalities' },
          { id: 'mathematics-g9-inequalities-applications', title: 'Applying Inequalities to Real Problems' },
        ],
      },
      {
        id: 'mathematics-g9-right-triangles',
        title: 'Right-Angled Triangles',
        grade: 9,
        description: 'The Pythagorean theorem, its converse, and using them to find missing sides and test for right angles.',
        lessons: [
          { id: 'mathematics-g9-right-triangles-pythagorean-theorem', title: 'Right-Angled Triangles and the Pythagorean Theorem' },
          { id: 'mathematics-g9-right-triangles-converse', title: 'Using the Converse to Test for a Right Angle' },
        ],
      },
      {
        id: 'mathematics-g9-similarity',
        title: 'Similarity',
        grade: 9,
        description: 'Congruent and similar triangles, the AA/SSS/SAS similarity theorems, and how the scale factor relates the perimeters and areas of similar figures.',
        lessons: [
          { id: 'mathematics-g9-similarity-congruent-triangles', title: 'What Makes Triangles Congruent?' },
          { id: 'mathematics-g9-similarity-theorems', title: 'AA, SSS, and SAS Similarity Theorems' },
          { id: 'mathematics-g9-similarity-scale-factor', title: 'Similar Figures and the Scale Factor' },
          { id: 'mathematics-g9-similarity-perimeter-ratio', title: 'Perimeters of Similar Figures' },
          { id: 'mathematics-g9-similarity-area-ratio', title: 'Areas of Similar Figures' },
        ],
      },
      {
        id: 'mathematics-g9-vectors',
        title: 'Vectors and Scalars',
        grade: 9,
        description: 'The difference between scalar and vector quantities, including distance vs. displacement.',
        lessons: [
          { id: 'mathematics-g9-vectors-scalars', title: 'Scalars and Vectors' },
        ],
      },
      {
        id: 'mathematics-g10-polynomial-functions',
        title: 'Polynomial Functions',
        grade: 10,
        description: 'Defining polynomial functions, recognizing what counts as one, and reading their graphs.',
        lessons: [
          { id: 'mathematics-g10-polynomial-functions-definition', title: 'What Is a Polynomial Function?' },
          { id: 'mathematics-g10-polynomial-functions-recognizing', title: 'Recognizing Non-Polynomial Functions' },
          { id: 'mathematics-g10-polynomial-functions-graphing-quadratics', title: 'Graphing Quadratics: Intercepts and the Turning Point' },
          { id: 'mathematics-g10-polynomial-functions-end-behavior', title: 'End Behavior of Polynomial Graphs' },
        ],
      },
      {
        id: 'mathematics-g10-circles',
        title: 'Circles',
        grade: 10,
        description: "Circle symmetry, chords, and using the Pythagorean theorem to find a chord's distance from the center.",
        lessons: [
          { id: 'mathematics-g10-circles-chords-symmetry', title: 'Circles, Symmetry, and Chords' },
          { id: 'mathematics-g10-circles-chord-distance', title: 'Using the Pythagorean Theorem with Chords' },
        ],
      },
      {
        id: 'mathematics-g10-solids',
        title: 'Prisms and Cylinders',
        grade: 10,
        description: 'Surface area and volume formulas for right prisms and right circular cylinders.',
        lessons: [
          { id: 'mathematics-g10-solids-prisms', title: 'Surface Area and Volume of Prisms' },
          { id: 'mathematics-g10-solids-cylinders', title: 'Surface Area and Volume of Cylinders' },
        ],
      },
      {
        id: 'mathematics-g10-coordinate-geometry',
        title: 'Coordinate Geometry: Distance',
        grade: 10,
        description: 'Finding the distance between two points on the coordinate plane, aligned or not.',
        lessons: [
          { id: 'mathematics-g10-coordinate-geometry-distance-axis-aligned', title: 'Distance on Horizontal and Vertical Lines' },
          { id: 'mathematics-g10-coordinate-geometry-distance-formula', title: 'The Distance Formula' },
        ],
      },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: 'planet-outline',
    streams: ['natural'],
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
      {
        id: 'physics-g9-physical-quantities',
        title: 'Physical Quantities',
        grade: 9,
        description: 'Fundamental vs. derived quantities, scalars vs. vectors, and converting between units.',
        lessons: [
          { id: 'physics-g9-physical-quantities-classification', title: 'Classifying Physical Quantities' },
          { id: 'physics-g9-physical-quantities-unit-conversion', title: 'Converting Between Units' },
        ],
      },
      {
        id: 'physics-g9-motion-straight-line',
        title: 'Motion in a Straight Line',
        grade: 9,
        description: 'Position, distance, displacement, speed, velocity, acceleration, and graphs of straight-line motion.',
        lessons: [
          { id: 'physics-g9-motion-straight-line-position-distance-displacement', title: 'Position, Distance, and Displacement' },
          { id: 'physics-g9-motion-straight-line-speed-and-velocity', title: 'Speed and Velocity' },
          { id: 'physics-g9-motion-straight-line-acceleration-and-graphs', title: 'Acceleration and Motion Graphs' },
        ],
      },
      {
        id: 'physics-g9-force-work-energy-power',
        title: 'Force, Work, Energy and Power',
        grade: 9,
        description: "Newton's three laws of motion, friction, and the physics definitions of work, energy, and power.",
        lessons: [
          { id: 'physics-g9-force-newtons-laws', title: "Force and Newton's Laws of Motion" },
          { id: 'physics-g9-friction-and-work', title: 'Friction and Work' },
          { id: 'physics-g9-energy-and-power', title: 'Energy and Power' },
        ],
      },
      {
        id: 'physics-g9-simple-machines',
        title: 'Simple Machines',
        grade: 9,
        description: 'Effort, load, mechanical advantage, velocity ratio, and efficiency across the six types of simple machines.',
        lessons: [
          { id: 'physics-g9-simple-machines-overview', title: 'What Simple Machines Do' },
          { id: 'physics-g9-simple-machines-advantage-and-efficiency', title: 'Mechanical Advantage, Velocity Ratio, and Efficiency' },
          { id: 'physics-g9-simple-machines-types', title: 'Levers, Inclined Planes, and Other Simple Machines' },
        ],
      },
      {
        id: 'physics-g9-oscillation-and-sound',
        title: 'Mechanical Oscillation and Sound Wave',
        grade: 9,
        description: 'Wave properties, pendulums and springs, mechanical vs. electromagnetic waves, and the behavior of sound.',
        lessons: [
          { id: 'physics-g9-waves-oscillation-characteristics', title: 'Wave Characteristics and Oscillating Systems' },
          { id: 'physics-g9-waves-mechanical-and-sound', title: 'How Waves Travel' },
          { id: 'physics-g9-sound-phenomena', title: 'Sound Phenomena' },
        ],
      },
      {
        id: 'physics-g9-temperature',
        title: 'Temperature',
        grade: 9,
        description: 'What temperature measures, how thermometers work, and converting between the Celsius, Fahrenheit, and Kelvin scales.',
        lessons: [
          { id: 'physics-g9-temperature-and-its-effects', title: 'What Temperature Measures, and Why It Matters' },
          { id: 'physics-g9-thermometers-and-scales', title: 'How Thermometers Work, and the Three Temperature Scales' },
          { id: 'physics-g9-converting-temperature-scales', title: 'Converting Between Celsius, Fahrenheit, and Kelvin' },
        ],
      },
      {
        id: 'physics-g10-vectors',
        title: 'Vectors',
        grade: 10,
        description: 'Scalars vs. vectors, graphical vector addition and subtraction, and resolving a vector into its components.',
        lessons: [
          { id: 'physics-g10-vectors-scalars-and-representation', title: 'Scalars, Vectors, and How to Represent Them' },
          { id: 'physics-g10-vectors-addition-subtraction', title: 'Adding and Subtracting Vectors Graphically' },
          { id: 'physics-g10-vectors-resolution', title: 'Resolving a Vector into Components' },
        ],
      },
      {
        id: 'physics-g10-motion',
        title: 'Motion in a Straight Line, Revisited',
        grade: 10,
        description: 'Position, displacement, and acceleration revisited at Grade 10 depth, the equations of motion, free fall, motion graphs, and relative velocity.',
        lessons: [
          { id: 'physics-g10-motion-position-displacement-acceleration', title: 'Position, Displacement, and Acceleration, Revisited' },
          { id: 'physics-g10-motion-equations-and-free-fall', title: 'The Equations of Motion and Free Fall' },
          { id: 'physics-g10-motion-graphs-and-relative-velocity', title: 'Motion Graphs and Relative Velocity' },
        ],
      },
      {
        id: 'physics-g10-elasticity-and-equilibrium',
        title: 'Elasticity and Static Equilibrium of Rigid Body',
        grade: 10,
        description: "Elasticity vs. plasticity, density and specific gravity, stress and strain under Hooke's law, and the two conditions for static equilibrium.",
        lessons: [
          { id: 'physics-g10-elasticity-plasticity-density', title: 'Elasticity, Plasticity, and Density' },
          { id: 'physics-g10-stress-strain-hookes-law', title: "Stress, Strain, and Hooke's Law" },
          { id: 'physics-g10-static-equilibrium', title: 'Static Equilibrium' },
        ],
      },
      {
        id: 'physics-g10-static-and-current-electricity',
        title: 'Static and Current Electricity',
        grade: 10,
        description: "Electric charge and charging methods, the electroscope, Coulomb's law, electric fields, circuits, Ohm's law, resistor networks, meters, and electrical safety.",
        lessons: [
          { id: 'physics-g10-electric-charge-and-charging', title: "Electric Charge and How It's Transferred" },
          { id: 'physics-g10-electroscope-and-discharge', title: 'Detecting and Discharging Electric Charge' },
          { id: 'physics-g10-coulombs-law', title: "Coulomb's Law" },
          { id: 'physics-g10-electric-fields-and-circuits', title: 'Electric Fields and Simple Circuits' },
          { id: 'physics-g10-current-voltage-ohms-law', title: "Current, Voltage, and Ohm's Law" },
          { id: 'physics-g10-resistors-series-parallel', title: 'Combining Resistors in Series and Parallel' },
          { id: 'physics-g10-meters-and-electrical-safety', title: 'Using Meters Safely, and Electrical Safety' },
        ],
      },
      {
        id: 'physics-g10-magnetism',
        title: 'Magnetism',
        grade: 10,
        description: 'Magnets and magnetic fields, the Earth as a magnet, forces on moving charges and current-carrying wires, and real-world applications.',
        lessons: [
          { id: 'physics-g10-magnets-fields-earth', title: 'Magnets, Magnetic Fields, and the Earth' },
          { id: 'physics-g10-magnetic-force-current-and-charges', title: 'Magnetic Force on Currents and Moving Charges' },
          { id: 'physics-g10-applications-of-magnetism', title: 'Applications of Magnetism' },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'flask-outline',
    streams: ['natural'],
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
      {
        id: 'chemistry-g9-scope',
        title: 'The Scope of Chemistry',
        grade: 9,
        description: 'What chemistry studies, how it connects to the other natural sciences, and where chemistry shows up in everyday life in Ethiopia.',
        lessons: [
          { id: 'chemistry-g9-scope-what-is-chemistry', title: 'What Is Chemistry?' },
          { id: 'chemistry-g9-scope-related-sciences', title: 'Chemistry and Other Natural Sciences' },
          { id: 'chemistry-g9-scope-chemistry-in-ethiopia', title: 'Chemistry at Work in Ethiopia' },
        ],
      },
      {
        id: 'chemistry-g9-measurement',
        title: 'Measurement and Scientific Methods',
        grade: 9,
        description: 'The scientific method, lab safety and equipment, SI units, precision vs. accuracy, and significant figures.',
        lessons: [
          { id: 'chemistry-g9-measurement-scientific-method', title: 'The Scientific Method' },
          { id: 'chemistry-g9-measurement-lab-safety', title: 'Laboratory Safety and Equipment' },
          { id: 'chemistry-g9-measurement-si-units', title: 'SI Units and Derived Units' },
          { id: 'chemistry-g9-measurement-precision-accuracy', title: 'Precision and Accuracy' },
          { id: 'chemistry-g9-measurement-significant-figures', title: 'Significant Figures and Scientific Notation' },
        ],
      },
      {
        id: 'chemistry-g9-atom',
        title: 'Structure of the Atom',
        grade: 9,
        description: "From Dalton's theory through the discovery of the electron, proton, and neutron, to the Bohr model, isotopes, and electron configuration.",
        lessons: [
          { id: 'chemistry-g9-atom-daltons-theory', title: "Dalton's Atomic Theory and Its Limits" },
          { id: 'chemistry-g9-atom-electron-proton-discovery', title: 'Discovering the Electron and Proton' },
          { id: 'chemistry-g9-atom-nucleus-neutron-bohr', title: 'The Nucleus, the Neutron, and the Bohr Model' },
          { id: 'chemistry-g9-atom-number-mass-isotopes', title: 'Atomic Number, Mass Number, and Isotopes' },
          { id: 'chemistry-g9-atom-electron-configuration', title: 'Electron Configuration and Valence Electrons' },
        ],
      },
      {
        id: 'chemistry-g9-periodic',
        title: 'Periodic Classification of Elements',
        grade: 9,
        description: "From Döbereiner to the modern periodic law, and how electron configuration explains the trends in the periodic table.",
        lessons: [
          { id: 'chemistry-g9-periodic-triads-to-mendeleev', title: "From Triads to Mendeleev's Periodic Table" },
          { id: 'chemistry-g9-periodic-modern-law-periods-groups', title: 'The Modern Periodic Law: Periods and Groups' },
          { id: 'chemistry-g9-periodic-electron-config-blocks', title: 'Electron Configuration and the Periodic Table' },
          { id: 'chemistry-g9-periodic-atomic-radius-ionization', title: 'Atomic Radius and Ionization Energy' },
          { id: 'chemistry-g9-periodic-electron-affinity-electronegativity', title: 'Electron Affinity and Electronegativity' },
        ],
      },
      {
        id: 'chemistry-g9-bonding',
        title: 'Chemical Bonding',
        grade: 9,
        description: 'How atoms form ionic and covalent bonds to reach a stable electron configuration, and the properties that result.',
        lessons: [
          { id: 'chemistry-g9-bonding-ionic-formation', title: 'Ionic Bonding: Forming Ions' },
          { id: 'chemistry-g9-bonding-ionic-properties', title: 'Properties of Ionic Compounds' },
          { id: 'chemistry-g9-bonding-covalent-formation', title: 'Covalent Bonding: Sharing Electrons' },
          { id: 'chemistry-g9-bonding-polarity-coordinate', title: 'Polarity and Coordinate Covalent Bonds' },
        ],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'leaf-outline',
    streams: ['natural'],
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
        id: 'biology-g9-introduction-to-biology',
        title: 'Introduction to Biology',
        grade: 9,
        description: 'What biology studies, the scientific method, the tools biologists use, and how to work safely in the lab.',
        lessons: [
          { id: 'biology-g9-introduction-to-biology-scientific-method', title: 'Biology and the Scientific Method' },
          { id: 'biology-g9-introduction-to-biology-tools', title: 'Tools of a Biologist' },
          { id: 'biology-g9-introduction-to-biology-microscope-safety', title: 'The Microscope and Lab Safety' },
        ],
      },
      {
        id: 'biology-g9-characteristics-classification',
        title: 'Characteristics and Classification of Organisms',
        grade: 9,
        description: 'What makes something alive, how biologists name and classify organisms, and the five kingdoms of life.',
        lessons: [
          { id: 'biology-g9-characteristics-classification-living-things', title: 'Characteristics of Living Things & How We Classify Them' },
          { id: 'biology-g9-characteristics-classification-naming-organisms', title: 'Naming Organisms and Why Classification Matters' },
          { id: 'biology-g9-characteristics-classification-monera-protista-fungi', title: 'The Five Kingdoms: Monera, Protista, and Fungi' },
          { id: 'biology-g9-characteristics-classification-plantae-animalia', title: 'The Five Kingdoms: Plantae and Animalia' },
        ],
      },
      {
        id: 'biology-g9-cells',
        title: 'Cells',
        grade: 9,
        description: 'The cell theory, prokaryotic vs. eukaryotic and plant vs. animal cells, and passive and active transport across the cell membrane.',
        lessons: [
          { id: 'biology-g9-cells-theory-and-structure', title: 'The Cell Theory' },
          { id: 'biology-g9-cells-prokaryotic-eukaryotic-plant-animal', title: 'Two Kinds of Cells' },
          { id: 'biology-g9-cells-diffusion-osmosis', title: 'Passive Transport: Diffusion and Osmosis' },
          { id: 'biology-g9-cells-active-transport-organization', title: 'Active Transport' },
        ],
      },
      {
        id: 'biology-g9-reproduction',
        title: 'Reproduction',
        grade: 9,
        description: 'Sexual and asexual reproduction, the male and female reproductive systems, the menstrual cycle, and methods of birth control.',
        lessons: [
          { id: 'biology-g9-reproduction-sexual-and-puberty', title: 'Sexual Reproduction' },
          { id: 'biology-g9-reproduction-male-female-systems', title: 'The Male and Female Reproductive Systems' },
          { id: 'biology-g9-reproduction-menstrual-cycle-pregnancy', title: 'The Three Phases of the Menstrual Cycle' },
          { id: 'biology-g9-reproduction-asexual', title: 'What Is Asexual Reproduction?' },
          { id: 'biology-g9-reproduction-birth-control-stis', title: 'Methods of Birth Control' },
        ],
      },
      {
        id: 'biology-g9-health-nutrition-disease',
        title: 'Human Health, Nutrition, and Disease',
        grade: 9,
        description: 'Nutrients and balanced diets, deficiency diseases and malnutrition, substance abuse, and infectious and non-infectious disease.',
        lessons: [
          { id: 'biology-g9-health-nutrition-disease-nutrients-balanced-diet', title: 'Nutrients and a Balanced Diet' },
          { id: 'biology-g9-health-nutrition-disease-deficiency-malnutrition', title: 'Deficiency Diseases and Malnutrition' },
          { id: 'biology-g9-health-nutrition-disease-substance-abuse', title: 'Substance Abuse: Tobacco, Alcohol, and Other Drugs' },
          { id: 'biology-g9-health-nutrition-disease-infectious-diseases', title: 'Infectious Diseases' },
          { id: 'biology-g9-health-nutrition-disease-non-infectious-diseases', title: 'Non-Infectious Diseases' },
        ],
      },
      {
        id: 'biology-g10-biotechnology',
        title: 'Biotechnology',
        grade: 10,
        description: 'Traditional biotechnology with yeast and bacteria, genetic engineering, and biotechnology in agriculture, food, medicine, and energy.',
        lessons: [
          { id: 'biology-g10-biotechnology-traditional-yeast-bacteria', title: 'Traditional Biotechnology: Yeast and Bacteria' },
          { id: 'biology-g10-biotechnology-genetic-engineering', title: 'Genetic Engineering and Its Applications' },
          { id: 'biology-g10-biotechnology-energy-biogas-biofuels', title: 'Biotechnology and Energy: Biogas and Biofuels' },
        ],
      },
      {
        id: 'biology-g10-heredity',
        title: 'Heredity',
        grade: 10,
        description: "Chromosomes, DNA, and genes; mitosis and meiosis; Mendelian inheritance and Punnett squares; codominance; and selective breeding.",
        lessons: [
          { id: 'biology-g10-heredity-chromosomes-dna-genes', title: 'Chromosomes, DNA, and Genes' },
          { id: 'biology-g10-heredity-mitosis-meiosis', title: 'Mitosis and Meiosis' },
          { id: 'biology-g10-heredity-mendel-basics', title: "Mendel's Peas and the Basics of Inheritance" },
          { id: 'biology-g10-heredity-codominance-human-genetics', title: 'Codominance and Human Genetics' },
          { id: 'biology-g10-heredity-selective-crossbreeding', title: 'Selective Breeding and Cross-Breeding' },
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
      // Real Grade 11 Biology curriculum (from the Ministry of Education student
      // textbook, see backend/assets/books/ + docs/backend-architecture.md §10) has
      // 6 units, not the single "Human Physiology" placeholder this replaces. Only
      // Unit One has real lesson stubs so far — its content is being pulled via
      // backend/scripts/ingest/extractLessonFromText.ts as the pilot. Units Two-Six
      // intentionally have lessons:[] rather than stub titles with no real content:
      // a stub would fall through to defaultLessonContent()'s generic filler under a
      // specific real title (e.g. "Enzyme Kinetics"), which reads as real content
      // when it isn't — worse than an empty unit. Filled in incrementally.
      {
        id: 'biology-and-technology',
        title: 'Biology and Technology',
        grade: 11,
        description: 'Learning from nature, and the two-way relationship between biology and technology.',
        lessons: [
          { id: 'learning-from-nature', title: 'Learning From Nature' },
          { id: 'biology-and-technology-lesson', title: 'Biology and Technology' },
          { id: 'impacts-of-biology-and-technology', title: 'Impacts on Society and the Natural World' },
          { id: 'ethical-issues-in-biology', title: 'Ethical Issues in Biology' },
        ],
      },
      {
        id: 'animals',
        title: 'Animals',
        grade: 11,
        description: 'Classification, reproduction, behavior, and homeostasis in animals.',
        lessons: [],
      },
      {
        id: 'enzymes',
        title: 'Enzymes',
        grade: 11,
        description: 'Enzyme structure, function, regulation, and industrial application.',
        lessons: [],
      },
      {
        id: 'genetics-g11',
        title: 'Genetics',
        grade: 11,
        description: 'Cell division, inheritance, genetic disorders, and bioinformatics.',
        lessons: [],
      },
      {
        id: 'human-body-systems',
        title: 'The Human Body Systems',
        grade: 11,
        description: 'The reproductive system and related health topics.',
        lessons: [],
      },
      {
        id: 'population-natural-resources',
        title: 'Population and Natural Resources',
        grade: 11,
        description: 'Conservation, human impact on the environment, and indigenous practices in Ethiopia.',
        lessons: [],
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
    streams: ['natural', 'social'],
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
      {
        id: 'english-learning-to-learn',
        title: 'Learning to Learn',
        grade: 9,
        description: "Question words, the present simple tense, obligation and necessity, and punctuation basics.",
        lessons: [
          { id: 'english-learning-to-learn-question-words', title: 'Question Words' },
          { id: 'english-learning-to-learn-present-simple', title: 'Present Simple Tense' },
          { id: 'english-learning-to-learn-obligation-necessity', title: 'Obligation and Necessity' },
          { id: 'english-learning-to-learn-punctuation-basics', title: 'Punctuation Basics' },
        ],
      },
      {
        id: 'english-places-to-visit',
        title: 'Places to Visit',
        grade: 9,
        description: "Future possibility, polite indirect questions, the present perfect tense, and reading about Ethiopia's historical sites.",
        lessons: [
          { id: 'english-places-to-visit-future-possibility', title: 'Future Possibility: Going To, May, Might' },
          { id: 'english-places-to-visit-polite-questions', title: 'Polite (Indirect) Questions' },
          { id: 'english-places-to-visit-present-perfect', title: 'The Present Perfect Tense' },
          { id: 'english-places-to-visit-historical-sites-reading', title: "Ethiopia's Historical Sites" },
        ],
      },
      {
        id: 'english-hobbies-and-crafts',
        title: 'Hobbies and Crafts',
        grade: 9,
        description: 'Do vs. make, adverbs of frequency, quantifying determiners, and a karate-lesson reading passage.',
        lessons: [
          { id: 'english-hobbies-and-crafts-do-vs-make', title: 'Do vs. Make' },
          { id: 'english-hobbies-and-crafts-adverbs-of-frequency', title: 'Adverbs of Frequency' },
          { id: 'english-hobbies-and-crafts-quantifiers', title: 'All, None, Most, A Few' },
          { id: 'english-hobbies-and-crafts-karate-reading', title: 'Reading: The Karate Lesson' },
        ],
      },
      {
        id: 'english-food-for-health',
        title: 'Food for Health',
        grade: 9,
        description: 'Nutrients and a balanced diet, giving advice, the present simple passive, and a reading passage about oranges and Vitamin C.',
        lessons: [
          { id: 'english-food-for-health-nutrients', title: 'Nutrients and a Balanced Diet' },
          { id: 'english-food-for-health-giving-advice', title: 'Giving Advice' },
          { id: 'english-food-for-health-present-passive', title: 'The Present Simple Passive' },
          { id: 'english-food-for-health-oranges-reading', title: 'Reading: Oranges' },
        ],
      },
      {
        id: 'english-cities-of-the-future',
        title: 'Cities of the Future',
        grade: 9,
        description: 'Relative clauses, future forms (will/going to/present continuous), the future passive, and a newspaper-letter reading passage.',
        lessons: [
          { id: 'english-cities-of-the-future-relative-clauses', title: 'Relative Clauses' },
          { id: 'english-cities-of-the-future-future-forms', title: 'Talking About the Future' },
          { id: 'english-cities-of-the-future-future-passive', title: 'The Future Passive' },
          { id: 'english-cities-of-the-future-newspaper-letter-reading', title: 'Reading: A Letter to a Newspaper' },
        ],
      },
      {
        id: 'english-hiv-and-aids',
        title: 'HIV and AIDS',
        grade: 9,
        description: 'The zero conditional, mustn’t vs. don’t have to, expressing sympathy, and a reading passage about living with AIDS.',
        lessons: [
          { id: 'english-hiv-and-aids-zero-conditional', title: 'The Zero Conditional' },
          { id: 'english-hiv-and-aids-mustnt-vs-dont-have-to', title: "Mustn't vs. Don't Have To" },
          { id: 'english-hiv-and-aids-expressing-sympathy', title: 'Expressing Sympathy' },
          { id: 'english-hiv-and-aids-living-with-aids-reading', title: 'Reading: Living with AIDS' },
        ],
      },
      {
        id: 'english-media-tv-radio',
        title: 'Media: TV and Radio',
        grade: 9,
        description: 'Comparative and superlative adjectives, compound and complex sentences, the present perfect with for and since, and a reading passage about the media in Ethiopia.',
        lessons: [
          { id: 'english-media-tv-radio-comparatives-superlatives', title: 'Comparative and Superlative Adjectives' },
          { id: 'english-media-tv-radio-compound-complex-sentences', title: 'Compound and Complex Sentences' },
          { id: 'english-media-tv-radio-present-perfect-for-since', title: 'Present Perfect with For and Since' },
          { id: 'english-media-tv-radio-ethiopia-reading', title: 'Reading: The Media in Ethiopia' },
        ],
      },
      {
        id: 'english-money-and-finance',
        title: 'Money and Finance',
        grade: 9,
        description: 'Verb patterns (-ing vs. to), the second conditional, reading about opening a bank account, and fact vs. opinion.',
        lessons: [
          { id: 'english-money-and-finance-verb-patterns', title: 'Verb Patterns: -ing vs. To' },
          { id: 'english-money-and-finance-second-conditional', title: 'The Second Conditional' },
          { id: 'english-money-and-finance-bank-account-reading', title: 'Reading: Opening a Bank Account' },
          { id: 'english-money-and-finance-fact-vs-opinion', title: 'Fact vs. Opinion' },
        ],
      },
      {
        id: 'english-people-and-traditional-culture',
        title: 'People and Traditional Culture',
        grade: 9,
        description: "Probability and possibility modals, during/while/for, adverbs of manner, and a reading passage about Ghana's Ohum festival.",
        lessons: [
          { id: 'english-people-and-traditional-culture-probability', title: 'Expressing Probability and Possibility' },
          { id: 'english-people-and-traditional-culture-during-while-for', title: 'During, While, and For' },
          { id: 'english-people-and-traditional-culture-adverbs-of-manner', title: 'Adverbs of Manner' },
          { id: 'english-people-and-traditional-culture-ghana-festival-reading', title: 'Reading: A Festival in Ghana' },
        ],
      },
      {
        id: 'english-newspapers-and-magazines',
        title: 'Newspapers and Magazines',
        grade: 9,
        description: 'All/every/no/none/both/neither/either, sequencing a narrative, word stress and syllables, and reading about how a newspaper is made.',
        lessons: [
          { id: 'english-newspapers-and-magazines-quantifiers', title: 'All, Every, No, None, Both, Neither, Either' },
          { id: 'english-newspapers-and-magazines-sequencing-narrative', title: 'Sequencing Words for Telling a Story' },
          { id: 'english-newspapers-and-magazines-word-stress', title: 'Syllables and Word Stress' },
          { id: 'english-newspapers-and-magazines-what-is-a-newspaper-reading', title: 'Reading: What Is a Newspaper?' },
        ],
      },
    ],
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    icon: 'bulb-outline',
    streams: ['natural', 'social'],
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
    streams: ['natural', 'social'],
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
      {
        id: 'citizenship-education-ethical-values',
        title: 'Ethical Values',
        grade: 9,
        description: 'Integrity, loyalty, and the ethical values expected of good citizens — and why they matter.',
        lessons: [
          { id: 'citizenship-education-ethical-values-major-values', title: 'Major Ethical Values' },
          { id: 'citizenship-education-ethical-values-importance', title: 'Why Ethical Values Matter' },
          { id: 'citizenship-education-ethical-values-applied-ethics', title: 'Applied Ethics: Professional and Environmental' },
        ],
      },
      {
        id: 'citizenship-education-digital-citizenship',
        title: 'Digital Technology and Citizenship',
        grade: 9,
        description: 'The purpose of digital technology, ethical codes of conduct for using it, and the challenges it brings.',
        lessons: [
          { id: 'citizenship-education-digital-citizenship-purpose', title: 'The Purpose of Digital Technology' },
          { id: 'citizenship-education-digital-citizenship-codes-of-conduct', title: 'Digital Codes of Conduct' },
          { id: 'citizenship-education-digital-citizenship-challenges', title: 'Challenges of Using Digital Media' },
        ],
      },
      {
        id: 'citizenship-education-constitution-constitutionalism',
        title: 'Constitution and Constitutionalism',
        grade: 9,
        description: "What a constitution is, what constitutionalism means in practice, and Ethiopia's constitutional history from Kibre Negest to the 1995 FDRE Constitution.",
        lessons: [
          { id: 'citizenship-education-constitution-constitutionalism-understanding-constitution', title: 'Understanding the Constitution' },
          { id: 'citizenship-education-constitution-constitutionalism-constitutionalism', title: 'Constitutionalism' },
          { id: 'citizenship-education-constitution-constitutionalism-ethiopian-history', title: "Ethiopia's Constitutional Experience" },
        ],
      },
      {
        id: 'citizenship-education-indigenous-knowledge',
        title: 'Understanding Indigenous Knowledge',
        grade: 9,
        description: "Ethiopia's indigenous knowledge systems — conflict resolution, technologies, environmental conservation, and social institutions like Idir and Iqub.",
        lessons: [
          { id: 'citizenship-education-indigenous-knowledge-concept', title: 'The Concept of Indigenous Knowledge' },
          { id: 'citizenship-education-indigenous-knowledge-responsible-citizens', title: 'Indigenous Knowledge and Responsible Citizens' },
          { id: 'citizenship-education-indigenous-knowledge-social-institutions', title: 'Indigenous Social Institutions' },
        ],
      },
      {
        id: 'citizenship-education-multiculturalism',
        title: 'Multiculturalism',
        grade: 9,
        description: "Understanding culture, the concept of multiculturalism, Ethiopia's major forms of diversity, and the pillars of multicultural societies.",
        lessons: [
          { id: 'citizenship-education-multiculturalism-understanding-culture', title: 'Understanding Culture' },
          { id: 'citizenship-education-multiculturalism-concept', title: 'The Concept of Multiculturalism' },
          { id: 'citizenship-education-multiculturalism-forms-of-diversity', title: 'Major Forms of Diversity in Ethiopia' },
          { id: 'citizenship-education-multiculturalism-pillars', title: 'Pillars of Multicultural Societies' },
        ],
      },
      {
        id: 'citizenship-education-national-unity-diversity',
        title: 'National Unity Through Diversity',
        grade: 9,
        description: "The elements of diversity, unity in diversity, accommodating diversity, and how diversity is managed in Ethiopia.",
        lessons: [
          { id: 'citizenship-education-national-unity-diversity-elements', title: 'Elements of Diversity' },
          { id: 'citizenship-education-national-unity-diversity-unity-in-diversity', title: 'Unity in Diversity' },
          { id: 'citizenship-education-national-unity-diversity-accommodation', title: 'Accommodation of Diversity' },
          { id: 'citizenship-education-national-unity-diversity-management', title: 'Diversity Management in Ethiopia' },
        ],
      },
      {
        id: 'citizenship-education-problem-solving-skills',
        title: 'Problem Solving Skills',
        grade: 9,
        description: 'What problem-solving means, the habits of good problem solvers and their four steps, and critical and creative thinking.',
        lessons: [
          { id: 'citizenship-education-problem-solving-skills-meaning-and-importance', title: 'What Is Problem-Solving?' },
          { id: 'citizenship-education-problem-solving-skills-critical-creative-thinking', title: 'Critical and Creative Thinking for Problem-Solving' },
          { id: 'citizenship-education-problem-solving-skills-good-solvers-and-steps', title: 'Good Problem Solvers and the Four Steps' },
        ],
      },
      {
        id: 'citizenship-education-foreign-relations',
        title: 'Foreign Relations and Foreign Policy',
        grade: 9,
        description: "Ethiopia's foreign relations and national interest, the instruments of foreign policy, and its roles in regional cooperation, peace, and development in East Africa.",
        lessons: [
          { id: 'citizenship-education-foreign-relations-concepts', title: 'Foreign Relations and National Interest' },
          { id: 'citizenship-education-foreign-relations-instruments', title: 'Instruments of Foreign Policy' },
          { id: 'citizenship-education-foreign-relations-roles', title: 'The Roles of Foreign Policy in East Africa' },
        ],
      },
      {
        id: 'civics-g10-democracy-democratization',
        title: 'Democracy and Democratization',
        grade: 10,
        description: 'What democracy means, the actors and institutions that build it, and its core values and aspects.',
        lessons: [
          { id: 'civics-g10-democracy-democratization-concept-and-actors', title: 'Democracy and Its Actors' },
          { id: 'civics-g10-democracy-democratization-institutions', title: 'Institutionalizing Democracy' },
          { id: 'civics-g10-democracy-democratization-social-transformation', title: 'Democracy and Social Transformation' },
          { id: 'civics-g10-democracy-democratization-values', title: 'Democratic Values' },
          { id: 'civics-g10-democracy-democratization-aspects', title: 'Aspects of Democracy' },
        ],
      },
      {
        id: 'civics-g10-digital-technology-age',
        title: 'Citizens in the Digital Technology Age',
        grade: 10,
        description: "Digital technology's effects on citizens' emotions, social life, and ethical values, plus the opportunities and risks it brings for young people.",
        lessons: [
          { id: 'civics-g10-digital-technology-age-emotions', title: "Digital Technology and Citizens' Emotions" },
          { id: 'civics-g10-digital-technology-age-social-life', title: "Digital Technology's Impact on Social Life" },
          { id: 'civics-g10-digital-technology-age-ethics', title: 'Digital Technology, Ethics, and Codes of Conduct' },
          { id: 'civics-g10-digital-technology-age-opportunities', title: 'Opportunities of Digital Technology for Young Citizens' },
          { id: 'civics-g10-digital-technology-age-unethical-use', title: 'Unethical Use of Digital Technology and Its Impacts' },
        ],
      },
    ],
  },
  {
    // No lesson content yet — only exam questions ingested via
    // backend/scripts/ingest/ (see docs/backend-architecture.md §10). units
    // stays empty until real Grade 9-12 History curriculum content is sourced;
    // an empty Learn path for this subject is honest, not a placeholder lie.
    id: 'history',
    name: 'History',
    icon: 'time-outline',
    streams: ['social'],
    units: [
      {
        id: 'history-g9-ancient-world-civilizations',
        title: 'Ancient World Civilizations',
        grade: 9,
        description: 'Ancient civilizations of Africa, Asia, the Americas, and Europe, and the rise of Christianity.',
        lessons: [
          { id: 'history-g9-ancient-africa', title: 'Ancient Civilizations of Africa' },
          { id: 'history-g9-ancient-asia', title: 'Civilizations in Asia' },
          { id: 'history-g9-ancient-americas', title: 'Civilizations of the Americas' },
          { id: 'history-g9-greece-rome', title: 'Ancient Greece and Rome' },
          { id: 'history-g9-rise-of-christianity', title: 'The Rise and Spread of Christianity' },
        ],
      },
      {
        id: 'history-g9-ethiopia-horn-to-13th-century',
        title: 'Peoples and States of Ethiopia and the Horn to the 13th Century',
        grade: 9,
        description: "Languages, religions, and settlement patterns of Ethiopia and the Horn, and the region's early states from Punt and Aksum to the Zagwe dynasty and the Sultanate of Shewa.",
        lessons: [
          { id: 'history-g9-languages-peoples-ethiopia-horn', title: 'Languages and Peoples of Ethiopia and the Horn' },
          { id: 'history-g9-religions-ethiopia-horn', title: 'Religions of Ethiopia and the Horn' },
          { id: 'history-g9-pre-aksumite-states', title: 'Pre-Aksumite States' },
          { id: 'history-g9-aksumite-kingdom', title: 'The Aksumite Kingdom' },
          { id: 'history-g9-zagwe-sultanate-shewa', title: 'The Zagwe Dynasty and the Sultanate of Shewa' },
        ],
      },
      {
        id: 'history-g9-middle-ages-early-modern-world',
        title: 'Middle Ages and Early Modern World',
        grade: 9,
        description: 'Medieval Europe and Byzantium, the rise of Islam and the Ottoman Empire, early capitalism and the Age of Exploration, the Renaissance and Reformation, and the Industrial Revolution.',
        lessons: [
          { id: 'history-g9-middle-ages-europe', title: 'The Middle Ages in Europe: From the Dark Ages to Byzantium' },
          { id: 'history-g9-middle-ages-asia-islam-ottomans', title: 'The Rise of Islam and the Ottoman Empire' },
          { id: 'history-g9-early-capitalism-exploration', title: 'Early Capitalism and the Age of Exploration' },
          { id: 'history-g9-renaissance-reformation', title: 'The Renaissance and the Reformation' },
          { id: 'history-g9-industrial-revolution', title: 'The Industrial Revolution' },
        ],
      },
      {
        id: 'history-g9-peoples-states-africa-to-1500',
        title: 'Peoples and States of Africa to 1500',
        grade: 9,
        description: "Africa's language families, the Islamic states of North and West Africa, Great Zimbabwe and southern Africa's kingdoms, and Africa's trade networks and outside contacts before 1500.",
        lessons: [
          { id: 'history-g9-languages-peoples-africa', title: 'Languages and Peoples of Africa' },
          { id: 'history-g9-north-african-states', title: 'North African States: Mamluk Egypt and the Funj Sultanate' },
          { id: 'history-g9-west-african-empires', title: 'Islam and the Empires of West Africa: Ghana, Mali, and Songhai' },
          { id: 'history-g9-kanem-hausa-swahili-coast', title: "Kanem-Bornu, the Hausa States, and East Africa's Swahili Coast" },
          { id: 'history-g9-southern-africa-zimbabwe', title: 'Southern Africa: Great Zimbabwe, the Khoi-Khoi, and the San' },
          { id: 'history-g9-africa-trade-outside-contacts', title: "Africa's Trade Networks and Contact with the Outside World" },
        ],
      },
      {
        id: 'history-g9-africa-outside-world-1500-1880s',
        title: 'Africa and the Outside World, 1500-1880s',
        grade: 9,
        description: 'Portugal’s early contact with West Africa, the Trans-Atlantic slave trade and the "legitimate" trade that followed it, white settlement in South Africa, and European explorers and missionaries.',
        lessons: [
          { id: 'history-g9-portugal-west-africa-contact', title: 'Portugal’s Early Contact with West Africa' },
          { id: 'history-g9-trans-atlantic-slave-trade', title: 'The Trans-Atlantic Slave Trade' },
          { id: 'history-g9-legitimate-trade', title: '"Legitimate" Trade After Abolition' },
          { id: 'history-g9-white-settlement-south-africa', title: 'White Settlement in South Africa' },
          { id: 'history-g9-european-explorers-missionaries', title: 'European Explorers and Missionaries' },
        ],
      },
    ],
  },
  {
    // Same as history above — Social Science-stream-only, no lesson content yet.
    id: 'geography',
    name: 'Geography',
    icon: 'earth-outline',
    streams: ['social'],
    units: [
      {
        id: 'geography-g9-physical-setting',
        title: "Geography and Ethiopia's Physical Setting",
        grade: 9,
        description: "What geography studies, and Ethiopia's location, size, shape, geological eras, and landforms.",
        lessons: [
          { id: 'geography-g9-what-is-geography', title: 'What Is Geography?' },
          { id: 'geography-g9-location-size-shape-ethiopia', title: "Ethiopia's Location, Size and Shape" },
          { id: 'geography-g9-geological-eras-ethiopia', title: "Ethiopia's Four Geological Eras" },
          { id: 'geography-g9-landforms-ethiopia', title: "Ethiopia's Landforms and Physiographic Regions" },
        ],
      },
      {
        id: 'geography-g9-climate',
        title: 'Climate of Ethiopia',
        grade: 9,
        description: "Weather vs. climate, what controls Ethiopia's climate, agro-climatic zones, seasons and rainfall regions, and the instruments used to measure weather.",
        lessons: [
          { id: 'geography-g9-weather-climate-elements', title: 'Weather vs. Climate' },
          { id: 'geography-g9-controls-of-climate', title: "What Controls Ethiopia's Climate?" },
          { id: 'geography-g9-agro-climatic-zones', title: "Ethiopia's Five Agro-Climatic Zones" },
          { id: 'geography-g9-seasons-rainfall-regions', title: "Ethiopia's Seasons and Rainfall Regions" },
          { id: 'geography-g9-measuring-weather', title: 'Instruments for Measuring Weather and Climate' },
        ],
      },
      {
        id: 'geography-g9-natural-resources',
        title: 'Natural Resource Base of Ethiopia',
        grade: 9,
        description: "Ethiopia's drainage systems, rivers and lakes, soil types, mineral resources, and natural vegetation and wildlife.",
        lessons: [
          { id: 'geography-g9-natural-resources-drainage', title: 'Natural Resources and Drainage Systems' },
          { id: 'geography-g9-rivers-lakes-ethiopia', title: 'Rivers and Lakes of Ethiopia' },
          { id: 'geography-g9-soil-types-ethiopia', title: 'Major Soil Types of Ethiopia' },
          { id: 'geography-g9-mineral-resources-ethiopia', title: 'Mineral Resources of Ethiopia' },
          { id: 'geography-g9-vegetation-wildlife-ethiopia', title: 'Natural Vegetation and Wildlife of Ethiopia' },
        ],
      },
      {
        id: 'geography-g9-population-ethiopia',
        title: 'Population and Demographic Characteristics of Ethiopia',
        grade: 9,
        description: "Human population concepts, Ethiopia's population growth, age/sex composition, distribution, settlement patterns, health, population pressure, and language/religious diversity.",
        lessons: [
          { id: 'geography-g9-population-concept-growth', title: "Human Population and Ethiopia's Growth" },
          { id: 'geography-g9-population-composition', title: 'Population Composition: Age and Sex Structure' },
          { id: 'geography-g9-population-distribution', title: 'Population Distribution and Density' },
          { id: 'geography-g9-settlement-health-ethiopia', title: 'Settlement Patterns and Health in Ethiopia' },
          { id: 'geography-g9-population-growth-impacts-diversity', title: 'Population Growth Impacts, Language and Religion' },
        ],
      },
    ],
  },
  {
    id: 'economics',
    name: 'Economics',
    icon: 'trending-up-outline',
    streams: ['social'],
    units: [
      {
        id: 'economics-resources-and-markets',
        title: 'Economic Resources and Markets',
        grade: 9,
        description: 'Free vs. scarce resources, the four factors of production, renewable resources, market types, circular flow of income, and land as a resource in Ethiopia.',
        lessons: [
          { id: 'economics-resources-factor-payments', title: 'Economic Resources and Factor Payments' },
          { id: 'economics-renewable-nonrenewable-resources', title: 'Renewable and Non-Renewable Resources' },
          { id: 'economics-types-of-markets', title: 'Types of Markets' },
          { id: 'economics-circular-flow-of-income', title: 'Circular Flow of Income' },
          { id: 'economics-land-resource-ethiopia', title: 'Land as an Economic Resource in Ethiopia' },
        ],
      },
      {
        id: 'economics-demand-and-supply-basics',
        title: 'Introduction to Demand and Supply',
        grade: 9,
        description: 'The concepts of demand and supply, their laws and schedules, and how they determine market equilibrium.',
        lessons: [
          { id: 'economics-concept-of-demand', title: 'The Concept of Demand' },
          { id: 'economics-concept-of-supply', title: 'The Concept of Supply' },
          { id: 'economics-market-equilibrium', title: 'Market Equilibrium' },
        ],
      },
      {
        id: 'economics-production-and-cost',
        title: 'Introduction to Production and Cost',
        grade: 9,
        description: 'Short-run and long-run production, total/average/marginal product, and the different types of production cost.',
        lessons: [
          { id: 'economics-production-periods-and-inputs', title: 'Production Periods and Inputs' },
          { id: 'economics-total-average-marginal-product', title: 'Total, Average, and Marginal Product' },
          { id: 'economics-explicit-implicit-costs', title: 'Explicit and Implicit Costs' },
          { id: 'economics-fixed-variable-total-cost', title: 'Fixed, Variable, and Total Cost' },
        ],
      },
      {
        id: 'economics-introduction-to-money',
        title: 'Introduction to Money',
        grade: 9,
        description: "What money is, how it evolved (including Ethiopia's own monetary history), its four functions, why people and the economy hold it, and electronic money.",
        lessons: [
          { id: 'economics-definition-of-money', title: 'What Makes Something Money?' },
          { id: 'economics-evolution-of-money', title: 'The Evolution of Money' },
          { id: 'economics-functions-of-money', title: 'The Functions of Money' },
          { id: 'economics-demand-and-supply-of-money', title: 'Demand and Supply of Money' },
          { id: 'economics-electronic-money', title: 'Electronic Money' },
        ],
      },
      {
        id: 'economics-macroeconomics-basics',
        title: 'Introduction to Macroeconomics',
        grade: 9,
        description: 'The goals of macroeconomic policy, GDP/GNP and per capita income, inflation and unemployment, and the balance of trade and payments.',
        lessons: [
          { id: 'economics-macroeconomic-goals', title: 'The Goals of Macroeconomic Policy' },
          { id: 'economics-macroeconomic-variables', title: 'GDP, GNP, and Per Capita Income' },
          { id: 'economics-inflation-and-unemployment', title: 'Inflation and Unemployment' },
          { id: 'economics-trade-balance-and-payments', title: 'Trade Balance and Balance of Payments' },
        ],
      },
      {
        id: 'economics-g9-entrepreneurship',
        title: 'Basic Entrepreneurship',
        grade: 9,
        description: 'What enterprise and entrepreneurship mean, the path from creativity to innovation, entrepreneurial attitudes and opportunities, and why teamwork matters for entrepreneurial success.',
        lessons: [
          { id: 'economics-entrepreneurship-basics', title: 'Enterprise, Entrepreneur, and Entrepreneurship' },
          { id: 'economics-creativity-innovation-entrepreneurship', title: 'From Creativity to Innovation to Entrepreneurship' },
          { id: 'economics-entrepreneurial-attitudes', title: 'Entrepreneurial Attitudes and Skills' },
          { id: 'economics-entrepreneurial-opportunities', title: 'Spotting Entrepreneurial Opportunities' },
          { id: 'economics-teamwork-and-diversity', title: 'Why Teamwork Matters for Entrepreneurial Success' },
        ],
      },
      {
        id: 'economics-g10-demand-and-supply-theory',
        title: 'Theories of Demand and Supply',
        grade: 10,
        description: 'Market equilibrium, shortage and surplus, what shifts demand and supply curves, and the price, cross, and income elasticity of demand and supply.',
        lessons: [
          { id: 'economics-g10-market-equilibrium', title: 'Market Equilibrium, Shortage, and Surplus' },
          { id: 'economics-g10-shifts-in-demand-and-supply', title: 'What Shifts Demand and Supply?' },
          { id: 'economics-g10-price-elasticity-of-demand', title: 'Price Elasticity of Demand' },
          { id: 'economics-g10-cross-and-income-elasticity', title: 'Cross and Income Elasticity of Demand' },
          { id: 'economics-g10-price-elasticity-of-supply', title: 'Price Elasticity of Supply' },
        ],
      },
    ],
  },
  {
    // New-curriculum-only for now, same reasoning as history/geography/
    // economics above — no lesson content yet, textbook-only. The old-
    // curriculum ICT books (a different subject slug the ingest pipeline
    // used, "information-communication-technology-ict") aren't imported:
    // the data model has no field to distinguish old vs new curriculum for
    // the same subject+grade, so — matching how economics' old-curriculum
    // books were handled — only the new-curriculum books are in.
    id: 'information-technology',
    name: 'Information Technology',
    icon: 'laptop-outline',
    streams: ['natural', 'social'],
    units: [
      {
        id: 'files-and-folders',
        title: 'Files and Folders',
        grade: 9,
        description: 'Create, organize, and manage files, folders, and drives on a computer.',
        lessons: [
          { id: 'files-and-folders-basics', title: 'Files & Folders Basics' },
          { id: 'managing-files-and-folders', title: 'Managing Files and Folders' },
          { id: 'computer-drives', title: 'Computer Drives' },
        ],
      },
      {
        id: 'it-g9-networking',
        title: 'Networking',
        grade: 9,
        description: 'How computers connect, share resources, and communicate — from cables and switches to network types and topologies.',
        lessons: [
          { id: 'it-g9-networking-basics', title: 'What Is a Network?' },
          { id: 'it-g9-networking-devices', title: 'Network Hardware & Devices' },
          { id: 'it-g9-network-types', title: 'Types of Networks by Size & Topology' },
          { id: 'it-g9-network-access-impact', title: 'Network Access, Advantages & Disadvantages' },
        ],
      },
      {
        id: 'it-g9-app-software',
        title: 'Application Software',
        grade: 9,
        description: 'Word processors, spreadsheets, and presentation software — the everyday tools for creating documents, analyzing data, and presenting ideas.',
        lessons: [
          { id: 'it-g9-appsoftware-word-basics', title: 'Word Processing Basics' },
          { id: 'it-g9-appsoftware-paragraph-formatting', title: 'Formatting Paragraphs in Word' },
          { id: 'it-g9-appsoftware-headers-pagebreaks', title: 'Page Breaks, Page Numbers, Headers & Footers' },
          { id: 'it-g9-appsoftware-spreadsheet-formulas', title: 'Spreadsheet Formulas & Cell References' },
          { id: 'it-g9-appsoftware-presentations', title: 'Creating Presentations' },
        ],
      },
      {
        id: 'it-g9-image-processing',
        title: 'Image Processing & Multimedia',
        grade: 9,
        description: 'Digital images and pixels, the tools inside an image editor, cropping and resizing, fixing color and sharpness, and planning multimedia with a storyboard.',
        lessons: [
          { id: 'it-g9-imageproc-digital-images', title: 'Digital Images and Pixels' },
          { id: 'it-g9-imageproc-editing-tools', title: 'Inside an Image Editor' },
          { id: 'it-g9-imageproc-crop-resize', title: 'Cropping and Resizing an Image' },
          { id: 'it-g9-imageproc-color-sharpen', title: 'Fixing Color, Light, and Sharpness' },
          { id: 'it-g9-imageproc-storyboards', title: 'Planning Multimedia with a Storyboard' },
        ],
      },
      {
        id: 'it-g9-computer-security',
        title: 'Computer Security',
        grade: 9,
        description: 'What computer security means, the CIA triad, common cyber-attacks, what security incidents can cost, and how to stay safe online.',
        lessons: [
          { id: 'it-g9-security-fundamentals', title: 'What Is Computer Security?' },
          { id: 'it-g9-security-cia', title: 'The CIA Triad' },
          { id: 'it-g9-security-cyberattacks', title: 'Common Types of Cyber-Attacks' },
          { id: 'it-g9-security-impacts', title: 'What Security Attacks Can Cost You' },
          { id: 'it-g9-security-staying-safe', title: 'Staying Safe Online' },
        ],
      },
      {
        id: 'it-g9-programming-fundamentals',
        title: 'Fundamentals of Programming',
        grade: 9,
        description: 'What makes a problem solvable by computer, how to plan a solution with algorithms and flowcharts, and the top-down and bottom-up strategies for building programs.',
        lessons: [
          { id: 'it-g9-problem-solving-computational', title: 'Problems & Computational Problems' },
          { id: 'it-g9-problem-solving-steps', title: 'From Problem to Program' },
          { id: 'it-g9-problem-solving-flowcharts', title: 'Flowcharts and Three Kinds of Flow' },
          { id: 'it-g9-problem-solving-decisions-loops', title: 'Decisions and Loops in Action' },
          { id: 'it-g9-problem-solving-approaches', title: 'Top-Down vs. Bottom-Up Approaches' },
        ],
      },
      {
        id: 'it-g10-file-management',
        title: 'File Management',
        grade: 10,
        description: 'Advanced file management — drives, file extensions and paths, converting and transferring files, backup and compression, and deleting and restoring files.',
        lessons: [
          { id: 'it-g10-filemgmt-drives', title: 'File Management and Disk Drives' },
          { id: 'it-g10-filemgmt-extensions-paths', title: 'File Extensions and File Paths' },
          { id: 'it-g10-filemgmt-convert-import-export', title: 'Converting, Importing & Exporting Files' },
          { id: 'it-g10-filemgmt-backup-compression', title: 'Backup, Recovery & Compression' },
          { id: 'it-g10-filemgmt-delete-restore', title: 'Deleting & Restoring Files' },
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
      create: { id: subject.id, slug: subject.id, name: subject.name, icon: subject.icon, streams: subject.streams },
      update: { name: subject.name, icon: subject.icon, streams: subject.streams },
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

      // A lesson removed from a unit's list above (not just renamed — upsert
      // handles that) would otherwise sit orphaned in the DB forever. Cascades
      // to its LessonStep rows via the schema's onDelete: Cascade.
      await prisma.lesson.deleteMany({
        where: { unitId: unit.id, id: { notIn: unit.lessons.map((l) => l.id) } },
      });
    }

    // Same problem one level up: a unit dropped from SUBJECTS (e.g. the old
    // placeholder "human-physiology" replaced by the real curriculum's units)
    // would otherwise stay in the DB, orphaned, forever — upsert only ever
    // creates/updates, it never notices something was removed.
    await prisma.unit.deleteMany({
      where: { subjectId: subject.id, id: { notIn: subject.units.map((u) => u.id) } },
    });
  }

  console.log('Seeding practice question bank...');
  for (const [subjectId, questions] of Object.entries(QUESTION_BANKS)) {
    // Only the generic bank is replaced — imported past papers carry an
    // examYear and would otherwise be wiped by a routine re-seed.
    await prisma.question.deleteMany({ where: { subjectId, examYear: null } });
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
