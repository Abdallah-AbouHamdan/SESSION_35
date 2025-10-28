import type { BrowserContext, Page, Route, Request } from '@playwright/test';

type MockUser = {
  id: string;
  email: string;
  fullName?: string;
  password: string;
  familyId: string | null;
  role: 'admin' | 'member';
};

type MockFamily = {
  id: string;
  name: string;
  members: Set<string>;
};

type MockInvite = {
  token: string;
  familyId: string;
  email?: string;
  expiresAt: string;
  acceptedBy?: string;
};

type MockItem = {
  id: string;
  listId: string;
  familyId: string;
  title: string;
  quantity?: string;
  category?: string;
  notes?: string;
  status: 'pending' | 'done';
  createdAt: string;
};

type MockList = {
  id: string;
  familyId: string;
  items: string[];
};

type MockState = {
  users: Map<string, MockUser>;
  tokens: Map<string, string>;
  families: Map<string, MockFamily>;
  invites: Map<string, MockInvite>;
  lists: Map<string, MockList>;
  items: Map<string, MockItem>;
  familyActiveList: Map<string, string>;
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const isoInFuture = (days = 7) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const mapUser = (user: MockUser) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  familyId: user.familyId,
});

const familyMembers = (family: MockFamily, state: MockState) =>
  Array.from(family.members).map((memberId) => {
    const member = state.users.get(memberId)!;
    return {
      id: member.id,
      email: member.email,
      full_name: member.fullName,
      role: member.role,
    };
  });

const listItemsForFamily = (familyId: string, state: MockState) => {
  const listId = state.familyActiveList.get(familyId);
  if (!listId) return [];
  const list = state.lists.get(listId);
  if (!list) return [];
  return list.items
    .map((itemId) => state.items.get(itemId)!)
    .filter(Boolean);
};

const respond = (
  route: Route,
  body: any,
  status = 200,
) =>
  route.fulfill({
    status,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });

const unauthorized = (route: Route) =>
  respond(route, { error: 'Unauthorized' }, 401);

export const createMockApi = (options?: { baseUrl?: string }) => {
  const baseUrl = options?.baseUrl ?? 'http://localhost:4000';
  const origin = new URL(baseUrl).origin;
  const state: MockState = {
    users: new Map(),
    tokens: new Map(),
    families: new Map(),
    invites: new Map(),
    lists: new Map(),
    items: new Map(),
    familyActiveList: new Map(),
  };

  let userCounter = 0;
  let familyCounter = 0;
  let inviteCounter = 0;
  let listCounter = 0;
  let itemCounter = 0;

  const newId = (prefix: string, counter: number) => `${prefix}_${counter}`;

  const ensureActiveList = (familyId: string) => {
    const existing = state.familyActiveList.get(familyId);
    if (existing) return state.lists.get(existing)!;
    const listId = newId('list', ++listCounter);
    state.familyActiveList.set(familyId, listId);
    const list: MockList = { id: listId, familyId, items: [] };
    state.lists.set(listId, list);
    return list;
  };

  const userFromRequest = (request: Request): MockUser | null => {
    const authHeader = request.headers()['authorization'];
    if (!authHeader) return null;
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = state.tokens.get(token);
    if (!userId) return null;
    return state.users.get(userId) ?? null;
  };

  const handle = async (route: Route, request: Request) => {
    const url = new URL(request.url());
    if (!url.origin.startsWith(origin)) {
      return route.continue();
    }

    const { pathname } = url;
    const method = request.method();

    const requireAuth = (): MockUser | null => {
      const user = userFromRequest(request);
      if (!user) {
        unauthorized(route);
        return null;
      }
      return user;
    };

    const parseBody = () => {
      const raw = request.postData();
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    };

    // Auth endpoints
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = parseBody() as {
        email?: string;
        password?: string;
        fullName?: string;
      };
      if (!body.email || !body.password) {
        return respond(route, { error: 'Missing credentials' }, 400);
      }
      for (const user of state.users.values()) {
        if (user.email.toLowerCase() === body.email.toLowerCase()) {
          return respond(route, { error: 'Email already registered' }, 400);
        }
      }
      const userId = newId('user', ++userCounter);
      const user: MockUser = {
        id: userId,
        email: body.email,
        fullName: body.fullName,
        password: body.password,
        familyId: null,
        role: 'member',
      };
      state.users.set(userId, user);
      const token = `token-${userId}-${Date.now()}`;
      state.tokens.set(token, userId);
      return respond(route, {
        token,
        user: mapUser(user),
      });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = parseBody() as { email?: string; password?: string };
      const user = Array.from(state.users.values()).find(
        (candidate) =>
          candidate.email.toLowerCase() === (body.email ?? '').toLowerCase(),
      );
      if (!user || user.password !== body.password) {
        return respond(route, { error: 'Invalid credentials' }, 401);
      }
      const token = `token-${user.id}-${Date.now()}`;
      state.tokens.set(token, user.id);
      return respond(route, { token, user: mapUser(user) });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = userFromRequest(request);
      if (!user) {
        return respond(route, { error: 'Unauthorized' }, 401);
      }
      return respond(route, { user: mapUser(user) });
    }

    // Family endpoints
    if (pathname === '/api/families' && method === 'POST') {
      const user = requireAuth();
      if (!user) return;
      const body = parseBody() as { name?: string };
      if (!body.name) {
        return respond(route, { error: 'Family name required' }, 400);
      }
      const familyId = newId('family', ++familyCounter);
      const family: MockFamily = {
        id: familyId,
        name: body.name,
        members: new Set([user.id]),
      };
      state.families.set(familyId, family);
      user.familyId = familyId;
      user.role = 'admin';
      ensureActiveList(familyId);
      const token = `token-${user.id}-${Date.now()}`;
      state.tokens.set(token, user.id);
      return respond(route, {
        family: { id: family.id, name: family.name },
        members: familyMembers(family, state),
        token,
        user: mapUser(user),
      });
    }

    if (pathname === '/api/families/me' && method === 'GET') {
      const user = requireAuth();
      if (!user) return;
      if (!user.familyId) {
        return respond(route, { family: null, members: [] });
      }
      const family = state.families.get(user.familyId);
      if (!family) {
        return respond(route, { family: null, members: [] });
      }
      return respond(route, {
        family: { id: family.id, name: family.name },
        members: familyMembers(family, state),
      });
    }

    // Invite endpoints
    if (pathname === '/api/invites' && method === 'POST') {
      const user = requireAuth();
      if (!user) return;
      if (!user.familyId) {
        return respond(route, { error: 'Create family first' }, 400);
      }
      const family = state.families.get(user.familyId)!;
      const body = parseBody() as { email?: string };
      const token = `invite-${++inviteCounter}`;
      const invite: MockInvite = {
        token,
        familyId: family.id,
        email: body.email,
        expiresAt: isoInFuture(),
      };
      state.invites.set(token, invite);
      const list = ensureActiveList(family.id);
      // ensure list exists (side effect)
      state.lists.set(list.id, list);
      return respond(route, {
        invite: { token, expiresAt: invite.expiresAt, email: invite.email },
        link: `${baseUrl.replace(/\/$/, '')}/invite/${token}`,
      });
    }

    if (pathname === '/api/invites/sent' && method === 'GET') {
      const user = requireAuth();
      if (!user) return;
      if (!user.familyId) {
        return respond(route, { invites: [] });
      }
      const invites = Array.from(state.invites.values())
        .filter(
          (invite) =>
            invite.familyId === user.familyId && !invite.acceptedBy,
        )
        .map((invite) => ({
          token: invite.token,
          expiresAt: invite.expiresAt,
          email: invite.email,
        }));
      return respond(route, { invites });
    }

    if (pathname === '/api/invites/my' && method === 'GET') {
      const user = requireAuth();
      if (!user) return;
      const invites = Array.from(state.invites.values())
        .filter(
          (invite) =>
            !invite.acceptedBy &&
            (!!invite.email &&
              invite.email.toLowerCase() === user.email.toLowerCase()),
        )
        .map((invite) => ({
          token: invite.token,
          expiresAt: invite.expiresAt,
          email: invite.email,
        }));
      return respond(route, { invites });
    }

    if (pathname === '/api/invites/accept' && method === 'POST') {
      const user = requireAuth();
      if (!user) return;
      const body = parseBody() as { token?: string };
      if (!body.token) {
        return respond(route, { error: 'Token required' }, 400);
      }
      const invite = state.invites.get(body.token);
      if (!invite) {
        return respond(route, { error: 'Invalid invite' }, 400);
      }
      const family = state.families.get(invite.familyId);
      if (!family) {
        return respond(route, { error: 'Family not found' }, 400);
      }
      invite.acceptedBy = user.id;
      family.members.add(user.id);
      user.familyId = family.id;
      user.role = user.role || 'member';
      const token = `token-${user.id}-${Date.now()}`;
      state.tokens.set(token, user.id);
      return respond(route, {
        token,
        family: { id: family.id, name: family.name },
        members: familyMembers(family, state),
        user: mapUser(user),
      });
    }

    // Lists & items
    if (pathname === '/api/lists/active' && method === 'GET') {
      const user = requireAuth();
      if (!user) return;
      if (!user.familyId) {
        return respond(route, { error: 'No family' }, 400);
      }
      const list = ensureActiveList(user.familyId);
      const items = list.items
        .map((itemId) => state.items.get(itemId)!)
        .map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          category: item.category,
          notes: item.notes,
          status: item.status,
          createdAt: item.createdAt,
        }));
      return respond(route, { listId: list.id, items });
    }

    if (pathname === '/api/lists/archives' && method === 'GET') {
      const user = requireAuth();
      if (!user) return;
      return respond(route, { archives: [] });
    }

    if (pathname === '/api/items' && method === 'POST') {
      const user = requireAuth();
      if (!user) return;
      if (!user.familyId) {
        return respond(route, { error: 'No family selected' }, 400);
      }
      const body = parseBody() as {
        title?: string;
        quantity?: string;
        category?: string;
        notes?: string;
      };
      if (!body.title) {
        return respond(route, { error: 'Title required' }, 400);
      }
      const list = ensureActiveList(user.familyId);
      const itemId = newId('item', ++itemCounter);
      const item: MockItem = {
        id: itemId,
        listId: list.id,
        familyId: user.familyId,
        title: body.title,
        quantity: body.quantity,
        category: body.category,
        notes: body.notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      state.items.set(itemId, item);
      list.items.push(itemId);
      return respond(route, item);
    }

    if (pathname.startsWith('/api/items/') && method === 'PATCH') {
      const user = requireAuth();
      if (!user) return;
      const idMatch = pathname.match(/^\/api\/items\/([^/]+)(?:\/toggle)?$/);
      if (!idMatch) {
        return respond(route, { error: 'Invalid item id' }, 400);
      }
      const item = state.items.get(idMatch[1]);
      if (!item) {
        return respond(route, { error: 'Item not found' }, 404);
      }
      if (pathname.endsWith('/toggle')) {
        item.status = item.status === 'pending' ? 'done' : 'pending';
        state.items.set(item.id, item);
        return respond(route, { id: item.id, status: item.status });
      }
      const body = parseBody() as Partial<MockItem>;
      item.title = body.title ?? item.title;
      item.quantity = body.quantity ?? item.quantity;
      item.category = body.category ?? item.category;
      item.notes = body.notes ?? item.notes;
      state.items.set(item.id, item);
      return respond(route, item);
    }

    if (pathname.startsWith('/api/items/') && method === 'DELETE') {
      const user = requireAuth();
      if (!user) return;
      const id = pathname.replace('/api/items/', '');
      const item = state.items.get(id);
      if (!item) {
        return respond(route, { error: 'Item not found' }, 404);
      }
      const list = state.lists.get(item.listId);
      if (list) {
        list.items = list.items.filter((itemId) => itemId !== id);
        state.lists.set(list.id, list);
      }
      state.items.delete(id);
      return respond(route, { ok: true });
    }

    if (pathname === '/api/lists/weekly-reset' && method === 'POST') {
      const user = requireAuth();
      if (!user) return;
      return respond(route, { ok: true });
    }

    // Fallback for unhandled requests
    return respond(route, { error: `Unhandled mock route ${method} ${pathname}` }, 404);
  };

  const attachPage = async (page: Page) => {
    await page.route('**/api/**', handle);
  };

  const attachContext = async (context: BrowserContext) => {
    await context.route('**/api/**', handle);
  };

  return {
    attachPage,
    attachContext,
    reset() {
      state.users.clear();
      state.tokens.clear();
      state.families.clear();
      state.invites.clear();
      state.lists.clear();
      state.items.clear();
      state.familyActiveList.clear();
      userCounter = 0;
      familyCounter = 0;
      inviteCounter = 0;
      listCounter = 0;
      itemCounter = 0;
    },
  };
};
