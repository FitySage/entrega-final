const cargarAlforja = () => {
    const alforjaGuardada = localStorage.getItem('alforjaGuardada');
    return alforjaGuardada ? JSON.parse(alforjaGuardada) : [];
};

const guardarAlforja = (alforja) => {
    localStorage.setItem('alforjaGuardada', JSON.stringify(alforja));
};

const borrarAlforja = () => {
    localStorage.removeItem('alforjaGuardada');
};

const cargarPerfil = () => {
    const perfil = sessionStorage.getItem('perfilRoshar');
    return perfil ? JSON.parse(perfil) : null;
};

const guardarPerfil = (perfil) => {
    sessionStorage.setItem('perfilRoshar', JSON.stringify(perfil));
};