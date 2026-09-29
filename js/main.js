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
    raza: "Portador del Vacío",
    tipo: "fusionado",
    estadistica: "PV:90 AD:20 Def:40",
    ataqueMAx: 23,
    miniatura: "./assets/imgs/enemigos/portador.jpg"
};
const renderizarDialogo = () => {
    const cajaDialogos = document.getElementById("caja-dialogos");
    if (pasoActual >= guionHistoria.length) {
        cajaDialogos.innerHTML = `
        <h2 class="efecto-tipeado">La Expedicion comienza...</h2>
        <p class="efecto-tipeado">Has completado los preparativos. ¡Que las tormentas te bendigan!</p>`;
        btnAvanzarDialogo.classList.add("ocultar")
        iniciarAnimacionesTexto();
        prepararAsalto();
        return;
    }

    const dialogoDeTurno = guionHistoria[pasoActual];

    cajaDialogos.innerHTML = `
    <h2>${sprenNarrador} Se materializa y dice:</h2>
    <h3 class="efecto-tipeado">"${dialogoDeTurno.titulo}"</h3>
    <p class="efecto-tipeado">${dialogoDeTurno.texto}</p>
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
        const datosPj = personajes.find(pj => pj.nombre === personajeElegido);

        if (datosPj) {
            mostrarCartaFinal(datosPj);
        }
    } catch (error) {
        console.error("Error al cargar la parte final:", error);
    }
};

const mostrarCartaFinal = (pj) => {
    const itemsNombres = alforja.map(item => item.nombre);
    const alforjaTexto = itemsNombres.length > 0 ? itemsNombres.join(", ") : "Vacía";
    const {nombre, img, orden, estadisticas} = pj;
    const {raza, miniatura, tipo, estadistica} = capitanEnemigo;
    contenedorCartaFinal.innerHTML = `
        <div class="grid-container" style="width: 100%;">
        <div class="card-combate">
                <img src="${img}" alt="${nombre}">
                <p><strong>Orden:</strong> ${orden}</p>
                <p><strong>Estadísticas:</strong> ${estadisticas}</p>
                <p><strong>Alforja actual:</strong> ${alforjaTexto}</p>
            </div>

            <div class="card-combate">
                <h3 style="color: #ff6b6b;">${raza}</h3>
                <img src="${miniatura}" alt="${raza}">
                <p><strong>Tipo de amenaza:</strong> ${tipo}</p>
                <p><strong>Atributos:</strong> ${estadistica}</p>
                <p><strong>Peligrosidad:</strong> Media</p>
            </div>
        </div>
        
        <div style="text-align: center; width: 100%; margin-top: 20px;">
            <button class="btn-mostrar" id="btn-comenzar-pelea">Comenzar breve pelea</button>
        </div>
    `;

    document.getElementById('btn-comenzar-pelea').addEventListener('click', combateAzar);
};

const combateAzar = () => {
    const dañoEnemigo = Math.floor(Math.random() * capitanEnemigo.ataqueMax) + 5; 
    const dañoJugador = Math.floor(Math.random() * 25) + 10; 

    Swal.fire({
        title: "¡Combate en curso!",
        html: `
            <p>Un <strong>${capitanEnemigo.nombre}</strong> aparece desde las sombras de la tormenta.</p>
            <hr>
            <p style="color: #ff4a4a;">💥 Recibes <strong>${dañoEnemigo} PV</strong> de daño en el contraataque.</p>
            <p style="color: #4aff4a;">⚔️ Logras asestar un golpe de <strong>${dañoJugador} AD</strong> al enemigo.</p>
        `,
        icon: "warning",
        confirmButtonText: "Continuar",
        confirmButtonColor: "#CAAA98"
    }).then(() => {
        mostrarToast("Combate finalizado. ¡Has sobrevivido al encuentro!", "#202940");
    });
};


btnAvanzarDialogo.addEventListener('click', () => {
    pasoActual++;
    renderizarDialogo();
});