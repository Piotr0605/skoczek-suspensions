import React, { useEffect, useState } from 'react';
import { User, ServiceRequest } from '../types';
import { ApiService } from '../services/api';
import { RefreshCw } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await ApiService.requests.getAllForUser();
      setRequests(data);
    } catch (e) {
      console.error("Failed to fetch requests", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user.id]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-skoczek-line pb-6 md:flex-row md:items-end">
        <div>
          <h2 className="font-display text-4xl text-skoczek-ink">Twoje zlecenia</h2>
          <p className="mt-1 text-sm text-skoczek-muted">{user.name} · {user.email}</p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 text-sm font-semibold text-skoczek-muted hover:text-skoczek-ink"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Odśwież
        </button>
      </div>

      <div className="border border-skoczek-line bg-skoczek-card">
        {loading ? (
          <div className="p-16 text-center text-skoczek-muted">Pobieranie danych...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-2xl text-skoczek-ink">Brak zleceń</p>
            <p className="mt-2 text-sm text-skoczek-muted">Po zgłoszeniu serwisu status pojawi się tutaj.</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-skoczek-line md:hidden">
              {requests.map((req) => (
                <li key={req.id} className="p-4">
                  <div className="flex justify-between font-mono text-xs text-skoczek-muted">
                    <span>{new Date(req.createdAt).toLocaleDateString('pl-PL')}</span>
                    <span>{req.deliveryMethod === 'Osobisty' ? 'Osobiście' : 'Wysyłka'}</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-skoczek-ink">{req.componentModel}</h3>
                  <p className="mt-1 text-sm text-skoczek-muted">{req.problemDescription}</p>
                  <p className="mt-3 text-sm font-semibold text-skoczek-ink">{req.status}</p>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-skoczek-line text-xs uppercase tracking-wide text-skoczek-muted">
                  <tr>
                    <th className="p-4">Data</th>
                    <th className="p-4">Sprzęt</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Dostarczenie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-skoczek-line">
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td className="whitespace-nowrap p-4 font-mono text-sm text-skoczek-muted">
                        {new Date(req.createdAt).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-skoczek-ink">{req.componentModel}</div>
                        <div className="max-w-md text-sm text-skoczek-muted">{req.problemDescription}</div>
                      </td>
                      <td className="p-4 text-sm font-semibold text-skoczek-ink">{req.status}</td>
                      <td className="p-4 text-right text-sm text-skoczek-muted">
                        {req.deliveryMethod === 'Osobisty' ? 'Osobiście' : 'Wysyłka'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
