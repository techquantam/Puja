import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { GuestPlaceholderScreen } from './GuestPlaceholderScreen';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

export interface OrderItemType {
  productId: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    discountPrice?: number;
  };
  quantity: number;
  price: number;
}

export interface OrderType {
  _id: string;
  items: OrderItemType[];
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'COD' | 'Online';
  paymentStatus: 'Pending' | 'Completed' | 'Failed';
  orderStatus: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  subtotal: number;
  discount: number;
  shippingCharges: number;
  totalAmount: number;
  createdAt: string;
}

export const OrdersScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuthStore();

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery<OrderType[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await apiClient.get('/orders');
      return response.data.data || [];
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <GuestPlaceholderScreen
        title="Track Your Orders"
        description="View your active and past puja samagri orders by logging into your account."
        iconName="receipt-outline"
      />
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getStatusColor = (status: OrderType['orderStatus']) => {
    switch (status) {
      case 'Placed':
      case 'Confirmed':
        return '#FF9800'; // Orange
      case 'Shipped':
        return '#2196F3'; // Blue
      case 'Delivered':
        return '#4CAF50'; // Green
      case 'Cancelled':
        return '#F44336'; // Red
      default:
        return COLORS.textLight;
    }
  };

  const renderOrderCard = ({ item }: { item: OrderType }) => {
    const firstItem = item.items?.[0];
    const imageUri = firstItem?.productId?.images?.[0] || 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=150';
    const totalItems = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderDate}>{formattedDate}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
              {item.orderStatus}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
          <View style={styles.orderInfo}>
            <Text numberOfLines={1} style={styles.productName}>
              {firstItem?.productId?.name || 'Puja Samagri Item'}
            </Text>
            {totalItems > 1 && (
              <Text style={styles.additionalItems}>+ {totalItems - 1} more item(s)</Text>
            )}
            <View style={styles.bottomRow}>
              <Text style={styles.amountText}>Total Paid: ₹{item.totalAmount}</Text>
              <View style={styles.detailsLink}>
                <Text style={styles.detailsLinkText}>Details</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
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
            <Ionicons name="receipt-outline" size={80} color={COLORS.border} style={{ marginBottom: SIZES.md }} />
            <Text style={styles.emptyTitle}>No Orders Placed yet</Text>
            <Text style={styles.emptySubtitle}>Your active and past orders will be displayed here.</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.shopNowBtn}
            >
              <Text style={styles.shopNowBtnText}>Browse Products</Text>
            </TouchableOpacity>
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
  listContent: {
    padding: SIZES.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.sm,
  },
  cardBody: {
    flexDirection: 'row',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  orderInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  additionalItems: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 2,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  shopNowBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  shopNowBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
