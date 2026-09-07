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
   ELEMENTOS DEL FORMULARIO
   ========================================================== */

const formulario =
    document.getElementById("form-cambiar-password");

const txtNuevaPassword =
    document.getElementById("nueva-password");

const txtRepetirPassword =
    document.getElementById("repetir-password");

const mensaje =
    document.getElementById("mensaje-password");


/* ==========================================================
   ESTADO DE RECUPERACIÓN
   ========================================================== */

let recuperacionValida = false;


/* ==========================================================
   MOSTRAR MENSAJES
   ========================================================== */

function mostrarMensaje(texto, tipo = "") {

    mensaje.textContent = texto;

    mensaje.className = "mensaje-login";

    if (tipo === "error") {
        mensaje.classList.add("mensaje-error");
    }

    if (tipo === "correcto") {
        mensaje.classList.add("mensaje-correcto");
    }
}


/* ==========================================================
   DETECTAR ENLACE DE RECUPERACIÓN
   ========================================================== */

clienteSupabase.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Evento de autenticación:",
            event
        );

        if (
            event === "PASSWORD_RECOVERY" &&
            session
        ) {

            recuperacionValida = true;

            mostrarMensaje(
                "Enlace verificado. Puedes establecer una nueva contraseña.",
                "correcto"
            );
        }
    }
);


/* ==========================================================
   COMPROBAR SI YA EXISTE SESIÓN
   ========================================================== */

async function comprobarSesion() {

    const {
        data,
        error
    } =
        await clienteSupabase.auth.getSession();

    if (error) {

        console.error(
            "Error comprobando la sesión:",
            error
        );

        mostrarMensaje(
            "No se ha podido verificar el enlace de recuperación.",
            "error"
        );

        return;
    }

    if (data.session) {

        recuperacionValida = true;
    }
}

comprobarSesion();


/* ==========================================================
   CAMBIAR CONTRASEÑA
   ========================================================== */

formulario.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        mostrarMensaje("");

        const nuevaPassword =
            txtNuevaPassword.value;

        const repetirPassword =
            txtRepetirPassword.value;


        /* --------------------------------------------------
           COMPROBACIONES
           -------------------------------------------------- */

        if (!recuperacionValida) {

            mostrarMensaje(
                "El enlace de recuperación no es válido o ha caducado.",
                "error"
            );

            return;
        }


        if (nuevaPassword.length < 8) {

            mostrarMensaje(
                "La contraseña debe tener al menos 8 caracteres.",
                "error"
            );

            return;
        }


        if (nuevaPassword !== repetirPassword) {

            mostrarMensaje(
                "Las contraseñas no coinciden.",
                "error"
            );

            return;
        }


        try {

            const {
                data,
                error
            } =
                await clienteSupabase.auth
                    .updateUser({
                        password: nuevaPassword
                    });

            if (error) {
                throw error;
            }


            mostrarMensaje(
                "Contraseña actualizada correctamente.",
                "correcto"
            );


            txtNuevaPassword.value = "";
            txtRepetirPassword.value = "";


            /* --------------------------------------------------
               CERRAR SESIÓN DE RECUPERACIÓN
               -------------------------------------------------- */

            await clienteSupabase.auth.signOut();


            /* --------------------------------------------------
               VOLVER AL LOGIN
               -------------------------------------------------- */

            setTimeout(
                function () {

                    window.location.href =
                        "index.html";
                },
                2000
            );


        } catch (error) {

            console.error(
                "Error cambiando contraseña:",
                error
            );

            mostrarMensaje(
                "No se ha podido cambiar la contraseña. Solicita un nuevo enlace de recuperación.",
                "error"
            );
        }
    }
);