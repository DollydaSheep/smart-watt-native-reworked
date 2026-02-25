import { THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { Text } from '@/components/ui/text';
import { Pressable, View } from "react-native";


export default function CalendarComponent({ onConfirm, setCalendarModalOpen } : { onConfirm?: (date: string, iso: string) => void; setCalendarModalOpen?: (open: boolean) => void}) {
	const { colorScheme } = useColorScheme();
	
	const today = new Date().toISOString().split("T")[0];
	const day = new Date().toISOString().split("T")[0];
	const [selectedDate, setSelectedDate] = useState(today);
	const [selectedDateTimeStamp, setSelectedDateTimeStamp] = useState<any | null>()

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
				firstDay={1}
				// Hide day names. Default = false
				hideDayNames={false}
				// Show week numbers to the left. Default = false
				onPressArrowLeft={subtractMonth => subtractMonth()}
				// Handler which gets executed when press arrow icon right. It receive a callback can go next month
				onPressArrowRight={addMonth => addMonth()}
				// Disable left arrow. Default = false
				markingType="custom"
				enableSwipeMonths={true}
				markedDates={{
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
				}}
			/>

			<View className='flex-row gap-12 px-12 pt-4'>
				<Pressable className='flex-1 py-2 bg-background border border-foreground/50 rounded-full items-center justify-center' onPress={()=>setCalendarModalOpen?.(false)}>
					<Text className='text-sm'>BACK</Text>
				</Pressable>
				<Pressable className='flex-1 py-2 bg-green-600 rounded-full items-center justify-center' 
					onPress={() => {
						if (!selectedDate) return;

						onConfirm?.(selectedDate, selectedDateTimeStamp);
						setCalendarModalOpen?.(false);
					}}
				>
					<Text className='text-sm'>CONFIRM</Text>
				</Pressable>
			</View>
			
		</>
	)
}