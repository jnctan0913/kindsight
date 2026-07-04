import type {RealtimeChannel} from '@supabase/supabase-js';
import {getSupabase} from './supabase/client';

// Ping-and-pull (ENG-PLAN section 4, D4/D5). One channel per room, topic keyed
// by the unguessable room uuid. The database broadcasts content-free events;
// the caller re-pulls its role snapshot on every ping.
//
//   db write --> realtime.send('room'/'roster'/'notes'/'reveal'/'room_ended')
//               --> onPing(event, payload) --> caller pulls get_snapshot

export type PingEvent = 'room' | 'roster' | 'notes' | 'reveal' | 'room_ended';
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'closed';

const PING_EVENTS: PingEvent[] = ['room', 'roster', 'notes', 'reveal', 'room_ended'];

export type RoomSubscription = {
  unsubscribe: () => void;
};

export function subscribeToRoom(
  roomId: string,
  onPing: (event: PingEvent, payload: Record<string, unknown>) => void,
  onStatus?: (status: ConnectionStatus) => void
): RoomSubscription {
  const supabase = getSupabase();
  const topic = `room:${roomId}`;
  let closed = false;
  let hadError = false;

  const channel: RealtimeChannel = supabase.channel(topic, {
    config: {broadcast: {self: false}},
  });

  for (const event of PING_EVENTS) {
    channel.on('broadcast', {event}, (message) => {
      const payload = (message?.payload ?? {}) as Record<string, unknown>;
      onPing(event, payload);
    });
  }

  onStatus?.('connecting');

  channel.subscribe((status) => {
    if (closed) return;
    switch (status) {
      case 'SUBSCRIBED':
        hadError = false;
        onStatus?.('connected');
        break;
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
        // supabase-js auto-rejoins with backoff; surface reconnecting so the
        // caller shows the banner and re-pulls a snapshot on the next SUBSCRIBED.
        hadError = true;
        onStatus?.('reconnecting');
        break;
      case 'CLOSED':
        onStatus?.(hadError ? 'reconnecting' : 'closed');
        break;
    }
  });

  return {
    unsubscribe: () => {
      closed = true;
      supabase.removeChannel(channel);
    },
  };
}
