export const MOCK_ROOM_CODE = 'KIND01';

export const CLAIM_STORAGE_KEY = 'kindsight.claimedName';

export type RosterEntry = {
  name: string;
  claimed: boolean;
};

export const MOCK_ROSTER: RosterEntry[] = [
  {name: 'Amira', claimed: false},
  {name: 'Ben', claimed: true},
  {name: 'Chen', claimed: false},
  {name: 'Dana', claimed: false},
  {name: 'Farah', claimed: true},
  {name: 'Mei', claimed: false},
  {name: 'Noah', claimed: false},
  {name: 'Priya', claimed: true},
  {name: 'Tariq', claimed: false},
  {name: 'Wei', claimed: false},
];
