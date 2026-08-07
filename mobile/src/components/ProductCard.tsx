import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export interface ProductItem {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  isBestSeller?: boolean;
}

interface ProductCardProps {
  product: ProductItem;
  onPress: (id: string) => void;
  onAddPress?: (product: ProductItem) => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // fits 2 items per row with screen padding

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddPress }) => {
  const calculateDiscount = () => {
    if (!product.discountPrice) return 0;
    const diff = product.price - product.discountPrice;
    return Math.round((diff / product.price) * 100);
  };

  const discountPercent = calculateDiscount();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(product._id)}
      style={styles.cardContainer}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
        {product.isBestSeller && (
          <View style={[styles.badge, styles.bestSellerBadge]}>
            <Text style={styles.badgeText}>Best Seller</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text numberOfLines={1} style={styles.productName}>
          {product.name}
        </Text>
        
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingText}>
            {product.rating.toFixed(1)} ({product.reviewsCount})
          </Text>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceColumn}>
            {product.discountPrice ? (
              <>
                <Text style={styles.discountPriceText}>₹{product.discountPrice}</Text>
                <Text style={styles.originalPriceText}>₹{product.price}</Text>
              </>
            ) : (
              <Text style={styles.priceText}>₹{product.price}</Text>
            )}
          </View>
          {onAddPress && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onAddPress(product)}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: cardWidth,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: SIZES.xs,
    left: SIZES.xs,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    bottom: SIZES.xs,
    left: SIZES.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestSellerBadge: {
    backgroundColor: COLORS.secondary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: SIZES.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingStar: {
    color: '#FFB300', // Star gold
    fontSize: 14,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  priceColumn: {
    flexDirection: 'column',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  discountPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPriceText: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
