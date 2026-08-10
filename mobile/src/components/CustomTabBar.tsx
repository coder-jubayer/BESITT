import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows } from '../theme';

const TABS = [
  { name: 'home', label: 'Home', icon: 'home-outline' as const, iconActive: 'home' as const },
  { name: 'community', label: 'Community', icon: 'people-outline' as const, iconActive: 'people' as const },
  { name: 'services', label: 'Services', icon: 'grid-outline' as const, iconActive: 'grid' as const },
  { name: 'guests', label: 'Guests', icon: 'shield-checkmark-outline' as const, iconActive: 'shield-checkmark' as const },
  { name: 'profile', label: 'Profile', icon: 'person-outline' as const, iconActive: 'person' as const },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab, index) => {
        const route = state.routes.find((r: { name: string }) => r.name === tab.name);
        if (!route) return null;

        const isFocused = state.index === state.routes.indexOf(route);
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (index === 2) {
          return (
            <Pressable
              key={tab.name}
              onPress={onPress}
              style={({ pressed }) => [styles.centerBtn, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <Ionicons name="grid" size={28} color={colors.white} />
            </Pressable>
          );
        }

        return (
          <Pressable key={tab.name} onPress={onPress} style={styles.tab}>
            <Ionicons
              name={isFocused ? tab.iconActive : tab.icon}
              size={24}
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
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 72,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -48,
    borderWidth: 6,
    borderColor: colors.white,
    ...shadows.fab,
  },
});
