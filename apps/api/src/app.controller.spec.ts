import { AppController } from './app.controller';

describe('AppController', () => {
  it('returns a ping payload for the health endpoint', () => {
    const controller = new AppController();
    const result = controller.ping();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'subtrack-api',
      }),
    );
  });
});
