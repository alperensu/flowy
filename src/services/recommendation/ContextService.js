/**
 * ContextService.js
 * Handles detection of user context including time of day, weather (mocked), and activity type.
 */

class ContextService {
    constructor() {
        this.weatherTypes = ['Sunny', 'Rainy', 'Cloudy', 'Snowy', 'Clear'];
    }

    /**
     * Returns the current context object.
     * @returns {Object} { timeOfDay, weather, activityType }
     */
    getCurrentContext() {
        return {
            timeOfDay: this.getTimeOfDay(),
            weather: this.getWeather(), // Mocked for now
            activityType: this.getActivityType() // Mocked/Inferred
        };
    }

    /**
     * Determines the time of day based on current system time.
     * @returns {string} 'Morning', 'Afternoon', 'Evening', 'Night'
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 22) return 'Evening';
        return 'Night';
    }

    /**
     * Returns a mocked weather condition.
     * In a real app, this would fetch from a weather API based on location.
     * @returns {string}
     */
    getWeather() {
        // For demo purposes, we can pick a random weather or stick to one.
        // Let's make it deterministic based on hour to be less chaotic for now.
        const hour = new Date().getHours();
        if (hour % 4 === 0) return 'Rainy';
        if (hour % 3 === 0) return 'Cloudy';
        return 'Sunny';
    }

    /**
     * Returns a mocked activity type.
     * Could be inferred from movement speed (mobile sensors) in the future.
     * @returns {string} 'Stationary', 'Walking', 'Running', 'Driving'
     */
    getActivityType() {
        return 'Stationary';
    }
}

export const contextService = new ContextService();
