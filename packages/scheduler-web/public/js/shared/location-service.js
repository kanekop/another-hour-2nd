export class LocationService {
    constructor() {
        this.defaultLocation = {
            latitude: 35.6762,
            longitude: 139.6503,
            name: 'Tokyo, Japan'
        };
        
        this.cities = {
            'Tokyo': { latitude: 35.6762, longitude: 139.6503 },
            'New York': { latitude: 40.7128, longitude: -74.0060 },
            'London': { latitude: 51.5074, longitude: -0.1278 },
            'Sydney': { latitude: -33.8688, longitude: 151.2093 },
            'Dubai': { latitude: 25.2048, longitude: 55.2708 },
            'Paris': { latitude: 48.8566, longitude: 2.3522 },
            'Los Angeles': { latitude: 34.0522, longitude: -118.2437 },
            'Singapore': { latitude: 1.3521, longitude: 103.8198 }
        };
    }

    async getCurrentLocation() {
        try {
            const position = await this.getBrowserLocation();
            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                name: 'Current Location'
            };
            
            // 逆ジオコーディング（オプション）
            location.name = await this.reverseGeocode(location);
            
            return location;
        } catch (error) {
            console.warn('位置情報の取得に失敗:', error);
            return this.defaultLocation;
        }
    }

    getBrowserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5分間キャッシュ
                }
            );
        });
    }

    async reverseGeocode(location) {
        // 実際のAPIコールの代わりに、近似的な都市名を返す
        // 本番では OpenStreetMap Nominatim API などを使用
        const distances = Object.entries(this.cities).map(([name, coords]) => {
            const dist = this.calculateDistance(
                location.latitude, location.longitude,
                coords.latitude, coords.longitude
            );
            return { name, distance: dist };
        });

        distances.sort((a, b) => a.distance - b.distance);
        
        if (distances[0].distance < 50) { // 50km以内
            return distances[0].name;
        }
        
        return `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球の半径（km）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    getCityLocation(cityName) {
        return this.cities[cityName] || this.defaultLocation;
    }
}