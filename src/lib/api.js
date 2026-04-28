import { supabase } from './supabase';

const API_URL = 'http://localhost:8000/api/ai';

export const askGemini = async (prompt, category = 'general', productName = 'Producto de Dropshipping') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    console.log("Enviando petición a:", `${API_URL}/generate`);

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ prompt, category, productName }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la respuesta del servidor');
    }
    
    return data.response;
  } catch (error) {
    console.error("Error completo en el frontend:", error);
    return "Error: " + error.message;
  }
};
