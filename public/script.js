
const grid = document.querySelector('#grid-videojuegos');  //Seleccionamos el contenedor de grid
const estadoCarga = document.querySelector('#estado-carga'); //Seleccionamos el contenedor de estado de carga
const estadoError = document.querySelector('#estado-error'); //Seleccionamos el contenedor de estado de error

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
            "bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 flex flex-col";
        
        card.innerHTML = `
            <img src="${imagen}" alt="${titulo}" class="h-40 w-full object-cover" />
            <div class="p-4 flex flex-col gap-2 flex-1">
                <h3 class="font-semibold text-slate-900 leading-tight">${titulo}</h3>
                <p class="text-xs text-slate-500">
                    Precio: ${normal && normal !== "—" ? `<s class="text-red-600 font-semibold">$${normal}</s>` : "—"}
                    ${
                        oferta && oferta !== "—" 
                            ? ` · <span class="font-semibold text-slate-900">$${oferta}</span>` 
                            : ""
                    }
                    ${ahorro ? ` · Ahorro ${ahorro}%` : ""}
                </p>
                <button class="mt-2 w-full bg-slate-900 text-white py-2 rounded-lg text-sm hover:bg-slate-800">
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
// Llamamos a la función para renderizar los videojuegos al cargar la página
cargarVideojuegosInicial();
