import React, { useState } from 'react';
import { User, DeliveryMethod } from '../types';
import { FULL_REGULATIONS, PRIVACY_POLICY } from '../constants';
import { ApiService } from '../services/api';
import { config } from '../config';
import { sanitizeServiceRequest, validateServiceRequest } from '../utils/validation';
import { Check, AlertCircle, Calendar, Truck, User as UserIcon } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface ServiceFormProps {
  user: User | null;
  onSuccess: () => void;
  onRequestLogin: () => void;
}

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
      // 1. Save to Database (Supabase)
      await ApiService.requests.create({
        componentModel: sanitized.componentModel,
        problemDescription: sanitized.problemDescription,
        deliveryMethod: formData.deliveryMethod,
        preferredDate: sanitized.preferredDate,
        clientName: sanitized.clientName,
        clientPhone: sanitized.clientPhone,
      });

      // 2. Send Email Notification (EmailJS)
      try {
        await emailjs.send(
            config.emailjs.serviceId,
            config.emailjs.templateId,
            {
                to_name: "Oddaj Amora",
                from_name: sanitized.clientName,
                from_email: user.email,
                from_phone: sanitized.clientPhone,
                component_model: sanitized.componentModel,
                problem_description: sanitized.problemDescription,
                delivery_method: formData.deliveryMethod,
                preferred_date: sanitized.preferredDate
            },
            config.emailjs.publicKey
        );
      } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
      }

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
    <div className="panel p-8 relative">
      <div className="border-b border-line pb-7 mb-8">
        <p className="eyebrow mb-3">Zgłoszenie serwisowe</p>
        <h1 className="text-[28px] font-bold text-ink-900 tracking-tighter">Formularz zgłoszeniowy</h1>
        <p className="text-ink-500 mt-2 text-[15px]">Wypełnij szczegóły dotyczące sprzętu i usterki.</p>
      </div>

      {!user && (
        <div className="mb-8 bg-skoczek-light border-l-2 border-skoczek-primary p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-skoczek-primary" />
          <div>
            <p className="font-semibold text-ink-900">Wymagane logowanie</p>
            <p className="text-[14px] mt-1 text-ink-600">
              Aby wysłać zgłoszenie serwisowe, musisz posiadać konto. 
              <button onClick={onRequestLogin} className="link-accent font-medium ml-1">Zaloguj się lub zarejestruj</button>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="border border-line p-4">
                <span className="eyebrow-muted block mb-2">Klient</span>
                <div className="flex items-center gap-2 text-ink-900 font-medium">
                  <UserIcon className="w-4 h-4 text-ink-400" /> {user.name}
                </div>
             </div>
             <div className="border border-line p-4">
                <span className="eyebrow-muted block mb-2">Kontakt</span>
                <div className="text-ink-900 font-medium">{user.phone}</div>
             </div>
          </div>
        )}

        <div>
          <label className="field-label">Model Amortyzatora / Dampera</label>
          <input
            type="text"
            name="componentModel"
            value={formData.componentModel}
            onChange={handleChange}
            required
            placeholder="np. RockShox Pike Ultimate 2023"
            className="field"
          />
        </div>

        <div>
          <label className="field-label">Opis Problemu</label>
          <textarea
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Opisz usterkę lub wymagane czynności serwisowe..."
            className="field"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="field-label">Sposób Dostarczenia</label>
             <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer group p-3 border rounded w-full transition bg-gray-50 hover:bg-white hover:border-gray-300 has-[:checked]:border-skoczek-primary has-[:checked]:bg-orange-50 has-[:checked]:text-skoczek-primary">
                 <input 
                    type="radio" 
                    name="deliveryMethod" 
                    value={DeliveryMethod.PERSONAL}
                    checked={formData.deliveryMethod === DeliveryMethod.PERSONAL}
                    onChange={handleChange}
                    className="hidden"
                 />
                 <div className="text-[14px] font-medium">Osobiście</div>
                 {formData.deliveryMethod === DeliveryMethod.PERSONAL && <Check className="w-4 h-4 ml-auto" />}
               </label>
               
               <label className="flex items-center gap-2 cursor-pointer group p-3 border rounded w-full transition bg-gray-50 hover:bg-white hover:border-gray-300 has-[:checked]:border-skoczek-primary has-[:checked]:bg-orange-50 has-[:checked]:text-skoczek-primary">
                 <input 
                    type="radio" 
                    name="deliveryMethod" 
                    value={DeliveryMethod.SHIPPING}
                    checked={formData.deliveryMethod === DeliveryMethod.SHIPPING}
                    onChange={handleChange}
                    className="hidden"
                 />
                 <div className="text-[14px] font-medium">Wysyłka</div>
                 {formData.deliveryMethod === DeliveryMethod.SHIPPING && <Check className="w-4 h-4 ml-auto" />}
               </label>
             </div>
          </div>

          <div>
            <label className="field-label">Preferowany Termin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-ink-400 pointer-events-none" />
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="field pl-11"
              />
            </div>
          </div>
        </div>

        <div className="border border-line p-5 text-sm bg-ink-50">
          <h2 className="eyebrow-muted mb-3">Regulamin i polityka prywatności</h2>
          <div className="mb-4 h-32 overflow-y-auto custom-scrollbar text-ink-600 pr-2 border border-line bg-white p-3 text-[12px] leading-relaxed whitespace-pre-wrap">
            {FULL_REGULATIONS}
          </div>
          
          <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                 <div className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center shrink-0 transition ${formData.acceptTerms ? 'border-skoczek-primary bg-skoczek-primary' : 'border-line-strong bg-white group-hover:border-ink-400'}`}>
                    {formData.acceptTerms && <Check className="w-3 h-3 text-white" />}
                 </div>
                <input 
                  type="checkbox" 
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleCheckbox}
                  className="hidden"
                />
                <span className={`text-xs ${error && !formData.acceptTerms ? "text-red-600 font-bold" : "text-gray-500 group-hover:text-gray-800"}`}>
                  Oświadczam, że zapoznałem się z Regulaminem Serwisu i akceptuję jego warunki.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group select-none">
                 <div className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center shrink-0 transition ${formData.acceptPrivacy ? 'border-skoczek-primary bg-skoczek-primary' : 'border-line-strong bg-white group-hover:border-ink-400'}`}>
                    {formData.acceptPrivacy && <Check className="w-3 h-3 text-white" />}
                 </div>
                <input 
                  type="checkbox" 
                  name="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={handleCheckbox}
                  className="hidden"
                />
                <span className={`text-xs ${error && !formData.acceptPrivacy ? "text-red-600 font-bold" : "text-gray-500 group-hover:text-gray-800"}`}>
                  Zapoznałem się z Polityką Prywatności serwisu (RODO).
                </span>
              </label>
          </div>
        </div>

        {error && (
          <div className="text-red-700 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 border-l-2 border-red-500">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !user}
          className={`w-full py-4 rounded font-semibold text-lg uppercase tracking-wider flex justify-center items-center gap-2 transition-all shadow-lg
            ${isSubmitting || !user
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-skoczek-primary text-white hover:bg-skoczek-primaryHover shadow-skoczek-primary/30'
            }`}
        >
          {isSubmitting ? 'Przetwarzanie...' : 'Wyślij zgłoszenie'}
          {!isSubmitting && <Check className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ServiceForm;