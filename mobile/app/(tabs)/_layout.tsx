import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CustomTabBar } from '../../src/components/CustomTabBar';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { colors } from '../../src/theme';
import { useAuthStore } from '../../src/stores/auth.store';
import { isGuard } from '../../src/types';

export default function TabsLayout() {
  const guard = isGuard(useAuthStore((s) => s.user)?.role);

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="community" />
        <Tabs.Screen name="services" />
        <Tabs.Screen name="guests" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {guard ? null : <FloatingChatButton />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
});
