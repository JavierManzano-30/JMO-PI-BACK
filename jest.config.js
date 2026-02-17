// Configuracion de Jest para ejecutar pruebas unitarias y de integracion.
export default {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
