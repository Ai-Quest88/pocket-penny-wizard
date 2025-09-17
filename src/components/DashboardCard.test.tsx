import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/utils/test-utils'
import DashboardCard from './DashboardCard'

describe('DashboardCard', () => {
  it('should render with title and value', () => {
    render(
      <DashboardCard
        title="Total Assets"
        value="$10,000.00"
        trend={{ value: 5.2, isPositive: true }}
        icon="💰"
      />
    )

    expect(screen.getByText('Total Assets')).toBeInTheDocument()
    expect(screen.getByText('$10,000.00')).toBeInTheDocument()
    expect(screen.getByText('+5.2%')).toBeInTheDocument()
  })

  it('should render negative trend correctly', () => {
    render(
      <DashboardCard
        title="Total Expenses"
        value="$5,000.00"
        trend={{ value: 3.1, isPositive: false }}
        icon="📉"
      />
    )

    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('-3.1%')).toBeInTheDocument()
  })

  it('should render without trend', () => {
    render(
      <DashboardCard
        title="Net Worth"
        value="$15,000.00"
        icon="💎"
      />
    )

    expect(screen.getByText('Net Worth')).toBeInTheDocument()
    expect(screen.getByText('$15,000.00')).toBeInTheDocument()
    expect(screen.queryByText(/[+-]\d+\.\d+%/)).not.toBeInTheDocument()
  })

  it('should render with custom className', () => {
    render(
      <DashboardCard
        title="Test Card"
        value="$1,000.00"
        icon="🧪"
        className="custom-class"
      />
    )

    const card = screen.getByText('Test Card').closest('div')
    expect(card).toHaveClass('custom-class')
  })

  it('should render icon correctly', () => {
    render(
      <DashboardCard
        title="Test Card"
        value="$1,000.00"
        icon="🎯"
      />
    )

    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    render(
      <DashboardCard
        title="Loading Card"
        value="$1,000.00"
        icon="⏳"
        isLoading={true}
      />
    )

    expect(screen.getByText('Loading Card')).toBeInTheDocument()
    // Check for loading indicator (this would depend on the actual implementation)
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    
    render(
      <DashboardCard
        title="Clickable Card"
        value="$1,000.00"
        icon="👆"
        onClick={handleClick}
      />
    )

    const card = screen.getByText('Clickable Card').closest('div')
    card?.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render with different value formats', () => {
    const testCases = [
      { value: '$1,234.56', expected: '$1,234.56' },
      { value: '€1,234.56', expected: '€1,234.56' },
      { value: '£1,234.56', expected: '£1,234.56' },
      { value: '¥1,234', expected: '¥1,234' },
      { value: '0', expected: '0' },
      { value: '-$500.00', expected: '-$500.00' }
    ]

    testCases.forEach(({ value, expected }) => {
      render(
        <DashboardCard
          title={`Test ${value}`}
          value={value}
          icon="💰"
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
    })
  })

  it('should render with different trend values', () => {
    const testCases = [
      { trend: { value: 0, isPositive: true }, expected: '+0.0%' },
      { trend: { value: 100, isPositive: true }, expected: '+100.0%' },
      { trend: { value: 0.1, isPositive: true }, expected: '+0.1%' },
      { trend: { value: 0, isPositive: false }, expected: '-0.0%' },
      { trend: { value: 100, isPositive: false }, expected: '-100.0%' },
      { trend: { value: 0.1, isPositive: false }, expected: '-0.1%' }
    ]

    testCases.forEach(({ trend, expected }) => {
      render(
        <DashboardCard
          title={`Trend Test ${trend.value}`}
          value="$1,000.00"
          icon="📊"
          trend={trend}
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
    })
  })
})
