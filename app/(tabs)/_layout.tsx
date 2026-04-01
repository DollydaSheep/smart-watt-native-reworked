import { NAV_THEME, THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { router, Stack, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChartNoAxesColumnIncreasing, House, Menu, MenuIcon, Monitor } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Animated, Easing, Image, Pressable, View } from "react-native";
import { Text } from '@/components/ui/text';
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useSmartWatt } from "@/lib/context";
import { useAuth } from "@/hooks/useUserRole";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout(){
  const { colorScheme } = useColorScheme();
  const { anomalyLevel } = useSmartWatt();
  const { user } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 64;

  const [chatbotOpen, setChatbotOpen] = useState(false);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
		anim.setValue(0); // start slightly right

		Animated.timing(anim, {
			toValue: 1,
			duration: 600,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, [chatbotOpen]);

  useEffect(() => {
    if (pathname.includes("chatbot")) {
      setChatbotOpen(true);
    }else {
      setChatbotOpen(false);
    }
  }, [pathname]);

  const chatbotButtonLogoSource = anomalyLevel === 'critical'
    ? require('assets/images/smartwattlogo-red-btn.png')
    : anomalyLevel === 'warning'
      ? require('assets/images/smartwattlogo-yellow-btn.png')
      : require('assets/images/smartwattlogo-green-btn.png');

  const chatbotButtonBaseSource = anomalyLevel === 'critical'
    ? require('assets/images/smartwattred.png')
    : anomalyLevel === 'warning'
      ? require('assets/images/smartwattyellow.png')
      : require('assets/images/smartwattgreen.png');

  const chatbotButtonGlassSource = anomalyLevel === 'critical'
    ? require('assets/images/smartwattglassred.png')
    : anomalyLevel === 'warning'
      ? require('assets/images/smartwattglassyellow.png')
      : require('assets/images/smartwatt.png');

  if(user === null){
    return(
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <Stack>
          <Stack.Screen 
            name='index'
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    )
  }

  return(
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'}/>
      {/* <Pressable onPress={()=>{
        router.push('/(tabs)/chatbot')
      }}
        style={{
        position: 'absolute',
        bottom: (TAB_BAR_HEIGHT + (insets.bottom ?? 0)) - 20,
        alignSelf: 'center',
        zIndex: 999,
        elevation: 10,
      }}
      > */}
        <View className="px-3.5 py-3 rounded-full self-center" 
          style={{
          position: 'absolute',
          bottom: (TAB_BAR_HEIGHT + (insets.bottom ?? 0)) - 20,
          alignSelf: 'center',
          zIndex: 999,
          elevation: 10,
        }}>
          {chatbotOpen ? (
            <Animated.View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                opacity: anim.interpolate({
                  inputRange: [-40, 0 , 40],
                  outputRange: [0, 1, 0],
                }),
                transform: [{ scale: anim }],
              }}
            >
              <Image 
                source={chatbotButtonLogoSource}
                className="absolute self-center"
                style={{
                  height: 80,
                  width: 80,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>
          ) : (
            <Animated.View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                opacity: anim.interpolate({
                  inputRange: [-40, 0 , 40],
                  outputRange: [0, 1, 0],
                }),
                transform: [{ scale: anim }],
              }}
            >
              <Image 
                source={chatbotButtonBaseSource}
                className="absolute self-center transition duration-300"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
              <Image 
                source={chatbotButtonGlassSource}
                className="absolute self-center animate-pulse transition duration-1000"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
              <Image 
                source={require('assets/images/smartwattlogo.png')}
                className="absolute self-center"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
            </Animated.View>
          )}
        </View>
      {/* </Pressable> */}
      <Tabs screenOptions={{
        lazy: true,
        freezeOnBlur: true,
        tabBarActiveTintColor: colorScheme === 'dark' ? THEME.dark.foreground : THEME.light.foreground,
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + (insets.bottom ?? 0),
          paddingBottom: insets.bottom ?? 0,
        },
      }}>
        <Tabs.Screen 
          name="index"
          options={{
            headerShown: false,
            tabBarLabel: "Home",
            tabBarIcon: ({color}) => <House color={color} size={20}/>
          }}
        />
        <Tabs.Screen 
          name="stats"
          options={{
            header: () => {
              return(
                <>
                  <View className="mt-6 p-4">
                    <Text className="text-3xl font-medium">Statistics</Text>
                  </View>
                </>
              )
            },
            tabBarLabel: "Stats",
            tabBarItemStyle: {
              marginRight: 40
            },
            tabBarIcon: ({color}) => <ChartNoAxesColumnIncreasing color={color} size={20}/>
          }}
        />
        <Tabs.Screen 
          name="chatbot"
          options={{
            header: () => {
              return(
                <>
                  <View className="flex flex-row ml-3 mt-8 px-4` pt-3 items-end">
                    <Icon as={MenuIcon} className="text-white/50 size-5" />
                  </View>
                </>
              )
            },
            tabBarLabel:"",
            tabBarItemStyle:{
              display: "none"
            }
          }}
        />
        <Tabs.Screen 
          name="devices"
          options={{
            header: () => {
              return(
                <>
                  <View className="mt-6 p-4">
                    <Text className="text-3xl font-medium">Devices</Text>
                  </View>
                </>
              )
            },
            tabBarLabel: "Devices",
            tabBarItemStyle: {
              marginLeft: 40
            },
            tabBarIcon: ({color}) => <Monitor color={color} size={20} />
          }}
        />
        <Tabs.Screen 
          name="menu"
          options={{
            header: () => {
              return(
                <>
                  <View className="mt-6 p-4">
                    
                  </View>
                </>
              )
            },
            tabBarLabel: "Menu",
            tabBarIcon: ({color}) => <Menu color={color} size={20} />
          }}
        />
      </Tabs>
    </ThemeProvider>
  )
}