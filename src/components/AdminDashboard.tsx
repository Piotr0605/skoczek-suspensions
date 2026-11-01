import React, { useEffect, useState } from 'react';
import { ContactInquiry, ServiceRequest, ServiceStatus } from '../types';
import { ApiService } from '../services/api';
import { RefreshCw, Save, Archive, Phone } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | 'ALL' | 'HISTORY'>('ALL');
  const [edits, setEdits] = useState<Record<string, { status: ServiceStatus, cost: string }>>({});

  const fetchRequests = async () => {
    setLoading(true);
    setInquiryError(null);
    try {
      const data = await ApiService.requests.getAll();
      setRequests(data);
    } catch (e) {
      console.error("Failed to fetch admin data", e);
      alert("Błąd pobierania danych. Upewnij się, że masz uprawnienia Administratora.");
    }

    try {
      const inquiryData = await ApiService.inquiries.getAll();
      setInquiries(inquiryData);
    } catch (e) {
      console.error("Failed to fetch inquiries", e);
      setInquiryError("Nie udało się pobrać zapytań. Uruchom migrację 002 w Supabase.");
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

  const archiveRequest = async (id: string) => {
    if (!window.confirm("Czy na pewno chcesz zakończyć to zlecenie i przenieść je do historii?")) return;
    try {
      await ApiService.requests.updateStatus(id, ServiceStatus.COMPLETED);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: ServiceStatus.COMPLETED } : r));
    } catch (e) {
      alert("Błąd archiwizacji");
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'HISTORY') {
      return r.status === ServiceStatus.COMPLETED;
    }
    if (filterStatus === 'ALL') {
      return r.status !== ServiceStatus.COMPLETED;
    }
    return r.status === filterStatus;
  });

  const filterButton = (active: boolean) =>
    `px-3 py-1 text-sm ${active ? 'border-skoczek-ink bg-skoczek-ink text-skoczek-paper' : 'border-skoczek-line bg-skoczek-card text-skoczek-muted'}`;

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-skoczek-line pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-skoczek-primary">Warsztat</p>
          <h2 className="font-display text-4xl text-skoczek-ink">Panel mechanika</h2>
          <p className="mt-1 text-sm text-skoczek-muted">Zlecenia i zapytania z formularza. Odśwież, żeby zobaczyć nowe.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 border border-skoczek-line px-4 py-2 text-sm font-semibold hover:border-skoczek-ink"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Odśwież
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('ALL')} className={`border ${filterButton(filterStatus === 'ALL')}`}>Bieżące</button>
        <button onClick={() => setFilterStatus(ServiceStatus.PENDING)} className={`border ${filterButton(filterStatus === ServiceStatus.PENDING)}`}>Nowe</button>
        <button onClick={() => setFilterStatus(ServiceStatus.IN_PROGRESS)} className={`border ${filterButton(filterStatus === ServiceStatus.IN_PROGRESS)}`}>W trakcie</button>
        <button onClick={() => setFilterStatus(ServiceStatus.READY)} className={`border ${filterButton(filterStatus === ServiceStatus.READY)}`}>Gotowe</button>
        <button onClick={() => setFilterStatus('HISTORY')} className={`inline-flex items-center gap-1 border ${filterButton(filterStatus === 'HISTORY')}`}>
          <Archive className="h-3 w-3" /> Historia
        </button>
      </div>

      <div className="border border-skoczek-line bg-skoczek-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-skoczek-line text-xs uppercase tracking-wide text-skoczek-muted">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Klient</th>
                <th className="p-4">Sprzęt</th>
                <th className="w-48 p-4">Status</th>
                <th className="w-32 p-4">Wycena</th>
                <th className="w-28 p-4 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-skoczek-line">
              {filteredRequests.map((req) => {
                const isEditing = !!edits[req.id];
                const currentStatus = edits[req.id]?.status || req.status;
                const currentCost = edits[req.id]?.cost !== undefined ? edits[req.id].cost : (req.estimatedCost || '');
                const isCompleted = req.status === ServiceStatus.COMPLETED;
                const isNew = req.status === ServiceStatus.PENDING;

                return (
                  <tr key={req.id} className={isCompleted ? 'bg-skoczek-paper text-skoczek-muted' : ''}>
                    <td className="p-4 align-top">
                      <div className="font-semibold text-skoczek-ink">{new Date(req.createdAt).toLocaleDateString('pl-PL')}</div>
                      <div className="mt-1 font-mono text-xs text-skoczek-muted">{req.id.slice(0, 8)}</div>
                      <div className="mt-2 text-xs">{req.deliveryMethod === 'Osobisty' ? 'Odbiór osobisty' : 'Wysyłka'}</div>
                      {isNew && <div className="mt-2 text-xs font-semibold text-skoczek-primary">Nowe</div>}
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-semibold text-skoczek-ink">{req.clientName || 'Brak danych'}</div>
                      {req.clientPhone && (
                        <a href={`tel:${req.clientPhone}`} className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-skoczek-ink">
                          <Phone className="h-3 w-3" /> {req.clientPhone}
                        </a>
                      )}
                      {req.clientEmail && (
                        <a href={`mailto:${req.clientEmail}`} className="mt-1 block font-mono text-sm text-skoczek-primary">
                          {req.clientEmail}
                        </a>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-semibold text-skoczek-ink">{req.componentModel}</div>
                      <p className="mt-2 max-h-24 overflow-y-auto text-sm text-skoczek-muted">{req.problemDescription}</p>
                      <p className="mt-2 text-xs text-skoczek-muted">Termin: {req.preferredDate || 'brak'}</p>
                    </td>
                    <td className="p-4 align-top">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as ServiceStatus)}
                        className="w-full border border-skoczek-line bg-skoczek-paper p-2 text-sm"
                      >
                        {Object.values(ServiceStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 align-top">
                      <input
                        type="number"
                        value={currentCost}
                        onChange={(e) => handleCostChange(req.id, e.target.value)}
                        placeholder="0"
                        className="w-full border border-skoczek-line bg-skoczek-paper p-2 text-right font-mono text-sm"
                      />
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex justify-center gap-2">
                        {isEditing && (
                          <button
                            onClick={() => saveChanges(req.id)}
                            className="bg-skoczek-primary p-2 text-white"
                            title="Zapisz zmiany"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() => archiveRequest(req.id)}
                            className="border border-skoczek-line p-2 text-skoczek-muted"
                            title="Zakończ i przenieś do historii"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
          <div className="p-12 text-center text-skoczek-muted">Brak zgłoszeń w tej kategorii.</div>
        )}
      </div>

      <section>
        <h3 className="font-display text-3xl text-skoczek-ink">Zapytania</h3>
        <p className="mt-1 text-sm text-skoczek-muted">Wiadomości z formularza na stronie kontaktu.</p>
        {inquiryError && <p className="mt-3 text-sm text-red-700">{inquiryError}</p>}
        {inquiries.length === 0 && !inquiryError ? (
          <p className="mt-4 text-sm text-skoczek-muted">Brak zapytań.</p>
        ) : (
          <ul className="mt-4 divide-y divide-skoczek-line border border-skoczek-line bg-skoczek-card">
            {inquiries.map((item) => (
              <li key={item.id} className="grid gap-2 p-4 md:grid-cols-[180px_1fr]">
                <div>
                  <p className="font-mono text-xs text-skoczek-muted">{new Date(item.createdAt).toLocaleString('pl-PL')}</p>
                  <p className="mt-1 font-semibold text-skoczek-ink">{item.name}</p>
                  <a href={`mailto:${item.email}`} className="font-mono text-sm text-skoczek-primary">{item.email}</a>
                </div>
                <div>
                  <p className="font-semibold text-skoczek-ink">{item.subject}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-skoczek-muted">{item.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
