'use strict';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/;
const DEFAULT_PAGE_SIZE = 10;
const UPDATABLE_FIELDS = ['name', 'email'];

/**
 * In-memory user store used by the signup and admin screens.
 *
 * Documents the contract callers rely on:
 *  - email addresses are unique and compared case-insensitively
 *  - `getUserById` throws for unknown ids
 *  - `listUsers(page, pageSize)` is 1-based
 *  - `updateUser` never lets a caller overwrite `id` or `role`
 *  - `deactivateUser` is idempotent
 */
class UserService {
  constructor() {
    /** @type {object[]} */
    this.users = [];
    this.nextId = 1;
  }

  /**
   * Creates a user.
   *
   * @param {{name: string, email: string, password: string, role?: string}} input
   * @returns {Promise<object>} the stored user
   */
  async createUser({ name, email, password, role = 'user' } = {}) {
    if (!name || !email || !password) {
      throw new Error('name, email and password are required');
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error(`invalid email address: ${email}`);
    }

    // Check and reserve synchronously so two concurrent signups for the same
    // address cannot both slip past the duplicate check while `_persist` awaits.
    const existing = this.findByEmail(email);
    if (existing) {
      throw new Error(`email already registered: ${email}`);
    }

    const user = {
      id: this.nextId,
      name,
      email,
      password,
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.nextId += 1;
    this.users.push(user);

    await this._persist(user);
    return { ...user };
  }

  /**
   * @param {string} email
   * @returns {object|null} the matching user, or null
   */
  findByEmail(email) {
    const needle = String(email).toLowerCase();
    return this.users.find((user) => user.email.toLowerCase() === needle) || null;
  }

  /**
   * @param {number|string} id
   * @returns {object} the matching user
   * @throws {Error} when no user has that id
   */
  getUserById(id) {
    const user = this.users.find((candidate) => candidate.id == id);
    if (!user) {
      throw new Error(`user not found: ${id}`);
    }
    return user;
  }

  /**
   * 1-based pagination over the store.
   *
   * @param {number} page
   * @param {number} pageSize
   * @returns {{page: number, pageSize: number, total: number, items: object[]}}
   */
  listUsers(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const offset = (page - 1) * pageSize;
    return {
      page,
      pageSize,
      total: this.users.length,
      items: this.users.slice(offset, offset + pageSize),
    };
  }

  /**
   * Applies a partial update.
   *
   * @param {number|string} id
   * @param {object} patch only `name` and `email` may be changed
   * @returns {object} the updated user
   */
  updateUser(id, patch) {
    const user = this.getUserById(id);
    const changes = patch || {};
    for (const field of UPDATABLE_FIELDS) {
      if (changes[field] !== undefined) {
        user[field] = changes[field];
      }
    }
    return user;
  }

  /**
   * Marks a user as inactive. Calling it twice must leave the user inactive.
   *
   * @param {number|string} id
   * @returns {object} the updated user
   */
  deactivateUser(id) {
    const user = this.getUserById(id);
    user.active = false;
    return user;
  }

  /**
   * @param {number|string} id
   * @returns {object} the removed user
   * @throws {Error} when no user has that id
   */
  deleteUser(id) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw new Error(`user not found: ${id}`);
    }
    return this.users.splice(index, 1)[0];
  }

  /**
   * @param {string} query
   * @returns {object[]} users whose name contains `query`
   */
  searchByName(query) {
    return this.users.filter((user) => user.name.includes(query));
  }

  /**
   * Stand-in for the database round-trip.
   *
   * @param {object} user
   * @returns {Promise<object>}
   */
  async _persist(user) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return user;
  }
}

module.exports = { UserService };
