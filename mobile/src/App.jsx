import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CategoryItem = ({ imageUrl, name, isSelected }) => (
    <View style={styles.categoryItem}>
      <Image
          source={{ uri: imageUrl }}
          style={[styles.categoryImage, isSelected && styles.selectedCategoryImage]}
      />
      <Text style={styles.categoryName}>{name}</Text>
    </View>
);

const RestaurantCard = ({ imageUrl, name, cuisine, rating, price, distance }) => (
    <View style={styles.restaurantCard}>
      <Image source={{ uri: imageUrl }} style={styles.restaurantImage} />
      <Text style={styles.restaurantName}>{name}</Text>
      <Text style={styles.cuisineText}>{cuisine}</Text>
      <View style={styles.ratingContainer}>
        <Icon name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>{rating}</Text>
        <Text style={styles.distanceText}>{price} • {distance}</Text>
      </View>
    </View>
);

const RestaurantListItem = ({ imageUrl, name, cuisine, rating, time, distance }) => (
    <View style={styles.listItemContainer}>
      <Image source={{ uri: imageUrl }} style={styles.listItemImage} />
      <View style={styles.listItemDetails}>
        <Text style={styles.listItemName}>{name}</Text>
        <Text style={styles.listItemCuisine}>{cuisine}</Text>
        <View style={styles.listItemRatingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.listItemRating}>{rating}</Text>
          <Text style={styles.listItemTimeDistance}>{time} • {distance}</Text>
        </View>
      </View>
    </View>
);

const FoodHub = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Icon name="location-outline" size={20} color="#FF6347" />
            <View style={styles.addressContainer}>
              <Text style={styles.deliverToText}>Deliver to</Text>
              <Text style={styles.addressText}>Vgn Stafford Block-M <Icon name="chevron-down-outline" size={12} color="#6B7280" /></Text>
            </View>
          </View>
          <View style={styles.userIconContainer}>
            <Icon name="person-outline" size={16} color="#6B7280" />
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Icon name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
                placeholder="Restaurants, groceries, dishes"
                style={styles.searchInput}
            />
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?road" name="All" isSelected={true} />
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?grocery" name="Grocery" />
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?pizza" name="Pizza" />
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?burger" name="Burger" />
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?dessert" name="Desserts" />
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?road" name="All" isSelected={true} />
            <CategoryItem imageUrl="https://random.imagecdn.app/100/100?grocery" name="Grocery" />
          </ScrollView>

          {/* Featured Offer */}
          <View style={styles.offerContainer}>
            <Text style={styles.offerTitle}>50% OFF</Text>
            <Text style={styles.offerSubtitle}>On your first 3 orders</Text>
            <TouchableOpacity style={styles.orderButton}>
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
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
        </ScrollView>

        {/* Bottom Navigation */}
          {!keyboardVisible && (
            <View style={styles.bottomNav}>
              <View style={styles.navItem}>
                <Icon name="home" size={24} color="#FF6347" />
                <Text style={styles.activeNavText}>Home</Text>
              </View>
              <View style={styles.navItem}>
                <Icon name="search-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Search</Text>
              </View>
              <View style={styles.navItem}>
                <Icon name="receipt-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Orders</Text>
              </View>
              <View style={styles.navItem}>
                <Icon name="person-outline" size={24} color="#9CA3AF" />
                <Text style={styles.navText}>Account</Text>
              </View>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  offerContainer: {
    backgroundColor: '#FF6347',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: 'white',
    marginBottom: 12,
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