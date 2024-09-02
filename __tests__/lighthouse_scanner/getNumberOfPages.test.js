import { lighthouseScanner } from '../setup.js';

describe('getNumberOfPages', () => {
  test.skip('should return parsed number of pages', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('5'));
    
    const result = await lighthouseScanner.getNumberOfPages(mockRL);
    expect(result).toBe(5);
  });

  test.skip('should return default value (10) for invalid input', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('invalid'));
    
    const result = await lighthouseScanner.getNumberOfPages(mockRL);
    expect(result).toBe(10);
  });
});