import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Property } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Bed, Bath, Square } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  onEdit: (property: Property) => void
  onView: (property: Property) => void
}

export function PropertyCard({ property, onEdit, onView }: PropertyCardProps) {
  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'RENTED':
        return 'bg-blue-100 text-blue-800'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800'
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{property.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {property.address}, {property.city}
            </div>
          </div>
          <Badge className={getStatusColor(property.status)}>
            {property.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {property.images.length > 0 && (
            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
              <img
                src={property.images[0]}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {property.bedrooms && (
                <div className="flex items-center">
                  <Bed className="h-3 w-3 mr-1" />
                  {property.bedrooms}
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center">
                  <Bath className="h-3 w-3 mr-1" />
                  {property.bathrooms}
                </div>
              )}
              {property.size_sqft && (
                <div className="flex items-center">
                  <Square className="h-3 w-3 mr-1" />
                  {property.size_sqft} sq ft
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                {formatCurrency(property.monthly_rent)}/mo
              </p>
              <p className="text-sm text-muted-foreground">
                Deposit: {formatCurrency(property.security_deposit)}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => onView(property)}>
                View
              </Button>
              <Button size="sm" onClick={() => onEdit(property)}>
                Edit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}