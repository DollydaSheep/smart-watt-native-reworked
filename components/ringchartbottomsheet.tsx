import { View } from "react-native";
import { Text } from '@/components/ui/text';

export default function RingChartBottomSheet(){
  return(
    <>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>PC</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>35%</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>40.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Television</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>25%</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>20.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Refrigerator</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>15%</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>10.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Microwave</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>10%</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>5.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Lights</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>8%</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>3.0kWh</Text>
        </View>
      </View>

    </>
  )
}