import type { Metadata } from 'next'
import LegalPage from '../../components/LegalPage'
import { SITE } from '../../lib/copy'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com'
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contacto@animedula.com'

export const metadata: Metadata = {
  title: `Política de privacidad — ${SITE.name}`,
  description: `Cómo ${SITE.name} recopila, usa y protege tu información.`,
}

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="10 de junio de 2026">
      <p>
        En <strong>{SITE.name}</strong> ({siteUrl}) respetamos tu privacidad. Esta política explica qué datos
        podemos tratar cuando visitas el sitio y cómo los usamos.
      </p>

      <h2>1. Responsable</h2>
      <p>
        El responsable del sitio es el equipo editorial de {SITE.name}. Para dudas sobre privacidad puedes
        escribir a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h2>2. Datos que recopilamos</h2>
      <p>Podemos recibir información de forma automática cuando navegas:</p>
      <ul>
        <li>Dirección IP, tipo de navegador, idioma y páginas visitadas.</li>
        <li>Datos técnicos de rendimiento y errores del sitio.</li>
        <li>Preferencias guardadas en tu dispositivo (por ejemplo, tema claro u oscuro).</li>
      </ul>
      <p>
        No pedimos registro obligatorio para consultar listados, reseñas o guías. Si en el futuro habilitamos
        formularios o cuentas, te avisaremos antes de solicitar datos personales.
      </p>

      <h2>3. Cookies y tecnologías similares</h2>
      <p>Usamos cookies y almacenamiento local para:</p>
      <ul>
        <li>Recordar preferencias de visualización.</li>
        <li>Medir audiencia y mostrar publicidad.</li>
        <li>Que servicios de terceros funcionen correctamente.</li>
      </ul>
      <p>
        Puedes bloquear o eliminar cookies desde la configuración de tu navegador. Algunas funciones del sitio
        podrían dejar de funcionar si las desactivas por completo.
      </p>

      <h2>4. Google AdSense</h2>
      <p>
        Mostramos anuncios a través de <strong>Google AdSense</strong>. Google y sus socios pueden usar cookies
        para mostrar anuncios según tus visitas a este y otros sitios.
      </p>
      <ul>
        <li>
          Puedes desactivar la publicidad personalizada en{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
            Configuración de anuncios de Google
          </a>.
        </li>
        <li>
          Más información en la{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            política de privacidad de Google
          </a>{' '}
          y en{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            cómo Google usa datos en publicidad
          </a>.
        </li>
      </ul>

      <h2>5. Enlaces de afiliado</h2>
      <p>
        Algunos enlaces hacia Amazon, Mercado Libre u otras tiendas son de afiliado. Si compras a través de
        ellos, podemos recibir una comisión sin costo adicional para ti. Esas plataformas tienen sus propias
        políticas de privacidad, independientes de {SITE.name}.
      </p>

      <h2>6. Servicios de terceros</h2>
      <p>Para mostrar información de anime y manga consultamos APIs públicas (por ejemplo, Jikan / MyAnimeList).
        No compartimos con ellos datos personales tuyos más allá de las peticiones técnicas necesarias para
        cargar el contenido.</p>

      <h2>7. Conservación y seguridad</h2>
      <p>
        Conservamos los datos el tiempo necesario para operar el sitio, cumplir obligaciones legales y resolver
        incidencias. Aplicamos medidas razonables para proteger la información, aunque ningún sistema en internet
        es 100 % seguro.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Según la legislación aplicable en tu país, puedes solicitar acceso, rectificación o eliminación de datos
        personales que tratemos directamente. Escríbenos a {contactEmail} indicando tu solicitud.
      </p>

      <h2>9. Menores de edad</h2>
      <p>
        El sitio está dirigido a público general interesado en anime y manga. No recopilamos a sabiendas datos de
        menores de 13 años. Si crees que un menor nos proporcionó información, contáctanos para eliminarla.
      </p>

      <h2>10. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la fecha de revisión en esta página. El uso continuado del
        sitio después de un cambio implica que aceptas la versión vigente.
      </p>
    </LegalPage>
  )
}
