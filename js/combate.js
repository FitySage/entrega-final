const seccionPelea = document.getElementById('arena-pelea');
const contenedorCartaFinal = document.getElementById('carta-final-combate');

let vidaActualJugador = 0;
let vidaActualEnemigo = 90;
let historialCombate = [];

const capitanEnemigo = {
    nombreEnemigo: "Eshonai",
    raza: "Portador del Vacío",
    tipo: "fusionado",
    ataqueMax: 20,
    miniatura: "./assets/imgs/enemigos/portador.jpg"
};

const prepararAsalto = async () => {
    await carga(3000);
    guiones.classList.add('ocultar');
    seccionPelea.classList.remove('ocultar');

    try {
        const response = await fetch('./json/characters.json');
        const personajes = await response.json();
        datosHeroeActual = personajes.find(pj => pj.nombre === personajeElegido);

        if (datosHeroeActual) {
            if (personajeElegido === "Kaladin") vidaActualJugador = 100;
            else if (personajeElegido === "Shallan") vidaActualJugador = 80;
            else if (personajeElegido === "Dalinar") vidaActualJugador = 120;
            else if (personajeElegido === "Lift") vidaActualJugador = 70;

            actualizarPantallaCombate();
        }
    } catch (error) {
        console.error("Error al cargar la fase de asalto:", error);
    } finally {
        
    }
};

const actualizarPantallaCombate = (animarDanio = false) => {
    const itemsNombres = alforja.map(item => item.nombre);
    const alforjaTexto = itemsNombres.length > 0 ? itemsNombres.join(", ") : "Vacía";
    const { nombre, img, orden, atributo, estadisticas } = datosHeroeActual;
    const { nombreEnemigo, raza, miniatura, tipo } = capitanEnemigo;
    const claseAnimacion = animarDanio ? "animacion-danio" : "";

    contenedorCartaFinal.innerHTML = `
        <div class="grid-combate-nuevo">
            <div class="panel-luchador">
                <div class="card-perfil">
                    <h3>${nombre}</h3>
                    <img src="${img}" alt="${nombre}">
                </div>
                <div class="filas-estadisticas">
                    <div class="fila-stat vida-heroe ${claseAnimacion}">Vida: ${vidaActualJugador} PV</div>
                    <div class="fila-stat">Orden: ${orden}</div>
                    <div class="fila-stat">Atributo: ${atributo}</div>
                    <div class="fila-stat base-stat">Base: ${estadisticas}</div>
                    <div class="fila-stat fila-alforja">Alforja: ${alforjaTexto}</div>
                </div>
            </div>

            <div class="panel-central">
                <button class="btn-mostrar btn-luchar-gigante" id="btn-comenzar-pelea">Ataque Aleatorio</button>
                <div id="log-combate" class="consola-combate">
                    ${historialCombate.length === 0 ? "<div class='ronda-log' style='color:#CAAA98;'>La batalla ha comenzado. Esperando la acción...</div>" : historialCombate.join("")}
                </div>
            </div>

            <div class="panel-luchador">
                <div class="card-perfil">
                    <h2>${nombreEnemigo}</h2>
                    <img src="${miniatura}" alt="${raza}">
                </div>
                <div class="filas-estadisticas">
                    <div class="fila-stat vida-enemigo ${claseAnimacion}">Vida: ${vidaActualEnemigo} PV</div>
                    <div class="fila-stat">Amenaza: ${tipo}</div>
                    <div class="fila-stat base-stat">Base: PV:90 AD:20 Def:40</div>
                    <div class="fila-stat">Peligrosidad: Media</div>
                </div>
            </div>
        </div>
    `;

    const btnLucha = document.getElementById('btn-comenzar-pelea');

    if (vidaActualJugador <= 0 || vidaActualEnemigo <= 0) {
        btnLucha.disabled = true;
        btnLucha.textContent = "Combate Finalizado";
    } else {
        btnLucha.addEventListener('click', procesarTurnoCombate);
    }
    
    const logCombate = document.getElementById('log-combate');
    logCombate.scrollTop = logCombate.scrollHeight;
};

const procesarTurnoCombate = () => {
    const dañoEnemigo = Math.floor(Math.random() * capitanEnemigo.ataqueMax) + 5;
    const dañoJugador = Math.floor(Math.random() * 25) + 10;

    vidaActualJugador = Math.max(0, vidaActualJugador - dañoEnemigo);
    vidaActualEnemigo = Math.max(0, vidaActualEnemigo - dañoJugador);

    let logResultado = `
        <div class="ronda-log">
        <p style="color: #ff4a4a; margin: 8px 0;">💥 <strong>${capitanEnemigo.nombreEnemigo}</strong> te inflige <strong>${dañoEnemigo} PV</strong>.</p>
        <p style="color: #4aff4a; margin: 8px 0;">⚔️ Tu ataque le asesta <strong>${dañoJugador} de daño</strong>.</p>
        </div>
    `;

    if (vidaActualEnemigo <= 0 && vidaActualJugador <= 0) {
        logResultado += `<div class="ronda-log" style="color: #ff9900; font-size: 1.1rem; font-weight: bold;">¡Mutuo K.O.! Ambos cayeron por las heridas.</div>`;
        mostrarToast("Empate trágico en Roshar.", "#ff9900");
        finalizar("Empate");
    } else if (vidaActualEnemigo <= 0) {
        logResultado += `<div class="ronda-log" style="color: #09ff00; font-size: 1.1rem; font-weight: bold;">¡Victoria! Has derrotado al Capitán.</div>`;
        mostrarToast("¡Combate ganado con éxito!", "#09ff00");
        finalizar("Victoria");
    } else if (vidaActualJugador <= 0) {
        logResultado += `<div class="ronda-log" style="color: #ff0000; font-size: 1.1rem; font-weight: bold;">Has caído en combate... La tormenta te reclama.</div>`;
        mostrarToast("Tu Radiante ha sido derrotado.", "#ff0000");
        finalizar("Derrota");
    }

    historialCombate.push(logResultado);
    
    actualizarPantallaCombate(true);
};

const finalizar = (resultado) => {
    const tiempoTotal = Math.floor((Date.now() - tiempoInicio) / 1000);
    const nombreJugador = perfilUsuario ? perfilUsuario.nombre : "viajero";
    const statusLore = perfilUsuario && perfilUsuario.conoceLore ? "Erudito del Cosmere" : "Nuevo en el Cosmere";

    setTimeout(() => {
        Swal.fire({
            title: "Tus estadisticas",
            html: `
                <div>
                    <p><strong>Jugador:</strong> ${nombreJugador}</p>
                    <p><strong>Perfil:</strong> ${statusLore}</p>
                    <p><strong>Radiante Elegido:</strong> ${personajeElegido}</p>
                    <p><strong>Objetos Elegidos:</strong> ${alforja.length} / ${limiteAlforja}</p>
                    <p><strong>Resultado del Final:</strong> ${resultado}</p>
                    <p><strong>Tiempo Total:</strong> ${tiempoTotal} segundos</p>
                </div>
            `,
            footer: `<p>Gracias por jugar, proximamente habrá más contenido de Roshar y mas aventuras.</p>`,
            confirmButtonText: "Finalizar Viaje"
        }).then(() => {
            borrarAlforja();
            location.reload();
        });
    }, 2000);
};