# Taekwondo Arena 8-Bit - Spooky Dojang (Examen Práctico 2D Canvas)

**Asignatura:** Graficación / Simulación  
**Institución:** Instituto Tecnológico de Pachuca / TecNM  
**Nombre de la Carpeta Principal:** `videojuego2d`  

---

## 📋 Contexto
El presente proyecto corresponde al desarrollo de un videojuego bidimensional web desarrollado mediante la API HTML5 Canvas, JavaScript plano, CSS3 y Bootstrap 5. La propuesta fusiona la disciplina deportiva del Taekwondo (WT) con una temática de temporada de misterio/terror retro de 8 bits (Noche de Muertos / Halloween), ambientada en un Dojang abandonado tipo mazmorra.

---

## 🎯 Objetivo
Desarrollar una aplicación web interactiva en 2D que aplique conceptos de graficación por computadora: renderizado en tiempo real, física de rebote en bordes, detección de colisiones entre entidades, manipulación de mapas de bits sin suavizado (Pixel Art), gestión de audio continuo/efectos chiptune sintetizados y control mediante el puntero del ratón en Canvas.

---

## 💡 Justificación
El proyecto soluciona el reto de crear un entorno dinámico y responsivo capaz de gestionar 25 entidades simultáneas con trayectorias y velocidades independientes. A través de la estética de 8 bits y elementos de temporada (calabazas, calaveras y fantasmas), se logra una interfaz atractiva y lúdica que garantiza una experiencia de usuario fluida sin depender de librerías externas de motores de videojuegos.

---

## 🎮 Operación del Videojuego y Reglas de Negocio

### Controles
- **Mouse:** Mueve el puntero personalizado (Cosas de golpe/patada) por encima de la arena.
- **Clic Izquierdo:** Golpea el ente seleccionado.

### Mecánicas de Juego
1. **Entidades en Pantalla:** Se mantienen permanentemente 25 objetos en movimiento en el Canvas.
2. **Patrones de Movimiento:**
   - **UP / DOWN:** Desplazamiento vertical.
   - **DIAGONAL:** Rebotan en los bordes con física invertida de vectores ($v_x, v_y$).
   - **SPIRAL:** Movimiento circular expandido por ecuaciones trigonométricas.
3. **Puntuación:**
   - **Calavera:** +3 Puntos (Patada a la cabeza - *Head Kick*).
   - **Fantasma:** +2 Puntos (Patada al cuerpo - *Body Kick*).
   - **Calabaza:** +1 Punto (Puño al peto - *Punch*).
4. **Mecánica Bullet Time (Cámara Lenta):** Al acumular energía mediante impactos continuos, el juego ralentiza el tiempo al 30% mientras se consume la barra de energía.
5. **Combos y Partículas:** Conectar impactos consecutivos en menos de 1.8 segundos activa multiplicadores de puntuación (2x, 3x) acompañados de explosiones de partículas pixeladas.
6. **Time Attack:** El jugador dispone de 60 segundos para obtener el máximo puntaje posible antes de la pantalla de *Game Over*.

---

## 🛠️ Estructura de Archivos

```text
videojuego2d/
├── assets/
│   ├── img/
│   │   ├── calabaza.png
│   │   ├── calavera.png
│   │   ├── cursor-fist.png
│   │   ├── cursor-king.png
│   │   ├── dojang.jpg
│   │   └── fantasma.png
│   └── spooky-bgm.mp3
├── index.html
├── styles.css
├── game.js
└── README.md