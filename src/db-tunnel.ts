import { createTunnel } from 'tunnel-ssh';

const sshOptions = {
  host: process.env.SSH_HOST || 'ssh.pythonanywhere.com',
  port: 22,
  username: process.env.SSH_USERNAME || 'WorldITSocialNetwork',
  password: process.env.SSH_PASSWORD || 'oL4qhR8vzO9p',
};

const tunnelOptions = {
  autoClose: false,
  reconnectOnError: true,
};

const serverOptions = {
  host: '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
};

const forwardOptions = {
  srcAddr: '127.0.0.1',
  srcPort: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  dstAddr: process.env.DB_HOST || 'WorldITSocialNetwork-5274.postgres.pythonanywhere-services.com',
  dstPort: parseInt(process.env.DB_PORT || '15274'),
};

export async function startTunnel() {
  try {
    const server = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);
    console.log(' SSH Туннель открыт!');
    console.log(` БД доступна на localhost:5433`);
    return server;
  } catch (err) {
    console.error(' Ошибка туннеля:', err);
    throw err;
  }
}