import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    StatusBar,
    Text,
    Animated,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from 'expo-router';

const FILTER_HEIGHT = 50;
const SCROLL_THRESHOLD = 20;

const ListScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { title } = useLocalSearchParams();
    const scrollY = useRef(new Animated.Value(0)).current;
    const [filterVisible, setFilterVisible] = useState(true);
    const lastOffsetY = useRef(0);
    const accumulatedScroll = useRef(0);

    const filterOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentOffsetY = event.nativeEvent.contentOffset.y;
        const diff = currentOffsetY - lastOffsetY.current;

        accumulatedScroll.current += diff;

        if (currentOffsetY <= 0) {
            // At the top of the list
            setFilterVisible(true);
            accumulatedScroll.current = 0;
        } else if (Math.abs(accumulatedScroll.current) > SCROLL_THRESHOLD) {
            if (accumulatedScroll.current < 0) {
                // Scrolling up
                setFilterVisible(true);
            } else {
                // Scrolling down
                setFilterVisible(false);
            }
            accumulatedScroll.current = 0;
        }

        lastOffsetY.current = currentOffsetY;
    }, []);

    const animatedOpacity = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.timing(animatedOpacity, {
            toValue: filterVisible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [filterVisible]);

    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <Stack.Screen
                options={{
                    title: title as string || 'Supermarkets',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/search')} style={styles.headerButton}>
                            <Ionicons name="search" size={24} color="black" />
                        </TouchableOpacity>
                    ),
                    headerStyle: {
                        backgroundColor: '#FFFFFF',
                    },
                    headerTintColor: '#000000',
                    headerShadowVisible: false,
                }}
            />

            <Animated.View
                style={[
                    styles.filterContainer,
                    { opacity: animatedOpacity }
                ]}
            >
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Sort</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Filter</Text>
                </TouchableOpacity>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true, listener: handleScroll }
                )}
                scrollEventThrottle={16}
            >
                {/* Add your list items here */}
                {[...Array(50)].map((_, index) => (
                    <View key={index} style={styles.listItem}>
                        <Text>List Item {index + 1}</Text>
                    </View>
                ))}
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    headerButton: {
        padding: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingTop: FILTER_HEIGHT, // Add padding to account for the filter buttons
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    listItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
});

export default ListScreen;