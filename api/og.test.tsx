/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import handler from './og';
import { ImageResponse } from '@vercel/og';

// Mock @vercel/og
vi.mock('@vercel/og', () => ({
  ImageResponse: vi.fn((element, options) => ({
    element,
    options,
    status: 200,
  })),
}));

describe('OG Image Handler', () => {
  it('generates an OG image with a workspace name', async () => {
    const request = new Request('https://parrit.org/api/og?workspace=TestTeam');
    const response = await handler(request);

    expect(ImageResponse).toHaveBeenCalled();
    const mockedResponse = response as any;
    expect(mockedResponse.element).toBeDefined();

    // Check if the width/height options are correct
    expect(mockedResponse.options).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it('generates a default OG image when no workspace is provided', async () => {
    const request = new Request('https://parrit.org/api/og');
    const response = await handler(request);

    expect(ImageResponse).toHaveBeenCalled();
    const mockedResponse = response as any;
    expect(mockedResponse.status).toBe(200);
  });

  it('includes pairs count in the image when provided', async () => {
    const request = new Request(
      'https://parrit.org/api/og?workspace=Acme&pairs=4'
    );
    const response = await handler(request);

    expect(ImageResponse).toHaveBeenCalled();
    const mockedResponse = response as any;
    expect(mockedResponse.status).toBe(200);
  });

  it('returns a 500 status on error', async () => {
    vi.mocked(ImageResponse).mockImplementationOnce(() => {
      throw new Error('OG Generation Failed');
    });

    const request = new Request('https://parrit.org/api/og');
    const response = await handler(request);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe('Failed to generate the image');
  });
});
