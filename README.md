# GeoRescate — Landing Page

Landing page de **GeoRescate**, sistema que transmite el GPS exacto y la ficha médica vital de una persona a las centrales de emergencia (SAMU, Bomberos), incluso sin internet.

Desde aquí las personas pueden:

- **Inscribirse en la lista de espera del Panel Web** (nombre + correo).
- **Descargar la app móvil** (Android / iOS), que ya es pública.
- Ver en vivo **cuántas personas** están inscritas.

## Tecnologías

| Parte | Qué se usa |
|---|---|
| Estructura | HTML5 |
| Estilos | CSS3 puro (variables CSS, Grid, Flexbox, `clamp()`, `@media`). Sin frameworks |
| Lógica | JavaScript vanilla (sin librerías ni dependencias, sin build) |
| Tipografía | [Inter](https://fonts.google.com/specimen/Inter) vía Google Fonts |
| Animaciones | CSS keyframes, `IntersectionObserver` (revelado al hacer scroll) y `<canvas>` (partículas del hero) |
| Backend | **Google Apps Script** + **Google Sheets** (el "Excel" donde se guardan los inscritos) |
| Seguridad | Content-Security-Policy por `<meta>`, campo trampa anti-bots (*honeypot*), validación de datos |

No requiere instalar nada: es un sitio estático.

## Estructura

```
├── index.html          # Página completa
├── styles.css          # Estilos y diseño responsivo
├── script.js           # Configuración, formularios, contador, botón de la app, animaciones
├── favicon.svg
├── og-image.png        # Imagen al compartir en redes
└── backend/
    └── Code.gs         # Código de Google Apps Script (se pega en Google, no se ejecuta en la web)
```

## Diseño responsivo

Probada en celulares Android e iOS (desde 350 px de ancho), tablets y PC.

- En celular el menú se reduce a logo + botones **Obtener App** y **Panel Web**.
- Campos de formulario de 16 px para evitar el zoom automático de iOS.
- Soporte de zonas seguras (notch) y `100svh` para la barra del navegador móvil.
- Respeta `prefers-reduced-motion` (reduce animaciones).

## Cómo funciona la lista de espera

```
Formulario  ──POST──▶  Apps Script (doPost)  ──▶  Google Sheets (Fecha | Nombre | Correo)
Página      ◀──GET───  Apps Script (doGet)   ◀──  cuenta las filas → {"count": N}
```

1. Al enviar el formulario, se guarda una fila nueva en la hoja.
2. Los correos repetidos no se guardan dos veces.
3. Al cargar la página, se consulta la cantidad real de filas y se muestra en el contador.

## Puesta en marcha

### 1. Backend (Google Sheets + Apps Script)

1. Crea una hoja de cálculo en Google Sheets. En la fila 1 escribe: `Fecha | Nombre | Correo`.
2. Menú **Extensiones → Apps Script**, borra lo que haya y pega el contenido de [`backend/Code.gs`](backend/Code.gs).
3. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
4. Copia la URL que termina en `/exec`.

> Para actualizar el código más adelante usa **Implementar → Administrar implementaciones → Editar → Nueva versión**. Así la URL no cambia.

### 2. Configurar la página

Abre `script.js` y edita el bloque `CONFIG` del inicio:

```js
const CONFIG = {
  scriptURL: 'https://script.google.com/macros/s/XXXX/exec', // URL del paso anterior
  appLinks: {
    android: '', // link de Google Play
    ios: ''      // link de App Store
  },
  fallbackCount: 46 // número mostrado si no se puede leer la hoja
};
```

Mientras un link de tienda esté vacío, el botón muestra "Próximamente".

### 3. Publicar

Al ser un sitio estático puedes usar **GitHub Pages** (Settings → Pages → rama `main`, carpeta `/root`), Netlify o Vercel.

Para probar en local basta abrir `index.html` en el navegador.

## Privacidad y seguridad

- **No hay claves, contraseñas ni tokens en este repositorio.**
- La URL del Apps Script (`scriptURL`) es pública por diseño: cualquier página web que envíe formularios la expone. Con ella solo se puede **agregar una inscripción** o **leer el total de inscritos**. **No** da acceso a la hoja de cálculo ni a los nombres y correos guardados.
- La hoja de Google Sheets **no debe compartirse públicamente**. Los datos de las personas viven solo ahí, nunca en el repositorio.
- El archivo `.gitignore` bloquea por seguridad `.xlsx`, `.csv` y `.env` para no subir listas de inscritos por accidente.
- Medidas contra abuso: campo trampa anti-bots, validación en el navegador y en el servidor, límite de largo de campos, bloqueo de inyección de fórmulas en Sheets, y filtro de correos duplicados.
- Si alguien abusa del formulario, se puede generar una nueva implementación en Apps Script (nueva URL) y actualizar `scriptURL`.

> Esta página recopila datos personales (nombre y correo). Se recomienda agregar una política de privacidad indicando para qué se usarán.

## Licencia

Define aquí la licencia del proyecto (por ejemplo MIT) o déjalo como "Todos los derechos reservados".
