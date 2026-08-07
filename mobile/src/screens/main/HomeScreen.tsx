import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ProductCard, ProductItem } from '../../components/ProductCard';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface BannerItem {
  _id: string;
  title: string;
  image: string;
  link?: string;
}

interface CategoryItem {
  _id: string;
  name: string;
  image: string;
}

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  // 1. Fetch Banners
  const { data: banners, isLoading: bannersLoading } = useQuery<BannerItem[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await apiClient.get('/banners');
      return res.data.data;
    },
  });

  // 2. Fetch Categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data;
    },
  });

  // 3. Fetch Best Sellers
  const { data: bestSellers, isLoading: bestSellersLoading, refetch: refetchBestSellers } = useQuery<ProductItem[]>({
    queryKey: ['products-bestsellers'],
    queryFn: async () => {
      const res = await apiClient.get('/products?isBestSeller=true&limit=6');
      return res.data.data;
    },
  });

  // 4. Fetch New Arrivals
  const { data: newArrivals, isLoading: newArrivalsLoading, refetch: refetchNewArrivals } = useQuery<ProductItem[]>({
    queryKey: ['products-newarrivals'],
    queryFn: async () => {
      const res = await apiClient.get('/products?isNewArrival=true&limit=6');
      return res.data.data;
    },
  });

  // 5. Fetch Flash Sales
  const { data: flashSales, isLoading: flashSalesLoading, refetch: refetchFlashSales } = useQuery<ProductItem[]>({
    queryKey: ['products-flashsales'],
    queryFn: async () => {
      const res = await apiClient.get('/products?isFlashSale=true&limit=6');
      return res.data.data;
    },
  });

  const onRefresh = async () => {
    await Promise.all([
      refetchBestSellers(),
      refetchNewArrivals(),
      refetchFlashSales(),
    ]);
  };

  const handleProductPress = (id: string) => {
    navigation.navigate('ProductDetails', { productId: id });
  };

  const handleCategoryPress = (category: CategoryItem) => {
    navigation.navigate('ProductList', { categoryId: category._id, title: category.name });
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    navigation.navigate('ProductList', { searchQuery: searchQuery, title: `Search: "${searchQuery}"` });
  };

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  const renderBannerItem = ({ item }: { item: BannerItem }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.bannerSlide}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleCategoryPress(item)}
      style={styles.categoryItem}
    >
      <View style={styles.categoryIconBorder}>
        <Image source={{ uri: item.image }} style={styles.categoryIcon} />
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductShelf = (
    title: string,
    products: ProductItem[] | undefined,
    loading: boolean
  ) => {
    if (loading) {
      return (
        <View style={styles.shelfContainer}>
          <Text style={styles.shelfTitle}>{title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfContent}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={{ marginRight: SIZES.md, width: 140 }}>
                <SkeletonLoader height={100} width={140} />
                <SkeletonLoader height={12} width={100} style={{ marginTop: 8 }} />
                <SkeletonLoader height={10} width={60} style={{ marginTop: 4 }} />
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (!products || products.length === 0) return null;

    return (
      <View style={styles.shelfContainer}>
        <View style={styles.shelfHeader}>
          <Text style={styles.shelfTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={products}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.shelfProductCard}>
              <ProductCard
                product={item}
                onPress={handleProductPress}
                onAddPress={() => console.log('Added to cart:', item.name)}
              />
            </View>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.shelfContent}
        />
      </View>
    );
  };

  const isAnyLoading = bestSellersLoading && newArrivalsLoading;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search Puja Samagri, Kits, Idols..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isAnyLoading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Banner Slider */}
        {bannersLoading ? (
          <SkeletonLoader height={180} width="100%" borderRadius={0} />
        ) : (
          banners &&
          banners.length > 0 && (
            <View style={styles.sliderContainer}>
              <FlatList
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                renderItem={renderBannerItem}
                keyExtractor={(item) => item._id}
                snapToAlignment="center"
              />
              <View style={styles.paginationDots}>
                {banners.map((_: BannerItem, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      activeSlide === i ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          )
        )}

        {/* Horizontal Circle Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          {categoriesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View key={n} style={{ marginRight: 20, alignItems: 'center' }}>
                  <SkeletonLoader height={70} width={70} borderRadius={35} />
                  <SkeletonLoader height={10} width={50} style={{ marginTop: 6 }} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.categoriesList}
            />
          )}
        </View>

        {/* Product Shelves */}
        {renderProductShelf('Flash Sale 🔥', flashSales, flashSalesLoading)}
        {renderProductShelf('Best Sellers 🏆', bestSellers, bestSellersLoading)}
        {renderProductShelf('New Arrivals ✨', newArrivals, newArrivalsLoading)}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchHeader: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    height: 44,
    paddingHorizontal: SIZES.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SIZES.xs,
    color: COLORS.textLight,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  clearIcon: {
    fontSize: 14,
    color: COLORS.textLight,
    paddingHorizontal: SIZES.xs,
  },
  sliderContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  bannerSlide: {
    width: width,
    height: 180,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(44, 27, 16, 0.4)', // warm subtle overlay
    padding: SIZES.sm,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: COLORS.lightOrange,
  },
  categoriesContainer: {
    marginVertical: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  categoriesList: {
    paddingHorizontal: SIZES.md,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 76,
  },
  categoryIconBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.lightOrange,
    padding: 3,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  categoryIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  shelfContainer: {
    marginBottom: SIZES.lg,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  shelfContent: {
    paddingLeft: SIZES.md,
  },
  shelfProductCard: {
    marginRight: SIZES.md,
  },
});
