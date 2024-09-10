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
import {colors} from '@/assets/theme'
import Header from "@/components/Header";
import {categories} from "@/constants/category";
import {Link} from "expo-router";

interface CategoryItemProps {
    imageUrl: string;
    name: string;
    isSelected?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ imageUrl, name, isSelected }) => (

        <Link href={{
            pathname: '/list',
            params: { title: name }
        }}>
            <View style={styles.categoryItem}>
        <Image
            source={{ uri: imageUrl }}
            style={[styles.categoryImage, isSelected && styles.selectedCategoryImage]}
        />
        <Text style={styles.categoryName}>{name}</Text>
            </View>
        </Link>

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

const Home: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.safeArea, {paddingTop: insets.top}]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
            {/*<KeyboardAvoidingView*/}
            {/*    behavior={Platform.OS === "ios" ? "padding" : "height"}*/}
            {/*    style={styles.keyboardAvoidingView}*/}
            {/*>*/}
            {/* Header */}
            <Header/>

            <ScrollView style={styles.scrollView}>
                {/* Search Bar */}
                <View style={styles.searchBarContainer}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon}/>
                    <TextInput
                        placeholder="Restaurants, groceries, dishes"
                        style={styles.searchInput}
                    />
                </View>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                    {categories.map(({n, i}) => (
                        <CategoryItem key={n} imageUrl={i} name={n}/>
                    ))}
                </ScrollView>

                {/* Featured Offer */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={{uri: 'https://cdn.instashop.ae/475bd8500162ca2f53a24d2939f79379_FreeDelivery-12.gif'}}
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
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?mcdonalds" name="McDonald's"/>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?kfc" name="KFC"/>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?subway" name="Subway"/>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?dominos" name="Domino's"/>
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
                            source={{uri: 'https://cdn.instashop.ae/3ff1ec82cb0049280ece95c6f0e74cf1_FreeDelivery-1920x200.png'}}
                            style={styles.offerImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    // keyboardAvoidingView: {
    //     flex: 1,
    // },
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
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
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        height: 32, // Fixed height for two lines of text
    },
    categoryImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 4,
        marginTop:3
    },
    selectedCategoryImage: {
        borderWidth: 2,
        borderColor: colors.primary,
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
        color: colors.primary,
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
        color: colors.primary,
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

export default Home;