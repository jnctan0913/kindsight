-- Kindsight M2 migration 7: repair. kindsight_next_phase missed the owner
-- transfer to kindsight_api, so the definer API and the phase-guard trigger
-- were denied execute on it after the blanket function revoke.

alter function public.kindsight_next_phase(public.room_phase) owner to kindsight_api;
