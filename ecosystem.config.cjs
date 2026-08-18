module.exports = {
  apps: [
    {
      name: "hug-buddy",
      script: ".output/server/index.mjs",
      cwd: "/www/wwwroot/gerar.suafontee.com/hug-buddy",
      interpreter: "/root/.nvm/versions/node/v22.23.2/bin/node",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 6328,
        NITRO_HOST: "0.0.0.0",
        NITRO_PORT: 6328,
      },
    },
  ],
};
