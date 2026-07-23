const jwt = require('jsonwebtoken');

// Verificar JWT do Supabase
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    // Decodificar token JWT (sem validação de assinatura em dev)
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ erro: 'Token inválido' });
    }

    req.usuario = {
      id: decoded.sub,
      email: decoded.email,
      tipo_usuario: decoded.user_metadata?.tipo_usuario,
    };

    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}

// Verificar se usuário tem o tipo certo
function verificarTipo(tiposPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    if (!tiposPermitidos.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({ erro: 'Acesso negado. Tipo de usuário não autorizado.' });
    }

    next();
  };
}

module.exports = { verificarToken, verificarTipo };
