import { jest } from '@jest/globals';
import axios from 'axios';

// Mock modules
jest.mock('axios');
jest.mock('fs-extra');
jest.mock('readline', () => ({
  createInterface: jest.fn()
}));

let lighthouseScanner;
let originalAxiosHead;

beforeAll(async () => {
  jest.mock('fs-extra', () => ({
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    readFileSync: jest.fn()
  }));

  jest.mock('xml2js', () => ({
    Parser: jest.fn().mockImplementation(() => ({
      parseStringPromise: jest.fn()
    }))
  }));

  jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
      wsEndpoint: jest.fn().mockReturnValue('ws://localhost:1234'),
      close: jest.fn()
    })
  }));

  jest.mock('lighthouse', () => jest.fn());

  originalAxiosHead = axios.head;
  lighthouseScanner = await import('../lighthouse_scanner.js');
});

afterAll(() => {
  axios.head = originalAxiosHead;
});

describe('Lighthouse Scanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.head = jest.fn();
  });

  afterEach(() => {
    axios.head = originalAxiosHead;
  });

  describe('normalizeUrl', () => {
    test('should add https:// if protocol is missing', () => {
      expect(lighthouseScanner.normalizeUrl('example.com')).toBe('https://example.com/');
    });

    test('should remove www. from the URL', () => {
      expect(lighthouseScanner.normalizeUrl('https://www.example.com')).toBe('https://example.com/');
    });

    test('should handle URLs with http://', () => {
      expect(lighthouseScanner.normalizeUrl('http://example.com')).toBe('http://example.com/');
    });

    test('should throw an error for invalid URLs', () => {
      expect(() => lighthouseScanner.normalizeUrl('not a url')).toThrow('Invalid URL provided');
    });
  });

  describe('getSitemapUrl', () => {
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

  describe('main', () => {
    test('should handle full website scan', async () => {
      const mockRL = {
        question: jest.fn(),
        close: jest.fn()
      };
      
      // Mock the createInterface function
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
});