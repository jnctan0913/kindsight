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

// --- Music transport (client-to-client) ---------------------------------------
// The big screen is the only speaker; the console remote-commands it. Kept on a
// separate channel so transport chatter never mixes with the DB ping stream.
// Room-level on/off (music_on) still goes through the DB settings RPC.

export type MusicCommand =
  | {cmd: 'playpause'}
  | {cmd: 'skip'}
  | {cmd: 'mute'; value: boolean}
  | {cmd: 'volume'; value: number};

export type MusicChannel = {
  send: (command: MusicCommand) => void;
  unsubscribe: () => void;
};

export function subscribeMusic(
  roomId: string,
  onCommand?: (command: MusicCommand) => void
): MusicChannel {
  const supabase = getSupabase();
  const channel: RealtimeChannel = supabase.channel(`music:${roomId}`, {
    config: {broadcast: {self: false}},
  });

  if (onCommand) {
    channel.on('broadcast', {event: 'music'}, (message) => {
      onCommand((message?.payload ?? {}) as MusicCommand);
    });
  }

  channel.subscribe();

  return {
    send: (command) => {
      void channel.send({type: 'broadcast', event: 'music', payload: command});
    },
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
