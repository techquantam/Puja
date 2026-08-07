import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoBorder}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Anandmayi Bhakti</Text>
          <Text style={styles.tagline}>Your Premium Puja Samagri Store</Text>
        </Animated.View>

        <Animated.View style={[styles.bottomContainer, { opacity: fadeAnim }]}>
          <Text style={styles.description}>
            Experience divine shopping. Get pure, authentic, and handpicked Puja Kits, Agarbatti, Diyas, and other spiritual accessories delivered right to your doorstep.
          </Text>

          <View style={styles.buttonGroup}>
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
            />
            <Button
              title="Create Account"
              onPress={() => navigation.navigate('Signup')}
              variant="outline"
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  logoBorder: {
    padding: SIZES.sm,
    borderRadius: SIZES.borderRadiusLarge * 2,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.lightOrange,
    borderWidth: 2,
    ...SHADOWS.medium,
    marginBottom: SIZES.md,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: SIZES.borderRadiusLarge * 2 - 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: SIZES.xs,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.xl,
  },
  buttonGroup: {
    width: '100%',
  },
});
