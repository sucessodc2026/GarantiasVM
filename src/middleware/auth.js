const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido' });
    }
    req.usuario = decoded;
    next();
  });
};

const verificarTipo = (tipos) => {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario.tipo_usuario)) {
      return res.status(403).json({ erro: 'Acesso negado. Tipo de usuário não autorizado.' });
    }
    next();
  };
};

module.exports = { verificarToken, verificarTipo };
