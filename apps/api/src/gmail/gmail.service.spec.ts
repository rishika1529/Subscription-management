import { GmailService } from './gmail.service';

describe('GmailService heuristic fallback', () => {
  it('extracts subscriptions from billing email snippets without AI', () => {
    const service = new GmailService({ get: jest.fn() } as any, {} as any);

    const result = (service as any).extractWithHeuristics([
      'Account: user@example.com\nFrom: Netflix <billing@netflix.com>\nSubject: Your Netflix charge for March\nDate: Tue, 08 Mar 2026 10:00:00 +0000\nSnippet: You were charged $15.99 for your subscription.',
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Netflix',
          amount: 15.99,
          currency: 'USD',
          billingCycle: 'MONTHLY',
        }),
      ]),
    );
  });
});
