import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import {router, Stack} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import {LinearGradient} from 'expo-linear-gradient';
import AudioBubble from '../components/AudioBubble';

// Helper function to get MIME type
const getMimeType = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'doc':
            return 'application/msword';
        case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'txt':
            return 'text/plain';
        case 'rtf':
            return 'application/rtf';
        case 'xls':
            return 'application/vnd.ms-excel';
        case 'xlsx':
            return 'application/vnd.openxmlformats-spreadsheetml.sheet';
        case 'ppt':
            return 'application/vnd.ms-powerpoint';
        case 'pptx':
            return 'application/vnd.openxmlformats-presentationml.presentation';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'mp3':
            return 'audio/mpeg';
        case 'mp4':
            return 'video/mp4';
        case 'zip':
            return 'application/zip';
        default:
            return 'application/octet-stream';
    }
};

// Helper function for iOS UTI
const getUTI = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
        case 'pdf':
            return 'com.adobe.pdf';
        case 'doc':
            return 'com.microsoft.word.doc';
        case 'docx':
            return 'org.openxmlformats.wordprocessingml.document';
        case 'txt':
            return 'public.plain-text';
        case 'rtf':
            return 'public.rtf';
        case 'jpg':
        case 'jpeg':
            return 'public.jpeg';
        case 'png':
            return 'public.png';
        default:
            return 'public.data';
    }
};

// Updated openFile function using expo-sharing
const openFile = async (fileUri: string, fileName: string) => {
    try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('Not Supported', 'File sharing is not available on this device');
            return;
        }
        await Sharing.shareAsync(fileUri, {
            mimeType: getMimeType(fileName),
            dialogTitle: 'Open with...',
            UTI: getUTI(fileName),
        });
    } catch (error) {
        console.error('Error opening file:', error);
        // Fallback: try basic sharing without options
        try {
            await Sharing.shareAsync(fileUri);
        } catch (fallbackError) {
            console.error('Fallback sharing failed:', fallbackError);
            Alert.alert('Error', 'Unable to open this file. Please check if you have an app installed that can handle this file type.');
        }
    }
};

// Function to handle the file opening from your message press
const handleFilePress = async (message: any) => {
    if (message.type !== 'file') return;
    try {
        await openFile(message.fileUri, message.fileName);
    } catch (error) {
        const extension = message.fileName.toLowerCase().split('.').pop();
        const suggestions: any = {
            'pdf': 'Try installing Adobe Acrobat Reader or another PDF viewer',
            'doc': 'Try installing Microsoft Word or Google Docs',
            'docx': 'Try installing Microsoft Word or Google Docs',
            'txt': 'Try installing a text editor app',
            'xlsx': 'Try installing Microsoft Excel or Google Sheets',
        };
        const suggestion = suggestions[extension] || 'Make sure you have an app that can open this file type';
        Alert.alert(
            'Cannot Open File',
            `Unable to open this ${extension?.toUpperCase()} file.\n\n${suggestion}`,
            [{text: 'OK'}]
        );
    }
};

interface MessageBase {
    id: string;
    sender: 'me' | 'them';
    time: string;
    type: 'text' | 'image' | 'audio' | 'file';
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    replyTo?: string;
}

type Message =
    | (MessageBase & { type: 'text'; text: string })
    | (MessageBase & { type: 'image'; imageUri: string })
    | (MessageBase & { type: 'audio'; audioUri: string })
    | (MessageBase & {
    type: 'file';
    fileUri: string;
    fileName: string;
    mimeType?: string | null;
    size?: number | null
});

// Media sizing constants
const MEDIA_WIDTH = Math.min(Dimensions.get('window').width * 0.65, 320);

const initialMessages: Message[] = [
    {
        id: '1',
        type: 'text',
        text: 'Hi! Welcome to our store! 👋\n\nWe\'re here to help you find the best deals and products.',
        sender: 'them',
        time: '1:06 PM',
        status: 'read'
    },
    {
        id: '2',
        type: 'text',
        text: 'How can we assist you today? Feel free to ask about our products, deals, or any questions you might have! 😊',
        sender: 'them',
        time: '1:07 PM',
        status: 'read'
    },
    {id: '3', type: 'text', text: "I want to know today's deals.", sender: 'me', time: '1:09 PM', status: 'read'},
];

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const listRef = useRef<FlatList>(null);
    // Recorder (expo-audio)
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder);

    // Improved recording state
    const [isRecordingStarted, setIsRecordingStarted] = useState(false);
    const [recordingTimer, setRecordingTimer] = useState(0);
    const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
    const [isRecordingPaused, setIsRecordingPaused] = useState(false);
    const [recordingOverlayVisible, setRecordingOverlayVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    // const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageGallery, setImageGallery] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [lastSeen, setLastSeen] = useState('last seen today at 2:15 PM');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const typingAnimation = useRef(new Animated.Value(0)).current;
    const recordingAnimation = useRef(new Animated.Value(0)).current;
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const highlightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (recorderState.isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(recordingAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(recordingAnimation, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            recordingAnimation.setValue(0);
        }
    }, [recorderState.isRecording]);

    // Cleanup effect for recording state
    useEffect(() => {
        return () => {
            if (recordingInterval) {
                clearInterval(recordingInterval);
            }
            if (isRecordingStarted || recorderState.isRecording) {
                resetRecordingState();
            }
        };
    }, []);

    useEffect(() => {
        if (isTyping) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(typingAnimation, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(typingAnimation, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            typingAnimation.setValue(0);
        }
    }, [isTyping]);

    const highlightMessage = (id: string) => {
        setHighlightedId(id);
        highlightAnim.setValue(0);
        Animated.sequence([
            Animated.timing(highlightAnim, {toValue: 1, duration: 180, useNativeDriver: true}),
            Animated.timing(highlightAnim, {toValue: 0, duration: 600, useNativeDriver: true}),
        ]).start(({finished}) => {
            if (finished) {
                // Clear highlight after animation
                setHighlightedId(null);
            }
        });
    };

    const scrollToMessage = (id: string) => {
        if (!listRef.current) return;
        // FlatList is inverted, so index 0 is the latest message
        const index = messages.findIndex(m => m.id === id);
        if (index !== -1) {
            listRef.current.scrollToIndex({index, animated: true});
            // Trigger a brief highlight after scroll settles
            setTimeout(() => highlightMessage(id), 250);
        }
    };

    const send = () => {
        const trimmed = input.trim();
        if (!trimmed) return;
        const msg: Message = {
            id: Date.now().toString(),
            type: 'text',
            text: trimmed,
            sender: 'me',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
            status: 'sending',
            replyTo: replyingTo?.id,
        };
        setMessages((prev) => [msg, ...prev]);
        setInput('');
        setReplyingTo(null);
        setTimeout(() => {
            if (listRef.current) {
                listRef.current.scrollToOffset({offset: 0, animated: true});
            }
        }, 100);

        // Simulate message status updates
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'sent'} : m));
        }, 500);
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'delivered'} : m));
        }, 1000);
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'read'} : m));
        }, 2000);

        // Show typing indicator
        setTimeout(() => {
            setIsTyping(true);
        }, 1500);

        // Auto-reply with enhanced responses
        setTimeout(() => {
            setIsTyping(false);
            const replies = [
                'Thanks for your message! 😊 Our team will get back to you shortly.',
                'We appreciate your interest! Let me check our current offers for you. 🛍️',
                'Great question! I\'ll help you find exactly what you\'re looking for. ✨',
                'Thank you for reaching out! We\'re here to provide the best service. 🌟'
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                type: 'text',
                text: randomReply,
                sender: 'them',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                status: 'read',
            };
            setMessages((prev) => [reply, ...prev]);
        }, 3000);
    };

    const openCamera = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
            Alert.alert('Permission required', 'Camera permission is needed.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: false,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            const msg: Message = {
                id: Date.now().toString(),
                type: 'image',
                imageUri: uri,
                sender: 'me',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                status: 'sending',
            };
            setMessages((prev) => [msg, ...prev]);
            setTimeout(() => {
                if (listRef.current) {
                    listRef.current.scrollToOffset({offset: 0, animated: true});
                }
            }, 100);
            // Simulate status updates for image
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'sent'} : m));
            }, 800);
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'delivered'} : m));
            }, 1500);
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'read'} : m));
            }, 2500);
        }
        setAttachmentModalVisible(false);
    };

    // Pick files (pdf, doc/docx, images, etc.)
    const showAttachmentOptions = () => {
        setAttachmentModalVisible(true);
    };

    const pickFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: false,
            allowsMultipleSelection: true,
            selectionLimit: 5,
        });
        if (!result.canceled && result.assets) {
            result.assets.forEach((asset, index) => {
                const msg: Message = {
                    id: (Date.now() + index).toString(),
                    type: 'image',
                    imageUri: asset.uri,
                    sender: 'me',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                    status: 'sending',
                };
                setMessages((prev) => [msg, ...prev]);
                setTimeout(() => {
                    if (listRef.current) {
                        listRef.current.scrollToOffset({offset: 0, animated: true});
                    }
                }, 100);
                // Status updates
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'sent'
                } : m)), 800 + (index * 100));
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'delivered'
                } : m)), 1500 + (index * 100));
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'read'
                } : m)), 2500 + (index * 100));
            });
        }
        setAttachmentModalVisible(false);
    };

    const pickDocument = async () => {
        try {
            const res: any = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '*/*'],
                copyToCacheDirectory: true,
                multiple: true,
            });
            if ((res && res.type === 'cancel') || (res && res.canceled)) return;

            const docs = res?.assets || [res];
            const limitedDocs = docs.slice(0, 5); // Limit to 5 files

            limitedDocs.forEach((doc: any, index: number) => {
                if (!doc || !doc.uri) return;

                const msg: Message = {
                    id: (Date.now() + index).toString(),
                    type: 'file',
                    fileUri: doc.uri,
                    fileName: doc.name || 'Document',
                    mimeType: doc.mimeType ?? null,
                    size: doc.size ?? null,
                    sender: 'me',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                    status: 'sending',
                };
                setMessages((prev) => [msg, ...prev]);
                setTimeout(() => {
                    if (listRef.current) {
                        listRef.current.scrollToOffset({offset: 0, animated: true});
                    }
                }, 100);
                // Status updates
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'sent'
                } : m)), 1000 + (index * 100));
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'delivered'
                } : m)), 2000 + (index * 100));
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'read'
                } : m)), 3000 + (index * 100));
            });
        } catch (e) {
            console.warn(e);
            Alert.alert('Attachment Error', 'Unable to attach file.');
        }
        setAttachmentModalVisible(false);
    };

    const startRecording = async () => {
        try {
            if (isRecordingStarted || recorderState.isRecording) {
                console.log('Recording already in progress');
                return;
            }
            const status = await AudioModule.requestRecordingPermissionsAsync();
            if (!status.granted) {
                Alert.alert('Permission required', 'Microphone permission is needed to send voice messages.');
                return;
            }
            setIsRecordingStarted(true);
            setRecordingOverlayVisible(true);
            setIsRecordingPaused(false);
            setRecordingTimer(0);
            const interval = setInterval(() => {
                setRecordingTimer(prev => prev + 1);
            }, 1000);
            setRecordingInterval(interval as unknown as NodeJS.Timeout);
            await setAudioModeAsync({playsInSilentMode: true, allowsRecording: true});
            await recorder.prepareToRecordAsync();
            await recorder.record();
        } catch (e) {
            console.warn('Recording start error:', e);
            resetRecordingState();
            Alert.alert('Recording Error', 'Unable to start voice recording.');
        }
    };

    const pauseRecording = async () => {
        try {
            if (recorderState.isRecording && !isRecordingPaused) {
                await recorder.pause();
                setIsRecordingPaused(true);
                if (recordingInterval) {
                    clearInterval(recordingInterval);
                    setRecordingInterval(null);
                }
            }
        } catch (e) {
            console.warn('Recording pause error:', e);
        }
    };

    const resumeRecording = async () => {
        try {
            if (isRecordingPaused) {
                await recorder.record();
                setIsRecordingPaused(false);
                const interval = setInterval(() => {
                    setRecordingTimer(prev => prev + 1);
                }, 1000);
                setRecordingInterval(interval as unknown as NodeJS.Timeout);
            }
        } catch (e) {
            console.warn('Recording resume error:', e);
        }
    };

    const cancelRecording = async () => {
        try {
            if (isRecordingStarted || recorderState.isRecording) {
                await recorder.stop();
                resetRecordingState();
            }
        } catch (e) {
            console.warn('Recording cancel error:', e);
            resetRecordingState();
        }
    };

    const stopRecordingAndSend = async () => {
        try {
            if (!isRecordingStarted && !recorderState.isRecording) {
                return;
            }
            await recorder.stop();
            const uri = recorder.uri;
            resetRecordingState();
            if (uri && recordingTimer >= 1) {
                const msg: Message = {
                    id: Date.now().toString(),
                    type: 'audio',
                    audioUri: uri,
                    sender: 'me',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}),
                    status: 'sending',
                };
                setMessages((prev) => [msg, ...prev]);
                setTimeout(() => {
                    if (listRef.current) {
                        listRef.current.scrollToOffset({offset: 0, animated: true});
                    }
                }, 100);
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'sent'} : m)), 600);
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'delivered'
                } : m)), 1200);
                setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? {
                    ...m,
                    status: 'read'
                } : m)), 2000);
            } else {
                console.log('Recording too short, not sending');
            }
        } catch (e) {
            console.warn('Recording stop error:', e);
            resetRecordingState();
            Alert.alert('Recording Error', 'Failed to save voice message.');
        }
    };

    const openActionSheet = (msg: Message) => {
        setSelectedMsg(msg);
        setActionSheetVisible(true);
    };

    const onLongPress = (msg: Message) => {
        if (multiSelectMode) return;
        openActionSheet(msg);
    };

    const replyToMessage = (msg: Message) => {
        setReplyingTo(msg);
        closeActionSheet();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const closeActionSheet = () => {
        setActionSheetVisible(false);
    };

    const shareSelected = async () => {
        if (!selectedMsg) return;
        try {
            if (selectedMsg.type === 'text') {
                await Share.share({message: selectedMsg.text});
            } else if (selectedMsg.type === 'image') {
                await Share.share({message: selectedMsg.imageUri, url: selectedMsg.imageUri as any});
            } else if (selectedMsg.type === 'audio') {
                await Share.share({message: selectedMsg.audioUri, url: selectedMsg.audioUri as any});
            } else if (selectedMsg.type === 'file') {
                await Share.share({message: selectedMsg.fileUri, url: selectedMsg.fileUri as any});
            }
        } catch (e) {
            console.warn(e);
        } finally {
            closeActionSheet();
        }
    };

    const viewImageSelected = () => {
        if (!selectedMsg || selectedMsg.type !== 'image') return;
        // setSelectedImage(selectedMsg.imageUri);
        setModalVisible(true);
        closeActionSheet();
    };

    const openFileSelected = async () => {
        if (!selectedMsg || selectedMsg.type !== 'file') return;
        try {
            await openFile(selectedMsg.fileUri, selectedMsg.fileName);
        } catch (error) {
            Alert.alert('Error', 'Unable to open this file.');
        }
        closeActionSheet();
    };

    const copyTextSelected = async () => {
        if (!selectedMsg || selectedMsg.type !== 'text') return;
        await Clipboard.setStringAsync(selectedMsg.text);
        Alert.alert('Copied', 'Text copied to clipboard');
        closeActionSheet();
    };

    const toggleMultiSelect = () => {
        setMultiSelectMode(!multiSelectMode);
        setSelectedMessages(new Set());
    };

    const toggleMessageSelection = (id: string) => {
        const newSelected = new Set(selectedMessages);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedMessages(newSelected);
    };

    const deleteSelectedMessages = () => {
        Alert.alert(
            'Delete Messages',
            `Are you sure you want to delete ${selectedMessages.size} selected message${selectedMessages.size > 1 ? 's' : ''}?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
                        setSelectedMessages(new Set());
                        setMultiSelectMode(false);
                        Alert.alert('Messages deleted');
                    },
                },
            ]
        );
    };

    const startMultiSelectFromAction = () => {
        setMultiSelectMode(true);
        if (selectedMsg) {
            setSelectedMessages(new Set([selectedMsg.id]));
        }
        setActionSheetVisible(false);
        setSelectedMsg(null);
    };

    // Legacy expo-av playback code removed; playback is handled inside AudioBubble

    const renderMessageStatus = (status?: string) => {
        if (!status) return null;
        const iconName = {
            sending: 'time-outline',
            sent: 'checkmark-outline',
            delivered: 'checkmark-done-outline',
            read: 'checkmark-done-outline'
        }[status];
        const iconColor = status === 'read' ? '#4FC3F7' : '#9CA3AF';
        return (
            <Ionicons
                name={iconName as any}
                size={12}
                color={iconColor}
                style={{marginLeft: 4}}
            />
        );
    };

    const renderReplyPreview = (replyToId?: string) => {
        if (!replyToId) return null;
        const replyMsg = messages.find(m => m.id === replyToId);
        if (!replyMsg) return null;

        return (
            <TouchableOpacity
                style={styles.replyPreview}
                onPress={() => scrollToMessage(replyToId)}
            >
                <View style={styles.replyLine}/>
                <View style={styles.replyContent}>
                    <Text style={styles.replyAuthor}>{replyMsg.sender === 'me' ? 'You' : 'Super Store'}</Text>
                    <Text style={styles.replyText} numberOfLines={1}>
                        {replyMsg.type === 'text' ? replyMsg.text :
                            replyMsg.type === 'image' ? '📷 Photo' :
                                replyMsg.type === 'audio' ? '🎵 Voice message' : '📎 Document'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({item}: { item: Message }) => {
        return (
            <Pressable
                style={[
                    styles.bubbleRow,
                    item.sender === 'me' ? styles.right : styles.left,
                ]}
                onPress={() => {
                    if (multiSelectMode) {
                        toggleMessageSelection(item.id);
                    }
                }}
                onLongPress={() => onLongPress(item)}
                delayLongPress={250}
            >
                {multiSelectMode && (
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => toggleMessageSelection(item.id)}
                    >
                        <Ionicons
                            name={selectedMessages.has(item.id) ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={selectedMessages.has(item.id) ? '#4CAF50' : '#6B7280'}
                        />
                    </TouchableOpacity>
                )}
                {item.sender === 'them' && !multiSelectMode && (
                    <Image
                        source={require('../assets/images/avatar7.png')}
                        style={styles.avatarSmall}
                    />
                )}
                <Pressable
                    onLongPress={() => onLongPress(item)}
                    onPress={() => {
                        // When in multi-select mode, tapping the bubble toggles selection
                        if (multiSelectMode) {
                            toggleMessageSelection(item.id);
                            return;
                        }
                        if (item.type === 'image') {
                            const allImages = messages
                                .filter(msg => msg.type === 'image')
                                .map(msg => (msg as any).imageUri);
                            const currentIndex = allImages.indexOf(item.imageUri);
                            setImageGallery(allImages);
                            setCurrentImageIndex(currentIndex);
                            setModalVisible(true);
                        } else if (item.type === 'file') {
                            handleFilePress(item);
                        }
                    }}
                    delayLongPress={250}
                >
                    <View style={styles.bubbleContainer}>
                        <LinearGradient
                            colors={item.sender === 'me' ? ['#DCF8C6', '#D1F2EB'] : ['#FFFFFF', '#F8F9FA']}
                            style={[
                                styles.bubble,
                                item.type === 'image' ? styles.bubbleMedia : null,
                                item.sender === 'me' ? styles.bubbleMe : styles.bubbleThem,
                            ]}
                        >
                            <>
                                {renderReplyPreview(item.replyTo)}
                                {item.type === 'text' && (
                                    <Text style={styles.bubbleText}>{(item as any).text}</Text>
                                )}
                                {item.type === 'image' && (
                                    <Image source={{uri: (item as any).imageUri}} style={styles.image}/>
                                )}
                                {item.type === 'audio' && (
                                    <AudioBubble audioUri={item.audioUri}/>
                                )}
                                {item.type === 'file' && (
                                    <View style={styles.fileRow}>
                                        <View style={styles.fileIcon}>
                                            <MaterialIcons name="insert-drive-file" size={24} color="#4CAF50"/>
                                        </View>
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.fileName}
                                                  numberOfLines={1}>{(item as any).fileName}</Text>
                                            <Text style={styles.fileSize}>
                                                {(item as any).size ? `${((item as any).size / 1024).toFixed(1)} KB` : 'Document'}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                <View style={styles.messageFooter}>
                                    <Text style={styles.timeText}>{item.time}</Text>
                                    {item.sender === 'me' && renderMessageStatus(item.status)}
                                </View>
                                {item.id === highlightedId && (
                                    <Animated.View
                                        pointerEvents="none"
                                        style={[
                                            styles.highlightOverlay,
                                            {opacity: highlightAnim},
                                        ]}
                                    />
                                )}
                            </>
                        </LinearGradient>
                    </View>
                </Pressable>
            </Pressable>
        );
    };

    const renderTypingIndicator = () => {
        if (!isTyping) return null;
        return (
            <View style={[styles.bubbleRow, styles.left]}>
                <Image
                    source={require('../assets/images/avatar7.png')}
                    style={styles.avatarSmall}
                />
                <View style={styles.typingBubble}>
                    <Animated.View style={[styles.typingDot, {opacity: typingAnimation}]}/>
                    <Animated.View style={[styles.typingDot, {opacity: typingAnimation}]}/>
                    <Animated.View style={[styles.typingDot, {opacity: typingAnimation}]}/>
                </View>
            </View>
        );
    };

    const resetRecordingState = async () => {
        setIsRecordingStarted(false);
        setRecordingOverlayVisible(false);
        setIsRecordingPaused(false);
        setRecordingTimer(0);
        if (recordingInterval) {
            clearInterval(recordingInterval);
            setRecordingInterval(null);
        }
        try {
            await setAudioModeAsync({allowsRecording: false, playsInSilentMode: true});
        } catch (e) {
            console.warn('Error resetting audio mode:', e);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#4CAF50"/>
            <Stack.Screen
                options={{
                    headerTitle: () => (
                        (
                            <TouchableOpacity style={styles.headerTitle}>
                                <Image
                                    source={require('../assets/images/avatar7.png')}
                                    style={styles.profileImage}
                                />
                                <View style={styles.headerInfo}>
                                    <Text style={styles.headerTitleText}>Super Store</Text>
                                    <View style={styles.statusContainer}>
                                        {isOnline && <View style={styles.onlineIndicator}/>}
                                        <Text style={styles.statusText}>
                                            {isOnline ? 'online' : lastSeen}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    ),
                    headerStyle: {
                        backgroundColor: '#4CAF50',
                        ...(Platform.OS === 'android' && {elevation: 4}),
                        ...(Platform.OS === 'ios' && {
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            shadowOffset: {width: 0, height: 2},
                        }),
                    },
                    headerTintColor: '#FFFFFF',
                    headerLeft: () => (
                        <TouchableOpacity
                            style={styles.headerBtn}
                            onPress={multiSelectMode ? toggleMultiSelect : () => router.back()}
                        >
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF"/>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        multiSelectMode ? null : (
                            <View style={{flexDirection: 'row'}}>
                                <TouchableOpacity style={styles.headerBtn}>
                                    <Ionicons name="videocam-outline" size={22} color="#FFFFFF"/>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.headerBtn}>
                                    <Ionicons name="call-outline" size={22} color="#FFFFFF"/>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.headerBtn}>
                                    <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF"/>
                                </TouchableOpacity>
                            </View>
                        )
                    ),
                }}
            />

            <View style={styles.backgroundImage}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
                >
                    <FlatList
                        ref={listRef}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                        data={isTyping ? [{
                            id: 'typing',
                            type: 'typing' as any,
                            sender: 'them' as any,
                            time: '',
                            text: ''
                        }, ...messages] : messages}
                        renderItem={({item}) => {
                            if (item.id === 'typing') {
                                return renderTypingIndicator();
                            }
                            return renderItem({item});
                        }}
                        keyExtractor={(item) => item.id}
                        inverted
                        showsVerticalScrollIndicator={false}
                    />

                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalContainer}>
                            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={32} color="#fff"/>
                            </TouchableOpacity>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                contentOffset={{x: currentImageIndex * Dimensions.get('window').width, y: 0}}
                                onMomentumScrollEnd={(event) => {
                                    const newIndex = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                                    setCurrentImageIndex(newIndex);
                                }}
                            >
                                {imageGallery.map((imageUri, index) => (
                                    <View key={index} style={styles.imageSlide}>
                                        <ScrollView
                                            maximumZoomScale={3}
                                            minimumZoomScale={1}
                                            showsHorizontalScrollIndicator={false}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={styles.zoomContainer}
                                        >
                                            <Image
                                                source={{uri: imageUri}}
                                                style={styles.modalImage}
                                                resizeMode="contain"
                                            />
                                        </ScrollView>
                                    </View>
                                ))}
                            </ScrollView>
                            {imageGallery.length > 1 && (
                                <View style={styles.imageCounter}>
                                    <Text style={styles.imageCounterText}>
                                        {currentImageIndex + 1} of {imageGallery.length}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Modal>

                    {recordingOverlayVisible && (
                        <Modal
                            animationType="fade"
                            transparent={true}
                            visible={recordingOverlayVisible}
                            onRequestClose={cancelRecording}
                        >
                            <View style={styles.recordingModalOverlay}>
                                <View style={styles.recordingModalContainer}>
                                    <View style={styles.recordingHeader}>
                                        <View style={styles.recordingInfo}>
                                            <Animated.View style={{
                                                transform: [{
                                                    scale: recordingAnimation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [1, 1.3]
                                                    })
                                                }]
                                            }}>
                                                <Ionicons
                                                    name={isRecordingPaused ? "pause-circle" : "mic"}
                                                    size={24}
                                                    color={isRecordingPaused ? "#FF9500" : "#EF4444"}
                                                />
                                            </Animated.View>
                                            <Text style={styles.recordingText}>
                                                {Math.floor(recordingTimer / 60)}:{(recordingTimer % 60).toString().padStart(2, '0')}
                                            </Text>
                                        </View>
                                        <Text style={styles.recordingStatus}>
                                            {isRecordingPaused ? 'Recording Paused' : 'Recording...'}
                                        </Text>
                                    </View>

                                    <View style={styles.recordingControls}>
                                        <TouchableOpacity
                                            style={styles.recordingControlBtn}
                                            onPress={cancelRecording}
                                        >
                                            <Ionicons name="trash" size={24} color="#EF4444"/>
                                            <Text
                                                style={[styles.recordingControlText, {color: '#EF4444'}]}>Delete</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.recordingControlBtn, styles.recordingControlBtnPrimary]}
                                            onPress={isRecordingPaused ? resumeRecording : pauseRecording}
                                        >
                                            <Ionicons
                                                name={isRecordingPaused ? "play" : "pause"}
                                                size={24}
                                                color="#FFFFFF"
                                            />
                                            <Text style={[styles.recordingControlText, {color: '#FFFFFF'}]}>
                                                {isRecordingPaused ? 'Resume' : 'Pause'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.recordingControlBtn}
                                            onPress={stopRecordingAndSend}
                                        >
                                            <Ionicons name="send" size={24} color="#4CAF50"/>
                                            <Text style={[styles.recordingControlText, {color: '#4CAF50'}]}>Send</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}

                    {replyingTo && (
                        <View style={styles.replyBar}>
                            <View style={styles.replyBarContent}>
                                <Ionicons name="arrow-undo" size={16} color="#4CAF50"/>
                                <View style={styles.replyBarText}>
                                    <Text style={styles.replyBarTitle}>Replying
                                        to {replyingTo.sender === 'me' ? 'yourself' : 'Super Store'}</Text>
                                    <Text style={styles.replyBarMessage} numberOfLines={1}>
                                        {replyingTo.type === 'text' ? replyingTo.text :
                                            replyingTo.type === 'image' ? '📷 Photo' :
                                                replyingTo.type === 'audio' ? '🎵 Voice message' : '📎 Document'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={cancelReply} style={styles.replyBarClose}>
                                <Ionicons name="close" size={20} color="#6B7280"/>
                            </TouchableOpacity>
                        </View>
                    )}

                    {multiSelectMode && (
                        <View style={styles.multiSelectFooter}>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={deleteSelectedMessages}
                                disabled={selectedMessages.size === 0}
                            >
                                <Ionicons name="trash" size={20} color="#FFFFFF"/>
                                <Text style={styles.deleteButtonText}>{selectedMessages.size}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!multiSelectMode && (
                        <View style={styles.inputBar}>
                            <TouchableOpacity style={styles.iconBtn} onPress={showAttachmentOptions}>
                                <Ionicons name="add" size={24} color="#128C7E"/>
                            </TouchableOpacity>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={input}
                                    onChangeText={setInput}
                                    placeholder="Type a message"
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    maxLength={1000}
                                    autoCorrect={false}
                                />
                            </View>
                            {input.trim() ? (
                                <TouchableOpacity style={styles.sendBtn} onPress={send}>
                                    <Ionicons name="send" size={18} color="#fff"/>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.voiceBtn, recorderState.isRecording && styles.voiceBtnRecording]}
                                    onPress={startRecording}
                                >
                                    <Animated.View style={{
                                        transform: [{
                                            scale: recordingAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 1.2]
                                            })
                                        }]
                                    }}>
                                        <Ionicons name="mic" size={20} color="#fff"/>
                                    </Animated.View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Action Sheet Modal */}
                    <Modal
                        animationType="fade"
                        transparent
                        visible={actionSheetVisible}
                        onRequestClose={closeActionSheet}
                    >
                        <View style={styles.sheetOverlay}>
                            <Pressable style={styles.sheetBackdrop} onPress={closeActionSheet}/>
                            <View style={styles.sheetContainer}>
                                {!!selectedMsg && (
                                    <TouchableOpacity style={styles.sheetBtn}
                                                      onPress={() => replyToMessage(selectedMsg)}>
                                        <Text style={styles.sheetBtnText}>Reply</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedMsg?.type === 'text' && (
                                    <TouchableOpacity style={styles.sheetBtn} onPress={copyTextSelected}>
                                        <Text style={styles.sheetBtnText}>Copy</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedMsg?.type === 'image' && (
                                    <TouchableOpacity style={styles.sheetBtn} onPress={viewImageSelected}>
                                        <Text style={styles.sheetBtnText}>View Image</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedMsg?.type === 'file' && (
                                    <TouchableOpacity style={styles.sheetBtn} onPress={openFileSelected}>
                                        <Text style={styles.sheetBtnText}>Open</Text>
                                    </TouchableOpacity>
                                )}
                                {/* Share for all types */}
                                {!!selectedMsg && (
                                    <TouchableOpacity style={styles.sheetBtn} onPress={shareSelected}>
                                        <Text style={styles.sheetBtnText}>Share</Text>
                                    </TouchableOpacity>
                                )}
                                {/* Delete for all types */}
                                {!!selectedMsg && (
                                    <TouchableOpacity style={[styles.sheetBtn, styles.sheetBtnDestructive]}
                                                      onPress={startMultiSelectFromAction}>
                                        <Text
                                            style={[styles.sheetBtnText, styles.sheetBtnTextDestructive]}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={[styles.sheetBtn]} onPress={closeActionSheet}>
                                    <Text style={styles.sheetBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Attachment Modal */}
                    <Modal
                        animationType="slide"
                        transparent
                        visible={attachmentModalVisible}
                        onRequestClose={() => setAttachmentModalVisible(false)}
                    >
                        <View style={styles.attachmentModalOverlay}>
                            <Pressable style={styles.attachmentModalBackdrop}
                                       onPress={() => setAttachmentModalVisible(false)}/>
                            <View style={styles.attachmentModalContainer}>
                                <Text style={styles.attachmentModalTitle}>Send Attachment</Text>
                                <TouchableOpacity style={styles.attachmentOption} onPress={openCamera}>
                                    <Ionicons name="camera" size={24} color="#4CAF50"/>
                                    <Text style={styles.attachmentOptionText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachmentOption} onPress={pickFromGallery}>
                                    <Ionicons name="images" size={24} color="#4CAF50"/>
                                    <Text style={styles.attachmentOptionText}>Photo Library</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
                                    <Ionicons name="document" size={24} color="#4CAF50"/>
                                    <Text style={styles.attachmentOptionText}>Document</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.attachmentOption, styles.attachmentCancel]}
                                    onPress={() => setAttachmentModalVisible(false)}
                                >
                                    <Text style={styles.attachmentCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#ffff',
    },
    backgroundImage: {
        flex: 1,
        backgroundColor: '#E8F5E8',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 12,
    },
    bubbleRow: {
        marginVertical: 2,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    left: {
        justifyContent: 'flex-start',
        paddingRight: 50,
    },
    right: {
        justifyContent: 'flex-end',
        paddingLeft: 50,
    },
    bubbleContainer: {
        position: 'relative',
    },
    highlightOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: 18,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    bubble: {
        maxWidth: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    bubbleThem: {
        borderBottomLeftRadius: 4,
        marginLeft: 8,
    },
    bubbleMe: {
        borderBottomRightRadius: 4,
        marginRight: 8,
    },
    bubbleText: {
        color: '#111827',
        fontSize: 16,
        lineHeight: 20,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timeText: {
        color: '#6B7280',
        fontSize: 11,
        marginTop: 2,
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 2,
    },
    // Reply styles
    replyPreview: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        flexDirection: 'row',
    },
    replyLine: {
        width: 3,
        backgroundColor: '#4CAF50',
        borderRadius: 2,
        marginRight: 8,
    },
    replyContent: {
        flex: 1,
    },
    replyAuthor: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 2,
    },
    replyText: {
        fontSize: 13,
        color: '#6B7280',
    },
    replyBar: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    replyBarContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyBarText: {
        marginLeft: 8,
        flex: 1,
    },
    replyBarTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
    },
    replyBarMessage: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    replyBarClose: {
        padding: 4,
    },
    // Input area styles
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    },
    multiSelectFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    attachmentModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    attachmentModalBackdrop: {
        flex: 1,
    },
    attachmentModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    attachmentModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#111827',
    },
    attachmentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 4,
        backgroundColor: '#F9FAFB',
    },
    attachmentOptionText: {
        fontSize: 16,
        color: '#111827',
        marginLeft: 16,
    },
    attachmentCancel: {
        backgroundColor: '#FEF2F2',
        marginTop: 12,
        justifyContent: 'center',
    },
    attachmentCancelText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    iconBtn: {
        padding: 8,
        borderRadius: 25,
    },
    sendBtn: {
        backgroundColor: '#4CAF50',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    voiceBtn: {
        backgroundColor: '#4CAF50',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    voiceBtnRecording: {
        backgroundColor: '#EF4444',
    },
    // Header styles
    headerBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerInfo: {
        flex: 1,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    onlineIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8BC34A',
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    // Media styles
    image: {
        width: MEDIA_WIDTH,
        aspectRatio: 4 / 3,
        borderRadius: 12,
    },
    bubbleMedia: {
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    // File styles
    fileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
        paddingVertical: 8,
    },
    fileIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    fileSize: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Typing indicator
    typingBubble: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6B7280',
        marginHorizontal: 2,
    },
    recordingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 8,
    },
    // Background and other styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    zoomContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: Dimensions.get('window').height,
        minWidth: Dimensions.get('window').width,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    imageSlide: {
        width: Dimensions.get('window').width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCounter: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    imageCounterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Action sheet styles
    sheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheetBackdrop: {
        flex: 1,
    },
    sheetContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 0,
        paddingVertical: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sheetBtn: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
    },
    sheetBtnText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '500',
    },
    sheetBtnDestructive: {
        backgroundColor: 'transparent',
    },
    sheetBtnTextDestructive: {
        color: '#EF4444',
    },
    checkbox: {
        marginRight: 12,
        alignSelf: 'center',
    },
    // New recording modal styles
    recordingModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    recordingModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    recordingHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    recordingStatus: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginTop: 8,
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recordingControlBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        minWidth: 80,
    },
    recordingControlBtnPrimary: {
        backgroundColor: '#4CAF50',
    },
    recordingControlText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
});
