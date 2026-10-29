export type MotivationalNotification = {
  title: string;
  body: string;
  category: 'motivation' | 'study' | 'challenge' | 'encouragement' | 'dream';
};

export const MOTIVATIONAL_NOTIFICATIONS: MotivationalNotification[] = [
  // 🌅 A fresh start
  {
    title: 'Your next chapter starts today 🌱',
    body: "One topic, one lesson, one small win. That's how big dreams become real.",
    category: 'motivation',
  },
  {
    title: 'Hey, future university student! 🎓',
    body: 'Your dream is worth working for. What will you learn today?',
    category: 'dream',
  },
  {
    title: 'Today has potential ✨',
    body: "You don't need a perfect plan. Start with one question and build from there.",
    category: 'motivation',
  },
  {
    title: 'A little progress goes a long way 💚',
    body: 'Even 15 focused minutes can move you forward. Got a few minutes to spare?',
    category: 'motivation',
  },
  {
    title: 'Make today count 🎯',
    body: "Somewhere on your university journey, today's effort will matter. Keep going.",
    category: 'dream',
  },
  {
    title: 'Your dream called 📞',
    body: 'It asked you to keep going, even when progress feels slow.',
    category: 'motivation',
  },

  // 🧠 Curiosity and learning
  {
    title: 'What will finally click today? 💡',
    body: 'That difficult topic might make sense with one more explanation. Give it another try.',
    category: 'study',
  },
  {
    title: "Don't just memorize. Discover. 🔍",
    body: 'Understanding why a formula works is even more powerful than remembering it.',
    category: 'study',
  },
  {
    title: 'One question can teach you a lot 📝',
    body: 'Try a past-paper question today. Your mistakes can show you exactly what to improve.',
    category: 'study',
  },
  {
    title: 'Curiosity is your superpower 🧠',
    body: "When you don't understand something, ask why. That's where real learning begins.",
    category: 'study',
  },
  {
    title: "Ready for that 'aha!' moment? ✨",
    body: 'Revisit something that confused you before. You might understand more than you think.',
    category: 'study',
  },
  {
    title: 'Turn confusion into clarity 💡',
    body: 'Choose one tricky concept, break it into smaller pieces, and tackle it step by step.',
    category: 'study',
  },
  {
    title: 'Your brain is making connections 🔗',
    body: "Revision helps ideas stick together. Give yesterday's lesson a quick review.",
    category: 'study',
  },

  // 🎯 Fun challenges
  {
    title: 'Quick challenge? 👀',
    body: 'Try answering 5 UEE questions without checking the solutions. See how you do!',
    category: 'challenge',
  },
  {
    title: 'Can you beat your personal best? 🏆',
    body: 'Open a practice session and see whether you can improve on your last score.',
    category: 'challenge',
  },
  {
    title: 'Your 10-minute mission starts now ⏱️',
    body: "Pick one subject. Answer a few questions. Finish knowing something you didn't before.",
    category: 'challenge',
  },
  {
    title: "Let's test that knowledge 🎯",
    body: 'Reading feels familiar. Solving questions proves what you understand. Ready to try?',
    category: 'challenge',
  },
  {
    title: "Today's mini-mission 🚀",
    body: "Solve one question you've been avoiding. Small victories build real confidence.",
    category: 'challenge',
  },
  {
    title: 'Think you know the topic? 🤔',
    body: 'Put your understanding to the test with a few practice questions.',
    category: 'challenge',
  },
  {
    title: 'Five questions. One small victory. 💪',
    body: "You don't need to finish an entire chapter to make progress today.",
    category: 'challenge',
  },
  {
    title: 'A challenge worth accepting? 😎',
    body: 'Choose your weakest subject and spend 10 focused minutes improving it.',
    category: 'challenge',
  },

  // 💚 When studying feels difficult
  {
    title: "It's okay not to know everything 🤍",
    body: "You're preparing to learn, not proving that you already know it all. Keep going.",
    category: 'encouragement',
  },
  {
    title: "A difficult day isn't a failed day 🌱",
    body: 'One concept understood is progress. One mistake corrected is progress, too.',
    category: 'encouragement',
  },
  {
    title: "That score doesn't define you 💚",
    body: 'A practice result shows where you are today, not how far you can go.',
    category: 'encouragement',
  },
  {
    title: 'Take a breath. Try again. 🌿',
    body: 'Some questions need another look. Read carefully, think slowly, and take your time.',
    category: 'encouragement',
  },
  {
    title: 'Feeling stuck? Change your approach 💡',
    body: 'Try an example, review the formula, or ask Unity to explain the concept differently.',
    category: 'encouragement',
  },
  {
    title: 'You can have a slow day ❤️',
    body: "Rest when you need it. When you're ready, start again with one manageable task.",
    category: 'encouragement',
  },
  {
    title: "Progress isn't always a high score 🌱",
    body: 'Sometimes progress is finally understanding the question you got wrong yesterday.',
    category: 'encouragement',
  },
  {
    title: "Don't let one hard subject scare you 📚",
    body: 'Break it down, learn one idea at a time, and give yourself room to improve.',
    category: 'encouragement',
  },

  // 🔥 Discipline without the pressure
  {
    title: 'Show up for yourself today 💪',
    body: 'Motivation comes and goes. A small, realistic study habit can carry you further.',
    category: 'motivation',
  },
  {
    title: 'Consistency beats cramming 📖',
    body: 'A little revision throughout the week can help more than one exhausting session.',
    category: 'study',
  },
  {
    title: "Your future deserves today's effort 🎓",
    body: "You can't control every exam question. You can control how you prepare.",
    category: 'dream',
  },
  {
    title: 'Start before you feel ready 🚀',
    body: "You don't have to feel motivated to begin. Sometimes motivation follows the first step.",
    category: 'motivation',
  },
  {
    title: 'Make learning a little easier tomorrow 🌟',
    body: "Review one thing today that you don't want to forget by exam day.",
    category: 'study',
  },
  {
    title: 'Small habits. Strong foundations. 🧱',
    body: 'Every lesson you understand makes the next one a little easier.',
    category: 'motivation',
  },

  // 🎓 The university dream
  {
    title: 'Picture that acceptance moment 🎓',
    body: "Imagine seeing the result you've worked for. Let that dream give today's study session purpose.",
    category: 'dream',
  },
  {
    title: 'Your future is still being written ✍️',
    body: "Today's chapter might be difficult, but you haven't reached the ending yet.",
    category: 'dream',
  },
  {
    title: 'Big dreams are built in ordinary moments 🌟',
    body: "A quiet revision session today could be part of a story you'll be proud to tell.",
    category: 'dream',
  },
  {
    title: 'Keep your destination in sight 🧭',
    body: 'Every concept you master brings you closer to being ready for the exam.',
    category: 'dream',
  },
  {
    title: "One day, you'll look back and smile 💚",
    body: 'For now, keep learning. Your hard work is part of the journey.',
    category: 'dream',
  },
  {
    title: 'Your ambition deserves a plan 🚀',
    body: 'Choose one topic, set a small goal, and take the next step toward university.',
    category: 'dream',
  },

  // 😊 Light, playful and relatable
  {
    title: 'Your brain wants a little exercise 🧠',
    body: 'No running shoes needed. Just open a practice session and solve a few questions!',
    category: 'challenge',
  },
  {
    title: 'Plot twist: You understand it now! 💡',
    body: "That confusing topic might be getting easier. Revisit it and see how much you've learned.",
    category: 'study',
  },
  {
    title: "Let's make your brain say 'I've got this!' 😎",
    body: 'Pick a topic you know and warm up with a few questions before tackling something harder.',
    category: 'challenge',
  },
  {
    title: 'A little academic adventure? 🗺️',
    body: "Explore a topic you've never understood properly. You might discover something interesting.",
    category: 'study',
  },
  {
    title: 'Future you called again 📞',
    body: "They're wondering whether you practiced today. What should we tell them?",
    category: 'challenge',
  },
  {
    title: 'Your next correct answer is waiting 🎯',
    body: "You won't know until you try. Give yourself a chance with a quick practice session.",
    category: 'challenge',
  },

  // 🌙 Gentle reminders
  {
    title: 'A little review before you go? 🌙',
    body: 'Revisit one thing you learned recently. Small reviews can help you remember it longer.',
    category: 'study',
  },
  {
    title: 'You made it through today 🤍',
    body: 'Be proud of the effort you gave. Tomorrow brings another chance to learn and grow.',
    category: 'encouragement',
  },
  {
    title: 'Give your mind room to rest 🌿',
    body: "Rest is part of learning, too. Recharge and return when you're ready.",
    category: 'encouragement',
  },
  {
    title: 'Tomorrow starts with what you learn today ✨',
    body: 'Before you finish, choose one small goal for your next study session.',
    category: 'motivation',
  },
];