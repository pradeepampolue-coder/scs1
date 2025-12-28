
import { Message, UserRole } from '../types';

/**
 * P2P Service
 * In a native environment, this would interface with Bluetooth/LoRa/Satellite.
 * Here, we use BroadcastChannel to simulate local device-to-device traffic.
 */
export class P2PService {
  private channel: BroadcastChannel;
  private onMessageReceived: (msg: any) => void;

  constructor(onMessageReceived: (msg: any) => void) {
    this.channel = new BroadcastChannel('aegis_p2p_net');
    this.onMessageReceived = onMessageReceived;
    this.channel.onmessage = (event) => {
      this.onMessageReceived(event.data);
    };
  }

  broadcast(payload: any) {
    // Only send to the "other" peer simulation
    this.channel.postMessage(payload);
  }

  close() {
    this.channel.close();
  }
}
