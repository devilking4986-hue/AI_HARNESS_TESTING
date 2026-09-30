'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { UserService } = require('../src/users/userService');

const PASSWORD = 'correct-horse-battery';

function makeService() {
  return new UserService();
}

async function seed(service, count) {
  for (let i = 1; i <= count; i += 1) {
    await service.createUser({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      password: PASSWORD,
    });
  }
}

describe('UserService', () => {
  describe('createUser', () => {
    it('assigns incrementing ids and sensible defaults', async () => {
      const service = makeService();

      const alice = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });
      const bob = await service.createUser({
        name: 'Bob',
        email: 'bob@example.com',
        password: PASSWORD,
      });

      assert.equal(alice.id, 1);
      assert.equal(bob.id, 2);
      assert.equal(alice.role, 'user');
      assert.equal(alice.active, true);
      assert.ok(alice.createdAt);
    });

    it('rejects a malformed email address', async () => {
      const service = makeService();

      await assert.rejects(
        () => service.createUser({ name: 'Eve', email: 'not-an-email', password: PASSWORD }),
        /invalid email address/,
      );
    });

    it('rejects required fields that are missing', async () => {
      const service = makeService();

      await assert.rejects(
        () => service.createUser({ name: 'Eve', email: 'eve@example.com' }),
        /required/,
      );
    });

    it('rejects a duplicate email address', async () => {
      const service = makeService();
      await service.createUser({ name: 'Alice', email: 'alice@example.com', password: PASSWORD });

      await assert.rejects(
        () => service.createUser({ name: 'Alice 2', email: 'alice@example.com', password: PASSWORD }),
        /already registered/,
      );
    });

    it('compares emails case-insensitively when checking for duplicates', async () => {
      const service = makeService();
      await service.createUser({ name: 'Alice', email: 'alice@example.com', password: PASSWORD });

      await assert.rejects(
        () => service.createUser({ name: 'Alice 2', email: 'ALICE@example.com', password: PASSWORD }),
        /already registered/,
      );
    });

    it('only lets one of two concurrent signups with the same email through', async () => {
      const service = makeService();

      const results = await Promise.allSettled([
        service.createUser({ name: 'Alice', email: 'race@example.com', password: PASSWORD }),
        service.createUser({ name: 'Alice 2', email: 'race@example.com', password: PASSWORD }),
      ]);

      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      assert.equal(fulfilled.length, 1);
    });

    it('returns a user that is safe to hand to callers', async () => {
      const service = makeService();
      const created = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      created.name = 'Mutated by the caller';

      assert.equal(service.getUserById(created.id).name, 'Alice');
    });
  });

  describe('findByEmail', () => {
    it('finds a user by an exact email address', async () => {
      const service = makeService();
      const created = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      assert.equal(service.findByEmail('alice@example.com').id, created.id);
    });

    it('finds a user regardless of the casing that is queried', async () => {
      const service = makeService();
      const created = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      assert.equal(service.findByEmail('ALICE@EXAMPLE.COM').id, created.id);
      assert.equal(service.findByEmail('Alice@Example.Com').id, created.id);
    });

    it('returns null for an address that is not registered', () => {
      const service = makeService();

      assert.equal(service.findByEmail('nobody@example.com'), null);
    });
  });

  describe('getUserById', () => {
    it('finds an existing user', async () => {
      const service = makeService();
      const created = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      assert.equal(service.getUserById(created.id).email, 'alice@example.com');
    });

    it('throws for an unknown id', () => {
      const service = makeService();

      assert.throws(() => service.getUserById(404), /user not found/);
    });
  });

  describe('listUsers', () => {
    it('returns the first page of a 1-based pagination', async () => {
      const service = makeService();
      await seed(service, 25);

      const firstPage = service.listUsers(1, 10);

      assert.equal(firstPage.total, 25);
      assert.equal(firstPage.items.length, 10);
      assert.equal(firstPage.items[0].id, 1);
      assert.equal(firstPage.items[9].id, 10);
    });

    it('returns the second page with the remaining users', async () => {
      const service = makeService();
      await seed(service, 25);

      const secondPage = service.listUsers(2, 10);

      assert.equal(secondPage.items.length, 10);
      assert.equal(secondPage.items[0].id, 11);
      assert.equal(secondPage.items[9].id, 20);
    });

    it('returns an empty page when paging past the end', async () => {
      const service = makeService();
      await seed(service, 5);

      assert.equal(service.listUsers(9, 10).items.length, 0);
    });
  });

  describe('updateUser', () => {
    it('updates the name', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      service.updateUser(user.id, { name: 'Alice Cooper' });

      assert.equal(service.getUserById(user.id).name, 'Alice Cooper');
    });

    it('updates the email', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      service.updateUser(user.id, { email: 'alice.cooper@example.com' });

      assert.equal(service.getUserById(user.id).email, 'alice.cooper@example.com');
      assert.equal(service.findByEmail('alice.cooper@example.com').id, user.id);
    });

    it('ignores attempts to overwrite id and role', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      service.updateUser(user.id, { id: 999, role: 'admin' });

      const updated = service.getUserById(user.id);
      assert.equal(updated.id, 1);
      assert.equal(updated.role, 'user');
    });

    it('still applies the allowed fields alongside a rejected one', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      service.updateUser(user.id, { name: 'Alice Cooper', id: 999, role: 'admin' });

      const updated = service.getUserById(user.id);
      assert.equal(updated.name, 'Alice Cooper');
      assert.equal(updated.id, 1);
      assert.equal(updated.role, 'user');
    });
  });

  describe('deactivateUser', () => {
    it('marks the user inactive', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      service.deactivateUser(user.id);

      assert.equal(service.getUserById(user.id).active, false);
    });

    it('is idempotent', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      service.deactivateUser(user.id);
      service.deactivateUser(user.id);

      assert.equal(service.getUserById(user.id).active, false);
    });
  });

  describe('deleteUser', () => {
    it('removes the user from the store', async () => {
      const service = makeService();
      const user = await service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: PASSWORD,
      });

      const removed = service.deleteUser(user.id);

      assert.equal(removed.email, 'alice@example.com');
      assert.equal(service.users.length, 0);
      assert.throws(() => service.getUserById(user.id), /user not found/);
    });

    it('throws for an unknown id', () => {
      const service = makeService();

      assert.throws(() => service.deleteUser(404), /user not found/);
    });
  });

  describe('searchByName', () => {
    it('finds users by a partial name match', async () => {
      const service = makeService();
      await seed(service, 3);

      const matches = service.searchByName('User 2');

      assert.equal(matches.length, 1);
      assert.equal(matches[0].email, 'user2@example.com');
    });
  });
});
