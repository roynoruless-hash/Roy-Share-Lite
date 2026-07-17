export interface LuckySpinEvent {
  id: string;
  name: string;
  description: string;
  bannerUrl: string;
  prizePerWinner: number;
  totalWinners: number;
  maxParticipants: number;
  status: "Draft" | "Live" | "Paused" | "Ended";
  createdAt: string;
  participantsCount: number;
  remainingSlots: number;
  adsType: "Disabled" | "Reward Ad" | "Interstitial Ad" | "Task Ad";
  spinState: {
    status: "waiting" | "countdown" | "ready" | "spinning" | "paused" | "winner_selected" | "ended";
    countdown: number;
    startedAt?: string;
    pausedAt?: string;
    winnerId?: string;
    winnerName?: string;
    isMuted?: boolean;
    replayCount?: number;
  };
  currentViewers: number;
}

export interface LuckySpinParticipant {
  id: string; // eventId_telegramId
  eventId: string;
  telegramId: string;
  username: string;
  realName: string;
  joinTime: string;
}

export interface LuckySpinWinner {
  id: string; // eventId_telegramId
  eventId: string;
  eventName: string;
  telegramId: string;
  username: string;
  winnerName: string; // Real Name
  prize: number;
  winningTime: string;
  walletStatus: "Pending" | "Credited" | "Failed";
  creditStatus: string;
  bannerUrl?: string;
}
