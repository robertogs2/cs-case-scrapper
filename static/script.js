const chartContainer = document.getElementById('chart-container');
// console.log("Registered Plugins:", Chart.registry.plugins.items);
// console.log("Zoom Plugin Test:", Chart.registry.plugins.get('zoom'));

// Function to fetch and parse CSV
async function fetchCSVData(filename) {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
        console.error(`Failed to fetch ${filename}: ${response.statusText}`);
        return [];
    }
    const text = await response.text();

    const lines = text.trim().split('\n');
    const header = lines.shift(); // Remove header if present

    const data = lines.map(line => {
        // Assuming line: datetime,volume,priceHigh,priceLow
        const [datetime, volume, priceHigh, priceLow] = line.split(',');
        return {
            time: new Date(datetime),
            volume: parseInt(volume, 10),
            priceHigh: parseFloat(priceHigh.replace('$', '')),
            priceLow: parseFloat(priceLow.replace('$', '')),
        };
    });

    return data;
}

function createChartBox(title, link) {
    const box = document.createElement('div');
    box.className = 'chart-box';

    // Create a clickable title
    const heading = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = link; // Set the URL from the provided link
    titleLink.textContent = title; // Set the title text
    titleLink.style.color = 'inherit'; // Optional: inherit text color
    heading.appendChild(titleLink);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'tab-buttons'; // Use new tab style

    // Create buttons for zoom ranges
    const zoomButtons = [
        { label: '1 Day', range: 1 * 24 * 60 * 60 * 1000 },
        { label: '1 Week', range: 7 * 24 * 60 * 60 * 1000 },
        { label: '1 Month', range: 30 * 24 * 60 * 60 * 1000 },
        { label: '1 Year', range: 365 * 24 * 60 * 60 * 1000 },
    ];

    zoomButtons.forEach(({ label, range }) => {
        const zoomButton = document.createElement('button');
        zoomButton.textContent = label;
        zoomButton.className = 'zoom-button'; // Add a class for styling
        zoomButton.addEventListener('click', () => {
            if (canvas.chartInstance) {
                const chart = canvas.chartInstance;
                const data = chart.data.labels.map(label => new Date(label));
                const maxTime = Math.max(...data);
                const minTime = maxTime - range;
                chart.options.scales.x.min = minTime;
                chart.options.scales.x.max = maxTime;
                chart.update('none'); // Update without animation
            }

            // Mark the button as active
            document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));
            zoomButton.classList.add('active');
        });

        buttonContainer.appendChild(zoomButton);
    });

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Zoom';
    resetButton.className = 'zoom-button';
    resetButton.addEventListener('click', () => {
        if (canvas.chartInstance) {
            canvas.chartInstance.resetZoom();
        }

        // Remove active state from all buttons
        document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));
    });
    buttonContainer.appendChild(resetButton);

    const canvas = document.createElement('canvas');
    canvas.style.height = '300px'; // Set a fixed height for better layout control

    box.appendChild(buttonContainer); // Add buttons above the chart
    box.appendChild(heading);
    box.appendChild(canvas);

    chartContainer.appendChild(box);

    return canvas;
}

function createChart(canvas, data) {
    const ctx = canvas.getContext('2d');

    // Create the gradient for the volume dataset
    const chartArea = canvas.getBoundingClientRect();
    const gradient = ctx.createLinearGradient(0, 0, 0, chartArea.height || 300);
    gradient.addColorStop(0, 'rgba(30, 30, 30, 0.95)'); // Much darker gray at the top
    gradient.addColorStop(0.5, 'rgba(128, 128, 128, 0.5)'); // Medium gray in the middle
    gradient.addColorStop(1, 'rgba(240, 240, 240, 0.2)'); // Lighter gray at the bottom

    const labels = data.map(d => d.time);
    const highPrices = data.map(d => d.priceHigh);
    const lowPrices = data.map(d => d.priceLow);
    const volumes = data.map(d => d.volume);

    const chart = new Chart(canvas, {
        type: 'line', // Base type
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sell Price',
                    data: highPrices,
                    borderColor: 'rgba(40, 167, 69, 1)', // Muted green
                    backgroundColor: 'rgba(40, 167, 69, 0.1)', // Subtle transparent green
                    fill: false,
                    pointRadius: 0,
                    pointBackgroundColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2,
                    tension: 0.5,
                    yAxisID: 'y',
                },
                // {
                //     label: 'Buy Price',
                //     data: lowPrices,
                //     borderColor: 'rgba(108, 117, 125, 1)', // Neutral gray
                //     backgroundColor: 'rgba(108, 117, 125, 0.1)', // Subtle transparent gray
                //     fill: false,
                //     pointRadius: 0,
                //     pointBackgroundColor: 'rgba(108, 117, 125, 1)',
                //     borderWidth: 2,
                //     tension: 0.2,
                //     yAxisID: 'y',
                // },
                {
                    label: 'Volume',
                    data: volumes,
                    type: 'line', // Change from bar to line
                    backgroundColor: gradient, // Apply gradient as fill
                    borderColor: 'rgba(128, 128, 128, 0.8)', // Darker gray for the line
                    borderWidth: 2, // Slightly thicker line for visibility
                    fill: true, // Enable area filling under the line
                    tension: 0.65, // Add smooth, spline-like curves to the line
                    pointRadius: 0, // Remove data point circles
                    pointHitRadius: 10, // Expand hit area for tooltips
                    yAxisID: 'y1', // Still map to the secondary Y-axis
                },
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'DD/MM/yyyy HH:mm:ss', // Tooltip format remains constant
                        displayFormats: {
                            hour: 'HH:mm', // Display hours and minutes for hourly zoom levels
                            day: 'DD/MM/yyyy', // Display full date for daily zoom levels
                        },
                    },
                    title: {
                        display: true,
                        text: 'Time (UTC)', // Title for the X-axis
                    },
                    ticks: {
                        autoSkip: true, // Disable automatic skipping
                        maxTicksLimit: 5, // Limit the number of labels shown
                        minRotation: 0, // Force no rotation
                        maxRotation: 0 // Force no rotation
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    },
                    beginAtZero: true,
                    max: Math.max(...highPrices) * 1.1, // Adjust volume axis to 1/3 of chart height
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: {
                        drawOnChartArea: false // Prevent grid lines from y1 overlapping y
                    },
                    title: {
                        display: true,
                        text: 'Volume'
                    },
                    beginAtZero: true,
                    max: Math.max(...volumes) * 2, // Adjust volume axis to 1/3 of chart height
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            const rawValue = tooltipItems[0].parsed.x; // Access the X value (timestamp)
                            const date = new Date(rawValue); // Convert to Date object
                            return new Intl.DateTimeFormat('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            }).format(date); // Return full timestamp in "dd/MM/yyyy HH:mm:ss" format
                        },
                    },
                },
                zoom: {
                    pan: {
                        enabled: true, // Enable panning
                        mode: 'x', // Allow panning in both X and Y directions
                        threshold: 10, // Minimal movement in pixels to start panning
                        onPan: function ({ chart }) {
                            console.log(`I'm panning!!!`);
                        },
                        onPanComplete: function ({ chart }) {
                            console.log(`I was panned!!!`);
                        }
                    },
                    zoom: {
                        wheel: {
                            enabled: true,  // Enable zooming with mouse wheel
                        },
                        pinch: {
                            enabled: true,  // Enable pinch-to-zoom on touch devices
                        },
                        speed: 0.1,        // Set zoom speed (lower is slower)
                        threshold: 2,      // Minimum zoom distance
                        mode: 'x',         // Allow zooming only on the X-axis
                        onZoom: function ({ chart }) {
                            console.log(`Zooming!!!`);
                            const min = chart.scales.x.min; // Current min of the X-axis
                            const max = chart.scales.x.max; // Current max of the X-axis
                            const range = max - min; // Range in milliseconds

                            // Dynamically adjust time unit and ticks based on the zoom range
                            if (range <= 3 * 3600 * 1000) { // Less than 3 hours
                                chart.options.scales.x.time.unit = 'minute';
                                chart.options.scales.x.ticks.maxTicksLimit = 10; // Show 10 labels
                            } else if (range <= 72 * 3600 * 1000) { // Less than 3 days
                                chart.options.scales.x.time.unit = 'hour';
                                chart.options.scales.x.ticks.maxTicksLimit = 6; // Show 6 labels
                            } else {
                                chart.options.scales.x.time.unit = 'day';
                                chart.options.scales.x.ticks.maxTicksLimit = 5; // Show 5 labels
                            }

                            chart.update('none'); // Update the chart without animation
                        },
                        onZoomComplete: function ({ chart }) {
                            console.log(`I was zoomed!!!`);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });

    // Attach the chart instance to the canvas for later access (e.g., reset zoom)
    canvas.chartInstance = chart;
}

(async function init() {
    for (const [index, file] of csvFiles.entries()) {
        const data = await fetchCSVData(file);
        if (data.length === 0) {
            // Skip creating a chart if data fetching failed
            continue;
        }
        const title = itemNames[index];
        const link = itemLinks[index]
        const canvas = createChartBox(title, link);
        createChart(canvas, data);
    }
})();
