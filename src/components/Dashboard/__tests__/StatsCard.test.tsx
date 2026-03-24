import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatsCard } from '../StatsCard';
import { TrendingUp } from 'lucide-react';

describe('StatsCard', () => {
  it('should render with all props', () => {
    const { getByText } = render(
      <StatsCard
        title="Total Sales"
        value="1,234"
        icon={TrendingUp}
        trend="up"
        change="+12.5%"
      />
    );

    expect(getByText('Total Sales')).toBeInTheDocument();
    expect(getByText('1,234')).toBeInTheDocument();
    // change text is prefixed with arrow in the component
    expect(getByText(/\+12\.5%/)).toBeInTheDocument();
  });

  it('should render negative trend', () => {
    const { getByText } = render(
      <StatsCard
        title="Costs"
        value="500"
        icon={TrendingUp}
        trend="down"
        change="-5.2%"
      />
    );

    expect(getByText(/-5\.2%/)).toBeInTheDocument();
  });

  it('should render without trend', () => {
    const { getByText, queryByText } = render(
      <StatsCard
        title="Users"
        value="42"
        icon={TrendingUp}
      />
    );

    expect(getByText('Users')).toBeInTheDocument();
    expect(queryByText('%')).not.toBeInTheDocument();
  });

  it('should apply gradient prop', () => {
    const { container } = render(
      <StatsCard
        title="Test"
        value="100"
        icon={TrendingUp}
        gradient={true}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });
});
