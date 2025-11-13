

export default function BottomSheetComponent(){
  return(
    <>
      <BottomSheet
        snapPoints={["55%","75%"]}
        animatedPosition={animatedPosition}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        backgroundStyle={{ backgroundColor: 'transparent', overflow: "hidden" }}
        handleStyle={{ backgroundColor: 'transparent' }}
        handleIndicatorStyle={{ display: "none" }}
      >
        <BottomSheetScrollView
          enableOnAndroid={true}
          nestedScrollEnabled={true}
          className="px-4 pt-4"
        >
          {/* Example list items */}
          <View className='w-full p-4 flex flex-col mb-4'>
            <View className='flex flex-row gap-2'>
              <Zap fill={"#00c951"} color={"#00c951"} size={48}/>
              <View className='flex flex-col'>
                <View className='flex flex-row items-end gap-2 -mt-1'>
                  <Text className='text-4xl font-medium'>20.2</Text>
                  <Text className='text-base font-medium text-gray-600'>kW</Text>
                </View>
                <Text className='self-end font-medium text-gray-600 text-base'>/100kW</Text>
              </View>
            </View>
            <View className='flex flex-row justify-between'>
              <View className='flex flex-row items-center gap-1'>
                <TrendingUp color={"#00c951"} size={12} />
                <Text className='text-[8px] text-green-500'>Optimized Efficiency</Text>
              </View>
              <View className='flex flex-row items-center gap-1'>
                <View className='p-0.5 rounded-full bg-green-500'></View>
                <Text className='text-[8px] text-green-500'>0 Anomalies</Text>
              </View>
            </View>

          </View>

          <View className="space-y-4 pb-20 border border-foreground rounded-lg">
            <View className='flex flex-row justify-between items-center px-5 py-4 mb-4'>
              <Text className='font-medium'>Today</Text>
              <View className='flex flex-row items-center -mr-2 gap-2'>
                <Text className='text-[10px] text-gray-600'>Oct 10, 2025</Text>
                <ChevronRight color={'#fff'} size={20}/>
              </View>
            </View>
            <View className='flex flex-col gap-2'>
              <View className='flex flex-row p-4 gap-2'>
                <View className='px-3 py-1 bg-gray-800 rounded-lg'>
                  <Microwave color={'#fff'} size={36}/>
                </View>
                <View>
                  <Text className='text-xs text-gray-600'>5:00 AM</Text>
                  <Text className='font-medium'>Microwave turned on</Text>
                </View>
              </View>

              <View className='flex flex-row p-4 gap-2'>
                <View className='px-3 py-1 bg-gray-800 rounded-lg'>
                  <Microwave color={'#fff'} size={36}/>
                </View>
                <View>
                  <Text className='text-xs text-gray-600'>5:00 AM</Text>
                  <Text className='font-medium'>Microwave turned on</Text>
                </View>
              </View>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  )
}