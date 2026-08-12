import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ChoiceCard } from '../../components/onboarding/ChoiceCard';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SubjectSelection'>;

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];

export function SubjectSelectionScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>(['Mathematics', 'Physics']);

  function toggle(subject: string) {
    setSelected((prev) => (prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]));
  }

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      step={1}
      totalSteps={5}
      title="Which subjects are you preparing for?"
      subtitle="Select all that apply to your UEE stream."
      primaryLabel="Continue"
      primaryDisabled={selected.length === 0}
      onPrimaryPress={() => navigation.navigate('UeeGoal')}
    >
      {SUBJECTS.map((subject) => (
        <ChoiceCard
          key={subject}
          label={subject}
          multiSelect
          selected={selected.includes(subject)}
          onPress={() => toggle(subject)}
        />
      ))}
    </OnboardingLayout>
  );
}
