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


let usuarios = [];


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
                "id,nombre,apellidos,rol,activo"
            )
            .eq("id", user.id)
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
                numero_socio,
                nombre,
                apellidos,
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