import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { colors, shadows } from '../theme';

export function FloatingChatButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname?.includes('messages')) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      onPress={() => router.push('/messages')}
    >
      <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    ...shadows.fab,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
