import type { Meta, StoryObj } from '@storybook/react';
import { StatsCard } from './StatsCard';
import { TrendingUp, TrendingDown, Users, Package } from 'lucide-react';

const meta = {
  title: 'Dashboard/StatsCard',
  component: StatsCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    trend: {
      control: 'select',
      options: ['up', 'down'],
    },
    gradient: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof StatsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Total Production',
    value: '1,234 kg',
    icon: TrendingUp,
  },
};

export const WithPositiveTrend: Story = {
  args: {
    title: 'Ventes du mois',
    value: '45,000 FCFA',
    change: '+12% vs mois dernier',
    trend: 'up',
    icon: TrendingUp,
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Stock disponible',
    value: '850 kg',
    change: '-5% vs mois dernier',
    trend: 'down',
    icon: Package,
  },
};

export const WithGradient: Story = {
  args: {
    title: 'Employés actifs',
    value: '24',
    change: '+2 nouveaux',
    trend: 'up',
    icon: Users,
    gradient: true,
  },
};

export const LargeValue: Story = {
  args: {
    title: 'Chiffre d\'affaires annuel',
    value: '2,450,000 FCFA',
    change: '+25% vs année dernière',
    trend: 'up',
    icon: TrendingUp,
    gradient: true,
  },
};

export const NoChange: Story = {
  args: {
    title: 'Bassins actifs',
    value: '8',
    icon: Package,
  },
};
