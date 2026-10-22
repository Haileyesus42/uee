import React, { useState } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomNavigation, NavKey } from '../components/navigation/BottomNavigation';
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

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
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
  const [focusedRoute, setFocusedRoute] = useState<string | undefined>();
  // The reader is a full-screen reading surface; the chat bubble would cover
  // page controls, so it is hidden there.
  const hideFab = focusedRoute === 'TextbookReader';

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
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

      {/* Rendered as a sibling of the whole Tab.Navigator (tab bar included),
          not inside a single screen's scene container, so the default offset
          needs a manual bump to clear the bottom bar. Hidden while the chat
          panel is open since it slides in over the same corner. Chat open/close
          state lives in UnityChatContext so any screen — not just this one —
          can trigger it (e.g. the "ask Unity" affordance on quiz feedback). */}
      {!chatOpen && !hideFab && <UnityFloatingButton onPress={openChat} bottom={70} />}
      <UnityChatPanel visible={chatOpen} onClose={closeChat} />
    </View>
  );
}
