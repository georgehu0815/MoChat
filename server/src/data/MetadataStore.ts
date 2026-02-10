/**
 * Metadata Store - Manages configurations, sessions, panels, workspaces, and subscriptions
 */

import { Session, Panel, Workspace, Group, InviteCode, Subscription } from '../types';

export class MetadataStore {
  private sessions: Map<string, Session> = new Map();
  private panels: Map<string, Panel> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private groups: Map<string, Group> = new Map();
  private inviteCodes: Map<string, InviteCode> = new Map();
  private subscriptions: Map<string, Subscription[]> = new Map(); // userId -> subscriptions[]
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> sessionIds
  private groupPanels: Map<string, string[]> = new Map(); // groupId -> panelIds[]

  // ========== Sessions ==========

  createSession(session: Session): Session {
    this.sessions.set(session.id, session);

    // Index participants
    session.participants.forEach(userId => {
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(session.id);
    });

    return session;
  }

  getSessionById(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionsByUser(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId) || new Set();
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((session): session is Session => session !== undefined);
  }

  updateSession(sessionId: string, updates: Partial<Session>): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.sessions.set(sessionId, updated);

    // Update participant index if participants changed
    if (updates.participants) {
      // Remove old participants
      session.participants.forEach(userId => {
        this.userSessions.get(userId)?.delete(sessionId);
      });
      // Add new participants
      updates.participants.forEach(userId => {
        if (!this.userSessions.has(userId)) {
          this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId)!.add(sessionId);
      });
    }

    return updated;
  }

  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.participants.forEach(userId => {
      this.userSessions.get(userId)?.delete(sessionId);
    });

    return this.sessions.delete(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  // ========== Panels ==========

  createPanel(panel: Panel): Panel {
    this.panels.set(panel.id, panel);

    const panelIds = this.groupPanels.get(panel.groupId) || [];
    panelIds.push(panel.id);
    this.groupPanels.set(panel.groupId, panelIds);

    return panel;
  }

  getPanelById(panelId: string): Panel | undefined {
    return this.panels.get(panelId);
  }

  getPanelsByGroup(groupId: string): Panel[] {
    const panelIds = this.groupPanels.get(groupId) || [];
    return panelIds
      .map(id => this.panels.get(id))
      .filter((panel): panel is Panel => panel !== undefined);
  }

  updatePanel(panelId: string, updates: Partial<Panel>): Panel | undefined {
    const panel = this.panels.get(panelId);
    if (!panel) return undefined;

    const updated = { ...panel, ...updates, updatedAt: new Date() };
    this.panels.set(panelId, updated);
    return updated;
  }

  deletePanel(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) return false;

    const panelIds = this.groupPanels.get(panel.groupId);
    if (panelIds) {
      const index = panelIds.indexOf(panelId);
      if (index !== -1) panelIds.splice(index, 1);
    }

    return this.panels.delete(panelId);
  }

  // ========== Workspaces ==========

  createWorkspace(workspace: Workspace): Workspace {
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  getWorkspaceById(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Workspace | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const updated = { ...workspace, ...updates, updatedAt: new Date() };
    this.workspaces.set(workspaceId, updated);
    return updated;
  }

  // ========== Groups ==========

  createGroup(group: Group): Group {
    this.groups.set(group.id, group);
    return group;
  }

  getGroupById(groupId: string): Group | undefined {
    return this.groups.get(groupId);
  }

  getGroupsByWorkspace(workspaceId: string): Group[] {
    return Array.from(this.groups.values()).filter(
      group => group.workspaceId === workspaceId
    );
  }

  updateGroup(groupId: string, updates: Partial<Group>): Group | undefined {
    const group = this.groups.get(groupId);
    if (!group) return undefined;

    const updated = { ...group, ...updates, updatedAt: new Date() };
    this.groups.set(groupId, updated);
    return updated;
  }

  // ========== Invite Codes ==========

  createInviteCode(inviteCode: InviteCode): InviteCode {
    this.inviteCodes.set(inviteCode.code, inviteCode);
    return inviteCode;
  }

  getInviteCode(code: string): InviteCode | undefined {
    return this.inviteCodes.get(code);
  }

  updateInviteCode(code: string, updates: Partial<InviteCode>): InviteCode | undefined {
    const inviteCode = this.inviteCodes.get(code);
    if (!inviteCode) return undefined;

    const updated = { ...inviteCode, ...updates };
    this.inviteCodes.set(code, updated);
    return updated;
  }

  deleteInviteCode(code: string): boolean {
    return this.inviteCodes.delete(code);
  }

  // ========== Subscriptions ==========

  addSubscription(subscription: Subscription): void {
    const subs = this.subscriptions.get(subscription.userId) || [];
    // Check if already subscribed
    const exists = subs.some(
      s =>
        s.sessionId === subscription.sessionId &&
        s.panelId === subscription.panelId
    );
    if (!exists) {
      subs.push(subscription);
      this.subscriptions.set(subscription.userId, subs);
    }
  }

  removeSubscription(userId: string, sessionId?: string, panelId?: string): void {
    const subs = this.subscriptions.get(userId);
    if (!subs) return;

    const filtered = subs.filter(
      s =>
        !(
          (sessionId && s.sessionId === sessionId) ||
          (panelId && s.panelId === panelId)
        )
    );

    this.subscriptions.set(userId, filtered);
  }

  getSubscriptions(userId: string): Subscription[] {
    return this.subscriptions.get(userId) || [];
  }

  getSessionSubscribers(sessionId: string): string[] {
    const subscribers: string[] = [];
    this.subscriptions.forEach((subs, userId) => {
      if (subs.some(s => s.sessionId === sessionId)) {
        subscribers.push(userId);
      }
    });
    return subscribers;
  }

  getPanelSubscribers(panelId: string): string[] {
    const subscribers: string[] = [];
    this.subscriptions.forEach((subs, userId) => {
      if (subs.some(s => s.panelId === panelId)) {
        subscribers.push(userId);
      }
    });
    return subscribers;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.sessions.clear();
    this.panels.clear();
    this.workspaces.clear();
    this.groups.clear();
    this.inviteCodes.clear();
    this.subscriptions.clear();
    this.userSessions.clear();
    this.groupPanels.clear();
  }
}
