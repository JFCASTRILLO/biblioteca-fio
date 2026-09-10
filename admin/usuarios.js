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

const bloqueCuentaWeb =
    document.getElementById(
        "bloque-cuenta-web"
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

const btnNuevoUsuario =
    document.getElementById(
        "btn-nuevo-usuario"
    );

const btnImportarSocios =
    document.getElementById(
        "btn-importar-socios"
    );

const archivoSocios =
    document.getElementById(
        "archivo-socios"
    );

const modalImportacionSocios =
    document.getElementById(
        "modal-importacion-socios"
    );

const cerrarImportacionSocios =
    document.getElementById(
        "cerrar-importacion-socios"
    );

const btnCancelarImportacion =
    document.getElementById(
        "btn-cancelar-importacion"
    );

const btnConfirmarImportacion =
    document.getElementById(
        "btn-confirmar-importacion"
    );

const importacionArchivo =
    document.getElementById(
        "importacion-archivo"
    );

const impRegistros =
    document.getElementById("imp-registros");

const impUnicos =
    document.getElementById("imp-unicos");

const impDuplicados =
    document.getElementById("imp-duplicados");

const impActivos =
    document.getElementById("imp-activos");

const impNoActivos =
    document.getElementById("imp-no-activos");

const impNuevos =
    document.getElementById("imp-nuevos");

const impExistentes =
    document.getElementById("imp-existentes");

const impConTelefono =
    document.getElementById("imp-con-telefono");

const impSinTelefono =
    document.getElementById("imp-sin-telefono");

const impTelefonosRevisar =
    document.getElementById(
        "imp-telefonos-revisar"
    );

const impConEmail =
    document.getElementById("imp-con-email");

const impSinEmail =
    document.getElementById("imp-sin-email");

const impEmailsRevisar =
    document.getElementById(
        "imp-emails-revisar"
    );

const impValidacion =
    document.getElementById("imp-validacion");

const impFormatoTelefono =
    document.getElementById(
        "imp-formato-telefono"
    );

let usuarios = [];
let usuarioActual = null;
let modoNuevoUsuario = false;
let administradorActual = null;

/* ==========================================================
   INICIO
   ========================================================== */

iniciar();


async function iniciar() {

    administradorActual =
    await comprobarAdministrador();

    if (!administradorActual) {
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

    modoNuevoUsuario = false;

    btnGuardarUsuario.textContent =
        "Guardar cambios";

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

    bloqueCuentaWeb.style.display = "";

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

    modalUsuario.classList.remove(
    "nuevo-usuario"
    );

    modoNuevoUsuario = false;


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
   IMPORTAR SOCIOS DESDE EXCEL
   ========================================================== */

   /*
 * Normaliza los nombres de las columnas del Excel.
 *
 * Ejemplos:
 * "Teléfono"  -> "telefono"
 * "Nº Socio"  -> "n_socio"
 * "SOCIO ACTIVO" -> "socio_activo"
 */

function normalizarNombreColumna(nombre) {

    return String(nombre || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

}


/*
 * Convierte una fila del Excel para que
 * podamos trabajar siempre con nombres
 * de columnas normalizados.
 */

function normalizarFilaExcel(fila) {

    const resultado = {};

    Object.keys(fila).forEach(
        function (columna) {

            const nombreNormalizado =
                normalizarNombreColumna(
                    columna
                );

            /*
             * Ignoramos columnas completamente
             * vacías generadas por Excel.
             */

            if (
                !nombreNormalizado ||
                nombreNormalizado.startsWith(
                    "__empty"
                )
            ) {
                return;
            }

            resultado[nombreNormalizado] =
                fila[columna];

        }
    );

    return resultado;
}


/*
 * Normaliza un teléfono sin inventar
 * ni corregir números.
 */

function normalizarTelefono(valor) {

    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "";
    }

    let telefono =
        String(valor)
            .trim()
            .replace(/[.\s()-]/g, "");

    /*
     * Eliminamos únicamente el prefijo
     * internacional español.
     */

    if (telefono.startsWith("+34")) {

        telefono =
            telefono.substring(3);

    } else if (
        telefono.startsWith("0034")
    ) {

        telefono =
            telefono.substring(4);

    }

    return telefono;
}


/*
 * Comprueba si parece un móvil español.
 *
 * Debe tener 9 cifras y comenzar
 * por 6 o por 7.
 */

function esMovilEspanol(telefono) {

    return /^[67][0-9]{8}$/.test(
        telefono
    );

}

/*
 * Obtiene el teléfono que guardaremos.
 *
 * FORMATO FUTURO:
 * Si existe una columna "telefono",
 * se utiliza directamente.
 *
 * FORMATO ANTIGUO:
 * Si existen telefono1 / telefono2,
 * elegimos automáticamente el más
 * adecuado.
 */

function obtenerTelefonoSocio(fila) {

    /*
     * Formato nuevo:
     * una única columna telefono.
     */

    if (
        Object.prototype.hasOwnProperty.call(
            fila,
            "telefono"
        )
    ) {

        return normalizarTelefono(
            fila.telefono
        );

    }


    /*
     * Formato antiguo:
     * telefono1 y telefono2.
     */

    const telefono1 =
        normalizarTelefono(
            fila.telefono1
        );

    const telefono2 =
        normalizarTelefono(
            fila.telefono2
        );


    /*
     * Preferimos un móvil.
     */

    if (esMovilEspanol(telefono2)) {
        return telefono2;
    }

    if (esMovilEspanol(telefono1)) {
        return telefono1;
    }


    /*
     * Si ninguno es móvil, conservamos
     * un teléfono disponible.
     */

    if (telefono2) {
        return telefono2;
    }

    if (telefono1) {
        return telefono1;
    }


    return "";

}

btnImportarSocios.addEventListener(
    "click",
    function () {

        archivoSocios.click();

    }
);

archivoSocios.addEventListener(
    "change",
    async function () {

        const archivo =
            archivoSocios.files[0];

        if (!archivo) {
            return;
        }

        try {

            /* ==============================================
               LEER EL ARCHIVO
               ============================================== */

            const datos =
                await archivo.arrayBuffer();

            const libro =
                XLSX.read(datos);

            const nombreHoja =
                libro.SheetNames[0];

            const hoja =
                libro.Sheets[nombreHoja];

            const filasOriginales =
                XLSX.utils.sheet_to_json(
                    hoja,
                    {
                        defval: ""
                    }
                );


            if (filasOriginales.length === 0) {

                alert(
                    "El archivo no contiene registros."
                );

                return;
            }


            /* ==============================================
               NORMALIZAR LAS FILAS
               ============================================== */

            const filas =
                filasOriginales.map(
                    normalizarFilaExcel
                );


            /*
             * Detectamos el formato del teléfono.
             *
             * FORMATO ACTUAL Y FUTURO:
             * una única columna "telefono".
             *
             * COMPATIBILIDAD HISTÓRICA 2026:
             * telefono1 + telefono2.
             */

            const primeraFila =
                filas[0];

            const tieneTelefonoUnico =
                Object.prototype.hasOwnProperty.call(
                    primeraFila,
                    "telefono"
                );

            const tieneTelefono1 =
                Object.prototype.hasOwnProperty.call(
                    primeraFila,
                    "telefono1"
                );

            const tieneTelefono2 =
                Object.prototype.hasOwnProperty.call(
                    primeraFila,
                    "telefono2"
                );


            let formatoTelefono =
                "Sin columna de teléfono";

            if (tieneTelefonoUnico) {

                formatoTelefono =
                    "telefono";

            } else if (
                tieneTelefono1 ||
                tieneTelefono2
            ) {

                formatoTelefono =
                    "telefono1 + telefono2 " +
                    "(compatibilidad histórica 2026)";

            }


            /* ==============================================
               COMPROBAR COLUMNAS OBLIGATORIAS
               ============================================== */

            const columnasObligatorias = [
                "numero_socio",
                "nombre",
                "apellidos",
                "socio_activo",
                "ultima_validacion_socio"
            ];


            const columnasFaltantes =
                columnasObligatorias.filter(
                    function (columna) {

                        return !Object.prototype
                            .hasOwnProperty.call(
                                primeraFila,
                                columna
                            );

                    }
                );


            if (columnasFaltantes.length > 0) {

                alert(
                    "No se puede analizar el archivo.\n\n" +
                    "Faltan estas columnas obligatorias:\n\n" +
                    columnasFaltantes.join("\n")
                );

                return;
            }


            /* ==============================================
               PREPARAR Y DEPURAR SOCIOS
               ============================================== */

            const sociosUnicos =
                new Map();

            let duplicados = 0;
            let filasSinNumeroSocio = 0;


            filas.forEach(
                function (fila) {

                    const numeroSocio =
                        String(
                            fila.numero_socio || ""
                        )
                            .trim()
                            .toUpperCase();


                    if (!numeroSocio) {

                        filasSinNumeroSocio++;

                        return;
                    }


                    if (
                        sociosUnicos.has(
                            numeroSocio
                        )
                    ) {

                        duplicados++;

                        /*
                         * Conservamos la primera aparición.
                         */

                        return;
                    }


                    const telefono =
                        obtenerTelefonoSocio(
                            fila
                        );


                    const socioActivoTexto =
                        String(
                            fila.socio_activo || ""
                        )
                            .trim()
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(
                                /[\u0300-\u036f]/g,
                                ""
                            );


                    const socioActivo =
                        [
                            "si",
                            "true",
                            "1",
                            "activo"
                        ].includes(
                            socioActivoTexto
                        );


                    const validacionTexto =
                        String(
                            fila.ultima_validacion_socio || ""
                        ).trim();


                    const validacion =
                        validacionTexto === ""
                            ? null
                            : Number(
                                validacionTexto
                            );


                    sociosUnicos.set(
                        numeroSocio,
                        {
                            numero_socio:
                                numeroSocio,

                            nombre:
                                String(
                                    fila.nombre || ""
                                ).trim(),

                            apellidos:
                                String(
                                    fila.apellidos || ""
                                ).trim(),

                            email:
                                String(
                                    fila.email || ""
                                ).trim(),

                            telefono:
                                telefono,

                            socio_activo:
                                socioActivo,

                            ultima_validacion_socio:
                                Number.isFinite(
                                    validacion
                                )
                                    ? validacion
                                    : null
                        }
                    );

                }
            );


            const socios =
                Array.from(
                    sociosUnicos.values()
                );


            /* ==============================================
               CONTADORES
               ============================================== */

            const sociosActivos =
                socios.filter(
                    socio =>
                        socio.socio_activo
                ).length;


            const sociosNoActivos =
                socios.length -
                sociosActivos;


            const conTelefono =
                socios.filter(
                    socio =>
                        socio.telefono !== ""
                ).length;


            const sinTelefono =
                socios.length -
                conTelefono;


            /*
             * Consideramos teléfono a revisar aquel
             * que no tenga 9 cifras después de
             * la normalización.
             */

            const telefonosRevisar =
                socios.filter(
                    function (socio) {

                        if (!socio.telefono) {
                            return false;
                        }

                        return !/^[0-9]{9}$/.test(
                            socio.telefono
                        );

                    }
                ).length;


            const conEmail =
                socios.filter(
                    socio =>
                        socio.email !== ""
                ).length;


            const sinEmail =
                socios.length -
                conEmail;


            /*
             * Validación básica.
             * No corregimos automáticamente
             * ninguna dirección.
             */

            const emailsRevisar =
                socios.filter(
                    function (socio) {

                        if (!socio.email) {
                            return false;
                        }

                        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            .test(
                                socio.email
                            );

                    }
                ).length;


            /* ==============================================
               COMPARAR CON USUARIOS DE BIBLIOTECA
               ============================================== */

            const numerosExistentes =
                new Set(
                    usuarios.map(
                        function (usuario) {

                            return String(
                                usuario.numero_socio || ""
                            )
                                .trim()
                                .toUpperCase();

                        }
                    )
                );


            const yaExistentes =
                socios.filter(
                    socio =>
                        numerosExistentes.has(
                            socio.numero_socio
                        )
                ).length;


            const nuevos =
                socios.length -
                yaExistentes;


            /* ==============================================
               AÑOS DE VALIDACIÓN DETECTADOS
               ============================================== */

            const anosValidacion =
                [
                    ...new Set(
                        socios
                            .map(
                                socio =>
                                    socio.ultima_validacion_socio
                            )
                            .filter(
                                valor =>
                                    valor !== null
                            )
                    )
                ]
                    .sort(
                        (a, b) => a - b
                    );


            const textoValidacion =
                anosValidacion.length > 0
                    ? anosValidacion.join(", ")
                    : "Sin año";


            /* ==============================================
               INFORME PREVIO
               ============================================== */

            const informe =
                "ANÁLISIS DEL ARCHIVO DE SOCIOS\n\n" +

                "Archivo: " +
                archivo.name +
                "\n" +

                "Hoja: " +
                nombreHoja +
                "\n\n" +

                "Registros leídos: " +
                filasOriginales.length +
                "\n" +

                "Socios únicos: " +
                socios.length +
                "\n" +

                "Duplicados: " +
                duplicados +
                "\n" +

                "Filas sin nº de socio: " +
                filasSinNumeroSocio +
                "\n\n" +

                "Socios FIO activos: " +
                sociosActivos +
                "\n" +

                "Socios FIO no activos: " +
                sociosNoActivos +
                "\n\n" +

                "Nuevos en Biblioteca: " +
                nuevos +
                "\n" +

                "Ya existentes: " +
                yaExistentes +
                "\n\n" +

                "Formato teléfono: " +
                formatoTelefono +
                "\n" +

                "Con teléfono: " +
                conTelefono +
                "\n" +

                "Sin teléfono: " +
                sinTelefono +
                "\n" +

                "Teléfonos a revisar: " +
                telefonosRevisar +
                "\n\n" +

                "Emails informados: " +
                conEmail +
                "\n" +

                "Sin email: " +
                sinEmail +
                "\n" +

                "Emails a revisar: " +
                emailsRevisar +
                "\n\n" +

                "Validación detectada: " +
                textoValidacion +
                "\n\n" +

                "NO se ha modificado ningún dato.";


            console.log(
                "Análisis de socios:",
                {
                    registros:
                        filasOriginales.length,

                    sociosUnicos:
                        socios.length,

                    duplicados:
                        duplicados,

                    nuevos:
                        nuevos,

                    existentes:
                        yaExistentes,

                    formatoTelefono:
                        formatoTelefono,

                    telefonosRevisar:
                        telefonosRevisar,

                    emailsRevisar:
                        emailsRevisar,

                    anosValidacion:
                        anosValidacion
                }
            );


            /*
            * Mostrar el resultado en el modal.
            */

            importacionArchivo.textContent =
                archivo.name +
                " · Hoja " +
                nombreHoja;

            impRegistros.textContent =
                filasOriginales.length;

            impUnicos.textContent =
                socios.length;

            impDuplicados.textContent =
                duplicados;

            impActivos.textContent =
                sociosActivos;

            impNoActivos.textContent =
                sociosNoActivos;

            impNuevos.textContent =
                nuevos;

            impExistentes.textContent =
                yaExistentes;

            impConTelefono.textContent =
                conTelefono;

            impSinTelefono.textContent =
                sinTelefono;

            impTelefonosRevisar.textContent =
                telefonosRevisar;

            impConEmail.textContent =
                conEmail;

            impSinEmail.textContent =
                sinEmail;

            impEmailsRevisar.textContent =
                emailsRevisar;

            impValidacion.textContent =
                textoValidacion;

            impFormatoTelefono.textContent =
                formatoTelefono;


            /*
            * El botón continúa deshabilitado.
            * Todavía estamos únicamente
            * analizando el fichero.
            */

            btnConfirmarImportacion.disabled =
                true;


            /*
            * Mostrar modal.
            */

            modalImportacionSocios.classList.add(
                "visible"
            );

            document.body.classList.add(
                "modal-abierto"
            );


        } catch (error) {

            console.error(
                "Error al analizar el Excel:",
                error
            );

            alert(
                "No se ha podido analizar el archivo Excel."
            );

        } finally {

            /*
             * Limpiamos el selector para que
             * pueda seleccionarse de nuevo
             * el mismo fichero.
             */

            archivoSocios.value = "";

        }

    }
);

    function cerrarModalImportacion() {

    modalImportacionSocios.classList.remove(
        "visible"
    );

    document.body.classList.remove(
        "modal-abierto"
    );

}


cerrarImportacionSocios.addEventListener(
    "click",
    cerrarModalImportacion
);


btnCancelarImportacion.addEventListener(
    "click",
    cerrarModalImportacion
);


modalImportacionSocios.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            modalImportacionSocios
        ) {

            cerrarModalImportacion();

        }

    }
);


/* ==========================================================
   NUEVO USUARIO
   ========================================================== */

btnNuevoUsuario.addEventListener(
    "click",
    function () {

        /*
         * Estamos creando un usuario nuevo.
         */

        modoNuevoUsuario = true;
        usuarioActual = null;

        btnGuardarUsuario.textContent =
        "Crear usuario";

        /*
         * Cabecera de la ficha.
         */

        fichaUsuarioNombre.textContent =
            "Nuevo usuario";

        fichaUsuarioSocio.textContent =
            "Alta manual en Biblioteca";

        /*
        * En un alta nueva no mostramos Cuenta web.
        * La vinculación web se gestionará aparte.
        */

        bloqueCuentaWeb.style.display =
            "none";

        /*
         * Limpiar los campos editables.
         */

        editarNumeroSocio.value = "";
        editarNombre.value = "";
        editarApellidos.value = "";

        editarEmail.value = "";
        editarTelefono.value = "";
        editarObservaciones.value = "";


        /*
         * Valores predeterminados.
         */

        editarSocioActivo.value =
            "true";

        editarCuentaActiva.value =
            "true";

        editarRol.value =
            "socio";

        editarCuentaActiva.disabled = false;
        editarRol.disabled = false;

        editarValidacion.value =
            new Date().getFullYear();


        /*
         * Cuenta web.
         *
         * Un usuario nuevo de Biblioteca
         * no recibe automáticamente
         * una cuenta de acceso web.
         */

        fichaCuentaWeb.textContent =
            "NO";


        /*
         * Abrir directamente en modo edición.
         */

        modalUsuario.classList.add(
            "nuevo-usuario"
        );

        fichaUsuario.classList.add(
            "modo-edicion"
        );

        modalUsuario.classList.add(
            "visible"
        );

        document.body.classList.add(
            "modal-abierto"
        );


        /*
         * Empezar por el número de socio.
         */

        editarNumeroSocio.focus();

    }
);


/* ==========================================================
   EDITAR USUARIO
   ========================================================== */

btnEditarUsuario.addEventListener(
    "click",
    function () {

        if (
            !modoNuevoUsuario &&
            !usuarioActual
        ) {
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

        /*
        * PROTECCIÓN DEL ADMINISTRADOR CONECTADO
        *
        * Si está editando su propia ficha:
        * - no puede deshabilitar su cuenta
        * - no puede quitarse el rol ADMIN
        */

        const esAdministradorActual =
            administradorActual &&
            usuarioActual.id ===
                administradorActual.id;

        editarCuentaActiva.disabled =
            esAdministradorActual;

        editarRol.disabled =
            esAdministradorActual;

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

        if (
            !modoNuevoUsuario &&
            !usuarioActual
        ) {
            return;
        }

        const numeroSocio =
            editarNumeroSocio.value
                .trim()
                .toUpperCase();

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
                editarObservaciones.value.trim() || null
                
        };


        /* ==================================================
           ALTA DE NUEVO USUARIO
           ================================================== */

        if (modoNuevoUsuario) {

            btnGuardarUsuario.disabled = true;

            btnGuardarUsuario.textContent =
                "Creando...";

            const {
                data,
                error
            } =
                await clienteSupabase
                    .from("usuarios")
                    .insert(cambios)
                    .select()
                    .single();

            btnGuardarUsuario.disabled = false;

            btnGuardarUsuario.textContent =
                "Crear usuario";


            if (error) {

                console.error(
                    "Error al crear usuario:",
                    error
                );


                if (
                    error.code === "23505"
                ) {

                    alert(
                        "Ya existe un usuario con ese número de socio."
                    );

                } else {

                    alert(
                        "No se ha podido crear el usuario."
                    );

                }

                return;
            }


            usuarios.push(data);


            usuarios.sort(
                function (a, b) {

                    return (
                        a.numero_socio || ""
                    ).localeCompare(
                        b.numero_socio || "",
                        "es",
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                }
            );

            mostrarUsuarios();


            alert(
                "El usuario se ha creado correctamente."
            );


            cerrarFichaUsuario();

            return;
        }

        /* ==================================================
           MODIFICACIÓN DE USUARIO EXISTENTE
           ================================================== */

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