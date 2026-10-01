const contenedorPj = document.getElementById('grilla-personajes');
const seccionPj = document.getElementById('pj-container');
const seccionAlmacen = document.getElementById('ventana-almacen');
const tituloAlmacen = document.getElementById('titulo-almacen');
const contenedorItems = document.getElementById('items');
const contenedorAlforja = document.getElementById('alforja-container');
const contadorAlforja = document.getElementById('contador-alforja');
const btnVaciar = document.getElementById('btn-vaciar');
const btnAvanzar = document.getElementById('btn-avanzar');
const guiones = document.getElementById('dialogos');
const carga = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const seccionPelea = document.getElementById('arena-pelea');
const contenedorCartaFinal = document.getElementById('carta-final-combate')
const LIMITE_ALFORJA = 5;

let personajeElegido = "";
let guionHistoria = [];
let pasoActual = 0;
let sprenNarrador = "Voz Misteriosa";
let alforja = [];
let catalogoAlmacen = [];
let imagenesPoke = [];

const obtenerDetallesPj = async () => {
    try {
        const response = await fetch('./json/characters.json');
        if (!response.ok) throw new Error('Error al cargar personajes');
        const detalles = await response.json();
        mostrarDetallesPj(detalles);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log("Carga de personajes finalizado.")
    }
};

const mostrarDetallesPj = (detalles) => {
    contenedorPj.innerHTML = "";
    detalles.forEach(radiante => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");
        tarjeta.innerHTML = `
            <img src="${radiante.img}" alt="${radiante.nombre}">
            <p><strong>Orden:</strong> ${radiante.orden}</p>
            <p><strong>Atributo:</strong> ${radiante.atributo}</p>
            <p>${radiante.descripcion}</p>
            <button class="btn-mostrar btn-elegir-pj" data-nombre="${radiante.nombre}">Elegir</button>
        `;
        contenedorPj.appendChild(tarjeta);
    });

    document.querySelectorAll('.btn-elegir-pj').forEach(btn => {
        btn.addEventListener('click', (e) => {
            iniciarExpedicion(e.target.dataset.nombre);
        });
    });
};

const iniciarExpedicion = (nombrePersonaje) => {
    personajeElegido = nombrePersonaje;
    seccionPj.classList.add('ocultar');
    seccionAlmacen.classList.remove('ocultar');

    tituloAlmacen.textContent = `${personajeElegido} selecciona tus objetos. Límite: ${LIMITE_ALFORJA}`;
    mostrarToast(`¡Has elegido a ${personajeElegido}!`, "#202940");

    mostrarItemsAlmacen();
};

const mostrarItemsAlmacen = async () => {
    try {
        contenedorItems.innerHTML = "<h3>Revisando Inventario de Almacen...</h3>";
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const idsPokeApi = [18, 26, 90, 64, 30, 121];
        const respuestaPoke = await Promise.all(idsPokeApi.map(id => fetch(`https://pokeapi.co/api/v2/item/${id}`)));
        imagenesPoke = await Promise.all(respuestaPoke.map(res => res.json()));

        const respuestaLocal = await fetch('./json/store.json');
        if (!respuestaLocal.ok) throw new Error('Error cargando JSON local');

        catalogoAlmacen = await respuestaLocal.json();
        renderizarVitrina();

    } catch (error) {
        console.error("Error:", error.message);
        contenedorItems.innerHTML = "Error al cargar los suministros.";
    } finally {
        console.log("Proceso de obtención de datos finalizado.");
    }
};

const renderizarVitrina = () => {
    contenedorItems.innerHTML = "";

    catalogoAlmacen.forEach((dato, index) => {
        const { nombre, descripcion, efecto, stock } = dato;
        const imgPokemon = imagenesPoke[index].sprites.default;

        const cantidadEnAlforja = alforja.filter(item => item.nombre === nombre).length;
        const stockDinamico = stock - cantidadEnAlforja;

        const tarjeta = document.createElement('div');
        tarjeta.classList.add('card');

        tarjeta.innerHTML = `
            <h3>${nombre}</h3>
            <img src="${imgPokemon}" alt="${nombre}" width="70">
            <p>${descripcion}</p>
            <p>${efecto}</p>
            <p><strong>Cantidad disponible:</strong> ${stockDinamico}</p>
            <button class="btn-mostrar btn-agarrar-item" data-item='${JSON.stringify(dato)}' ${stockDinamico === 0 ? "disabled" : ""}>Agarrar</button>
        `;
        contenedorItems.appendChild(tarjeta);
    });



    document.querySelectorAll('.btn-agarrar-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemData = JSON.parse(e.target.dataset.item);
            agregarAAlforja(itemData);
        });
    });
};

const agregarAAlforja = (item) => {
    if (alforja.length >= LIMITE_ALFORJA) {
        mostrarToast(`¡La alforja de ${personajeElegido} está llena!`, "#ff0000");
        return;
    }

    alforja.push(item);
    renderizarAlforja();
    renderizarVitrina();
    mostrarToast(`${item.nombre} guardado.`, "#09ff00");
};

const renderizarAlforja = () => {
    contenedorAlforja.innerHTML = "";
    contadorAlforja.textContent = `Capacidad de tu alforja: ${alforja.length} / ${LIMITE_ALFORJA}`;

    if (alforja.length === 0) {
        contenedorAlforja.innerHTML = "<p>Tus alforjas están vacías.</p>";
        return;
    }

    alforja.forEach((item, index) => {
        const itemP = document.createElement("p");
        itemP.innerHTML = `
            ${item.nombre} 
            <button class="btn-quitar" data-index="${index}">❌</button>
        `;
        contenedorAlforja.appendChild(itemP);
    });

    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            alforja.splice(index, 1);
            renderizarAlforja();
            renderizarVitrina();
        });
    });
};

btnVaciar.addEventListener('click', () => {
    alforja = [];
    renderizarAlforja();
    renderizarVitrina();
});

const mostrarToast = (mensaje, colorFondo) => {
    Toastify({
        text: mensaje,
        duration: 3000,
        style: { background: colorFondo, color: "#fff" }
    }).showToast();
};

obtenerDetallesPj();
renderizarAlforja();

setTimeout(() => {
    Swal.fire({
        title: "Bienvenido a esta pequeña aventura en Roshar",
        text: "En esta aventura RGP elijes a uno de los 4 personajes seleccionables, lo equipas con items y luego comienzas tu aventura, adentrandote un poco en la historia del cosmere y luchando para llegar a algun sitio",
        footer: "Esperemos puedas disfrutarlo. si quedas con ganas de mas puedes buscas la saga de novelas del -Archivo de las tormentas-",
        theme: 'auto',
        width: "1200px",
        showClass: {
            popup: `
      animate__animated
      animate__fadeInUp
      animate__faster
    ` },
        hideClass: {
            popup: `
      animate__animated
      animate__fadeOutDown
      animate__faster
    ` }
    });
}, 2000)

const btnAvanzarDialogo = document.getElementById('btn-avanzar-dialogo');
btnAvanzar.addEventListener('click', async () => {
    seccionAlmacen.classList.add('ocultar');
    guiones.classList.remove('ocultar');

    try {
        const [resPjs, resDialogos] = await Promise.all([
            fetch('./json/characters.json'),
            fetch('./json/guion.json')
        ]);

        const personajes = await resPjs.json();
        guionHistoria = await resDialogos.json();
        const personajeActual = personajes.find(pj => pj.nombre === personajeElegido);
        sprenNarrador = personajeActual.spren || "Voz Misteriosa";


        pasoActual = 0;
        renderizarDialogo();

    } catch (error) {
        console.log("Error al cargar historia", error);
        document.getElementById("caja-dialogos").innerHTML = "<P>Error de conexión en Roshar.</p>"
    }
});

const capitanEnemigo = {
    nombreEnemigo: "Eshonai",
    raza: "Portador del Vacío",
    tipo: "fusionado",
    ataqueMax: 20,
    miniatura: "./assets/imgs/enemigos/portador.jpg"
};

let vidaActualJugador = 0;
let vidaActualEnemigo = 90;
let datosHeroeActual = null;

const renderizarDialogo = () => {
    const cajaDialogos = document.getElementById("caja-dialogos");
    if (pasoActual >= guionHistoria.length) {
        cajaDialogos.innerHTML = `
        <h2 class="efecto-tipeado">Parece que el enfrentamieto es inevitable</h2>
        <p class="efecto-tipeado">Demostremos porque fuimos elejidos para el combate</p>`;
        btnAvanzarDialogo.classList.add("ocultar")
        iniciarAnimacionesTexto();
        prepararAsalto();
        return;
    }

    const dialogoDeTurno = guionHistoria[pasoActual];

    cajaDialogos.innerHTML = `
    <h2>${sprenNarrador} Se materializa y dice:</h2>
    <div class="texto-flotante respiracion">
    <h3 class="efecto-tipeado">"${dialogoDeTurno.titulo}"</h3>
    <p class="efecto-tipeado">${dialogoDeTurno.texto}</p>
    </div>
    `;
    iniciarAnimacionesTexto();

};

const prepararAsalto = async () => {
    await carga(2500);
    
    guiones.classList.add('ocultar');
    seccionPelea.classList.remove('ocultar');

    try {
        const response = await fetch('./json/characters.json');
        const personajes = await response.json();
        datosHéroeActual = personajes.find(pj => pj.nombre === personajeElegido);

        if (datosHéroeActual) {
            if (personajeElegido === "Kaladin") vidaActualJugador = 100;
            else if (personajeElegido === "Shallan") vidaActualJugador = 80;
            else if (personajeElegido === "Dalinar") vidaActualJugador = 120;
            else if (personajeElegido === "Lift") vidaActualJugador = 70;

            actualizarPantallaCombate("¡La batalla está por comenzar! Prepárate para el asalto.");
        }
    } catch (error) {
        console.error("Error al cargar la fase de asalto:", error);
    }
};

const actualizarPantallaCombate = (actualizarEstados) => {
    const itemsNombres = alforja.map(item => item.nombre);
    const alforjaTexto = itemsNombres.length > 0 ? itemsNombres.join(", ") : "Vacía";
    const {nombre, img, orden, atributo, estadisticas} = datosHéroeActual
    const {nombreEnemigo, raza, miniatura, tipo} = capitanEnemigo
    contenedorCartaFinal.innerHTML = `
        <div class="grid-combate">
            <div class="card-combate">
                <h3>${nombre}</h3>
                <img src="${img}" alt="${nombre}" width="100%">
                <p><strong>Orden:</strong> ${orden}</p>
                <p><strong>Atributo:</strong> ${atributo}</p>
                <p style="font-size: 1.2rem; color: #4aff4a;"><strong>Vida Actual:</strong> ${vidaActualJugador} PV</p>
                <p><small style="color: #9A8678;">Base original: ${estadisticas}</small></p>
                <p><strong>Alforja:</strong> ${alforjaTexto}</p>
            </div>

            <div class="seccion-media">
                <h2>Estado de la Batalla</h2>
                <div id="log-combate">${actualizarEstados}</div>
            </div>

            <div class="card-combate">
                <h2> ${nombreEnemigo} </h2>
                <h3 style="color: #ff6b6b;">${raza}</h3>
                <img src="${miniatura}" alt="${raza}" width="100%">
                <p><strong>Tipo:</strong> ${tipo}</p>
                <p style="font-size: 1.2rem; color: #ff4a4a;"><strong>Vida Enemigo:</strong> ${vidaActualEnemigo} PV</p>
                <p><small style="color: #9A8678;">Base original: PV:90 AD:20 Def:40</small></p>
                <p><strong>Peligrosidad:</strong> Media</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 25px;">
            <button class="btn-mostrar" id="btn-comenzar-pelea">Lanzar Ataque al Azar</button>
        </div>
    `;

    const btnLucha = document.getElementById('btn-comenzar-pelea');
    
    if (vidaActualJugador <= 0 || vidaActualEnemigo <= 0) {
        btnLucha.disabled = true;
        btnLucha.textContent = "Combate Finalizado";
    } else {
        btnLucha.addEventListener('click', procesarTurnoCombate);
    }
};

const procesarTurnoCombate = () => {
    const dañoEnemigo = Math.floor(Math.random() * capitanEnemigo.ataqueMax) + 5; 
    const dañoJugador = Math.floor(Math.random() * 25) + 10; 

    vidaActualJugador = Math.max(0, vidaActualJugador - dañoEnemigo);
    vidaActualEnemigo = Math.max(0, vidaActualEnemigo - dañoJugador);

    let logResultado = `
        <p>Los combatientes se cruzan en el campo...</p>
        <p style="color: #ff4a4a; margin: 8px 0;">💥 <strong>${capitanEnemigo.nombre}</strong> te inflige <strong>${dañoEnemigo} PV</strong>.</p>
        <p style="color: #4aff4a; margin: 8px 0;">⚔️ Tu contraataque le asesta <strong>${dañoJugador} de daño</strong>.</p>
    `;

    if (vidaActualEnemigo <= 0 && vidaActualJugador <= 0) {
        logResultado += `<h3 style="color: #caaa98; margin-top: 15px;">¡Mutuo K.O.! Ambos cayeron por las heridas.</h3>`;
        mostrarToast("Empate trágico en Roshar.", "#ff9900"); //
    } else if (vidaActualEnemigo <= 0) {
        logResultado += `<h3 style="color: #4aff4a; margin-top: 15px;">¡Victoria! Has derrotado al Capitán.</h3>`;
        mostrarToast("¡Combate ganado con éxito!", "#09ff00"); //
    } else if (vidaActualJugador <= 0) {
        logResultado += `<h3 style="color: #ff4a4a; margin-top: 15px;">Has caído en combate... La tormenta te reclama.</h3>`;
        mostrarToast("Tu Radiante ha sido derrotado.", "#ff0000"); //
    } else {
        mostrarToast("¡Ronda completada!", "#202940"); //
    }

actualizarPantallaCombate(logResultado);
};

btnAvanzarDialogo.addEventListener('click', () => {
    pasoActual++;
    renderizarDialogo();
});