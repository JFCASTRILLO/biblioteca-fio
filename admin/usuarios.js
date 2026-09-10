/* ==========================================================
   SUPABASE
   ========================================================== */

const SUPABASE_URL =
    "https://ffxnsvetxaikdpolvjym.supabase.co";

/*
   IMPORTANTE:
   En la siguiente línea utiliza EXACTAMENTE
   la misma clave publicable que tienes en ejemplares.js
*/
const SUPABASE_KEY =
    "sb_publishable_nVJbKuJztCNImhywm7OS8Q_KA064589";


const clienteSupabase =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* ==========================================================
   ELEMENTOS
   ========================================================== */

const nombreAdmin =
    document.getElementById("nombre-admin");

const btnCerrarSesion =
    document.getElementById("btn-cerrar-sesion");

const txtBuscar =
    document.getElementById("buscar-usuario");

const filtroSocio =
    document.getElementById("filtro-socio");

const filtroCuenta =
    document.getElementById("filtro-cuenta");

const btnLimpiarBusqueda =
    document.getElementById("btn-limpiar-busqueda");

const cuerpoTabla =
    document.getElementById("tabla-usuarios-body");

const contador =
    document.getElementById("contador-usuarios");

const modalUsuario =
    document.getElementById("modal-usuario");

const fichaUsuario =
    modalUsuario.querySelector(
        ".ficha-ejemplar-admin"
    );

const btnCerrarFichaUsuario =
    document.getElementById(
        "cerrar-ficha-usuario"
    );

const fichaUsuarioNombre =
    document.getElementById(
        "ficha-usuario-nombre"
    );

const fichaUsuarioSocio =
    document.getElementById(
        "ficha-usuario-socio"
    );

const fichaNumeroSocio =
    document.getElementById(
        "ficha-numero-socio"
    );

const fichaNombre =
    document.getElementById(
        "ficha-nombre"
    );

const fichaApellidos =
    document.getElementById(
        "ficha-apellidos"
    );

const fichaEmail =
    document.getElementById(
        "ficha-email"
    );

const fichaTelefono =
    document.getElementById(
        "ficha-telefono"
    );

const fichaObservaciones =
    document.getElementById(
        "ficha-observaciones"
    );

const editarEmail =
    document.getElementById(
        "editar-email"
    );

const editarTelefono =
    document.getElementById(
        "editar-telefono"
    );

const editarObservaciones =
    document.getElementById(
        "editar-observaciones"
    );

const fichaSocioActivo =
    document.getElementById(
        "ficha-socio-activo"
    );

const fichaCuentaActiva =
    document.getElementById(
        "ficha-cuenta-activa"
    );

const fichaRol =
    document.getElementById(
        "ficha-rol"
    );

const fichaValidacion =
    document.getElementById(
        "ficha-validacion"
    );

const fichaCuentaWeb =
    document.getElementById(
        "ficha-cuenta-web"
    );

const btnEditarUsuario =
    document.getElementById(
        "btn-editar-usuario"
    );

const btnGuardarUsuario =
    document.getElementById(
        "btn-guardar-usuario"
    );

const btnCancelarUsuario =
    document.getElementById(
        "btn-cancelar-usuario"
    );

const editarNumeroSocio =
    document.getElementById(
        "editar-numero-socio"
    );

const editarNombre =
    document.getElementById(
        "editar-nombre"
    );

const editarApellidos =
    document.getElementById(
        "editar-apellidos"
    );

const editarSocioActivo =
    document.getElementById(
        "editar-socio-activo"
    );

const editarCuentaActiva =
    document.getElementById(
        "editar-cuenta-activa"
    );

const editarRol =
    document.getElementById(
        "editar-rol"
    );

const editarValidacion =
    document.getElementById(
        "editar-validacion"
    );

let usuarios = [];
let usuarioActual = null;

/* ==========================================================
   INICIO
   ========================================================== */

iniciar();


async function iniciar() {

    const usuarioAdmin =
        await comprobarAdministrador();

    if (!usuarioAdmin) {
        return;
    }

    await cargarUsuarios();

}


/* ==========================================================
   COMPROBAR ADMINISTRADOR
   ========================================================== */

async function comprobarAdministrador() {

    const {
        data: { user },
        error: errorUsuario
    } =
        await clienteSupabase.auth.getUser();


    if (errorUsuario || !user) {

        window.location.href =
            "index.html";

        return null;

    }


    const {
    data: perfil,
    error: errorPerfil
} =
    await clienteSupabase
        .from("usuarios")
        .select(
            "id,auth_user_id,nombre,apellidos,rol,activo"
        )
        .eq("auth_user_id", user.id)
        .single();


    if (
        errorPerfil ||
        !perfil ||
        perfil.rol !== "admin" ||
        perfil.activo !== true
    ) {

        await clienteSupabase.auth.signOut();

        window.location.href =
            "index.html";

        return null;

    }


    nombreAdmin.textContent =
        [perfil.nombre, perfil.apellidos]
            .filter(Boolean)
            .join(" ");


    return perfil;

}


/* ==========================================================
   CARGAR USUARIOS
   ========================================================== */

async function cargarUsuarios() {

    contador.textContent =
        "Cargando usuarios...";


    const {
        data,
        error
    } =
        await clienteSupabase
            .from("usuarios")
            .select(`
                id,
                auth_user_id,
                numero_socio,
                nombre,
                apellidos,
                email,
                telefono,
                observaciones,
                rol,
                activo,
                socio_activo,
                ultima_validacion_socio
            `)
            .order(
                "numero_socio",
                { ascending: true }
            );


    if (error) {

        console.error(
            "Error al cargar usuarios:",
            error
        );

        contador.textContent =
            "No se han podido cargar los usuarios.";

        return;

    }


    usuarios =
        data || [];


    mostrarUsuarios();

}


/* ==========================================================
   MOSTRAR / FILTRAR USUARIOS
   ========================================================== */

function mostrarUsuarios() {

    const texto =
        txtBuscar.value
            .trim()
            .toLowerCase();


    const estadoSocio =
        filtroSocio.value;


    const estadoCuenta =
        filtroCuenta.value;


    const filtrados =
        usuarios.filter(
            function (usuario) {

                const coincideTexto =
                    !texto ||
                    (
                        usuario.numero_socio || ""
                    )
                        .toLowerCase()
                        .includes(texto) ||
                    (
                        usuario.nombre || ""
                    )
                        .toLowerCase()
                        .includes(texto) ||
                    (
                        usuario.apellidos || ""
                    )
                        .toLowerCase()
                        .includes(texto);


                const coincideSocio =
                    !estadoSocio ||
                    (
                        estadoSocio === "activo" &&
                        usuario.socio_activo === true
                    ) ||
                    (
                        estadoSocio === "inactivo" &&
                        usuario.socio_activo === false
                    );


                const coincideCuenta =
                    !estadoCuenta ||
                    (
                        estadoCuenta === "activo" &&
                        usuario.activo === true
                    ) ||
                    (
                        estadoCuenta === "inactivo" &&
                        usuario.activo === false
                    );


                return (
                    coincideTexto &&
                    coincideSocio &&
                    coincideCuenta
                );

            }
        );


    pintarTabla(filtrados);

}


/* ==========================================================
   PINTAR TABLA
   ========================================================== */

function pintarTabla(lista) {

    cuerpoTabla.innerHTML = "";


    lista.forEach(
        function (usuario) {

            const fila =
                document.createElement("tr");

                fila.classList.add(
                    "fila-ejemplar-admin"
                );

                fila.addEventListener(
                    "click",
                    function () {

                        abrirFichaUsuario(
                            usuario
                        );

                    }
                );



            fila.innerHTML = `
                <td>${escaparHTML(usuario.numero_socio)}</td>
                <td>${escaparHTML(usuario.nombre)}</td>
                <td>${escaparHTML(usuario.apellidos)}</td>

                <td>
                    <span class="${
                        usuario.socio_activo
                            ? "estado-admin estado-disponible"
                            : "estado-admin estado-inactivo"
                    }">
                        ${
                            usuario.socio_activo
                                ? "ACTIVO"
                                : "NO ACTIVO"
                        }
                    </span>
                </td>

                <td>
                    <span class="${
                        usuario.activo
                            ? "estado-admin estado-disponible"
                            : "estado-admin estado-inactivo"
                    }">
                        ${
                            usuario.activo
                                ? "HABILITADA"
                                : "DESHABILITADA"
                        }
                    </span>
                </td>

                <td>
                    ${escaparHTML(
                        usuario.rol
                            ? usuario.rol.toUpperCase()
                            : ""
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        usuario.ultima_validacion_socio
                    )}
                </td>
            `;


            cuerpoTabla.appendChild(
                fila
            );

        }
    );


    contador.textContent =
        lista.length === 1
            ? "1 usuario"
            : `${lista.length} usuarios`;

}

/* ==========================================================
   FICHA DEL USUARIO
   ========================================================== */

function valorFichaUsuario(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "—";
    }

    return valor;
}


function abrirFichaUsuario(usuario) {

    usuarioActual = usuario;

    const nombreCompleto =
        [
            usuario.nombre,
            usuario.apellidos
        ]
            .filter(Boolean)
            .join(" ");


    fichaUsuarioNombre.textContent =
        nombreCompleto || "Usuario";


    fichaUsuarioSocio.textContent =
        usuario.numero_socio
            ? "Socio " + usuario.numero_socio
            : "Sin número de socio";


    fichaNumeroSocio.textContent =
        valorFichaUsuario(
            usuario.numero_socio
        );


    fichaNombre.textContent =
        valorFichaUsuario(
            usuario.nombre
        );


    fichaApellidos.textContent =
        valorFichaUsuario(
            usuario.apellidos
        );


    fichaSocioActivo.textContent =
        usuario.socio_activo
            ? "ACTIVO"
            : "NO ACTIVO";


    fichaCuentaActiva.textContent =
        usuario.activo
            ? "HABILITADA"
            : "DESHABILITADA";


    fichaRol.textContent =
        usuario.rol
            ? usuario.rol.toUpperCase()
            : "—";


    fichaValidacion.textContent =
        valorFichaUsuario(
            usuario.ultima_validacion_socio
        );

    fichaCuentaWeb.textContent =
        usuario.auth_user_id
            ? "SÍ"
            : "NO";

    fichaEmail.textContent =
    valorFichaUsuario(
        usuario.email
    );

    fichaTelefono.textContent =
        valorFichaUsuario(
            usuario.telefono
        );

    fichaObservaciones.textContent =
        valorFichaUsuario(
            usuario.observaciones
        );

    
    /*
     * Cada vez que abrimos una ficha,
     * debe comenzar en modo consulta.
     */

    fichaUsuario.classList.remove(
        "modo-edicion"
    );


    /*
     * Mostrar la ficha.
     */

    modalUsuario.classList.add(
        "visible"
    );

    document.body.classList.add(
        "modal-abierto"
    );

}


function cerrarFichaUsuario() {

    /*
     * Si el usuario estaba editando,
     * abandonamos el modo edición.
     */

    fichaUsuario.classList.remove(
        "modo-edicion"
    );


    /*
     * Cerramos la ficha.
     */

    modalUsuario.classList.remove(
        "visible"
    );


    /*
     * Permitimos de nuevo el desplazamiento
     * de la página principal.
     */

    document.body.classList.remove(
        "modal-abierto"
    );


    /*
     * Ya no hay ningún usuario seleccionado.
     */

    usuarioActual = null;

}


btnCerrarFichaUsuario.addEventListener(
    "click",
    cerrarFichaUsuario
);


modalUsuario.addEventListener(
    "click",
    function (event) {

        if (
            event.target === modalUsuario
        ) {
            cerrarFichaUsuario();
        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            modalUsuario.classList.contains(
                "visible"
            )
        ) {
            cerrarFichaUsuario();
        }

    }
);


/* ==========================================================
   FILTROS
   ========================================================== */

txtBuscar.addEventListener(
    "input",
    mostrarUsuarios
);


filtroSocio.addEventListener(
    "change",
    mostrarUsuarios
);


filtroCuenta.addEventListener(
    "change",
    mostrarUsuarios
);


btnLimpiarBusqueda.addEventListener(
    "click",
    function () {

        txtBuscar.value = "";

        mostrarUsuarios();

        txtBuscar.focus();

    }
);


/* ==========================================================
   EDITAR USUARIO
   ========================================================== */

btnEditarUsuario.addEventListener(
    "click",
    function () {

        if (!usuarioActual) {
            return;
        }

        editarNumeroSocio.value =
            usuarioActual.numero_socio || "";

        editarNombre.value =
            usuarioActual.nombre || "";

        editarApellidos.value =
            usuarioActual.apellidos || "";

        editarEmail.value =
            usuarioActual.email || "";

        editarTelefono.value =
            usuarioActual.telefono || "";

        editarObservaciones.value =
            usuarioActual.observaciones || "";

        editarSocioActivo.value =
            String(
                usuarioActual.socio_activo
            );

        editarCuentaActiva.value =
            String(
                usuarioActual.activo
            );

        editarRol.value =
            usuarioActual.rol || "socio";

        editarValidacion.value =
            usuarioActual.ultima_validacion_socio || "";

        fichaUsuario.classList.add(
            "modo-edicion"
        );

    }
);


/* ==========================================================
   CANCELAR EDICIÓN
   ========================================================== */

btnCancelarUsuario.addEventListener(
    "click",
    function () {

        fichaUsuario.classList.remove(
            "modo-edicion"
        );

    }
);


/* ==========================================================
   GUARDAR USUARIO
   ========================================================== */

btnGuardarUsuario.addEventListener(
    "click",
    async function () {

        if (!usuarioActual) {
            return;
        }

        const numeroSocio =
            editarNumeroSocio.value.trim();

        const nombre =
            editarNombre.value.trim();

        const apellidos =
            editarApellidos.value.trim();

        if (!numeroSocio) {

            alert(
                "El número de socio no puede quedar vacío."
            );

            editarNumeroSocio.focus();

            return;
        }

        if (!nombre) {

            alert(
                "El nombre no puede quedar vacío."
            );

            editarNombre.focus();

            return;
        }

        const validacion =
            editarValidacion.value.trim() === ""
                ? null
                : Number(
                    editarValidacion.value
                );

        const cambios = {

            numero_socio:
                numeroSocio,

            nombre:
                nombre,

            apellidos:
                apellidos || null,

            socio_activo:
                editarSocioActivo.value === "true",

            activo:
                editarCuentaActiva.value === "true",

            rol:
                editarRol.value,

            ultima_validacion_socio:
                validacion,

            email:
                editarEmail.value.trim() || null,

            telefono:
                editarTelefono.value.trim() || null,

            observaciones:
                editarObservaciones.value.trim() || null,

        };

        btnGuardarUsuario.disabled = true;

        btnGuardarUsuario.textContent =
            "Guardando...";

        const {
            data,
            error
        } =
            await clienteSupabase
                .from("usuarios")
                .update(cambios)
                .eq(
                    "id",
                    usuarioActual.id
                )
                .select()
                .single();

        btnGuardarUsuario.disabled = false;

        btnGuardarUsuario.textContent =
            "Guardar cambios";

        if (error) {

            console.error(
                "Error al actualizar usuario:",
                error
            );

            alert(
                "No se han podido guardar los cambios."
            );

            return;
        }

        Object.assign(
            usuarioActual,
            data
        );

        fichaNumeroSocio.textContent =
            valorFichaUsuario(
                data.numero_socio
            );

        fichaNombre.textContent =
            valorFichaUsuario(
                data.nombre
            );

        fichaApellidos.textContent =
            valorFichaUsuario(
                data.apellidos
            );

        fichaEmail.textContent =
            valorFichaUsuario(
                data.email
            );

        fichaTelefono.textContent =
            valorFichaUsuario(
                data.telefono
            );

        fichaObservaciones.textContent =
            valorFichaUsuario(
                data.observaciones
            );

        fichaSocioActivo.textContent =
            data.socio_activo
                ? "ACTIVO"
                : "NO ACTIVO";

        fichaCuentaActiva.textContent =
            data.activo
                ? "HABILITADA"
                : "DESHABILITADA";

        fichaRol.textContent =
            data.rol
                ? data.rol.toUpperCase()
                : "—";

        fichaValidacion.textContent =
            valorFichaUsuario(
                data.ultima_validacion_socio
            );

        fichaUsuarioNombre.textContent =
            [
                data.nombre,
                data.apellidos
            ]
                .filter(Boolean)
                .join(" ");

        fichaUsuarioSocio.textContent =
            data.numero_socio
                ? "Socio " + data.numero_socio
                : "Sin número de socio";

        fichaUsuario.classList.remove(
            "modo-edicion"
        );

        mostrarUsuarios();

        alert(
            "Los datos del usuario se han guardado correctamente."
        );

    }
);



/* ==========================================================
   CERRAR SESIÓN
   ========================================================== */

btnCerrarSesion.addEventListener(
    "click",
    async function () {

        await clienteSupabase.auth.signOut();

        window.location.href =
            "index.html";

    }
);


/* ==========================================================
   SEGURIDAD HTML
   ========================================================== */

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }


    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}