import { View } from "react-native";
import { Text } from '@/components/ui/text';

export default function AreaChartBottomSheet(){
  return(
    <>
      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <View>
          <Text className='text-sm font-medium'>Total Consumption</Text>
          <Text className='text-[10px] text-gray-600'>(Week)</Text>
        </View>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>200.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <View>
          <Text className='text-sm font-medium'>Estimated Total Cost</Text>
          <Text className='text-[10px] text-gray-600'>(Week)</Text>
        </View>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>P400</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Estimated Cost Rate</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>P40 / kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Peak Usage</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>Saturday</Text>
          <Text className='text-sm text-gray-600'>15.0kWh</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Lowest Usage</Text>
        <View className='flex flex-row gap-2'> 
          <Text className='text-sm'>Wednesday</Text>
          <Text className='text-sm text-gray-600'>6.0kWh</Text>
        </View>
      </View>
    </>
  )
}