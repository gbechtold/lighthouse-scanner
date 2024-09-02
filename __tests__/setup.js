import { jest } from '@jest/globals';
import axios from 'axios';

// Mock modules
jest.mock('fs-extra');
jest.mock('readline', () => ({
  createInterface: jest.fn()
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

// Import the lighthouse scanner module
const lighthouseScannerModule = await import('../lighthouse_scanner.js');

// Create a new object with all exports except 'main'
export const lighthouseScanner = Object.fromEntries(
  Object.entries(lighthouseScannerModule).filter(([key]) => key !== 'main')
);

export { axios };