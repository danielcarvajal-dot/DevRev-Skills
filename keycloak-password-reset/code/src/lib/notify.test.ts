import axios from 'axios';

import { sendDevrevOtpNotification } from './notify';

jest.mock('axios');

const http = axios as jest.Mocked<typeof axios>;

describe('sendDevrevOtpNotification', () => {
  beforeEach(() => {
    http.post.mockReset();
  });

  it('looks up the DevRev user and sends a notification', async () => {
    http.post.mockResolvedValueOnce({
      data: { dev_users: [{ id: 'don:identity:devu/1', email: 'daniel.carvajal@devrev.ai' }] },
    });
    http.post.mockResolvedValueOnce({ data: {} });

    await sendDevrevOtpNotification(
      { endpoint: 'https://api.devrev.ai/', token: 'tok' },
      'daniel.carvajal@devrev.ai',
      '482193'
    );

    expect(http.post).toHaveBeenNthCalledWith(
      1,
      'https://api.devrev.ai/internal/dev-users.list',
      { email: ['daniel.carvajal@devrev.ai'] },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'tok' }) })
    );
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      'https://api.devrev.ai/internal/notifications.send',
      expect.objectContaining({
        notifications: [
          expect.objectContaining({
            receiver: 'don:identity:devu/1',
            metadata: [expect.objectContaining({ body: expect.stringContaining('482193') })],
          }),
        ],
      }),
      expect.any(Object)
    );
  });

  it('fails when the mailbox is not a DevRev user', async () => {
    http.post.mockResolvedValueOnce({ data: { dev_users: [] } });
    await expect(
      sendDevrevOtpNotification(
        { endpoint: 'https://api.devrev.ai', token: 'tok' },
        'nobody@example.com',
        '482193'
      )
    ).rejects.toThrow(/No DevRev user/);
  });
});
