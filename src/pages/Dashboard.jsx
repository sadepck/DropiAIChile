import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { askGemini } from '../lib/api'
import ReactMarkdown from 'react-markdown'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [category, setCategory] = useState('Copy de Ventas')
  const [productName, setProductName] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) navigate('/login')
      else setUser(session.user)
    }
    checkSession()
  }, [navigate])

  const fetchHistory = async () => {
    setLoadingHistory(true)
    const { data, error } = await supabase
      .from('products_history')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) setHistory(data)
    setLoadingHistory(false)
  }

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

  const handleAskIA = async () => {
    if (!prompt) return
    setIsAsking(true)
    setAiResponse('')
    const response = await askGemini(prompt, category, productName || 'Producto de Dropshipping')
    setAiResponse(response)
    setIsAsking(false)
    fetchHistory()
  }

  const handleQuickAction = (action, cat, prodName) => {
    setPrompt(action)
    setCategory(cat)
    setProductName(prodName)
  }

  const handleCopy = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="flex h-screen bg-gray-50">
      {/* BARRA LATERAL IZQUIERDA - HISTORIAL */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-green-600">
          <h2 className="text-xl font-bold text-white">DropiAI Chile 🚀</h2>
          <p className="text-xs text-blue-100 mt-1">Historial de Productos</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mis Creaciones</h3>
          
          {loadingHistory ? (
            <div className="text-center py-10 text-gray-400 text-sm">Cargando historial...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm italic">Aún no hay productos guardados.</div>
          ) : (
            history.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setAiResponse(item.content)
                  setProductName(item.product_name)
                }}
                className="w-full text-left p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <p className="text-sm font-bold text-gray-700 truncate group-hover:text-blue-700">
                  {item.product_name}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase">
                    {item.type || 'General'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">
            ✅ {user.email}
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL - CHAT */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Tu Asistente Experto en Dropshipping
          </h1>
          <p className="text-sm text-gray-600 mt-1">Genera contenido profesional para tu tienda online</p>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Product Inputs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📦 Información del Producto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-tight">Nombre del Producto</label>
                <input 
                  type="text" 
                  value={productName} 
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Lámpara Proyector Galaxia"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-tight">Categoría de Contenido</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="Copy de Ventas">📝 Copy de Ventas</option>
                  <option value="Guion TikTok Ads">🎥 Guion TikTok Ads</option>
                  <option value="Estrategia de Precios">💰 Estrategia de Precios</option>
                  <option value="Email Marketing">📧 Email Marketing</option>
                  <option value="Anuncio Meta">📱 Anuncio Meta Ads</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">⚡ Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickAction('Crea un copy de venta persuasivo para un producto de dropshipping', 'Copy de Ventas', 'Producto de Dropshipping')}
                className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition shadow-lg text-left"
              >
                <span className="text-2xl">📝</span>
                <p className="font-bold mt-2">Crear Copy de Venta</p>
                <p className="text-xs text-blue-100 mt-1">Descripción persuasiva</p>
              </button>
              
              <button
                onClick={() => handleQuickAction('Genera un guion de 15 segundos para un TikTok Ads viral de dropshipping', 'Guion TikTok Ads', 'Producto de Dropshipping')}
                className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg text-left"
              >
                <span className="text-2xl">🎬</span>
                <p className="font-bold mt-2">Guion TikTok Ads</p>
                <p className="text-xs text-green-100 mt-1">Video viral en 15s</p>
              </button>
              
              <button
                onClick={() => handleQuickAction('Ayúdame a calcular la estrategia de precios para mi producto considerando costos y publicidad', 'Estrategia de Precios', 'Producto de Dropshipping')}
                className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition shadow-lg text-left"
              >
                <span className="text-2xl">💰</span>
                <p className="font-bold mt-2">Estrategia de Precios</p>
                <p className="text-xs text-purple-100 mt-1">Calcula tu margen</p>
              </button>
            </div>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 relative group">
              
              {/* BOTÓN DE COPIAR (Esquina superior derecha) */}
              <button 
                onClick={handleCopy}
                className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  copied 
                  ? "bg-green-50 border-green-200 text-green-600" 
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {copied ? (
                  <>
                    <span className="text-xs font-bold">¡Copiado!</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold">Copiar texto</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </>
                )}
              </button>

              <h3 className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider">Respuesta de DropiAI</h3>
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            </div>
          )}
        </main>

        {/* Input Area - Fixed at bottom */}
        <div className="bg-white border-t border-gray-200 p-6">
          {/* Mini Quick Actions */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button 
              onClick={() => setPrompt("Genera una descripción de producto de alta conversión para...")} 
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:border-blue-500 hover:bg-blue-50 transition"
            >
              📝 Crear Copy
            </button>
            <button 
              onClick={() => setPrompt("Escribe un guion de 15 segundos para TikTok Ads sobre...")} 
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:border-green-500 hover:bg-green-50 transition"
            >
              🎥 Guion TikTok
            </button>
            <button 
              onClick={() => setPrompt("Analiza la rentabilidad y ponle precio en Chile a...")} 
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:border-purple-500 hover:bg-purple-50 transition"
            >
              💰 Calcular Precio
            </button>
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-800"
              placeholder="Escribe tu consulta sobre dropshipping..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAskIA()}
            />
            <button
              onClick={handleAskIA}
              disabled={isAsking}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 transition font-bold shadow-lg"
            >
              {isAsking ? '⏳ Pensando...' : '🚀 Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
