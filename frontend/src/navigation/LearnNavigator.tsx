import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LearnStackParamList } from './types';
import { LearnHomeScreen } from '../screens/learn/LearnHomeScreen';
import { SubjectPathScreen } from '../screens/learn/SubjectPathScreen';
import { TopicDetailScreen } from '../screens/learn/TopicDetailScreen';
import { LessonIntroductionScreen } from '../screens/learn/LessonIntroductionScreen';
import { LessonScreen } from '../screens/learn/LessonScreen';
import { LessonCompleteScreen } from '../screens/learn/LessonCompleteScreen';
import { TextbookHomeScreen } from '../screens/learn/TextbookHomeScreen';
import { TextbookReaderScreen } from '../screens/learn/TextbookReaderScreen';
import { TextbookSearchScreen } from '../screens/learn/TextbookSearchScreen';
import { TextbookBookmarksScreen } from '../screens/learn/TextbookBookmarksScreen';

const Stack = createNativeStackNavigator<LearnStackParamList>();

export function LearnNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="LearnHome">
      <Stack.Screen name="LearnHome" component={LearnHomeScreen} />
      <Stack.Screen name="SubjectPath" component={SubjectPathScreen} />
      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
      <Stack.Screen name="LessonIntroduction" component={LessonIntroductionScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} />
      <Stack.Screen name="TextbookHome" component={TextbookHomeScreen} />
      <Stack.Screen name="TextbookReader" component={TextbookReaderScreen} />
      <Stack.Screen name="TextbookSearch" component={TextbookSearchScreen} />
      <Stack.Screen name="TextbookBookmarks" component={TextbookBookmarksScreen} />
    </Stack.Navigator>
  );
}
