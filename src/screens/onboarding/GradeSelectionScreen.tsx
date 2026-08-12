import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ChoiceCard } from '../../components/onboarding/ChoiceCard';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'GradeSelection'>;

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'UEE Repeat Candidate'];

export function GradeSelectionScreen({ navigation }: Props) {
  const [selected, setSelected] = useState('Grade 12');

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      step={0}
      totalSteps={5}
      title="What grade are you in?"
      subtitle="This helps us tailor your curriculum."
      primaryLabel="Continue"
      onPrimaryPress={() => navigation.navigate('SubjectSelection')}
    >
      {GRADES.map((grade) => (
        <ChoiceCard key={grade} label={grade} selected={selected === grade} onPress={() => setSelected(grade)} />
      ))}
    </OnboardingLayout>
  );
}
