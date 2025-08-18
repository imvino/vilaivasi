import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface AnimatedMarkerProps {
    size?: number;
    color?: string;
    isAnimating?: boolean;
}

const AnimatedMarker: React.FC<AnimatedMarkerProps> = ({
                                                           size = 40,
                                                           color = "#FF5722",
                                                           isAnimating = true
                                                       }) => {
    const pingAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isAnimating) {
            startPingAnimation();
        } else {
            pingAnimation.setValue(0);
        }
    }, [isAnimating]);

    const startPingAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pingAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pingAnimation, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    return (
        <View style={styles.markerContainer}>
            <Ionicons name="location" size={size} color={color} />
            {isAnimating && (
                <Animated.View
                    style={[
                        styles.markerPing,
                        {
                            width: size * 1.25,
                            height: size * 1.25,
                            borderRadius: (size * 1.25) / 2,
                            backgroundColor: `${color}4D`,
                            transform: [
                                {
                                    scale: pingAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1.5],
                                    }),
                                },
                            ],
                            opacity: pingAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 0],
                            }),
                        },
                    ]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerPing: {
        position: 'absolute',
    },
});

export default AnimatedMarker;