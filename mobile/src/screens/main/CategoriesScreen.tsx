import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - SIZES.md * 3) / 2;

export interface CategoryItem {
  _id: string;
  name: string;
  description: string;
  image: string;
}

interface CategoriesScreenProps {
  navigation: any;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const { data: categories, isLoading, refetch, isRefetching } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data.data;
    },
  });

  const handleCategoryPress = (category: CategoryItem) => {
    navigation.navigate('ProductList', { categoryId: category._id, title: category.name });
  };

  const renderCategoryCard = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => handleCategoryPress(item)}
      style={styles.card}
    >
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.description}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSkeletonGrid = () => {
    const skeletonData = Array.from({ length: 6 });
    return (
      <View style={styles.gridContainer}>
        {skeletonData.map((_, index) => (
          <View key={index} style={styles.cardSkeleton}>
            <SkeletonLoader height={120} width="100%" borderRadius={SIZES.borderRadiusLarge} />
            <SkeletonLoader
              height={16}
              width="60%"
              style={{ marginTop: 8 }}
              borderRadius={4}
            />
            <SkeletonLoader
              height={12}
              width="80%"
              style={{ marginTop: 6 }}
              borderRadius={4}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        renderSkeletonGrid()
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No categories found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SIZES.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLarge,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    width: cardWidth,
    overflow: 'hidden',
    ...SHADOWS.small,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surface,
  },
  textContainer: {
    padding: SIZES.sm,
    backgroundColor: COLORS.white,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 15,
  },
  gridContainer: {
    padding: SIZES.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardSkeleton: {
    width: '48%',
    marginBottom: SIZES.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
