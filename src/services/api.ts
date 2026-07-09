
import { supabase } from './supabaseClient';
import { User, ServiceRequest, ServiceStatus, UserRole, DeliveryMethod } from '../types';
import { getUserRole } from '../utils/auth';

function mapAuthUser(authUser: {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): User {
  return {
    id: authUser.id,
    email: authUser.email!,
    name: (authUser.user_metadata?.name as string) || '',
    phone: (authUser.user_metadata?.phone as string) || '',
    role: getUserRole(authUser),
  };
}

async function requireSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    throw new Error('Sesja wygasła. Zaloguj się ponownie.');
  }
  return session;
}

async function requireAdmin() {
  const session = await requireSession();
  const role = getUserRole(session.user);
  if (role !== UserRole.ADMIN) {
    throw new Error('Brak uprawnień administratora.');
  }
  return session;
}

export const ApiService = {
  auth: {
    register: async (data: Omit<User, 'id' | 'role'>): Promise<{ user: User }> => {
      const assignedRole = UserRole.CLIENT;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password!,
        options: {
          data: {
            name: data.name,
            phone: data.phone,
          },
        },
      });

      if (authError) {
        throw new Error('Nie udało się utworzyć konta. Sprawdź dane lub użyj innego adresu e-mail.');
      }
      if (!authData.user) {
        throw new Error('Nie udało się utworzyć użytkownika.');
      }

      return { user: mapAuthUser(authData.user) };
    },

    login: async (email: string, password: string): Promise<{ user: User }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error('Nieprawidłowy email lub hasło.');
      if (!data.user) throw new Error('Błąd logowania.');

      return { user: mapAuthUser(data.user) };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error logging out:', error);
    },

    me: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      return mapAuthUser(session.user);
    },
  },

  requests: {
    create: async (data: {
      componentModel: string;
      problemDescription: string;
      deliveryMethod: DeliveryMethod;
      preferredDate: string;
      clientName: string;
      clientPhone: string;
    }): Promise<ServiceRequest> => {
      const session = await requireSession();

      const { data: result, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: session.user.id,
          component_model: data.componentModel,
          problem_description: data.problemDescription,
          delivery_method: data.deliveryMethod,
          preferred_date: data.preferredDate,
          client_name: data.clientName,
          client_phone: data.clientPhone,
          status: ServiceStatus.PENDING,
        })
        .select()
        .single();

      if (error) {
        console.error('Database Error:', error);
        throw new Error('Nie udało się zapisać zgłoszenia.');
      }

      return ApiService.mapResponse(result);
    },

    getAllForUser: async (): Promise<ServiceRequest[]> => {
      const session = await requireSession();

      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch Error:', error);
        return [];
      }

      return data.map(ApiService.mapResponse);
    },

    getAll: async (): Promise<ServiceRequest[]> => {
      await requireAdmin();

      const { data: requests, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Admin Fetch Error:', error);
        throw new Error('Brak uprawnień do pobrania zgłoszeń.');
      }

      return requests.map(ApiService.mapResponse);
    },

    updateStatus: async (id: string, status: ServiceStatus, estimatedCost?: number): Promise<void> => {
      await requireAdmin();

      const updateData: Record<string, unknown> = { status };
      if (estimatedCost !== undefined) {
        updateData.estimated_cost = estimatedCost;
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw new Error('Nie udało się zaktualizować zgłoszenia');
    },
  },

  mapResponse: (row: Record<string, unknown>): ServiceRequest => ({
    id: row.id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
    componentModel: row.component_model as string,
    problemDescription: row.problem_description as string,
    deliveryMethod: row.delivery_method as DeliveryMethod,
    preferredDate: row.preferred_date as string,
    status: row.status as ServiceStatus,
    estimatedCost: row.estimated_cost as number | undefined,
    clientName: row.client_name as string | undefined,
    clientPhone: row.client_phone as string | undefined,
  }),
};
