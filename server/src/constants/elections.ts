export type ElectionStatus = 'upcoming' | 'open' | 'closed';

export function electionStatus(startsAt: Date, endsAt: Date, now = new Date()): ElectionStatus {
  if (now < startsAt) return 'upcoming';
  if (now > endsAt) return 'closed';
  return 'open';
}

export function electionPeriodLabel(startsAt: Date, endsAt: Date, now = new Date()): string {
  const status = electionStatus(startsAt, endsAt, now);
  const dateLabel = (value: Date) =>
    value.toLocaleDateString([], { month: 'short', day: 'numeric' });

  if (status === 'upcoming') {
    return `Opens ${dateLabel(startsAt)}`;
  }
  if (status === 'open') {
    const diff = endsAt.getTime() - now.getTime();
    const days = Math.ceil(diff / 86_400_000);
    if (days <= 1) {
      const hours = Math.max(1, Math.ceil(diff / 3_600_000));
      return `Voting closes in ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `Voting closes in ${days} days`;
  }
  return `Closed ${dateLabel(endsAt)}`;
}
