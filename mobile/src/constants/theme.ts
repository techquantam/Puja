import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#FF7F00',       // Saffron
  secondary: '#D4AF37',     // Gold
  lightOrange: '#FFE0B2',   // Light Orange
  background: '#FFFFFF',
  surface: '#FFF8F0',       // Very light saffron/white tint for cards
  text: '#2C1B10',          // Warm dark brown instead of harsh black
  textLight: '#7A6B5D',
  border: '#EADBC8',
  error: '#D32F2F',
  success: '#388E3C',
  white: '#FFFFFF',
  shadow: '#000000',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  borderRadius: 12,
  borderRadiusLarge: 20,
};

export const SHADOWS = StyleSheet.create({
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});
