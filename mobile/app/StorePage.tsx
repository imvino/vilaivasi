import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {categories} from "@/constants/category";

const StorePage = () => {

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>560025 - Del</Text>
                    <TouchableOpacity>
                        <Ionicons name="share-social-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                {/* Store Info */}
                <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>Alankar Supermarket</Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>4.0 • 4,000+ Shoppers</Text>
                    </View>
                    <Text style={styles.location}>1.31 km • Shanti Nagar, Bengaluru</Text>
                    <Text style={styles.deliveryInfo}>3-4 hrs • Free delivery above ₹299</Text>
                </View>

                {/* Exclusive Store Deals */}
                <TouchableOpacity style={styles.dealsContainer}>
                    <View style={styles.dealsContent}>
                        <Ionicons name="pricetag-outline" size={24} color="#FF6347" />
                        <View>
                            <Text style={styles.dealsTitle}>Exclusive Store Deals</Text>
                            <Text style={styles.dealsSubtitle}>Get guaranteed discounts</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#FF6347" />
                </TouchableOpacity>

                {/* Delivery/In-store Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity style={[styles.toggleButton, styles.activeToggle]}>
                        <Text style={styles.activeToggleText}>Delivery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toggleButton}>
                        <Text style={styles.toggleText}>In-store</Text>
                    </TouchableOpacity>
                </View>

                {/* Search and Categories */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for items"
                    />
                    <TouchableOpacity style={styles.categoriesButton}>
                        <Text style={styles.categoriesButtonText}>Categories</Text>
                        <Ionicons name="chevron-down" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Beverages Section */}
                <View style={styles.beveragesSection}>
                    <Text style={styles.sectionTitle}>Beverages</Text>
                    <View style={styles.categoriesGrid}>
                        {categories.map((category, index) => (
                            <TouchableOpacity key={index} style={styles.categoryItem}>
                                <Image source={{uri: category.i}} style={styles.categoryImage} />
                                <Text style={styles.categoryName}>{category.n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    storeInfo: {
        backgroundColor: '#FF6347',
        padding: 16,
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    rating: {
        color: 'white',
        marginLeft: 4,
    },
    location: {
        color: 'white',
        marginBottom: 4,
    },
    deliveryInfo: {
        color: 'white',
    },
    dealsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF5EE',
        padding: 16,
        marginVertical: 16,
    },
    dealsContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dealsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    dealsSubtitle: {
        color: 'gray',
        marginLeft: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    toggleButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    activeToggle: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF6347',
    },
    toggleText: {
        color: 'gray',
    },
    activeToggleText: {
        color: '#FF6347',
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
    },
    categoriesButton: {
        backgroundColor: '#FF6347',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    categoriesButtonText: {
        color: 'white',
        marginRight: 4,
    },
    beveragesSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
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
});

export default StorePage;