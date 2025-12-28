
export enum UserRole {
  USER_A = 'USER_A',
  USER_B = 'USER_B'
}

export interface Message {
  id: string;
  sender: UserRole;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file' | 'location';
  isEncrypted: boolean;
  location?: LocationData;
}

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number;
}

export enum CommsChannel {
  SATELLITE = 'SATELLITE',
  MESH = 'P2P_MESH',
  DIRECT = 'WIFI_DIRECT',
  OFFLINE = 'DISCONNECTED'
}

export interface SystemState {
  isLocked: boolean;
  activeChannel: CommsChannel;
  signalStrength: number;
  lastSync: number;
  tamperDetected: boolean;
}

export interface SecuritySession {
  role: UserRole;
  pinHash: string;
  sessionKey: string | null;
}
