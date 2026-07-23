const pool = require('../config/database');
const { csvToObjects } = require('../utils/csv');

function val(row, ...keys) {
  for (const k of keys) {
    const v = row[k];
    if (v && v.trim()) return v.trim();
    // try without accents
    const simple = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (simple !== k) {
      const v2 = row[simple];
      if (v2 && v2.trim()) return v2.trim();
    }
  }
  return '';
}

class ImportController {
  static async importarClientes(req, res) {
    try {
      const { csv } = req.body;
      if (!csv) return res.status(400).json({ erro: 'CSV não fornecido' });
      const rows = csvToObjects(csv);
      if (!rows.length) return res.status(400).json({ erro: 'CSV vazio ou inválido' });
      let importados = 0;
      for (const row of rows) {
        const nome = val(row, 'nome', 'name', 'cliente', 'cliente_nome', 'razao_social');
        const telefone = val(row, 'telefone', 'phone', 'celular', 'telefone_celular', 'fone', 'whatsapp');
        const email = val(row, 'email', 'e-mail', 'mail');
        const endereco = val(row, 'endereco', 'endereço', 'address', 'logradouro');
        if (!nome) continue;
        try {
          await pool.query(
            `INSERT INTO clientes (nome, telefone, email, endereco)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (telefone) DO UPDATE SET nome = $1, email = $3, endereco = $4`,
            [nome, telefone || null, email || null, endereco || null]
          );
          importados++;
        } catch (e) {
          console.error('Erro ao importar cliente:', row, e.message);
        }
      }
      res.json({ mensagem: `${importados} de ${rows.length} clientes importados`, total: importados });
    } catch (erro) {
      console.error('Erro na importação de clientes:', erro);
      res.status(500).json({ erro: 'Erro ao importar clientes' });
    }
  }

  static async importarProdutos(req, res) {
    try {
      const { csv } = req.body;
      if (!csv) return res.status(400).json({ erro: 'CSV não fornecido' });
      const rows = csvToObjects(csv);
      if (!rows.length) return res.status(400).json({ erro: 'CSV vazio ou inválido' });
      console.log('📦 Produtos parsed:', JSON.stringify(rows.slice(0, 3)));
      let importados = 0;
      for (const row of rows) {
        const nome = val(row, 'nome', 'name', 'produto', 'codigo', 'código', 'sku', 'referencia');
        const descricao = val(row, 'descricao', 'descrição', 'description');
        const categoria = val(row, 'categoria', 'category', 'grupo', 'tipo', 'departamento') || 'geral';
        if (!nome) {
          console.log('⏭️ Produto ignorado (sem nome):', row);
          continue;
        }
        try {
          const exists = await pool.query('SELECT id FROM produtos WHERE nome = $1', [nome]);
          if (exists.rows.length === 0) {
            await pool.query(
              `INSERT INTO produtos (nome, descricao, categoria) VALUES ($1, $2, $3)`,
              [nome, descricao || null, categoria]
            );
          }
          importados++;
        } catch (e) {
          console.error('Erro ao importar produto:', row, e.message);
        }
      }
      res.json({ mensagem: `${importados} de ${rows.length} produtos importados`, total: importados });
    } catch (erro) {
      console.error('Erro na importação de produtos:', erro);
      res.status(500).json({ erro: 'Erro ao importar produtos' });
    }
  }
}

module.exports = ImportController;
