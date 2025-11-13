type DeviceData = {
  id: number;
  name: string;
  color: string;
  power: string;
  percentage: number;
};

export const device: DeviceData[] = [
  {
    id: 1,
    name: 'Oven',
    color: '#3b82f6',
    power: '4.2kW',
    percentage: 10
  },
  {
    id: 2,
    name: 'PC',
    color: '#10b981',
    power: '8.2kW',
    percentage: 25
  }
]