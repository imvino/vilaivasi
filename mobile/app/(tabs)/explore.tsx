import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  StyleSheet,
  StatusBar,
 TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from 'expo-location';
import { colors } from '@/assets/theme';
import Header from "@/components/Header";
import storeData from '../../constants/storeData.json';
import MapView, {Circle, Marker} from "react-native-maps";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {router} from "expo-router";

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

const Home: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [filteredStores, setFilteredStores] = useState(storeData.stores);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDeliveryCost, setSelectedDeliveryCost] = useState('All');
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('All');
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [radius, setRadius] = useState(2);

  const filterStores = () => {
    if (!location) return;

    let filtered = storeData.stores.filter(store => {
      const categoryMatch = selectedCategory === 'All' || store.category === selectedCategory;
      const deliveryCostMatch = selectedDeliveryCost === 'All' ||
          (selectedDeliveryCost === 'Free Delivery' && store.deliveryCost === 'free') ||
          (selectedDeliveryCost === 'Paid Delivery' && store.deliveryCost !== 'free');
      const deliveryTimeMatch = selectedDeliveryTime === 'All' ||
          (selectedDeliveryTime === '10 min' && parseInt(store.deliveryTime) <= 10) ||
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

    setFilteredStores(filtered);
  };

  const isStoreOpenNow = (openingHours: string) => {
    // Implement logic to check if the store is currently open
    // This is a placeholder implementation
    return true;
  };

  useEffect(() => {
    filterStores();
  }, [selectedCategory, selectedDeliveryCost, selectedDeliveryTime, radius, location, isOpenNow]);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Grocery':
        return 'shopping-cart';
      case 'Medicine':
        return 'medical-services';
      case 'Fish & Meat':
        return 'restaurant';
      default:
        return 'store';
    }
  };

  return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header />

        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
              placeholder="Restaurants, groceries, dishes"
              style={styles.searchInput}
          />
        </View>

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
                  {['All', '10 min', '30 min', '1 hour', '1 day'].map((time) => (
                      <ChipButton
                          key={time}
                          title={time}
                          selected={selectedDeliveryTime === time}
                          onPress={() => setSelectedDeliveryTime(time)}
                      />
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Open Now</Text>
                <View style={styles.chipContainer}>
                <TouchableOpacity
                    style={[styles.chip, isOpenNow && styles.selectedChip]}
                    onPress={() => setIsOpenNow(!isOpenNow)}
                >
                  <Text style={[styles.chipText, isOpenNow && styles.selectedChipText]}> Open Now</Text>
                </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Search Radius</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={10}
                    step={0.5}
                    value={radius}
                    onValueChange={(value) => setRadius(value)}
                />
                <View style={styles.sliderLabels}>
                  <Text>0.5 km</Text>
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

        <View style={styles.mapContainer}>
          {location && (
              <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
              >
                <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="Your Location"
                >
                  <MaterialCommunityIcons name="home-map-marker" size={36} color="white" />
                </Marker>
                <Circle
                    center={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    radius={radius * 1000}
                    fillColor="rgba(220,27, 74,0.25)"
                    // fillColor={'red'}
                    strokeColor="rgba(0, 0, 255, 1)"
                />
                {filteredStores.map(store => (
                    <Marker
                        key={store.id}
                        coordinate={{
                          latitude: store.location.latitude,
                          longitude: store.location.longitude,
                        }}
                        title={store.name}
                        description={`${store.category} • Delivery: ${store.deliveryCost}, Time: ${store.deliveryTime} min`}
                    >
                      <View style={styles.customMarker}>
                        <MaterialIcons name={getCategoryIcon(store.category)} size={15} color={colors.primary} />
                      </View>
                    </Marker>
                ))}
              </MapView>
          )}
          <TouchableOpacity
              style={[styles.bottomBtn,styles.filterButton]}
              onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="filter-list" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>router.push("/list")}
              style={[styles.bottomBtn,styles.listViewButton]}
              // onPress={() => setIsListView(!isListView)}
          >
            <MaterialIcons name={"view-list"} size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    height: '100%',
    padding: 0,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
  },
  bottomBtn:{
    position: 'absolute',
    bottom: 20,
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
  filterButton: {
    left: 20,
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
  listViewButton: {
    right: 20,
  },
});

export default Home;