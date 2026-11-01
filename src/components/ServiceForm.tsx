import React, { useState } from 'react';
import { User, DeliveryMethod } from '../types';
import { FULL_REGULATIONS } from '../constants';
import { ApiService } from '../services/api';
import { sanitizeServiceRequest, validateServiceRequest } from '../utils/validation';
import { Check, AlertCircle } from 'lucide-react';

interface ServiceFormProps {
  user: User | null;
  onSuccess: () => void;
  onRequestLogin: () => void;
}

const fieldClass = 'w-full border border-skoczek-line bg-skoczek-paper px-3 py-3 text-skoczek-ink outline-none focus:border-skoczek-ink';

const ServiceForm: React.FC<ServiceFormProps> = ({ user, onSuccess, onRequestLogin }) => {
  const [formData, setFormData] = useState({
    componentModel: '',
    problemDescription: '',
    preferredDate: '',
    deliveryMethod: DeliveryMethod.PERSONAL,
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      onRequestLogin();
      return;
    }

    if (!formData.acceptTerms) {
      setError("Musisz zaakceptować regulamin serwisu.");
      return;
    }

    if (!formData.acceptPrivacy) {
      setError("Musisz zapoznać się z polityką prywatności.");
      return;
    }

    const validationError = validateServiceRequest(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    const sanitized = sanitizeServiceRequest({
      componentModel: formData.componentModel,
      problemDescription: formData.problemDescription,
      preferredDate: formData.preferredDate,
      clientName: user.name,
      clientPhone: user.phone,
    });

    setIsSubmitting(true);

    try {
      await ApiService.requests.create({
        componentModel: sanitized.componentModel,
        problemDescription: sanitized.problemDescription,
        deliveryMethod: formData.deliveryMethod,
        preferredDate: sanitized.preferredDate,
        clientName: sanitized.clientName,
        clientPhone: sanitized.clientPhone,
      });

      onSuccess();
      setFormData({
        componentModel: '',
        problemDescription: '',
        preferredDate: '',
        deliveryMethod: DeliveryMethod.PERSONAL,
        acceptTerms: false,
        acceptPrivacy: false,
      });
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd podczas zapisywania zgłoszenia. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="border border-skoczek-line bg-skoczek-card p-6 md:p-8">
      <div className="border-b border-skoczek-line pb-5 mb-6">
        <h2 className="font-display text-3xl text-skoczek-ink">Zgłoszenie serwisu</h2>
        <p className="mt-2 text-skoczek-muted">Model, usterka i sposób dostarczenia. Zapis trafia do panelu mechanika.</p>
      </div>

      {!user && (
        <div className="mb-8 border border-skoczek-line bg-skoczek-paper p-4">
          <p className="font-semibold text-skoczek-ink">Najpierw konto</p>
          <p className="mt-1 text-sm text-skoczek-muted">
            Zgłoszenie jest przypisane do Twojego konta.
            <button onClick={onRequestLogin} className="ml-1 font-semibold text-skoczek-primary underline">Zaloguj się lub zarejestruj</button>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {user && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border border-skoczek-line bg-skoczek-paper p-4">
              <p className="text-xs text-skoczek-muted">Klient</p>
              <p className="font-semibold text-skoczek-ink">{user.name}</p>
            </div>
            <div className="border border-skoczek-line bg-skoczek-paper p-4">
              <p className="text-xs text-skoczek-muted">Telefon i e-mail</p>
              <p className="font-semibold text-skoczek-ink">{user.phone}</p>
              <p className="font-mono text-sm text-skoczek-muted">{user.email}</p>
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-skoczek-ink">Model amortyzatora</label>
          <input
            type="text"
            name="componentModel"
            value={formData.componentModel}
            onChange={handleChange}
            required
            placeholder="np. RockShox Pike Ultimate 2023"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-skoczek-ink">Opis usterki</label>
          <textarea
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Co stuka, cieknie albo wymaga przeglądu."
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-skoczek-ink">Dostarczenie</p>
            <div className="flex gap-3">
              <label className={`flex flex-1 cursor-pointer items-center justify-between border px-3 py-3 text-sm font-semibold ${formData.deliveryMethod === DeliveryMethod.PERSONAL ? 'border-skoczek-ink bg-skoczek-paper text-skoczek-ink' : 'border-skoczek-line text-skoczek-muted'}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={DeliveryMethod.PERSONAL}
                  checked={formData.deliveryMethod === DeliveryMethod.PERSONAL}
                  onChange={handleChange}
                  className="sr-only"
                />
                Osobiście
                {formData.deliveryMethod === DeliveryMethod.PERSONAL && <Check className="h-4 w-4" />}
              </label>
              <label className={`flex flex-1 cursor-pointer items-center justify-between border px-3 py-3 text-sm font-semibold ${formData.deliveryMethod === DeliveryMethod.SHIPPING ? 'border-skoczek-ink bg-skoczek-paper text-skoczek-ink' : 'border-skoczek-line text-skoczek-muted'}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={DeliveryMethod.SHIPPING}
                  checked={formData.deliveryMethod === DeliveryMethod.SHIPPING}
                  onChange={handleChange}
                  className="sr-only"
                />
                Wysyłka
                {formData.deliveryMethod === DeliveryMethod.SHIPPING && <Check className="h-4 w-4" />}
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-skoczek-ink">Preferowany termin</label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="border border-skoczek-line bg-skoczek-paper p-4 text-sm">
          <h3 className="mb-3 font-semibold text-skoczek-ink">Regulamin i prywatność</h3>
          <div className="mb-4 h-32 overflow-y-auto border border-skoczek-line bg-skoczek-card p-3 text-xs leading-relaxed text-skoczek-muted whitespace-pre-wrap">
            {FULL_REGULATIONS}
          </div>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleCheckbox}
                className="mt-1"
              />
              <span className={error && !formData.acceptTerms ? 'font-semibold text-red-700' : 'text-skoczek-muted'}>
                Akceptuję regulamin serwisu.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="acceptPrivacy"
                checked={formData.acceptPrivacy}
                onChange={handleCheckbox}
                className="mt-1"
              />
              <span className={error && !formData.acceptPrivacy ? 'font-semibold text-red-700' : 'text-skoczek-muted'}>
                Zapoznałem się z polityką prywatności.
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !user}
          className={`flex w-full items-center justify-center gap-2 py-3 text-base font-semibold ${
            isSubmitting || !user
              ? 'cursor-not-allowed bg-skoczek-line text-skoczek-muted'
              : 'bg-skoczek-primary text-white hover:bg-skoczek-primaryHover'
          }`}
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz zgłoszenie'}
        </button>
      </form>
    </div>
  );
};

export default ServiceForm;
