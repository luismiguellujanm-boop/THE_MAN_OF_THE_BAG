# The Man of the Bag · Juegos (versión 2.0)

Suite de juegos del canal de YouTube **@the_man_of_the_bag**. Funciona en el navegador (PC con teclado, celular con gestos) y se instala como app (PWA).

## Novedades de la versión 2.0

**Escape de las cabras**
- **5 mundos × 10 niveles:** La granja, El pueblo, El basurero, La fábrica tóxica y El balde tóxico.
  - 3 dificultades por nivel: Normal, Difícil y Tóxico.
  - 3 estrellas por nivel: llegar a la meta, juntar las gotas y no recibir golpes.
  - El nivel 10 de cada mundo es contra la **cabra jefa**.
- **Modo infinito** por mundo, que se abre al pasar el nivel 10.
- **Estampida de frente** (se esquiva con doble salto) y **cabra loca** que viene rebotando.
- **Bomba apestosa hacia atrás** (deslizar ← o tecla ←/A), que marea a la manada. El rayo se mantiene.
- **Manada de cabras** detrás de TMB: mientras más cerca están, más se ven.
- **Menos texto en pantalla:** avisan la voz y los íconos.
- **TMB corre mirando hacia adelante** y voltea a la pantalla cuando habla o agarra una bolsita.
- **El meme de tu hijo** aparece cuando pierdes.
- **Carrera en vivo:** salas con código, de 2 a 6 jugadores, fantasmas, cajas sorpresa, gana el último en pie.

**Carrera tóxica** (vertical): TMB cae por el tubo y juntas gotas.
- Paracaídas: tocar la pantalla o Espacio.
- La píldora tóxica lo convierte en **Bebé TMB** para pasar por los huecos chicos.

**Suite**
- **Vestidor y tienda** compartidos por todos los juegos: aspectos de bolsa, cabeza, espalda, vehículo (patineta, scooter) y estelas.
- **Premios:** cofre diario con racha (el día 7 da un diamante 💎) y 3 misiones del día.
- **Vitrina:** 18 medallas y los trofeos del top 3 mundial (Bolsa de Oro, Plata y Bronce).
- **Ranking mundial con podio:** score total de niveles, cada modo infinito y la Carrera tóxica.

## Controles

| Acción | Teclado | Celular |
|---|---|---|
| Saltar (dos veces = doble salto) | Espacio, ↑ o W | Tocar |
| Agacharse | ↓ o S | Deslizar hacia abajo |
| Eructo / rayo (adelante) | →, D o Enter | Deslizar hacia adelante |
| Bomba apestosa (atrás, barra llena) | ← o A | Deslizar hacia atrás |
| Carrera tóxica: moverse | ← → o A D | Arrastrar el dedo |
| Carrera tóxica: paracaídas | Espacio o ↑ | Tocar |
| Pausa | P o Esc | Botón ⏸ |

## Publicar la actualización (GitHub)

1. **Supabase:** en el **SQL Editor**, ejecuta `supabase/02_niveles.sql`. El `01` ya lo tienes.
2. **Supabase Realtime** (para la carrera en vivo): en **Project Settings → Realtime**, revisa que estén permitidos los canales públicos. No debe estar activado "Private channels only".
3. **GitHub:** en tu repositorio, ve a **Add file → Upload files** y arrastra **el contenido** de esta carpeta (`www`, `supabase`, `fuentes` y `LEEME.md`). Son menos de 100 archivos. Luego presiona **Commit changes**.
4. La publicación se hace sola. Revisa en **Actions** que salga ✅.

Los jugadores reciben la versión nueva al volver a abrir el juego, porque el service worker ya tiene `VERSION = "tmb-v2.0.0"`.

## Cuando hagas cambios

- Si cambias los dibujos, ejecuta `python3 fuentes/sprites2.py www/img`, luego `python3 fuentes/empaquetar_sprites.py` y luego `python3 fuentes/generar_sw.py`.
- Sube el número de `VERSION` en `www/sw.js`.
- **Agregar un mundo nuevo** (cuando voten los seguidores): se agrega en `www/js/data.js` (WORLDS) y se dibujan sus fondos en `sprites2.py`.

## Voces que faltan

Pon cada archivo en `www/sfx/` con estos nombres y el juego los usa solo. Mientras tanto suena un reemplazo.

| Frase | Archivo |
|---|---|
| ¡Únete a la pandilla! | `09_unete.mp3` |
| ¡Ya tengo poder! | `10_ya_tengo_poder.mp3` |
| ¡Eructo tóxico! | `11_eructo_toxico.mp3` |
| ¡Rayo mutante! | `12_rayo_mutante.mp3` |
| ¡Nooo, me atraparon! | `13_me_atraparon.mp3` |
| ¡Nuevo récord! | `14_nuevo_record.mp3` |
| ¡Otra vez! | `15_otra_vez.mp3` |
| ¡Me encojo! | `16_me_encojo.mp3` |
| ¡Abro el paracaídas! | `17_abro_paracaidas.mp3` |
| ¡Aaaaah! (caída) | `18_aaah_caida.mp3` |
| ¡Presiona espacio para saltar! | `19_presiona_espacio.mp3` |
| ¡Se acercan las cabras! | `20_se_acercan_las_cabras.mp3` |
| ¡Doble salto! | `21_doble_salto.mp3` |
| ¡Cabra loca! | `22_cabra_loca.mp3` |
| ¡Bomba apestosa! | `23_bomba_apestosa.mp3` |
| ¡Nivel superado! | `24_nivel_superado.mp3` |

Después de agregarlos, ejecuta `generar_sw.py` y sube la `VERSION`.

## Probar la carrera en vivo sin internet

Abre el juego con `?local=1` al final de la dirección, en dos pestañas del mismo navegador.

## Supabase

- Proyecto: `https://bsvcnwjqfnfurbteednh.supabase.co`. La clave pública está en `www/js/config.js`.
- **Nunca** pongas la clave secreta en el juego.
- Para borrar a un tramposo: **Table Editor**, en `puntajes` o `niveles`.
- Para bloquear palabras en los apodos: agrégalas en `palabras_prohibidas`.

## Todavía guardado en el teléfono (no en la nube)

El progreso de niveles, las gotas, los diamantes, el vestidor y las medallas se guardan en el dispositivo. Si se borran los datos del navegador, se pierden. Los récords del ranking sí quedan en Supabase.
