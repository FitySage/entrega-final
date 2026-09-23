const contenedorPj = document.getElementById('grilla-personajes');
const seccionPj = document.getElementById('pj-container');
const seccionAlmacen = document.getElementById('ventana-almacen');
const tituloAlmacen = document.getElementById('titulo-almacen');
const contenedorItems = document.getElementById('items');
const contenedorAlforja = document.getElementById('alforja-container');
const contadorAlforja = document.getElementById('contador-alforja');
const btnVaciar = document.getElementById('btn-vaciar');
const carga = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LIMITE_ALFORJA = 5;
let personajeElegido = "";
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
    }
};

const mostrarDetallesPj = (detalles) => {
    contenedorPj.innerHTML = "";
    detalles.forEach(radiante => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card");
        tarjeta.innerHTML = `
            <img src="${radiante.img}" alt="${radiante.nombre}">
            <p><strong>Orden:</strong> ${radiante.Orden}</p>
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

        const idsPokeApi = [18, 26, 28, 29, 30, 34];
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
        const { nombre, descripcion, stock } = dato;
        const imgPokemon = imagenesPoke[index].sprites.default;

        const cantidadEnAlforja = alforja.filter(item => item.nombre === nombre).length;
        const stockDinamico = stock - cantidadEnAlforja;

        const tarjeta = document.createElement('div');
        tarjeta.classList.add('card');

        tarjeta.innerHTML = `
            <h3>${nombre}</h3>
            <img src="${imgPokemon}" alt="${nombre}" width="70">
            <p>${descripcion}</p>
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
            <button class="btn-quitar" data-index="${index}" style="margin-left:10px; cursor:pointer;">❌</button>
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
        footer: "Esperemos puedas disfrutarlo. si quedas con ganas de mas puedes buscas la saga de novelas del Archivo de las tormentas",
        theme: 'auto',
        width: "950px",
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