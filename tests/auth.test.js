'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { AuthService, TOKEN_TTL_SECONDS } = require('../src/auth/authService');
const { UserService } = require('../src/users/userService');

const CREDENTIALS = {
  name: 'Alice',
  email: 'alice@example.com',
  password: 'correct-horse-battery',
};

function makeAuth() {
  return new AuthService(new UserService());
}

function decodePayload(token) {
  const [, payload] = token.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

async function registerAndLogin(auth) {
  const user = await auth.register({ ...CREDENTIALS });
  const session = await auth.login(CREDENTIALS.email, CREDENTIALS.password);
  return { user, session };
}

describe('AuthService', () => {
  describe('register', () => {
    it('never stores the raw password', async () => {
      const auth = makeAuth();

      const user = await auth.register({ ...CREDENTIALS });

      assert.notEqual(user.password, CREDENTIALS.password);
    });

    it('rejects passwords that are too short', async () => {
      const auth = makeAuth();

      await assert.rejects(
        () => auth.register({ ...CREDENTIALS, email: 'short@example.com', password: 'short' }),
        /at least 8 characters/,
      );
    });
  });

  describe('login', () => {
    it('returns a three-part signed token for valid credentials', async () => {
      const auth = makeAuth();

      const { session } = await registerAndLogin(auth);

      assert.ok(session);
      assert.equal(session.token.split('.').length, 3);
      assert.equal(session.user.email, CREDENTIALS.email);
    });

    it('returns null for an unknown email', async () => {
      const auth = makeAuth();
      await auth.register({ ...CREDENTIALS });

      assert.equal(await auth.login('nobody@example.com', CREDENTIALS.password), null);
    });

    it('returns null for a wrong password', async () => {
      const auth = makeAuth();
      await auth.register({ ...CREDENTIALS });

      assert.equal(await auth.login(CREDENTIALS.email, 'wrong-password'), null);
    });
  });

  describe('generateToken', () => {
    it('expires the token after TOKEN_TTL_SECONDS seconds', async () => {
      const auth = makeAuth();

      const { session } = await registerAndLogin(auth);
      const payload = decodePayload(session.token);

      assert.equal(payload.exp - payload.iat, TOKEN_TTL_SECONDS * 1000);
    });
  });

  describe('verifyToken', () => {
    it('decodes a fresh token', async () => {
      const auth = makeAuth();

      const { user, session } = await registerAndLogin(auth);
      const payload = auth.verifyToken(session.token);

      assert.equal(payload.sub, user.id);
      assert.equal(payload.email, CREDENTIALS.email);
    });

    it('rejects a tampered payload', async () => {
      const auth = makeAuth();

      const { session } = await registerAndLogin(auth);
      const [header, , signature] = session.token.split('.');
      const forged = Buffer.from(JSON.stringify({ sub: 1, role: 'admin' })).toString('base64url');

      assert.throws(() => auth.verifyToken(`${header}.${forged}.${signature}`), /invalid token signature/);
    });

    it('rejects a malformed token', () => {
      const auth = makeAuth();

      assert.throws(() => auth.verifyToken('not-a-token'), /malformed token/);
    });

    it('rejects an expired token', async () => {
      const auth = makeAuth();

      const { user } = await registerAndLogin(auth);
      const expired = auth.generateToken(user, -60);

      assert.throws(() => auth.verifyToken(expired), /expired/);
    });

    it('rejects a token that was logged out', async () => {
      const auth = makeAuth();

      const { session } = await registerAndLogin(auth);
      auth.logout(session.token);

      assert.throws(() => auth.verifyToken(session.token), /revoked/);
    });
  });

  describe('isAdmin', () => {
    it('is true for an admin', () => {
      const auth = makeAuth();

      assert.equal(auth.isAdmin({ id: 1, role: 'admin' }), true);
    });

    it('is false for a regular user', () => {
      const auth = makeAuth();

      assert.equal(auth.isAdmin({ id: 1, role: 'user' }), false);
    });

    it('is false for an unknown role', () => {
      const auth = makeAuth();

      assert.equal(auth.isAdmin({ id: 1, role: 'guest' }), false);
    });

    it('does not modify the user it inspects', () => {
      const auth = makeAuth();
      const user = { id: 1, role: 'user' };

      auth.isAdmin(user);

      assert.equal(user.role, 'user');
    });
  });

  describe('changePassword', () => {
    it('rejects a wrong current password', async () => {
      const auth = makeAuth();
      const { user } = await registerAndLogin(auth);

      await assert.rejects(
        () => auth.changePassword(user.id, 'not-the-current-password', 'brand-new-password'),
        /current password/,
      );
    });

    it('accepts the correct current password and lets the new one log in', async () => {
      const auth = makeAuth();
      const { user } = await registerAndLogin(auth);

      await auth.changePassword(user.id, CREDENTIALS.password, 'brand-new-password');

      assert.equal(await auth.login(CREDENTIALS.email, CREDENTIALS.password), null);
      assert.ok(await auth.login(CREDENTIALS.email, 'brand-new-password'));
    });
  });
});
