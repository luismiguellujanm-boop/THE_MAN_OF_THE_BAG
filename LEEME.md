# The Man of the Bag · Juegos (versión PWA 1.0)

Suite de juegos del canal de YouTube **@the_man_of_the_bag**. Se juega en el navegador de la PC (con teclado) y del celular (con gestos), y se puede instalar como app.

## Qué incluye esta versión

- **Menú de la suite:** Escape de las cabras (jugable), y Carrera tóxica, Raise TMB y Música de TMB marcados como "Muy pronto".
- **Escape de las cabras:**
  - Tutorial en la primera partida, con la manito en el celular o con las teclas en la PC.
  - Barra tóxica, eructo tóxico, rayo mutante y la pandilla de bolsitas.
  - Pausa y fin de partida con récord.
  - Ranking mundial y botón para compartir.
- **Apodos:** solo apodos, sin datos personales. No permite apodos repetidos ni groserías.
- **Sin internet:** funciona sin conexión y sube el récord cuando vuelve el internet.
- **Ajustes:** música, sonidos, cambiar apodo y volver a ver el tutorial.

## Controles

| Acción | Teclado | Celular |
|---|---|---|
| Saltar (dos veces = doble salto) | Espacio, ↑ o W | Tocar |
| Agacharse | ↓ o S (mantener) | Deslizar hacia abajo |
| Lanzar poder | →, D o Enter | Deslizar hacia adelante |
| Pausa | P o Esc | Botón ⏸ |

## Estructura

```
www/                  ← el juego (esto es lo que se publica)
  index.html, manifest.webmanifest, sw.js
  css/style.css
  js/config.js        ← URL y clave pública de Supabase
  js/core.js          ← guardado local + conexión con Supabase
  js/audio.js         ← voces, efectos y música
  js/escape.js        ← Escape de las cabras
  js/main.js          ← menús, apodo, ranking, fin de partida
  img/                ← dibujos generados con fuentes/
  sfx/                ← voces y sonidos del creador
supabase/01_ranking.sql   ← ya ejecutado en Supabase
fuentes/              ← scripts que generan los dibujos (Python + rsvg-convert)
.github/workflows/publicar.yml  ← publica www/ en GitHub Pages
```

## Publicar en GitHub Pages (una sola vez)

1. Crea un repositorio en GitHub, por ejemplo `tmb-juegos`, y sube todo el contenido de esta carpeta, incluida la carpeta oculta `.github`.
2. En el repositorio, ve a **Settings → Pages → Build and deployment → Source** y elige **GitHub Actions**.
3. Ve a la pestaña **Actions**. Verás "Publicar juego en GitHub Pages" en marcha. Cuando termine con ✅, el juego queda en `https://TU-USUARIO.github.io/tmb-juegos/`.
4. Desde ese momento, cada cambio que subas a `main` se publica solo.

Para Netlify (cuando tengas créditos): arrastra la carpeta `www/` al panel de Netlify, o conecta el repositorio con el directorio de publicación `www`.

## Instalar como app

- **Android (Chrome):** abre el enlace, toca el menú ⋮ y luego **Instalar app** o **Agregar a la pantalla principal**. Se abre en pantalla completa y en horizontal.
- **iPhone (Safari):** botón Compartir → **Agregar a inicio**.
- **PC (Chrome o Edge):** ícono de instalar en la barra de direcciones.

## Cuando hagas cambios

- Si agregas o quitas archivos en `www/`, ejecuta `python3 fuentes/generar_sw.py`.
- Sube el número de `VERSION` en `www/sw.js`, por ejemplo `tmb-v1.0.1`. Así los jugadores reciben la versión nueva.

## Voces que faltan

Pon cada archivo en `www/sfx/` con estos nombres y el juego los usa solo, sin tocar el código. Mientras tanto suena un reemplazo.

| Frase | Archivo |
|---|---|
| ¡Únete a la pandilla! | `09_unete.mp3` |
| ¡Ya tengo poder! | `10_ya_tengo_poder.mp3` |
| ¡Eructo tóxico! | `11_eructo_toxico.mp3` |
| ¡Rayo mutante! | `12_rayo_mutante.mp3` |
| ¡Nooo, me atraparon! | `13_me_atraparon.mp3` |
| ¡Nuevo récord! | `14_nuevo_record.mp3` |
| ¡Otra vez! | `15_otra_vez.mp3` |
| ¡Presiona espacio para saltar! (tutorial en PC) | `19_presiona_espacio.mp3` |

Después de agregarlos, ejecuta `generar_sw.py` y sube la `VERSION`.

## Supabase

- Proyecto: `https://bsvcnwjqfnfurbteednh.supabase.co`. La clave pública está en `www/js/config.js`.
- **Nunca** pongas la clave secreta (`sb_secret_…`) en el juego.
- Para borrar a un tramposo: **Table Editor → puntajes**, borra su fila.
- Para bloquear más palabras en los apodos: **Table Editor → palabras_prohibidas**, agrega una fila.

## Más adelante

- **APK:** el mismo código se empaqueta con Capacitor en GitHub Actions.
- **Siguientes juegos:** Carrera tóxica, la carrera en vivo con Supabase Realtime, Raise TMB, Música de TMB y la tienda de bolsas.
