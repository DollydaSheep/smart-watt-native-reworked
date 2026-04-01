import { KeyboardAvoidingView, Platform, View, Image, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { Text } from "./ui/text";
import { useState } from "react";
import { OtpInput } from "react-native-otp-entry";
import { Eye, EyeOff } from "lucide-react-native";
import { Icon } from "./ui/icon";
import { Animated, Easing } from "react-native";
import { useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type ActionButtonProps = {
	label: string;
	onPress: () => void;
	variant?: "primary" | "secondary" | "subtle";
};

function ActionButton({ label, onPress, variant = "secondary" }: ActionButtonProps) {
	const scale = useRef(new Animated.Value(1)).current;
	const translateY = useRef(new Animated.Value(0)).current;
	const overlayOpacity = useRef(new Animated.Value(0)).current;

	const buttonClassName =
		variant === "primary"
			? "py-3.5 bg-green-500 rounded-full items-center overflow-hidden"
			: variant === "subtle"
				? "py-3.5 bg-foreground/5 rounded-full items-center overflow-hidden"
				: "py-3.5 bg-foreground/10 rounded-full items-center overflow-hidden";

	const rippleColor = variant === "primary" ? "#ffffff24" : "#ffffff14";
	const highlightOpacity = variant === "primary" ? 0.16 : 0.1;

	const animateButton = (pressed: boolean) => {
		Animated.parallel([
			Animated.spring(scale, {
				toValue: pressed ? 0.96 : 1,
				tension: 260,
				friction: pressed ? 22 : 14,
				useNativeDriver: true,
			}),
			Animated.spring(translateY, {
				toValue: pressed ? 2 : 0,
				tension: 260,
				friction: pressed ? 24 : 16,
				useNativeDriver: true,
			}),
			Animated.timing(overlayOpacity, {
				toValue: pressed ? 1 : 0,
				duration: pressed ? 80 : 180,
				easing: Easing.out(Easing.quad),
				useNativeDriver: true,
			}),
		]).start();
	};

	return (
		<Pressable
			className='flex-1'
			onPress={onPress}
			onPressIn={() => animateButton(true)}
			onPressOut={() => animateButton(false)}
			android_ripple={{ color: rippleColor }}
		>
			<Animated.View
				style={{
					transform: [{ scale }, { translateY }],
					shadowColor: "#000",
					shadowOpacity: variant === "primary" ? 0.24 : 0.12,
					shadowOffset: { width: 0, height: 8 },
					shadowRadius: variant === "primary" ? 18 : 12,
					elevation: variant === "primary" ? 6 : 3,
				}}
			>
				<View className={buttonClassName}>
					<Animated.View
						pointerEvents='none'
						style={[
							StyleSheet.absoluteFillObject,
							{
								backgroundColor: "#ffffff",
								opacity: overlayOpacity.interpolate({
									inputRange: [0, 1],
									outputRange: [0, highlightOpacity],
								}),
							},
						]}
					/>
					<Text className='text-sm text-foreground'>{label}</Text>
				</View>
			</Animated.View>
		</Pressable>
	);
}


export default function SignupScreen({ onSwitch }: { onSwitch: () => void }) {

	const [signUpScreen, setSignUpScreen] = useState(1);
	const [direction, setDirection] = useState(1); 
	const anim = useRef(new Animated.Value(0)).current;

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [serialKey, setSerialKey] = useState("");
	const [otp, setOtp] = useState("");

	const goNext = () => {
		setDirection(1);
		setSignUpScreen((s) => s + 1);
	};

	const goBack = () => {
		setDirection(-1);
		setSignUpScreen((s) => s - 1);
	};

	useEffect(() => {
		anim.setValue(40 * direction); // start slightly right

		Animated.timing(anim, {
			toValue: 0,
			duration: 300,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, [signUpScreen]);

	const handleNext = () => {
		if(!email || !password || !firstName || !lastName) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}

		if(password !== confirmPassword) {
			Alert.alert("Error", "Passwords do not match.");
			return;
		}

		goNext();
	}

	const sendOtp = async () => {
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				shouldCreateUser: true, // creates user if they don't exist
			},
		})

		if (error) throw error
	}
	
	const handleValidateSerial = async () => {
		const { data, error } = await supabase.rpc('check_serial_available', {
			input_key: serialKey,
		})

		if (error) throw error

		if (data !== 'available') {
			console.log(data);
			throw new Error('Invalid or already used serial key')
		}

		sendOtp();

		goNext();
	}

	const handleSignUp = async () => {

		const { data, error } = await supabase.auth.verifyOtp({
			email,
			token: otp,
			type: 'email',
		})

		if (error) throw error

		const user = data.user
		if (!user) throw new Error('Verification failed')

		// Insert profile
		await supabase.from('profiles').insert({
			id: user.id,
			first_name: firstName,
			last_name: lastName,
			email: email,
			created_at: new Date()
		})

		// Activate serial
		const { data: activationResult } = await supabase.rpc(
			'activate_serial',
			{ input_key: serialKey }
		)

		if (activationResult !== 'success') {
			throw new Error('Serial activation failed')
		}
	}

	return(
		<View className='flex-1 items-center justify-center'>
			<KeyboardAvoidingView
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
				className='flex-1 w-full'
			>
				<View className='flex-1 items-center justify-center'>
					{signUpScreen === 1 ? (
						<Animated.View
							style={{
								alignItems: 'center',
								opacity: anim.interpolate({
									inputRange: [-40, 0, 40],
									outputRange: [0, 1, 0],
								}),
								transform: [{ translateX: anim }],
							}}
						>
							<Text className='text-5xl'>SIGN UP</Text>
							<Text className='text-sm text-foreground/50 mt-2'>create an account</Text>
							<View className="flex-col gap-4 px-8 pt-12">
								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'>
									<Image source={require('assets/images/username-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 w-full text-white text-sm'
										placeholder='Email Address'
										placeholderTextColor={'#ffffff60'}
										value={email}
										onChangeText={setEmail}
									/>
								</View>

								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'>
									<Image source={require('assets/images/username-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 w-full text-white text-sm'
										placeholder='First Name'
										placeholderTextColor={'#ffffff60'}
										value={firstName}
										onChangeText={setFirstName}
									/>
								</View>

								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'>
									<Image source={require('assets/images/username-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 w-full text-white text-sm'
										placeholder='Last Name'
										placeholderTextColor={'#ffffff60'}
										value={lastName}
										onChangeText={setLastName}
									/>
								</View>
							</View>
							<View className="flex-col gap-4 px-8 pt-12">
								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'
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

								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'
									style={{ position: 'relative' }}
								>
									<Image source={require('assets/images/password-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 pr-10 w-full text-white text-sm'
										placeholder='Confirm Password'
										placeholderTextColor={'#ffffff60'}
										secureTextEntry={!showConfirmPassword}
										value={confirmPassword}
										onChangeText={setConfirmPassword}
									/>
									<Pressable
										onPress={() => setShowConfirmPassword((current) => !current)}
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
											as={showConfirmPassword ? EyeOff : Eye}
											size={18}
											color="#ffffff90"
										/>
									</Pressable>
								</View>

							</View>

							<View className="flex-row top-12 px-6 gap-20"> 
								<ActionButton label='Back' onPress={onSwitch} />
								<ActionButton label='Next' onPress={() => handleNext()} variant='primary' />
							</View>
						</Animated.View>
					) : signUpScreen === 2 ? (
						<Animated.View
							style={{
								alignItems: 'center',
								opacity: anim.interpolate({
									inputRange: [-40, 0, 40],
									outputRange: [0, 1, 0],
								}),
								transform: [{ translateX: anim }],
							}}
						>
							<Text className='text-5xl'>VERIFY KEY</Text>
							<Text className='text-sm text-foreground/50 mt-2'>Input the serial key provided</Text>
							<View className="flex-col gap-4 px-8 pt-12">
								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'>
									<Image source={require('assets/images/username-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 w-full text-white text-sm'
										placeholder='Enter Serial Key'
										placeholderTextColor={'#ffffff60'}
										value={serialKey}
										onChangeText={setSerialKey}
									/>
								</View>

							</View>
							<View className="flex-row top-52 px-6 gap-20"> 
								<ActionButton label='Back' onPress={() => goBack()} />
								<ActionButton label='Next' onPress={() => handleValidateSerial()} variant='primary' />
							</View>
						</Animated.View>
					): signUpScreen === 3 ? (
						<Animated.View
							style={{
								alignItems: 'center',
								opacity: anim.interpolate({
									inputRange: [-40, 0, 40],
									outputRange: [0, 1, 0],
								}),
								transform: [{ translateX: anim }],
							}}
						>
							<View className="flex-col items-center justify-center px-8">
								<Text className='text-5xl font-bold'>Verification</Text>
								<Text className='text-sm text-foreground/50 mt-2 text-center'>verify account by entering the otp sent to your email</Text>
								<View className="pt-8">
									<OtpInput numberOfDigits={8} 
										theme={{
											containerStyle: {
												gap: 4
											},
											pinCodeContainerStyle: {
												width: 35,
												height: 45,
												backgroundColor: '#ffffff20',
												borderColor: '#ffffff0',
												borderWidth: 2
											},
											pinCodeTextStyle: {
												color: '#fff',
											},
											focusStickStyle: {
												backgroundColor: '#ffffff60',
												borderColor: '#ffffff10',
												borderWidth: 1
											}
										}}
										onTextChange={setOtp}
									/>
								</View>
								<View className="flex-row gap-4 pt-12">
									<ActionButton label='Back' onPress={() => goBack()} variant='subtle' />
									<ActionButton label='Resend' onPress={() => setSignUpScreen(1)} />
									<ActionButton label='Next' onPress={() => handleSignUp()} variant='primary' />
								</View>
							</View>
						</Animated.View>
					): null}
				</View>
				
			</KeyboardAvoidingView>
		</View>
	)
}
