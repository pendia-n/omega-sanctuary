/**
 * K-Spec JavaScript SDK (Minimal Boilerplate)
 * Sovereign Agency for the Agentic Economy.
 */

export class KineticClient {
    constructor(apiKey, baseUrl = 'http://localhost:4400') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async execute(agentId, commands) {
        const res = await fetch(`${this.baseUrl}/api/execute`, {
            method: 'POST',
            headers: {
                'X-KSpec-API-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agentId, commands })
        });
        return await res.json();
    }

    async getCredits() {
        const res = await fetch(`${this.baseUrl}/api/user/credits`, {
            headers: { 'X-KSpec-API-Key': this.apiKey }
        });
        return await res.json();
    }

    async getHistory() {
        const res = await fetch(`${this.baseUrl}/api/user/history`, {
            headers: { 'X-KSpec-API-Key': this.apiKey }
        });
        return await res.json();
    }
}
