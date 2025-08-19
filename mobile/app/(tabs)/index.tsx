import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {colors} from '@/assets/theme'
import {commonStyles} from '@/assets/commonStyles';
import Header from "@/components/Header";
import {categories} from "@/constants/category";
import {Link, router} from "expo-router";

interface CategoryItemProps {
    imageUrl: string;
    name: string;
    isSelected?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({imageUrl, name, isSelected}) => (

    <Link href={{
        pathname: '/list',
        params: {title: name}
    }}>
        <View style={commonStyles.categoryItem}>
            <Image
                source={{uri: imageUrl}}
                style={[commonStyles.categoryImage, isSelected && commonStyles.selectedCategoryImage]}
            />
            <Text style={commonStyles.categoryName}>{name}</Text>
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

const RestaurantCard: React.FC<RestaurantCardProps> = ({imageUrl, name, cuisine, rating, price, distance}) => (
    <TouchableOpacity style={commonStyles.productCard} onPress={() => router.push('/StorePage3')}>
        <Image source={{uri: imageUrl}} style={commonStyles.productImage}/>
        <Text style={commonStyles.productName}>{name}</Text>
        <Text style={styles.cuisineText}>{cuisine}</Text>
        <View style={commonStyles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700"/>
            <Text style={commonStyles.ratingText}>{rating}</Text>
            <Text style={styles.distanceText}>{price} • {distance}</Text>
        </View>
    </TouchableOpacity>
);

interface RestaurantListItemProps {
    imageUrl: string;
    name: string;
    cuisine: string;
    rating: string;
    time: string;
    distance: string;
}

const RestaurantListItem: React.FC<RestaurantListItemProps> = ({imageUrl, name, cuisine, rating, time, distance}) => (
    <TouchableOpacity style={styles.listItemContainer} onPress={() => router.push('/StorePage2')}>
        <Image source={{uri: imageUrl}} style={commonStyles.listItemImage}/>
        <View style={commonStyles.listItemContent}>
            <Text style={commonStyles.listItemTitle}>{name}</Text>
            <Text style={commonStyles.listItemSubtitle}>{cuisine}</Text>
            <View style={commonStyles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700"/>
                <Text style={commonStyles.ratingText}>{rating}</Text>
                <Text style={styles.listItemTimeDistance}>{time} • {distance}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const Home: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.safeArea, {paddingTop: insets.top}]}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.primary}/>

            {/* Header Background (solid color) */}
            <View
                style={[styles.headerGradient, {backgroundColor: colors.primary}]}
            />
            {/*<KeyboardAvoidingView*/}
            {/*    behavior={Platform.OS === "ios" ? "padding" : "height"}*/}
            {/*    style={styles.keyboardAvoidingView}*/}
            {/*>*/}
            {/* Header */}
            <Header/>

            <ScrollView style={styles.scrollView}>
                {/* Search Bar */}
                {/*<View style={styles.searchBarContainer}>*/}
                {/*    <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon}/>*/}
                {/*    <TextInput*/}
                {/*        placeholder="Restaurants, groceries, dishes"*/}
                {/*        placeholderTextColor={colors.muted}*/}
                {/*        style={styles.searchInput}*/}
                {/*    />*/}
                {/*</View>*/}

                <View style={commonStyles.searchContainer}>
                    <View style={commonStyles.searchBar}>
                        <Ionicons name="search" size={20} color="#9CA3AF" style={commonStyles.searchIcon}/>
                        <TextInput
                            style={commonStyles.searchInput}
                            placeholder="Restaurants, groceries, dishes"
                            placeholderTextColor="#9CA3AF"
                            // value={searchQuery}
                            // onChangeText={handleSearch}
                        />
                        {/*{searchQuery.length > 0 && (*/}
                        {/*    <TouchableOpacity onPress={() => handleSearch('')}>*/}
                        {/*        <Ionicons name="close-circle" size={20} color="#9CA3AF" />*/}
                        {/*    </TouchableOpacity>*/}
                        {/*)}*/}
                    </View>
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
                <View style={commonStyles.sectionContainer}>
                    <Text style={commonStyles.sectionTitle}>Top Picks For You</Text>
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
                <View style={commonStyles.sectionContainer}>
                    <Text style={commonStyles.sectionTitle}>Popular Brands</Text>
                    <View style={styles.popularBrandsContainer}>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?mcdonalds" name="McDonald's"/>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?kfc" name="KFC"/>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?subway" name="Subway"/>
                        <CategoryItem imageUrl="https://random.imagecdn.app/100/100?dominos" name="Domino's"/>
                    </View>
                </View>

                {/* All Restaurants */}
                <View style={commonStyles.sectionContainer}>
                    <Text style={commonStyles.sectionTitle}>All Restaurants</Text>
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
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        zIndex: -1,
    },
    scrollView: {
        flex: 1,
    },
    // Using commonStyles.searchContainer, searchBar, searchIcon, searchInput
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.separator,
        borderRadius: 8,
        margin: 16,
        paddingHorizontal: 12,
        height: 40, // Set the height to 40
    },
    // searchBarContainer: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     backgroundColor: '#FFFFFF',
    //     borderRadius: 25,
    //     margin: 16,
    //     marginTop: 8,
    //     paddingHorizontal: 16,
    //     height: 48,
    //     shadowColor: '#000',
    //     shadowOffset: {
    //         width: 0,
    //         height: 2,
    //     },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 3,
    //     elevation: 3,
    // },
    // Using commonStyles.searchIcon, searchInput
    // searchInput: {
    //     flex: 1,
    //     fontSize: 16,
    //     color: colors.text,
    //     height: '100%',
    //     padding: 0,
    //     fontWeight: '400',
    // },
    categoriesContainer: {
        paddingLeft: 16,
        marginBottom: 16,
    },
    // Using commonStyles.categoryItem, categoryName, categoryImage, selectedCategoryImage
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
    // Using commonStyles.sectionContainer, sectionTitle
    restaurantsContainer: {
        marginLeft: -16,
        paddingLeft: 16,
        marginBottom: 16,
    },
    // Using commonStyles.productCard, productImage, productName
    cuisineText: {
        fontSize: 14,
        color: colors.muted,
        marginBottom: 4,
    },
    // Using commonStyles.ratingContainer, ratingText
    distanceText: {
        fontSize: 14,
        color: colors.muted,
    },
    popularBrandsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: colors.separator,
        paddingVertical: 8,
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 12,
        color: colors.muted,
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
        borderBottomColor: colors.separator,
        paddingBottom: 16,
    },
    // Using commonStyles.listItemImage, listItemContent, listItemTitle, listItemSubtitle, ratingContainer, ratingText
    listItemTimeDistance: {
        fontSize: 14,
        color: colors.muted,
    },
});

export default Home;