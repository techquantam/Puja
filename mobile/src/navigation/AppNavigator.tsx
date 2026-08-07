import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore, ICartItem } from '../store/useCartStore';
import { Button } from '../components/Button';
import { HomeScreen } from '../screens/main/HomeScreen';
import { CategoriesScreen } from '../screens/main/CategoriesScreen';
import { ProductListScreen } from '../screens/main/ProductListScreen';
import { ProductDetailsScreen } from '../screens/main/ProductDetailsScreen';
import { GuestPlaceholderScreen } from '../screens/main/GuestPlaceholderScreen';
import { AddressScreen } from '../screens/main/AddressScreen';
import { CheckoutScreen } from '../screens/main/CheckoutScreen';
import { OrdersScreen } from '../screens/main/OrdersScreen';
import { OrderDetailsScreen } from '../screens/main/OrderDetailsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CartScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuthStore();
  const { cart, isLoading, fetchCart, updateQuantity, removeFromCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <GuestPlaceholderScreen
        title="Your Cart is Empty"
        description="Access your saved items and start preparing your sacred offerings by signing in."
        iconName="cart-outline"
      />
    );
  }

  if (isLoading && !cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const items = cart?.items || [];

  // Calculate pricing breakdown
  const subtotal = items.reduce((sum, item) => {
    const price = item.productId?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const discount = items.reduce((sum, item) => {
    if (!item.productId) return sum;
    const price = item.productId.price;
    const discPrice = item.productId.discountPrice || price;
    return sum + (price - discPrice) * item.quantity;
  }, 0);

  const deliveryCharges = subtotal > 500 || subtotal === 0 ? 0 : 49;
  const totalPayable = subtotal - discount + deliveryCharges;

  const handleQtyChange = async (item: ICartItem, change: number) => {
    const targetQty = item.quantity + change;
    if (targetQty < 1) {
      Alert.alert('Remove Item', 'Do you want to remove this item from your cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(item.productId._id) },
      ]);
      return;
    }

    try {
      await updateQuantity(item.productId._id, targetQty);
    } catch (err: any) {
      Alert.alert('Stock Limit', err.message || 'Cannot update quantity.');
    }
  };

  const handleRemove = (productId: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
    ]);
  };

  const renderCartItem = ({ item }: { item: ICartItem }) => {
    if (!item.productId) return null;
    const product = item.productId;
    const price = product.price;
    const discountPrice = product.discountPrice;
    const hasDiscount = discountPrice && discountPrice < price;

    return (
      <View style={styles.cartCard}>
        <Image
          source={{ uri: product.images?.[0] || 'https://images.unsplash.com/photo-1609137144813-2d28f8705030?auto=format&fit=crop&q=80&w=150' }}
          style={styles.cartItemImage}
          resizeMode="cover"
        />
        <View style={styles.cartItemInfo}>
          <Text numberOfLines={1} style={styles.cartItemName}>{product.name}</Text>
          <View style={styles.cartItemPriceRow}>
            {hasDiscount ? (
              <>
                <Text style={styles.cartItemDiscountPrice}>₹{discountPrice}</Text>
                <Text style={styles.cartItemOriginalPrice}>₹{price}</Text>
              </>
            ) : (
              <Text style={styles.cartItemPrice}>₹{price}</Text>
            )}
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => handleQtyChange(item, -1)}
                style={styles.qtyBtn}
              >
                <Ionicons name="remove" size={16} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => handleQtyChange(item, 1)}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleRemove(product._id)} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={18} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color={COLORS.border} style={{ marginBottom: SIZES.md }} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Add sacred offerings to your cart to begin.</Text>
        <Button
          title="Shop Now"
          onPress={() => navigation.navigate('Home')}
          style={styles.shopNowBtn}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.cartList}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Price Details</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price ({items.length} items)</Text>
              <Text style={styles.summaryValue}>₹{subtotal}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product Discount</Text>
                <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>-₹{discount}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charges</Text>
              <Text style={styles.summaryValue}>
                {deliveryCharges === 0 ? (
                  <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>FREE</Text>
                ) : (
                  `₹${deliveryCharges}`
                )}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={[styles.summaryRow, { marginBottom: 0 }]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{totalPayable}</Text>
            </View>
          </View>
        }
      />
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.totalAmountLabel}>Total Amount</Text>
          <Text style={styles.totalAmountValue}>₹{totalPayable}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};





const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={({ route }: any) => ({
          headerShown: true,
          title: route.params?.title || 'Puja Samagri',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{
          headerShown: true,
          title: 'Product Details',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Address"
        component={AddressScreen}
        options={{
          headerShown: true,
          title: 'My Addresses',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: true,
          title: 'Checkout',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          headerShown: true,
          title: 'Order Tracking',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
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
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  info: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SIZES.lg,
  },
  logoutBtn: {
    width: '60%',
  },
  cartList: {
    padding: SIZES.md,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: SIZES.sm,
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cartItemDiscountPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 6,
  },
  cartItemOriginalPrice: {
    fontSize: 12,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  removeBtn: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
    backgroundColor: COLORS.background,
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
    marginBottom: SIZES.xl,
  },
  shopNowBtn: {
    width: 160,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
    marginTop: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  },
  totalAmountLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  totalAmountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkoutButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
