import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../src/components/PageHeader';
import { fetchNotices } from '../../src/services/notices.service';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

export default function CommunityScreen() {
  const router = useRouter();
  const [newCount, setNewCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void fetchNotices()
        .then((data) => setNewCount(data.notices.filter((n) => n.isNew).length))
        .catch(() => setNewCount(0));
    }, []),
  );

  return (
    <View style={styles.root}>
      <PageHeader title="Community" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.hero}
          onPress={() => router.push('/notices')}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="notifications" size={24} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Notice Board</Text>
          <Text style={styles.heroSub}>
            {newCount > 0 ? `${newCount} new announcement${newCount === 1 ? '' : 's'}` : 'View all announcements'}
          </Text>
          <View style={styles.blob} />
        </Pressable>

        <View style={styles.grid}>
          <Pressable style={styles.card} onPress={() => router.push('/marketplace')}>
            <View style={[styles.cardIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="storefront" size={20} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Marketplace</Text>
            <Text style={styles.cardDesc}>Buy & Sell items</Text>
          </Pressable>
          <Pressable style={styles.card} onPress={() => router.push('/voting')}>
            <View style={[styles.cardIcon, { backgroundColor: colors.emeraldLight }]}>
              <Ionicons name="checkbox" size={20} color={colors.success} />
            </View>
            <Text style={styles.cardTitle}>Elections</Text>
            <Text style={styles.cardDesc}>Active voting</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.white },
  heroSub: { fontSize: 14, color: '#C7D2FE', marginTop: 4 },
  blob: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  grid: { flexDirection: 'row', gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...shadows.sm,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  cardDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
