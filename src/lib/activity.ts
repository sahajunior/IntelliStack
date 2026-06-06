export const activityTypes = [
  "user_joined",
  "plan_upgraded",
  "session_started",
  "report_generated",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  actorName: string;
  message: string;
  createdAt: string;
};

export function privateOrgChannel(orgId: string) {
  return `private-org-${orgId}`;
}

export function presenceOrgChannel(orgId: string) {
  return `presence-org-${orgId}`;
}
