import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { apiClient } from '../../api/client';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/Button';

interface AddressItem {
  _id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

type CheckoutStep = 'address_select' | 'summary' | 'payment_select' | 'razorpay_simulator' | 'success';

export const CheckoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const { cart, clearCart } = useCartStore();
  const [step, setStep] = useState<CheckoutStep>('address_select');
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');

  // Fetch addresses
  const { data: addresses = [], isLoading: isAddressesLoading, refetch: refetchAddresses } = useQuery<AddressItem[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await apiClient.get('/addresses');
      return response.data.data || [];
    },
  });

  // Set default address initially if available
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses]);

  // Refetch addresses whenever user focuses checkout (in case they went to Add Address page)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetchAddresses();
    });
    return unsubscribe;
  }, [navigation]);

  // Order Placement Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (payload: { addressId: string; paymentMethod: string }) => {
      const response = await apiClient.post('/orders', payload);
      return response.data.data;
    },
    onSuccess: async (resData) => {
      const orderData = resData.order || resData;
      const keyId = resData.razorpayKeyId || '';

      setCreatedOrder(orderData);
      setRazorpayKeyId(keyId);

      if (paymentMethod === 'COD') {
        // COD order is placed immediately
        await clearCart();
        setStep('success');
      } else {
        // Online order transitions to Razorpay Simulator
        setStep('razorpay_simulator');
      }
    },
    onError: (err: any) => {
      Alert.alert('Checkout Error', err.message || 'Failed to place order.');
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: { orderId: string; razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }) => {
      const response = await apiClient.post('/orders/verify', payload);
      return response.data.data;
    },
    onSuccess: async (orderData) => {
      setCreatedOrder(orderData);
      await clearCart();
      setStep('success');
    },
    onError: (err: any) => {
      Alert.alert('Payment Error', err.message || 'Payment verification failed.');
    },
  });

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address.');
      return;
    }
    createOrderMutation.mutate({
      addressId: selectedAddress._id,
      paymentMethod,
    });
  };

  const user = useAuthStore((state) => state.user);

  const getRazorpayHtml = () => {
    if (!createdOrder) return '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            background-color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #FF9900;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .container {
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <p>Redirecting to Razorpay Secure Checkout...</p>
        </div>
        <script>
          const options = {
            "key": "${razorpayKeyId}",
            "amount": "${Math.round(createdOrder.totalAmount * 100)}",
            "currency": "INR",
            "name": "PujaMart",
            "description": "Order #${createdOrder._id.substring(createdOrder._id.length - 6).toUpperCase()}",
            "order_id": "${createdOrder.razorpayOrderId}",
            "prefill": {
              "name": "${user?.name || ''}",
              "email": "${user?.email || ''}",
              "contact": "${user?.phone || ''}"
            },
            "theme": {
              "color": "#FF9900"
            },
            "handler": function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'success',
                data: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                }
              }));
            },
            "modal": {
              "ondismiss": function () {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'cancelled'
                }));
              }
            }
          };
          
          const rzp = new Razorpay(options);
          
          rzp.on('payment.failed', function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'failed',
              error: response.error
            }));
          });
          
          // Open Razorpay when script loads
          setTimeout(() => {
            rzp.open();
          }, 500);
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const response = JSON.parse(event.nativeEvent.data);
      if (response.status === 'success') {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response.data;
        verifyPaymentMutation.mutate({
          orderId: createdOrder._id,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
        });
      } else if (response.status === 'cancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
        setStep('summary');
      } else {
        Alert.alert('Payment Failed', response.error?.description || 'Something went wrong.');
        setStep('summary');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to parse payment response.');
      setStep('summary');
    }
  };

  if (!cart || cart.items.length === 0) {
    if (step === 'success') {
      // Allow rendering success screen even if cart is empty after order placement!
    } else {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No items available for checkout.</Text>
          <Button title="Return to Shop" onPress={() => navigation.navigate('Home')} style={{ marginTop: 12 }} />
        </View>
      );
    }
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0);
  const discount = items.reduce(
    (sum, item) => sum + ((item.productId?.price || 0) - (item.productId?.discountPrice || item.productId?.price || 0)) * item.quantity,
    0
  );
  const shippingCharges = subtotal - discount > 500 ? 0 : 49;
  const totalPayable = subtotal - discount + shippingCharges;

  return (
    <View style={styles.container}>
      {/* Step Indicators */}
      {step !== 'success' && step !== 'razorpay_simulator' && (
        <View style={styles.stepsHeader}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step === 'address_select' ? styles.activeCircle : styles.completedCircle]}>
              <Text style={styles.stepCircleText}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Address</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step === 'summary' ? styles.activeCircle : step === 'payment_select' ? styles.completedCircle : styles.inactiveCircle]}>
              <Text style={styles.stepCircleText}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Summary</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={styles.stepIndicator}>
            <View style={[styles.stepCircle, step === 'payment_select' ? styles.activeCircle : styles.inactiveCircle]}>
              <Text style={styles.stepCircleText}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Payment</Text>
          </View>
        </View>
      )}

      {/* Step Contents */}
      {step === 'address_select' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Select Delivery Address</Text>
          {isAddressesLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={addresses}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: SIZES.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setSelectedAddress(item)}
                  style={[styles.addressCard, selectedAddress?._id === item._id && styles.selectedAddressCard]}
                >
                  <View style={styles.radioRow}>
                    <Ionicons
                      name={selectedAddress?._id === item._id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selectedAddress?._id === item._id ? COLORS.primary : COLORS.textLight}
                    />
                    <Text style={styles.addressName}>{item.name}</Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressPhone}>Phone: +91 {item.phone}</Text>
                  <Text style={styles.addressText}>{item.street}, {item.city}, {item.state} - {item.pincode}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyAddresses}>
                  <Ionicons name="location-outline" size={60} color={COLORS.border} />
                  <Text style={styles.emptyAddressesText}>No delivery address saved yet.</Text>
                </View>
              }
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addAddressLink}
              onPress={() => navigation.navigate('Address')}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.addAddressLinkText}>Add New Delivery Address</Text>
            </TouchableOpacity>
            <Button
              title="Deliver to this Address"
              disabled={!selectedAddress}
              onPress={() => setStep('summary')}
              style={{ marginTop: SIZES.md }}
            />
          </View>
        </View>
      )}

      {step === 'summary' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {/* Delivery Address Snapshot */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryBoxHeader}>
              <Ionicons name="location" size={18} color={COLORS.primary} />
              <Text style={styles.summaryBoxTitle}>Shipping Address</Text>
              <TouchableOpacity onPress={() => setStep('address_select')} style={styles.editLink}>
                <Text style={styles.editLinkText}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.summaryAddrName}>{selectedAddress?.name} (+91 {selectedAddress?.phone})</Text>
            <Text style={styles.summaryAddrText}>
              {selectedAddress?.street}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pincode}
            </Text>
          </View>

          {/* Items Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Puja Items ({items.length})</Text>
            {items.map((item) => {
              if (!item.productId) return null;
              return (
                <View key={item._id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.productId.name} <Text style={{ color: COLORS.textLight }}>x {item.quantity}</Text>
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₹{(item.productId.discountPrice || item.productId.price) * item.quantity}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Checkout pricing summary */}
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Billing Details</Text>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Items Subtotal</Text>
              <Text style={styles.pricingValue}>₹{subtotal}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Discount Deductions</Text>
                <Text style={[styles.pricingValue, { color: '#2E7D32' }]}>-₹{discount}</Text>
              </View>
            )}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Delivery Charges</Text>
              <Text style={styles.pricingValue}>
                {shippingCharges === 0 ? <Text style={{ color: '#2E7D32' }}>FREE</Text> : `₹${shippingCharges}`}
              </Text>
            </View>
            <View style={styles.pricingDivider} />
            <View style={[styles.pricingRow, { marginBottom: 0 }]}>
              <Text style={styles.pricingTotalLabel}>Amount Payable</Text>
              <Text style={styles.pricingTotalValue}>₹{totalPayable}</Text>
            </View>
          </View>

          <Button
            title="Proceed to Payment"
            onPress={() => setStep('payment_select')}
            style={{ marginTop: SIZES.md, marginHorizontal: SIZES.md }}
          />
        </ScrollView>
      )}

      {step === 'payment_select' && (
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <View style={styles.paymentContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('COD')}
              style={[styles.paymentCard, paymentMethod === 'COD' && styles.selectedPaymentCard]}
            >
              <Ionicons
                name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentMethod === 'COD' ? COLORS.primary : COLORS.textLight}
                style={{ marginRight: SIZES.sm }}
              />
              <View>
                <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentDesc}>Pay in cash upon delivery of puja samagri.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('Online')}
              style={[styles.paymentCard, paymentMethod === 'Online' && styles.selectedPaymentCard]}
            >
              <Ionicons
                name={paymentMethod === 'Online' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={paymentMethod === 'Online' ? COLORS.primary : COLORS.textLight}
                style={{ marginRight: SIZES.sm }}
              />
              <View>
                <Text style={styles.paymentName}>Online Payment (Razorpay)</Text>
                <Text style={styles.paymentDesc}>Pay securely via Cards, UPI, Netbanking.</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.payableLabel}>Amount Payable</Text>
              <Text style={styles.payableValue}>₹{totalPayable}</Text>
            </View>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={handlePlaceOrder}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.payBtnText}>
                  {paymentMethod === 'COD' ? 'Place Order' : 'Pay Online'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 'razorpay_simulator' && (
        <View style={styles.webviewContainer}>
          <WebView
            source={{ html: getRazorpayHtml() }}
            onMessage={handleWebViewMessage}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
          />
        </View>
      )}

      {step === 'success' && (
        <View style={styles.successContainer}>
          <View style={styles.successBanner}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={54} color="#2E7D32" />
            </View>
            <Text style={styles.successTitle}>Order Placed successfully!</Text>
            <Text style={styles.successSubtitle}>May the blessings of deities light up your path.</Text>
          </View>

          <View style={styles.orderSummaryCard}>
            <Text style={styles.orderSummaryTitle}>Order Details</Text>
            <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>Order ID</Text>
              <Text style={styles.orderSummaryValue} numberOfLines={1}>{createdOrder?._id || 'PM1234567'}</Text>
            </View>
            <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>Paid via</Text>
              <Text style={styles.orderSummaryValue}>
                {createdOrder?.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online payment'}
              </Text>
            </View>
            <View style={styles.orderSummaryRow}>
              <Text style={styles.orderSummaryLabel}>Total Amount</Text>
              <Text style={[styles.orderSummaryValue, { color: COLORS.primary }]}>₹{createdOrder?.totalAmount}</Text>
            </View>
          </View>

          <View style={styles.successButtons}>
            <Button
              title="Continue Shopping"
              onPress={() => navigation.replace('AppTabs', { screen: 'Home' })}
              style={styles.successBtn}
            />
            <Button
              title="My Orders"
              variant="outline"
              onPress={() => navigation.replace('AppTabs', { screen: 'Orders' })}
              style={[styles.successBtn, { marginTop: 12 }]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeCircle: {
    backgroundColor: COLORS.primary,
  },
  completedCircle: {
    backgroundColor: '#2E7D32',
  },
  inactiveCircle: {
    backgroundColor: COLORS.border,
  },
  stepCircleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.text,
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
    marginTop: -16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  selectedAddressCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFBF7',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultText: {
    color: '#2E7D32',
    fontSize: 8,
    fontWeight: 'bold',
  },
  addressPhone: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 28,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#4A3E3D',
    marginLeft: 28,
    lineHeight: 18,
  },
  emptyAddresses: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyAddressesText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  footer: {
    padding: SIZES.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addAddressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addAddressLinkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
  },
  summaryBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  summaryBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 6,
  },
  editLink: {
    marginLeft: 'auto',
  },
  editLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  summaryAddrName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  summaryAddrText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: 13,
    color: COLORS.text,
    flex: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  pricingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  pricingValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  pricingTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pricingTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentContainer: {
    padding: SIZES.md,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  selectedPaymentCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFBF7',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentDesc: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  checkoutBar: {
    height: 80,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  payableLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  payableValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  payBtn: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  razorpayContainer: {
    flex: 1,
    backgroundColor: '#1E2A38',
  },
  razorpayHeader: {
    backgroundColor: '#111923',
    padding: SIZES.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  razorpayIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#0F6FFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandName: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  paymentTo: {
    color: '#8A99AD',
    fontSize: 10,
  },
  paymentAmount: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  simulatorBody: {
    padding: SIZES.md,
  },
  bodyTitle: {
    color: '#8A99AD',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: SIZES.md,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#263445',
    borderRadius: 8,
    padding: 3,
    marginBottom: SIZES.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabBtn: {
    backgroundColor: '#1E2A38',
  },
  tabBtnText: {
    color: '#8A99AD',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabBtnText: {
    color: COLORS.white,
  },
  optionContent: {
    marginBottom: SIZES.lg,
  },
  simInput: {
    backgroundColor: '#263445',
    borderWidth: 1,
    borderColor: '#394A5F',
    borderRadius: 6,
    paddingHorizontal: SIZES.sm,
    height: 48,
    color: COLORS.white,
    fontSize: 14,
    marginBottom: SIZES.sm,
  },
  inputsRow: {
    flexDirection: 'row',
  },
  simNote: {
    color: '#8A99AD',
    fontSize: 11,
    fontStyle: 'italic',
  },
  razorpaySubmit: {
    height: 50,
    backgroundColor: '#0F6FFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  razorpaySubmitText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  successBanner: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  checkmarkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  orderSummaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginBottom: SIZES.xl,
  },
  orderSummaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderSummaryLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  orderSummaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    maxWidth: '65%',
  },
  successButtons: {
    marginTop: SIZES.sm,
  },
  successBtn: {
    width: '100%',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
