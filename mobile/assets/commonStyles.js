import { StyleSheet } from 'react-native';
import { colors } from './theme';

// Common styles that can be reused across the app
export const commonStyles = StyleSheet.create({
    // Layout styles
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Text styles
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    bodyText: {
        fontSize: 14,
        color: colors.text,
    },
    captionText: {
        fontSize: 12,
        color: colors.muted,
    },

    // Button styles
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },

    // Input styles
    inputContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    input: {
        fontSize: 16,
        color: colors.text,
    },

    // Card styles
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    // Header styles
    header: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Separator
    separator: {
        height: 1,
        backgroundColor: colors.separator,
        marginVertical: 8,
    },

    // Avatar styles
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },

    // Badge styles
    badge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Search bar styles
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.separator,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },

    // Header button styles
    headerButton: {
        padding: 10,
    },
    headerRightContainer: {
        flexDirection: 'row',
    },

    // Avatar container styles
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.accent,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    // List item styles
    listItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    listItemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    listItemContent: {
        flex: 1,
    },
    listItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    listItemTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
        marginRight: 8,
    },
    listItemSubtitle: {
        fontSize: 15,
        color: colors.muted,
        flex: 1,
    },

    // Rating container
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
        marginRight: 8,
        color: colors.text,
    },

    // Category styles
    categoryItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 80,
    },
    categoryImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 4,
        marginTop: 3,
    },
    categoryName: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        height: 32,
        color: colors.text,
    },
    selectedCategoryImage: {
        borderWidth: 2,
        borderColor: colors.primary,
    },

    // Section styles
    sectionContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        color: colors.text,
    },

    // Product/Restaurant card styles
    productCard: {
        width: 250,
        marginRight: 16,
    },
    productImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 4,
    },

    // Footer styles
    footer: {
        padding: 16,
        backgroundColor: '#F3F4F6',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 14,
        color: colors.muted,
    },

    // Checkbox styles for multi-select
    checkbox: {
        marginRight: 12,
    },

    // Unread badge styles
    unreadBadge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    unreadTime: {
        color: colors.primary,
        fontWeight: '500',
    },
    unreadMessage: {
        color: '#374151',
        fontWeight: '500',
    },
});

// Header styles specifically for navigation headers
export const headerStyles = {
    headerStyle: {
        backgroundColor: colors.primary,
        elevation: 0,
        shadowOpacity: 0,
    },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
    },
    headerBackground: {
        flex: 1,
        backgroundColor: colors.primary,
    },
};

// Common shadow styles
export const shadowStyles = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
};
