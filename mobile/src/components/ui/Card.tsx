import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, borderRadius, spacing, shadows, typography } from '../../theme';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({
  title,
  subtitle,
  padding = 'md',
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View style={[styles.card, styles[`padding_${padding}`], style]} {...props}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  padding_sm: { padding: spacing.sm },
  padding_md: { padding: spacing.md },
  padding_lg: { padding: spacing.lg },
  header: { marginBottom: spacing.sm, gap: spacing.xs },
  title: { ...typography.h3, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
});
