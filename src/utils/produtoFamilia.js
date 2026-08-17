// Separa a descrição do produto em "família" (o modelo) e "variação".
// A variação é o último segmento da descrição quando ele é um encaixe
// (H1, HB3, HIR2, D2...), uma embalagem (PAR, PC10) ou uma cor.
//
// Ex: "EVO GOLD SERIES LED HEADLIGHT 14.000 LUMENS 85W - HB3"
//      -> familia: "EVO GOLD SERIES LED HEADLIGHT 14.000 LUMENS 85W"
//         variacao: "HB3"
//
// Cuidado deliberado: só o ÚLTIMO segmento vira variação, para não fundir
// produtos que de fato são diferentes ("... 13.000 LUMENS - 4300K" continua
// separado de "... 13.000 LUMENS").

const VARIACAO = /^(H\d{1,2}|HB\d|HIR\d|D\d|PAR|PC10A?|UNIDADE|UN|PRETO|PRATA|BRANCO)$/i;

function separarFamilia(descricao) {
  const desc = (descricao || '').trim();
  if (!desc) return { familia: '', variacao: null };

  const partes = desc.split(' - ').map((p) => p.trim());
  if (partes.length > 1 && VARIACAO.test(partes[partes.length - 1])) {
    return {
      familia: partes.slice(0, -1).join(' - '),
      variacao: partes[partes.length - 1].toUpperCase(),
    };
  }
  return { familia: desc, variacao: null };
}

module.exports = { separarFamilia };
