import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PRODUCTS, CATEGORIES } from '../../constants/Products';

// Theme Colors
const lightTheme = {
  bg: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#333333',
  subText: '#888888',
  primary: '#4CAF50',
  border: '#EEEEEE',
};

const darkTheme = {
  bg: '#121212',
  cardBg: '#1E1E1E',
  text: '#FFFFFF',
  subText: '#AAAAAA',
  primary: '#4CAF50',
  border: '#333333',
};

export default function HomeScreen() {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [address, setAddress] = useState('Detecting location...');
  const [loadingLoc, setLoadingLoc] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Auto-rotating search suggestions
  const searchSuggestions = ["Search 'Apples'", "Search 'Milk'", "Search 'Onion'", "Search 'Eggs'"];
  const [searchPlaceholder, setSearchPlaceholder] = useState(searchSuggestions[0]);

  // Cart: object mapping 'productId-variantUnit' to quantity and data
  const [cart, setCart] = useState<any>({});

  // --- EFFECTS ---
  // Rotate search placeholder
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % searchSuggestions.length;
      setSearchPlaceholder(searchSuggestions[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Fetch Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied');
        setLoadingLoc(false);
        return;
      }
      try {
        let loc = await Location.getCurrentPositionAsync({});
        let geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode.length > 0) {
          const { street, city } = geocode[0];
          setAddress(`${street || ''} ${city || ''}`.trim());
        }
      } catch (e) {
        setAddress('Unable to fetch location');
      }
      setLoadingLoc(false);
    })();
  }, []);

  // --- CART LOGIC ---
  const getCartQuantity = (productId: number, unit: string) => {
    return cart[`${productId}-${unit}`]?.quantity || 0;
  };

  const updateCart = (product: any, variant: any, delta: number) => {
    const key = `${product.id}-${variant.unit}`;
    setCart((prev: any) => {
      const currentQty = prev[key]?.quantity || 0;
      const newQty = currentQty + delta;
      
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[key];
        return newCart;
      }
      return { ...prev, [key]: { product, variant, quantity: newQty } };
    });
  };

  // Calculate cart totals
  const totalItems = Object.values(cart).reduce((sum: any, item: any) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum: any, item: any) => sum + (item.quantity * item.variant.price), 0);

  // --- FILTER PRODUCTS ---
  const displayProducts = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* 1. APP NAME & THEME TOGGLE */}
      <View style={styles.topNav}>
        <Text style={[styles.appName, { color: theme.primary }]}>GroceryMart</Text>
        <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* 2. LOCATION DETECTOR */}
      <View style={styles.locationContainer}>
        <Ionicons name="location" size={20} color={theme.primary} />
        {loadingLoc ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }}/>
        ) : (
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{address}</Text>
        )}
        <Ionicons name="chevron-down" size={16} color={theme.subText} style={{ marginLeft: 4 }}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 3. AUTO ROTATING SEARCH BOX */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.subText}
          />
        </View>

        {/* 4. CATEGORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catChip, { backgroundColor: activeCategory === cat ? theme.primary : theme.cardBg }]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={{ color: activeCategory === cat ? '#FFF' : theme.text, fontWeight: '600' }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 5. PRODUCT LIST & INLINE +/- CONTROLS */}
        <View style={styles.productGrid}>
          {displayProducts.map(product => {
            // For simplicity, we just display the first variant of the product
            const variant = product.variants[0]; 
            const qty = getCartQuantity(product.id, variant.unit);

            return (
              <View key={product.id} style={[styles.productCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
                <Text style={{ color: theme.subText, fontSize: 12, marginBottom: 8 }}>{variant.unit}</Text>
                
                <View style={styles.priceRow}>
                  <Text style={[styles.priceText, { color: theme.text }]}>₹{variant.price}</Text>
                  
                  {/* +/- Controls */}
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => updateCart(product, variant, 1)}>
                      <Text style={styles.addBtnText}>ADD</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyController}>
                      <TouchableOpacity onPress={() => updateCart(product, variant, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={18} color="#FFF" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity onPress={() => updateCart(product, variant, 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 6. FLOATING CART SUMMARY */}
      {totalItems as number > 0 && (
        <View style={styles.floatingCart}>
          <View>
            <Text style={styles.cartItemCount}>{totalItems} Items | ₹{totalPrice}</Text>
            <Text style={styles.cartSubText}>Extra charges may apply</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="cart" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  appName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  themeToggle: { padding: 8, borderRadius: 20 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 15 },
  locationText: { fontSize: 15, fontWeight: '600', marginLeft: 8, flex: 1 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 20, justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 28, zIndex: 1 },
  searchInput: { height: 50, borderRadius: 12, paddingLeft: 45, fontSize: 16, borderWidth: 1 },
  categoryScroll: { paddingHorizontal: 16, marginBottom: 20, maxHeight: 40 },
  catChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
  productCard: { width: '48%', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  productImage: { width: '100%', height: 100, marginBottom: 10 },
  productName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  priceText: { fontSize: 16, fontWeight: '800' },
  addBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  qtyController: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { padding: 2 },
  qtyText: { color: '#FFF', fontWeight: 'bold', marginHorizontal: 8 },
  floatingCart: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#4CAF50', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  cartItemCount: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  cartSubText: { color: '#E8F5E9', fontSize: 12, marginTop: 2 },
  viewCartBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  viewCartText: { color: '#4CAF50', fontWeight: '700', marginRight: 6 },
});