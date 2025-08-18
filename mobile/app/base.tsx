import {
    View,
    Text,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    StatusBar, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from "@expo/vector-icons/Ionicons";
import {colors} from '@/assets/theme'
import Header from "@/components/Header";
import {categories} from "@/constants/category";

const Home: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.safeArea, {paddingTop: insets.top}]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>
            <Header/>

            <ScrollView style={styles.scrollView}>
                {/* Search Bar */}
                <View style={styles.searchBarContainer}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon}/>
                    <TextInput
                        placeholder="Restaurants, groceries, dishes"
                        style={styles.searchInput}
                    />
                </View>


            </ScrollView>
        </SafeAreaView>
    );
};

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
});

export default Home;