import { View } from "react-native";
import { Text } from '@/components/ui/text';

export default function BarChartBottomSheet(){
  return(
    <>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Peak Usage</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>7 PM</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>500.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Lowest Usage</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>4 AM</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>80.0kWh</Text>
        </View>
      </View>
    </>
  )
}