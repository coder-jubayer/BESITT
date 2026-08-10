import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
}

const VARIANTS = {
  success: { bg: colors.successLight, text: colors.success, icon: 'checkmark-circle' as const },
  warning: { bg: colors.warningLight, text: colors.warning, icon: 'alert-circle' as const },
  error: { bg: colors.errorLight, text: colors.error, icon: 'close-circle' as const },
  info: { bg: colors.primaryLight, text: colors.primary, icon: 'information-circle' as const },
};

export function StatusBadge({ label, variant = 'info' }: StatusBadgeProps) {
  const config = VARIANTS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={14} color={config.text} />
      <Text style={[styles.text, { color: config.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, fontWeight: '600' },
});
