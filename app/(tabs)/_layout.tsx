import { NAV_THEME, THEME } from "@/lib/theme";
import { ThemeProvider } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChartNoAxesColumnIncreasing, House, Menu, Monitor } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { View } from "react-native";
import { Text } from '@/components/ui/text';

export default function TabsLayout(){
  const { colorScheme } = useColorScheme();

  return(
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'}/>
      <View className="px-3.5 py-3 rounded-full bg-green-500 self-center" style={{position: 'absolute', bottom: 40, elevation: 10, zIndex: 999}}>
        <Text className="text-4xl font-bold">W</Text>
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
            tabBarLabel: "Menu",
            tabBarIcon: ({color}) => <Menu color={color} size={20} />
          }}
        />
      </Tabs>
    </ThemeProvider>
  )
}