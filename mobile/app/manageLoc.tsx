import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";

interface AddressItemProps {
    title: string;
    address: string;
    distance: string;
    isSelected?: boolean;
}

interface RecentSearchItemProps {
    title: string;
    address: string;
    distance: string;
}

const AddressSelection = () => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.safeArea]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Stack.Screen
                options={{
                    title: 'Ashok Nagar,Chennai',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
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
                <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon}/>
                <TextInput
                    placeholder="Restaurants, groceries, dishes"
                    style={styles.searchInput}
                />
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.actionButton} onPress={()=>router.push('/MapLocation')}>
                <View style={styles.actionButtonContent}>
                    <Ionicons name="location" size={20} color="#F97316" />
                    <Text style={styles.actionButtonText}>Use my current location</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#F97316" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionButtonContent}>
                    <Ionicons name="add" size={20} color="#F97316" />
                    <Text style={styles.actionButtonText}>Add new address</Text>
                </View>
            </TouchableOpacity>

            <ScrollView style={styles.scrollView}>
                {/* Saved Addresses */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>
                    {renderAddress({title: "Home", address: "123 Main St", distance: "5 km", isSelected: true})}
                    {renderAddress({
                        title:"Hospital",
                        address:"Raadha Rajendran Hospital, Mela Ilandaikulam, Alandur, Chennai, Tamil Nadu 600016, India",
                        distance:"2.8 km"
                    })}
                    {renderAddress({
                        title: "OYO",
                        address: "fab hotel tree service apartment, Parthasarathi Puram, T. Nagar, Chennai, Tamil Nadu 600017, India. (3)",
                        distance: "3.4 km"
                    })}
                    {renderAddress({
                        title: "OYO",
                        address: "fab hotel tree service apartment, Parthasarathi Puram, T. Nagar, Chennai, Tamil Nadu 600017, India. (3)",
                        distance: "3.4 km"
                    })}
                    {renderAddress({
                        title: "OYO",
                        address: "fab hotel tree service apartment, Parthasarathi Puram, T. Nagar, Chennai, Tamil Nadu 600017, India. (3)",
                        distance: "3.4 km"
                    })}
                    {renderAddress({
                        title: "OYO",
                        address: "fab hotel tree service apartment, Parthasarathi Puram, T. Nagar, Chennai, Tamil Nadu 600017, India. (3)",
                        distance: "3.4 km"
                    })}
                    <TouchableOpacity style={styles.viewMoreButton}>
                        <Text style={styles.viewMoreText}>View more</Text>
                        <Text style={styles.viewMoreText}>View more</Text>
                        <Ionicons name="chevron-down" size={16} color="#F97316" />
                    </TouchableOpacity>
                </View>

                {/* Recent Searches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RECENT SEARCHES</Text>
                    {renderRecentSearch({
                        title:"VGN Stafford",
                       address: "Vgn Stafford, Sudarsanam Main Rd, Thirumalai Vasan Nagar, Poompozhi! Nagar, Avadi, Tamil Nadu 600062, India",
                       distance: "14.3 km"
                    })}
                    {renderRecentSearch({
                        title: "Nungambakkam",
                        address: "13, 5th Street, Dr near GG Fertility Hospital, Josier St, Tirumurthy Nagar, Nungambakkam, Chennai, Tamil Nadu 60...",
                        distance: "5.2 km"
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const renderAddress = ({ title, address, distance, isSelected = false }: AddressItemProps): React.ReactElement => (
    <View style={styles.addressItem}>
        <View style={styles.addressContent}>
            <Ionicons
                name={title.toLowerCase() === "home" ? "home" : title.toLowerCase() === "hospital" ? "medical" : "business"}
                size={20}
                color="#6B7280"
                style={styles.addressIcon}
            />
            <View style={styles.addressDetails}>
                <View style={styles.addressHeader}>
                    <Text style={styles.addressTitle}>{title}</Text>
                    <Text style={styles.addressDistance}>• {distance}</Text>
                    {isSelected && <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>CURRENTLY SELECTED</Text></View>}
                </View>
                <Text style={styles.addressText}>{address}</Text>
            </View>
        </View>
        <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    </View>
);

const renderRecentSearch = ({ title, address, distance }: RecentSearchItemProps): React.ReactElement => (
    <View style={styles.recentSearchItem}>
        <Ionicons name="location" size={20} color="#6B7280" style={styles.recentSearchIcon} />
        <View style={styles.recentSearchDetails}>
            <View style={styles.recentSearchHeader}>
                <Text style={styles.recentSearchTitle}>{title}</Text>
                <Text style={styles.recentSearchDistance}>• {distance}</Text>
            </View>
            <Text style={styles.recentSearchText}>{address}</Text>
        </View>
    </View>
);
const styles = StyleSheet.create({
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
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        height: '100%', // Make the input take full height of the container
        padding: 0, // Remove default padding
    },
    searchIcon: {
        marginRight: 8,
    },
    headerButton: {
        padding: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#F97316',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
    },
    addressItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    addressContent: {
        flexDirection: 'row',
        flex: 1,
    },
    addressIcon: {
        marginTop: 4,
        marginRight: 8,
    },
    addressDetails: {
        flex: 1,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    addressTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    addressDistance: {
        fontSize: 16,
        color: '#6B7280',
        marginLeft: 4,
    },
    selectedBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    selectedBadgeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
    },
    addressText: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 4,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    viewMoreText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F97316',
        marginRight: 4,
    },
    recentSearchItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    recentSearchIcon: {
        marginTop: 4,
        marginRight: 8,
    },
    recentSearchDetails: {
        flex: 1,
    },
    recentSearchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recentSearchTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    recentSearchDistance: {
        fontSize: 16,
        color: '#6B7280',
        marginLeft: 4,
    },
    recentSearchText: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 4,
    },
});

export default AddressSelection;