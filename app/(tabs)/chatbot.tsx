import { SmartWattIcon } from '@/assets/smartwattlogo';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowUp, Copy, Ellipsis, Mic, Plus, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { Platform, ScrollView, TextInput, View, Pressable, Image } from 'react-native';
import { KeyboardProvider, KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Animated, Easing } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useSmartWatt } from '@/lib/context';

// Typing Animation Component
function TypingText({ text, speed, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
	const [displayedText, setDisplayedText] = useState('');
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		if (currentIndex < text.length) {
			const timeout = setTimeout(() => {
				setDisplayedText(prev => prev + text[currentIndex]);
				setCurrentIndex(prev => prev + 1);
			}, speed);
			return () => clearTimeout(timeout);
		} else if (onComplete) {
			onComplete();
		}
	}, [currentIndex, text, speed, onComplete]);

	return <Text className='text-sm text-white'>{displayedText}</Text>;
}

// Typing Indicator (3 dots animation)
function TypingIndicator() {
	return (
		<View className='flex-row gap-1.5 px-2 py-3'>
			<View className='w-2 h-2 rounded-full bg-white/50 animate-pulse' />
			<View className='w-2 h-2 rounded-full bg-white/50 animate-pulse' style={{ animationDelay: '0.2s' }} />
			<View className='w-2 h-2 rounded-full bg-white/50 animate-pulse' style={{ animationDelay: '0.4s' }} />
		</View>
	);
}

type Message = {
	id: string;
	text: string;
	isUser: boolean;
	isTyping?: boolean;
};

export default function ChatBotTabScreen(){
	const { anomalyLevel } = useSmartWatt();
	const [messages, setMessages] = useState<Message[]>([
		{ id: '1', text: "Hi! I'm Julius Ass. What can I help you with?", isUser: false }
	]);
	const [inputText, setInputText] = useState('');
	const [isAiTyping, setIsAiTyping] = useState(false);
	const scrollViewRef = useRef<ScrollView>(null);

	const anim = useRef(new Animated.Value(0)).current;

	useFocusEffect(
		useCallback(() => {
			anim.setValue(80);

			Animated.timing(anim, {
				toValue: 0,
				duration: 750,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: true,
			}).start();
		}, [])
	);

	// Mock AI responses based on user input
	const getMockResponse = (userMessage: string): string => {
		const lowerMessage = userMessage.toLowerCase();
		
		if (lowerMessage.includes('energy') || lowerMessage.includes('power')) {
			return "Your current energy consumption is 450 kWh this month. That's 12% lower than last month! I can help you analyze your usage patterns and suggest ways to save even more energy. Would you like to see a detailed breakdown?";
		} else if (lowerMessage.includes('cost') || lowerMessage.includes('bill')) {
			return "Based on your current usage, your estimated bill for this month is $67.50. I've noticed you use more energy during peak hours (6PM-9PM). Shifting some usage to off-peak times could save you about $12/month. Want to learn more?";
		} else if (lowerMessage.includes('device') || lowerMessage.includes('appliance')) {
			return "I'm monitoring 8 devices in your home. Your air conditioner and water heater are your biggest energy consumers, accounting for 65% of your total usage. Would you like recommendations on optimizing these devices?";
		} else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
			return "Hello! Great to hear from you! I'm here to help you manage your energy consumption smartly. You can ask me about your energy usage, costs, connected devices, or tips for saving energy. What would you like to know?";
		} else {
			return `I understand you're asking about "${userMessage}". I can help you with energy monitoring, cost analysis, device management, and energy-saving tips. What specific information would you like to know?`;
		}
	};

	const handleSend = () => {
		if (!inputText.trim() || isAiTyping) return;

		const userMessage = inputText.trim();

		// Add user message
		setMessages(prev => [...prev, { 
			id: Date.now().toString(), 
			text: userMessage, 
			isUser: true 
		}]);
		
		setInputText('');
		
		// Show typing indicator
		setIsAiTyping(true);
		
		// Simulate AI thinking time (1-2 seconds)
		setTimeout(() => {
			setIsAiTyping(false);
			const aiResponse = getMockResponse(userMessage);
			
			// Add AI message with typing animation
			setMessages(prev => [...prev, { 
				id: Date.now().toString(), 
				text: aiResponse, 
				isUser: false,
				isTyping: true 
			}]);
		}, 1500);
	};

	const handleTypingComplete = (messageId: string) => {
		setMessages(prev => prev.map(msg => 
			msg.id === messageId ? { ...msg, isTyping: false } : msg
		));
	};

	useEffect(() => {
		// Auto-scroll to bottom when new messages arrive
		setTimeout(() => {
			scrollViewRef.current?.scrollToEnd({ animated: true });
		}, 100);
	}, [messages, isAiTyping]);

	const chadSource = anomalyLevel === 'critical'
		? require('@/assets/images/ChadRed.png')
		: anomalyLevel === 'warning'
			? require('@/assets/images/ChadYellow.png')
			: require('@/assets/images/ChadGreen.png');

	return(
		<KeyboardProvider>
			<View className='flex-1'>
				<KeyboardAvoidingView 
					behavior={'padding'}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
					className='flex-1'
				>
					<View className='flex-1'>
						<ScrollView 
							ref={scrollViewRef}
							className='flex-1'
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps="handled"
							contentContainerStyle={{ paddingTop: 20 }}
						>
							{messages.map((message) => (
								<View key={message.id} className='flex flex-col mb-6 p-4'>
									{message.isUser ? (
										// User message
										<View className='flex flex-row self-end items-start gap-3'>
											<View className='bg-emerald-500/80 px-4 py-3 rounded-2xl max-w-[80%]'>
												<Text className='text-sm text-white'>{message.text}</Text>
											</View>
										</View>
									) : (
										// AI message
										<View className='flex flex-row self-start items-start gap-3'>
											<SmartWattIcon size={28} />
											<View className='flex-col gap-3 flex-1 pr-4'>
												{message.isTyping ? (
													<TypingText 
														text={message.text} 
														speed={5}
														onComplete={() => handleTypingComplete(message.id)}
													/>
												) : (
													<Text className='text-sm text-white'>{message.text}</Text>
												)}
												{!message.isTyping && (
													<View className='flex-row gap-3 mt-1'>
														<Pressable>
															<Icon as={Copy} className='size-4 text-foreground/50' />
														</Pressable>
														<Pressable>
															<Icon as={ThumbsUp} className='size-4 text-foreground/50' />
														</Pressable>
														<Pressable>
															<Icon as={ThumbsDown} className='size-4 text-foreground/50' />
														</Pressable>
														<Pressable>
															<Icon as={Ellipsis} className='size-4 text-foreground/50' />
														</Pressable>
													</View>
												)}
											</View>
										</View>
									)}
								</View>
							))}
							
							{/* Typing indicator */}
							{isAiTyping && (
								<View className='flex flex-row self-start items-center gap-3 mb-4'>
									<SmartWattIcon size={28} />
									<TypingIndicator />
								</View>
							)}
						</ScrollView>
						
						<Animated.View
							style={{
								alignItems: 'center',
								flex: 1,
								opacity: anim.interpolate({
									inputRange: [-40, 0 , 40],
									outputRange: [0, 1, 0],
								}),
								transform: [{ translateY: anim }],
							}}
						>
							<Image source={chadSource} className='self-end top-32'
								style={{
									width: 300,
									height: 300,
									resizeMode: 'contain',
								}}
							/>
						</Animated.View>
					</View>
				</KeyboardAvoidingView>
			</View>
		</KeyboardProvider>
	)
}