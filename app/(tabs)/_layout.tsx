import { NAV_THEME, THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChartNoAxesColumnIncreasing, House, Menu, Monitor } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Animated, Image, View } from "react-native";
import { Text } from '@/components/ui/text';
import Svg, { G, Rect } from "react-native-svg";
import { useEffect, useRef } from "react";

export default function TabsLayout(){
  const { colorScheme } = useColorScheme();

  return(
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'}/>
      <View className="px-3.5 py-3 rounded-full self-center" style={{position: 'absolute', bottom: 110, elevation: 10, zIndex: 999}}>
        <Image 
          source={require('assets/images/smartwattgreen.png')}
          className="absolute self-center"
        />
        <Image 
          source={require('assets/images/smartwatt.png')}
          className="absolute self-center animate-pulse transition duration-1000"
        />

        <Image 
          source={require('assets/images/smartwattyellow.png')}
          className="absolute self-center transition duration-300"
        />
        <Image 
          source={require('assets/images/smartwattglassyellow.png')}
          className="absolute self-center animate-pulse transition duration-1000"
          
        />

        <Image 
          source={require('assets/images/smartwattlogo.png')}
          className="absolute self-center"
        />
    
      </View>
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