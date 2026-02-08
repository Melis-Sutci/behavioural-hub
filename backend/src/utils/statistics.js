/**
 * Statistical Analysis Library
 *
 * Provides statistical methods for:
 * - Hypothesis testing
 * - Bayesian A/B testing
 * - Time series analysis
 * - Anomaly detection
 */

const ss = require('simple-statistics');
const jstat = require('jstat');

class StatisticalAnalyzer {

  /**
   * Chi-square test for independence
   * Tests if two categorical variables are independent
   */
  chiSquareTest(observed, expected) {
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }

    const degreesOfFreedom = observed.length - 1;
    const pValue = 1 - jstat.chisquare.cdf(chiSquare, degreesOfFreedom);

    return {
      chiSquare,
      degreesOfFreedom,
      pValue,
      significant: pValue < 0.05
    };
  }

  /**
   * Two-sample t-test
   * Tests if two samples have significantly different means
   */
  tTest(sample1, sample2) {
    const mean1 = ss.mean(sample1);
    const mean2 = ss.mean(sample2);
    const std1 = ss.standardDeviation(sample1);
    const std2 = ss.standardDeviation(sample2);
    const n1 = sample1.length;
    const n2 = sample2.length;

    // Calculate t-statistic
    const pooledStd = Math.sqrt(
      ((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2)
    );
    const tStat = (mean1 - mean2) / (pooledStd * Math.sqrt(1/n1 + 1/n2));

    const degreesOfFreedom = n1 + n2 - 2;
    const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(tStat), degreesOfFreedom));

    return {
      mean1,
      mean2,
      difference: mean1 - mean2,
      tStatistic: tStat,
      degreesOfFreedom,
      pValue,
      significant: pValue < 0.05
    };
  }

  /**
   * Bayesian A/B test
   * Uses Beta distribution for conversion rates
   * Returns probability that variant B beats control A
   */
  bayesianABTest(controlData, variantData, simulations = 10000) {
    // controlData/variantData: { conversions, visitors }

    // Beta distribution parameters (using uniform prior)
    const alphaA = controlData.conversions + 1;
    const betaA = controlData.visitors - controlData.conversions + 1;
    const alphaB = variantData.conversions + 1;
    const betaB = variantData.visitors - variantData.conversions + 1;

    // Monte Carlo simulation
    let bWins = 0;
    let totalLoss = 0;

    for (let i = 0; i < simulations; i++) {
      const sampleA = jstat.beta.sample(alphaA, betaA);
      const sampleB = jstat.beta.sample(alphaB, betaB);

      if (sampleB > sampleA) {
        bWins++;
      } else {
        totalLoss += (sampleA - sampleB);
      }
    }

    const probabilityBWins = bWins / simulations;
    const expectedLoss = totalLoss / simulations;

    return {
      probabilityBWins,
      expectedLoss,
      probabilityOfNoEffect: this.calculateNoEffectProbability(alphaA, betaA, alphaB, betaB),
      credibleInterval: this.getCredibleInterval(alphaB, betaB),
      recommendation: this.getBayesianRecommendation(probabilityBWins, expectedLoss)
    };
  }

  /**
   * Calculate probability of no effect (variants are essentially equal)
   */
  calculateNoEffectProbability(alphaA, betaA, alphaB, betaB, threshold = 0.01) {
    const meanA = alphaA / (alphaA + betaA);
    const meanB = alphaB / (alphaB + betaB);
    const diff = Math.abs(meanB - meanA);

    // If difference is very small, likely no effect
    if (diff < threshold) {
      return 0.9;
    } else if (diff < threshold * 2) {
      return 0.5;
    } else {
      return 0.1;
    }
  }

  /**
   * Get 95% credible interval for conversion rate
   */
  getCredibleInterval(alpha, beta, confidence = 0.95) {
    const lower = jstat.beta.inv((1 - confidence) / 2, alpha, beta);
    const upper = jstat.beta.inv(1 - (1 - confidence) / 2, alpha, beta);
    return { lower, upper };
  }

  /**
   * Get recommendation from Bayesian test
   */
  getBayesianRecommendation(probabilityBWins, expectedLoss) {
    if (probabilityBWins > 0.95 && expectedLoss < 0.01) {
      return {
        action: 'deploy_variant',
        confidence: 'high',
        message: 'Strong evidence variant is better. Deploy with confidence.'
      };
    } else if (probabilityBWins > 0.90) {
      return {
        action: 'deploy_variant',
        confidence: 'medium',
        message: 'Good evidence variant is better. Consider deploying.'
      };
    } else if (probabilityBWins < 0.10) {
      return {
        action: 'stop_test',
        confidence: 'high',
        message: 'Strong evidence variant is worse. Stop test.'
      };
    } else if (Math.abs(probabilityBWins - 0.5) < 0.1) {
      return {
        action: 'continue_test',
        confidence: 'low',
        message: 'No clear winner yet. Continue test for more data.'
      };
    } else {
      return {
        action: 'continue_test',
        confidence: 'medium',
        message: 'Trending but not conclusive. Continue test.'
      };
    }
  }

  /**
   * Detect trend in time series
   * Returns: 'increasing', 'decreasing', 'stable'
   */
  detectTrend(timeSeries) {
    if (timeSeries.length < 3) {
      return { trend: 'unknown', slope: 0, confidence: 0 };
    }

    // Linear regression
    const x = timeSeries.map((_, i) => i);
    const y = timeSeries;

    const n = x.length;
    const sumX = ss.sum(x);
    const sumY = ss.sum(y);
    const sumXY = ss.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = ss.sum(x.map(xi => xi * xi));

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = ss.mean(y);
    const ssTotal = ss.sum(y.map(yi => Math.pow(yi - yMean, 2)));
    const ssResidual = ss.sum(y.map((yi, i) => Math.pow(yi - (slope * x[i] + intercept), 2)));
    const rSquared = 1 - (ssResidual / ssTotal);

    let trend = 'stable';
    if (Math.abs(slope) > 0.01) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      trend,
      slope,
      intercept,
      rSquared,
      confidence: rSquared
    };
  }

  /**
   * Detect anomalies using Z-score method
   */
  detectAnomalies(data, threshold = 3) {
    const mean = ss.mean(data);
    const std = ss.standardDeviation(data);

    const anomalies = [];
    data.forEach((value, index) => {
      const zScore = (value - mean) / std;
      if (Math.abs(zScore) > threshold) {
        anomalies.push({
          index,
          value,
          zScore,
          type: zScore > 0 ? 'spike' : 'drop'
        });
      }
    });

    return {
      anomalies,
      mean,
      standardDeviation: std,
      threshold
    };
  }

  /**
   * Calculate moving average
   */
  movingAverage(data, window = 7) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const windowData = data.slice(start, i + 1);
      result.push(ss.mean(windowData));
    }
    return result;
  }

  /**
   * Calculate correlation coefficient between two variables
   */
  correlation(x, y) {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

    const meanX = ss.mean(x);
    const meanY = ss.mean(y);
    const stdX = ss.standardDeviation(x);
    const stdY = ss.standardDeviation(y);

    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      sum += ((x[i] - meanX) / stdX) * ((y[i] - meanY) / stdY);
    }

    return sum / (x.length - 1);
  }

  /**
   * Calculate sample size needed for A/B test
   */
  calculateSampleSize(baselineConversion, minimumDetectableEffect, alpha = 0.05, power = 0.8) {
    // baselineConversion: current conversion rate (e.g., 0.05 for 5%)
    // minimumDetectableEffect: minimum relative lift we want to detect (e.g., 0.1 for 10% improvement)
    // alpha: significance level (default 0.05)
    // power: statistical power (default 0.8)

    const p1 = baselineConversion;
    const p2 = baselineConversion * (1 + minimumDetectableEffect);

    const zAlpha = jstat.normal.inv(1 - alpha / 2, 0, 1);
    const zBeta = jstat.normal.inv(power, 0, 1);

    const numerator = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  /**
   * Calculate confidence interval for proportion
   */
  proportionConfidenceInterval(successes, trials, confidence = 0.95) {
    const p = successes / trials;
    const z = jstat.normal.inv(1 - (1 - confidence) / 2, 0, 1);
    const margin = z * Math.sqrt((p * (1 - p)) / trials);

    return {
      estimate: p,
      lower: Math.max(0, p - margin),
      upper: Math.min(1, p + margin),
      confidence
    };
  }
}

module.exports = StatisticalAnalyzer;
