iimport React, { useState } from 'react';
import { User, DeliveryMethod } from '../types';
import { FULL_REGULATIONS, PRIVACY_POLICY } from '../constants';
import { ApiService } from '../services/api';
import { Check, AlertCircle, Calendar, Truck, User as UserIcon } from 'lucide-react';
import emailjs from '@emailjs/browser';

// --- EMAILJS CONFIGURATION ---
// 1. Service ID: Wzięte z Twojego zrzutu ekranu
const EMAILJS_SERVICE_ID = 'service_kisfjge'; 

// 2. Template ID: Wejdź w "Email Templates", stwórz szablon i wklej tu jego ID
const EMAILJS_TEMPLATE_ID: string = 'template_034dgd2'; // np. template_abc123

// 3. Public Key: Wejdź w Account -> API Keys -> Public Key i wklej go tutaj
const EMAILJS_PUBLIC_KEY: string = 'QAmELeB9ozCGAw_oN'; // np. user_XaB12...

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

    setIsSubmitting(true);

    try {
      // 1. Save to Database (Supabase)
      await ApiService.requests.create(user.id, {
        componentModel: formData.componentModel,
        problemDescription: formData.problemDescription,
        deliveryMethod: formData.deliveryMethod,
        preferredDate: formData.preferredDate,
        clientName: user.name,
        clientPhone: user.phone
      });

      // 2. Send Email Notification (EmailJS)
      // USUNIĘTO BŁĘDNY WARUNEK BLOKUJĄCY WYSYŁKĘ
      try {
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
                to_name: "Skoczek Suspensions",
                from_name: user.name,
                from_email: user.email,
                from_phone: user.phone,
                component_model: formData.componentModel,
                problem_description: formData.problemDescription,
                delivery_method: formData.deliveryMethod,
                preferred_date: formData.preferredDate
            },
            EMAILJS_PUBLIC_KEY
        );
      } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Opcjonalnie: możesz dodać alert, ale lepiej nie blokować sukcesu formularza z powodu błędu maila
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
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-xl relative">
      <div className="border-b border-gray-100 pb-6 mb-6">
        <h2 className="text-2xl font-black text-black flex items-center gap-3 uppercase tracking-tight">
            <div className="bg-skoczek-primary text-white p-2 rounded">
                <Truck className="w-5 h-5" />
            </div>
            Formularz Zgłoszeniowy
        </h2>
        <p className="text-gray-500 mt-2 ml-12 text-sm">Wypełnij szczegóły dotyczące sprzętu i usterki.</p>
      </div>

      {!user && (
        <div className="mb-8 bg-orange-50 border border-skoczek-primary/20 text-orange-800 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-skoczek-primary" />
          <div>
            <p className="font-bold text-gray-900">Wymagane logowanie</p>
            <p className="text-sm mt-1 text-gray-600">
              Aby wysłać zgłoszenie serwisowe, musisz posiadać konto. 
              <button onClick={onRequestLogin} className="text-skoczek-primary font-bold underline ml-1 hover:text-skoczek-primaryHover transition">Zaloguj się lub zarejestruj</button>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Klient</label>
                <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <UserIcon className="w-4 h-4 text-gray-400" /> {user.name}
                </div>
             </div>
             <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Kontakt</label>
                <div className="text-gray-900 font-bold">{user.phone}</div>
             </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Model Amortyzatora / Dampera</label>
          <input
            type="text"
            name="componentModel"
            value={formData.componentModel}
            onChange={handleChange}
            required
            placeholder="np. RockShox Pike Ultimate 2023"
            className="w-full bg-white border border-gray-300 rounded p-4 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Opis Problemu</label>
          <textarea
            name="problemDescription"
            value={formData.problemDescription}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Opisz usterkę lub wymagane czynności serwisowe..."
            className="w-full bg-white border border-gray-300 rounded p-4 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Sposób Dostarczenia</label>
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
                 <div className="text-sm font-bold">Osobiście</div>
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
                 <div className="text-sm font-bold">Wysyłka</div>
                 {formData.deliveryMethod === DeliveryMethod.SHIPPING && <Check className="w-4 h-4 ml-auto" />}
               </label>
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Preferowany Termin</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded p-3 pl-12 text-gray-900 focus:border-skoczek-primary focus:ring-1 focus:ring-skoczek-primary outline-none transition"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded border border-gray-200 text-sm">
          <h4 className="text-black font-bold uppercase text-xs mb-3">Regulamin Serwisu i Polityka Prywatności</h4>
          <div className="mb-4 h-32 overflow-y-auto custom-scrollbar text-gray-600 pr-2 border border-gray-200 bg-white p-3 rounded text-xs whitespace-pre-wrap">
            {FULL_REGULATIONS}
          </div>
          
          <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                 <div className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center shrink-0 transition ${formData.acceptTerms ? 'border-skoczek-primary bg-skoczek-primary' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
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
                 <div className={`mt-0.5 w-5 h-5 border rounded flex items-center justify-center shrink-0 transition ${formData.acceptPrivacy ? 'border-skoczek-primary bg-skoczek-primary' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
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
          <div className="text-red-600 text-sm font-bold flex items-center gap-2 bg-red-50 p-3 rounded border border-red-100">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !user}
          className={`w-full py-4 rounded font-black text-lg uppercase tracking-wider flex justify-center items-center gap-2 transition-all shadow-lg
            ${isSubmitting || !user
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-skoczek-primary text-white hover:bg-skoczek-primaryHover shadow-skoczek-primary/30'
            }`}
        >
          {isSubmitting ? 'Przetwarzanie...' : 'Wyślij Zgłoszenie'}
          {!isSubmitting && <Check className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ServiceForm;