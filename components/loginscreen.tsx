import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Text } from './ui/text';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Animated, Easing } from "react-native";
import { useRef, useEffect } from "react";

export default function LoginScreen({ onSwitch }: { onSwitch: () => void }) {

	const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
	const anim = useRef(new Animated.Value(0)).current;

	const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    // setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert("Success", `Welcome back, ${data.user?.email}`);
      // ✅ e.g. router.push("/home")

    } catch (error: any) {
      console.error("Login error:", error.message);
      Alert.alert("Login Failed", error.message);
    } finally {
      // setLoading(false);
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
							/>
						</View>
						<View className='px-3 flex-row items-center bg-foreground/20 rounded-md'>
							<Image source={require('assets/images/password-icon.png')}
								style={{
									height: 20,
									width: 20,
								}}
							/>
							<TextInput className='py-2.5 px-2 w-full text-white text-sm'
								placeholder='Password'
								placeholderTextColor={'#ffffff60'}
								secureTextEntry
								value={password}
								onChangeText={setPassword}
							/>
						</View>
						<View className='flex-row gap-8'>
							<Pressable className='flex-1 py-3.5 bg-foreground/20 rounded-full items-center justify-center' onPress={onSwitch}>
								<Text className='text-sm'>SIGN UP</Text>
							</Pressable>
							<Pressable className='flex-1 py-3.5 bg-green-600 rounded-full items-center justify-center' onPress={handleLogin}>
								<Text className='text-sm'>LOG IN</Text>
							</Pressable>
						</View>
					</View>
				</View>
				
				</KeyboardAvoidingView>
			</View>
		</Animated.View>
	)
}