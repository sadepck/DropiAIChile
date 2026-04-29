require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

const generateResponse = async (req, res) => {
  try {
    const { prompt, productName, category } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ 
            text: `Eres "DropiAI Chile", un experto senior en Dropshipping y E-commerce. 
Tu objetivo es ayudar a emprendedores a vender más en Chile. 
Conoces plataformas como Dropi.cl, Shopify y envíos por Blue Express/Starken. 
Usa un tono profesional, motivador y con modismos chilenos sutiles.

Genera contenido para el producto: ${productName || 'producto de dropshipping'}
Tipo de contenido: ${category || 'general'}
Instrucciones adicionales: ${prompt}` 
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de la API de Google:", data);
      throw new Error(data.error?.message || "Error al conectar con la IA");
    }

    const aiText = data.candidates[0].content.parts[0].text;

    const { error: dbError } = await supabaseAdmin
      .from('products_history')
      .insert([
        { 
          user_id: userId, 
          product_name: productName || 'Producto sin nombre', 
          content: aiText,
          type: category || 'general'
        }
      ]);

    if (dbError) {
      console.error("Error al guardar en el historial:", dbError.message);
    }
    
    return res.json({ response: aiText });

  } catch (error) {
    console.error("ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { generateResponse };
