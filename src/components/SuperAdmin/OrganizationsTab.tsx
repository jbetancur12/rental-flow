import { OrganizationFilters } from './OrganizationFilters';
import { OrganizationsTable } from './OrganizationsTable';
import { OrganizationSummary } from '../../types';

interface OrganizationsTabProps {
  organizations: OrganizationSummary[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function OrganizationsTab({
  organizations,
  isLoading,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange
}: OrganizationsTabProps) {
  return (
    <div className="space-y-6">
      <OrganizationFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
      />
      
      <OrganizationsTable
        organizations={organizations}
        isLoading={isLoading}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />
    </div>
  );
}