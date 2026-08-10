import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../src/components/PageHeader';
import { mockMarketplace } from '../src/data/mockData';
import { formatMoney } from '../src/utils/money';
import { colors, spacing, borderRadius, shadows } from '../src/theme';

export default function MarketplaceScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <PageHeader title="Marketplace" onBack={() => router.back()} />
      <View style={styles.createBar}>
        <Pressable
          style={styles.createBtn}
          onPress={() => Alert.alert('Create Listing', 'Listing form will be added next.')}
        >
          <Text style={styles.createText}>+ Create Listing</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {mockMarketplace.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
              <View style={styles.priceTag}>
                <Text style={styles.price}>{formatMoney(item.price)}</Text>
              </View>
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.seller}>{item.sellerName}</Text>
              <Pressable
                style={styles.contact}
                onPress={() => Alert.alert('Contact seller', `${item.sellerName}\n${item.title}`)}
              >
                <Ionicons name="chatbubble-outline" size={14} color={colors.primaryDark} />
                <Text style={styles.contactText}>Contact</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  createBar: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createBtn: {
    backgroundColor: colors.slate800,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  createText: { color: colors.white, fontWeight: '600' },
  grid: {
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: 40,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageWrap: { height: 128, backgroundColor: colors.slate200, position: 'relative' },
  image: { width: '100%', height: '100%' },
  priceTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: { fontWeight: '700', fontSize: 13, color: colors.text },
  body: { padding: 12, gap: 4 },
  title: { fontWeight: '600', fontSize: 13, color: colors.text },
  seller: { fontSize: 11, color: colors.textMuted },
  contact: {
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  contactText: { fontSize: 11, fontWeight: '600', color: colors.primaryDark },
});
