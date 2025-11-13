export type SensorData = {
  totalWattage: string;
  voltage: string;
  current: string;
  timestamp: string;
};

export type NotifData = {
  time: string;
  message: string;
}

export type Device = {
  id: number;
  name: string;
  color: string;
  basePower: number;
  percentage: number;
  timeStamp: string;
}

export type DeviceData = {
  devices: Device[];
  totalUsage: number;
  powerLimit: number;
}