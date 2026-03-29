
const apiURL = "https://mindicador.cl/api";
let myChart = null;

const inputMonto = document.getElementById('monto-clp');
const selectMoneda = document.getElementById('moneda-destino');
const btnBuscar = document.getElementById('btn-buscar');
const divResultado = document.getElementById('resultado');
const contenedorGrafico = document.getElementById('contenedor-grafico');

async function getMonedas(moneda) {
    try {
        const res = await fetch(`${apiURL}/${moneda}`);
        if (!res.ok) throw new Error("Error al conectar con la API");
        const data = await res.json();
        return data;
    } catch (error) {
        divResultado.innerHTML = `<span class="text-red-500">Error: ${error.message}</span>`;
        console.error(error);
        return null;
    }
}

function calcularConversion(monto, valorMoneda) {
    return (monto / valorMoneda).toFixed(2);
}

function prepararConfiguracionParaLaGrafica(monedaData) {
    // Tomamos los últimos 10 días
    const ultimosDiez = monedaData.serie.slice(0, 10).reverse();
    
    const labels = ultimosDiez.map(item => {
        const fecha = new Date(item.fecha);
        return fecha.toLocaleDateString();
    });
    
    const data = ultimosDiez.map(item => item.valor);

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Historial últimos 10 días (${monedaData.nombre})`,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                data: data,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    };
}

async function renderGrafica(monedaData) {
    const config = prepararConfiguracionParaLaGrafica(monedaData);
    const chartDOM = document.getElementById("historialChart");
    
    // Si ya existe un gráfico, lo destruimos para crear uno nuevo
    if (myChart) {
        myChart.destroy();
    }
    
    contenedorGrafico.classList.remove('hidden');
    myChart = new Chart(chartDOM, config);
}

btnBuscar.addEventListener('click', async () => {
    const monto = parseFloat(inputMonto.value);
    const moneda = selectMoneda.value;

    if (!monto || monto <= 0) {
        divResultado.innerHTML = '<span class="text-yellow-400">Ingrese un monto válido</span>';
        return;
    }

    if (!moneda) {
        divResultado.innerHTML = '<span class="text-yellow-400">Seleccione una moneda</span>';
        return;
    }

    divResultado.innerHTML = "Cargando...";
    
    const data = await getMonedas(moneda);
    
    if (data) {
        const valorActual = data.serie[0].valor;
        const resultadoFinal = calcularConversion(monto, valorActual);
        
        divResultado.innerHTML = `Resultado: $${resultadoFinal}`;
        
        // Renderizar gráfica
        renderGrafica(data);
    }
});
