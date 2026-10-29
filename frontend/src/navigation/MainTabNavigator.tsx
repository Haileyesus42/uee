import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation, BOTTOM_NAV_CONTENT_HEIGHT, NavKey } from '../components/navigation/BottomNavigation';
import { UnityFloatingButton } from '../components/home/UnityFloatingButton';
import { UnityChatPanel } from '../components/home/UnityChatPanel';
import { useUnityChat } from '../context/UnityChatContext';
import { HomeNavigator } from './HomeNavigator';
import { LearnNavigator } from './LearnNavigator';
import { PracticeNavigator } from './PracticeNavigator';
import { UeeNavigator } from './UeeNavigator';
import { LeaderboardNavigator } from './LeaderboardNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Profile has no button in the bottom bar (see BottomNavigation's ITEMS) — it's
// reached only via the profile avatar in each tab-root screen's AppTopBar.
// It still needs an entry here so the active-tab lookup below stays exhaustive.
const ROUTE_TO_NAV: Record<keyof MainTabParamList, NavKey> = {
  Home: 'home',
  Learn: 'learn',
  Practice: 'practice',
  Uee: 'uee',
  Leaderboard: 'leaderboard',
  Profile: 'profile',
};

const NAV_TO_ROUTE: Record<NavKey, keyof MainTabParamList> = {
  home: 'Home',
  learn: 'Learn',
  practice: 'Practice',
  uee: 'Uee',
  leaderboard: 'Leaderboard',
  profile: 'Profile',
};

// Routes that render full-screen, without the bottom tab bar. The quiz runner
// is reached by a cross-stack jump from UEE (exam mode) as well as from
// Practice (mock mode); hiding the tab bar during the quiz is what makes both
// feel like dedicated full-screen exams rather than "practice with a
// different title." Deepest-focused-route tracking (below) already exists for
// TextbookReader's FAB-hide, so this reuses the same signal.
const FULLSCREEN_ROUTES = new Set(['QuizRunner']);

function CustomTabBar({ state, navigation, hidden }: BottomTabBarProps & { hidden?: boolean }) {
  if (hidden) return null;
  const activeRoute = state.routeNames[state.index] as keyof MainTabParamList;
  return (
    <BottomNavigation
      active={ROUTE_TO_NAV[activeRoute]}
      onChange={(key) => navigation.navigate(NAV_TO_ROUTE[key])}
    />
  );
}

// Deepest focused route name from a navigator state object. Called from the
// navigator's onStateChange rather than a hook — MainTabNavigator itself
// renders the navigator, so it is not inside a navigation context.
function deepestRouteName(state: any): string | undefined {
  let current = state;
  while (current?.routes?.[current.index ?? 0]?.state) {
    current = current.routes[current.index ?? 0].state;
  }
  return current?.routes?.[current.index ?? 0]?.name;
}

export function MainTabNavigator() {
  const { open: chatOpen, openChat, closeChat } = useUnityChat();
  const insets = useSafeAreaInsets();
  const [focusedRoute, setFocusedRoute] = useState<string | undefined>();
  const inFullScreen = !!focusedRoute && FULLSCREEN_ROUTES.has(focusedRoute);
  // The reader and full-screen quiz surfaces both need the FAB gone — the
  // reader because the bubble would sit over page controls, the quiz because
  // the FAB's position (computed from the tab bar's real height) would end up
  // floating mid-scene once the tab bar itself is hidden.
  const hideFab = focusedRoute === 'TextbookReader' || inFullScreen;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} hidden={inFullScreen} />}
        screenListeners={{
          state: (event) => setFocusedRoute(deepestRouteName(event.data.state)),
        }}
      >
        <Tab.Screen name="Home" component={HomeNavigator} />
        <Tab.Screen name="Learn" component={LearnNavigator} />
        <Tab.Screen name="Practice" component={PracticeNavigator} />
        <Tab.Screen name="Uee" component={UeeNavigator} />
        <Tab.Screen name="Leaderboard" component={LeaderboardNavigator} />
        <Tab.Screen name="Profile" component={ProfileNavigator} />
      </Tab.Navigator>

      {!chatOpen && !hideFab && (
        <UnityFloatingButton onPress={openChat} bottom={BOTTOM_NAV_CONTENT_HEIGHT + insets.bottom + 55} />
      )}
      <UnityChatPanel visible={chatOpen} onClose={closeChat} />
    </View>
  );
}