import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows } from '../theme';

type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: { navigate: (name: string) => void };
};

const TABS = [
  {
    name: 'overview',
    label: 'Overview',
    icon: 'stats-chart-outline' as const,
    iconActive: 'stats-chart' as const,
  },
  {
    name: 'buildings',
    label: 'Buildings',
    icon: 'business-outline' as const,
    iconActive: 'business' as const,
  },
  {
    name: 'users',
    label: 'Users',
    icon: 'people-outline' as const,
    iconActive: 'people' as const,
  },
  {
    name: 'settings',
    label: 'Settings',
    icon: 'settings-outline' as const,
    iconActive: 'settings' as const,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: 'person-outline' as const,
    iconActive: 'person' as const,
  },
];

export function AdminTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const isFocused = state.index === state.routes.indexOf(route);
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <Ionicons
              name={isFocused ? tab.iconActive : tab.icon}
              size={22}
              color={isFocused ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    ...shadows.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  labelActive: { color: colors.primary },
});
