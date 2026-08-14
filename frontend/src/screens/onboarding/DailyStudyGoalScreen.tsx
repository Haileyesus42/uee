import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ChoiceCard } from '../../components/onboarding/ChoiceCard';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'DailyStudyGoal'>;

const GOALS = [
  { label: '5 minutes / day', description: 'Light' },
  { label: '10 minutes / day', description: 'Easy' },
  { label: '15 minutes / day', description: 'Steady' },
  { label: '30 minutes / day', description: 'Serious' },
  { label: '60 minutes / day', description: 'Intense' },
];

export function DailyStudyGoalScreen({ navigation }: Props) {
  const [selected, setSelected] = useState(GOALS[2].label);

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      step={4}
      totalSteps={5}
      title="Set a daily study goal"
      subtitle="A little consistency beats a lot of cramming."
      primaryLabel="Continue"
      onPrimaryPress={() => navigation.navigate('DiagnosticIntroduction')}
    >
      {GOALS.map((goal) => (
        <ChoiceCard
          key={goal.label}
          label={goal.label}
          description={goal.description}
          selected={selected === goal.label}
          onPress={() => setSelected(goal.label)}
        />
      ))}
    </OnboardingLayout>
  );
}
