import React, { useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import Ionicons from "@expo/vector-icons/Ionicons";
import { categories } from "@/constants/category";

const HEADER_HEIGHT = 200;

const YasinQasab = () => {
    const scrollViewRef = useRef(null);
    useScrollToTop(scrollViewRef);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Yasin Qasab',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
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
            <ScrollView
                style={styles.scrollView}
                ref={scrollViewRef}
            >
                <View style={styles.header}>
                    <View style={styles.storeInfoCard}>
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
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <View style={styles.categoriesGrid}>
                        {categories.map((category, index) => (
                            <TouchableOpacity key={index} style={styles.categoryItem}>
                                <Image source={{uri: category.i}} style={styles.categoryImage} />
                                <Text style={styles.categoryName}>{category.n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Add IQD 5000 to start your order</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
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
        paddingTop: HEADER_HEIGHT-140,
        padding: 16,
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
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryItem: {
        width: '30%',
        marginBottom: 16,
        alignItems: 'center',
    },
    categoryImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
    },
    categoryName: {
        textAlign: 'center',
        fontSize: 12,
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