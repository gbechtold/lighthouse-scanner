import { lighthouseScanner } from '../setup.js';
import { jest } from '@jest/globals';

describe('main', () => {
  test.skip('should handle full website scan', async () => {
    const mockRL = {
      question: jest.fn(),
      close: jest.fn()
    };
    
    const { createInterface } = await import('readline');
    createInterface.mockReturnValue(mockRL);
    
    mockRL.question
      .mockImplementationOnce((_, cb) => cb('https://example.com'))  // Website URL
      .mockImplementationOnce((_, cb) => cb('1'));  // Scan choice

    jest.spyOn(lighthouseScanner, 'getSitemapUrl').mockResolvedValue('https://example.com/sitemap.xml');
    jest.spyOn(lighthouseScanner, 'getSitemapUrls').mockResolvedValue(['https://example.com/page1', 'https://example.com/page2']);
    jest.spyOn(lighthouseScanner, 'processUrl').mockResolvedValue(undefined);

    await lighthouseScanner.main();

    expect(createInterface).toHaveBeenCalled();
    expect(lighthouseScanner.getSitemapUrl).toHaveBeenCalledWith('https://example.com/');
    expect(lighthouseScanner.getSitemapUrls).toHaveBeenCalledWith('https://example.com/sitemap.xml');
    expect(lighthouseScanner.processUrl).toHaveBeenCalledTimes(2);
  });

  // Add more test cases for other scan options
});