import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../src/components/PageHeader';
import { mockAmenities, Amenity } from '../src/data/mockData';
import { colors, spacing, borderRadius, shadows } from '../src/theme';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Swimming Pool': 'water',
  'Guest Parking': 'car',
  'Community Hall': 'balloon',
  'Table Tennis': 'tennisball',
  'Billiard Room': 'ellipse',
};

const ICON_COLORS: Record<string, string> = {
  'Swimming Pool': '#3B82F6',
  'Guest Parking': '#64748B',
  'Community Hall': '#D946EF',
  'Table Tennis': '#10B981',
  'Billiard Room': '#6366F1',
};

export default function AmenitiesScreen() {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>(mockAmenities);

  const book = (id: string, name: string) => {
    setAmenities((prev) =>
      prev.map((a) =>
        a.id === id && a.availableSlots > 0
          ? { ...a, availableSlots: a.availableSlots - 1 }
          : a,
      ),
    );
    Alert.alert('Booked', `${name} slot reserved (demo).`);
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Book Amenity" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {amenities.map((a) => {
          const available = a.availableSlots > 0;
          return (
            <View key={a.id} style={styles.card}>
              <View style={styles.left}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={ICONS[a.name] ?? 'ellipse'}
                    size={24}
                    color={ICON_COLORS[a.name] ?? colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.name}>{a.name}</Text>
                  <Text style={{ color: available ? colors.success : colors.error, fontWeight: '500', fontSize: 13 }}>
                    {available ? `${a.availableSlots} slots available` : 'Fully booked'}
                  </Text>
                </View>
              </View>
              <Pressable
                disabled={!available}
                onPress={() => book(a.id, a.name)}
                style={[styles.bookBtn, !available && styles.bookDisabled]}
              >
                <Text style={[styles.bookText, !available && { color: colors.textMuted }]}>
                  Book
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
  list: { padding: spacing.md, gap: 12, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontWeight: '600', color: colors.text, marginBottom: 2 },
  bookBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookDisabled: { backgroundColor: colors.slate100 },
  bookText: { fontWeight: '600', fontSize: 13, color: colors.primary },
});
