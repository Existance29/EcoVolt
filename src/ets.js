function holtLinearTrend(ts, alpha, beta, forecastPeriods) {
    let L = ts[0]
    let T = ts[1] - ts[0]
    let forecast = []
  
    // Perform exponential smoothing
    for (let t = 1; t < ts.length; t++) {
        const prevL = L
        L = alpha*ts[t] + (1-alpha) * (L+T)
        T = beta * (L - prevL) + (1-beta)*T
    }

    for (let h = 1; h <= forecastPeriods; h++) {
        forecast.push(L + h * T)
    }
  
    return forecast;
  }
  
// Example data (time series)
const ts = [4000, 3800, 3500]

const alpha = 0.8
const beta = 0.2

// Forecast next 5 periods
const forecastPeriods = 5;
const forecast = holtLinearTrend(ts, alpha, beta, forecastPeriods);

console.log("Forecasted values:", forecast);
  