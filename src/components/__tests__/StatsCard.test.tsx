import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatsCard } from '../Dashboard/StatsCard';
import { TrendingUp } from 'lucide-react';

describe('StatsCard', () => {
  it('should render title and value', () => {
    const { getByText } = render(
      <StatsCard
        title="Total Production"
        value="1,234 tonnes"
        icon={TrendingUp}
      />
    );

    expect(getByText('Total Production')).toBeInTheDocument();
    expect(getByText('1,234 tonnes')).toBeInTheDocument();
  });

  it('should render change with trend up', () => {
    const { getByText } = render(
      <StatsCard
        title="Sales"
        value="500"
        change="+12% vs last month"
        trend="up"
        icon={TrendingUp}
      />
    );

    const changeElement = getByText('+12% vs last month');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-accent');
  });

  it('should render change with trend down', () => {
    const { getByText } = render(
      <StatsCard
        title="Stock"
        value="200"
        change="-5% vs last month"
        trend="down"
        icon={TrendingUp}
      />
    );

    const changeElement = getByText('-5% vs last month');
    expect(changeElement).toBeInTheDocument();
    expect(changeElement).toHaveClass('text-destructive');
  });

  it('should apply gradient class when gradient prop is true', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value="100"
        icon={TrendingUp}
        gradient={true}
      />
    );

    const card = container.querySelector('.bg-gradient-to-br');
    expect(card).toBeInTheDocument();
  });
});
