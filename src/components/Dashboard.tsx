import React, { useEffect, useState } from 'react';
import { User, ServiceRequest, ServiceStatus } from '../types';
import { ApiService } from '../services/api';
import { Clock, CheckCircle, Package, AlertTriangle, Settings, RefreshCw, Calendar, Truck } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const statusStyles: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'text-yellow-700 border-yellow-200 bg-yellow-50',
  [ServiceStatus.RECEIVED]: 'text-blue-700 border-blue-200 bg-blue-50',
  [ServiceStatus.IN_PROGRESS]: 'text-orange-700 border-orange-200 bg-orange-50',
  [ServiceStatus.WAITING_FOR_PARTS]: 'text-red-700 border-red-200 bg-red-50',
  [ServiceStatus.READY]: 'text-green-700 border-green-200 bg-green-50',
  [ServiceStatus.COMPLETED]: 'text-gray-700 border-gray-200 bg-gray-100',
};

const statusIcons: Record<ServiceStatus, React.ReactNode> = {
  [ServiceStatus.PENDING]: <Clock className="w-3 h-3" />,
  [ServiceStatus.RECEIVED]: <Package className="w-3 h-3" />,
  [ServiceStatus.IN_PROGRESS]: <Settings className="w-3 h-3 animate-spin-slow" />,
  [ServiceStatus.WAITING_FOR_PARTS]: <AlertTriangle className="w-3 h-3" />,
  [ServiceStatus.READY]: <CheckCircle className="w-3 h-3" />,
  [ServiceStatus.COMPLETED]: <CheckCircle className="w-3 h-3" />,
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
        const data = await ApiService.requests.getAllForUser(user.id);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-4">
        <div>
           <h2 className="text-3xl font-black text-black tracking-tight uppercase">Panel Klienta</h2>
           <p className="text-gray-500 mt-1 text-sm">Historia Twoich napraw i statusy bieżące.</p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="flex items-start md:items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-skoczek-primary transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Odśwież dane
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border border-gray-200 text-skoczek-primary flex items-center justify-center font-black text-2xl rounded-full shadow-sm shrink-0">
                 {user.name.charAt(0)}
              </div>
              <div>
                 <h3 className="text-black font-bold text-lg leading-tight">{user.name}</h3>
                 <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
           </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-400 animate-pulse">Pobieranie danych...</div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Brak historii napraw.</p>
            <p className="text-sm mt-2">Wypełnij formularz, aby zlecić pierwszy serwis.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden bg-gray-50 p-4 space-y-4">
               {requests.map((req) => (
                 <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                           <Calendar className="w-3 h-3" />
                           {new Date(req.createdAt).toLocaleDateString('pl-PL')}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                           <Truck className="w-3 h-3" />
                           {req.deliveryMethod === 'Osobisty' ? 'Osob.' : 'Wysyłka'}
                        </div>
                    </div>

                    <div className="mb-4">
                       <h4 className="text-lg font-black text-black mb-1">{req.componentModel}</h4>
                       <p className="text-sm text-gray-600 leading-relaxed">{req.problemDescription}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Naprawy</span>
                       <div className={`flex items-center justify-center gap-2 px-4 py-3 border rounded text-xs font-bold uppercase tracking-wide w-full text-center ${statusStyles[req.status]}`}>
                          {statusIcons[req.status]}
                          {req.status}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-5 border-b border-gray-200">Data</th>
                    <th className="p-5 border-b border-gray-200">Sprzęt / Usterka</th>
                    <th className="p-5 border-b border-gray-200 text-center">Status</th>
                    <th className="p-5 border-b border-gray-200 text-right">Metoda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition group">
                      <td className="p-5 text-gray-600 font-medium whitespace-nowrap align-middle">
                        {new Date(req.createdAt).toLocaleDateString('pl-PL')}
                        <div className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="p-5 align-middle">
                        <div className="text-black font-bold text-lg">{req.componentModel}</div>
                        <div className="text-sm text-gray-500 font-normal truncate max-w-[250px] group-hover:text-gray-800 transition">
                          {req.problemDescription}
                        </div>
                      </td>
                      <td className="p-5 align-middle text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-wide ${statusStyles[req.status]}`}>
                          {statusIcons[req.status]}
                          {req.status}
                        </span>
                      </td>
                      <td className="p-5 text-gray-500 text-sm font-medium align-middle text-right">
                        {req.deliveryMethod === 'Osobisty' ? 'Dostarczenie osobiste' : 'Wysyłka kurierem'}
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