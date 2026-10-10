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
const btnAvanzarDialogo = document.getElementById('btn-avanzar-dialogo');

const carga = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const limiteAlforja = 5;

let personajeElegido = "";
let guionHistoria = [];
let pasoActual = 0;
let sprenNarrador = "Voz Misteriosa";
let catalogoAlmacen = [];
let imagenesPoke = [];
let datosHeroeActual = null;
let tiempoInicio = Date.now();

let alforja = cargarAlforja();
let perfilUsuario = cargarPerfil();

setTimeout(() => {
    if (!perfilUsuario) {
        Swal.fire({
            title: "Bienvenido a Roshar",
            html: `
                <p> En esta aventura RPG eliges a uno de los 4 personajes, lo equipas y luchas.</p>
                <input id="swal-nombre" class="swal2-input" placeholder="Como quieres que te llamen?">
                <div>
                    <label>¿Conoces el lore de Brandon Sanderson?</label><br><br>
                    <input type="radio" id="lore-si" name="lore" value="si"> <label for="lore-si">Sí, Soy Erudito</label>
                    <input type="radio" id="lore-no" name="lore" value="no" checked> <label for="lore-no"> No, primera vez</label>
                </div>
            `,
            theme: 'auto',
            width: "1200px",
            confirmButtonText: "Comenzar aventura",
            allowOutsideClick: false,
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value || "viajero";
                const conoceLore = document.getElementById('lore-si').checked;
                return { nombre, conoceLore };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                perfilUsuario = result.value;
                guardarPerfil(perfilUsuario);
                mostrarToast(`¡Que las tormentas te guíen, ${perfilUsuario.nombre}!`);
            }
        });
    }
}, 1000);

const obtenerDetallesPj = async () => {
    try {
        const response = await fetch('./json/characters.json');
        if (!response.ok) throw new Error('Error al cargar personajes');
        const detalles = await response.json();
        mostrarDetallesPj(detalles);
    } catch (error) {
        console.error('Error:', error);
    }};

const mostrarDetallesPj = (detalles) => {
    contenedorPj.innerHTML = "";
    detalles.forEach(radiante => {
        const { nombre, orden, atributo, descripcion, img } = radiante;
        const tarjeta = document.createElement("div");
        tarjeta.classList.add('card', 'card--pj');
        tarjeta.innerHTML = `
            <img src="${img}" alt="${nombre}">
            <p><strong>Orden:</strong> ${orden}</p>
            <p><strong>Atributo:</strong> ${atributo}</p>
            <p>${descripcion}</p>
            <button class="btn-mostrar btn-elegir-pj" data-nombre="${nombre}">Elegir</button>
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
    tituloAlmacen.textContent = `${personajeElegido} selecciona tus objetos. Límite: ${limiteAlforja}`;
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
        tarjeta.classList.add('card', 'card--tienda');
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
            agregarAAlforja(JSON.parse(e.target.dataset.item));
        });
    });
};

const agregarAAlforja = (item) => {
    if (alforja.length >= limiteAlforja) {
        mostrarToast(`¡La alforja está llena!`, "#ff0000");
        return;
    }
    alforja.push(item);
    guardarAlforja(alforja);
    renderizarAlforja();
    renderizarVitrina();
    mostrarToast(`${item.nombre} guardado.`, "#09ff00");
};

const renderizarAlforja = () => {
    contenedorAlforja.innerHTML = "";
    contadorAlforja.textContent = `Capacidad: ${alforja.length} / ${limiteAlforja}`;

    if (alforja.length === 0) {
        contenedorAlforja.innerHTML = "<p>Tu alforja está vacía.</p>";
        return;
    }

    alforja.forEach((item, index) => {
        const itemP = document.createElement("p");
        itemP.innerHTML = `${item.nombre} <button class="btn-quitar" data-index="${index}">❌</button>`;
        contenedorAlforja.appendChild(itemP);
    });

    document.querySelectorAll('.btn-quitar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            alforja.splice(e.target.dataset.index, 1);
            guardarAlforja(alforja);
            renderizarAlforja();
            renderizarVitrina();
        });
    });
};

btnVaciar.addEventListener('click', () => {
    alforja = [];
    borrarAlforja();
    renderizarAlforja();
    renderizarVitrina();
});

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
        
        datosHeroeActual = personajes.find(pj => pj.nombre === personajeElegido);
        sprenNarrador = datosHeroeActual.spren || "Voz Misteriosa";
        pasoActual = 0;
        
        renderizarDialogo();
    } catch (error) {
        console.error("Error al cargar historia", error);
        document.getElementById("caja-dialogos").innerHTML = "<p>Error de conexión en Roshar.</p>";
    } finally {

    }
});

const renderizarDialogo = () => {
    const cajaDialogos = document.getElementById("caja-dialogos");
    if (pasoActual >= guionHistoria.length) {
        cajaDialogos.innerHTML = `
        <h3 class="efecto-tipeado">Parece que el enfrentamiento es inevitable</h3>
        <p class="efecto-tipeado">Demostremos por qué fuimos elegidos para el combate</p>`;
        btnAvanzarDialogo.classList.add("ocultar");
        
        if (typeof iniciarAnimacionesTexto === "function") iniciarAnimacionesTexto();
        prepararAsalto();
        return;
    }

    const dialogoDeTurno = guionHistoria[pasoActual];
    cajaDialogos.innerHTML = `
    <h2>Durante el viaje tu Spren decide ponerse hablador </h2>
    <h3>${sprenNarrador} se materializa y dice:</h3>
    <div class="texto-flotante respiracion">
      <h3 class="efecto-tipeado">"${dialogoDeTurno.titulo}"</h3>
      <p class="efecto-tipeado">${dialogoDeTurno.texto}</p>
    </div>
    `;

    if (typeof iniciarAnimacionesTexto === "function") iniciarAnimacionesTexto();
};

btnAvanzarDialogo.addEventListener('click', () => {
    pasoActual++;
    renderizarDialogo();
});

const mostrarToast = (mensaje, colorFondo = "#333") => {
    Toastify({
        text: mensaje,
        duration: 3000,
        style: { background: colorFondo, color: "#fff" }
    }).showToast();
};

obtenerDetallesPj();
renderizarAlforja();

const animarElemento = (elemento, velocidad = 40) => {
    const textoOriginal = elemento.textContent.trim();
    elemento.textContent = ""; 
    let i = 0;

    const intervalo = setInterval(() => {
        if (i < textoOriginal.length) {
            elemento.textContent += textoOriginal.charAt(i);
            i++;
        } else {
            clearInterval(intervalo);
        }
    }, velocidad);
};

const iniciarAnimacionesTexto = () => {
    const textosParaAnimar = document.querySelectorAll(".efecto-tipeado");
    textosParaAnimar.forEach(elemento => {
        animarElemento(elemento, 35);
    });
};

document.addEventListener("DOMContentLoaded", iniciarAnimacionesTexto);