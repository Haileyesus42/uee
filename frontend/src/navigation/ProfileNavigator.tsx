import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { StatisticsScreen } from '../screens/profile/StatisticsScreen';
import { AchievementsScreen } from '../screens/profile/AchievementsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PremiumScreen } from '../screens/profile/PremiumScreen';
import { HelpScreen } from '../screens/profile/HelpScreen';
import { MistakesBookScreen } from '../screens/profile/MistakesBookScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ProfileHome">
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="MistakesBook" component={MistakesBookScreen} />
    </Stack.Navigator>
  );
}
