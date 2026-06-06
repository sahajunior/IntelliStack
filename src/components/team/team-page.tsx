"use client";

import { useOrganization } from "@clerk/nextjs";
import { useState } from "react";

import { InviteModal } from "@/components/team/invite-modal";
import type { OrganizationRole } from "@/server/team/policy";
import { trpc } from "@/trpc/client";

function roleLabel(role: string) {
  return role === "org:admin" ? "Administrator" : "Member";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TeamPage() {
  const { isLoaded, membership } = useOrganization();
  const isAdmin = isLoaded && membership?.role === "org:admin";
  const utils = trpc.useUtils();
  const membersQuery = trpc.team.getMembers.useQuery();
  const invitationsQuery = trpc.team.getPendingInvitations.useQuery();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateRole = trpc.team.updateRole.useMutation({
    onMutate: async (input) => {
      setActionError(null);
      await utils.team.getMembers.cancel();
      const previous = utils.team.getMembers.getData();

      utils.team.getMembers.setData(undefined, (current) =>
        current
          ? {
              ...current,
              members: current.members.map((member) =>
                member.userId === input.userId
                  ? { ...member, role: input.role }
                  : member,
              ),
            }
          : current,
      );

      return { previous };
    },
    onError: (error, _input, context) => {
      setActionError(error.message);
      utils.team.getMembers.setData(undefined, context?.previous);
    },
    onSettled: () => utils.team.getMembers.invalidate(),
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onMutate: async (input) => {
      setActionError(null);
      await utils.team.getMembers.cancel();
      const previous = utils.team.getMembers.getData();

      utils.team.getMembers.setData(undefined, (current) =>
        current
          ? {
              ...current,
              totalCount: Math.max(0, current.totalCount - 1),
              members: current.members.filter(
                (member) => member.userId !== input.userId,
              ),
            }
          : current,
      );

      return { previous };
    },
    onError: (error, _input, context) => {
      setActionError(error.message);
      utils.team.getMembers.setData(undefined, context?.previous);
    },
    onSettled: () => {
      setRemovingUserId(null);
      return utils.team.getMembers.invalidate();
    },
  });

  const cancelInvitation = trpc.team.cancelInvitation.useMutation({
    onMutate: async (input) => {
      setActionError(null);
      await utils.team.getPendingInvitations.cancel();
      const previous = utils.team.getPendingInvitations.getData();

      utils.team.getPendingInvitations.setData(undefined, (current) =>
        current
          ? {
              ...current,
              totalCount: Math.max(0, current.totalCount - 1),
              invitations: current.invitations.filter(
                (invitation) => invitation.id !== input.invitationId,
              ),
            }
          : current,
      );

      return { previous };
    },
    onError: (error, _input, context) => {
      setActionError(error.message);
      utils.team.getPendingInvitations.setData(undefined, context?.previous);
    },
    onSettled: () => utils.team.getPendingInvitations.invalidate(),
  });

  const members = membersQuery.data?.members ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];
  const currentUserId = membersQuery.data?.currentUserId;
  const adminCount = members.filter(
    (member) => member.role === "org:admin",
  ).length;

  return (
    <>
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Workspace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Team</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              View organization members and manage access through Clerk.
            </p>
          </div>
          {isAdmin ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => setInviteOpen(true)}
              type="button"
            >
              <span className="text-lg leading-none">+</span>
              Invite member
            </button>
          ) : (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              View only
            </span>
          )}
        </div>

        {actionError ? (
          <div className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span>{actionError}</span>
            <button
              className="font-semibold"
              onClick={() => setActionError(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Members</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {membersQuery.data?.totalCount ?? 0} organization members
              </p>
            </div>
          </div>

          {membersQuery.isPending ? (
            <div className="space-y-3 p-5 sm:p-6" aria-label="Loading members">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                  key={item}
                />
              ))}
            </div>
          ) : membersQuery.error ? (
            <div className="p-6 text-sm text-rose-700">
              Members could not be loaded: {membersQuery.error.message}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const canManage =
                  isAdmin && !isCurrentUser && Boolean(member.userId);
                const cannotDemoteLastAdmin =
                  member.role === "org:admin" && adminCount <= 1;

                return (
                  <li
                    className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center"
                    key={member.id}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        aria-label={`${member.name} avatar`}
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-100 bg-cover bg-center text-sm font-semibold text-indigo-700"
                        style={
                          member.imageUrl
                            ? { backgroundImage: `url("${member.imageUrl}")` }
                            : undefined
                        }
                      >
                        {member.imageUrl ? null : initials(member.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-slate-950">
                            {member.name}
                          </p>
                          {isCurrentUser ? (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                              You
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-sm text-slate-500">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[9rem_9rem_auto] lg:flex">
                      <span className="text-sm text-slate-500">
                        Joined {formatDate(member.joinedAt)}
                      </span>
                      {canManage ? (
                        <select
                          aria-label={`Role for ${member.name}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          disabled={
                            updateRole.isPending || cannotDemoteLastAdmin
                          }
                          onChange={(event) =>
                            updateRole.mutate({
                              userId: member.userId,
                              role: event.target.value as OrganizationRole,
                            })
                          }
                          value={member.role}
                        >
                          <option value="org:member">Member</option>
                          <option value="org:admin">Administrator</option>
                        </select>
                      ) : (
                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {roleLabel(member.role)}
                        </span>
                      )}

                      {canManage ? (
                        removingUserId === member.userId ? (
                          <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
                            <button
                              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                              disabled={removeMember.isPending}
                              onClick={() =>
                                removeMember.mutate({
                                  userId: member.userId,
                                })
                              }
                              type="button"
                            >
                              Confirm
                            </button>
                            <button
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
                              disabled={removeMember.isPending}
                              onClick={() => setRemovingUserId(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="col-span-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 sm:col-span-1"
                            onClick={() => setRemovingUserId(member.userId)}
                            type="button"
                          >
                            Remove
                          </button>
                        )
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Pending invitations
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Invitations awaiting acceptance
            </p>
          </div>

          {invitationsQuery.isPending ? (
            <div className="space-y-3 p-5 sm:p-6">
              {[0, 1].map((item) => (
                <div
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                  key={item}
                />
              ))}
            </div>
          ) : invitationsQuery.error ? (
            <div className="p-6 text-sm text-rose-700">
              Invitations could not be loaded:{" "}
              {invitationsQuery.error.message}
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-slate-700">
                No pending invitations
              </p>
              <p className="mt-1 text-sm text-slate-500">
                New invitations will appear here until they are accepted.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invitations.map((invitation) => (
                <li
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  key={invitation.id}
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {invitation.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {roleLabel(invitation.role)} · Sent{" "}
                      {formatDate(invitation.createdAt)} · Expires{" "}
                      {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  {isAdmin ? (
                    <button
                      className="w-fit rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:text-slate-400"
                      disabled={cancelInvitation.isPending}
                      onClick={() =>
                        cancelInvitation.mutate({
                          invitationId: invitation.id,
                        })
                      }
                      type="button"
                    >
                      Cancel invitation
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {inviteOpen ? (
        <InviteModal onClose={() => setInviteOpen(false)} />
      ) : null}
    </>
  );
}
