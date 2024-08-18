import { jest } from '@jest/globals';
import {
  getOutputFilename,
  getSitemapUrl,
  getImprovementSuggestions
} from '../lighthouse_scanner.js';

// Mock axios
jest.mock('axios', () => ({
  head: jest.fn(),
  get: jest.fn()
}));

import axios from 'axios';

jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn(),
    close: jest.fn()
  })
}));

describe('lighthouse_scanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOutputFilename', () => {
    it('should generate correct filename for starsmedia.com', () => {
      expect(getOutputFilename('https://starsmedia.com')).toBe('starsmedia_com_lighthouse_results.json');
      expect(getOutputFilename('https://www.starsmedia.com')).toBe('starsmedia_com_lighthouse_results.json');
    });

    it('should handle subdomains correctly', () => {
      expect(getOutputFilename('https://blog.starsmedia.com')).toBe('blog_starsmedia_com_lighthouse_results.json');
    });
  });

  describe.skip('getSitemapUrl', () => {
    it('should return input if it ends with sitemap.xml', async () => {
      const input = 'https://starsmedia.com/sitemap.xml';
      await expect(getSitemapUrl(input)).resolves.toBe(input);
    });

    it.skip('should construct sitemap URL for starsmedia.com', async () => {
      const input = 'https://starsmedia.com';
      axios.head.mockResolvedValue({});
      await expect(getSitemapUrl(input)).resolves.toBe('https://starsmedia.com/sitemap.xml');
      expect(axios.head).toHaveBeenCalledWith('https://starsmedia.com/sitemap.xml');
    });

    it.skip('should throw error if sitemap not found for starsmedia.com', async () => {
      const input = 'https://starsmedia.com';
      axios.head.mockRejectedValue({ response: { status: 404 } });
      await expect(getSitemapUrl(input)).rejects.toThrow('Sitemap not found at https://starsmedia.com/sitemap.xml');
      expect(axios.head).toHaveBeenCalledWith('https://starsmedia.com/sitemap.xml');
    });
  });

  describe('getImprovementSuggestions', () => {
    it('should return improvement suggestions for audits with score < 1', () => {
      const audits = {
        'first-contentful-paint': { 
          score: 0.8, 
          relevantAudits: ['performance'], 
          title: 'First Contentful Paint', 
          description: 'First Contentful Paint marks the time at which the first text or image is painted.' 
        },
        'speed-index': { 
          score: 1, 
          relevantAudits: ['performance'], 
          title: 'Speed Index', 
          description: 'Speed Index shows how quickly the contents of a page are visibly populated.' 
        },
        'accessibility': { 
          score: 0.5, 
          relevantAudits: ['accessibility'], 
          title: 'Accessibility', 
          description: 'These checks highlight opportunities to improve the accessibility of your web app.' 
        }
      };
      const result = getImprovementSuggestions(audits, 'performance');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('First Contentful Paint');
    });
  });
});