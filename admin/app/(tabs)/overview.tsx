import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../src/components/PageHeader';
import { Card } from '../../src/components/ui';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { fetchOverview } from '../../src/services/buildings.service';
import { colors, spacing, borderRadius, typography } from '../../src/theme';
import type { OverviewStats } from '../../src/types';

export default function OverviewScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null);
    try {
      setStats(await fetchOverview());
      setError(null);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load overview');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useAutoRefresh(() => load({ silent: true }), 8000);

  return (
    <View style={styles.root}>
      <PageHeader title="Overview" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {stats ? (
          <>
            <View style={styles.row}>
              <Card style={styles.statCard} padding="md">
                <Text style={styles.statLabel}>Buildings</Text>
                <Text style={styles.statValue}>{stats.buildings.total}</Text>
                <Text style={styles.statMeta}>
                  {stats.buildings.active} active · {stats.buildings.inactive} inactive
                </Text>
              </Card>
              <Card style={styles.statCard} padding="md">
                <Text style={styles.statLabel}>Users</Text>
                <Text style={styles.statValue}>{stats.users.total}</Text>
                <Text style={styles.statMeta}>
                  {stats.users.active} active · {stats.users.inactive} inactive
                </Text>
              </Card>
            </View>

            <Card title="Users by role" padding="md">
              <View style={styles.roleList}>
                {stats.byRole.map((item) => (
                  <View key={item.role} style={styles.roleRow}>
                    <Text style={styles.roleLabel}>{item.label}</Text>
                    <Text style={styles.roleCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1 },
  statLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 6 },
  statMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  roleList: { gap: 10 },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  roleLabel: { fontWeight: '600', color: colors.text },
  roleCount: { fontWeight: '700', color: colors.primary },
  error: { color: colors.error, textAlign: 'center' },
});
