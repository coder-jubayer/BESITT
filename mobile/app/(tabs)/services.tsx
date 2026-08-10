import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../src/components/PageHeader';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

const SERVICES = [
  {
    title: 'Book Amenities',
    description: 'Pool, Hall, Parking, etc.',
    icon: 'calendar' as const,
    bg: '#EFF6FF',
    color: '#2563EB',
    href: '/amenities',
  },
  {
    title: 'Complaints & Fixes',
    description: 'Raise maintenance tickets',
    icon: 'construct' as const,
    bg: '#FFFBEB',
    color: '#D97706',
    href: '/complaints',
  },
  {
    title: 'Society Expenses',
    description: 'Monthly breakdown & reports',
    icon: 'business' as const,
    bg: colors.emeraldLight,
    color: colors.success,
    href: '/expenses',
  },
  {
    title: 'Emergency Directory',
    description: 'Important contacts & helplines',
    icon: 'call' as const,
    bg: colors.roseLight,
    color: colors.error,
    href: '/directory',
  },
  {
    title: 'Rental Records',
    description: 'Units, tenants & occupancy',
    icon: 'home' as const,
    bg: '#EEF2FF',
    color: colors.primary,
    href: '/rentals',
  },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <PageHeader title="Services" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SERVICES.map((s) => (
          <Pressable
            key={s.title}
            style={styles.card}
            onPress={() => router.push(s.href as never)}
          >
            <View style={[styles.icon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={24} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.desc}>{s.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.slate200} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '600', color: colors.text, fontSize: 15 },
  desc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
