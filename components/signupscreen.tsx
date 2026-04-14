import {
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { Text } from "./ui/text";
import { useEffect, useRef, useState } from "react";
import { OtpInput } from "react-native-otp-entry";
import { Eye, EyeOff } from "lucide-react-native";
import { Icon } from "./ui/icon";
import { Animated, Easing } from "react-native";
import { supabase } from "@/lib/supabase";

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "subtle";
};

function ActionButton({
  label,
  onPress,
  variant = "secondary",
}: ActionButtonProps) {
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
      className="flex-1"
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
            pointerEvents="none"
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
          <Text className="text-sm text-foreground">{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function SignupScreen({ onSwitch }: { onSwitch: () => void }) {
  const [signUpScreen, setSignUpScreen] = useState(1);
  const [direction, setDirection] = useState(1);
  const anim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [serialKey, setSerialKey] = useState("");
  const [otp, setOtp] = useState("");

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const cleanSerialKey = serialKey.trim();

  const goNext = () => {
    setDirection(1);
    setSignUpScreen((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setSignUpScreen((s) => s - 1);
  };

  useEffect(() => {
    anim.setValue(40 * direction);

    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [signUpScreen, direction, anim]);

  const handleNext = () => {
    if (!cleanEmail || !cleanPassword || !confirmPassword.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    goNext();
  };

  const withTimeout = async <T,>(
		promise: PromiseLike<T>,
		ms = 10000
	): Promise<T> => {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Request timed out.")), ms)
			),
		]);
	};

	const handleValidateSerial = async () => {
		if (!cleanSerialKey) {
			Alert.alert("Error", "Please enter a serial key.");
			return;
		}

		setLoading(true);

		try {
			console.log("1. checking serial...");

			const { data, error } = await withTimeout(
				supabase.rpc("check_serial_available", {
					input_key: cleanSerialKey,
				}),
				10000
			);

			console.log("2. serial check result:", { data, error });

			if (error) throw error;

			if (data !== "available") {
				throw new Error("Invalid or already used serial key.");
			}

			console.log("3. creating auth user...");

			const { data: signUpData, error: signUpError } = await withTimeout(
				supabase.auth.signUp({
					email: cleanEmail,
					password: cleanPassword,
				}),
				10000
			);

			console.log("4. signup result:", { signUpData, signUpError });

			if (signUpError) throw signUpError;

			goNext();
			Alert.alert("Verification Code Sent", `Enter the code sent to ${cleanEmail}.`);
		} catch (error: any) {
			console.error("handleValidateSerial error:", error);
			Alert.alert("Signup Failed", error?.message || "Unable to continue signup.");
		} finally {
			setLoading(false);
		}
	};

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });

      if (error) throw error;

      Alert.alert("Code Sent", "A new verification code was sent to your email.");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      Alert.alert("Resend Failed", error?.message || "Unable to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
		try {
			const { data, error } = await supabase.auth.verifyOtp({
				email: cleanEmail,
				token: otp.trim(),
				type: "email",
			});

			if (error) throw error;

			const user = data.user;
			if (!user) throw new Error("Verification failed");

			const { error: profileError } = await supabase.from("profiles").upsert({
				id: user.id,
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				email: cleanEmail,
				created_at: new Date().toISOString(),
			});

			if (profileError) throw profileError;

			const { data: activationResult, error: activationError } = await supabase.rpc(
				"activate_serial",
				{ input_key: cleanSerialKey }
			);

			console.log("activate_serial result:", activationResult);
			console.log("activate_serial error:", activationError);

			if (activationError || activationResult !== "success") {
				console.warn("Serial activation failed, but signup will continue.");
			}

			Alert.alert("Success", "Account created successfully.");
		} catch (error: any) {
			console.error("Verify signup error:", error);
			Alert.alert("Signup Failed", error?.message || "Unable to finish signup.");
		}
	};

  return (
    <View className="flex-1 items-center justify-center">
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        className="flex-1 w-full"
      >
        <View className="flex-1 items-center justify-center">
          {signUpScreen === 1 ? (
            <Animated.View
              style={{
                alignItems: "center",
                opacity: anim.interpolate({
                  inputRange: [-40, 0, 40],
                  outputRange: [0, 1, 0],
                }),
                transform: [{ translateX: anim }],
              }}
            >
              <Text className="text-5xl">SIGN UP</Text>
              <Text className="text-sm text-foreground/50 mt-2">create an account</Text>

              <View className="flex-col gap-4 px-8 pt-12">
                <View className="px-3 flex-row items-center bg-foreground/10 rounded-md">
                  <Image
                    source={require("assets/images/username-icon.png")}
                    style={{ height: 20, width: 20 }}
                  />
                  <TextInput
                    className="py-2.5 px-2 w-full text-white text-sm"
                    placeholder="Email Address"
                    placeholderTextColor="#ffffff60"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>

                <View className="px-3 flex-row items-center bg-foreground/10 rounded-md">
                  <Image
                    source={require("assets/images/username-icon.png")}
                    style={{ height: 20, width: 20 }}
                  />
                  <TextInput
                    className="py-2.5 px-2 w-full text-white text-sm"
                    placeholder="First Name"
                    placeholderTextColor="#ffffff60"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View className="px-3 flex-row items-center bg-foreground/10 rounded-md">
                  <Image
                    source={require("assets/images/username-icon.png")}
                    style={{ height: 20, width: 20 }}
                  />
                  <TextInput
                    className="py-2.5 px-2 w-full text-white text-sm"
                    placeholder="Last Name"
                    placeholderTextColor="#ffffff60"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <View className="flex-col gap-4 px-8 pt-12">
                <View
                  className="px-3 flex-row items-center bg-foreground/10 rounded-md"
                  style={{ position: "relative" }}
                >
                  <Image
                    source={require("assets/images/password-icon.png")}
                    style={{ height: 20, width: 20 }}
                  />
                  <TextInput
                    className="py-2.5 px-2 pr-10 w-full text-white text-sm"
                    placeholder="Password"
                    placeholderTextColor="#ffffff60"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={10}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon as={showPassword ? EyeOff : Eye} size={18} color="#ffffff90" />
                  </Pressable>
                </View>

                <View
                  className="px-3 flex-row items-center bg-foreground/10 rounded-md"
                  style={{ position: "relative" }}
                >
                  <Image
                    source={require("assets/images/password-icon.png")}
                    style={{ height: 20, width: 20 }}
                  />
                  <TextInput
                    className="py-2.5 px-2 pr-10 w-full text-white text-sm"
                    placeholder="Confirm Password"
                    placeholderTextColor="#ffffff60"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((current) => !current)}
                    hitSlop={10}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon as={showConfirmPassword ? EyeOff : Eye} size={18} color="#ffffff90" />
                  </Pressable>
                </View>
              </View>

              <View className="flex-row top-12 px-6 gap-20">
                <ActionButton label="Back" onPress={onSwitch} />
                <ActionButton
                  label={loading ? "Please wait..." : "Next"}
                  onPress={handleNext}
                  variant="primary"
                />
              </View>
            </Animated.View>
          ) : signUpScreen === 2 ? (
            <Animated.View
              style={{
                alignItems: "center",
                opacity: anim.interpolate({
                  inputRange: [-40, 0, 40],
                  outputRange: [0, 1, 0],
                }),
                transform: [{ translateX: anim }],
              }}
            >
              <Text className="text-5xl">VERIFY KEY</Text>
              <Text className="text-sm text-foreground/50 mt-2">Input the serial key provided</Text>

              <View className="flex-col gap-4 px-8 pt-12">
                <View className="px-3 flex-row items-center bg-foreground/10 rounded-md">
                  <Image
                    source={require("assets/images/username-icon.png")}
                    style={{ height: 20, width: 20 }}
                  />
                  <TextInput
                    className="py-2.5 px-2 w-full text-white text-sm"
                    placeholder="Enter Serial Key"
                    placeholderTextColor="#ffffff60"
                    value={serialKey}
                    onChangeText={setSerialKey}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View className="flex-row top-52 px-6 gap-20">
                <ActionButton label="Back" onPress={goBack} />
                <ActionButton
                  label={loading ? "Please wait..." : "Next"}
                  onPress={handleValidateSerial}
                  variant="primary"
                />
              </View>
            </Animated.View>
          ) : signUpScreen === 3 ? (
            <Animated.View
              style={{
                alignItems: "center",
                opacity: anim.interpolate({
                  inputRange: [-40, 0, 40],
                  outputRange: [0, 1, 0],
                }),
                transform: [{ translateX: anim }],
              }}
            >
              <View className="flex-col items-center justify-center px-8">
                <Text className="text-5xl font-bold">Verification</Text>
                <Text className="text-sm text-foreground/50 mt-2 text-center">
                  verify account by entering the otp sent to your email
                </Text>

                <View className="pt-8">
                  <OtpInput
                    numberOfDigits={8}
                    theme={{
                      containerStyle: { gap: 4 },
                      pinCodeContainerStyle: {
                        width: 40,
                        height: 48,
                        backgroundColor: "#ffffff20",
                        borderColor: "#ffffff00",
                        borderWidth: 2,
                      },
                      pinCodeTextStyle: { color: "#fff" },
                      focusStickStyle: {
                        backgroundColor: "#ffffff60",
                        borderColor: "#ffffff10",
                        borderWidth: 1,
                      },
                    }}
                    onTextChange={setOtp}
                  />
                </View>

                <View className="flex-row gap-4 pt-12">
                  <ActionButton label="Back" onPress={goBack} variant="subtle" />
                  <ActionButton
                    label={loading ? "Sending..." : "Resend"}
                    onPress={handleResendOtp}
                  />
                  <ActionButton
                    label={loading ? "Please wait..." : "Next"}
                    onPress={handleSignUp}
                    variant="primary"
                  />
                </View>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}