import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ChoiceCard } from '../../components/onboarding/ChoiceCard';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TargetScore'>;

const RANGES = ['Below 400', '400 – 449', '450 – 499', '500 – 549', '550 and above'];

export function TargetScoreScreen({ navigation }: Props) {
  const [selected, setSelected] = useState(RANGES[2]);

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      step={3}
      totalSteps={5}
      title="What score are you aiming for?"
      subtitle="An estimate is fine — you can adjust this later."
      primaryLabel="Continue"
      onPrimaryPress={() => navigation.navigate('DailyStudyGoal')}
    >
      {RANGES.map((range) => (
        <ChoiceCard key={range} label={range} selected={selected === range} onPress={() => setSelected(range)} />
      ))}
    </OnboardingLayout>
  );
}
