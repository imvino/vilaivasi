import React, {useState} from 'react';
import {
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
// Removed expo-linear-gradient; using plain View backgrounds for solid colors
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from "@/assets/theme";
import {commonStyles} from "@/assets/commonStyles";

interface ChatItem {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    avatar: any;
    unreadCount?: number;
    isOnline?: boolean;
    lastSeen?: string;
    messageType?: 'text' | 'image' | 'audio' | 'file';
    isPinned?: boolean;
}

const mockChats: ChatItem[] = [
    {
        id: '1',
        name: 'Super Store Support',
        lastMessage: 'Thanks for your message! 😊 Our team will get back to you shortly.',
        time: '2:15 PM',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 2,
        isOnline: true,
        messageType: 'text',
        isPinned: true,
    },
    {
        id: '2',
        name: 'Electronics Store',
        lastMessage: '📷 Photo',
        time: '1:45 PM',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 0,
        isOnline: false,
        lastSeen: 'last seen 30 minutes ago',
        messageType: 'image',
    },
    {
        id: '3',
        name: 'Fashion Hub',
        lastMessage: 'Check out our latest collection! New arrivals are here 🛍️',
        time: '12:30 PM',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 5,
        isOnline: true,
        messageType: 'text',
    },
    {
        id: '4',
        name: 'Home & Garden',
        lastMessage: '🎵 Voice message',
        time: '11:20 AM',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 0,
        isOnline: false,
        lastSeen: 'last seen 2 hours ago',
        messageType: 'audio',
    },
    {
        id: '5',
        name: 'Sports Equipment',
        lastMessage: '📎 Product_Catalog.pdf',
        time: '10:15 AM',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 1,
        isOnline: true,
        messageType: 'file',
    },
    {
        id: '6',
        name: 'Beauty & Care',
        lastMessage: 'Your order has been shipped! Track your package here.',
        time: 'Yesterday',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 0,
        isOnline: false,
        lastSeen: 'last seen yesterday',
        messageType: 'text',
    },
    {
        id: '7',
        name: 'Books & Media',
        lastMessage: 'New bestsellers available now! Limited time offer.',
        time: 'Yesterday',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 0,
        isOnline: false,
        lastSeen: 'last seen yesterday',
        messageType: 'text',
    },
    {
        id: '8',
        name: 'Grocery Store',
        lastMessage: 'Fresh produce delivered to your doorstep 🥬🍎',
        time: 'Monday',
        avatar: require('../assets/images/avatar7.png'),
        unreadCount: 0,
        isOnline: false,
        lastSeen: 'last seen Monday',
        messageType: 'text',
    },
];

export default function ChatListScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredChats, setFilteredChats] = useState(mockChats);
    const insets = useSafeAreaInsets();

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim() === '') {
            setFilteredChats(mockChats);
        } else {
            const filtered = mockChats.filter(chat =>
                chat.name.toLowerCase().includes(text.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredChats(filtered);
        }
    };

    const navigateToChat = (chatId: string, chatName: string) => {
        router.push('/chat');
    };

    const getMessageIcon = (type?: string) => {
        switch (type) {
            case 'image':
                return <Ionicons name="camera" size={14} color="#6B7280" style={{marginRight: 4}}/>;
            case 'audio':
                return <Ionicons name="mic" size={14} color="#6B7280" style={{marginRight: 4}}/>;
            case 'file':
                return <Ionicons name="document" size={14} color="#6B7280" style={{marginRight: 4}}/>;
            default:
                return null;
        }
    };

    const renderChatItem = ({item}: { item: ChatItem }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigateToChat(item.id, item.name)}
            activeOpacity={0.7}
        >
            <View style={commonStyles.avatarContainer}>
                <Image source={item.avatar} style={styles.avatar}/>
                {item.isPinned && (
                    <View style={styles.pinnedIndicator}>
                        <Ionicons name="pin" size={10} color="#FFFFFF"/>
                    </View>
                )}
                {item.isOnline && <View style={commonStyles.onlineIndicator}/>}
            </View>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.timeContainer}>
                        <Text style={[
                            styles.chatTime,
                            (item.unreadCount ?? 0) > 0 ? commonStyles.unreadTime : null
                        ]}>
                            {item.time}
                        </Text>
                        {(item.unreadCount ?? 0) > 0 && (
                            <View style={commonStyles.unreadBadge}>
                                <Text style={commonStyles.unreadCount}>
                                    {(item.unreadCount ?? 0) > 99 ? '99+' : (item.unreadCount ?? 0)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.messageContainer}>
                    <View style={styles.messageContent}>
                        {getMessageIcon(item.messageType)}
                        <Text
                            style={[
                                styles.lastMessage,
                                (item.unreadCount ?? 0) > 0 ? commonStyles.unreadMessage : null
                            ]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>
                    </View>
                    {(item.unreadCount ?? 0) > 0 && (
                        <Ionicons name="chevron-forward" size={16} color={colors.primary}/>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={Platform.OS === 'android' ? colors.primary : undefined}
            />

            {Platform.OS === 'ios' && (
                <View
                    style={[styles.statusBarOverlay, {height: insets.top, backgroundColor: colors.primary}]}
                    pointerEvents="none"
                />
            )}

            {/* Header */}
            <View style={styles.header}>
                <View
                    style={[styles.headerGradient, {backgroundColor: colors.primary}]}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Chats</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={commonStyles.headerButton}>
                                <Ionicons name="camera-outline" size={24} color="#FFFFFF"/>
                            </TouchableOpacity>
                            <TouchableOpacity style={commonStyles.headerButton}>
                                <Ionicons name="create-outline" size={24} color="#FFFFFF"/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <View style={commonStyles.searchContainer}>
                <View style={commonStyles.searchBar}>
                    <Ionicons name="search" size={20} color="#9CA3AF" style={commonStyles.searchIcon}/>
                    <TextInput
                        style={commonStyles.searchInput}
                        placeholder="Search chats..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF"/>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                data={filteredChats}
                keyExtractor={(item) => item.id}
                renderItem={renderChatItem}
                style={styles.chatList}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator}/>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    header: {
        backgroundColor: '#FFFFFF',
        // borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    headerGradient: {
        paddingTop: 10,
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 15,
    },
    // Using commonStyles.headerButton
    // Using commonStyles.searchContainer, searchBar, searchIcon, searchInput
    chatList: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    // Using commonStyles.avatarContainer
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    pinnedIndicator: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Using commonStyles.onlineIndicator
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    timeContainer: {
        alignItems: 'flex-end',
    },
    chatTime: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    // Using commonStyles.unreadTime
    // Using commonStyles.unreadBadge, unreadCount
    messageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    lastMessage: {
        fontSize: 15,
        color: '#6B7280',
        flex: 1,
    },
    // Using commonStyles.unreadMessage
    separator: {
        height: 1,
        backgroundColor: colors.separator,
        marginLeft: 92,
    },
    statusBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});
