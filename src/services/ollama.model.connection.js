const axios = require('axios');

const ollamaModelConnection = async (model, prompt, options = {}) => {
    const {
        stream = false,
        raw = false
    } = options;

    let data = JSON.stringify({
        "model": model,
        "prompt": prompt,
        "stream": stream,
        ...(raw && { "raw": true })
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://127.0.0.1:11434/api/generate',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Error in modelConnection:', error.message);
        throw error;
    }
}



module.exports = { ollamaModelConnection };

