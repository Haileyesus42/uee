import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingFlowProvider } from './OnboardingFlowContext';
import { OnboardingStackParamList } from './types';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { AuthScreen } from '../screens/onboarding/AuthScreen';
import { OtpVerificationScreen } from '../screens/onboarding/OtpVerificationScreen';
import { GradeSelectionScreen } from '../screens/onboarding/GradeSelectionScreen';
import { SubjectSelectionScreen } from '../screens/onboarding/SubjectSelectionScreen';
import { UeeGoalScreen } from '../screens/onboarding/UeeGoalScreen';
import { TargetScoreScreen } from '../screens/onboarding/TargetScoreScreen';
import { DailyStudyGoalScreen } from '../screens/onboarding/DailyStudyGoalScreen';
import { DiagnosticIntroductionScreen } from '../screens/onboarding/DiagnosticIntroductionScreen';
import { DiagnosticQuestionScreen } from '../screens/onboarding/DiagnosticQuestionScreen';
import { DiagnosticResultsScreen } from '../screens/onboarding/DiagnosticResultsScreen';
import { PersonalizedPathScreen } from '../screens/onboarding/PersonalizedPathScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator({ onComplete }: { onComplete: () => void }) {
  return (
    <OnboardingFlowProvider complete={onComplete}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="GradeSelection" component={GradeSelectionScreen} />
        <Stack.Screen name="SubjectSelection" component={SubjectSelectionScreen} />
        <Stack.Screen name="UeeGoal" component={UeeGoalScreen} />
        <Stack.Screen name="TargetScore" component={TargetScoreScreen} />
        <Stack.Screen name="DailyStudyGoal" component={DailyStudyGoalScreen} />
        <Stack.Screen name="DiagnosticIntroduction" component={DiagnosticIntroductionScreen} />
        <Stack.Screen name="DiagnosticQuestion" component={DiagnosticQuestionScreen} />
        <Stack.Screen name="DiagnosticResults" component={DiagnosticResultsScreen} />
        <Stack.Screen name="PersonalizedPath" component={PersonalizedPathScreen} />
      </Stack.Navigator>
    </OnboardingFlowProvider>
  );
}
