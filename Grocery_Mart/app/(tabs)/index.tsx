import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, 
  Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PRODUCTS, CATEGORIES } from '../../constants/Products';

// --- Premium Color Palette ---
const lightTheme = {
  bg: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1A1D1E',
  subText: '#9098B1',
  primary: '#10B981', 
  primaryLight: '#E8F5E9',
  border: '#EBF0F0',
  shadow: '#000000',
  imageBg: '#F8F9FA'
};

// Revamped Awesome Dark Mode Palette
const darkTheme = {
  bg: '#0F172A',         // Slate 900 (Rich dark blue-gray)
  cardBg: '#1E293B',     // Slate 800 (Elevated card color)
  text: '#F8FAFC',       // Slate 50
  subText: '#94A3B8',    // Slate 400
  primary: '#10B981',    // Vibrant Emerald
  primaryLight: '#064E3B', // Emerald 900 (Subtle tint for dark mode)
  border: '#334155',     // Slate 700
  shadow: '#000000',
  imageBg: '#334155'     // Distinct background for images in dark mode
};

export default function HomeScreen() {
  // --- STATE ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Location
  const [address, setAddress] = useState('Detecting location...');
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [manualAddressText, setManualAddressText] = useState('');
  
  // Search & Categories
  const [activeCategory, setActiveCategory] = useState('All');
  const searchSuggestions = ["Search 'Fresh Apples'", "Search 'Amul Milk'", "Search 'Onion'", "Search 'Coca Cola'"];
  const [searchPlaceholder, setSearchPlaceholder] = useState(searchSuggestions[0]);

  // Cart
  const [cart, setCart] = useState<any>({});
  const [showCartModal, setShowCartModal] = useState(false); // NEW: Cart Modal State

  // --- EFFECTS ---
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % searchSuggestions.length;
      setSearchPlaceholder(searchSuggestions[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const fetchPreciseLocation = async () => {
    setLoadingLoc(true);
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
        const newAddr = `${street || ''} ${city || ''}`.trim() || 'Unknown Location';
        setAddress(newAddr);
        setManualAddressText(newAddr);
      }
    } catch (e) {
      setAddress('Unable to fetch location');
    }
    setLoadingLoc(false);
  };

  useEffect(() => {
    fetchPreciseLocation();
  }, []);

  // --- HANDLERS ---
  const handleSaveManualAddress = () => {
    if (manualAddressText.trim().length > 0) {
      setAddress(manualAddressText.trim());
    }
    setShowAddressModal(false);
  };

  const handleAutoDetectModal = () => {
    fetchPreciseLocation();
    setShowAddressModal(false);
  };

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
        // Close cart modal if cart becomes empty
        if (Object.keys(newCart).length === 0) {
            setShowCartModal(false);
        }
        return newCart;
      }
      return { ...prev, [key]: { product, variant, quantity: newQty } };
    });
  };

  const cartItemsArray = Object.values(cart);
  const totalItems = cartItemsArray.reduce((sum: any, item: any) => sum + item.quantity, 0);
  const totalPrice = cartItemsArray.reduce((sum: any, item: any) => sum + (item.quantity * item.variant.price), 0);

  const displayProducts = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      
      {/* 1. HEADER & THEME TOGGLE */}
      <View style={styles.topNav}>
        <Text style={[styles.appName, { color: theme.text }]}>Grocery<Text style={{ color: theme.primary }}>Mart</Text></Text>
        <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={[styles.iconButton, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* 2. LOCATION DETECTOR */}
      <TouchableOpacity 
        style={styles.locationContainer} 
        activeOpacity={0.7} 
        onPress={() => setShowAddressModal(true)}
      >
        <View style={[styles.locationIconBg, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="location" size={18} color={theme.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 12, color: theme.subText, fontWeight: '500' }}>Delivering to</Text>
          {loadingLoc ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 2 }}/>
          ) : (
            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{address}</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.subText} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        
        {/* 3. SEARCH BAR */}
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBg, shadowColor: theme.shadow, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
          <Ionicons name="search" size={20} color={theme.primary} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.subText}
          />
          <View style={[styles.micIcon, { borderLeftColor: theme.border }]}>
             <Ionicons name="mic" size={20} color={theme.subText} />
          </View>
        </View>

        {/* 4. WIDER CATEGORY BOXES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[
                  styles.catChip, 
                  { 
                    backgroundColor: isActive ? theme.primary : theme.cardBg,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={{ color: isActive ? '#FFF' : theme.text, fontWeight: '700', fontSize: 15 }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. PRODUCT CARDS */}
        <View style={styles.productGrid}>
          {displayProducts.map(product => {
            const variant = product.variants[0]; 
            const qty = getCartQuantity(product.id, variant.unit);

            return (
              <View key={product.id} style={[styles.productCard, { backgroundColor: theme.cardBg, shadowColor: theme.shadow, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}>
                <View style={[styles.imageContainer, { backgroundColor: theme.imageBg }]}>
                  <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
                  <Text style={{ color: theme.subText, fontSize: 12, marginTop: 4, fontWeight: '500' }}>{variant.unit}</Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { color: theme.text }]}>₹{variant.price}</Text>
                    
                    {/* +/- Controls */}
                    {qty === 0 ? (
                      <TouchableOpacity style={[styles.addBtn, { borderColor: theme.primary }]} onPress={() => updateCart(product, variant, 1)}>
                        <Text style={[styles.addBtnText, { color: theme.primary }]}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.qtyController, { backgroundColor: theme.primary }]}>
                        <TouchableOpacity onPress={() => updateCart(product, variant, -1)} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={16} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity onPress={() => updateCart(product, variant, 1)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 6. DOCKED CART (Restored Original Design, Docked to bottom, No Floating) */}
      {totalItems as number > 0 && (
        <View style={[styles.dockedCart, { backgroundColor: theme.primary }]}>
          <View>
            <Text style={styles.cartItemCount}>{totalItems} Items | ₹{totalPrice}</Text>
            <Text style={styles.cartSubText}>Extra charges may apply</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => setShowCartModal(true)}>
            <Text style={[styles.viewCartText, { color: theme.primary }]}>View Cart</Text>
            <Ionicons name="cart" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 7. MANUAL ADDRESS MODAL */}
      <Modal visible={showAddressModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            {/* Auto Detect Location Button */}
            <TouchableOpacity 
              style={[styles.autoDetectBtn, { backgroundColor: theme.primaryLight }]}
              onPress={handleAutoDetectModal}
            >
              <Ionicons name="locate" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>Use Precise Location</Text>
            </TouchableOpacity>

            <Text style={{ color: theme.subText, marginBottom: 12, fontSize: 14, marginTop: 15 }}>
              Or enter address manually:
            </Text>

            <TextInput
              style={[styles.manualAddressInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
              placeholder="e.g., 123 Main Street, Apt 4B"
              placeholderTextColor={theme.subText}
              value={manualAddressText}
              onChangeText={setManualAddressText}
              multiline
            />

            <TouchableOpacity 
              style={[styles.saveAddressBtn, { backgroundColor: theme.primary }]} 
              onPress={handleSaveManualAddress}
            >
              <Text style={styles.saveAddressText}>Confirm Address</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 8. NEW: CART FULL MODAL */}
      <Modal visible={showCartModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModalContent, { backgroundColor: theme.bg }]}>
            
            {/* Cart Header */}
            <View style={[styles.cartHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
              <Text style={[styles.cartTitle, { color: theme.text }]}>Your Cart ({totalItems})</Text>
              <TouchableOpacity onPress={() => setShowCartModal(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Cart Items List */}
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {cartItemsArray.map((item: any, index: number) => (
                <View key={index} style={[styles.cartItemRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={[styles.cartItemImageContainer, { backgroundColor: theme.imageBg }]}>
                    <Image source={{ uri: item.product.image }} style={styles.cartItemImage} resizeMode="contain" />
                  </View>
                  
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: theme.text }]} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={{ color: theme.subText, fontSize: 13, marginTop: 2 }}>{item.variant.unit}</Text>
                    <Text style={[styles.cartItemPrice, { color: theme.text }]}>₹{item.variant.price * item.quantity}</Text>
                  </View>

                  {/* Quantity Control inside Cart */}
                  <View style={[styles.cartQtyController, { borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => updateCart(item.product, item.variant, -1)} style={styles.cartQtyBtn}>
                      <Ionicons name="remove" size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.cartQtyText, { color: theme.text }]}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateCart(item.product, item.variant, 1)} style={styles.cartQtyBtn}>
                      <Ionicons name="add" size={18} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Cart Footer */}
            <View style={[styles.cartFooter, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
              <View style={styles.billRow}>
                <Text style={{ color: theme.subText, fontSize: 16 }}>Item Total</Text>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>₹{totalPrice}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={{ color: theme.subText, fontSize: 16 }}>Delivery Fee</Text>
                <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>FREE</Text>
              </View>
              <View style={[styles.billRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }]}>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>Grand Total</Text>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>₹{totalPrice}</Text>
              </View>

              <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  appName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  iconButton: { padding: 10, borderRadius: 12, borderWidth: 1 },
  
  locationContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 20 },
  locationIconBg: { padding: 10, borderRadius: 12 },
  locationText: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 25, height: 55, borderRadius: 16, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  searchIcon: { marginLeft: 16, marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, fontWeight: '500' },
  micIcon: { paddingHorizontal: 16, borderLeftWidth: 1 },

  categoryScroll: { marginBottom: 25, maxHeight: 45 },
  catChip: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginRight: 12, justifyContent: 'center' },
  
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  productCard: { width: '47%', borderRadius: 20, marginBottom: 20, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4, overflow: 'hidden' },
  imageContainer: { width: '100%', height: 130, justifyContent: 'center', alignItems: 'center', padding: 15 },
  productImage: { width: '100%', height: '100%' },
  productInfo: { padding: 12 },
  productName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  priceText: { fontSize: 16, fontWeight: '800' },
  
  addBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  addBtnText: { fontWeight: '800', fontSize: 12 },
  
  qtyController: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 4 },
  qtyBtn: { padding: 2, paddingHorizontal: 6 },
  qtyText: { color: '#FFF', fontWeight: 'bold', marginHorizontal: 4, fontSize: 14 },
  
  dockedCart: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cartItemCount: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  cartSubText: { color: '#E8F5E9', fontSize: 12, marginTop: 2 },
  viewCartBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  viewCartText: { fontWeight: '700', marginRight: 6 },

  // Manual Address Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  closeModalBtn: { padding: 4 },
  autoDetectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#10B981' },
  manualAddressInput: { height: 100, borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, textAlignVertical: 'top', marginBottom: 20 },
  saveAddressBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveAddressText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // Cart Modal Styles
  cartModalContent: { flex: 1, marginTop: 50, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  cartTitle: { fontSize: 20, fontWeight: '800' },
  
  cartItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12, borderRadius: 16, borderWidth: 1 },
  cartItemImageContainer: { width: 60, height: 60, borderRadius: 12, padding: 5 },
  cartItemImage: { width: '100%', height: '100%' },
  cartItemInfo: { flex: 1, marginLeft: 12 },
  cartItemName: { fontSize: 15, fontWeight: '700' },
  cartItemPrice: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  
  cartQtyController: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 4 },
  cartQtyBtn: { padding: 4 },
  cartQtyText: { fontSize: 16, fontWeight: '700', marginHorizontal: 8 },

  cartFooter: { padding: 24, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  checkoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, marginTop: 20 },
  checkoutBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginRight: 8 }
});