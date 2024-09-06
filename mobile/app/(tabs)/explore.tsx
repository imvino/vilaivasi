import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView, StatusBar, SafeAreaView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import Header from "@/components/Header";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from "@/assets/theme";

// Import the JSON data
import storeData from '../../constants/storeData.json';

// ... (keep the WebMapPlaceholder and ChipButton components as they were)

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [radius, setRadius] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDeliveryCost, setSelectedDeliveryCost] = useState('All');
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('All');
  const [filteredStores, setFilteredStores] = useState(storeData.stores);
  const insets = useSafeAreaInsets();

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
  }, [selectedCategory, selectedDeliveryCost, selectedDeliveryTime, radius]);

  const filterStores = () => {
    const filtered = storeData.stores.filter(store => {
      const categoryMatch = selectedCategory === 'All' || store.category === selectedCategory;
      const deliveryCostMatch = selectedDeliveryCost === 'All' ||
          (selectedDeliveryCost === 'Free Delivery' && store.deliveryCost === 'free') ||
          (selectedDeliveryCost === 'Paid Delivery' && store.deliveryCost === 'paid');
      const deliveryTimeMatch = selectedDeliveryTime === 'All' ||
          (selectedDeliveryTime === '10 min' && store.deliveryTime <= 10) ||
          (selectedDeliveryTime === '1 hour' && store.deliveryTime <= 60) ||
          (selectedDeliveryTime === '1 day' && store.deliveryTime <= 1440);

      // Calculate distance (simplified, not accounting for Earth's curvature)
      const distance = location
          ? Math.sqrt(
          Math.pow(location.coords.latitude - store.location.latitude, 2) +
          Math.pow(location.coords.longitude - store.location.longitude, 2)
      ) * 111 // Rough conversion to kilometers
          : 0;

      const radiusMatch = distance <= radius;

      return categoryMatch && deliveryCostMatch && deliveryTimeMatch && radiusMatch;
    });

    setFilteredStores(filtered);
  };

  const MapComponent = Platform.OS === 'web' ? <></> : MapView;

  return (
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header />

        <View style={styles.mapContainer}>
          {location && (
              <MapComponent
                  style={styles.map}
                  initialRegion={Platform.OS !== 'web' ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  } : undefined}
                  location={location}
              >
                {Platform.OS !== 'web' && filteredStores.map(store => (
                    <Marker
                        key={store.id}
                        coordinate={{
                          latitude: store.location.latitude,
                          longitude: store.location.longitude,
                        }}
                        title={store.category}
                        description={`Delivery: ${store.deliveryCost}, Time: ${store.deliveryTime} min`}
                    />
                ))}
              </MapComponent>
          )}
          <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setModalVisible(true)}
          >
            <FontAwesome name="sliders" size={24} color="white" />
          </TouchableOpacity>
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
                  <FontAwesome name="times" size={24} color="black" />
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
                  {['All', '10 min', '1 hour', '1 day'].map((time) => (
                      <ChipButton
                          key={time}
                          title={time}
                          selected={selectedDeliveryTime === time}
                          onPress={() => setSelectedDeliveryTime(time)}
                      />
                  ))}
                </View>

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
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  webMapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
});