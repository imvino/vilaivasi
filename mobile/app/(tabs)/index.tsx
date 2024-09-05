import {
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    StatusBar, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Ionicons from "@expo/vector-icons/Ionicons";
import {useEffect, useState} from "react";

interface CategoryItemProps {
    imageUrl: string;
    name: string;
    isSelected?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ imageUrl, name, isSelected }) => (
    <View style={styles.categoryItem}>
        <Image
            source={{ uri: imageUrl }}
            style={[styles.categoryImage, isSelected && styles.selectedCategoryImage]}
        />
        <Text style={styles.categoryName}>{name}</Text>
    </View>
);

interface RestaurantCardProps {
    imageUrl: string;
    name: string;
    cuisine: string;
    rating: string;
    price: string;
    distance: string;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ imageUrl, name, cuisine, rating, price, distance }) => (
    <View style={styles.restaurantCard}>
        <Image source={{ uri: imageUrl }} style={styles.restaurantImage} />
        <Text style={styles.restaurantName}>{name}</Text>
        <Text style={styles.cuisineText}>{cuisine}</Text>
        <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{rating}</Text>
            <Text style={styles.distanceText}>{price} • {distance}</Text>
        </View>
    </View>
);

interface RestaurantListItemProps {
    imageUrl: string;
    name: string;
    cuisine: string;
    rating: string;
    time: string;
    distance: string;
}

const RestaurantListItem: React.FC<RestaurantListItemProps> = ({ imageUrl, name, cuisine, rating, time, distance }) => (
    <View style={styles.listItemContainer}>
        <Image source={{ uri: imageUrl }} style={styles.listItemImage} />
        <View style={styles.listItemDetails}>
            <Text style={styles.listItemName}>{name}</Text>
            <Text style={styles.listItemCuisine}>{cuisine}</Text>
            <View style={styles.listItemRatingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.listItemRating}>{rating}</Text>
                <Text style={styles.listItemTimeDistance}>{time} • {distance}</Text>
            </View>
        </View>
    </View>
);

const FoodHub: React.FC = () => {
    // const [keyboardVisible, setKeyboardVisible] = useState(false);
    const insets = useSafeAreaInsets();

    // useEffect(() => {
    //     const keyboardDidShowListener = Keyboard.addListener(
    //         'keyboardDidShow',
    //         () => setKeyboardVisible(true)
    //     );
    //     const keyboardDidHideListener = Keyboard.addListener(
    //         'keyboardDidHide',
    //         () => setKeyboardVisible(false)
    //     );
    //
    //     return () => {
    //         keyboardDidShowListener.remove();
    //         keyboardDidHideListener.remove();
    //     };
    // }, []);

    const categories = [
        {n: 'Supermarkets', i: 'https://cdn.instashop.ae/60aba30aad3fc4584d8908654f604d16_rounded-superstore-mockup-18.png'},
        {n: 'Restaurants', i: 'https://cdn.instashop.ae/d3c9063df070ce24f4435b19754dd99a_food-superstore-rounded---discounted.png'},
        {n: 'Pharmacies', i: 'https://cdn.instashop.ae/90aa6443a8d45149ecda841e62f13c52_pharmacy-superstore-rounded---discounted.png'},
        {n: 'Pet Shops', i: 'https://cdn.instashop.ae/09fbe895665ebbb0961548f580431b42_rounded-superstore-mockup-04.png'},
        {n: 'Stationery & Party', i: 'https://cdn.instashop.ae/da8617baf4eaa560f24e29f2a98cc6df_StationeryAndPartySupplies.png'},
        {n: 'Baby Care & Toys', i: 'https://cdn.instashop.ae/3f2f4578ea1c96e9baefb21466f913a2_games-toys-rounded-vertical.png'},
        {n: 'Specialty & Ethnic', i: 'https://cdn.instashop.ae/a34d2e28fdb02844f1ba632119f2db36_rounded-superstore-mockup-15.png'},
        {n: 'Home & Living', i: 'https://cdn.instashop.ae/1ca8c037872d2d4e9a99a51b19d13b11_Home__Living'},
        {n: 'Bakeries & Cakes', i: 'https://cdn.instashop.ae/c2e2ecc7ab4ab9cbc1f18354b60be381_Bakeries__Cakes'},
        {n: 'Cosmetics & Beauty', i: 'https://cdn.instashop.ae/452a4ea8e6bbde18edd8770fa5d3df16_Cosmetics__Beauty'},
        {n: 'Perfumes', i: 'https://cdn.instashop.ae/d94f542febc83c273aa7558e7a234aab_Perfumes'},
        {n: 'Flower Shops', i: 'https://cdn.instashop.ae/fb8173568cffb434ccdf4545735b691d_Flower_Shops'},
        {n: 'Butchery & Seafood', i: 'https://cdn.instashop.ae/97537b332658a405b3489c60d8cc0dcd_Butchery_and_Seafood_SuperStore_Circle.png'},
        {n: 'Fruits & Vegetables', i:  'https://cdn.instashop.ae/babc941eeb72938e9d9e88342b463ece_rounded-superstore-mockup-03.png'},
        {n: 'Organic Shops', i:'https://cdn.instashop.ae/0e5cb122bdc860624f281d9290b0eaae_rounded-superstore-mockup-11.png' },
        {n: 'Water', i: 'https://cdn.instashop.ae/0ad44d86ea79236cca6ff6583969d1e4_rounded-superstore-mockup-10.png'},
        {n: 'Fitness Nutrition', i: 'https://cdn.instashop.ae/39202face7d0bdff2ba7be54954408a8_rounded-superstore-mockup-14.png'},
        {n: 'Electronics', i: 'https://cdn.instashop.ae/33f11f3124cabe707c1cbcfd99256564_Electronics'}
    ];


    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={20} color="#FF6347" />
                        <View style={styles.addressContainer}>
                            <Text style={styles.deliverToText}>Deliver to</Text>
                            <Text style={styles.addressText}>Vgn Stafford Block-M <Ionicons name="chevron-down-outline" size={12} color="#6B7280" /></Text>
                        </View>
                    </View>
                    <View style={styles.userIconContainer}>
                        <Ionicons name="person-outline" size={16} color="#6B7280" />
                    </View>
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* Search Bar */}
                    <View style={styles.searchBarContainer}>
                        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Restaurants, groceries, dishes"
                            style={styles.searchInput}
                        />
                    </View>

                    {/* Categories */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                        {categories.map(({n, i}) => (
                            <CategoryItem key={n} imageUrl={i} name={n} />
                        ))}
                    </ScrollView>

                    {/* Featured Offer */}
                    <View style={styles.bannerContainer}>
                        <Image
                            source={{ uri: 'https://cdn.instashop.ae/475bd8500162ca2f53a24d2939f79379_FreeDelivery-12.gif' }}
                            style={styles.bannerImage}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Top Picks */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Top Picks For You</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.restaurantsContainer}>
                            <RestaurantCard
                                imageUrl="https://random.imagecdn.app/300/200?restaurant1"
                                name="Tasty Bites"
                                cuisine="American • 20-30 min"
                                rating="4.5"
                                price="$$"
                                distance="1.2 mi"
                            />
                            <RestaurantCard
                                imageUrl="https://random.imagecdn.app/300/200?restaurant2"
                                name="Spice Paradise"
                                cuisine="Indian • 25-35 min"
                                rating="4.3"
                                price="$$$"
                                distance="0.8 mi"
                            />
                        </ScrollView>
                    </View>

                    {/* Popular Brands */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Popular Brands</Text>
                        <View style={styles.popularBrandsContainer}>
                            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?mcdonalds" name="McDonald's" />
                            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?kfc" name="KFC" />
                            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?subway" name="Subway" />
                            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?dominos" name="Domino's" />
                        </View>
                    </View>

                    {/* All Restaurants */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>All Restaurants</Text>
                        <RestaurantListItem
                            imageUrl="https://random.imagecdn.app/120/120"
                            name="Green Leaf Cafe"
                            cuisine="Vegetarian • Salads • Healthy"
                            rating="4.6"
                            time="20-30 min"
                            distance="1.0 mi"
                        />
                        <RestaurantListItem
                            imageUrl="https://random.imagecdn.app/120/120"
                            name="Burger Palace"
                            cuisine="American • Burgers • Fast Food"
                            rating="4.2"
                            time="15-25 min"
                            distance="0.7 mi"
                        />
                    </View>

                    <View style={styles.offerImageContainer}>
                        <TouchableOpacity>
                            <Image
                                source={{ uri: 'https://cdn.instashop.ae/3ff1ec82cb0049280ece95c6f0e74cf1_FreeDelivery-1920x200.png' }}
                                style={styles.offerImage}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Bottom Navigation */}
                {/*{!keyboardVisible && (*/}
                    <View style={styles.bottomNav}>
                        <View style={styles.navItem}>
                            <Ionicons name="home" size={24} color="#FF6347" />
                            <Text style={styles.activeNavText}>Home</Text>
                        </View>
                        <View style={styles.navItem}>
                            <Ionicons name="search-outline" size={24} color="#9CA3AF" />
                            <Text style={styles.navText}>Search</Text>
                        </View>
                        <View style={styles.navItem}>
                            <Ionicons name="receipt-outline" size={24} color="#9CA3AF" />
                            <Text style={styles.navText}>Orders</Text>
                        </View>
                        <View style={styles.navItem}>
                            <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                            <Text style={styles.navText}>Account</Text>
                        </View>
                    </View>
                {/*)}*/}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: 'white',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressContainer: {
        marginLeft: 8,
    },
    deliverToText: {
        fontSize: 12,
        color: '#6B7280',
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    userIconContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        margin: 16,
        paddingHorizontal: 12,
        height: 40, // Set the height to 40
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        height: '100%', // Make the input take full height of the container
        padding: 0, // Remove default padding
    },
    categoriesContainer: {
        paddingLeft: 16,
        marginBottom: 16,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 80, // Fixed width for each category item
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        height: 32, // Fixed height for two lines of text
    },
    categoryImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 4,
    },
    selectedCategoryImage: {
        borderWidth: 2,
        borderColor: '#FF6347',
    },
    bannerContainer: {
        width: '100%',
        aspectRatio: 1920 / 600, // Adjust this ratio based on the actual dimensions of your GIF
        marginBottom: 16, // Add some space below the banner
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    offerImageContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10, // Add some vertical margin if needed
    },
    offerImage: {
        width: Dimensions.get('window').width - 32, // Full width minus padding
        height: (Dimensions.get('window').width - 32) * (200 / 1920), // Maintain aspect ratio
    },
    orderButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
    },
    orderButtonText: {
        color: '#FF6347',
        fontWeight: 'bold',
    },
    sectionContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    restaurantsContainer: {
        marginLeft: -16,
        paddingLeft: 16,
        marginBottom: 16,
    },
    restaurantCard: {
        width: 250,
        marginRight: 16,
    },
    restaurantImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cuisineText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
        marginRight: 8,
    },
    distanceText: {
        fontSize: 14,
        color: '#6B7280',
    },
    popularBrandsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingVertical: 8,
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    activeNavText: {
        fontSize: 12,
        color: '#FF6347',
        marginTop: 4,
    },
    listItemContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        paddingBottom: 16,
    },
    listItemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    listItemDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    listItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    listItemCuisine: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    listItemRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItemRating: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
        marginRight: 8,
    },
    listItemTimeDistance: {
        fontSize: 14,
        color: '#666',
    },
});

export default FoodHub;