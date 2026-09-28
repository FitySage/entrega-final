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