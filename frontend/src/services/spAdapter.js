// Simple mock adapter for development and review
export const spAdapter = {
  mock: true,
  async getItems() {
    if (this.mock) {
      return [
        { id: 1, title: 'Sample Product', summary: 'A sample AI product' },
        { id: 2, title: 'Agent Starter Pack', summary: 'Starter pack for agents' }
      ]
    }
    // implement real PnPjs calls when not in mock mode
    throw new Error('Not implemented')
  }
}
