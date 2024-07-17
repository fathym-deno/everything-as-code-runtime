import { assertEquals } from '../../test.deps.ts';
import { assert } from '../../test.deps.ts';
import { customStringify, HumanMessage, jsonClone, merge } from '../../test.deps.ts';

Deno.test('Message Serialization', async (t) => {
  await t.step('Human Message', () => {
    const msg = new HumanMessage('This is a test');

    // deno-lint-ignore no-explicit-any
    const newMsg = merge<any>(jsonClone(msg), JSON.parse(customStringify(msg)));

    console.log(newMsg);

    assert(newMsg);
    assert(newMsg.additional_kwargs);
    assert(newMsg.content, 'This is a test');
    assertEquals(newMsg.type, 'HumanMessage');
  });

  await t.step('Human Message Array', () => {
    const msg = new HumanMessage('This is a test');

    // deno-lint-ignore no-explicit-any
    const newMsg = merge<any>(jsonClone(msg), JSON.parse(customStringify(msg)));

    console.log(newMsg);

    assert(newMsg);
    assert(newMsg.additional_kwargs);
    assert(newMsg.content, 'This is a test');
    assertEquals(newMsg.type, 'HumanMessage');
  });
});
