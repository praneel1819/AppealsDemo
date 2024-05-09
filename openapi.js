const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Node.js SSL API',
            version: '1.0.0',
            description: 'API for managing users with SSL',
        },
    },
    apis: ['./src/index.js'], // Path to your API routes
};

const specs = swaggerJsdoc(options);

module.exports = {
    swaggerUi: require('swagger-ui-express'),
    specs,
};
