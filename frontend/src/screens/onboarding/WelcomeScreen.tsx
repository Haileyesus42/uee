import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <OnboardingLayout
      icon="compass-outline"
      title="Master the UEE, one lesson at a time"
      subtitle="Interactive lessons, real past exams, and an AI teacher — built around what you need to improve."
      primaryLabel="Get Started"
      onPrimaryPress={() => navigation.navigate('Auth')}
    />
  );
}
