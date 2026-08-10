import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CustomTabBar } from '../../src/components/CustomTabBar';
import { FloatingChatButton } from '../../src/components/FloatingChatButton';
import { colors } from '../../src/theme';

export default function TabsLayout() {
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
      <FloatingChatButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
});
