import {StyleSheet, Text, View} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {colors} from "@/assets/theme";

export default function Header() {
    return <View style={styles.header}>
        <View style={styles.locationContainer}>
            <Ionicons name='location' size={20} color={colors.primary}/>
            <View style={styles.addressContainer}>
                <Text style={styles.deliverToText}>Deliver to</Text>
                <Text style={styles.addressText}>Vgn Stafford Block-M <Ionicons name='chevron-down-outline' size={12}
                                                                                color='#6B7280'/></Text>
            </View>
        </View>
        <View style={styles.userIconContainer}>
            <Ionicons name='person-outline' size={16} color='#6B7280'/>
        </View>
    </View>;
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: 'white',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressContainer: {
        marginLeft: 8,
    },
    deliverToText: {
        fontSize: 12,
        color: '#6B7280',
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    userIconContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },

})