
// Esperamos a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector('#grid-videojuegos');  //Seleccionamos el contenedor de grid
    const estadoCarga = document.querySelector('#estado-carga'); //Seleccionamos el contenedor de estado de carga
    const estadoError = document.querySelector('#estado-error'); //Seleccionamos el contenedor de estado de error
    const modalOverlay = document.querySelector('#modal-overlay'); // Modal overlay
    const modalClose = document.querySelector('#modal-close'); // Botón cerrar modal
    const modalContent = document.querySelector('#modal-content'); // Contenido del modal
    const modalBox = document.querySelector(".bg-white.rounded-xl"); // El contenedor blanco del modal

    // Variables para el arrastre del modal
    let isModalDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Datos de videojuegos de ejemplo si falla la carga desde la API
    const videoJuegosLocales = [
        {
            title: "Elden Ring",
            thumb: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r76.png",
            normalPrice: "--",
            salePrice: "--",
            savings: null,
            
        },
        {
            title: "God of War",
            thumb: "https://images.igdb.com/igdb/image/upload/t_cover_big/co6a5r.png",
            normalPrice: "--",
            salePrice: "--",
            savings: null,
        }
    ];

    function renderizarVideojuegos(lista) {
        grid.innerHTML = ""; // Limpiamos el contenido previo
        estadoCarga.classList.add('hidden'); // Ocultamos el estado de carga
        estadoError.classList.add('hidden'); // Ocultamos el estado de error

        lista.forEach((juego) => { // Iteramos sobre cada videojuego

            const titulo = juego.title || juego.external || "Título Desconocido"; // creamos la variable titulo
            const imagen = juego.thumb || juego.imagen || "";
            const normal = juego.normalPrice ?? "--"; // El operador nullish lo que hace es verificar si es nulo o indefinido y en ese caso asigna "--"
            const oferta = juego.salePrice ?? "--"; // El operador nullish lo que hace es verificar si es nulo o indefinido y en ese caso asigna "--"
            const ahorro = juego.savings ? Math.round(Number(juego.savings)) : null; // Primero convierte el valor a número, Si hay ahorro, lo redondeamos, si no, es null


            //Creamos el html de cada card
            const card = document.createElement("article");
            card.className = 
                "bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 flex flex-col hover:shadow-md transition-shadow";
            
            card.innerHTML = `
                <img src="${imagen}" alt="${titulo}" class="h-40 md:h-48 w-full object-cover" />
                <div class="p-4 flex flex-col gap-2 flex-1">
                    <h3 class="font-semibold text-slate-900 leading-tight line-clamp-2">${titulo}</h3>
                    <p class="text-xs text-slate-500 flex-1">
                        Precio: ${normal && normal !== "—" ? `<s class="text-red-600 font-semibold">$${normal}</s>` : "—"}
                        ${
                            oferta && oferta !== "—" 
                                ? ` · <span class="font-semibold text-slate-900">$${oferta}</span>` 
                                : ""
                        }
                        ${ahorro ? ` · Ahorro ${ahorro}%` : ""}
                    </p>
                    <button 
                        data-gameid="${juego.gameID}"
                        class="w-full bg-slate-900 text-white py-2 rounded-lg text-sm hover:bg-slate-800 mt-auto">
                        Ver detalle
                    </button>
                </div>
            `;

            // Agregamos la card al grid
            grid.appendChild(card);
            
        });

    }

    async function cargarVideojuegosInicial() { //Async significa que la función maneja operaciones asíncronas y puede usar await
        try{
            const url = "https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=21"; // URL de la API
            const resp = await fetch(url); // Hacemos la petición a la API y esperamos la respuesta
            const datos = await resp.json(); // Esperamos a que la respuesta se convierta a JSON

            window._juegosCache = datos; // // cache para reutilizar los datos sin hacer múltiples peticiones

            renderizarVideojuegos(datos); // Llamamos a la función para renderizar los videojuegos con los datos obtenidos
        } catch (e) {
            console.error("Error al cargar los videojuegos desde la API:", e);
            renderizarVideojuegos(videoJuegosLocales); // Si hay un error, renderizamos los videojuegos locales de ejemplo
        }
    }


    // Función para el botón de búsqueda
    async function buscarVideojuegos() {
        const texto = document.querySelector("#input-busqueda").value.trim();

        if (texto === "") {
            alert("Ingresa un nombre para buscar videojuegos.");
            return;
        }

        // Mostrar spinner
        estadoCarga.classList.remove("hidden");
        estadoError.classList.add("hidden");

        // Realizar búsqueda en la API
        try {
            const url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(texto)}&limit=20`;
            const resp = await fetch(url);
            const datos = await resp.json();

            if (datos.length === 0) {
                estadoCarga.classList.add("hidden");
                estadoError.textContent = "No se encontraron videojuegos.";
                estadoError.classList.remove("hidden");
                grid.innerHTML = "";
                return;
            }

            // Renderizar resultados
            renderizarVideojuegos(
                datos.map((juego) => ({
                    title: juego.external,
                    thumb: juego.thumb,
                    normalPrice: juego.cheapest, // CheapShark devuelve "cheapest"
                    salePrice: juego.cheapest,   // No hay oferta aquí
                    savings: null,
                    gameID: juego.gameID,   // Agregado para consistencia
                }))
            );
        } catch (e) {
            console.error("Error al buscar videojuegos:", e);
            estadoCarga.classList.add("hidden");
            estadoError.textContent = "Error al buscar videojuegos.";
            estadoError.classList.remove("hidden");
        }
    }

    // Función para iniciar el arrastre
    function startDragging(e) {
        if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return; // No arrastrar si es un botón o link
        isModalDragging = true;
        const rect = modalBox.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        modalBox.style.cursor = "grabbing";
    }

    // Función para mover el modal mientras se arrastra
    function dragModal(e) {
        if (!isModalDragging) return;
        
        const x = e.clientX - dragOffsetX;
        const y = e.clientY - dragOffsetY;
        
        modalBox.style.position = "fixed";
        modalBox.style.left = x + "px";
        modalBox.style.top = y + "px";
        modalBox.style.transform = "none"; // Remover el transform para posicionamiento libre
    }

    // Función para detener el arrastre
    function stopDragging() {
        isModalDragging = false;
        modalBox.style.cursor = "grab";
    }

    // Evento para los botones de "Ver detalle" usando delegación de eventos
    grid.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON" && e.target.dataset.gameid) {
            mostrarDetalleJuego(e.target.dataset.gameid);
        }
    });

    // Eventos para cerrar el modal
    modalClose.addEventListener("click", () => {
        modalOverlay.classList.add("hidden");
        isModalDragging = false; // Resetear arrastre al cerrar
    });

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add("hidden");
            isModalDragging = false; // Resetear arrastre al cerrar
        }
    });

    // Eventos de arrastrar el modal
    modalBox.addEventListener("mousedown", startDragging);
    document.addEventListener("mousemove", dragModal);
    document.addEventListener("mouseup", stopDragging);

    // Función para mostrar el detalle de un videojuego
    async function mostrarDetalleJuego(gameID) {
        modalOverlay.classList.remove("hidden");
        
        // Resetear posición al centro
        modalBox.style.position = "absolute";
        modalBox.style.left = "50%";
        modalBox.style.top = "50%";
        modalBox.style.transform = "translate(-50%, -50%)";
        modalBox.style.cursor = "grab";
        
        modalContent.innerHTML = `
            <p class="text-center text-slate-600 text-sm">Cargando detalles...</p>
        `;

        try {
            const url = `https://www.cheapshark.com/api/1.0/games?id=${gameID}`;
            const resp = await fetch(url);
            const data = await resp.json();

            const info = data.info;
            const deals = data.deals || [];
            const cheapest = data.cheapestPriceEver;

            modalContent.innerHTML = `
                <h2 class="text-xl font-bold text-slate-900 mb-3">
                    ${info.title}
                </h2>

                <img src="${info.thumb}" class="w-full rounded-xl mb-4" />

                <p class="text-sm text-slate-700 mb-2">
                    <strong>Precio más barato histórico:</strong> $${cheapest.price}
                </p>

                <h3 class="font-semibold text-slate-800 mt-4 mb-2">Ofertas disponibles</h3>
                <div class="flex flex-col gap-2">
                    ${
                        deals
                            .map((d) => `
                                <div class="border p-3 rounded-lg shadow-sm flex flex-col gap-1">
                                    <p class="text-sm">
                                        <strong>Precio:</strong> $${d.price}
                                        <span class="text-xs text-slate-500">
                                            (Antes $${d.retailPrice})
                                        </span>
                                    </p>
                                    <p class="text-sm text-green-600">
                                        Ahorro: ${Math.round(d.savings)}%
                                    </p>
                                    <a
                                        target="_blank"
                                        href="https://www.cheapshark.com/redirect?dealID=${d.dealID}"
                                        class="text-center bg-slate-900 text-white py-1 rounded-md text-sm hover:bg-slate-800">
                                        Ir a la tienda
                                    </a>
                                </div>
                            `)
                            .join("")
                    }
                </div>
            `;
        } catch (err) {
            console.error(err);
            modalContent.innerHTML = `
                <p class="text-center text-red-600">Error al cargar los detalles.</p>
            `;
        }
    }


    // Llamamos a la función para renderizar los videojuegos al cargar la página
    cargarVideojuegosInicial();

    // Eventos para el botón de búsqueda y la tecla Enter
    document.querySelector("#btn-buscar")
            .addEventListener("click", buscarVideojuegos);
    // Evento para tecla Enter en el input de búsqueda
    document.querySelector("#input-busqueda")
            .addEventListener("keypress", (e) => {
                if (e.key === "Enter") buscarVideojuegos();
            });
    // Evento para detectar cuando el input de búsqueda está vacío
    document.querySelector("#input-busqueda")
            .addEventListener("input", (e) => {
                if (e.target.value.trim() === "") {
                    // Si está vacío, mostramos los juegos iniciales
                    renderizarVideojuegos(window._juegosCache);
                }
            });
});
