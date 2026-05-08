const axios = require('axios');
const crypto = require('crypto');

class VirtualPosService {
    constructor() {
        this.apiKey = process.env.VIRTUALPOS_API_KEY;
        this.secretKey = process.env.VIRTUALPOS_SECRET_KEY;
        this.baseUrl = 'https://api.virtualpos.cl/v2';
    }

    /**
     * Genera la firma Signature requerida por VirtualPos (HMAC-SHA256)
     */
    generateSignature(payload) {
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    /**
     * Crea un intento de pago y devuelve la URL de checkout
     */
    async createPayment(amount, description, clientEmail, clientName) {
        const payload = {
            amount: amount,
            description: description,
            callback_url: 'https://techboos-production-edd2.up.railway.app/api/payments/webhook',
            client_email: clientEmail,
            client_name: clientName,
            external_id: `RESCUE-${Date.now()}` // ID único para rastreo
        };

        try {
            const response = await axios.post(`${this.baseUrl}/payment`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey,
                    'X-Signature': this.generateSignature(payload) // Según estándar de integración
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error en VirtualPos CreatePayment:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Recupera el estado de un pago mediante su UUID
     */
    async getPaymentStatus(uuid) {
        try {
            const response = await axios.get(`${this.baseUrl}/payment/${uuid}`, {
                headers: {
                    'Authorization': this.apiKey
                }
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error en VirtualPos GetStatus:', error.message);
            throw error;
        }
    }
}

module.exports = new VirtualPosService();
