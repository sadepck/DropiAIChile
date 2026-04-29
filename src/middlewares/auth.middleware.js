const { supabaseAdmin } = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Acceso denegado: Token inválido o expirado' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error de Autenticación:', err);
    res.status(500).json({ error: 'Error interno del servidor en autenticación' });
  }
};

module.exports = requireAuth;
