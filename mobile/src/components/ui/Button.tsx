import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, typography, spacing } from '../../theme';
import { useAuthStore } from '../../stores/auth.store';
import { requestActivationPopup } from '../../utils/buildingLock';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /** When true, skip building-lock popup gate (e.g. Start trial). */
  bypassBuildingLock?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  onPress,
  bypassBuildingLock = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
      onPress={(event) => {
        if (!bypassBuildingLock) {
          const access = useAuthStore.getState().user?.buildingAccess;
          if (access && !access.canWrite) {
            requestActivationPopup();
            return;
          }
        }
        onPress?.(event);
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.text : colors.white}
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`] as TextStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: {
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },

  size_sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  size_md: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg, minHeight: 48 },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 56 },

  text: { ...typography.label },
  text_primary: { color: colors.white },
  text_secondary: { color: colors.white },
  text_outline: { color: colors.text },
  text_ghost: { color: colors.primary },
  text_danger: { color: colors.white },

  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 16 },
});
