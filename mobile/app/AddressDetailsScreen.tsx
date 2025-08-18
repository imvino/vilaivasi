import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedMarker from "@/components/AnimatedMarker";
import {gray} from "colorette";

const AddressDetailsScreen = () => {
    const { address, latitude, longitude } = useLocalSearchParams<{ address: string; latitude: string; longitude: string }>();
    const insets = useSafeAreaInsets();
    const [houseNumber, setHouseNumber] = useState('Kamala flats');
    const [apartmentDetails, setApartmentDetails] = useState('');

    const region = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Stack.Screen
                options={{
                    title: 'Confirm location',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{
                            padding: 10,
                        }}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    ),
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                        height: 10
                    },
                    headerTintColor: '#000000',
                    headerShadowVisible: false,
                }}
            />
            <MapView
                style={styles.map}
                initialRegion={region}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                <Marker coordinate={region}>
                    <AnimatedMarker />
                </Marker>
            </MapView>

            <View style={styles.card}>
                <View style={styles.addressHeader}>
                    <Ionicons name="location" size={24} color="#FF5722" />
                    <Text style={styles.addressTitle}>3-2</Text>
                </View>
                <Text style={styles.addressDetails}>{address}</Text>
            </View>
            <ScrollView contentContainerStyle={[styles.card, styles.scrollContent, { paddingBottom: insets.bottom }]}>
                <Text style={styles.helpText}>A detailed address will help our Delivery Partner reach your doorstep easily</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>HOUSE / FLAT / FLOOR NO.</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Kamala flats"
                        value={houseNumber}
                        onChangeText={setHouseNumber}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>APARTMENT / ROAD / AREA (OPTIONAL)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter details"
                        value={apartmentDetails}
                        onChangeText={setApartmentDetails}
                    />
                </View>

                <View style={styles.saveAsContainer}>
                    <Text style={styles.saveAsLabel}>SAVE AS</Text>
                    <View style={styles.saveAsOptions}>
                        <TouchableOpacity style={styles.saveAsChip}>
                            <Ionicons name="home-outline" size={20} color="#4B5563" />
                            <Text style={styles.saveAsChipText}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveAsChip}>
                            <Ionicons name="briefcase-outline" size={20} color="#4B5563" />
                            <Text style={styles.saveAsChipText}>Work</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveAsChip}>
                            <Ionicons name="people-outline" size={20} color="#4B5563" />
                            <Text style={styles.saveAsChipText}>Friends and Family</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <TouchableOpacity style={[styles.saveButton, { marginBottom: 16 }]}>
                <Text style={styles.saveButtonText}>SAVE ADDRESS DETAILS</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        paddingTop: 0,
        flexGrow: 1,
    },
    map: {
        height: 200,
    },
    card: {
        padding: 16,
        paddingBottom:0
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
    },
    addressDetails: {
        color: '#4B5563',
        marginBottom: 16,
    },
    helpText: {
        color: 'black',
        marginBottom: 16,
        backgroundColor: 'rgba(255,145,34,0.7)',
        padding:10,
        borderRadius:8
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    saveAsContainer: {
        marginBottom: 16,
    },
    saveAsLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    saveAsOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveAsChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    saveAsChipText: {
        color: '#4B5563',
        marginLeft: 4,
        fontSize: 12,
    },
    saveButton: {
        backgroundColor: '#FF5722',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default AddressDetailsScreen;