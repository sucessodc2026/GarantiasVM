require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function seed() {
  console.log('🌱 Inserindo dados de teste no Supabase...');

  const usuarios = [
    {
      nome: 'Ana Costa',
      email: 'ana.costa@garantia.com',
      senha: '123456',
      tipo_usuario: 'direcao',
    },
    {
      nome: 'João Silva',
      email: 'joao.silva@garantia.com',
      senha: '123456',
      tipo_usuario: 'vendedor',
    },
    {
      nome: 'Maria Santos',
      email: 'maria.santos@garantia.com',
      senha: '123456',
      tipo_usuario: 'vendedor',
    },
    {
      nome: 'Pedro Oliveira',
      email: 'pedro.oliveira@garantia.com',
      senha: '123456',
      tipo_usuario: 'logistica',
    },
  ];

  for (const user of usuarios) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!data) {
      const { error: insertError } = await supabase.from('usuarios').insert([user]);
      if (insertError) console.log(`⚠️ ${user.email}: ${insertError.message}`);
      else console.log(`✅ ${user.email} criado`);
    } else {
      console.log(`ℹ️ ${user.email} já existe`);
    }
  }

  console.log('✅ Seed completo!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
