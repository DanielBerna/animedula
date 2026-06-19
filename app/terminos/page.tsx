import type { Metadata } from 'next'
import LegalPage from '../../components/LegalPage'
import { SITE } from '../../lib/copy'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://animedula.com'
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contacto@animedula.com'

export const metadata: Metadata = {
  title: `Términos de uso — ${SITE.name}`,
  description: `Condiciones de uso del sitio ${SITE.name}.`,
}

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso" updated="10 de junio de 2026">
      <p>
        Al acceder a <strong>{SITE.name}</strong> ({siteUrl}) aceptas estos términos. Si no estás de acuerdo,
        te pedimos no utilizar el sitio.
      </p>

      <h2>1. Qué es {SITE.name}</h2>
      <p>
        {SITE.name} es un sitio editorial de anime y manga en español. Publicamos reseñas propias, listados,
        calendario de estrenos y guías con enlaces a tiendas o plataformas de streaming. Parte de la información
        descriptiva proviene de fuentes públicas como MyAnimeList (vía Jikan).
      </p>

      <h2>2. Contenido editorial</h2>
      <p>
        Las reseñas y opiniones expresan el criterio del equipo de {SITE.name}, no de terceros. Los puntajes de
        MAL u otras fuentes se citan solo como referencia. No garantizamos que un título te guste solo porque
        aparezca en un ranking o tenga buena puntuación.
      </p>

      <h2>3. Enlaces externos</h2>
      <p>
        El sitio incluye enlaces a tiendas, servicios de streaming y sitios de terceros. No controlamos su
        contenido, precios, disponibilidad ni políticas. El acceso y las compras en esos sitios son bajo tu
        responsabilidad y sus propios términos.
      </p>

      <h2>4. Publicidad y tienda</h2>
      <p>
        Mostramos publicidad (por ejemplo, Google AdSense). La sección de productos y enlaces a Mercado Libre
        solo aparece cuando el programa de afiliados está configurado; en ese caso podemos recibir ingresos
        por compras derivadas de esos enlaces. Revisa precio, vendedor y envío en la plataforma de destino.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los textos editoriales originales de {SITE.name}, el diseño del sitio y la marca pertenecen a sus
        titulares. Los títulos, imágenes y sinopsis de anime y manga son propiedad de sus respectivos autores y
        editores. Usamos material promocional y metadatos conforme a usos informativos y de referencia.
      </p>

      <h2>6. Cuentas y contenido de usuarios</h2>
      <p>
        Puedes registrarte para comentar, guardar listas, publicar reseñas y participar en la comunidad. Eres
        responsable de la actividad en tu cuenta y de mantener tus credenciales seguras. Al publicar contenido
        (comentarios, reseñas, hilos del foro) nos concedes una licencia no exclusiva para mostrarlo y moderarlo
        en {SITE.name}. No publiques material ilegal, difamatorio, spam, spoilers sin aviso ni contenido que
        infrinja derechos de terceros.
      </p>
      <p>
        Nos reservamos el derecho de ocultar, editar o eliminar contenido de usuario y de suspender cuentas que
        incumplan estas reglas, sin previo aviso cuando la situación lo requiera.
      </p>

      <h2>7. Uso permitido</h2>
      <p>Puedes consultar el sitio con fines personales y no comerciales. No está permitido:</p>
      <ul>
        <li>Copiar masivamente contenido sin autorización.</li>
        <li>Intentar vulnerar la seguridad del sitio o sus APIs.</li>
        <li>Usar robots o scrapers que sobrecarguen el servicio.</li>
        <li>Reutilizar nuestras reseñas como si fueran oficiales de otra marca.</li>
      </ul>

      <h2>8. Disponibilidad</h2>
      <p>
        Trabajamos para mantener el sitio disponible, pero puede haber interrupciones por mantenimiento, fallos
        técnicos o cambios en APIs de terceros. No garantizamos disponibilidad ininterrumpida.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        {SITE.name} se ofrece &quot;tal cual&quot;. En la medida permitida por la ley, no somos responsables de
        daños indirectos derivados del uso del sitio, de enlaces externos o de decisiones de compra o suscripción
        basadas en nuestro contenido.
      </p>

      <h2>10. Reportes</h2>
      <p>
        Si detectas un error en una ficha, un enlace roto o contenido que consideres inapropiado, puedes usar la
        opción de reporte en las fichas o escribir a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h2>11. Cambios y ley aplicable</h2>
      <p>
        Podemos modificar estos términos en cualquier momento publicando la versión actualizada en esta página.
        Para consultas legales, contáctanos en {contactEmail}. Cuando corresponda, se aplicará la legislación
        mexicana y los tribunales competentes en México.
      </p>
    </LegalPage>
  )
}
