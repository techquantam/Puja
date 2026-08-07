import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { COLORS, SIZES } from '../../constants/theme';
import { Button } from '../../components/Button';
import { ProductCard } from '../../components/ProductCard';
import { SkeletonLoader } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface SpecItem {
  name: string;
  value: string;
  _id?: string;
}

interface ReviewItem {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  _id?: string;
}

export const ProductDetailsScreen = ({ route, navigation }: any) => {
  const { productId } = route.params || {};
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Review states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');

  // Fetch product detail
  const fetchProductDetail = async () => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data.data;
  };

  const { data: detailData, isLoading, error, refetch } = useQuery({
    queryKey: ['productDetail', productId],
    queryFn: fetchProductDetail,
  });

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveImageIndex(slide);
  };

  const handleAction = async (type: 'cart' | 'buy') => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        `Please sign in to ${type === 'cart' ? 'add this item to your cart' : 'buy this item now'}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }

    try {
      if (type === 'cart') {
        await addToCart(productId, 1);
        Alert.alert('Success', 'Item added to your cart successfully!');
      } else {
        await addToCart(productId, 1);
        navigation.navigate('Cart');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add item.');
    }
  };

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      const response = await apiClient.post(`/products/${productId}/review`, reviewData);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Thank you for your valuable feedback!');
      setUserComment('');
      setUserRating(5);
      refetch(); // Refetch details to render the new review
    },
    onError: (err: any) => {
      Alert.alert('Review Failed', err.message || 'You might have already reviewed this product.');
    },
  });

  const handleReviewSubmit = () => {
    if (!userComment.trim()) {
      Alert.alert('Validation Error', 'Please write a review comment.');
      return;
    }
    submitReviewMutation.mutate({ rating: userRating, comment: userComment });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonLoader width={width} height={300} />
        <View style={{ padding: SIZES.md }}>
          <SkeletonLoader width={width * 0.7} height={24} style={{ marginBottom: 12 }} />
          <SkeletonLoader width={120} height={20} style={{ marginBottom: 16 }} />
          <SkeletonLoader width={width - 32} height={80} style={{ marginBottom: 24 }} />
          <SkeletonLoader width={width - 32} height={100} />
        </View>
      </View>
    );
  }

  if (error || !detailData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to retrieve product details.</Text>
      </View>
    );
  }

  const { product, relatedProducts = [] } = detailData;
  const images = product.images && product.images.length > 0 ? product.images : [product.image];
  const reviewsList: ReviewItem[] = product.reviews || [];

  // Calculate discount percentage
  const price = product.price;
  const discountPrice = product.discountPrice;
  const hasDiscount = discountPrice && discountPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Images Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="cover"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=600';
                }}
              />
            )}
          />
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeImageIndex === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          )}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Ratings & Reviews */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(product.rating || 5) ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFB300"
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{product.rating?.toFixed(1) || '5.0'}</Text>
            <Text style={styles.reviewsCount}>({product.reviewsCount || 0} reviews)</Text>
          </View>

          {/* Pricing Block */}
          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <View style={styles.priceRow}>
                <Text style={styles.discountPrice}>₹{discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{price}</Text>
              </View>
            ) : (
              <Text style={styles.price}>₹{price}</Text>
            )}
            <Text style={[styles.stockText, product.stock > 0 ? styles.inStock : styles.outOfStock]}>
              {product.stock > 0 ? `In Stock (${product.stock} items left)` : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Specifications Grid */}
          {product.specifications && product.specifications.length > 0 && (
            <View style={styles.specsSection}>
              <Text style={styles.sectionTitle}>Product Specifications</Text>
              <View style={styles.specsTable}>
                {product.specifications.map((spec: SpecItem, index: number) => (
                  <View
                    key={spec._id || index}
                    style={[
                      styles.specRow,
                      index % 2 === 0 ? styles.specRowEven : styles.specRowOdd,
                    ]}
                  >
                    <Text style={styles.specName}>{spec.name}</Text>
                    <Text style={styles.specValue}>{spec.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Reviews List Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Customer Reviews ({reviewsList.length})</Text>
            {reviewsList.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review this product!</Text>
            ) : (
              reviewsList.map((rev) => (
                <View key={rev._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{rev.userName}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= rev.rating ? 'star' : 'star-outline'}
                        size={12}
                        color="#FFB300"
                        style={{ marginRight: 1 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))
            )}
          </View>

          {/* Write a Review Section */}
          <View style={styles.writeReviewSection}>
            <Text style={styles.sectionTitle}>Write a Review</Text>
            {isAuthenticated ? (
              <View style={styles.writeReviewContainer}>
                {/* Stars selector */}
                <View style={styles.starsSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                      <Ionicons
                        name={star <= userRating ? 'star' : 'star-outline'}
                        size={28}
                        color="#FFB300"
                        style={{ marginRight: 6 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Comment box */}
                <TextInput
                  placeholder="Tell us what you liked or disliked about this puja samagri..."
                  value={userComment}
                  onChangeText={setUserComment}
                  multiline
                  numberOfLines={4}
                  style={styles.reviewInput}
                  placeholderTextColor={COLORS.textLight}
                />

                <Button
                  title="Submit Review"
                  onPress={handleReviewSubmit}
                  loading={submitReviewMutation.isPending}
                  style={styles.submitReviewBtn}
                />
              </View>
            ) : (
              <View style={styles.guestReviewBox}>
                <Text style={styles.guestReviewText}>Please sign in to write a product review.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
                  <Text style={styles.guestReviewLink}>Sign In Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Related Products horizontal list */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>Related Puja Items</Text>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.relatedCard}>
                    <ProductCard
                      product={item}
                      onPress={(id) => navigation.push('ProductDetails', { productId: id })}
                    />
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => handleAction('cart')}
          disabled={product.stock <= 0}
        >
          <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyButton, product.stock <= 0 && styles.disabledBtn]}
          onPress={() => handleAction('buy')}
          disabled={product.stock <= 0}
        >
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: width,
    height: 300,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
  },
  pagination: {
    position: 'absolute',
    bottom: SIZES.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 12,
  },
  inactiveDot: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  discountBadge: {
    position: 'absolute',
    top: SIZES.md,
    left: SIZES.md,
    backgroundColor: '#D32F2F',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 28,
    marginBottom: SIZES.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  stars: {
    flexDirection: 'row',
    marginRight: SIZES.xs,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SIZES.sm,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inStock: {
    color: '#2E7D32',
  },
  outOfStock: {
    color: '#C62828',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  description: {
    fontSize: 14,
    color: '#4A3E3D',
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  specsSection: {
    marginBottom: SIZES.lg,
  },
  specsTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: SIZES.sm,
  },
  specRowEven: {
    backgroundColor: '#FFFDFB',
  },
  specRowOdd: {
    backgroundColor: COLORS.white,
  },
  specName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  specValue: {
    flex: 2,
    fontSize: 13,
    color: COLORS.text,
  },
  reviewsSection: {
    marginBottom: SIZES.lg,
  },
  noReviewsText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 13,
    color: '#4A3E3D',
    lineHeight: 18,
  },
  writeReviewSection: {
    backgroundColor: '#FFFBF7',
    borderWidth: 1,
    borderColor: '#FF7F0040',
    borderRadius: 16,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  writeReviewContainer: {
    marginTop: SIZES.xs,
  },
  starsSelector: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  reviewInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SIZES.sm,
    color: COLORS.text,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: SIZES.md,
  },
  submitReviewBtn: {
    height: 40,
  },
  guestReviewBox: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  guestReviewText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  guestReviewLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  relatedSection: {
    marginTop: SIZES.sm,
  },
  relatedCard: {
    width: 150,
    marginRight: SIZES.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginRight: SIZES.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  buyButton: {
    flex: 1.2,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
});
