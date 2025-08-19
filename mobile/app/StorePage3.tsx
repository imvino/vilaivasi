import React, {useRef} from 'react';
import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {router} from 'expo-router';
import {useScrollToTop} from '@react-navigation/native';
import {categories} from "@/constants/category";
import {colors} from '@/assets/theme';
import {commonStyles} from '@/assets/commonStyles';
import StoreHeader from '@/components/StoreHeader';

const HEADER_HEIGHT = 200;

const YasinQasab = () => {
    const scrollViewRef = useRef(null);
    useScrollToTop(scrollViewRef);
    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                ref={scrollViewRef}
            >
                <StoreHeader
                    headerColors={colors.primary}
                    onChatPress={() => router.push('/chat')}
                    onSharePress={() => {
                    }}
                    onSearchPress={() => {
                    }}
                    onInfoPress={() => {
                    }}
                    onLayout={(event) => {
                        // const {height} = event.nativeEvent.layout;
                        // setCardHeight(height);
                    }}
                />

                <View style={styles.contentContainer}>
                    <Text style={commonStyles.sectionTitle}>Categories</Text>
                    <View style={styles.categoriesGrid}>
                        {categories.map((category, index) => (
                            <TouchableOpacity key={index} style={commonStyles.categoryItem}>
                                <Image source={{uri: category.i}} style={commonStyles.categoryImage}/>
                                <Text style={commonStyles.categoryName}>{category.n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={commonStyles.footer}>
                    <Text style={commonStyles.footerText}>Add IQD 5000 to start your order</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    // Using commonStyles.sectionTitle
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingTop: HEADER_HEIGHT - 140,
        padding: 16,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    // Using commonStyles.categoryItem, categoryImage, categoryName, footer, footerText
});

export default YasinQasab;