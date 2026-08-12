import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ChoiceCard } from '../../components/onboarding/ChoiceCard';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'UeeGoal'>;

const GOALS = [
  { label: 'Pass the UEE', description: 'Build a solid, reliable foundation.' },
  { label: 'Improve my score', description: 'I want to score higher than my mocks.' },
  { label: 'Get into a specific university', description: "I'm targeting a particular program." },
  { label: 'Score in the top percentile', description: "I'm aiming as high as I can go." },
];

export function UeeGoalScreen({ navigation }: Props) {
  const [selected, setSelected] = useState(GOALS[1].label);

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      step={2}
      totalSteps={5}
      title="What's your main goal?"
      primaryLabel="Continue"
      onPrimaryPress={() => navigation.navigate('TargetScore')}
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
