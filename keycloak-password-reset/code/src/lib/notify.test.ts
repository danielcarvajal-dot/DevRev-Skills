import axios from 'axios';

import {
  OTP_MAIL_TICKET,
  RECOVERY_TICKET_APP_BASE,
  createRecoveryTicket,
  sendDevrevOtpNotification,
  sendOtpViaTicketComment,
} from './notify';

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

  it('emails Gmail by posting an external comment on TKT-23', async () => {
    http.post.mockResolvedValueOnce({ data: { timeline_entry: { id: 'comment-1' } } });
    await sendOtpViaTicketComment({ endpoint: 'https://api.devrev.ai/', token: 'tok' }, '482193');
    expect(http.post).toHaveBeenCalledWith(
      'https://api.devrev.ai/internal/timeline-entries.create',
      expect.objectContaining({
        type: 'timeline_comment',
        object: OTP_MAIL_TICKET,
        visibility: 'external',
        body: expect.stringContaining('482193'),
      }),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'tok' }) })
    );
  });

  it('creates a follow-up ticket and returns a Computer link', async () => {
    http.post.mockResolvedValueOnce({
      data: { work: { display_id: 'TKT-25', id: 'don:core:dvrv-us-1:devo/1ItqaCEzOO:ticket/25' } },
    });
    const ticket = await createRecoveryTicket(
      { endpoint: 'https://api.devrev.ai/', token: 'tok' },
      { action: 'unlock', identity: 'danielcarvajal', summary: 'Computer finished a Keycloak account unlock.' }
    );
    expect(ticket).toEqual({
      ticketId: 'TKT-25',
      ticketUrl: `${RECOVERY_TICKET_APP_BASE}/TKT-25`,
      ticketDon: 'don:core:dvrv-us-1:devo/1ItqaCEzOO:ticket/25',
    });
    expect(http.post).toHaveBeenCalledWith(
      'https://api.devrev.ai/internal/works.create',
      expect.objectContaining({
        type: 'ticket',
        title: 'Keycloak unlock complete: danielcarvajal',
        owned_by: ['don:identity:dvrv-us-1:devo/1ItqaCEzOO:devu/1'],
      }),
      expect.any(Object)
    );
  });
});
