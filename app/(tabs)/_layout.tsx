import { NAV_THEME, THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { router, Stack, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChartNoAxesColumnIncreasing, House, Menu, MenuIcon, Monitor } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Animated, Image, Pressable, View } from "react-native";
import { Text } from '@/components/ui/text';
import Svg, { G, Rect } from "react-native-svg";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { useSmartWatt } from "@/lib/context";
import { useAuth } from "@/hooks/useUserRole";

export default function TabsLayout(){
  const { colorScheme } = useColorScheme();
  const { anomalyLevel, setAnomalyLevel } = useSmartWatt();
  const { user } = useAuth();

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
      <Pressable onPress={()=>router.push('/(tabs)/chatbot')}
        style={{
        position: 'absolute',
        bottom: 95,
        alignSelf: 'center',
        zIndex: 999,
        elevation: 10,
      }}
      >
        <View className="px-3.5 py-3 rounded-full self-center" >
          {anomalyLevel === "normal" && (
            <>
              <Image 
                source={require('assets/images/smartwattgreen.png')}
                className="absolute self-center"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
              <Image 
                source={require('assets/images/smartwatt.png')}
                className="absolute self-center animate-pulse transition duration-1000"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
            </>
          )}
          {anomalyLevel === 'warning' && (
            <>
              <Image 
                source={require('assets/images/smartwattyellow.png')}
                className="absolute self-center transition duration-300"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
              <Image 
                source={require('assets/images/smartwattglassyellow.png')}
                className="absolute self-center animate-pulse transition duration-1000"
                style={{
                  height: 80,
                  width: 80,
                }}
              />
            </>
          )}

          <Image 
            source={require('assets/images/smartwattlogo.png')}
            className="absolute self-center"
            style={{
              height: 80,
              width: 80,
            }}
          />
      
        </View>
      </Pressable>
      <Tabs screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? THEME.dark.foreground : THEME.light.foreground
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