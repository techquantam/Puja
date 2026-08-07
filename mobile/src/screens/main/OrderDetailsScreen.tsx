import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/Button';
import { OrderType } from './OrdersScreen';

export const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params || {};
  const queryClient = useQueryClient();

  // Fetch single order details
  const { data: order, isLoading, error, refetch } = useQuery<OrderType>({
    queryKey: ['orderDetail', orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data.data;
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put(`/orders/${orderId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Success', 'Order cancelled successfully.');
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Cancellation Failed', err.message || 'Cannot cancel order.');
    },
  });

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This will release reserved stock back into the inventory.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => cancelOrderMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to retrieve order tracking information.</Text>
      </View>
    );
  }

  const steps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const currentStepIndex = steps.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';

  const formattedDate = new Date(order.createdAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Timeline Status block */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Order Tracking Status</Text>
          <Text style={styles.orderIdText}>Order ID: {order._id}</Text>
          <Text style={styles.orderDateText}>Placed on: {formattedDate}</Text>

          {isCancelled ? (
            <View style={styles.cancelledBox}>
              <Ionicons name="close-circle" size={24} color="#D32F2F" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.cancelledTitle}>This order has been Cancelled</Text>
                <Text style={styles.cancelledDesc}>Refunds (if applicable) will be processed in 3-5 days.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {steps.map((stepName, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={stepName} style={styles.timelineStep}>
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.timelineCircle,
                          isActive ? styles.activeTimelineCircle : styles.inactiveTimelineCircle,
                          isCurrent && { borderWidth: 2, borderColor: COLORS.primary },
                        ]}
                      >
                        {isActive ? (
                          <Ionicons name="checkmark" size={12} color={COLORS.white} />
                        ) : (
                          <View style={styles.bulletDot} />
                        )}
                      </View>
                      {index < steps.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            index < currentStepIndex ? styles.activeTimelineLine : styles.inactiveTimelineLine,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepInfoCol}>
                      <Text style={[styles.stepNameText, isActive ? styles.activeStepText : styles.inactiveStepText]}>
                        {stepName}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.stepSubtext}>Active Status</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Shipping Address snapshot */}
        <View style={styles.box}>
          <View style={styles.boxHeaderRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.boxHeaderTitle}>Shipping Details</Text>
          </View>
          <Text style={styles.recipientName}>{order.shippingAddress.name}</Text>
          <Text style={styles.recipientPhone}>Phone: +91 {order.shippingAddress.phone}</Text>
          <Text style={styles.recipientAddr}>
            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </Text>
        </View>

        {/* Ordered Items List */}
        <View style={styles.box}>
          <View style={styles.boxHeaderRow}>
            <Ionicons name="cube-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.boxHeaderTitle}>Items Ordered</Text>
          </View>
          {order.items.map((item, index) => {
            const product = item.productId;
            const imgUri = product?.images?.[0] || 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=150';

            return (
              <View key={index} style={styles.itemRow}>
                <Image source={{ uri: imgUri }} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNameText} numberOfLines={1}>{product?.name || 'Puja Samagri'}</Text>
                  <Text style={styles.itemQtyPriceText}>
                    Qty: {item.quantity}  |  Price: ₹{item.price}
                  </Text>
                </View>
                <Text style={styles.itemTotalAmount}>₹{item.price * item.quantity}</Text>
              </View>
            );
          })}
        </View>

        {/* Payment & Price Summary */}
        <View style={styles.box}>
          <Text style={styles.boxHeaderTitle}>Payment Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <Text
              style={[
                styles.infoValue,
                { color: order.paymentStatus === 'Completed' ? '#2E7D32' : '#FF9800', fontWeight: 'bold' },
              ]}
            >
              {order.paymentStatus}
            </Text>
          </View>

          <View style={styles.billingDivider} />

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Items Price</Text>
            <Text style={styles.billingValue}>₹{order.subtotal}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Discounts</Text>
              <Text style={[styles.billingValue, { color: '#2E7D32' }]}>-₹{order.discount}</Text>
            </View>
          )}
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Delivery Fee</Text>
            <Text style={styles.billingValue}>
              {order.shippingCharges === 0 ? <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>FREE</Text> : `₹${order.shippingCharges}`}
            </Text>
          </View>
          <View style={styles.billingDivider} />
          <View style={[styles.billingRow, { marginBottom: 0 }]}>
            <Text style={styles.netPayableLabel}>Total Amount Paid</Text>
            <Text style={styles.netPayableValue}>₹{order.totalAmount}</Text>
          </View>
        </View>

        {/* Cancellation button action */}
        {!isCancelled && ['Placed', 'Confirmed'].includes(order.orderStatus) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            disabled={cancelOrderMutation.isPending}
          >
            {cancelOrderMutation.isPending ? (
              <ActivityIndicator color="#D32F2F" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.md,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
  box: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  orderDateText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: SIZES.md,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 10,
    padding: SIZES.sm,
    marginTop: SIZES.xs,
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C62828',
  },
  cancelledDesc: {
    fontSize: 12,
    color: '#D32F2F',
  },
  timelineContainer: {
    marginTop: SIZES.xs,
    paddingLeft: SIZES.xs,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
    zIndex: 2,
  },
  activeTimelineCircle: {
    backgroundColor: '#2E7D32',
  },
  inactiveTimelineCircle: {
    backgroundColor: COLORS.border,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textLight,
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    top: 18,
    bottom: -10,
    zIndex: 1,
  },
  activeTimelineLine: {
    backgroundColor: '#2E7D32',
  },
  inactiveTimelineLine: {
    backgroundColor: COLORS.border,
  },
  stepInfoCol: {
    marginLeft: SIZES.sm,
    paddingTop: 1,
  },
  stepNameText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: COLORS.text,
  },
  inactiveStepText: {
    color: COLORS.textLight,
  },
  stepSubtext: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  boxHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  recipientPhone: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  recipientAddr: {
    fontSize: 13,
    color: '#4A3E3D',
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  itemQtyPriceText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  itemTotalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.text,
  },
  billingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  billingValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  netPayableLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  netPayableValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cancelButton: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
