import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, DollarSign, FileText, Wrench } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DashboardStats } from '@/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Properties',
      value: stats.total_properties,
      icon: Building2,
      description: `${stats.occupied_properties} occupied, ${stats.available_properties} available`,
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.total_revenue),
      icon: DollarSign,
      description: `${stats.pending_payments} pending payments`,
    },
    {
      title: 'Active Contracts',
      value: stats.active_contracts,
      icon: FileText,
      description: `${stats.expiring_contracts} expiring soon`,
    },
    {
      title: 'Maintenance Requests',
      value: stats.open_maintenance,
      icon: Wrench,
      description: 'Open requests',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}