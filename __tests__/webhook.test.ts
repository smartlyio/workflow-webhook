import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { signPayload, postWebhook } from '../src/webhook';

// This sets the mock adapter on the default instance
const axiosMock = new MockAdapter(axios);

describe('sign payload', () => {
  test('signing payload', () => {
    const payload = '{"key": "text"}';
    const expected = '2290772a7257c2b70241fa18321f4c5357cf5c0d';
    const secret = 'sekrit';
    expect(signPayload(payload, secret)).toBe(expected);
  });
});

describe('Posting the webhook', () => {
  test('Successful webhook post', async () => {
    const webhookUrl = 'http://localhost/webhook';
    const webhookAuth = 'my-token';
    const payload = '{"key": "text"}';
    const signature = '2290772a7257c2b70241fa18321f4c5357cf5c0d';

    axiosMock.onPost(webhookUrl).reply(config => {
      const {
        'Content-Type': contentType,
        'x-hub-signature': actualSignature,
        Authorization: authorization
      } = config.headers;
      expect(contentType).toBe('application/json');
      expect(actualSignature).toBe(`sha1=${signature}`);
      expect(authorization).toBe(`Bearer ${webhookAuth}`);
      expect(config.data).toBe(payload);
      return [200, { channel: { ok: true } }];
    });

    await postWebhook(webhookUrl, webhookAuth, payload, signature);
  });

  test('Handle bad request', async () => {
    const webhookUrl = 'http://localhost/webhook';
    const webhookAuth = 'my-token';
    const payload = '{"key": "other"}';
    const signature = '2290772a7257c2b70241fa18321f4c5357cf5c0d';

    axiosMock.onPost(webhookUrl).reply(400, { error: 'Signature failed' });

    try {
      await postWebhook(webhookUrl, webhookAuth, payload, signature);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toStrictEqual({ error: 'Signature failed' });
    }
  });
});
