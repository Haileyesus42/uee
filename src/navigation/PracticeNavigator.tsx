import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PracticeStackParamList } from './types';
import { PracticeHubScreen } from '../screens/practice/PracticeHubScreen';
import { QuizSetupScreen } from '../screens/practice/QuizSetupScreen';
import { QuizRunnerScreen } from '../screens/practice/QuizRunnerScreen';
import { ResultsScreen } from '../screens/practice/ResultsScreen';
import { MockExamsListScreen } from '../screens/practice/MockExamsListScreen';

const Stack = createNativeStackNavigator<PracticeStackParamList>();

export function PracticeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PracticeHub">
      <Stack.Screen name="PracticeHub" component={PracticeHubScreen} />
      <Stack.Screen name="QuizSetup" component={QuizSetupScreen} />
      <Stack.Screen name="MockExamsList" component={MockExamsListScreen} />
      <Stack.Screen name="QuizRunner" component={QuizRunnerScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
}
