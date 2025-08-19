import {StyleSheet, Text, View} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Link} from "expo-router";
import {colors} from "@/assets/theme";
import {shadowStyles} from "@/assets/commonStyles";

export default function Header() {
    return (
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
            <Link href="/manageLoc" style={styles.locationLink}>
                <View style={styles.locationContainer}>
                    <Ionicons name='location' size={20} color={'#FFFFFF'}/>
                    <View style={styles.addressContainer}>
                        <Text style={styles.deliverToText}>Deliver to</Text>
                        <Text style={styles.addressText}>Vgn Stafford Block-M <Ionicons name='chevron-down-outline'
                                                                                        size={12}
                                                                                        color='#FFFFFF'/></Text>
                    </View>
                </View>
            </Link>
            <View style={styles.userIconContainer}>
                <Ionicons name='person-outline' size={16} color='#6B7280'/>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.separator,
    },
    locationLink: {flex: 1},
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressContainer: {
        marginLeft: 8,
    },
    deliverToText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    addressText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    userIconContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadowStyles.small,
    },

})