import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Platform,
    StatusBar, findNodeHandle,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import Ionicons from "@expo/vector-icons/Ionicons";

const HEADER_HEIGHT = 200;
const CATEGORY_BAR_HEIGHT = 50;

const YasinQasab = () => {
    const [selectedCategory, setSelectedCategory] = useState('Picks for you');
    const scrollViewRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [cardHeight, setCardHeight] = useState(0);
    const [showFloatingBar, setShowFloatingBar] = useState(false);
    const categoryRefs = useRef({});
    useScrollToTop(scrollViewRef);

    const categories = ['Picks for you', 'Chicken', 'Kofta', 'Beef', 'Lamb'];
    const products = [
        { id: 1, name: 'Beef Rope', price: 28000, category: 'Beef', image: 'beef_rope.jpg' },
        { id: 2, name: 'Marinated Chicken Breast', price: 9000, category: 'Chicken', image: 'chicken_breast.jpg' },
        { id: 3, name: 'Chicken Kebab', price: 13000, category: 'Chicken', image: 'chicken_kebab.jpg' },
        { id: 4, name: 'Chi Kofta', price: 15000, category: 'Kofta', image: 'chi_kofta.jpg' },
        { id: 5, name: 'Boneless Beef Thigh', price: 30000, category: 'Beef', image: 'beef_thigh.jpg' },
        { id: 6, name: 'Boneless Beef Thigh', price: 30000, category: 'Beef', image: 'beef_thigh.jpg' },
        { id: 7, name: 'Boneless Beef Thigh', price: 30000, category: 'Beef', image: 'beef_thigh.jpg' },
        { id: 8, name: 'Boneless Beef Thigh', price: 30000, category: 'Beef', image: 'beef_thigh.jpg' },
        { id: 9, name: 'Boneless Beef Thigh', price: 30000, category: 'Beef', image: 'beef_thigh.jpg' },
    ];

    useEffect(() => {
        const listenerId = scrollY.addListener(({ value }) => {
            setShowFloatingBar(value > cardHeight+20);
        });

        return () => scrollY.removeListener(listenerId);
    }, [scrollY, cardHeight]);

    const scrollToCategory = (category) => {
        setSelectedCategory(category);
        if (categoryRefs.current[category]) {
            categoryRefs.current[category].measureLayout(
                findNodeHandle(scrollViewRef.current),
                (x, y) => {
                    scrollViewRef.current?.scrollTo({ y: y-CATEGORY_BAR_HEIGHT, animated: true });
                }
            );
        }
    };

    const renderCategoryBar = (isFloating = false) => (
        <View style={[styles.categoryBar, isFloating && styles.floatingCategoryBar]}>
            <TouchableOpacity style={styles.burgerMenu}>
                <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[styles.categoryItem, selectedCategory === category && styles.selectedCategory]}
                        onPress={() => scrollToCategory(category)}
                    >
                        <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Yasin Qasab',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    ),
                        headerRight: () => (
                            <View style={styles.headerRightContainer}>
                                <TouchableOpacity style={styles.headerButton}>
                                    <Ionicons name="share-outline" size={24} color="black" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.headerButton}>
                                    <Ionicons name="search-outline" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                        ),
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                        height: 10
                    },
                    headerTintColor: '#000000',
                    headerShadowVisible: false,
                }}
            />
            <Animated.ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                <Animated.View style={[styles.header]}>
                    <View
                        style={styles.storeInfoCard}
                        onLayout={(event) => {
                            const { height } = event.nativeEvent.layout;
                            setCardHeight(height);
                        }}
                    >
                        <TouchableOpacity style={styles.infoButton}>
                            <Ionicons name="information-circle-outline" size={24} color="#666" />
                        </TouchableOpacity>
                        <View style={styles.storeInfoHeader}>
                            <Image
                                source={{uri: 'https://cdn.instashop.ae/60aba30aad3fc4584d8908654f604d16_rounded-superstore-mockup-18.png'}}
                                style={styles.logo}
                            />
                            <View style={styles.storeInfoText}>
                                <Text style={styles.storeName}>Yasin Qasab</Text>
                                <Text style={styles.storeDescription}>Fresh Meat & Fish, Chicken, Speciality St...</Text>
                                <View style={styles.ratingContainer}>
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                    <Text style={styles.rating}>4.6 (32 Ratings)</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.deliveryInfo}>
                            <View style={styles.deliveryInfoItem}>
                                <Text style={styles.deliveryInfoLabel}>Delivery fee</Text>
                                <Text style={styles.deliveryInfoValue}>Free</Text>
                            </View>
                            <View style={styles.deliveryInfoItem}>
                                <Text style={styles.deliveryInfoLabel}>Delivery time</Text>
                                <Text style={styles.deliveryInfoValue}>24 mins</Text>
                            </View>
                            <View style={styles.deliveryInfoItem}>
                                <Text style={styles.deliveryInfoLabel}>Delivered by</Text>
                                <Text style={styles.deliveryInfoValue}>talabat</Text>
                            </View>
                        </View>
                        <View style={styles.promoContainer}>
                            <Ionicons name="gift-outline" size={16} color="#FF6347" />
                            <Text style={styles.promoText}>Free delivery on your first order</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.contentContainer}>
                    {renderCategoryBar()}

                    {categories.map((category) => (
                        <View key={category}
                              ref={(ref) => (categoryRefs.current[category] = ref)}
                        >
                            <Text style={styles.categoryTitle}>{category}</Text>
                            {products
                                .filter((product) => product.category === category)
                                .map((product) => (
                                    <View key={product.id} style={styles.productItem}>
                                        <Image
                                            source={{uri: `https://cdn.instashop.ae/60aba30aad3fc4584d8908654f604d16_rounded-superstore-mockup-18.png`}}
                                            style={styles.productImage}
                                        />
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName}>{product.name}</Text>
                                            <Text style={styles.productWeight}>1 Kg</Text>
                                            <Text style={styles.productPrice}>IQD {product.price}</Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Add IQD 5000 to start your order</Text>
                </View>
            </Animated.ScrollView>
            {showFloatingBar && (
                <Animated.View style={[styles.floatingCategoryBarContainer]}>
                    {renderCategoryBar(true)}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    headerButton: {
        padding: 10,
    },
    headerRightContainer: {
        flexDirection: 'row',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
        backgroundColor: '#FFF0F5',
        zIndex: 1,
    },
    storeInfoCard: {
        margin: 16,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    contentContainer: {
        paddingTop: HEADER_HEIGHT-150,
    },
    infoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
    },
    storeInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    storeInfoText: {
        flex: 1,
        marginLeft: 16,
    },
    storeName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    storeDescription: {
        fontSize: 14,
        color: '#666',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    rating: {
        marginLeft: 4,
        fontSize: 14,
    },
    deliveryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    deliveryInfoItem: {
        alignItems: 'center',
    },
    deliveryInfoLabel: {
        fontSize: 12,
        color: '#666',
    },
    deliveryInfoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
    promoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0F5',
        padding: 8,
        borderRadius: 4,
        marginTop: 16,
    },
    promoText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#FF6347',
    },
    categoryBar: {
        height: CATEGORY_BAR_HEIGHT,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
    },
    floatingCategoryBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    floatingCategoryBarContainer: {
        position: 'absolute',
        top: 0, // Adjust based on your header height
        left: 0,
        right: 0,
        zIndex: 2,
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    burgerMenu: {
        padding: 10,
    },
    categoryItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    selectedCategory: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF6347',
    },
    categoryText: {
        fontSize: 16,
    },
    selectedCategoryText: {
        color: '#FF6347',
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 16,
    },
    productItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    productInfo: {
        marginLeft: 16,
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    productWeight: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6347',
        marginTop: 4,
    },
    footer: {
        padding: 16,
        backgroundColor: '#F3F4F6',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
    },
});

export default YasinQasab;