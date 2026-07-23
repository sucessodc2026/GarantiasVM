const supabase = require('./supabase');

// Funções auxiliares para abstrair queries Supabase

async function query(table, operation = 'select', data = null, filter = null) {
  try {
    let result;

    if (operation === 'select') {
      result = await supabase.from(table).select('*');
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          result = await supabase.from(table).select('*').eq(key, value);
        }
      }
    } else if (operation === 'insert') {
      result = await supabase.from(table).insert([data]);
    } else if (operation === 'update') {
      result = await supabase.from(table).update(data).eq('id', filter.id);
    } else if (operation === 'delete') {
      result = await supabase.from(table).delete().eq('id', filter.id);
    }

    if (result.error) {
      throw result.error;
    }

    return { rows: result.data || [], error: null };
  } catch (error) {
    console.error(`Erro na operação ${operation} em ${table}:`, error);
    return { rows: [], error };
  }
}

module.exports = { supabase, query };
