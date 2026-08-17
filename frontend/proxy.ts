import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Bloqueia o acesso à plataforma por celular.
 * A checagem é feita no servidor, antes de renderizar, então não adianta
 * o usuário mudar o zoom ou girar a tela.
 */
const MOBILE_UA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i;

// iPad recente se identifica como Mac; separa pelo indicativo de toque.
const IPAD_UA = /iPad|Macintosh.*Version.*Mobile.*Safari/i;

export function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const bloqueado = MOBILE_UA.test(ua) || IPAD_UA.test(ua);

  if (bloqueado && request.nextUrl.pathname !== '/somente-desktop') {
    const url = request.nextUrl.clone();
    url.pathname = '/somente-desktop';
    url.search = '';
    return NextResponse.rewrite(url);
  }

  // Evita que um desktop caia na tela de bloqueio por link direto.
  if (!bloqueado && request.nextUrl.pathname === '/somente-desktop') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Não intercepta estáticos, imagens nem a pasta public.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico)$).*)'],
};
