import DeviceUsageBarChart from '@/components/devicechart';
import ApplianceUsageRingChart from '@/components/ringchart';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { THEME } from '@/lib/theme';
import { ChevronLeft, EllipsisVertical, Lightbulb, Microwave, Monitor, Refrigerator, Tv, WashingMachine } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native'
import { VictoryBar, VictoryChart } from 'victory-native';

const DEVICES = [
  { label: 'pc', matched_state_w: 50 },
  { label: 'television', matched_state_w: 37 },
  { label: 'washing machine', matched_state_w: 140 },
  { label: 'rice cooker', matched_state_w: 650 },
  { label: 'Lights', matched_state_w: 27 },
];

type ContributionRow = {
  label: string;
  percent: number;
  energy_kwh: number;
};

const BAR_COLOR_BY_LABEL: Record<string, string> = {
  pc: 'bg-blue-400',
  television: 'bg-violet-500',
  tv: 'bg-violet-500',
  'washing machine': 'bg-green-400',
  'rice cooker': 'bg-yellow-400',
  unlabeled: 'bg-foreground',
};

const BAR_LABEL_ORDER = [
  'pc',
  'television',
  'tv',
  'washing machine',
  'unlabeled',
  'rice cooker',
];

function getBarColor(label: string) {
  return BAR_COLOR_BY_LABEL[label.toLowerCase()] ?? 'bg-foreground';
}

export default function DevicesTabScreen(){

  const [isEnabled, setIsEnabled] = useState<boolean[]>([true,true,true,true,true]);
  const [modalVisible, setModalVisible] = useState(false);

  const [modalColor, setModalColor] = useState<string>("");
  const [modalColorHex, setModalColorHex] = useState<string>("");
  const [deviceIcon, setDeviceIcon] = useState<string>("");

  const [dailyContributionRows, setDailyContributionRows] = useState<ContributionRow[]>([]);
  const [totalDailyKwh, setTotalDailyKwh] = useState(0);

  const DEVICE_LABEL_MAP: Record<string, string[]> = {
    'pc': ['personal computer', 'htpc', 'pc'],
    'television': ['television', 'tv'],
    'washing machine': ['washing machine'],
    'rice cooker': ['rice cooker'],
    'Lights': ['lights', 'light'],
  };

  const getPhilippineDateString = () => {
    const now = new Date();
    const phNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return phNow.toISOString().slice(0, 10);
  };

  const fetchDailyContribution = async (day: string) => {
    const { data, error } = await supabase.rpc('get_daily_appliance_contribution', {
      p_day: day,
      p_tz: 'Asia/Manila',
    });

    if (error) {
      console.log('Fetch get_daily_appliance_contribution error:', error);
      return;
    }

    console.log(data);

    const rows: ContributionRow[] = (data ?? []).map((row: any) => ({
      label: String(row.label ?? ''),
      percent: Number(row.percent ?? 0),
      energy_kwh: Number(row.energy_kwh ?? 0),
    }));

    console.log('Mapped rows:', JSON.stringify(rows, null, 2));
    console.log(
      'Total daily kWh:',
      rows.reduce((sum, row) => sum + row.energy_kwh, 0)
    );

    setDailyContributionRows(rows);
    setTotalDailyKwh(rows.reduce((sum, row) => sum + row.energy_kwh, 0));
  };

  const insertApplianceCommand = async (
    applianceLabel: string,
    action: 'ON' | 'OFF',
    matchedStateW: number
  ) => {
    const { error } = await supabase
      .from('appliance_commands')
      .insert({
        appliance_label: applianceLabel,
        action,
        matched_state_w: matchedStateW,
        status: 'pending',
      });

    if (error) {
      console.log('Insert appliance_commands error:', error);
      Alert.alert('Command failed', error.message);
      return false;
    }

    console.log(`[COMMAND SENT] ${applianceLabel} -> ${action}`);
    return true;
  };

  const syncDeviceStatesFromDetected = (detected: any[] | null | undefined) => {
    const detectedLabels = new Set(
      (detected ?? []).map((item) => String(item.label ?? '').trim().toLowerCase())
    );

    const nextStates = DEVICES.map((device) => {
      const possibleLabels = DEVICE_LABEL_MAP[device.label] ?? [device.label.toLowerCase()];
      return possibleLabels.some((label) => detectedLabels.has(label));
    });

    setIsEnabled(nextStates);
  };

  const fetchLiveDeviceStates = async () => {
    const { data, error } = await supabase
      .from('energy_readings')
      .select('id, detected_appliances')
      .eq('id', 1)
      .single();

    if (error) {
      console.log('Fetch energy_readings error:', error);
      return;
    }

    syncDeviceStatesFromDetected(data?.detected_appliances);
  };

  useEffect(() => {
    fetchLiveDeviceStates();
    fetchDailyContribution(getPhilippineDateString());

    const channel = supabase
      .channel('energy_readings_live_devices')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'energy_readings',
          filter: 'id=eq.1',
        },
        (payload) => {
          const detected = (payload.new as any)?.detected_appliances;
          syncDeviceStatesFromDetected(detected);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggle = async (index: number) => {
    const nextState = !isEnabled[index];
    const device = DEVICES[index];
    const action: 'ON' | 'OFF' = nextState ? 'ON' : 'OFF';

    const ok = await insertApplianceCommand(
      device.label,
      action,
      device.matched_state_w
    );

    if (!ok) return;
  };

  const handleModal = (color:string, colorHex:string, device:string) => {
    setModalVisible(true);
    setModalColor(color);
    setModalColorHex(colorHex);
    setDeviceIcon(device);
  };

  const sortedContributionRows = [...dailyContributionRows].sort((a, b) => {
    const aIndex = BAR_LABEL_ORDER.indexOf(a.label.toLowerCase());
    const bIndex = BAR_LABEL_ORDER.indexOf(b.label.toLowerCase());

    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;

    return safeA - safeB;
  });


  return(
    <>
      <View className='flex-1 px-4'>
        <View className='flex flex-row justify-between items-center'>
          <Text className='text-blue-400 text-5xl font-semibold'>04</Text>
          <View className='flex flex-row items-end'>
            <Text className='text-5xl font-semibold'>{totalDailyKwh.toFixed(2)}</Text>
            <Text className='text-3xl text-foreground/60 font-medium'>kWh</Text>
          </View>
        </View>
        <View className='relative flex flex-row h-2 w-full bg-foreground rounded-full my-4 overflow-hidden'>
          {sortedContributionRows.map((item) => (
            <View
              key={item.label}
              className={`h-2 ${getBarColor(item.label)}`}
              style={{ width: `${item.percent}%` }}
            />
          ))}
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
                  <Text className='text-[7px] text-foreground/60 font-light'>
                    Current Run Time: 01:10 | State Status: {isEnabled[0] ? 'On' : 'Off'}
                  </Text>
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
                <Pressable onPress={()=>handleModal("blue-400","#51a2ff","Personal Computer")}>
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
                  <Text className='text-[7px] text-foreground/60 font-light'>
                    Current Run Time: 01:10 | State Status: {isEnabled[1] ? 'On' : 'Off'}
                  </Text>
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
                <Pressable onPress={()=>handleModal("purple-500","#8e51ff","Television")}>
                  <EllipsisVertical 
                    color={THEME.light.background}
                  />
                </Pressable>
              </View>
            </View>

            <View className='flex flex-row items-center justify-between gap-3'>
              <View className={`flex flex-row gap-3 ${isEnabled[2] ? 'opacity-100' : 'opacity-25'}`}>
                <View className='px-3 py-2 rounded-lg bg-foreground/10'>
                  <WashingMachine
                    size={28}
                    color={"#05df72"}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Washing Machine</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>
                    Current Run Time: 01:10 | State Status: {isEnabled[2] ? 'On' : 'Off'}
                  </Text>
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
                <Pressable onPress={()=>handleModal("green-400","#05df72", "Washing Machine")}>
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
                    color={"#fcc800"}
                  />
                </View>
                <View className='flex flex-column justify-center'>
                  <Text className='text-base font-medium'>Rice Cooker</Text>
                  <Text className='text-[7px] text-foreground/60 font-light'>
                    Current Run Time: 01:10 | State Status: {isEnabled[3] ? 'On' : 'Off'}
                  </Text>
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
                <Pressable onPress={()=>handleModal("yellow-400","#fcc800", "Rice Cooker")}>
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
                {deviceIcon === "Personal Computer" ? (
                  <Monitor size={128} color={modalColorHex} />
                ) : deviceIcon === "Television" ? (
                  <Tv size={128} color={modalColorHex} />
                ) : deviceIcon === "Washing Machine" ? (
                  <WashingMachine size={128} color={modalColorHex} />
                ) : deviceIcon === "Rice Cooker" ? (
                  <Microwave size={128} color={modalColorHex} />
                ) : ""}
              </View>
              <View className='flex flex-column items-center mb-4'>
                <Text className='text-2xl font-bold'>{deviceIcon}</Text>
                <Text className='text-[10px] text-foreground/60 font-light'>Current Run Time: 01:10 | State Status: On</Text>
              </View>
              <View className='flex flex-row gap-3'>
                <View className='flex-1 p-2 pb-4 px-4 bg-[#141414] rounded-lg'>
                  <Text className={`font-semibold`} style={{color: modalColorHex}}>AVERAGE</Text>
                  <View className='flex flex-row items-end'>
                    <Text className='text-3xl font-semibold'>1,857</Text>
                    <Text className='text-2xl font-bold text-foreground/20'>w</Text>
                  </View>
                  <Text className='text-[10px] font-light text-foreground/60'>When Status is On</Text>
                </View>
                <View className='p-2 pb-4 px-4 bg-[#141414] rounded-lg'>
                  <Text className={`font-semibold`} style={{color: modalColorHex}}>COST</Text>
                  <View className='flex flex-row items-end'>
                    <Text className='text-3xl font-semibold'>P520</Text>
                    <Text className='text-2xl font-bold text-foreground/20'>/yr</Text>
                  </View>
                  <Text className='text-[10px] font-light text-foreground/60'>based on your usage</Text>
                </View>
              </View>
              <View className='flex-1 mt-3 mb-4 p-4 bg-[#141414] rounded-lg'>
                <View className='flex flex-row items-center'>
                  <Text className={`text-xl font-semibold`} style={{color: modalColorHex}}>USAGE</Text>
                  <Text className='px-2'>|</Text>
                  <View className='flex-1 flex flex-row justify-between items-center'>
                    <Text className='text-xs'>This Week</Text>
                    <View className='flex flex-row gap-3 mr-4'>
                      <Text className={`text-lg border-b-2`} style={{borderBottomColor: modalColorHex}}>WK</Text>
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