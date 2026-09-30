# ai-harness-test-repo

A small, self-contained Node.js service used as a fixture for exercising AI
coding/review harnesses.

> **This repository is synthetic.** It intentionally contains seeded defects
> (logic errors, async/race bugs, aliasing bugs and security issues). Do not copy
> any of this code into production.

## Layout

```
ai-harness-test-repo/
├── src/
│   ├── calculator/
│   │   └── calculator.js
│   ├── users/
│   │   └── userService.js
│   └── auth/
│       └── authService.js
├── tests/
│   ├── calculator.test.js
│   ├── users.test.js
│   └── auth.test.js
├── package.json
└── README.md
```

## Requirements

* Node.js 18 or newer (tests use the built-in `node:test` runner).
* No runtime or dev dependencies - nothing has to be installed to run the suite.

## Running the tests

```bash
npm test                       # everything (tests/)
npm run test:calculator        # only the calculator suite
npm run test:users             # only the user service suite
npm run test:auth              # only the auth suite
```

A single file can also be run directly:

```bash
node --test tests/calculator.test.js
node --test --test-name-pattern "divide" tests/calculator.test.js
```

## Expected baseline

The suite is **not** green on purpose: on a fresh checkout, `npm test` reports
56 tests with 35 passing and 21 failing, and `npm test` exits non-zero. The
failing tests describe behaviour the implementation should have but does not,
and a few defects in `src/` are not covered by any test at all - they can only
be found by reading the code or by writing new tests. The exact list of seeded
defects is deliberately not documented here.

## Module contracts

* `Calculator` - pure numeric helpers (`divide` must reject a zero divisor,
  `sumRange` is inclusive of both bounds, `isPrime(4)` is `false`, `average([])`
  throws, `parseNumber` only accepts decimal integers, `isEven` must work for
  negative numbers).
* `UserService` - in-memory store: emails are unique and compared
  case-insensitively, `getUserById` must not hand out internal references,
  `listUsers(page, pageSize)` is 1-based, `updateUser` must not allow `id`/`role`
  to be overwritten, `deactivateUser` is idempotent.
* `AuthService` - JWT-flavoured sessions: passwords are never stored in
  plaintext, tokens carry an `exp`/`iat` pair in milliseconds, `verifyToken`
  must reject expired and logged-out tokens, `isAdmin` must not mutate its
  argument, `changePassword` must verify the current password.
