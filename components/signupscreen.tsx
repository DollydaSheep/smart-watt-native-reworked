import { KeyboardAvoidingView, Platform, View, Image, TextInput, Pressable } from "react-native";
import { Text } from "./ui/text";
import { useState } from "react";
import { OtpInput } from "react-native-otp-entry";
import { ArrowLeft } from "lucide-react-native";
import { Icon } from "./ui/icon";
import { Animated, Easing } from "react-native";
import { useRef, useEffect } from "react";


export default function SignupScreen({ onSwitch }: { onSwitch: () => void }) {

	const [signUpScreen, setSignUpScreen] = useState(1);
	const anim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		anim.setValue(50); // start slightly right

		Animated.timing(anim, {
			toValue: 0,
			duration: 300,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, [signUpScreen]);

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
									inputRange: [0, 50],
									outputRange: [1, 0],
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
										placeholder='Username'
										placeholderTextColor={'#ffffff60'}
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
									/>
								</View>
							</View>
							<View className="flex-col gap-4 px-8 pt-12">
								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'>
									<Image source={require('assets/images/password-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 w-full text-white text-sm'
										placeholder='Password'
										placeholderTextColor={'#ffffff60'}
									/>
								</View>

								<View className='px-3 flex-row items-center bg-foreground/10 rounded-md'>
									<Image source={require('assets/images/password-icon.png')}
										style={{
											height: 20,
											width: 20,
										}}
									/>
									<TextInput className='py-2.5 px-2 w-full text-white text-sm'
										placeholder='Confirm Password'
										placeholderTextColor={'#ffffff60'}
									/>
								</View>

							</View>

							<View className="flex-row top-12 px-6 gap-20"> 
								<Pressable className='flex-1 py-3.5 bg-foreground/10 rounded-full items-center' onPress={onSwitch}>
									<Text className="text-sm text-foreground">Back</Text>
								</Pressable>
								<Pressable className='flex-1 py-3.5 bg-green-500 rounded-full items-center' onPress={()=>setSignUpScreen(2)}>
									<Text className="text-sm text-foreground">Next</Text>
								</Pressable>
							</View>
						</Animated.View>
					) : signUpScreen === 2 ? (
						<Animated.View
							style={{
								alignItems: 'center',
								opacity: anim.interpolate({
									inputRange: [0, 50],
									outputRange: [1, 0],
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
									/>
								</View>

							</View>
							<View className="flex-row top-52 px-6 gap-20"> 
								<Pressable className='flex-1 py-3.5 bg-foreground/10 rounded-full items-center' onPress={()=>setSignUpScreen(1)}>
									<Text className="text-sm text-foreground">Back</Text>
								</Pressable>
								<Pressable className='flex-1 py-3.5 bg-green-500 rounded-full items-center' onPress={()=>setSignUpScreen(3)}>
									<Text className="text-sm text-foreground">Next</Text>
								</Pressable>
							</View>
						</Animated.View>
					): signUpScreen === 3 ? (
						<Animated.View
							style={{
								alignItems: 'center',
								opacity: anim.interpolate({
									inputRange: [0, 50],
									outputRange: [1, 0],
								}),
								transform: [{ translateX: anim }],
							}}
						>
							<View className="flex-col items-center justify-center px-8">
								<Text className='text-5xl font-bold'>Verification</Text>
								<Text className='text-sm text-foreground/50 mt-2 text-center'>verify account by entering the otp sent to your email</Text>
								<View className="pt-8">
									<OtpInput numberOfDigits={4} 
										theme={{
											containerStyle: {
												gap: 12
											},
											pinCodeContainerStyle: {
												width: 65,
												height: 65,
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
									/>
								</View>
								<View className="flex-row gap-4 pt-12">
									<Pressable className='flex-1 py-3.5 bg-foreground/5 rounded-full items-center' onPress={()=>setSignUpScreen(2)}>
										<Text className="text-sm text-foreground">Back</Text>
									</Pressable>
									<Pressable className='flex-1 py-3.5 bg-foreground/10 rounded-full items-center' onPress={()=>setSignUpScreen(1)}>
										<Text className="text-sm text-foreground">Resend</Text>
									</Pressable>
									<Pressable className='flex-1 py-3.5 bg-green-500 rounded-full items-center' onPress={()=>setSignUpScreen(3)}>
										<Text className="text-sm text-foreground">Next</Text>
									</Pressable>
								</View>
							</View>
						</Animated.View>
					): null}
				</View>
				
			</KeyboardAvoidingView>
		</View>
	)
}