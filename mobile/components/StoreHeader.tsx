import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {router, Stack} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {colors} from '@/assets/theme';
import {commonStyles, shadowStyles} from '@/assets/commonStyles';

const HEADER_HEIGHT = 200;

interface StoreHeaderProps {
    storeName: string;
    storeDescription?: string;
    rating?: string;
    ratingCount?: number;
    deliveryFee?: string;
    deliveryTime?: string;
    deliveredBy?: string;
    promoText?: string;
    logoUrl?: string;
    headerColors?: string;
    onInfoPress?: () => void;
    onSharePress?: () => void;
    onChatPress?: () => void;
    onSearchPress?: () => void;
    onLayout?: (event: any) => void;
}

const StoreHeader = ({
                         storeName = 'Yasin Qasab',
                         storeDescription = 'Fresh Meat & Fish, Chicken, Speciality St...',
                         rating = '4.6',
                         ratingCount = 32,
                         deliveryFee = 'Free',
                         deliveryTime = '24 mins',
                         deliveredBy = 'talabat',
                         promoText = 'Free delivery on your first order',
                         logoUrl = 'https://cdn.instashop.ae/60aba30aad3fc4584d8908654f604d16_rounded-superstore-mockup-18.png',
                         onInfoPress,
                         onSharePress,
                         onChatPress,
                         onSearchPress,
                         onLayout
                     }: StoreHeaderProps) => {
    return (
        <>
            <Stack.Screen
                options={{
                    title: storeName,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={commonStyles.headerButton}>
                            <Ionicons name="arrow-back" size={24} color="white"/>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <View style={commonStyles.headerRightContainer}>
                            {onSharePress && (
                                <TouchableOpacity style={commonStyles.headerButton} onPress={onSharePress}>
                                    <Ionicons name="share-outline" size={24} color="white"/>
                                </TouchableOpacity>
                            )}
                            {onChatPress && (
                                <TouchableOpacity style={commonStyles.headerButton} onPress={onChatPress}>
                                    <Ionicons name="chatbubbles-outline" size={24} color="white"/>
                                </TouchableOpacity>
                            )}
                            {onSearchPress && (
                                <TouchableOpacity style={commonStyles.headerButton} onPress={onSearchPress}>
                                    <Ionicons name="search-outline" size={24} color="white"/>
                                </TouchableOpacity>
                            )}
                        </View>
                    ),
                    headerStyle: {
                        backgroundColor: 'transparent',
                    },
                    headerBackground: () => {
                        return <View style={{flex: 1, backgroundColor: colors.primary}}/>;
                    },
                    headerTintColor: '#FFFFFF',
                    headerShadowVisible: false,
                }}
            />
            <View style={styles.header} onLayout={onLayout}>
                <View style={styles.storeInfoCard}>
                    <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
                        <Ionicons name="information-circle-outline" size={24} color="#666"/>
                    </TouchableOpacity>
                    <View style={styles.storeInfoHeader}>
                        <Image
                            source={{uri: logoUrl}}
                            style={styles.logo}
                        />
                        <View style={styles.storeInfoText}>
                            <Text style={styles.storeName}>{storeName}</Text>
                            <Text style={styles.storeDescription}>{storeDescription}</Text>
                            <View style={commonStyles.ratingContainer}>
                                <Ionicons name="star" size={16} color="#FFD700"/>
                                <Text style={commonStyles.ratingText}>{rating} ({ratingCount} Ratings)</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.deliveryInfo}>
                        <View style={styles.deliveryInfoItem}>
                            <Text style={styles.deliveryInfoLabel}>Delivery fee</Text>
                            <Text style={styles.deliveryInfoValue}>{deliveryFee}</Text>
                        </View>
                        <View style={styles.deliveryInfoItem}>
                            <Text style={styles.deliveryInfoLabel}>Delivery time</Text>
                            <Text style={styles.deliveryInfoValue}>{deliveryTime}</Text>
                        </View>
                        <View style={styles.deliveryInfoItem}>
                            <Text style={styles.deliveryInfoLabel}>Delivered by</Text>
                            <Text style={styles.deliveryInfoValue}>{deliveredBy}</Text>
                        </View>
                    </View>
                    <View style={styles.promoContainer}>
                        <Ionicons name="gift-outline" size={16} color={colors.primary}/>
                        <Text style={styles.promoText}>{promoText}</Text>
                    </View>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        height: HEADER_HEIGHT,
        backgroundColor: colors.separator,
        zIndex: 1,
    },
    // Using commonStyles.headerButton, headerRightContainer
    storeInfoCard: {
        margin: 16,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        ...shadowStyles.large,
    },
    infoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
    },
    storeInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    storeInfoText: {
        flex: 1,
        marginLeft: 16,
    },
    storeName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    storeDescription: {
        fontSize: 14,
        color: colors.muted,
    },
    // Using commonStyles.ratingContainer, ratingText
    deliveryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
    },
    deliveryInfoItem: {
        alignItems: 'center',
    },
    deliveryInfoLabel: {
        fontSize: 12,
        color: colors.muted,
    },
    deliveryInfoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
        color: colors.text,
    },
    promoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.separator,
        padding: 8,
        borderRadius: 4,
        marginTop: 16,
    },
    promoText: {
        marginLeft: 8,
        fontSize: 12,
        color: colors.primary,
    },
});

export default StoreHeader;
