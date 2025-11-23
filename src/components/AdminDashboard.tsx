import React, { useEffect, useState } from 'react';
import { ServiceRequest, ServiceStatus } from '../types';
import { ApiService } from '../services/api';
import { RefreshCw, Save, Filter, Phone } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | 'ALL'>('ALL');
  
  const [edits, setEdits] = useState<Record<string, { status: ServiceStatus, cost: string }>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
        const data = await ApiService.requests.getAll();
        setRequests(data);
    } catch (e) {
        console.error("Failed to fetch admin data", e);
        alert("Błąd pobierania danych. Upewnij się, że masz uprawnienia Administratora.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = (id: string, newStatus: ServiceStatus) => {
    setEdits(prev => ({
        ...prev,
        [id]: { 
            status: newStatus, 
            cost: prev[id]?.cost || requests.find(r => r.id === id)?.estimatedCost?.toString() || '' 
        }
    }));
  };

  const handleCostChange = (id: string, newCost: string) => {
    setEdits(prev => ({
        ...prev,
        [id]: { 
            status: prev[id]?.status || requests.find(r => r.id === id)?.status as ServiceStatus, 
            cost: newCost 
        }
    }));
  };

  const saveChanges = async (id: string) => {
    const edit = edits[id];
    if (!edit) return;

    try {
        await ApiService.requests.updateStatus(id, edit.status, parseFloat(edit.cost) || 0);
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: edit.status, estimatedCost: parseFloat(edit.cost) || 0 } : r));
        
        const newEdits = { ...edits };
        delete newEdits[id];
        setEdits(newEdits);
    } catch (e) {
        alert("Błąd zapisu");
    }
  };

  const filteredRequests = requests.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded uppercase">Admin</span>
             <h2 className="text-3xl font-black text-black tracking-tight uppercase">Panel Mechanika</h2>
           </div>
           <p className="text-gray-500 text-sm">Zarządzanie zgłoszeniami serwisowymi.</p>
        </div>
        <div className="flex gap-2">
            <button 
            onClick={fetchRequests} 
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded text-sm font-bold uppercase hover:border-skoczek-primary hover:text-skoczek-primary transition"
            >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Odśwież
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
         <Filter className="w-4 h-4 text-gray-500 mr-2" />
         <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1 rounded text-xs font-bold uppercase ${filterStatus === 'ALL' ? 'bg-black text-white' : 'bg-white text-gray-600 border'}`}>Wszystkie</button>
         <button onClick={() => setFilterStatus(ServiceStatus.PENDING)} className={`px-3 py-1 rounded text-xs font-bold uppercase ${filterStatus === ServiceStatus.PENDING ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 border'}`}>Nowe</button>
         <button onClick={() => setFilterStatus(ServiceStatus.IN_PROGRESS)} className={`px-3 py-1 rounded text-xs font-bold uppercase ${filterStatus === ServiceStatus.IN_PROGRESS ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border'}`}>W trakcie</button>
         <button onClick={() => setFilterStatus(ServiceStatus.READY)} className={`px-3 py-1 rounded text-xs font-bold uppercase ${filterStatus === ServiceStatus.READY ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border'}`}>Gotowe</button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 border-b">Data / ID</th>
                <th className="p-4 border-b">Klient</th>
                <th className="p-4 border-b">Sprzęt / Usterka</th>
                <th className="p-4 border-b w-48">Status</th>
                <th className="p-4 border-b w-32">Wycena (PLN)</th>
                <th className="p-4 border-b w-24">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => {
                const isEditing = !!edits[req.id];
                const currentStatus = edits[req.id]?.status || req.status;
                const currentCost = edits[req.id]?.cost !== undefined ? edits[req.id].cost : (req.estimatedCost || '');

                return (
                  <tr key={req.id} className="hover:bg-gray-50 transition group">
                    <td className="p-4 align-top">
                      <div className="font-bold text-gray-900">{new Date(req.createdAt).toLocaleDateString('pl-PL')}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1">{req.id.slice(0, 8)}...</div>
                      <div className="mt-2 text-xs bg-gray-200 inline-block px-1.5 py-0.5 rounded text-gray-600 font-bold">{req.deliveryMethod === 'Osobisty' ? 'OSOB.' : 'WYSYŁKA'}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-black text-sm">{req.clientName || 'Brak danych'}</div>
                      {req.clientPhone && (
                          <a href={`tel:${req.clientPhone}`} className="inline-flex items-center gap-1 text-xs font-bold text-skoczek-primary hover:underline mt-1">
                              <Phone className="w-3 h-3" /> {req.clientPhone}
                          </a>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-black font-bold text-sm mb-1">{req.componentModel}</div>
                      <div className="text-xs text-gray-500 bg-white border border-gray-200 p-2 rounded max-h-20 overflow-y-auto custom-scrollbar">
                        {req.problemDescription}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Termin: <span className="text-gray-600 font-medium">{req.preferredDate || 'Brak'}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                       <select 
                         value={currentStatus}
                         onChange={(e) => handleStatusChange(req.id, e.target.value as ServiceStatus)}
                         className={`w-full text-xs font-bold uppercase p-2 rounded border focus:ring-2 focus:ring-skoczek-primary outline-none cursor-pointer
                           ${currentStatus === ServiceStatus.PENDING ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : ''}
                           ${currentStatus === ServiceStatus.READY ? 'bg-green-50 text-green-800 border-green-200' : ''}
                           ${currentStatus === ServiceStatus.IN_PROGRESS ? 'bg-orange-50 text-orange-800 border-orange-200' : ''}
                           ${currentStatus === ServiceStatus.COMPLETED ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                         `}
                       >
                         {Object.values(ServiceStatus).map(s => (
                           <option key={s} value={s}>{s}</option>
                         ))}
                       </select>
                    </td>
                    <td className="p-4 align-top">
                       <div className="relative">
                         <input 
                           type="number" 
                           value={currentCost}
                           onChange={(e) => handleCostChange(req.id, e.target.value)}
                           placeholder="0.00"
                           className="w-full bg-white border border-gray-300 rounded p-2 text-right text-sm font-bold focus:border-skoczek-primary outline-none"
                         />
                         <span className="absolute left-2 top-2 text-xs text-gray-400">PLN</span>
                       </div>
                    </td>
                    <td className="p-4 align-top">
                       {isEditing && (
                         <button 
                           onClick={() => saveChanges(req.id)}
                           className="bg-skoczek-primary text-white p-2 rounded hover:bg-skoczek-primaryHover transition w-full flex justify-center items-center shadow-md"
                           title="Zapisz zmiany"
                         >
                           <Save className="w-4 h-4" />
                         </button>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
            <div className="p-12 text-center text-gray-500">Brak zgłoszeń o wybranym statusie.</div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;