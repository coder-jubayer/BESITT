import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AdminTabBar } from '../../src/components/AdminTabBar';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <AdminTabBar state={props.state} navigation={props.navigation} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="overview" />
        <Tabs.Screen name="buildings" />
        <Tabs.Screen name="users" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
});
