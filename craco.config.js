// craco.config.js

const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#1890ff', // Измените на желаемый цвет
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
