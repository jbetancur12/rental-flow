import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Activity {
  id: string
  type: 'payment' | 'maintenance' | 'contract' | 'tenant'
  title: string
  description: string
  date: string
  status: 'success' | 'warning' | 'error' | 'info'
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Rent Payment Received',
    description: 'Apartment 2A - $1,200',
    date: new Date().toISOString(),
    status: 'success',
  },
  {
    id: '2',
    type: 'maintenance',
    title: 'Maintenance Request',
    description: 'Leaky faucet in Unit 3B',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'warning',
  },
  {
    id: '3',
    type: 'contract',
    title: 'Contract Expiring',
    description: 'Unit 1A expires in 30 days',
    date: new Date(Date.now() - 172800000).toISOString(),
    status: 'warning',
  },
]

export function RecentActivity() {
  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <Badge className={getStatusColor(activity.status)}>
                {activity.type}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(activity.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}