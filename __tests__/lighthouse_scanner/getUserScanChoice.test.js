import { jest } from '@jest/globals';
import { lighthouseScanner } from '../setup.js';
import axios from 'axios';

jest.mock('axios');

describe('getUserScanChoice', () => {
  test('should return user input for scan choice', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('2'));
    
    const result = await lighthouseScanner.getUserScanChoice(mockRL);
    expect(result).toBe('2');
  });

  test('should return default choice (1) if input is empty', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback(''));
    
    const result = await lighthouseScanner.getUserScanChoice(mockRL);
    expect(result).toBe('1');
  });
});

describe('getSitemapUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the input URL if it ends with sitemap.xml', async () => {
    const inputUrl = 'https://example.com/sitemap.xml';
    const result = await lighthouseScanner.getSitemapUrl(inputUrl);
    expect(result).toBe(inputUrl);
  });

  test('should check multiple possible sitemap URLs', async () => {
    const inputUrl = 'https://example.com';
    const expectedSitemapUrls = [
      'https://example.com/sitemap.xml',
      'https://example.com/sitemap_index.xml',
      'https://example.com/sitemap',
      'https://example.com/sitemap.php',
    ];
    
    axios.head.mockRejectedValueOnce(new Error('Not found'))
             .mockRejectedValueOnce(new Error('Not found'))
             .mockResolvedValueOnce({});

    const result = await lighthouseScanner.getSitemapUrl(inputUrl);
    expect(result).toBe(expectedSitemapUrls[2]);
    expect(axios.head).toHaveBeenCalledTimes(3);
    expectedSitemapUrls.slice(0, 3).forEach(url => {
      expect(axios.head).toHaveBeenCalledWith(url);
    });
  });

  test('should throw an error if sitemap is not found', async () => {
    const inputUrl = 'https://example.com';
    
    axios.head.mockRejectedValue(new Error('Not found'));

    await expect(lighthouseScanner.getSitemapUrl(inputUrl))
      .rejects.toThrow('Sitemap not found for https://example.com/');
  });
});

  test('should throw an error if sitemap is not found', async () => {
    const inputUrl = 'https://example.com';
    
    axios.head.mockRejectedValue(new Error('Not found'));

    await expect(lighthouseScanner.getSitemapUrl(inputUrl))
      .rejects.toThrow('Sitemap not found for https://example.com/');
  });
});

describe('getNumberOfPages', () => {
  test('should return parsed number of pages', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('5'));
    
    const result = await lighthouseScanner.getNumberOfPages(mockRL);
    expect(result).toBe(5);
  });

  test('should return default value (10) for invalid input', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('invalid'));
    
    const result = await lighthouseScanner.getNumberOfPages(mockRL);
    expect(result).toBe(10);
  });
});

describe('getSingleUrl', () => {
  test('should return user input URL', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback('https://example.com/page'));
    
    const result = await lighthouseScanner.getSingleUrl(mockRL, 'https://example.com');
    expect(result).toBe('https://example.com/page');
  });

  test('should return default URL if input is empty', async () => {
    const mockRL = { question: jest.fn() };
    mockRL.question.mockImplementationOnce((_, callback) => callback(''));
    
    const result = await lighthouseScanner.getSingleUrl(mockRL, 'https://example.com');
    expect(result).toBe('https://example.com');
  });
});