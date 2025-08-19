import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/assets/theme';
import { commonStyles, shadowStyles } from '@/assets/commonStyles';
import StoreHeader from '@/components/StoreHeader';

const HEADER_HEIGHT = 200;
const CATEGORY_BAR_HEIGHT = 50;
const SCROLL_THRESHOLD = 20;

const StorePage2 = () => {
    const [selectedCategory, setSelectedCategory] = useState('Picks for you');
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollViewRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [cardHeight, setCardHeight] = useState(0);
    const [showFloatingBar, setShowFloatingBar] = useState(false);
    const categoryRefs = useRef({});
    const categoryOffsets = useRef({});
    const [isMeasured, setIsMeasured] = useState(false);
    const lastScrollPosition = useRef(0);
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
        // Set a timeout to mark as measured after categories have had time to layout
        const timeoutId = setTimeout(() => {
            setIsMeasured(true);
        }, 1000);

        return () => {
            clearTimeout(timeoutId);
            // Clean up refs
            categoryRefs.current = {};
            categoryOffsets.current = {};
        };
    }, []);

    useEffect(() => {
        if (!isMeasured) return;

        const listenerId = scrollY.addListener(({ value }) => {
            setShowFloatingBar(value > cardHeight + 20);
            if (!isScrolling && Math.abs(value - lastScrollPosition.current) > SCROLL_THRESHOLD) {
                updateSelectedCategory(value);
                lastScrollPosition.current = value;
            }
        });

        return () => scrollY.removeListener(listenerId);
    }, [scrollY, cardHeight, isScrolling, isMeasured]);

    const updateSelectedCategory = (scrollPosition) => {
        let newSelectedCategory = categories[0];
        for (let i = categories.length - 1; i >= 0; i--) {
            if (scrollPosition >= (categoryOffsets.current[categories[i]] || 0) - CATEGORY_BAR_HEIGHT) {
                newSelectedCategory = categories[i];
                break;
            }
        }
        setSelectedCategory(newSelectedCategory);
    };

    const scrollToCategory = (category) => {
        setIsScrolling(true);
        setSelectedCategory(category);
        if (categoryOffsets.current[category] !== undefined) {
            const scrollY = categoryOffsets.current[category] - CATEGORY_BAR_HEIGHT;
            scrollViewRef.current?.scrollTo({
                y: scrollY,
                animated: true
            });
            setTimeout(() => {
                setIsScrolling(false);
                lastScrollPosition.current = scrollY;
            }, 500);
        } else {
            setIsScrolling(false);
        }
    };


    const renderCategoryBar = (isFloating = false) => (
        <View style={[styles.categoryBar, isFloating && styles.floatingCategoryBar]}>
            <TouchableOpacity style={styles.burgerMenu}>
                <Ionicons name='menu' size={24} color='black'/>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[styles.categoryItem, selectedCategory === category && styles.selectedCategory]}
                        onPress={() => scrollToCategory(category)}
                    >
                        <Text
                            style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

        </View>
    );

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onScrollBeginDrag={() => setIsScrolling(true)}
                onScrollEndDrag={() => setIsScrolling(false)}
                onMomentumScrollEnd={() => {
                    setIsScrolling(false);
                    updateSelectedCategory(scrollY._value);
                }}
            >
                <StoreHeader
                    headerColors={colors.primary}
                    onChatPress={() => router.push('/chat')}
                    onSharePress={() => {
                    }}
                    onSearchPress={() => {
                    }}
                    onInfoPress={() => {
                    }}
                    onLayout={(event) => {
                        const { height } = event.nativeEvent.layout;
                        setCardHeight(height);
                    }}
                />

                <View style={styles.contentContainer}>
                    {renderCategoryBar()}

                    {categories.map((category, index) => (
                        <View key={category}
                              ref={(ref) => {
                                  if (ref) {
                                      categoryRefs.current[category] = ref;
                                  }
                              }}
                              onLayout={(event) => {
                                  const { height } = event.nativeEvent.layout;

                                  // Store the actual measured height for this category section
                                  categoryOffsets.current[category + '_height'] = height;

                                  // Calculate position based on accumulated heights
                                  let totalHeight = HEADER_HEIGHT + CATEGORY_BAR_HEIGHT + 50; // Add contentContainer paddingTop

                                  // Add heights of previous categories
                                  for (let i = 0; i < index; i++) {
                                      const prevCategory = categories[i];
                                      const prevHeight = categoryOffsets.current[prevCategory + '_height'] || 0;
                                      totalHeight += prevHeight;
                                  }

                                  // Store the position
                                  categoryOffsets.current[category] = totalHeight;
                              }}
                        >
                            <Text style={commonStyles.sectionTitle}>{category}</Text>
                            {products
                                .filter((product) => product.category === category)
                                .map((product) => (
                                    <View key={product.id} style={commonStyles.listItem}>
                                        <Image
                                            source={{ uri: `https://cdn.instashop.ae/60aba30aad3fc4584d8908654f604d16_rounded-superstore-mockup-18.png` }}
                                            style={commonStyles.listItemImage}
                                        />
                                        <View style={commonStyles.listItemContent}>
                                            <Text style={commonStyles.productName}>{product.name}</Text>
                                            <Text style={styles.productWeight}>1 Kg</Text>
                                            <Text style={commonStyles.productPrice}>IQD {product.price}</Text>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    ))}
                </View>

                <View style={commonStyles.footer}>
                    <Text style={commonStyles.footerText}>Add IQD 5000 to start your order</Text>
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
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingTop: HEADER_HEIGHT - 150,
    },
    categoryBar: {
        height: CATEGORY_BAR_HEIGHT,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
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
        borderBottomColor: colors.separator,
    },
    floatingCategoryBarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        backgroundColor: 'white',
        ...shadowStyles.large,
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
        borderBottomColor: colors.primary,
    },
    categoryText: {
        fontSize: 16,
        color: colors.text,
    },
    selectedCategoryText: {
        color: colors.primary,
    },
    // Using commonStyles.sectionTitle, listItem, listItemImage, listItemContent, productName
    productWeight: {
        fontSize: 14,
        color: colors.muted,
        marginTop: 2,
    },
    // Using commonStyles.productPrice, footer, footerText

});

export default StorePage2;