import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UeeStackParamList } from './types';
import { UeeHomeScreen } from '../screens/uee/UeeHomeScreen';
import { YearSubjectsScreen } from '../screens/uee/YearSubjectsScreen';
import { PaperViewerScreen } from '../screens/uee/PaperViewerScreen';
import { SolutionDetailScreen } from '../screens/uee/SolutionDetailScreen';

const Stack = createNativeStackNavigator<UeeStackParamList>();

export function UeeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="UeeHome">
      <Stack.Screen name="UeeHome" component={UeeHomeScreen} />
      <Stack.Screen name="YearSubjects" component={YearSubjectsScreen} />
      <Stack.Screen name="PaperViewer" component={PaperViewerScreen} />
      <Stack.Screen name="SolutionDetail" component={SolutionDetailScreen} />
    </Stack.Navigator>
  );
}
