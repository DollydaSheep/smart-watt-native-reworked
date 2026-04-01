import CalendarComponent from '@/components/calendarcomponent';
import DeviceUsageBarChart from '@/components/devicechart';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { useStats, type ApplianceDailyStat } from '@/lib/statsContext';
import { THEME } from '@/lib/theme';
import {
  ChevronLeft,
  EllipsisVertical,
  Microwave,
  Monitor,
  Tv,
  WashingMachine,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native';
import {
  VictoryPie,
  VictoryBar,
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLegend,
  VictoryTheme,
} from 'victory-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 32;

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

type WeeklyApplianceDayPoint = {
  date: string;
  total_energy_kwh: number;
  total_duration_sec: number;
  total_nilm_event_count: number;
  total_manual_app_count: number;
};

type WeeklyApplianceStat = {
  appliance_label: string;
  data: WeeklyApplianceDayPoint[];
};

type PendingToggleCommand = {
  index: number;
  deviceLabel: string;
  action: 'ON' | 'OFF';
  matchedStateW: number;
} | null;

const BAR_COLOR_BY_LABEL: Record<string, string> = {
  pc: 'bg-blue-400',
  television: 'bg-violet-500',
  tv: 'bg-violet-500',
  'washing machine': 'bg-green-400',
  'rice cooker': 'bg-yellow-400',
  unlabeled: 'bg-foreground',
};

const PIE_COLOR_BY_LABEL: Record<string, string> = {
  pc: '#51a2ff',
  television: '#8e51ff',
  tv: '#8e51ff',
  'washing machine': '#05df72',
  'rice cooker': '#fcc800',
  unlabeled: '#a1a1aa',
};

const BAR_LABEL_ORDER = [
  'pc',
  'television',
  'tv',
  'washing machine',
  'unlabeled',
  'rice cooker',
];

const DEVICE_LABEL_MAP: Record<string, string[]> = {
  pc: ['personal computer', 'htpc', 'pc'],
  television: ['television', 'tv'],
  'washing machine': ['washing machine'],
  'rice cooker': ['rice cooker'],
  lights: ['lights', 'light'],
};

function getBarColor(label: string) {
  return BAR_COLOR_BY_LABEL[label.toLowerCase()] ?? 'bg-foreground';
}

function getPieColor(label: string) {
  return PIE_COLOR_BY_LABEL[label.toLowerCase()] ?? '#a1a1aa';
}

function formatApplianceLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === 'pc') return 'Personal Computer';
  if (normalized === 'tv') return 'Television';
  if (normalized === 'television') return 'Television';
  if (normalized === 'washing machine') return 'Washing Machine';
  if (normalized === 'rice cooker') return 'Rice Cooker';
  if (normalized === 'unlabeled') return 'Unlabeled';

  return label.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  return `${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
}

function getPhilippineDateString() {
  const now = new Date();
  const phNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return phNow.toISOString().slice(0, 10);
}

function to24HourArray(profile: any) {
  if (Array.isArray(profile)) {
    return profile.map((v: any) => Number(v ?? 0));
  }

  const result = Array(24).fill(0);

  if (profile && typeof profile === 'object') {
    Object.entries(profile).forEach(([hourKey, value]) => {
      const hour = Number(String(hourKey).split(':')[0]);
      if (!Number.isNaN(hour) && hour >= 0 && hour < 24) {
        result[hour] = Number(value ?? 0);
      }
    });
  }

  return result;
}

function formatShortLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized === 'pc') return 'PC';
  if (normalized === 'television' || normalized === 'tv') return 'TV';
  if (normalized === 'washing machine') return 'WM';
  if (normalized === 'rice cooker') return 'RC';
  if (normalized === 'unlabeled') return 'Other';
  return label.slice(0, 3).toUpperCase();
}

function formatWeekDateLabel(date: string) {
  const parsed = new Date(date);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatWeekRangeFromDates(dates: string[]) {
  if (!dates.length) return '';

  const sorted = [...dates].sort((a, b) => a.localeCompare(b));
  const start = new Date(sorted[0]);
  const end = new Date(sorted[sorted.length - 1]);

  const startText = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const endText = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startText} - ${endText}`;
}

export default function DevicesTabScreen() {
  const [isEnabled, setIsEnabled] = useState<boolean[]>([true, true, true, true, true]);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState(getPhilippineDateString());
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false);
  const [pendingToggleCommand, setPendingToggleCommand] = useState<PendingToggleCommand>(null);
  const [submittingToggle, setSubmittingToggle] = useState(false);

  const [modalColor, setModalColor] = useState<string>('');
  const [modalColorHex, setModalColorHex] = useState<string>('');
  const [deviceIcon, setDeviceIcon] = useState<string>('');
  const [selectedApplianceLabel, setSelectedApplianceLabel] = useState<string>('');

  const [dailyContributionRows, setDailyContributionRows] = useState<ContributionRow[]>([]);
  const [totalDailyKwh, setTotalDailyKwh] = useState(0);

  const [summaryCarouselIndex, setSummaryCarouselIndex] = useState(0);
  const [weeklyApplianceStats, setWeeklyApplianceStats] = useState<WeeklyApplianceStat[]>([]);
  const [weeklyStatsLoading, setWeeklyStatsLoading] = useState(false);
  const [weeklyStatsLoadedForAnchor, setWeeklyStatsLoadedForAnchor] = useState<string | null>(null);

  const summaryScrollRef = useRef<ScrollView | null>(null);

  const {
    applianceDailyStats,
    setApplianceDailyStats,
    setApplianceDailyStatsLoading,
    setSelectedDate,
    refreshDevicesKey,
  } = useStats();

  const fetchDailyContribution = async (day: string) => {
    const { data, error } = await supabase.rpc('get_daily_appliance_contribution', {
      p_day: day,
      p_tz: 'Asia/Manila',
    });

    if (error) {
      console.log('Fetch get_daily_appliance_contribution error:', error);
      return;
    }

    const rows: ContributionRow[] = (data ?? []).map((row: any) => ({
      label: String(row.label ?? ''),
      percent: Number(row.percent ?? 0),
      energy_kwh: Number(row.energy_kwh ?? 0),
    }));

    setDailyContributionRows(rows);
    setTotalDailyKwh(rows.reduce((sum, row) => sum + row.energy_kwh, 0));
  };

  const fetchApplianceDailyStats = async (date: string) => {
    try {
      setApplianceDailyStatsLoading(true);

      const response = await fetch(
        `https://smartwatt-server.netlify.app/.netlify/functions/api/appliance-stats/daily?date=${date}&tz=Asia/Manila`
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to fetch appliance daily stats');
      }

      const rows: ApplianceDailyStat[] = (json?.data ?? []).map((item: any) => ({
        reading_date: String(item.reading_date ?? ''),
        appliance_label: String(item.appliance_label ?? ''),
        total_energy_kwh: Number(item.total_energy_kwh ?? 0),
        total_duration_sec: Number(item.total_duration_sec ?? 0),
        hourly_energy_kwh_profile: to24HourArray(item.hourly_energy_kwh_profile),
        hourly_duration_sec_profile: to24HourArray(item.hourly_duration_sec_profile),
        total_nilm_event_count: Number(item.total_nilm_event_count ?? 0),
        total_manual_app_count: Number(item.total_manual_app_count ?? 0),
      }));

      setApplianceDailyStats(rows);
    } catch (error: any) {
      console.log('Fetch /appliance-stats/daily error:', error);
      setApplianceDailyStats([]);
    } finally {
      setApplianceDailyStatsLoading(false);
    }
  };

  const fetchWeeklyApplianceStats = async (date: string) => {
    try {
      if (weeklyStatsLoadedForAnchor === date || weeklyStatsLoading) return;

      setWeeklyStatsLoading(true);

      const response = await fetch(
        `https://smartwatt-server.netlify.app/.netlify/functions/api/appliance-stats/weekly?date=${date}&tz=Asia/Manila`
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || 'Failed to fetch weekly appliance stats');
      }

      const rows: WeeklyApplianceStat[] = (json?.data ?? []).map((item: any) => ({
        appliance_label: String(item.appliance_label ?? ''),
        data: Array.isArray(item.data)
          ? item.data.map((point: any) => ({
              date: String(point.date ?? ''),
              total_energy_kwh: Number(point.total_energy_kwh ?? 0),
              total_duration_sec: Number(point.total_duration_sec ?? 0),
              total_nilm_event_count: Number(point.total_nilm_event_count ?? 0),
              total_manual_app_count: Number(point.total_manual_app_count ?? 0),
            }))
          : [],
      }));

      setWeeklyApplianceStats(rows);
      setWeeklyStatsLoadedForAnchor(date);
    } catch (error: any) {
      console.log('Fetch /appliance-stats/weekly error:', error);
      setWeeklyApplianceStats([]);
      setWeeklyStatsLoadedForAnchor(null);
    } finally {
      setWeeklyStatsLoading(false);
    }
  };

  const insertApplianceCommand = async (
    applianceLabel: string,
    action: 'ON' | 'OFF',
    matchedStateW: number
  ) => {
    const { error } = await supabase.from('appliance_commands').insert({
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
      const possibleLabels =
        DEVICE_LABEL_MAP[device.label.toLowerCase()] ?? [device.label.toLowerCase()];
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
    fetchDailyContribution(confirmedDate);
    fetchApplianceDailyStats(confirmedDate);

    if (weeklyStatsLoadedForAnchor && weeklyStatsLoadedForAnchor !== confirmedDate) {
      setWeeklyApplianceStats([]);
      setWeeklyStatsLoadedForAnchor(null);
    }

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
  }, [confirmedDate, refreshDevicesKey]);

  useEffect(() => {
    if (summaryModalOpen && summaryCarouselIndex === 1) {
      fetchWeeklyApplianceStats(confirmedDate);
    }
  }, [summaryModalOpen, summaryCarouselIndex, confirmedDate]);

  const handleToggle = (index: number) => {
    const nextState = !isEnabled[index];
    const device = DEVICES[index];
    const action: 'ON' | 'OFF' = nextState ? 'ON' : 'OFF';

    setPendingToggleCommand({
      index,
      deviceLabel: device.label,
      action,
      matchedStateW: device.matched_state_w,
    });
    setConfirmToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggleCommand || submittingToggle) return;

    try {
      setSubmittingToggle(true);

      const ok = await insertApplianceCommand(
        pendingToggleCommand.deviceLabel,
        pendingToggleCommand.action,
        pendingToggleCommand.matchedStateW
      );

      if (!ok) return;

      setConfirmToggleModalOpen(false);
      setPendingToggleCommand(null);
    } finally {
      setSubmittingToggle(false);
    }
  };

  const handleCancelToggle = () => {
    if (submittingToggle) return;
    setConfirmToggleModalOpen(false);
    setPendingToggleCommand(null);
  };

  const handleModal = (
    color: string,
    colorHex: string,
    device: string,
    applianceLabel: string
  ) => {
    setModalVisible(true);
    setModalColor(color);
    setModalColorHex(colorHex);
    setDeviceIcon(device);
    setSelectedApplianceLabel(applianceLabel);
  };

  const handleSummaryScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / CAROUSEL_WIDTH);
    setSummaryCarouselIndex(nextIndex);
  };

  const sortedContributionRows = [...dailyContributionRows].sort((a, b) => {
    const aLabel = a.label.toLowerCase();
    const bLabel = b.label.toLowerCase();

    const aIsUnlabeled = aLabel === 'unlabeled';
    const bIsUnlabeled = bLabel === 'unlabeled';

    if (aIsUnlabeled && !bIsUnlabeled) return 1;
    if (!aIsUnlabeled && bIsUnlabeled) return -1;

    return b.percent - a.percent;
  });

  const topContributionColor = useMemo(() => {
    const topRow = sortedContributionRows.find(
      (item) => item.label.toLowerCase() !== 'unlabeled'
    );

    return topRow ? getPieColor(topRow.label) : '#51a2ff';
  }, [sortedContributionRows]);

  const pieChartData = useMemo(() => {
    return sortedContributionRows
      .filter((item) => item.percent > 0)
      .map((item) => ({
        x: formatApplianceLabel(item.label),
        y: Number(item.percent),
        energy_kwh: Number(item.energy_kwh),
        label: item.label,
      }));
  }, [sortedContributionRows]);

  const compactPieInfo = useMemo(() => {
    return sortedContributionRows
      .filter((item) => item.percent > 0)
      .slice(0, 4)
      .map((item) => ({
        ...item,
        label_display: formatShortLabel(item.label),
      }));
  }, [sortedContributionRows]);

  const weeklyDates = useMemo(() => {
    const dateSet = new Set<string>();
    weeklyApplianceStats.forEach((appliance) => {
      appliance.data.forEach((point) => {
        if (point.date) dateSet.add(point.date);
      });
    });

    return Array.from(dateSet).sort((a, b) => a.localeCompare(b));
  }, [weeklyApplianceStats]);

  const weeklyChartSeries = useMemo(() => {
    return weeklyApplianceStats
      .slice()
      .sort((a, b) => a.appliance_label.localeCompare(b.appliance_label))
      .map((appliance) => {
        const pointMap = new Map(
          appliance.data.map((point) => [point.date, Number(point.total_energy_kwh ?? 0)])
        );

        return {
          appliance_label: appliance.appliance_label,
          data: weeklyDates.map((date) => ({
            x: formatWeekDateLabel(date),
            y: pointMap.get(date) ?? 0,
            label: appliance.appliance_label,
          })),
        };
      });
  }, [weeklyApplianceStats, weeklyDates]);

  const weeklyTotalEnergy = useMemo(
    () =>
      weeklyApplianceStats.reduce(
        (sum, appliance) =>
          sum +
          appliance.data.reduce((inner, point) => inner + point.total_energy_kwh, 0),
        0
      ),
    [weeklyApplianceStats]
  );

  const weeklyTotalRuntime = useMemo(
    () =>
      weeklyApplianceStats.reduce(
        (sum, appliance) =>
          sum +
          appliance.data.reduce((inner, point) => inner + point.total_duration_sec, 0),
        0
      ),
    [weeklyApplianceStats]
  );

  const weeklyTotalEvents = useMemo(
    () =>
      weeklyApplianceStats.reduce(
        (sum, appliance) =>
          sum +
          appliance.data.reduce(
            (inner, point) => inner + point.total_nilm_event_count + point.total_manual_app_count,
            0
          ),
        0
      ),
    [weeklyApplianceStats]
  );

  const weeklyTopAppliance = useMemo(() => {
    if (!weeklyApplianceStats.length) return null;

    const withTotals = weeklyApplianceStats.map((appliance) => ({
      appliance_label: appliance.appliance_label,
      total_energy_kwh: appliance.data.reduce((sum, point) => sum + point.total_energy_kwh, 0),
    }));

    return withTotals.sort((a, b) => b.total_energy_kwh - a.total_energy_kwh)[0] ?? null;
  }, [weeklyApplianceStats]);

  const summaryModalDateText = useMemo(() => {
    if (summaryCarouselIndex === 1 && weeklyDates.length > 0) {
      return formatWeekRangeFromDates(weeklyDates);
    }

    return confirmedDate === getPhilippineDateString()
      ? 'Today'
      : new Date(confirmedDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  }, [summaryCarouselIndex, weeklyDates, confirmedDate]);

  const selectedApplianceStat = useMemo(() => {
    const selected = normalizeLabel(selectedApplianceLabel);

    return applianceDailyStats.find((item) => {
      const itemLabel = normalizeLabel(item.appliance_label);
      const aliases = DEVICE_LABEL_MAP[selected] ?? [selected];
      return aliases.includes(itemLabel);
    });
  }, [applianceDailyStats, selectedApplianceLabel]);

  const modalEnergyKwh = selectedApplianceStat?.total_energy_kwh ?? 0;
  const modalDurationSec = selectedApplianceStat?.total_duration_sec ?? 0;
  const modalNilmCount = selectedApplianceStat?.total_nilm_event_count ?? 0;
  const modalManualCount = selectedApplianceStat?.total_manual_app_count ?? 0;

  return (
    <>
      {confirmedDate === getPhilippineDateString() ? (
        <Pressable
          className="self-end absolute -top-12 right-6 border border-foreground rounded-full px-6 py-1 z-10"
          onPress={() => setCalendarModalOpen(true)}
        >
          <Text className="text-sm font-light">Today</Text>
        </Pressable>
      ) : (
        <Pressable
          className="self-end absolute -top-12 right-6 bg-green-600 rounded-full px-6 py-1 z-10"
          onPress={() => setCalendarModalOpen(true)}
        >
          <Text className="text-sm font-light">
            {new Date(confirmedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
      )}

      <View className="flex-1 px-4">
        <Pressable
          onPress={() => {
            setSummaryCarouselIndex(0);
            setSummaryModalOpen(true);
          }}
        >
          <View className="flex flex-row justify-between items-center">
            <Text className="text-5xl font-semibold" style={{ color: topContributionColor }}>
              04
            </Text>
            <View className="flex flex-row items-end">
              <Text className="text-5xl font-semibold">{totalDailyKwh.toFixed(2)}</Text>
              <Text className="text-3xl text-foreground/60 font-medium">kWh</Text>
            </View>
          </View>

          <View className="relative flex flex-row h-2 w-full bg-foreground rounded-full my-4 overflow-hidden">
            {sortedContributionRows.map((item) => (
              <View
                key={item.label}
                className={`h-2 ${getBarColor(item.label)}`}
                style={{ width: `${item.percent}%` }}
              />
            ))}
          </View>
        </Pressable>

        <ScrollView className="flex-1 my-4">
          <View className="flex gap-6">
            <View className="flex flex-row items-center justify-between gap-3">
              <View className={`flex flex-row gap-3 ${isEnabled[0] ? 'opacity-100' : 'opacity-25'}`}>
                <View className="px-3 py-2 rounded-lg bg-foreground/10">
                  <Monitor size={28} color="#51a2ff" />
                </View>
                <View className="flex flex-column justify-center">
                  <Text className="text-base font-medium">Personal Computer</Text>
                  <Text className="text-[7px] text-foreground/60 font-light">
                    Current Run Time:{' '}
                    {formatDuration(
                      applianceDailyStats.find((x) =>
                        ['personal computer', 'htpc', 'pc'].includes(
                          x.appliance_label.toLowerCase()
                        )
                      )?.total_duration_sec ?? 0
                    )}{' '}
                    | State Status: {isEnabled[0] ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row gap-4">
                <ToggleSwitch
                  isOn={isEnabled[0]}
                  trackOnStyle={{ backgroundColor: '#00c951' }}
                  trackOffStyle={{ backgroundColor: '#364153' }}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={() => handleToggle(0)}
                />
                <Pressable
                  onPress={() =>
                    handleModal('blue-400', '#51a2ff', 'Personal Computer', 'pc')
                  }
                >
                  <EllipsisVertical color={THEME.light.background} />
                </Pressable>
              </View>
            </View>

            <View className="flex flex-row items-center justify-between gap-3">
              <View className={`flex flex-row gap-3 ${isEnabled[1] ? 'opacity-100' : 'opacity-25'}`}>
                <View className="px-3 py-2 rounded-lg bg-foreground/10">
                  <Tv size={28} color="#8e51ff" />
                </View>
                <View className="flex flex-column justify-center">
                  <Text className="text-base font-medium">Television</Text>
                  <Text className="text-[7px] text-foreground/60 font-light">
                    Current Run Time:{' '}
                    {formatDuration(
                      applianceDailyStats.find((x) =>
                        ['television', 'tv'].includes(x.appliance_label.toLowerCase())
                      )?.total_duration_sec ?? 0
                    )}{' '}
                    | State Status: {isEnabled[1] ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row gap-4">
                <ToggleSwitch
                  isOn={isEnabled[1]}
                  trackOnStyle={{ backgroundColor: '#00c951' }}
                  trackOffStyle={{ backgroundColor: '#364153' }}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={() => handleToggle(1)}
                />
                <Pressable
                  onPress={() =>
                    handleModal('purple-500', '#8e51ff', 'Television', 'television')
                  }
                >
                  <EllipsisVertical color={THEME.light.background} />
                </Pressable>
              </View>
            </View>

            <View className="flex flex-row items-center justify-between gap-3">
              <View className={`flex flex-row gap-3 ${isEnabled[2] ? 'opacity-100' : 'opacity-25'}`}>
                <View className="px-3 py-2 rounded-lg bg-foreground/10">
                  <WashingMachine size={28} color="#05df72" />
                </View>
                <View className="flex flex-column justify-center">
                  <Text className="text-base font-medium">Washing Machine</Text>
                  <Text className="text-[7px] text-foreground/60 font-light">
                    Current Run Time:{' '}
                    {formatDuration(
                      applianceDailyStats.find(
                        (x) => x.appliance_label.toLowerCase() === 'washing machine'
                      )?.total_duration_sec ?? 0
                    )}{' '}
                    | State Status: {isEnabled[2] ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row gap-4">
                <ToggleSwitch
                  isOn={isEnabled[2]}
                  trackOnStyle={{ backgroundColor: '#00c951' }}
                  trackOffStyle={{ backgroundColor: '#364153' }}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={() => handleToggle(2)}
                />
                <Pressable
                  onPress={() =>
                    handleModal('green-400', '#05df72', 'Washing Machine', 'washing machine')
                  }
                >
                  <EllipsisVertical color={THEME.light.background} />
                </Pressable>
              </View>
            </View>

            <View className="flex flex-row items-center justify-between gap-3">
              <View className={`flex flex-row gap-3 ${isEnabled[3] ? 'opacity-100' : 'opacity-25'}`}>
                <View className="px-3 py-2 rounded-lg bg-foreground/10">
                  <Microwave size={28} color="#fcc800" />
                </View>
                <View className="flex flex-column justify-center">
                  <Text className="text-base font-medium">Rice Cooker</Text>
                  <Text className="text-[7px] text-foreground/60 font-light">
                    Current Run Time:{' '}
                    {formatDuration(
                      applianceDailyStats.find(
                        (x) => x.appliance_label.toLowerCase() === 'rice cooker'
                      )?.total_duration_sec ?? 0
                    )}{' '}
                    | State Status: {isEnabled[3] ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row gap-4">
                <ToggleSwitch
                  isOn={isEnabled[3]}
                  trackOnStyle={{ backgroundColor: '#00c951' }}
                  trackOffStyle={{ backgroundColor: '#364153' }}
                  onColor="green"
                  offColor="red"
                  label=""
                  size="medium"
                  onToggle={() => handleToggle(3)}
                />
                <Pressable
                  onPress={() =>
                    handleModal('yellow-400', '#fcc800', 'Rice Cooker', 'rice cooker')
                  }
                >
                  <EllipsisVertical color={THEME.light.background} />
                </Pressable>
              </View>
            </View>
          </View>

          <Modal animationType="fade" transparent visible={modalVisible}>
            <View className="flex-1 bg-background/80 py-12 px-4">
              <Pressable onPress={() => setModalVisible(false)}>
                <ChevronLeft size={32} color={THEME.dark.foreground} />
              </Pressable>

              <View className="flex flex-row justify-center mb-4">
                {deviceIcon === 'Personal Computer' ? (
                  <Monitor size={128} color={modalColorHex} />
                ) : deviceIcon === 'Television' ? (
                  <Tv size={128} color={modalColorHex} />
                ) : deviceIcon === 'Washing Machine' ? (
                  <WashingMachine size={128} color={modalColorHex} />
                ) : deviceIcon === 'Rice Cooker' ? (
                  <Microwave size={128} color={modalColorHex} />
                ) : null}
              </View>

              <View className="flex flex-column items-center mb-4">
                <Text className="text-2xl font-bold">{deviceIcon}</Text>
                <Text className="text-[10px] text-foreground/60 font-light">
                  Current Run Time: {formatDuration(modalDurationSec)} | State Status:{' '}
                  {selectedApplianceLabel
                    ? isEnabled[
                        DEVICES.findIndex(
                          (d) => d.label.toLowerCase() === selectedApplianceLabel.toLowerCase()
                        )
                      ]
                      ? 'On'
                      : 'Off'
                    : 'Off'}
                </Text>
              </View>

              <View className="flex flex-row gap-3">
                <View className="flex-1 p-2 pb-4 px-4 bg-[#141414] rounded-lg">
                  <Text className="font-semibold" style={{ color: modalColorHex }}>
                    ESTIMATED ENERGY
                  </Text>
                  <View className="flex flex-row items-end">
                    <Text className="text-3xl font-semibold">
                      {modalEnergyKwh.toFixed(3)}
                    </Text>
                    <Text className="text-2xl font-bold text-foreground/20">kWh</Text>
                  </View>
                  <Text className="text-[10px] font-light text-foreground/60">
                    based on selected day&apos;s usage
                  </Text>
                </View>

                <View className="p-2 pb-4 px-4 bg-[#141414] rounded-lg">
                  <Text className="font-semibold" style={{ color: modalColorHex }}>
                    EVENTS
                  </Text>
                  <View className="flex flex-row items-end">
                    <Text className="text-3xl font-semibold">
                      {modalNilmCount + modalManualCount}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-light text-foreground/60">
                    NILM: {modalNilmCount} | Manual: {modalManualCount}
                  </Text>
                </View>
              </View>

              <View className="flex-1 mt-3 mb-4 p-4 bg-[#141414] rounded-lg">
                <View className="flex flex-row items-center">
                  <Text className="text-xl font-semibold" style={{ color: modalColorHex }}>
                    USAGE
                  </Text>
                  <Text className="px-2">|</Text>
                  <View className="flex-1 flex flex-row justify-between items-center">
                    <Pressable onPress={() => setCalendarModalOpen(true)}>
                      <Text className="text-xs underline">
                        {confirmedDate === getPhilippineDateString()
                          ? 'Today'
                          : new Date(confirmedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                      </Text>
                    </Pressable>

                    <View className="flex flex-row gap-3 mr-4">
                      <Text
                        className="text-lg border-b-2"
                        style={{ borderBottomColor: modalColorHex }}
                      >
                        DAY
                      </Text>
                    </View>
                  </View>
                </View>

                <DeviceUsageBarChart
                  colorHex={modalColorHex}
                  applianceLabel={selectedApplianceLabel}
                />
              </View>
            </View>
          </Modal>

          <Modal transparent visible={summaryModalOpen} animationType="fade">
            <View className="flex-1 bg-background/85 py-12 px-4">
              <Pressable onPress={() => setSummaryModalOpen(false)}>
                <ChevronLeft size={32} color={THEME.dark.foreground} />
              </Pressable>

              <View className="items-center mt-2 mb-3">
                <Text className="text-lg font-bold">
                  {summaryCarouselIndex === 1 ? 'Weekly Appliance Consumption' : 'Appliance Energy Breakdown'}
                </Text>
                <Text className="text-xs text-foreground/60">
                  {summaryModalDateText}
                </Text>
              </View>

              <View className="flex-row justify-center gap-2 mb-3">
                <View
                  className={`h-2 w-8 rounded-full ${
                    summaryCarouselIndex === 0 ? 'bg-foreground' : 'bg-foreground/20'
                  }`}
                />
                <View
                  className={`h-2 w-8 rounded-full ${
                    summaryCarouselIndex === 1 ? 'bg-foreground' : 'bg-foreground/20'
                  }`}
                />
              </View>

              <ScrollView
                ref={(ref) => {
                  summaryScrollRef.current = ref;
                }}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleSummaryScrollEnd}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View style={{ width: CAROUSEL_WIDTH }}>
                  <View className="items-center justify-center bg-[#141414] rounded-2xl p-4 mb-3">
                    {pieChartData.length > 0 ? (
                      <>
                        <VictoryPie
                          data={pieChartData}
                          x="x"
                          y="y"
                          width={320}
                          height={240}
                          innerRadius={58}
                          padAngle={2}
                          colorScale={pieChartData.map((item) => getPieColor(item.label))}
                          labels={({ datum }) => `${Math.round(datum.y)}%`}
                          style={{
                            labels: {
                              fill: '#fff',
                              fontSize: 9,
                              fontWeight: 'bold',
                            },
                          }}
                          animate={{ duration: 500 }}
                        />
                        <View className="items-center -mt-6">
                          <Text className="text-3xl font-semibold">{totalDailyKwh.toFixed(2)}</Text>
                          <Text className="text-xs text-foreground/60">total kWh</Text>
                        </View>
                      </>
                    ) : (
                      <View className="h-[240px] items-center justify-center">
                        <Text className="text-sm text-foreground/60">
                          No contribution data available.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-2 mb-3">
                    {compactPieInfo.map((item) => (
                      <View
                        key={item.label}
                        className="flex-1 bg-[#141414] rounded-xl p-3 border border-foreground/10"
                      >
                        <View className="flex-row items-center gap-2 mb-1">
                          <View
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getPieColor(item.label) }}
                          />
                          <Text className="text-xs font-medium">{item.label_display}</Text>
                        </View>
                        <Text className="text-base font-semibold">{item.percent.toFixed(0)}%</Text>
                        <Text className="text-[10px] text-foreground/60">
                          {item.energy_kwh.toFixed(3)} kWh
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
                      <Text className="text-xs text-foreground/60 mb-1">Top Appliance</Text>
                      <Text className="text-base font-semibold">
                        {pieChartData[0]?.x ?? '--'}
                      </Text>
                      <Text className="text-xs text-foreground/60">
                        {sortedContributionRows[0]
                          ? `${sortedContributionRows[0].energy_kwh.toFixed(3)} kWh`
                          : 'No data'}
                      </Text>
                    </View>

                    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
                      <Text className="text-xs text-foreground/60 mb-1">Tracked Devices</Text>
                      <Text className="text-2xl font-semibold">{pieChartData.length}</Text>
                      <Text className="text-xs text-foreground/60">active contributors</Text>
                    </View>
                  </View>
                </View>

                <View style={{ width: CAROUSEL_WIDTH }}>
                  <View className="bg-[#141414] rounded-2xl p-4 mb-4">
                    <View className="mb-2">
                      <Text className="text-lg font-semibold">Weekly Appliance Consumption</Text>
                      <Text className="text-xs text-foreground/60">
                        Daily energy per appliance for the selected week
                      </Text>
                    </View>

                    {weeklyStatsLoading ? (
                      <View className="h-[360px] items-center justify-center">
                        <Text className="text-sm text-foreground/60">Loading weekly chart...</Text>
                      </View>
                    ) : weeklyChartSeries.length > 0 ? (
                      <>
                        <VictoryChart
                          theme={VictoryTheme.material}
                          domainPadding={{ x: 20, y: 16 }}
                          padding={{ top: 20, bottom: 70, left: 58, right: 20 }}
                          height={360}
                          width={CAROUSEL_WIDTH - 16}
                        >
                          <VictoryAxis
                            style={{
                              tickLabels: { fill: '#aaa', fontSize: 9, angle: -20 },
                              axis: { stroke: '#555' },
                              grid: { stroke: 'transparent' },
                            }}
                          />
                          <VictoryAxis
                            dependentAxis
                            tickFormat={(t) => `${Number(t).toFixed(3)}`}
                            style={{
                              tickLabels: { fill: '#ddd', fontSize: 10 },
                              axis: { stroke: 'transparent' },
                              grid: { stroke: '#333', strokeDasharray: '4,4' },
                            }}
                          />
                          <VictoryGroup
                            offset={4}
                          >
                            {weeklyChartSeries.map((series) => (
                              <VictoryBar
                                key={series.appliance_label}
                                data={series.data}
                                x="x"
                                y="y"
                                barWidth={10}
                                labels={() => null}
                                labelComponent={<></>}
                                style={{
                                  data: {
                                    fill: getPieColor(series.appliance_label),
                                  },
                                }}
                              />
                            ))}
                          </VictoryGroup>
                        </VictoryChart>

                        <VictoryLegend
                          x={10}
                          y={0}
                          orientation="horizontal"
                          gutter={14}
                          itemsPerRow={2}
                          style={{
                            labels: { fill: '#ddd', fontSize: 10 },
                          }}
                          data={weeklyChartSeries.map((series) => ({
                            name: formatShortLabel(series.appliance_label),
                            symbol: { fill: getPieColor(series.appliance_label) },
                          }))}
                        />
                      </>
                    ) : (
                      <View className="h-[360px] items-center justify-center">
                        <Text className="text-sm text-foreground/60">
                          No weekly data available.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
                      <Text className="text-xs text-foreground/60 mb-1">Weekly Total</Text>
                      <Text className="text-2xl font-semibold">{weeklyTotalEnergy.toFixed(3)}</Text>
                      <Text className="text-xs text-foreground/60">kWh</Text>
                    </View>

                    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
                      <Text className="text-xs text-foreground/60 mb-1">Top Appliance</Text>
                      <Text className="text-base font-semibold">
                        {weeklyTopAppliance
                          ? formatApplianceLabel(weeklyTopAppliance.appliance_label)
                          : '--'}
                      </Text>
                      <Text className="text-xs text-foreground/60">
                        {weeklyTopAppliance
                          ? `${weeklyTopAppliance.total_energy_kwh.toFixed(3)} kWh`
                          : 'No data'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
                      <Text className="text-xs text-foreground/60 mb-1">Weekly Runtime</Text>
                      <Text className="text-lg font-semibold">{formatDuration(weeklyTotalRuntime)}</Text>
                    </View>

                    <View className="flex-1 bg-[#141414] rounded-2xl p-4">
                      <Text className="text-xs text-foreground/60 mb-1">Total Events</Text>
                      <Text className="text-lg font-semibold">{weeklyTotalEvents}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Modal>

          <Modal transparent visible={calendarModalOpen} animationType="fade">
            <View className="flex-1 bg-background/70 items-center justify-center">
              <CalendarComponent
                initialDate={confirmedDate}
                setCalendarModalOpen={(open) => setCalendarModalOpen(open)}
                onConfirm={(date, iso) => {
                  setConfirmedDate(date);
                  setSelectedDate(date);
                  console.log('confirmed:', date, iso);
                }}
              />
            </View>
          </Modal>

          <Modal transparent visible={confirmToggleModalOpen} animationType="fade">
            <View className="flex-1 bg-background/70 items-center justify-center px-6">
              <View className="w-full max-w-md bg-[#141414] rounded-2xl p-5 border border-foreground/10">
                <Text className="text-lg font-semibold mb-2">Confirm Action</Text>

                <Text className="text-sm text-foreground/70 mb-5">
                  {pendingToggleCommand
                    ? `Are you sure you want to turn ${pendingToggleCommand.action === 'ON' ? 'on' : 'off'} ${formatApplianceLabel(
                        pendingToggleCommand.deviceLabel
                      )}?`
                    : 'Are you sure you want to continue?'}
                </Text>

                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handleCancelToggle}
                    className="flex-1 py-3 rounded-xl bg-foreground/10 items-center "
                  >
                    <Text className="font-medium text-sm">Cancel</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmToggle}
                    disabled={submittingToggle}
                    className={`flex-1 py-3 rounded-xl items-center justify-center px-4 ${
                      pendingToggleCommand?.action === 'ON' ? 'bg-green-600' : 'bg-red-600'
                    } ${submittingToggle ? 'opacity-60' : 'opacity-100'}`}
                  >
                    <Text
                      className="font-medium text-white text-sm"
                      numberOfLines={1}
                      
                    >
                      {submittingToggle
                        ? 'Sending...'
                        : pendingToggleCommand?.action === 'ON'
                        ? 'Turn On'
                        : 'Turn Off'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
    </>
  );
}