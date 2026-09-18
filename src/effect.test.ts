import { describe, expect, it } from 'vitest';
import { story } from 'executable-stories-vitest';

import { Data, Effect } from 'effect';

type User = { id: string; name: string };
type Order = { id: number; total: number };

class NotFound extends Data.TaggedError('NOT_FOUND')<{
  readonly id: string;
}> {}

class FetchError extends Data.TaggedError('FETCH_ERROR')<{
  readonly userId: string;
}> {}

class InvalidUser extends Data.TaggedError('INVALID_USER')<{
  readonly name: string;
}> {}

const getUser = (id: string): Effect.Effect<User, NotFound> =>
  id === '1'
    ? Effect.succeed({ id: '1', name: 'Alice' })
    : Effect.fail(new NotFound({ id }));

const validateUser = (user: User): Effect.Effect<User, InvalidUser> =>
  user.name.length > 0
    ? Effect.succeed(user)
    : Effect.fail(new InvalidUser({ name: user.name }));

const getOrders = (userId: string): Effect.Effect<Order[], FetchError> =>
  Effect.succeed([{ id: 1, total: 99.99 }]);

const fetchUserAndOrders = Effect.gen(function* () {
  const user = yield* getUser('1');
  // const validatedUser = yield* validateUser(user);
  const orders = yield* getOrders(user.id);
  return { user: user, orders };
});

describe('Fetch user and orders', () => {
  it('returns Alice and her orders', async ({ task }) => {
    story.init(task);

    story.given('user id "1" exists');

    story.when('I fetch the user and their orders');

    const { user, orders } = await Effect.runPromise(fetchUserAndOrders);

    story.then('the result is Alice with one order totaling 99.99');
    expect(user.name).toBe('Alice');
    expect(orders[0].total).toBe(99.99);
  });
});
