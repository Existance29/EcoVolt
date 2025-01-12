class Forecast{
    //get a company by their email domain
    static holtLinear(ts, forecastPeriods, alpha = 0.8, beta = 0.2) {
        let L = ts[0]
        let T = ts[1] - ts[0]
        let out = []
      
        // Perform exponential smoothing
        for (let t = 1; t < ts.length; t++) {
            const prevL = L
            L = alpha*ts[t] + (1-alpha) * (L+T)
            T = beta * (L - prevL) + (1-beta)*T
        }
    
        for (let h = 1; h <= forecastPeriods; h++) {
            out.push(Math.max(0, L + h * T))
        }
        return out
    }
}

module.exports = Forecast
  