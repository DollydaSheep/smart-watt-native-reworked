import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from './ui/text';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import { Icon } from './ui/icon';
import { Animated, Easing } from "react-native";
import { useRef, useEffect } from "react";

type ActionButtonProps = {
	label: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary';
};

function ActionButton({ label, onPress, variant = 'secondary' }: ActionButtonProps) {
	const scale = useRef(new Animated.Value(1)).current;
	const translateY = useRef(new Animated.Value(0)).current;
	const overlayOpacity = useRef(new Animated.Value(0)).current;
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);

	const buttonClassName =
		variant === 'primary'
			? 'py-3.5 bg-green-600 rounded-full items-center justify-center overflow-hidden'
			: 'py-3.5 bg-foreground/20 rounded-full items-center justify-center overflow-hidden';

	const animateButton = (pressed: boolean, hovered: boolean) => {
		const nextScale = pressed ? 0.96 : hovered ? 1.01 : 1;
		const nextTranslateY = pressed ? 2 : hovered ? -1 : 0;
		const nextOverlayOpacity = pressed ? 1 : hovered ? 0.45 : 0;

		Animated.parallel([
			Animated.spring(scale, {
				toValue: nextScale,
				tension: 260,
				friction: pressed ? 22 : 16,
				useNativeDriver: true,
			}),
			Animated.spring(translateY, {
				toValue: nextTranslateY,
				tension: 260,
				friction: pressed ? 24 : 18,
				useNativeDriver: true,
			}),
			Animated.timing(overlayOpacity, {
				toValue: nextOverlayOpacity,
				duration: pressed ? 80 : 160,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
		]).start();
	};

	return (
		<Pressable
			className='flex-1'
			onPress={onPress}
			onHoverIn={() => {
				setIsHovered(true);
				animateButton(isPressed, true);
			}}
			onHoverOut={() => {
				setIsHovered(false);
				animateButton(isPressed, false);
			}}
			onPressIn={() => {
				setIsPressed(true);
				animateButton(true, isHovered);
			}}
			onPressOut={() => {
				setIsPressed(false);
				animateButton(false, isHovered);
			}}
			android_ripple={{ color: variant === 'primary' ? '#ffffff24' : '#ffffff14' }}
		>
			<Animated.View
				style={{
					transform: [{ scale }, { translateY }],
					shadowColor: '#000',
					shadowOpacity: variant === 'primary' ? 0.24 : 0.12,
					shadowOffset: { width: 0, height: 8 },
					shadowRadius: variant === 'primary' ? 18 : 12,
					elevation: variant === 'primary' ? 6 : 3,
				}}
			>
				<View className={buttonClassName}>
					<Animated.View
						pointerEvents='none'
						style={[
							StyleSheet.absoluteFillObject,
							{
								backgroundColor: '#ffffff',
								opacity: overlayOpacity.interpolate({
									inputRange: [0, 1],
									outputRange: [0, variant === 'primary' ? 0.16 : 0.1],
								}),
							},
						]}
					/>
					<Text className='text-sm'>{label}</Text>
				</View>
			</Animated.View>
		</Pressable>
	);
}

export default function LoginScreen({ onSwitch }: { onSwitch: () => void }) {

	const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const anim = useRef(new Animated.Value(0)).current;

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Error", "Please enter both email and password.");
			return;
		}

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password: password.trim(),
			});

			if (error) throw error;

			Alert.alert("Success", `Welcome back, ${data.user?.email}`);
		} catch (error: any) {
			console.error("Login error:", error);
			Alert.alert("Login Failed", error.message);
		}
	};

	useEffect(() => {
		anim.setValue(-40); // start slightly right

		Animated.timing(anim, {
			toValue: 0,
			duration: 300,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, []);

	return (
		<Animated.View
			style={{
				alignItems: 'center',
				flex: 1,
				opacity: anim.interpolate({
					inputRange: [-40, 0 , 40],
					outputRange: [0, 1, 0],
				}),
				transform: [{ translateX: anim }],
			}}
		>
			<View className='flex-1 items-center justify-center'>
				<KeyboardAvoidingView
					behavior={'padding'}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
					className='flex-1 w-full'
				>
				<View className='flex-1 items-center justify-center px-10'>
					<Image source={require('assets/images/smartwattlogo-login.png')}
						style={{
							height: 200,
							width: 200,
							resizeMode: 'contain',
						}}
					/>
					<View className='flex-col gap-8 w-full pt-8'>
						<View className='px-3 flex-row items-center bg-foreground/20 rounded-md'>
							<Image source={require('assets/images/username-icon.png')}
								style={{
									height: 20,
									width: 20,
								}}
							/>
							<TextInput className='py-2.5 px-2 w-full text-white text-sm'
								placeholder='Email'
								placeholderTextColor={'#ffffff60'}
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
							/>
						</View>
						<View className='px-3 flex-row items-center bg-foreground/20 rounded-md'
							style={{ position: 'relative' }}
						>
							<Image source={require('assets/images/password-icon.png')}
								style={{
									height: 20,
									width: 20,
								}}
							/>
							<TextInput className='py-2.5 px-2 pr-10 w-full text-white text-sm'
								placeholder='Password'
								placeholderTextColor={'#ffffff60'}
								secureTextEntry={!showPassword}
								value={password}
								onChangeText={setPassword}
							/>
							<Pressable
								onPress={() => setShowPassword((current) => !current)}
								hitSlop={10}
								style={{
									position: 'absolute',
									right: 12,
									top: 0,
									bottom: 0,
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								<Icon
									as={showPassword ? EyeOff : Eye}
									size={18}
									color="#ffffff90"
								/>
							</Pressable>
						</View>
						<View className='flex-row gap-8'>
							<ActionButton label='SIGN UP' onPress={onSwitch} />
							<ActionButton label='LOG IN' onPress={handleLogin} variant='primary' />
						</View>
					</View>
				</View>
				
				</KeyboardAvoidingView>
			</View>
		</Animated.View>
	)
}
