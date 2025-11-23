import { supabase } from './supabaseClient';
import { User, ServiceRequest, ServiceStatus, UserRole, DeliveryMethod } from '../types';

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
            role: assignedRole
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Nie udało się utworzyć użytkownika.');

      const newUser: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata.name,
        phone: authData.user.user_metadata.phone,
        role: authData.user.user_metadata.role || UserRole.CLIENT
      };

      return { user: newUser };
    },

    login: async (email: string, password: string): Promise<{ user: User }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw new Error('Nieprawidłowy email lub hasło.');
      if (!data.user) throw new Error('Błąd logowania.');

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name,
        phone: data.user.user_metadata.phone,
        role: data.user.user_metadata.role || UserRole.CLIENT
      };

      return { user };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error logging out:', error);
    },

    me: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return null;

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name,
        phone: session.user.user_metadata.phone,
        role: session.user.user_metadata.role || UserRole.CLIENT
      };
      
      return user;
    }
  },

  requests: {
    create: async (userId: string, data: { 
      componentModel: string; 
      problemDescription: string; 
      deliveryMethod: DeliveryMethod; 
      preferredDate: string;
      clientName: string;
      clientPhone: string;
    }): Promise<ServiceRequest> => {
      
      const { data: result, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: userId,
          component_model: data.componentModel,
          problem_description: data.problemDescription,
          delivery_method: data.deliveryMethod,
          preferred_date: data.preferredDate,
          client_name: data.clientName,
          client_phone: data.clientPhone,
          status: ServiceStatus.PENDING
        })
        .select()
        .single();

      if (error) {
        console.error('Database Error:', error);
        throw new Error('Nie udało się zapisać zgłoszenia.');
      }

      return ApiService.mapResponse(result);
    },

    getAllForUser: async (userId: string): Promise<ServiceRequest[]> => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch Error:', error);
        return [];
      }

      return data.map(ApiService.mapResponse);
    },

    getAll: async (): Promise<ServiceRequest[]> => {
      const { data: requests, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Admin Fetch Error:', error);
        return [];
      }

      return requests.map(ApiService.mapResponse);
    },

    updateStatus: async (id: string, status: ServiceStatus, estimatedCost?: number): Promise<void> => {
      const updateData: any = { status };
      if (estimatedCost !== undefined) {
        updateData.estimated_cost = estimatedCost;
      }

      const { error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw new Error('Nie udało się zaktualizować zgłoszenia');
    }
  },

  mapResponse: (row: any): ServiceRequest => ({
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    componentModel: row.component_model,
    problemDescription: row.problem_description,
    deliveryMethod: row.delivery_method as DeliveryMethod,
    preferredDate: row.preferred_date,
    status: row.status as ServiceStatus,
    estimatedCost: row.estimated_cost,
    clientName: row.client_name,
    clientPhone: row.client_phone
  })
};