import { SubCategory } from "@/types/sub-category"

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.18.0.53/api';
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token from localStorage if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const subCategoryAPI = {
  async getAll(): Promise<SubCategory[]> {
    try {
      const response = await apiCall('/subcategories/public');
      // Transform the response to match SubCategory interface
      return response.data.map((subCategory: any) => ({
        id: subCategory._id,
        name: subCategory.name,
        category: subCategory.category
      }));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  },
  
  async create(data: Omit<SubCategory, "id">): Promise<SubCategory> {
    const response = await apiCall('/subcategories', {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      id: response.data._id,
      name: response.data.name,
      category: response.data.category
    };
  },
  
  async update(id: string, data: Omit<SubCategory, "id">): Promise<SubCategory> {
    const response = await apiCall(`/subcategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return {
      id: response.data._id,
      name: response.data.name,
      category: response.data.category
    };
  },
  
  async delete(id: string): Promise<void> {
    await apiCall(`/subcategories/${id}`, { method: "DELETE" });
  },
}