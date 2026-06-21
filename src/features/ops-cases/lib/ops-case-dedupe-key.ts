export function referralRewardFailedDedupeKey(referralId: string): string {
  return `referral_reward_failed:${referralId}`;
}
