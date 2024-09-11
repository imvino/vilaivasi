import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    SafeAreaView,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import MapView, { Region } from "react-native-maps";
import {router, Stack} from "expo-router";

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.005;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapLocation: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [address, setAddress] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFetchingAddress, setIsFetchingAddress] = useState<boolean>(false);
    const [isCurrentLocation, setIsCurrentLocation] = useState<boolean>(true);
    const mapRef = useRef<MapView | null>(null);
    const pingAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useEffect(() => {
        if (isCurrentLocation) {
            startPingAnimation();
        } else {
            pingAnimation.setValue(0);
        }
    }, [isCurrentLocation]);

    const startPingAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pingAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pingAnimation, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const getCurrentLocation = async () => {
        setIsLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            };
            setRegion(newRegion);
            setIsCurrentLocation(true);
            await fetchAddress(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            setErrorMsg('Error fetching location');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAddress = async (latitude: number, longitude: number) => {
        setIsFetchingAddress(true);
        try {
            let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (addressResponse.length > 0) {
                const addr = addressResponse[0];
                setAddress(`${addr.name}, ${addr.street}, ${addr.city}, ${addr.region} ${addr.postalCode}, ${addr.country}`);
            }
        } catch (error) {
            console.error('Error fetching address:', error);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
        const isAtCurrentLocation =
            location &&
            Math.abs(newRegion.latitude - location.coords.latitude) < 0.0001 &&
            Math.abs(newRegion.longitude - location.coords.longitude) < 0.0001;

        setIsCurrentLocation(isAtCurrentLocation);
        fetchAddress(newRegion.latitude, newRegion.longitude);
    };

    const resetToUserLocation = () => {
        if (location && mapRef.current) {
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            };
            mapRef.current.animateToRegion(newRegion);
            setIsCurrentLocation(true);
            fetchAddress(location.coords.latitude, location.coords.longitude);
        }
    };

    const [loadingProgress, setLoadingProgress] = useState(0);
    const simulateLoading = () => {
        setLoadingProgress(0);
        const interval = setInterval(() => {
            setLoadingProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prevProgress + 10;
            });
        }, 500);
    };

    useEffect(() => {
        if (isLoading) {
            simulateLoading();
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.mapPlaceholder} />
                <View style={styles.bottomLoadingContainer}>
                    <Ionicons name="location" size={24} color="#FF5722" />
                    <Text style={styles.loadingText}>Please wait...</Text>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
                    </View>
                    <Text style={styles.loadingSubtext}>FETCHING ACCURATE LOCATION...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Stack.Screen
                options={{
                    title: 'Select delivery location',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{
                            padding: 10,
                        }}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    ),
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                        height:10
                    },
                    headerTintColor: '#000000',
                    headerShadowVisible: false,
                }}
            />

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search for a building, street name or area"
                    style={styles.searchInput}
                />
            </View>

            {/* Map Container */}
            <View style={styles.mapContainer}>
                {region && (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={region}
                        onRegionChangeComplete={handleRegionChangeComplete}
                    />
                )}
                <View style={styles.markerFixed}>
                    <Ionicons name="location" size={40} color="#FF5722" />
                    {isCurrentLocation && (
                        <Animated.View style={[
                            styles.markerPing,
                            {
                                transform: [
                                    {
                                        scale: pingAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1.5],
                                        }),
                                    },
                                ],
                                opacity: pingAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 0],
                                }),
                            },
                        ]} />
                    )}
                </View>
            </View>

            {/* Locate Me Button */}
            <TouchableOpacity style={styles.locateButton} onPress={resetToUserLocation}>
                <Ionicons name="locate" size={24} color="#FF5722" />
                <Text style={styles.locateButtonText}>LOCATE ME</Text>
            </TouchableOpacity>

            {/* Bottom Address Bar */}
            <View style={styles.addressBar}>
                <View>
                    {isFetchingAddress ? (
                        <View style={styles.bottomLoadingContainer}>
                            <Ionicons name="location" size={24} color="#FF5722" />
                            <Text style={styles.loadingText}>Please wait...</Text>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
                            </View>
                            <Text style={styles.loadingSubtext}>FETCHING ACCURATE LOCATION...</Text>
                        </View>
                    ): (
                        <>
                            <View style={styles.addressHeader}>
                                <Ionicons name="location" size={24} color="#FF5722" />
                                <Text style={styles.addressTitle}>Anna Nagar</Text>
                                <TouchableOpacity>
                                    <Text style={styles.changeButton}>CHANGE</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.addressDetails}>
                                {address || 'Address not available'}
                            </Text>
                        </>
                    )}
                </View>
                <TouchableOpacity style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>CONFIRM LOCATION</Text>
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
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    bottomLoadingContainer: {
        backgroundColor: 'white',
        padding: 16,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    progressBarContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginVertical: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FF5722',
        borderRadius: 2,
    },
    loadingSubtext: {
        color: '#4B5563',
        fontSize: 12,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingIndicator: {
        marginVertical: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
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
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerFixed: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
        zIndex: 2,
    },
    markerPing: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 87, 34, 0.3)',
        top: '50%',
        left: '50%',
        marginLeft: -25,
        marginTop: -25,
        zIndex: 1,
    },
    locateButton: {
        position: 'absolute',
        bottom: 200,
        right: 16,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        elevation: 3,
    },
    locateButtonText: {
        color: '#FF5722',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    addressBar: {
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    changeButton: {
        color: '#FF5722',
        fontWeight: 'bold',
    },
    addressDetails: {
        color: '#4B5563',
        marginBottom: 16,
    },
    confirmButton: {
        backgroundColor: '#FF5722',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default MapLocation;