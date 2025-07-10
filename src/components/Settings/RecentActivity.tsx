import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Wrench, User, Home, FileText } from 'lucide-react';
import apiClient from '../../config/api';

const entityIconMap: any = {
  PAYMENT: { icon: DollarSign, color: 'text-emerald-600' },
  MAINTENANCE: { icon: Wrench, color: 'text-orange-600' },
  TENANT: { icon: User, color: 'text-blue-600' },
  PROPERTY: { icon: Home, color: 'text-indigo-600' },
  CONTRACT: { icon: FileText, color: 'text-purple-600' },
};

export function RecentActivity() {
  const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async (currentPage: number) => {
    try {
      setIsLoading(true);
      const response = await apiClient.getLogActivities({ page: currentPage, limit: 5, isSystemAction: false });
      
      // Si es la primera página, reemplaza los datos. Si no, los añade.
      setActivities(prev => currentPage === 1 ? response.data : [...prev, ...response.data]);
      
      // Actualizamos si hay más páginas por cargar
      setHasMore(response.pagination.page < response.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch recent activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(page);
  }, [page, fetchActivities]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Actividad Reciente</h3>
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Cargando actividad...</p>
        ) : activities.length > 0 ? (
          activities.map((activity: any) => {
            const config = entityIconMap[activity.entityType] || { icon: Wrench, color: 'text-slate-600 dark:text-slate-400' };
            const Icon = config.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${config.color}`}> 
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-slate-100">{activity.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No hay actividad reciente.</p>
        )}
      </div>
      <div className="mt-6 text-center">
        {isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>}
        {!isLoading && hasMore && (
          <button 
            onClick={handleLoadMore}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Cargar más
          </button>
        )}
        {!isLoading && !hasMore && activities.length > 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">No hay más actividades.</p>
        )}
      </div>
    </div>
  );
}