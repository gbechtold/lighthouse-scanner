import { lighthouseScanner } from '../setup.js';

describe('getSingleUrl', () => {
  test.skip('should return user input URL', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('https://example.com/page'));
    
    const result = await lighthouseScanner.getSingleUrl(mockRL, 'https://example.com');
    expect(result).toBe('https://example.com/page');
  });

  test.skip('should return default URL if input is empty', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback(''));
    
    const result = await lighthouseScanner.getSingleUrl(mockRL, 'https://example.com');
    expect(result).toBe('https://example.com');
  });
});