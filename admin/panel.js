/* ==========================================================
   CONEXIÓN CON SUPABASE
   ========================================================== */

const SUPABASE_URL =
    "https://ffxnsvetxaikdpolvjym.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_nVJbKuJztCNImhywm7OS8Q_KA064589";

const clienteSupabase = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ==========================================================
   ELEMENTOS
   ========================================================== */

const nombreAdmin =
    document.getElementById("nombre-admin");

const saludoAdmin =
    document.getElementById("saludo-admin");

const btnCerrarSesion =
    document.getElementById("btn-cerrar-sesion");


/* ==========================================================
   COMPROBAR ACCESO
   ========================================================== */

async function comprobarAcceso() {

    try {

        const {
            data: datosUsuario,
            error: errorUsuario
        } =
            await clienteSupabase.auth.getUser();


        if (
            errorUsuario ||
            !datosUsuario.user
        ) {

            window.location.href =
                "index.html";

            return;
        }


        const uid =
            datosUsuario.user.id;


        const {
            data: perfil,
            error: errorPerfil
        } =
            await clienteSupabase
                .from("usuarios")
                .select(`
                    id,
                    auth_user_id,
                    nombre,
                    apellidos,
                    rol,
                    activo
                `)
                .eq("auth_user_id", uid)
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

            return;
        }


        nombreAdmin.textContent =
            perfil.nombre +
            (perfil.apellidos
                ? " " + perfil.apellidos
                : "");


        saludoAdmin.textContent =
            "Bienvenido, " +
            perfil.nombre;


    } catch (error) {

        console.error(
            "Error comprobando acceso:",
            error
        );

        await clienteSupabase.auth.signOut();

        window.location.href =
            "index.html";
    }
}


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
   INICIAR
   ========================================================== */

comprobarAcceso();