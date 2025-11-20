import DeviceUsageBarChart from '@/components/devicechart';
import ApplianceUsageRingChart from '@/components/ringchart';
import { Text } from '@/components/ui/text';
import { THEME } from '@/lib/theme';
import { ChevronLeft, EllipsisVertical, Lightbulb, Microwave, Monitor, Refrigerator, Tv } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native'
import { VictoryBar, VictoryChart } from 'victory-native';

export default function DevicesTabScreen(){

  const [isEnabled, setIsEnabled] = useState<boolean[]>([true,true,true,true,true]);
  const [modalVisible, setModalVisible] = useState(false);

  const [modalColor, setModalColor] = useState<string>("");
  const [modalColorHex, setModalColorHex] = useState<string>("");

  const handleToggle = (index: number) => {
    setIsEnabled(prev => {
      const updated = [...prev];
      updated[index] = !prev[index];
      return updated;
    });
  };

  const handleModal = (color:string, colorHex:string) => {
    setModalVisible(true);
    setModalColor(color);
    setModalColorHex(colorHex);
  }

  return(
    <>
      <View className='flex-1 px-4'>
        <View className='flex flex-row justify-between items-center'>
          <Text className='text-blue-400 text-5xl font-semibold'>05</Text>
          <View className='flex flex-row items-end'>
            <Text className='text-5xl font-semibold'>20.0</Text>
            <Text className='text-3xl text-foreground/60 font-medium'>kW</Text>
          </View>
        </View>
        <View className='relative flex flex-row h-2 w-full bg-foreground rounded-full my-4 overflow-hidden'>
          <View className='h-2 w-[30%] bg-blue-400'></View>
          <View className='h-2 w-[20%] bg-violet-500'></View>
          <View className='h-2 w-[20%] bg-green-400'></View>
          <View className='h-2 w-[15%] bg-foreground'></View>
          <View className='h-2 w-[15%] bg-yellow-400'></View>
        </View>

        <ScrollView className='flex-1 my-4'>
          <View className='flex gap-6'>
            <View className={`flex flex-row items-center justify-between gap-3`}>
              <View className={`flex flex-row gap-3 ${isEnabled[0] ? 'opacity-100' : 'opacity-25'}`}>
                <View className='px-3 py-2 rounded-lg bg-foreground/10'>
                  <Monitor 
                    size={28}
                    color={"#51a2ff"}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Personal Computer</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
                </View>
              </View>
              <View className='flex flex-row gap-4'>
                <ToggleSwitch
                  isOn={isEnabled[0]}
                  trackOnStyle={{backgroundColor:"#00c951"}}
                  trackOffStyle={{backgroundColor:"#364153"}}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={()=>handleToggle(0)}
                />
                <Pressable onPress={()=>handleModal("blue-400","#51a2ff")}>
                  <EllipsisVertical 
                    color={THEME.light.background}
                  />
                </Pressable>
              </View>
            </View>

            <View className='flex flex-row items-center justify-between gap-3'>
              <View className={`flex flex-row gap-3 ${isEnabled[1] ? 'opacity-100' : 'opacity-25'}`}>
                <View className='px-3 py-2 rounded-lg bg-foreground/10'>
                  <Tv 
                    size={28}
                    color={"#8e51ff"}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Television</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
                </View>
              </View>
              <View className='flex flex-row gap-4'>
                <ToggleSwitch
                  isOn={isEnabled[1]}
                  trackOnStyle={{backgroundColor:"#00c951"}}
                  trackOffStyle={{backgroundColor:"#364153"}}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={()=>handleToggle(1)}
                />
                <Pressable onPress={()=>handleModal("purple-500","#8e51ff")}>
                  <EllipsisVertical 
                    color={THEME.light.background}
                  />
                </Pressable>
              </View>
            </View>

            <View className='flex flex-row items-center justify-between gap-3'>
              <View className={`flex flex-row gap-3 ${isEnabled[2] ? 'opacity-100' : 'opacity-25'}`}>
                <View className='px-3 py-2 rounded-lg bg-foreground/10'>
                  <Refrigerator 
                    size={28}
                    color={"#05df72"}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Refrigerator</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
                </View>
              </View>
              <View className='flex flex-row gap-4'>
                <ToggleSwitch
                  isOn={isEnabled[2]}
                  trackOnStyle={{backgroundColor:"#00c951"}}
                  trackOffStyle={{backgroundColor:"#364153"}}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={()=>handleToggle(2)}
                />
                <Pressable onPress={()=>handleModal("green-400","#05df72")}>
                  <EllipsisVertical 
                    color={THEME.light.background}
                  />
                </Pressable>
              </View>
            </View>

            <View className='flex flex-row items-center justify-between gap-3'>
              <View className={`flex flex-row gap-3 ${isEnabled[3] ? 'opacity-100' : 'opacity-25'}`}>
                <View className='px-3 py-2 rounded-lg bg-foreground/10'>
                  <Microwave 
                    size={28}
                    color={THEME.dark.foreground}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Microwave</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
                </View>
              </View>
              <View className='flex flex-row gap-4'>
                <ToggleSwitch
                  isOn={isEnabled[3]}
                  trackOnStyle={{backgroundColor:"#00c951"}}
                  trackOffStyle={{backgroundColor:"#364153"}}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={()=>handleToggle(3)}
                />
                <Pressable onPress={()=>handleModal("foreground",THEME.dark.foreground)}>
                  <EllipsisVertical 
                    color={THEME.light.background}
                  />
                </Pressable>
              </View>
            </View>

            <View className='flex flex-row items-center justify-between gap-3'>
              <View className={`flex flex-row gap-3 ${isEnabled[4] ? 'opacity-100' : 'opacity-25'}`}>
                <View className='px-3 py-2 rounded-lg bg-foreground/10'>
                  <Lightbulb 
                    size={28}
                    color={"#fcc800"}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Lights</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
                </View>
              </View>
              <View className='flex flex-row gap-4'>
                <ToggleSwitch
                  isOn={isEnabled[4]}
                  trackOnStyle={{backgroundColor:"#00c951"}}
                  trackOffStyle={{backgroundColor:"#364153"}}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={()=>handleToggle(4)}
                />
                <Pressable onPress={()=>handleModal("yellow-400","#fcc800")}>
                  <EllipsisVertical 
                    color={THEME.light.background}
                  />
                </Pressable>
              </View>
            </View>
            

          </View>
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
          >
            <View className='flex-1 bg-background/80 py-12 px-4'>
              <Pressable onPress={()=>setModalVisible(false)}>
                <ChevronLeft 
                  size={32}
                  color={THEME.dark.foreground}
                />
              </Pressable>
              <View className='flex flex-row justify-center mb-4'>
                <Monitor 
                  size={128}
                  color={modalColorHex}
                />
              </View>
              <View className='flex flex-column items-center mb-4'>
                <Text className='text-2xl font-bold'>Personal Computer</Text>
                <Text className='text-[10px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
              </View>
              <View className='flex flex-row gap-3'>
                <View className='flex-1 p-2 pb-4 px-4 bg-[#141414] rounded-lg'>
                  <Text className={`text-${modalColor} font-semibold`}>AVERAGE</Text>
                  <View className='flex flex-row items-end'>
                    <Text className='text-3xl font-semibold'>1,857</Text>
                    <Text className='text-2xl font-bold text-foreground/20'>w</Text>
                  </View>
                  <Text className='text-[10px] font-light text-foreground/60'>When Status is On</Text>
                </View>
                <View className='p-2 pb-4 px-4 bg-[#141414] rounded-lg'>
                  <Text className={`text-${modalColor} font-semibold`}>COST</Text>
                  <View className='flex flex-row items-end'>
                    <Text className='text-3xl font-semibold'>P520</Text>
                    <Text className='text-2xl font-bold text-foreground/20'>/yr</Text>
                  </View>
                  <Text className='text-[10px] font-light text-foreground/60'>based on your usage</Text>
                </View>
              </View>
              <View className='flex-1 mt-3 mb-4 p-4 bg-[#141414] rounded-lg'>
                <View className='flex flex-row items-center'>
                  <Text className={`text-xl text-${modalColor} font-semibold`}>USAGE</Text>
                  <Text className='px-2'>|</Text>
                  <View className='flex-1 flex flex-row justify-between items-center'>
                    <Text className='text-xs'>This Week</Text>
                    <View className='flex flex-row gap-3 mr-4'>
                      <Text className={`text-lg border-b-2 border-${modalColor}`}>WK</Text>
                      {/* <Text className='text-lg text-foreground/20'>YR</Text> */}
                    </View>
                  </View>
                </View>
                <DeviceUsageBarChart colorHex={modalColorHex} />
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </>
  )
}