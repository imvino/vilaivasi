import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView, StatusBar, SafeAreaView, Platform, Image, FlatList } from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import Header from "@/components/Header";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from "@/assets/theme";

// Import the JSON data
import storeData from '../constants/storeData.json';


interface ChipButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
}

const ChipButton: React.FC<ChipButtonProps> = ({ title, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.chip, selected && styles.selectedChip]}
        onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{title}</Text>
    </TouchableOpacity>
);
interface StarRatingProps {
  rating: number;
  starSize?: number;
  starColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, starSize = 16, starColor = "#FFD700" }) => {
  return (
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
                key={star}
                name={star <= rating ? 'star' : 'star-outline'}
                size={starSize}
                color={starColor}
            />
        ))}
      </View>
  );
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Grocery':
      return 'shopping-cart';
    case 'Medicine':
      return 'local-pharmacy';
    case 'Fish & Meat':
      return 'restaurant';
    default:
      return 'store';
  }
};

const ListItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.listItem} onPress={() => onPress(item)}>
      <Image source={{ uri: item.image }} style={styles.listItemImage} />
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <StarRating rating={item.rating} starSize={14} />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.listItemCategory}>{item.category}</Text>
        <View style={styles.listItemDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="delivery-dining" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{item.deliveryCost}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="schedule" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{item.deliveryTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="attach-money" size={16} color={colors.primary} />
            <Text style={styles.detailText}>Min KD {item.minOrder.toFixed(2)}</Text>
          </View>
        </View>
        {item.discount && (
            <View style={styles.discountContainer}>
              <MaterialIcons name="local-offer" size={14} color={colors.primary} />
              <Text style={styles.discountText}>{item.discount}</Text>
            </View>
        )}
      </View>
    </TouchableOpacity>
);
export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [radius, setRadius] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDeliveryCost, setSelectedDeliveryCost] = useState('All');
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('All');
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [filteredStores, setFilteredStores] = useState(storeData.stores);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isListView, setIsListView] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Error fetching location');
      }
    })();
  }, []);

  useEffect(() => {
    filterStores();
  }, [selectedCategory, selectedDeliveryCost, selectedDeliveryTime, radius, location, isOpenNow, sortBy]);

  const filterStores = () => {
    if (!location) return;

    let filtered = storeData.stores.filter(store => {
      const categoryMatch = selectedCategory === 'All' || store.category === selectedCategory;
      const deliveryCostMatch = selectedDeliveryCost === 'All' ||
          (selectedDeliveryCost === 'Free Delivery' && store.deliveryCost === 'Free') ||
          (selectedDeliveryCost === 'Paid Delivery' && store.deliveryCost !== 'Free');
      const deliveryTimeMatch = selectedDeliveryTime === 'All' ||
          (selectedDeliveryTime === '30 min' && parseInt(store.deliveryTime) <= 30) ||
          (selectedDeliveryTime === '1 hour' && parseInt(store.deliveryTime) <= 60) ||
          (selectedDeliveryTime === '1 day' && parseInt(store.deliveryTime) <= 1440);

      // Calculate distance (simplified, not accounting for Earth's curvature)
      const distance = Math.sqrt(
          Math.pow(location.coords.latitude - store.location.latitude, 2) +
          Math.pow(location.coords.longitude - store.location.longitude, 2)
      ) * 111; // Rough conversion to kilometers

      const radiusMatch = distance <= radius;

      const openNowMatch = !isOpenNow || isStoreOpenNow(store.openingHours);

      return categoryMatch && deliveryCostMatch && deliveryTimeMatch && radiusMatch && openNowMatch;
    });

    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return a.minOrder - b.minOrder;
          case 'deliveryTime':
            return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
          case 'rating':
            return b.rating - a.rating;
          default:
            return 0;
        }
      });
    }

    setFilteredStores(filtered);
  };

  const isStoreOpenNow = (openingHours: string) => {
    // Implement logic to check if the store is currently open
    // This is a placeholder implementation
    return true;
  };

  const handleMarkerPress = (store) => {
    setSelectedStore(store);
  };

  const handleCloseCard = () => {
    setSelectedStore(null);
  };

  const handleShopNow = () => {
    // Navigate to shop page
    console.log('Navigating to shop page for:', selectedStore?.name);
    // Implement your navigation logic here
  };

  const renderStoreItem = ({ item }) => (
      <TouchableOpacity style={styles.listItem} onPress={() => handleMarkerPress(item)}>
        <Image source={{ uri: item.image }} style={styles.listItemImage} />
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemName}>{item.name}</Text>
          <Text style={styles.listItemCategory}>{item.category}</Text>
          <StarRating rating={item.rating} starSize={12} />
          <Text style={styles.listItemDelivery}>Delivery: {item.deliveryCost}</Text>
        </View>
      </TouchableOpacity>
  );

  const renderListItem = ({ item }) => (
      <ListItem item={item} onPress={handleMarkerPress} />
  );


  return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header />

        <View style={styles.mapContainer}>
          {isListView ? (
              <>
                <View style={styles.sortContainer}>
                  <TouchableOpacity style={styles.sortButton} onPress={() => setSortBy('price')}>
                    <MaterialIcons name="sort" size={24} color={sortBy === 'price' ? colors.primary : '#000'} />
                    <Text style={[styles.sortButtonText, sortBy === 'price' && styles.activeSortButtonText]}>Price</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sortButton} onPress={() => setSortBy('deliveryTime')}>
                    <MaterialIcons name="schedule" size={24} color={sortBy === 'deliveryTime' ? colors.primary : '#000'} />
                    <Text style={[styles.sortButtonText, sortBy === 'deliveryTime' && styles.activeSortButtonText]}>Time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sortButton} onPress={() => setSortBy('rating')}>
                    <MaterialIcons name="star" size={24} color={sortBy === 'rating' ? colors.primary : '#000'} />
                    <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.activeSortButtonText]}>Rating</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                    data={filteredStores}
                    renderItem={renderListItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                />
              </>
          ) : (
              location && (
                  <MapView

                      ref={mapRef}
                      style={styles.map}
                      initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      }}
                      customMapStyle={[
                        {
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#242f3e"
                            }
                          ]
                        },
                        {
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#746855"
                            }
                          ]
                        },
                        {
                          "elementType": "labels.text.stroke",
                          "stylers": [
                            {
                              "color": "#242f3e"
                            }
                          ]
                        },
                        {
                          "featureType": "administrative.locality",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#d59563"
                            }
                          ]
                        },
                        {
                          "featureType": "poi",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#d59563"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#263c3f"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#6b9a76"
                            }
                          ]
                        },
                        {
                          "featureType": "road",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#38414e"
                            }
                          ]
                        },
                        {
                          "featureType": "road",
                          "elementType": "geometry.stroke",
                          "stylers": [
                            {
                              "color": "#212a37"
                            }
                          ]
                        },
                        {
                          "featureType": "road",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#9ca5b3"
                            }
                          ]
                        },
                        {
                          "featureType": "road.highway",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#746855"
                            }
                          ]
                        },
                        {
                          "featureType": "road.highway",
                          "elementType": "geometry.stroke",
                          "stylers": [
                            {
                              "color": "#1f2835"
                            }
                          ]
                        },
                        {
                          "featureType": "road.highway",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#f3d19c"
                            }
                          ]
                        },
                        {
                          "featureType": "transit",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#2f3948"
                            }
                          ]
                        },
                        {
                          "featureType": "transit.station",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#d59563"
                            }
                          ]
                        },
                        {
                          "featureType": "water",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#17263c"
                            }
                          ]
                        },
                        {
                          "featureType": "water",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#515c6d"
                            }
                          ]
                        },
                        {
                          "featureType": "water",
                          "elementType": "labels.text.stroke",
                          "stylers": [
                            {
                              "color": "#17263c"
                            }
                          ]
                        }
                      ]}
                  >
                    <Marker
                        coordinate={{
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude,
                        }}
                        title="Your Location"
                    >
                      <MaterialIcons name="person-pin-circle" size={36} color="#E91E63" />
                    </Marker>
                    <Circle
                        center={{
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude,
                        }}
                        radius={radius * 1000}
                        fillColor="rgba(0, 0, 255, 0.1)"
                        strokeColor="rgba(0, 0, 255, 0.3)"
                    />
                    {filteredStores.map(store => (
                        <Marker
                            key={store.id}
                            coordinate={{
                              latitude: store.location.latitude,
                              longitude: store.location.longitude,
                            }}
                            onPress={() => handleMarkerPress(store)}
                        >
                          <View style={styles.markerContainer}>
                            <MaterialIcons name={getCategoryIcon(store.category)} size={24} color="#FFFFFF" />
                          </View>
                          <Callout tooltip>
                            <View style={styles.calloutContainer}>
                              <Text style={styles.calloutText}>{store.name}</Text>
                            </View>
                          </Callout>
                        </Marker>
                    ))}
                  </MapView>
              )
          )}
          <TouchableOpacity
              style={[styles.filterButton, isListView && styles.filterButtonListView]}
              onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="filter-list" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {selectedStore && (
            <View style={styles.storeCard}>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseCard}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <View style={styles.cardContent}>
                <Image source={{ uri: selectedStore.image }} style={styles.storeImage} />
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{selectedStore.name}</Text>
                  <Text style={styles.storeCategory}>{selectedStore.category}</Text>
                  <View style={styles.ratingContainer}>
                    <StarRating rating={selectedStore.rating} />
                    <Text style={styles.ratingText}>{selectedStore.rating} ({selectedStore.ratingCount} reviews)</Text>
                  </View>
                  <Text style={styles.infoText}>Delivery: {selectedStore.deliveryCost}</Text>
                  <Text style={styles.infoText}>Time: {selectedStore.deliveryTime}</Text>
                  <Text style={styles.infoText}>Min Order: KD {selectedStore.minOrder.toFixed(2)}</Text>
                  <Text style={styles.infoText}>Open: {selectedStore.openingHours}</Text>
                </View>
              </View>
              {selectedStore.discount && (
                  <View style={styles.discountContainer}>
                    <MaterialIcons name="local-offer" size={18} color={colors.primary} />
                    <Text style={styles.discountText}>{selectedStore.discount}</Text>
                  </View>
              )}
              <TouchableOpacity style={styles.shopNowButton} onPress={handleShopNow}>
                <Text style={styles.shopNowButtonText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
        )}

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(!modalVisible)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.chipContainer}>
                  {['All', 'Grocery', 'Fish & Meat', 'Medicine'].map((category) => (
                      <ChipButton
                          key={category}
                          title={category}
                          selected={selectedCategory === category}
                          onPress={() => setSelectedCategory(category)}
                      />
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Delivery Cost</Text>
                <View style={styles.chipContainer}>
                  {['All', 'Free Delivery', 'Paid Delivery'].map((cost) => (
                      <ChipButton
                          key={cost}
                          title={cost}
                          selected={selectedDeliveryCost === cost}
                          onPress={() => setSelectedDeliveryCost(cost)}
                      />
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Delivery Time</Text>
                <View style={styles.chipContainer}>
                  {['All', '30 min', '1 hour', '1 day'].map((time) => (
                      <ChipButton
                          key={time}
                          title={time}
                          selected={selectedDeliveryTime === time}
                          onPress={() => setSelectedDeliveryTime(time)}
                      />
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Open Now</Text>
                <TouchableOpacity
                    style={[styles.chip, isOpenNow && styles.selectedChip]}
                    onPress={() => setIsOpenNow(!isOpenNow)}
                >
                  <Text style={[styles.chipText, isOpenNow && styles.selectedChipText]}>
                    {isOpenNow ? 'Open Now' : 'All Hours'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Search Radius</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={radius}
                    onValueChange={(value) => setRadius(value)}
                />
                <View style={styles.sliderLabels}>
                  <Text>1 km</Text>
                  <Text>{radius} km</Text>
                  <Text>10 km</Text>
                </View>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setSelectedCategory('All');
                      setSelectedDeliveryCost('All');
                      setSelectedDeliveryTime('All');
                      setIsOpenNow(false);
                      setRadius(5);
                    }}
                >
                  <Text>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {!isListView && (
            <TouchableOpacity
                style={styles.zoomBackButton}
                onPress={() => {
                  if (mapRef.current && location) {
                    mapRef.current.animateToRegion({
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    }, 1000);
                  }
                }}
            >
              <MaterialIcons name="my-location" size={24} color="white" />
            </TouchableOpacity>
        )}
        <TouchableOpacity
            style={styles.toggleViewButton}
            onPress={() => setIsListView(!isListView)}
        >
          <MaterialIcons name={isListView ? "map" : "view-list"} size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 10,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 5,
    padding: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  listItemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 2,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  discountText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  activeSortButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  filterButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  filterButtonListView: {
    top: 'auto',
    bottom: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  sortLabel: {
    marginRight: 10,
    fontWeight: 'bold',
  },
  sortBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  activeSortBadge: {
    backgroundColor: colors.primary,
  },
  sortBadgeText: {
    fontSize: 14,
  },
  activeSortBadgeText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
  },
  selectedChipText: {
    color: 'white',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  clearButton: {
    marginRight: 10,
    padding: 10,
  },
  applyButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  applyButtonText: {
    color: 'white',
  },
  storeCard: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  storeCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  shopNowButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
  },
  shopNowButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  zoomBackButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleViewButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemDelivery: {
    fontSize: 12,
    color: '#666',
  },
  markerContainer: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 5,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    width: 150,
  },
  calloutText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sortButtonActive: {
    padding: 5,
    fontWeight: 'bold',
    color: colors.primary,
  },
});