import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeaderboardStackParamList } from './types';
import { LeaderboardHomeScreen } from '../screens/leaderboard/LeaderboardHomeScreen';
import { SchoolPickerScreen } from '../screens/leaderboard/SchoolPickerScreen';

const Stack = createNativeStackNavigator<LeaderboardStackParamList>();

export function LeaderboardNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="LeaderboardHome">
      <Stack.Screen name="LeaderboardHome" component={LeaderboardHomeScreen} />
      <Stack.Screen name="SchoolPicker" component={SchoolPickerScreen} />
    </Stack.Navigator>
  );
}