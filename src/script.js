const apiURL = "https://mindicador.cl/api";
let myChart = null;

const inputMonto = document.getElementById('monto-clp');
const selectMoneda = document.getElementById('moneda-destino');
const btnBuscar = document.getElementById('btn-buscar');
const resultadoContainer = document.getElementById('resultado-container');
const divResultado = document.getElementById('resultado');
const contenedorGrafico = document.getElementById('contenedor-grafico');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');

// Formatea el dinero de forma bonita
function formatCurrency(amount, currencyCode) {
    const isCLP = currencyCode === 'clp';
    return new Intl.NumberFormat(isCLP ? 'es-CL' : 'en-US', {
        style: 'currency',
        currency: isCLP ? 'CLP' : 'USD',
        minimumFractionDigits: isCLP ? 0 : 2,
        maximumFractionDigits: isCLP ? 0 : 2
    }).format(amount).replace("US$", "$");
}

function showError(msg) {
    errorText.textContent = msg;
    errorContainer.classList.remove('opacity-0', 'h-0');
    errorContainer.classList.add('opacity-100', 'h-auto', 'mb-2');
    
    // Hide results
    resultadoContainer.classList.remove('opacity-100', 'max-h-40');
    resultadoContainer.classList.add('opacity-0', 'max-h-0');
    contenedorGrafico.classList.remove('opacity-100', 'max-h-80');
    contenedorGrafico.classList.add('opacity-0', 'max-h-0');
}

function hideError() {
    errorContainer.classList.add('opacity-0', 'h-0');
    errorContainer.classList.remove('opacity-100', 'h-auto', 'mb-2');
}

async function getMonedas(moneda) {
    try {
        const res = await fetch(`${apiURL}/${moneda}`);
        if (!res.ok) throw new Error("No pudimos conectar con la base de datos.");
        const data = await res.json();
        return data;
    } catch (error) {
        showError(error.message);
        return null;
    }
}

function calcularConversion(monto, valorMoneda) {
    return (monto / valorMoneda);
}

function prepararConfiguracionParaLaGrafica(monedaData) {
    const ultimosDiez = monedaData.serie.slice(0, 10).reverse();
    
    const labels = ultimosDiez.map(item => {
        const fecha = new Date(item.fecha);
        return fecha.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
    });
    
    const data = ultimosDiez.map(item => item.valor);

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Valor ${monedaData.nombre} (Últ. 10 días)`,
                borderColor: '#06b6d4', // Cyan 500
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#06b6d4',
                pointHoverBackgroundColor: '#06b6d4',
                pointHoverBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                data: data,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#cbd5e1', font: { family: 'Inter', size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y, 'usd');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(51, 65, 85, 0.3)', drawBorder: false },
                    ticks: { 
                        color: '#94a3b8', 
                        font: { family: 'Inter', size: 11 },
                        callback: function(value) { return '$' + value; }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    };
}

async function renderGrafica(monedaData) {
    const config = prepararConfiguracionParaLaGrafica(monedaData);
    const chartDOM = document.getElementById("historialChart");
    
    if (myChart) {
        myChart.destroy();
    }
    
    // Show chart with animation
    contenedorGrafico.classList.remove('opacity-0', 'max-h-0');
    contenedorGrafico.classList.add('opacity-100', 'max-h-96');
    
    // Slight delay to allow CSS transitions to calculate dimensions
    setTimeout(() => {
        myChart = new Chart(chartDOM, config);
    }, 100);
}

btnBuscar.addEventListener('click', async () => {
    hideError();
    const monto = parseFloat(inputMonto.value);
    const moneda = selectMoneda.value;

    if (!monto || monto <= 0) {
        showError('Por favor ingresa un monto válido mayor a 0.');
        return;
    }

    if (!moneda) {
        showError('Debes seleccionar una moneda de destino.');
        return;
    }

    // Boton loading state
    const originalBtnContent = btnBuscar.innerHTML;
    btnBuscar.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Convirtiendo...`;
    btnBuscar.disabled = true;
    btnBuscar.classList.add('opacity-80', 'cursor-not-allowed');

    const data = await getMonedas(moneda);
    
    // Restore button
    btnBuscar.innerHTML = originalBtnContent;
    btnBuscar.disabled = false;
    btnBuscar.classList.remove('opacity-80', 'cursor-not-allowed');

    if (data) {
        const valorActual = data.serie[0].valor;
        const resultadoFinal = calcularConversion(monto, valorActual);
        
        // Show result with animation
        divResultado.textContent = formatCurrency(resultadoFinal, 'usd');
        resultadoContainer.classList.remove('opacity-0', 'max-h-0');
        resultadoContainer.classList.add('opacity-100', 'max-h-40');
        
        renderGrafica(data);
    }
});

// Simple animation on input interaction
inputMonto.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        btnBuscar.click();
    }
});
