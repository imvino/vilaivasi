import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons,MaterialCommunityIcons } from '@expo/vector-icons';
import {colors} from '@/assets/theme'
import {Platform} from "react-native";

type IconType = 'Ionicons' | 'MaterialCommunityIcons';

type TabBarIconProps = {
    name: string;
    color: string;
    type: IconType;
};

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, type }) => {
    if (type === 'Ionicons') {
        return <Ionicons size={24} style={{ marginBottom: -3 }} name={name as any} color={color} />;
    } else {
        return <MaterialCommunityIcons size={24} style={{ marginBottom: -3 }} name={name as any} color={color} />;
    }
};
export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary, // Tomato color for active tab
                tabBarInactiveTintColor: "#808080", // Gray color for inactive tabs
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#E0E0E0',
                    // height: Platform.OS === 'android' ? 65 : "auto",
                    // paddingBottom: Platform.OS === 'android' ? 10 :  0,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} type={'Ionicons'} />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'search' : 'search-outline'} color={color} type={'Ionicons'} />
                    ),
                }}
            />
            <Tabs.Screen
                name="deals"
                options={{
                    title: 'Deals',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'label-percent' : 'label-percent-outline'} color={color} type={'MaterialCommunityIcons'} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'cart' : 'cart-outline'} color={color} type={'Ionicons'} />
                    ),
                }}
            />
        </Tabs>
    );
}