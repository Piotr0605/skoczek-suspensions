const MAX_COMPONENT_MODEL = 200;
const MAX_DESCRIPTION = 2000;
const MAX_NAME = 100;
const MAX_PHONE = 30;
const MIN_PASSWORD = 8;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD) {
    return `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`;
  }
  return null;
}

export function validateRegistration(name: string, phone: string): string | null {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > MAX_NAME) {
    return 'Podaj prawidłowe imię i nazwisko.';
  }
  const trimmedPhone = phone.trim();
  if (!trimmedPhone || trimmedPhone.length > MAX_PHONE) {
    return 'Podaj prawidłowy numer telefonu.';
  }
  return null;
}

export function validateServiceRequest(data: {
  componentModel: string;
  problemDescription: string;
}): string | null {
  const model = data.componentModel.trim();
  if (!model || model.length > MAX_COMPONENT_MODEL) {
    return 'Podaj prawidłowy model amortyzatora (max 200 znaków).';
  }
  const description = data.problemDescription.trim();
  if (!description || description.length > MAX_DESCRIPTION) {
    return 'Opis problemu jest wymagany (max 2000 znaków).';
  }
  return null;
}

export function sanitizeServiceRequest(data: {
  componentModel: string;
  problemDescription: string;
  preferredDate: string;
  clientName: string;
  clientPhone: string;
}) {
  return {
    componentModel: data.componentModel.trim().slice(0, MAX_COMPONENT_MODEL),
    problemDescription: data.problemDescription.trim().slice(0, MAX_DESCRIPTION),
    preferredDate: data.preferredDate,
    clientName: data.clientName.trim().slice(0, MAX_NAME),
    clientPhone: data.clientPhone.trim().slice(0, MAX_PHONE),
  };
}
