import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ProductCard } from '../../components/ProductCard';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { COLORS, SIZES } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const ProductListScreen = ({ route, navigation }: any) => {
  const { categoryId, searchQuery } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategoryProducts = async () => {
    const response = await apiClient.get('/products', {
      params: { 
        category: categoryId,
        search: searchQuery,
      },
    });
    return response.data.data || [];
  };

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products', categoryId, searchQuery],
    queryFn: fetchCategoryProducts,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <FlatList
          data={[1, 2, 4, 5, 6, 7]}
          renderItem={() => (
            <View style={styles.loaderCard}>
              <SkeletonLoader width={(width - SIZES.md * 3) / 2} height={200} borderRadius={12} />
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load products. Please check connection.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <ProductCard
              product={item}
              onPress={(id) => navigation.navigate('ProductDetails', { productId: id })}
            />
          </View>
        )}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available in this category.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderCard: {
    flex: 1,
    margin: SIZES.sm,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  row: {
    justifyContent: 'flex-start',
    paddingHorizontal: SIZES.sm,
  },
  listContent: {
    paddingVertical: SIZES.md,
  },
  cardContainer: {
    width: (width - SIZES.sm * 4) / 2,
    margin: SIZES.xs,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
