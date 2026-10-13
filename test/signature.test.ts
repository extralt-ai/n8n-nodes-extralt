import { describe, expect, it } from 'vitest';

import { verifySignature } from '../nodes/ExtraltTrigger/signature';

// The reference vector from the Standard Webhooks specification, which Extralt signs with.
import vector from './standard-webhooks-vector.json';

const REFERENCE_KEY = vector.secret;
const ID = vector.id;
const TIMESTAMP = vector.timestamp;
const BODY = Buffer.from(vector.body);
const SIGNATURE = vector.signature;

const request = (overrides: Partial<Parameters<typeof verifySignature>[1]> = {}) => ({
	id: ID,
	timestamp: String(TIMESTAMP),
	signature: SIGNATURE,
	body: BODY,
	...overrides,
});

describe('verifySignature', () => {
	it('accepts the Standard Webhooks reference signature', () => {
		expect(verifySignature(REFERENCE_KEY, request(), TIMESTAMP)).toBe(true);
	});

	it('accepts a header listing the valid signature among others', () => {
		const signature = `v1,bm90IHRoZSBzaWduYXR1cmU= v2,ignored ${SIGNATURE}`;
		expect(verifySignature(REFERENCE_KEY, request({ signature }), TIMESTAMP)).toBe(true);
	});

	it('rejects a changed body, id or secret', () => {
		expect(
			verifySignature(REFERENCE_KEY, request({ body: Buffer.from('{"test": 1}') }), TIMESTAMP),
		).toBe(false);
		expect(verifySignature(REFERENCE_KEY, request({ id: 'msg_other' }), TIMESTAMP)).toBe(false);
		expect(verifySignature('whsec_dGhpcyBpcyBhbm90aGVyIHNlY3JldA==', request(), TIMESTAMP)).toBe(
			false,
		);
	});

	it('rejects timestamps more than five minutes away', () => {
		expect(verifySignature(REFERENCE_KEY, request(), TIMESTAMP + 5 * 60)).toBe(true);
		expect(verifySignature(REFERENCE_KEY, request(), TIMESTAMP + 5 * 60 + 1)).toBe(false);
		expect(verifySignature(REFERENCE_KEY, request(), TIMESTAMP - 5 * 60 - 1)).toBe(false);
	});

	it('rejects missing or malformed headers', () => {
		for (const overrides of [
			{ id: undefined },
			{ timestamp: undefined },
			{ timestamp: '1614265330.5' },
			{ signature: undefined },
			{ signature: 'g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=' },
			{ signature: 'v1,' },
		]) {
			expect(verifySignature(REFERENCE_KEY, request(overrides), TIMESTAMP)).toBe(false);
		}
	});
});
