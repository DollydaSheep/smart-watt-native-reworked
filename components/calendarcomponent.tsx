import { THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { Text } from '@/components/ui/text';
import { Pressable, View } from "react-native";
import { useStats } from "@/lib/statsContext";


export default function CalendarComponent({ 
	onConfirm, 
	setCalendarModalOpen, 
	initialDate
} : { 
	onConfirm?: (date: string, iso: string) => void; 
	setCalendarModalOpen?: (open: boolean) => void;
	initialDate?: string;
}) {
	const { colorScheme } = useColorScheme();

	const { mode } = useStats();
	
	const today = new Date().toISOString().split("T")[0];
	const day = new Date().toISOString().split("T")[0];
	const [selectedDate, setSelectedDate] = useState(initialDate ?? today);
	const [selectedDateTimeStamp, setSelectedDateTimeStamp] = useState<string | null>(null);

	const [selectedWeek, setSelectedWeek] = useState<string[]>([]);

	const darkTheme = {
    backgroundColor: THEME.dark.background,
    calendarBackground: THEME.dark.background,
    textSectionTitleColor: '#FFF',
    dayTextColor: '#FFF',
    todayTextColor: '#47EE92',
    selectedDayBackgroundColor: '#00adf5',
    selectedDayTextColor: '#000',
    arrowColor: '#ffffffff',
    monthTextColor: '#FFF',
    textDisabledColor: '#555',
    dotColor: '#BB86FC',
    selectedDotColor: '#000',
  };

	function getWeekDates(dateString: string) {
		const date = new Date(dateString);
		const day = date.getDay(); // 0 = Sunday

		const sunday = new Date(date);
		sunday.setDate(date.getDate() - day);

		const week: string[] = [];

		for (let i = 0; i < 7; i++) {
			const d = new Date(sunday);
			d.setDate(sunday.getDate() + i);
			week.push(d.toISOString().split("T")[0]);
		}

		return week;
	}

	function buildWeekMarkedDates(
		selectedDate: string,
		selectedWeek: string[],
		today: string,
		mode: "daily" | "week" | "month" | "year"
	) {
		if (mode !== "week") {
			return {
				[today]: {
					...(selectedDate === today
						? { selected: true, selectedColor: "#47EE92" }
						: { marked: true, dotColor: "#47EE92" }),
				},
				...(selectedDate !== today && {
					[selectedDate]: {
						selected: true,
						selectedColor: "#47EE92",
					},
				}),
			};
		}

		const weekMarks: Record<string, any> = {};

		selectedWeek.forEach((date, index) => {
			if (index === 0) {
				weekMarks[date] = {
					startingDay: true,
					color: "#47EE92",
					textColor: "#000",
				};
			} else if (index === selectedWeek.length - 1) {
				weekMarks[date] = {
					endingDay: true,
					color: "#47EE92",
					textColor: "#000",
				};
			} else {
				weekMarks[date] = {
					color: "#47EE92",
					textColor: "#000",
				};
			}
		});

		// keep today visible if it's outside selected week
		if (!weekMarks[today]) {
			weekMarks[today] = {
				marked: true,
				dotColor: "#47EE92",
				textColor: "#FFF",
			};
		}

		return weekMarks;
	}

	const markedDates = buildWeekMarkedDates(
		selectedDate,
		selectedWeek,
		today,
		mode
	);

	useEffect(()=>{
		setSelectedWeek(getWeekDates(selectedDate));
	}, [mode])

	return (
		<>
			<Text className="pb-4 text-4xl font-bold">
				{new Date(selectedDate).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				})}
			</Text>
			<Calendar 
				style={{borderRadius: 20, height: 370, width: 300}}
				theme={darkTheme}
				// Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
				monthFormat={'yyyy MMMM'}
				// Handler which gets executed when visible month changes in calendar. Default = undefined
				onDayPress={day => {
					console.log('selected day', day);
					setSelectedDate(day.dateString);
					setSelectedDateTimeStamp(new Date(day.timestamp).toISOString())

					if (mode === "week") {
						setSelectedWeek(getWeekDates(day.dateString));
					} else {
						setSelectedWeek([]);
					}
				}}
				// Hide month navigation arrows. Default = false
				hideArrows={false}
				// Replace default arrows with custom ones (direction can be 'left' or 'right')
				// Do not show days of other months in month page. Default = false
				hideExtraDays={true}
				// If hideArrows = false and hideExtraDays = false do not switch month when tapping on greyed out
				// day from another month that is visible in calendar page. Default = false
				disableMonthChange={false}
				// If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday
				firstDay={0}
				// Hide day names. Default = false
				hideDayNames={false}
				// Show week numbers to the left. Default = false
				onPressArrowLeft={subtractMonth => subtractMonth()}
				// Handler which gets executed when press arrow icon right. It receive a callback can go next month
				onPressArrowRight={addMonth => addMonth()}
				// Disable left arrow. Default = false
				markingType={mode === "week" ? "period" : "custom"}
				enableSwipeMonths={true}
				markedDates={markedDates}
			/>

			<View className='flex-row gap-12 px-12 pt-4'>
				<Pressable className='flex-1 py-2 bg-background border border-foreground/50 rounded-full items-center justify-center' onPress={()=>setCalendarModalOpen?.(false)}>
					<Text className='text-sm'>BACK</Text>
				</Pressable>
				<Pressable className='flex-1 py-2 bg-green-600 rounded-full items-center justify-center' 
					onPress={() => {
						if (!selectedDate) return;

						const iso = selectedDateTimeStamp ?? new Date(selectedDate).toISOString();

						onConfirm?.(selectedDate, iso);
						setCalendarModalOpen?.(false);
					}}
				>
					<Text className='text-sm'>CONFIRM</Text>
				</Pressable>
			</View>
			
		</>
	)
}