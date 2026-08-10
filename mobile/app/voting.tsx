import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PageHeader } from '../src/components/PageHeader';
import { mockCandidates } from '../src/data/mockData';
import { colors, spacing, borderRadius, shadows } from '../src/theme';

export default function VotingScreen() {
  const router = useRouter();
  const [votedId, setVotedId] = useState<string | null>(null);
  const presidents = mockCandidates.filter((c) => c.position === 'President');

  const vote = (id: string, name: string) => {
    if (votedId && votedId !== id) return;
    setVotedId(id);
    Alert.alert('Vote recorded', `You voted for ${name}`);
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Elections" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Committee Election 2026</Text>
          <Text style={styles.bannerText}>
            Select one candidate for President. Voting closes in 2 days.
          </Text>
        </View>

        {presidents.map((c) => {
          const selected = votedId === c.id;
          const locked = votedId !== null && !selected;
          return (
            <View
              key={c.id}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Image source={{ uri: c.image }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.apt}>Apt {c.id}04</Text>
              </View>
              <Pressable
                disabled={locked}
                onPress={() => vote(c.id, c.name)}
                style={[
                  styles.voteBtn,
                  selected && styles.voteBtnSelected,
                  locked && styles.voteBtnLocked,
                ]}
              >
                <Text
                  style={[
                    styles.voteText,
                    selected && { color: colors.white },
                    locked && { color: colors.textMuted },
                  ]}
                >
                  {selected ? 'Voted' : 'Vote'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  banner: {
    backgroundColor: colors.emeraldLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
  },
  bannerTitle: { fontWeight: '700', color: '#065F46', marginBottom: 4 },
  bannerText: { fontSize: 13, color: '#059669' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  name: { fontWeight: '700', color: colors.text },
  apt: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  voteBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  voteBtnSelected: { backgroundColor: colors.primary },
  voteBtnLocked: { backgroundColor: colors.slate100, opacity: 0.5 },
  voteText: { fontWeight: '600', fontSize: 13, color: colors.primaryDark },
});
