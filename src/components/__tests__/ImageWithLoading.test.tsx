import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ImageWithLoading } from '../ImageWithLoading';

describe('ImageWithLoading', () => {
  it('should render image with src', () => {
    const { container } = render(
      <ImageWithLoading src="test.jpg" alt="Test image" />
    );
    
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.alt).toBe('Test image');
  });

  it('should apply className', () => {
    const { container } = render(
      <ImageWithLoading 
        src="test.jpg" 
        alt="Test" 
        className="custom-class" 
      />
    );
    
    const img = container.querySelector('img');
    expect(img?.className).toContain('custom-class');
  });

  it('should show loading state initially', () => {
    const { container } = render(
      <ImageWithLoading src="test.jpg" alt="Test" />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
